/**
 * Compare Versions API Route
 * POST /api/versions/compare - Compare 2-4 versions side-by-side
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { z } from 'zod';
import { getVersionById } from '@/services/version';
import type { VersionWithRelations } from '@/services/version';
import { calculateFullProjection } from '@/lib/calculations/financial/projection';
import { toDecimal } from '@/lib/calculations/decimal-helpers';
import Decimal from 'decimal.js';
import type { FullProjectionResult } from '@/lib/calculations/financial/projection';

const CompareVersionsSchema = z.object({
  versionIds: z.array(z.string().uuid()).min(2, 'Must provide at least 2 versions').max(4, 'Cannot compare more than 4 versions'),
  metrics: z.array(z.enum(['npvRent', 'avgEBITDAMargin', 'avgRentLoad', 'breakevenYear', 'totalRevenue', 'totalRent'])).optional(),
});

interface ComparisonItem {
  id: string;
  name: string;
  rentModel: string;
  npvRent: number;
  avgEBITDAMargin: number;
  avgRentLoad: number;
  breakevenYear: number | null;
  totalRevenue: number;
  totalRent: number;
}

interface BestVersions {
  npvRent?: string;
  avgEBITDAMargin?: string;
  avgRentLoad?: string;
  breakevenYear?: string;
  totalRevenue?: string;
  totalRent?: string;
}

function calculateBreakevenYear(years: FullProjectionResult['years']): number | null {
  let cumulativeCashFlow = new Decimal(0);
  
  for (const year of years) {
    cumulativeCashFlow = cumulativeCashFlow.plus(year.cashFlow);
    if (cumulativeCashFlow.isPositive()) {
      return year.year;
    }
  }
  
  return null;
}

function transformVersionToProjectionParams(version: VersionWithRelations) {
  if (!version || !version.rentPlan || version.curriculumPlans.length < 2) {
    return null;
  }

  const frPlan = version.curriculumPlans.find((cp: { curriculumType: string }) => cp.curriculumType === 'FR');
  const ibPlan = version.curriculumPlans.find((cp: { curriculumType: string }) => cp.curriculumType === 'IB');

  if (!frPlan || !ibPlan) {
    return null;
  }

  const frStudentsProjection = (
    frPlan.studentsProjection as Array<{ year: number; students: number }>
  ).map((sp) => ({ year: sp.year, students: sp.students }));

  const ibStudentsProjection = (
    ibPlan.studentsProjection as Array<{ year: number; students: number }>
  ).map((sp) => ({ year: sp.year, students: sp.students }));

  const adminSettings = {
    cpiRate: toDecimal(0.03),
    discountRate: toDecimal(0.08),
    taxRate: toDecimal(0.20),
  };

  const staffCostBase = toDecimal(15_000_000);
  const staffCostCpiFrequency: 1 | 2 | 3 = 2;

  const capexItems = version.capexItems.map((item) => ({
    year: item.year,
    amount: toDecimal(item.amount),
  }));

  const opexSubAccounts = version.opexSubAccounts.map((account) => ({
    subAccountName: account.subAccountName,
    percentOfRevenue:
      account.percentOfRevenue !== null ? toDecimal(account.percentOfRevenue) : null,
    isFixed: account.isFixed,
    fixedAmount: account.fixedAmount !== null ? toDecimal(account.fixedAmount) : null,
  }));

  return {
    curriculumPlans: [
      {
        curriculumType: 'FR' as const,
        capacity: frPlan.capacity,
        tuitionBase: toDecimal(frPlan.tuitionBase),
        cpiFrequency: frPlan.cpiFrequency as 1 | 2 | 3,
        studentsProjection: frStudentsProjection,
      },
      {
        curriculumType: 'IB' as const,
        capacity: ibPlan.capacity,
        tuitionBase: toDecimal(ibPlan.tuitionBase),
        cpiFrequency: ibPlan.cpiFrequency as 1 | 2 | 3,
        studentsProjection: ibStudentsProjection,
      },
    ],
    rentPlan: {
      rentModel: version.rentPlan.rentModel as 'FIXED_ESCALATION' | 'REVENUE_SHARE' | 'PARTNER_MODEL',
      parameters: version.rentPlan.parameters as Record<string, unknown>,
    },
    staffCostBase,
    staffCostCpiFrequency,
    capexItems,
    opexSubAccounts,
    adminSettings,
    startYear: 2023,
    endYear: 2052,
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Authentication
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Validate request body
    const body = await req.json();
    const validation = CompareVersionsSchema.safeParse(body);

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

    const { versionIds } = validation.data;

    // Fetch all versions
    const versions = await Promise.all(
      versionIds.map(async (id) => {
        const result = await getVersionById(id, session.user.id, session.user.role);
        if (!result.success || !result.data) {
          throw new Error(`Version ${id} not found`);
        }
        return result.data;
      })
    );

    // Calculate projections for each version
    const comparisons: ComparisonItem[] = [];
    const projections: FullProjectionResult[] = [];

    for (const version of versions) {
      const params = transformVersionToProjectionParams(version);
      if (!params) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid data for version: ${version.name}`,
            code: 'INVALID_VERSION_DATA',
          },
          { status: 400 }
        );
      }

      const projectionResult = calculateFullProjection(params);
      if (!projectionResult.success || !projectionResult.data) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to calculate projection for version: ${version.name}`,
            code: 'CALCULATION_ERROR',
          },
          { status: 500 }
        );
      }

      const projection = projectionResult.data;
      projections.push(projection);

      const breakevenYear = calculateBreakevenYear(projection.years);

      comparisons.push({
        id: version.id,
        name: version.name,
        rentModel: version.rentPlan?.rentModel || 'UNKNOWN',
        npvRent: projection.summary.npvRent.toNumber(),
        avgEBITDAMargin: projection.summary.avgEBITDAMargin.toNumber(),
        avgRentLoad: projection.summary.avgRentLoad.toNumber(),
        breakevenYear,
        totalRevenue: projection.summary.totalRevenue.toNumber(),
        totalRent: projection.summary.totalRent.toNumber(),
      });
    }

    // Determine best version for each metric
    const best: BestVersions = {};

    // NPV Rent (lower is better)
    const bestNpvRent = comparisons.reduce((best, current) =>
      current.npvRent < best.npvRent ? current : best
    );
    best.npvRent = bestNpvRent.name;

    // Avg EBITDA Margin (higher is better)
    const bestEBITDAMargin = comparisons.reduce((best, current) =>
      current.avgEBITDAMargin > best.avgEBITDAMargin ? current : best
    );
    best.avgEBITDAMargin = bestEBITDAMargin.name;

    // Avg Rent Load (lower is better)
    const bestRentLoad = comparisons.reduce((best, current) =>
      current.avgRentLoad < best.avgRentLoad ? current : best
    );
    best.avgRentLoad = bestRentLoad.name;

    // Breakeven Year (earlier is better, null is worst)
    const validBreakevenYears = comparisons.filter((c) => c.breakevenYear !== null);
    if (validBreakevenYears.length > 0) {
      const bestBreakeven = validBreakevenYears.reduce((best, current) => {
        if (best.breakevenYear === null) return current;
        if (current.breakevenYear === null) return best;
        return current.breakevenYear < best.breakevenYear ? current : best;
      });
      best.breakevenYear = bestBreakeven.name;
    }

    // Total Revenue (higher is better)
    const bestTotalRevenue = comparisons.reduce((best, current) =>
      current.totalRevenue > best.totalRevenue ? current : best
    );
    best.totalRevenue = bestTotalRevenue.name;

    // Total Rent (lower is better)
    const bestTotalRent = comparisons.reduce((best, current) =>
      current.totalRent < best.totalRent ? current : best
    );
    best.totalRent = bestTotalRent.name;

    return NextResponse.json(
      {
        success: true,
        data: {
          comparison: comparisons,
          best,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error comparing versions:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'VERSION_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const { handleDatabaseError } = await import('@/lib/utils/error-handler');
    const dbError = handleDatabaseError(error);
    const statusCode = !dbError.success && (dbError.code === 'DATABASE_TIMEOUT' || dbError.code === 'DATABASE_CONNECTION_ERROR')
      ? 503
      : 500;

    return NextResponse.json(
      {
        success: false,
        error: dbError.success ? 'Internal server error' : dbError.error,
        code: dbError.success ? 'INTERNAL_ERROR' : dbError.code,
      },
      { status: statusCode }
    );
  }
}

