/**
 * Report Generation API Route
 * POST /api/reports/generate/[versionId] - Generate a new report
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { GenerateReportSchema } from '@/lib/validation/report';
import { getVersionById } from '@/services/version';
import { calculateFullProjection } from '@/lib/calculations/financial/projection';
import { toDecimal } from '@/lib/calculations/decimal-helpers';
import { generateReport } from '@/services/report/generate';
import { storeReport, getReportUrl } from '@/services/report/storage';
import { logAudit } from '@/services/audit';
import { Prisma } from '@prisma/client';

interface GenerateReportParams {
  params: {
    versionId: string;
  };
}

export async function POST(
  req: NextRequest,
  { params }: GenerateReportParams
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
    const userRole = session.user.role;

    // Validate request body
    const body = await req.json();
    const validation = GenerateReportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          code: 'VALIDATION_ERROR',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { reportType, format, includeCharts, includeYearByYear, includeAssumptions, includeAuditTrail, metadata } = validation.data;

    const { versionId } = await params;

    // Fetch version data
    const versionResult = await getVersionById(versionId, userId, userRole);

    if (!versionResult.success) {
      return NextResponse.json(
        { success: false, error: 'Version not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const version = versionResult.data;

    // Calculate full projection
    const projectionParams = {
      curriculumPlans: version.curriculumPlans.map((cp) => ({
        curriculumType: cp.curriculumType as 'FR' | 'IB',
        capacity: cp.capacity,
        tuitionBase: toDecimal(cp.tuitionBase),
        cpiFrequency: cp.cpiFrequency as 1 | 2 | 3,
        studentsProjection: cp.studentsProjection as Array<{
          year: number;
          students: number;
        }>,
      })),
      rentPlan: {
        rentModel: version.rentPlan!.rentModel as 'FIXED_ESCALATION' | 'REVENUE_SHARE' | 'PARTNER_MODEL',
        parameters: version.rentPlan!.parameters as Record<string, unknown>,
      },
      staffCostBase: toDecimal(15_000_000), // TODO: Get from admin settings
      staffCostCpiFrequency: 2 as const,
      capexItems: version.capexItems.map((item) => ({
        year: item.year,
        amount: toDecimal(item.amount),
      })),
      opexSubAccounts: version.opexSubAccounts.map((account) => ({
        subAccountName: account.subAccountName,
        percentOfRevenue: account.percentOfRevenue !== null ? toDecimal(account.percentOfRevenue) : null,
        isFixed: account.isFixed,
        fixedAmount: account.fixedAmount !== null ? toDecimal(account.fixedAmount) : null,
      })),
      adminSettings: {
        cpiRate: toDecimal(0.03), // TODO: Get from admin settings
        discountRate: toDecimal(0.08),
        taxRate: toDecimal(0.20),
      },
      startYear: 2023,
      endYear: 2052,
    };

    const projectionResult = calculateFullProjection(projectionParams);

    if (!projectionResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to calculate projection', code: 'CALCULATION_ERROR' },
        { status: 500 }
      );
    }

    // Generate report file
    const reportGenerationResult = await generateReport({
      version,
      projection: projectionResult.data,
      reportType,
      format,
      options: {
        includeCharts,
        includeYearByYear,
        includeAssumptions,
        includeAuditTrail,
      },
    });

    if (!reportGenerationResult.success) {
      return NextResponse.json(
        { success: false, error: reportGenerationResult.error, code: 'GENERATION_ERROR' },
        { status: 500 }
      );
    }

    const { file, fileName } = reportGenerationResult.data;

    // Store file
    const { filePath, fileSize } = await storeReport(file, fileName);

    // Create expiration date (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create report record
    const report = await prisma.report.create({
      data: {
        versionId,
        reportType,
        format,
        fileName,
        filePath,
        fileSize,
        downloadUrl: getReportUrl('temp', fileName), // Will be updated after creation
        expiresAt,
        generatedBy: userId,
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });

    // Update download URL with actual report ID
    const downloadUrl = getReportUrl(report.id, fileName);
    await prisma.report.update({
      where: { id: report.id },
      data: { downloadUrl },
    });

    // Audit log
    await logAudit({
      action: 'GENERATE_REPORT',
      userId,
      entityType: 'REPORT',
      entityId: report.id,
      metadata: {
        versionId,
        reportType,
        format,
        fileName,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          reportId: report.id,
          downloadUrl,
          expiresAt: report.expiresAt.toISOString(),
          generatedAt: report.generatedAt.toISOString(),
          fileSize: report.fileSize,
          message: 'Report generated successfully',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

