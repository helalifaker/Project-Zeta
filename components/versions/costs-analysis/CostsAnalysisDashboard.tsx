/**
 * Costs Analysis Dashboard Component
 * Main dashboard component that integrates KPI metrics, rent analysis, cost breakdown, and insights
 * 
 * This component orchestrates all costs analysis features:
 * - KPI Metrics Grid (top)
 * - Rent Model Analysis
 * - Cost Analysis
 * - Insights Panel
 */

'use client';

import { useMemo } from 'react';
import Decimal from 'decimal.js';
import { KPIMetricsGrid } from './KPIMetricsGrid';
import { RentLens } from './RentLens';
import { CostBreakdown } from './CostBreakdown';
import type { VersionWithRelations } from '@/services/version/create';
import type { AdminSettings } from '@/lib/calculations/financial/projection';
import { calculateFullProjection, type FullProjectionParams } from '@/lib/calculations/financial/projection';
import { calculateNPV, type NPVParams } from '@/lib/calculations/financial/npv';
import { calculateRent, type RentCalculationParams } from '@/lib/calculations/rent';
import { calculateRevenue, type RevenueParams } from '@/lib/calculations/revenue/revenue';
import { calculateTuitionGrowth, type TuitionGrowthParams } from '@/lib/calculations/revenue/tuition-growth';
import { calculateStaffCostBaseFromCurriculum } from '@/lib/calculations/financial/staff-costs';
import { toDecimal } from '@/lib/calculations/decimal-helpers';

/**
 * Constants
 */
const NPV_START_YEAR = 2028;
const NPV_END_YEAR = 2052;
const PERFORMANCE_TARGET_MS = 50;

/**
 * Props for CostsAnalysisDashboard component
 */
export interface CostsAnalysisDashboardProps {
  /** Version data with all relationships */
  version: VersionWithRelations;
  /** Admin settings (CPI rate, discount rate, tax rate) */
  adminSettings: AdminSettings | null;
  /** Callback to start editing rent plan */
  onRentEditStart?: () => void;
  /** Callback to save rent plan changes */
  onRentSave?: (rentModel: string, parameters: Record<string, unknown>) => void;
  /** Callback to cancel rent plan editing */
  onRentCancel?: () => void;
  /** Whether rent plan is currently being edited */
  editingRentPlan?: boolean;
  /** Whether save operation is in progress */
  saving?: boolean;
}

/**
 * Extract year and rent from rent projection result
 */
function extractYearAndRent(
  item: unknown
): { year: number; rent: Decimal } | null {
  if (
    typeof item === 'object' &&
    item !== null &&
    'year' in item &&
    'rent' in item &&
    typeof (item as { year: unknown }).year === 'number'
  ) {
    return {
      year: (item as { year: number }).year,
      rent: toDecimal((item as { rent: unknown }).rent),
    };
  }
  return null;
}

/**
 * Costs Analysis Dashboard component
 * 
 * Displays comprehensive costs analysis with:
 * - KPI metrics at the top
 * - Rent model analysis
 * - Cost breakdown
 * - Insights panel (to be added in Phase 5)
 * 
 * @param props - CostsAnalysisDashboardProps
 * @returns JSX.Element - Complete costs analysis dashboard
 * 
 * @example
 * ```tsx
 * <CostsAnalysisDashboard
 *   version={version}
 *   adminSettings={adminSettings}
 *   onRentEditStart={handleRentEditStart}
 *   onRentSave={handleRentSave}
 *   onRentCancel={handleRentCancel}
 *   editingRentPlan={editingRentPlan}
 *   saving={saving}
 * />
 * ```
 */
