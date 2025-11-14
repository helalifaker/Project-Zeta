/**
 * Report API Route
 * DELETE /api/reports/[reportId] - Delete a report
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { deleteReport } from '@/services/report/storage';
import { logAudit } from '@/services/audit';

interface DeleteReportParams {
  params: {
    reportId: string;
  };
}

export async function DELETE(
  _req: NextRequest,
  { params }: DeleteReportParams
): Promise<NextResponse> {
  try {
    // Authentication
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = (session.user as { role?: string }).role;

    const { reportId } = await params;

    // Fetch report
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check access (owner or ADMIN)
    if (report.generatedBy !== userId && userRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Soft delete (set deletedAt)
    await prisma.report.update({
      where: { id: reportId },
      data: {
        deletedAt: new Date(),
      },
    });

    // Delete file from storage
    await deleteReport(report.filePath);

    // Audit log
    await logAudit({
      action: 'DELETE_REPORT',
      userId,
      entityType: 'REPORT',
      entityId: report.id,
      metadata: {
        fileName: report.fileName,
        reportType: report.reportType,
        format: report.format,
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Report deleted successfully' },
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

