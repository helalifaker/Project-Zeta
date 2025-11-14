/**
 * Reports API Route
 * GET /api/reports - List reports
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { Prisma, type ReportType, type ReportFormat } from '@prisma/client';
import { ListReportsSchema } from '@/lib/validation/report';
import { getCacheHeaders } from '@/lib/cache/revalidate';

export async function GET(req: NextRequest): Promise<NextResponse> {
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

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      versionId: searchParams.get('versionId') || undefined,
      reportType: searchParams.get('reportType') || undefined,
      format: searchParams.get('format') || undefined,
    };

    const validation = ListReportsSchema.safeParse(query);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { page, limit, versionId, reportType, format } = validation.data;

    // Build where clause
    const where: Prisma.ReportWhereInput = {
      deletedAt: null, // Only non-deleted reports
    };

    // Filter by user (unless ADMIN, who can see all)
    if (userRole !== 'ADMIN') {
      where.generatedBy = userId;
    }

    if (versionId) {
      where.versionId = versionId;
    }

    if (reportType) {
      where.reportType = reportType as ReportType;
    }

    if (format) {
      where.format = format as ReportFormat;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch reports
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { generatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          version: {
            select: {
              id: true,
              name: true,
            },
          },
          generator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    // Add cache headers for GET requests (cache for 60 seconds)
    const headers = {
      'Cache-Control': getCacheHeaders(60, 300),
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          reports,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      },
      { headers }
    );
  } catch (error) {
    console.error('Error listing reports:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