export function CostsAnalysisDashboard({
  version,
  adminSettings,
  onRentEditStart,
  onRentSave,
  onRentCancel,
  editingRentPlan = false,
  saving = false,
}: CostsAnalysisDashboardProps): JSX.Element {
  // Calculate full projection for KPI metrics
  const fullProjection = useMemo(() => {
    if (!adminSettings || !version.curriculumPlans || version.curriculumPlans.length === 0) {
      return null;
    }

    const calcStart = performance.now();
    try {
      // Calculate staff cost base
      // Use 2028 as base year (relocation year) for staff cost calculations
      const staffCostBaseResult = calculateStaffCostBaseFromCurriculum(
        version.curriculumPlans.map((plan) => ({
          curriculumType: plan.curriculumType as 'FR' | 'IB',
          studentsProjection: (plan.studentsProjection as Array<{ year: number; students: number }>) || [],
          teacherRatio: plan.teacherRatio ? toDecimal(plan.teacherRatio) : null,
          nonTeacherRatio: plan.nonTeacherRatio ? toDecimal(plan.nonTeacherRatio) : null,
          teacherMonthlySalary: plan.teacherMonthlySalary ? toDecimal(plan.teacherMonthlySalary) : null,
          nonTeacherMonthlySalary: plan.nonTeacherMonthlySalary ? toDecimal(plan.nonTeacherMonthlySalary) : null,
        })),
        2028 // Base year: relocation year
      );

      if (!staffCostBaseResult.success) {
        console.error('Failed to calculate staff cost base:', staffCostBaseResult.error);
        return null;
      }

      // Prepare full projection params
      const params: FullProjectionParams = {
        curriculumPlans: version.curriculumPlans.map((plan) => ({
          curriculumType: plan.curriculumType as 'FR' | 'IB',
          capacity: plan.capacity,
          tuitionBase: plan.tuitionBase || 0,
          cpiFrequency: plan.cpiFrequency as 1 | 2 | 3,
          studentsProjection: (plan.studentsProjection as Array<{ year: number; students: number }>) || [],
        })),
        rentPlan: version.rentPlan
          ? {
              rentModel: version.rentPlan.rentModel as 'FIXED_ESCALATION' | 'REVENUE_SHARE' | 'PARTNER_MODEL',
              parameters: version.rentPlan.parameters as Record<string, unknown>,
            }
          : {
              rentModel: 'FIXED_ESCALATION',
              parameters: { baseRent: 0, escalationRate: 0, frequency: 1, startYear: 2028 },
            },
        staffCostBase: staffCostBaseResult.data,
        staffCostCpiFrequency: 2, // Default to 2 years
        capexItems: (version.capexItems || []).map((item) => ({
          year: item.year,
          amount: toDecimal(item.amount),
        })),
        opexSubAccounts: (version.opexSubAccounts || []).map((account) => ({
          subAccountName: account.subAccountName,
          percentOfRevenue: account.percentOfRevenue ? toDecimal(account.percentOfRevenue) : null,
          isFixed: account.isFixed,
          fixedAmount: account.fixedAmount ? toDecimal(account.fixedAmount) : null,
        })),
        adminSettings: {
          cpiRate: toDecimal(adminSettings.cpiRate),
          discountRate: toDecimal(adminSettings.discountRate),
          taxRate: toDecimal(adminSettings.taxRate),
        },
        startYear: 2023,
        endYear: 2052,
      };

      // ⚠️ TODO (Fix 1): calculateFullProjection is now async - convert this useMemo to useEffect + useState
      // TODO: Convert to useEffect + useState pattern (see FinancialStatementsWrapper.tsx for example)
      // TODO: Add otherRevenueByYear parameter when converting to async pattern
      // @ts-expect-error - useMemo cannot await async functions, will be fixed in future update
      const result = calculateFullProjection(params);
      const calcDuration = performance.now() - calcStart;
      
      if (calcDuration > PERFORMANCE_TARGET_MS) {
        console.warn(`⚠️ Full projection calculation took ${calcDuration.toFixed(2)}ms (target: <${PERFORMANCE_TARGET_MS}ms)`);
      }

      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error calculating full projection:', error);
      return null;
    }
  }, [version, adminSettings]);

  // Calculate KPI metrics from projection
  const kpiMetrics = useMemo(() => {
    if (!fullProjection || !version.rentPlan || !adminSettings) {
      return {
        rentNPV: null,
        avgRentLoad: null,
        year1Rent: null,
        avgCostPerStudent: null,
      };
    }

    // Calculate rent projection for NPV
    let rentNPV: Decimal | null = null;
    let year1Rent: Decimal | null = null;
    let avgRentLoad: Decimal | null = null;

    try {
      // Calculate revenue projection for rent calculation
      const revenueProjection: Array<{ year: number; revenue: Decimal }> = [];
      
      for (const plan of version.curriculumPlans || []) {
        if (!plan.tuitionBase) continue;
        
        const tuitionParams: TuitionGrowthParams = {
          tuitionBase: toDecimal(plan.tuitionBase),
          cpiRate: toDecimal(adminSettings.cpiRate),
          cpiFrequency: plan.cpiFrequency as 1 | 2 | 3,
          baseYear: 2023,
          startYear: 2023,
          endYear: 2052,
        };

        const tuitionResult = calculateTuitionGrowth(tuitionParams);
        if (!tuitionResult.success) continue;

        const studentsProjection = (plan.studentsProjection as Array<{ year: number; students: number }>) || [];
        const revenueParams: RevenueParams = {
          tuitionByYear: tuitionResult.data,
          studentsByYear: studentsProjection,
        };

        const revenueResult = calculateRevenue(revenueParams);
        if (!revenueResult.success) continue;

        for (const rev of revenueResult.data) {
          const existing = revenueProjection.find((r) => r.year === rev.year);
          if (existing) {
            existing.revenue = existing.revenue.plus(rev.revenue);
          } else {
            revenueProjection.push({ year: rev.year, revenue: rev.revenue });
          }
        }
      }

      // Calculate rent projection
      const rentModel = version.rentPlan.rentModel as 'FIXED_ESCALATION' | 'REVENUE_SHARE' | 'PARTNER_MODEL';
      const parameters = version.rentPlan.parameters as Record<string, unknown>;

      let rentParams: RentCalculationParams;

      if (rentModel === 'REVENUE_SHARE') {
        rentParams = {
          model: 'REVENUE_SHARE',
          revenueByYear: revenueProjection.map((r) => ({
            year: r.year,
            revenue: r.revenue,
          })),
          revenueSharePercent: parameters.revenueSharePercent as number,
        };
      } else if (rentModel === 'FIXED_ESCALATION') {
        rentParams = {
          model: 'FIXED_ESCALATION',
          baseRent: parameters.baseRent as number,
          escalationRate: parameters.escalationRate as number,
          frequency: (parameters.frequency as number) ?? 1,
          startYear: (parameters.startYear as number) ?? 2028,
          endYear: 2052,
        };
      } else {
        rentParams = {
          model: 'PARTNER_MODEL',
          landSize: parameters.landSize as number,
          landPricePerSqm: parameters.landPricePerSqm as number,
          buaSize: parameters.buaSize as number,
          constructionCostPerSqm: parameters.constructionCostPerSqm as number,
          yieldBase: parameters.yieldBase as number,
          growthRate: parameters.growthRate as number | undefined,
          frequency: (parameters.frequency as number) ?? 1,
          startYear: (parameters.startYear as number) ?? 2028,
          endYear: 2052,
        };
      }

      const rentResult = calculateRent(rentParams);
      if (rentResult.success) {
        const rentProjection = rentResult.data
          .map((r) => extractYearAndRent(r))
          .filter((item): item is { year: number; rent: Decimal } => item !== null);

        // Calculate NPV
        const amountsByYear = rentProjection
          .filter((item) => item.year >= NPV_START_YEAR && item.year <= NPV_END_YEAR)
          .map((item) => ({
            year: item.year,
            amount: item.rent,
          }));

        if (amountsByYear.length > 0) {
          const npvParams: NPVParams = {
            amountsByYear,
            discountRate: toDecimal(adminSettings.discountRate),
            startYear: NPV_START_YEAR,
            endYear: NPV_END_YEAR,
            baseYear: 2027,
          };

          const npvResult = calculateNPV(npvParams);
          if (npvResult.success) {
            rentNPV = npvResult.data.npv;
          }
        }

        // Get Year 1 rent (2028)
        const year2028 = rentProjection.find((r) => r.year === NPV_START_YEAR);
        year1Rent = year2028?.rent || null;

        // Calculate average rent load
        const npvPeriod = fullProjection.years.filter((y) => y.year >= NPV_START_YEAR && y.year <= NPV_END_YEAR);
        if (npvPeriod.length > 0) {
          avgRentLoad = npvPeriod.reduce((sum, year) => sum.plus(year.rentLoad), new Decimal(0)).div(npvPeriod.length);
        }
      }
    } catch (error) {
      console.error('Error calculating rent metrics:', error);
    }

    // Calculate average cost per student
    // Method: Calculate cost per student for each year, then average those values
    // This gives the true average cost per student across the period
    const npvPeriod = fullProjection.years.filter((y) => y.year >= NPV_START_YEAR && y.year <= NPV_END_YEAR);
    let avgCostPerStudent: Decimal | null = null;

    if (npvPeriod.length > 0) {
      const costPerStudentByYear: Decimal[] = [];
      
      for (const year of npvPeriod) {
        const totalCost = year.rent.plus(year.staffCost).plus(year.opex);
        const totalStudents = (year.studentsFR || 0) + (year.studentsIB || 0);
        
        if (totalStudents > 0) {
          costPerStudentByYear.push(totalCost.div(totalStudents));
        }
      }
      
      if (costPerStudentByYear.length > 0) {
        const sum = costPerStudentByYear.reduce((acc, val) => acc.plus(val), new Decimal(0));
        avgCostPerStudent = sum.div(costPerStudentByYear.length);
      }
    }

    return {
      rentNPV,
      avgRentLoad,
      year1Rent,
      avgCostPerStudent,
    };
  }, [fullProjection, version, adminSettings]);

  // Handle missing data
  if (!adminSettings) {
    return (
      <div className="space-y-6">
        <div className="p-6 border rounded-lg bg-muted/30">
          <p className="text-sm text-muted-foreground">Loading admin settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Metrics Grid */}
      <KPIMetricsGrid
        projection={fullProjection}
        rentNPV={kpiMetrics.rentNPV}
        avgRentLoad={kpiMetrics.avgRentLoad}
        year1Rent={kpiMetrics.year1Rent}
        avgCostPerStudent={kpiMetrics.avgCostPerStudent}
      />

      {/* Rent Model Analysis */}
      <RentLens
        rentPlan={version.rentPlan}
        curriculumPlans={version.curriculumPlans}
        adminSettings={adminSettings}
        onEditStart={onRentEditStart}
        onSave={onRentSave}
        onCancel={onRentCancel}
        isEditing={editingRentPlan}
        saving={saving}
      />

      {/* Cost Breakdown */}
      <CostBreakdown
        version={version}
        adminSettings={adminSettings}
      />

      {/* Insights Panel - To be added in Phase 5 */}
    </div>
  );
}

