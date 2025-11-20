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
import { getAdminSettings } from '@/services/admin/settings';
import { calculateStaffCostBaseFromCurriculum } from '@/lib/calculations/financial/staff-costs';

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

    const { reportType, format, includeCharts, includeYearByYear, includeAssumptions, includeAuditTrail, compareWithIds, metadata } = validation.data;

    const { versionId } = await params;

    // Validate comparison report requirements
    if (reportType === 'COMPARISON') {
      if (!compareWithIds || compareWithIds.length === 0 || compareWithIds.length > 3) {
        return NextResponse.json(
          { success: false, error: 'Comparison reports require 1-3 comparison version IDs', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
    }

    // Fetch version data
    const versionResult = await getVersionById(versionId, userId, userRole);

    if (!versionResult.success) {
      return NextResponse.json(
        { success: false, error: 'Version not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const version = versionResult.data;

    // Validate version data
    if (!version.rentPlan) {
      return NextResponse.json(
        { success: false, error: 'Version must have a rent plan', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!version.curriculumPlans || version.curriculumPlans.length < 1) {
      return NextResponse.json(
        { success: false, error: 'Version must have at least 1 curriculum plan (FR)', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Verify FR exists
    const frPlan = version.curriculumPlans.find(cp => cp.curriculumType === 'FR');
    if (!frPlan) {
      return NextResponse.json(
        { success: false, error: 'FR curriculum plan is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Fetch admin settings
    const adminSettingsResult = await getAdminSettings();
    if (!adminSettingsResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch admin settings', code: 'SETTINGS_ERROR' },
        { status: 500 }
      );
    }

    const adminSettings = {
      cpiRate: toDecimal(adminSettingsResult.data.cpiRate),
      discountRate: toDecimal(adminSettingsResult.data.discountRate),
      zakatRate: toDecimal(adminSettingsResult.data.zakatRate ?? 0.025), // ✅ Saudi Arabian Zakat rate (2.5%)
    };

    // Calculate staff cost base from curriculum plans
    const curriculumPlansForStaffCost = version.curriculumPlans.map((cp) => ({
      curriculumType: cp.curriculumType as 'FR' | 'IB',
      studentsProjection: cp.studentsProjection as Array<{ year: number; students: number }>,
      teacherRatio: cp.teacherRatio,
      nonTeacherRatio: cp.nonTeacherRatio,
      teacherMonthlySalary: cp.teacherMonthlySalary,
      nonTeacherMonthlySalary: cp.nonTeacherMonthlySalary,
    }));

    const staffCostBaseResult = calculateStaffCostBaseFromCurriculum(curriculumPlansForStaffCost, 2028);
    if (!staffCostBaseResult.success) {
      return NextResponse.json(
        { success: false, error: staffCostBaseResult.error, code: 'STAFF_COST_ERROR' },
        { status: 500 }
      );
    }

    // Get staff cost CPI frequency from admin settings (default: 2)
    // Note: This may need to be added to admin settings if not already present
    const staffCostCpiFrequency = 2 as 1 | 2 | 3; // TODO: Get from admin settings if available

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
        rentModel: version.rentPlan.rentModel as 'FIXED_ESCALATION' | 'REVENUE_SHARE' | 'PARTNER_MODEL',
        parameters: version.rentPlan.parameters as Record<string, unknown>,
      },
      staffCostBase: staffCostBaseResult.data,
      staffCostCpiFrequency,
      capexItems: version.capexItems.map((item) => ({
        year: item.year,
        amount: toDecimal(item.amount),
      })),
      opexSubAccounts: version.opexSubAccounts.map((account) => ({
        subAccountName: account.subAccountName,
        // Convert percentage to decimal (48% -> 0.48)
        percentOfRevenue: account.percentOfRevenue !== null 
          ? toDecimal(account.percentOfRevenue).div(100)
          : null,
        isFixed: account.isFixed,
        fixedAmount: account.fixedAmount !== null ? toDecimal(account.fixedAmount) : null,
      })),
      adminSettings,
      startYear: 2023,
      endYear: 2052,
    };

    const projectionResult = calculateFullProjection(projectionParams);

    if (!projectionResult.success) {
      // Log the actual error for debugging
      console.error('Failed to calculate projection:', {
        error: projectionResult.error,
        versionId: version.id,
        versionName: version.name,
        hasRentPlan: !!version.rentPlan,
        hasCurriculumPlans: version.curriculumPlans?.length > 0,
        curriculumPlansCount: version.curriculumPlans?.length,
        hasOpexSubAccounts: version.opexSubAccounts?.length > 0,
        hasCapexItems: version.capexItems?.length > 0,
      });
      
      // Return the actual error message to help with debugging
      const errorMessage = projectionResult.error || 'Failed to calculate projection';
      return NextResponse.json(
        { success: false, error: errorMessage, code: 'CALCULATION_ERROR' },
        { status: 500 }
      );
    }

    // Handle comparison reports: fetch and calculate projections for comparison versions
    let compareVersions: typeof version[] = [];
    let compareProjections: typeof projectionResult.data[] = [];

    if (reportType === 'COMPARISON' && compareWithIds && compareWithIds.length > 0) {
      // Fetch all comparison versions in parallel
      const compareVersionResults = await Promise.all(
        compareWithIds.map((id) => getVersionById(id, userId, userRole))
      );

      // Validate all comparison versions were fetched successfully
      const failedVersions = compareVersionResults.filter((result) => !result.success);
      if (failedVersions.length > 0) {
        return NextResponse.json(
          { success: false, error: 'One or more comparison versions not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      compareVersions = compareVersionResults.map((result) => result.data);

      // Validate all comparison versions have required data
      for (const compareVersion of compareVersions) {
        if (!compareVersion.rentPlan) {
          return NextResponse.json(
            { success: false, error: `Comparison version ${compareVersion.id} must have a rent plan`, code: 'VALIDATION_ERROR' },
            { status: 400 }
          );
        }

        if (!compareVersion.curriculumPlans || compareVersion.curriculumPlans.length < 1) {
          return NextResponse.json(
            { success: false, error: `Comparison version ${compareVersion.id} must have at least 1 curriculum plan (FR)`, code: 'VALIDATION_ERROR' },
            { status: 400 }
          );
        }
      }

      // Calculate projections for all comparison versions
      try {
        const compareProjectionResults = await Promise.all(
          compareVersions.map(async (compareVersion) => {
            // Calculate staff cost base for comparison version
            const compareCurriculumPlansForStaffCost = compareVersion.curriculumPlans.map((cp) => ({
              curriculumType: cp.curriculumType as 'FR' | 'IB',
              studentsProjection: cp.studentsProjection as Array<{ year: number; students: number }>,
              teacherRatio: cp.teacherRatio,
              nonTeacherRatio: cp.nonTeacherRatio,
              teacherMonthlySalary: cp.teacherMonthlySalary,
              nonTeacherMonthlySalary: cp.nonTeacherMonthlySalary,
            }));

            const compareStaffCostBaseResult = calculateStaffCostBaseFromCurriculum(compareCurriculumPlansForStaffCost, 2028);
            if (!compareStaffCostBaseResult.success) {
              return {
                success: false as const,
                error: `Failed to calculate staff cost for comparison version ${compareVersion.id}: ${compareStaffCostBaseResult.error}`,
                versionId: compareVersion.id,
              };
            }

            // Calculate projection for comparison version
            const compareProjectionParams = {
              curriculumPlans: compareVersion.curriculumPlans.map((cp) => ({
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
                rentModel: compareVersion.rentPlan!.rentModel as 'FIXED_ESCALATION' | 'REVENUE_SHARE' | 'PARTNER_MODEL',
                parameters: compareVersion.rentPlan!.parameters as Record<string, unknown>,
              },
              staffCostBase: compareStaffCostBaseResult.data,
              staffCostCpiFrequency,
              capexItems: compareVersion.capexItems.map((item) => ({
                year: item.year,
                amount: toDecimal(item.amount),
              })),
              opexSubAccounts: compareVersion.opexSubAccounts.map((account) => ({
                subAccountName: account.subAccountName,
                // Convert percentage to decimal (48% -> 0.48)
                percentOfRevenue: account.percentOfRevenue !== null 
                  ? toDecimal(account.percentOfRevenue).div(100)
                  : null,
                isFixed: account.isFixed,
                fixedAmount: account.fixedAmount !== null ? toDecimal(account.fixedAmount) : null,
              })),
              adminSettings,
              startYear: 2023,
              endYear: 2052,
            };

            const compareProjectionResult = calculateFullProjection(compareProjectionParams);
            if (!compareProjectionResult.success) {
              return {
                success: false as const,
                error: `Failed to calculate projection for comparison version ${compareVersion.id}: ${compareProjectionResult.error}`,
                versionId: compareVersion.id,
              };
            }

            return {
              success: true as const,
              data: compareProjectionResult.data,
            };
          })
        );

        // Check for any failed projections
        const failedProjections = compareProjectionResults.filter((result) => !result.success);
        if (failedProjections.length > 0) {
          const firstFailure = failedProjections[0];
          if (!firstFailure.success) {
            return NextResponse.json(
              { success: false, error: firstFailure.error, code: 'CALCULATION_ERROR' },
              { status: 500 }
            );
          }
        }

        // All projections succeeded, extract data
        compareProjections = compareProjectionResults
          .filter((result): result is { success: true; data: typeof projectionResult.data } => result.success)
          .map((result) => result.data);
      } catch (error) {
        console.error('Error calculating comparison projections:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to calculate comparison projections', code: 'CALCULATION_ERROR' },
          { status: 500 }
        );
      }
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
      compareVersions: compareVersions.length > 0 ? compareVersions : undefined,
      compareProjections: compareProjections.length > 0 ? compareProjections : undefined,
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

    // Create expiration date (30 days from now per PRD)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create report record
    const report = await prisma.reports.create({
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
    await prisma.reports.update({
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
    
    // Ensure error message is a string
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : 'Internal server error';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        code: 'INTERNAL_ERROR' 
      },
      { status: 500 }
    );
  }
}

