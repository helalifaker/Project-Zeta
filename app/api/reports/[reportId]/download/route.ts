/**
 * Report Download API Route
 * GET /api/reports/[reportId]/download - Download a report
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { readReportFile } from '@/services/report/storage';
import { logAudit } from '@/services/audit';

interface DownloadReportParams {
  params: {
    reportId: string;
  };
}

export async function GET(
  _req: NextRequest,
  { params }: DownloadReportParams
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

    // Check if expired
    if (new Date() > report.expiresAt) {
      return NextResponse.json(
        { success: false, error: 'Report has expired', code: 'EXPIRED' },
        { status: 410 }
      );
    }

    // Check access (owner or ADMIN)
    if (report.generatedBy !== userId && userRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Read file
    const fileBuffer = await readReportFile(report.filePath);

    // Audit log
    await logAudit({
      action: 'DOWNLOAD_REPORT',
      userId,
      entityType: 'REPORT',
      entityId: report.id,
      metadata: {
        fileName: report.fileName,
        reportType: report.reportType,
        format: report.format,
      },
    });

    // Determine content type
    const contentType =
      report.format === 'PDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    // Return file
    return new NextResponse(fileBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${report.fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading report:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

