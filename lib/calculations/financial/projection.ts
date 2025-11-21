/**
 * Full Financial Projection Engine
 * Orchestrates all calculation modules to produce a complete 30-year financial projection
 *
 * Calculation Pipeline:
 * 1. Tuition Growth (CPI-based) → FR + IB curricula
 * 2. Revenue Calculation (tuition × students) → FR + IB, then sum
 * 3. Rent Calculation (based on rent model) → may depend on revenue for RevenueShare
 * 4. Staff Costs (with CPI growth) → 30 years
 * 5. Opex Calculation (% of revenue + fixed) → 30 years
 * 6. EBITDA Calculation (Revenue - Staff Costs - Rent - Opex) → 30 years
 * 7. Cash Flow Calculation (EBITDA - Capex - Interest - Taxes) → 30 years
 * 8. NPV Calculation for Rent (2028-2052, 25 years)
 * 9. NPV Calculation for Cash Flow (2028-2052, 25 years)
 * 10. Summary metrics (totals, averages)
 */

import Decimal from 'decimal.js';
import { toDecimal, safeDivide } from '../decimal-helpers';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';
import { getPeriodForYear, isHistoricalYear } from '@/lib/utils/period-detection';
import { PrismaClient } from '@prisma/client';

// Import calculation modules
import { calculateTuitionGrowth, type TuitionGrowthParams } from '../revenue/tuition-growth';
import { calculateRevenue, type RevenueParams } from '../revenue/revenue';
import { calculateRent, type RentCalculationParams } from '../rent';
import { calculateStaffCosts, type StaffCostParams } from './staff-costs';
import { calculateOpex, type OpexParams } from './opex';
import { calculateEBITDA, type EBITDAParams } from './ebitda';
import { calculateNPV, type NPVParams } from './npv';
import { CircularSolver, type SolverParams } from './circular-solver';
import {
  getTransitionPeriodData,
  getAllTransitionPeriodData,
  isTransitionDataAvailable,
  getStaffCostBase2024,
  getRentBase2024,
  type TransitionPeriodData,
} from './transition-helpers';

// Initialize Prisma client for historical actuals fetching
const prisma = new PrismaClient();

export interface AdminSettings {
  cpiRate: Decimal | number | string;
  discountRate: Decimal | number | string;
  zakatRate: Decimal | number | string; // Zakat rate (2.5% default for Saudi Arabia)
}

export interface CurriculumPlanInput {
  curriculumType: 'FR' | 'IB';
  capacity: number;
  tuitionBase: Decimal | number | string;
  cpiFrequency: 1 | 2 | 3;
  studentsProjection: Array<{ year: number; students: number }>;
}

export interface RentPlanInput {
  rentModel: 'FIXED_ESCALATION' | 'REVENUE_SHARE' | 'PARTNER_MODEL';
  parameters: Record<string, unknown>; // Model-specific parameters
}

export interface FullProjectionParams {
  curriculumPlans: CurriculumPlanInput[];
  rentPlan: RentPlanInput;
  staffCostBase: Decimal | number | string;
  staffCostCpiFrequency: 1 | 2 | 3;
  capexItems: Array<{ year: number; amount: Decimal | number | string }>;
  opexSubAccounts: Array<{
    subAccountName: string;
    percentOfRevenue: Decimal | number | string | null;
    isFixed: boolean;
    fixedAmount: Decimal | number | string | null;
  }>;
  adminSettings: AdminSettings;
  startYear?: number; // Default: 2023
  endYear?: number; // Default: 2052
  // Other Revenue (optional - can be provided directly or fetched if versionId provided)
  otherRevenueByYear?: Array<{ year: number; amount: Decimal | number | string }>;
  versionId?: string; // If provided, will fetch Other Revenue if otherRevenueByYear not provided
  versionMode?: 'RELOCATION_2028' | 'HISTORICAL_BASELINE'; // Version mode (default: RELOCATION_2028)

  // Balance Sheet Settings (optional - will be fetched if versionId provided)
  balanceSheetSettings?: {
    startingCash: Decimal | number | string;
    openingEquity: Decimal | number | string;
  };

  // Depreciation Rate (optional - default: 0.10 = 10%)
  depreciationRate?: Decimal | number | string;

  // Planning Periods Support
  transitionCapacity?: number; // Student capacity cap for transition period (2025-2027), default: 1850

  // Historical Actuals (optional - pre-fetched for client-side calls)
  historicalActuals?: Array<{
    year: number;
    revenue: Decimal | number | string;
    staffCost: Decimal | number | string;
    rent: Decimal | number | string;
    opex: Decimal | number | string;
    capex: Decimal | number | string;
  }>;
}

export interface YearlyProjection {
  year: number;
  // Tuition (per curriculum)
  tuitionFR?: Decimal;
  tuitionIB?: Decimal;
  // Enrollment (per curriculum)
  studentsFR?: number;
  studentsIB?: number;
  // Financials
  revenue: Decimal;
  staffCost: Decimal; // Legacy field name (singular)
  staffCosts?: Decimal; // Alias for staffCost (plural) for compatibility with PnLStatement
  rent: Decimal;
  opex: Decimal;
  ebitda: Decimal;
  ebitdaMargin: Decimal;
  capex: Decimal;
  interest: Decimal; // Deprecated: use interestExpense
  taxes: Decimal; // Deprecated: use zakat
  cashFlow: Decimal; // Deprecated: use netCashFlow
  // Metrics
  rentLoad: Decimal; // (Rent / Revenue) × 100

  // ✅ ADD: Fields from CircularSolver (make optional to avoid breaking existing code)
  depreciation?: Decimal;
  interestExpense?: Decimal;
  interestIncome?: Decimal;
  zakat?: Decimal;
  netResult?: Decimal; // Net Income
  workingCapitalChange?: Decimal;
  operatingCashFlow?: Decimal;
  investingCashFlow?: Decimal;
  financingCashFlow?: Decimal;
  netCashFlow?: Decimal;

  // Balance Sheet - Assets (from CircularSolver)
  cash?: Decimal;
  accountsReceivable?: Decimal;
  fixedAssets?: Decimal;
  totalAssets?: Decimal;

  // Balance Sheet - Liabilities (from CircularSolver)
  accountsPayable?: Decimal;
  deferredIncome?: Decimal;
  accruedExpenses?: Decimal;
  shortTermDebt?: Decimal;
  totalLiabilities?: Decimal;

  // Balance Sheet - Equity (from CircularSolver)
  openingEquity?: Decimal;
  retainedEarnings?: Decimal;
  totalEquity?: Decimal;

  // Internal calculation fields (from CircularSolver)
  theoreticalCash?: Decimal; // Before balancing
}

export interface FullProjectionResult {
  years: YearlyProjection[];
  summary: {
    totalRevenue: Decimal;
    totalStaffCost: Decimal;
    totalRent: Decimal;
    totalOpex: Decimal;
    totalEBITDA: Decimal;
    totalCapex: Decimal;
    totalCashFlow: Decimal;
    npvRent: Decimal; // NPV of rent (2028-2052)
    npvCashFlow: Decimal; // NPV of cash flow (2028-2052)
    avgEBITDAMargin: Decimal;
    avgRentLoad: Decimal; // Average rent load % (2028-2052)
  };
  metadata?: ProjectionMetadata; // CircularSolver convergence data
  duration: number; // milliseconds
}

export interface ProjectionMetadata {
  converged: boolean;
  iterations: number;
  maxError: Decimal;
  duration: number;
  solverUsed: boolean;
}

/**
 * Calculate full 30-year financial projection
 *
 * @param params - FullProjectionParams containing all inputs for calculation
 * @returns Result containing complete financial projection with all metrics
 *
 * @example
 * const result = calculateFullProjection({
 *   curriculumPlans: [frPlan, ibPlan],
 *   rentPlan: { rentModel: 'PARTNER_MODEL', parameters: {...} },
 *   staffCostBase: 15_000_000,
 *   staffCostCpiFrequency: 2,
 *   capexItems: [{ year: 2028, amount: 2_000_000 }],
 *   opexSubAccounts: [{ subAccountName: 'Marketing', percentOfRevenue: 0.03, isFixed: false, fixedAmount: null }],
 *   adminSettings: { cpiRate: 0.03, discountRate: 0.08, zakatRate: 0.025 }
 * });
 */
export async function calculateFullProjection(
  params: FullProjectionParams
): Promise<Result<FullProjectionResult>> {
  const startTime = performance.now();

  try {
    const {
      curriculumPlans,
      rentPlan,
      staffCostBase,
      staffCostCpiFrequency,
      capexItems,
      opexSubAccounts,
      adminSettings,
      startYear = 2023,
      endYear = 2052,
      versionMode,
    } = params;

    // Validate inputs
    if (!curriculumPlans || !Array.isArray(curriculumPlans)) {
      return error('Curriculum plans must be an array');
    }

    if (curriculumPlans.length === 0) {
      return error('At least one curriculum plan is required');
    }

    if (startYear > endYear) {
      return error('Start year must be <= end year');
    }

    if (startYear < 2023 || endYear > 2052) {
      return error('Years must be between 2023 and 2052');
    }

    const cpiRate = toDecimal(adminSettings.cpiRate);
    const discountRate = toDecimal(adminSettings.discountRate);
    const zakatRate = toDecimal(adminSettings.zakatRate);

    // ✅ FIX 1: Fetch Other Revenue (aggregate once, not per curriculum)
    let otherRevenueByYear: Array<{ year: number; amount: Decimal }> = [];

    if (params.otherRevenueByYear) {
      // Use provided Other Revenue
      otherRevenueByYear = params.otherRevenueByYear.map((item) => ({
        year: item.year,
        amount: toDecimal(item.amount),
      }));
    } else if (params.versionId) {
      // TODO: Fetch from database via service layer (will be implemented in Fix 4)
      // For now, continue with empty array (graceful degradation)
      // const otherRevenueResult = await getOtherRevenueByVersion(params.versionId);
      // if (otherRevenueResult.success) {
      //   otherRevenueByYear = otherRevenueResult.data.map(item => ({
      //     year: item.year,
      //     amount: toDecimal(item.amount),
      //   }));
      // }
    }

    // 🆕 PLANNING PERIODS: Fetch historical actuals (2023-2024)
    const historicalActualsMap = new Map<
      number,
      {
        revenue: Decimal;
        staffCost: Decimal;
        rent: Decimal;
        opex: Decimal;
        capex: Decimal;
      }
    >();

    // 🔄 Historical Actuals: Check if passed directly or fetch from Prisma (server-side only)
    if (params.historicalActuals) {
      // Use pre-fetched historical actuals (for client-side calls)
      console.log(
        `[calculateFullProjection] 📊 Using ${params.historicalActuals.length} pre-fetched historical records`
      );

      params.historicalActuals.forEach((h) => {
        const mappedData = {
          revenue: toDecimal(h.revenue),
          staffCost: toDecimal(h.staffCost),
          rent: toDecimal(h.rent),
          opex: toDecimal(h.opex),
          capex: toDecimal(h.capex),
        };

        console.log(`[calculateFullProjection] Year ${h.year} historical data:`, {
          revenue: mappedData.revenue.toString(),
          staffCost: mappedData.staffCost.toString(),
          rent: mappedData.rent.toString(),
          opex: mappedData.opex.toString(),
          capex: mappedData.capex.toString(),
        });

        historicalActualsMap.set(h.year, mappedData);
      });
    } else if (params.versionId && typeof window === 'undefined') {
      // Only fetch from Prisma on server-side (when window is undefined)
      try {
        const { getCachedHistoricalData, setCachedHistoricalData } = await import(
          '@/lib/cache/historical-cache'
        );
        const cachedHistorical = getCachedHistoricalData(params.versionId);

        let historicalData = cachedHistorical;

        if (!historicalData) {
          historicalData = await prisma.historical_actuals.findMany({
            where: {
              versionId: params.versionId,
              year: { in: [2023, 2024] },
            },
          });
          setCachedHistoricalData(params.versionId, historicalData);
          console.log(
            `[calculateFullProjection] 📊 Cached ${historicalData.length} historical records for version ${params.versionId}`
          );
        } else {
          console.log(
            `[calculateFullProjection] ♻️ Serving ${historicalData.length} historical records from cache for version ${params.versionId}`
          );
        }

        historicalData.forEach((h) => {
          const mappedData = {
            // Use totalRevenues from complete financial statements
            revenue: new Decimal(h.totalRevenues.toString()),
            // Use salariesAndRelatedCosts instead of old staffCost field
            staffCost: new Decimal(h.salariesAndRelatedCosts.toString()),
            // Use schoolRent instead of old rent field
            rent: new Decimal(h.schoolRent.toString()),
            // Use totalOperatingExpenses minus salaries and rent for opex
            opex: new Decimal(h.totalOperatingExpenses.toString())
              .minus(new Decimal(h.salariesAndRelatedCosts.toString()))
              .minus(new Decimal(h.schoolRent.toString())),
            // Use cfAdditionsFixedAssets (capital additions) for capex
            capex: new Decimal(h.cfAdditionsFixedAssets.toString()).abs(),
          };

          historicalActualsMap.set(h.year, mappedData);
        });

        console.log(
          `[calculateFullProjection] ✅ Historical actuals map size: ${historicalActualsMap.size}`
        );
      } catch (err) {
        // If fetching historical actuals fails, continue without them
        console.error('[calculateFullProjection] ❌ Failed to fetch historical actuals:', err);
      }
    }

    // 🆕 PLANNING PERIODS: Fetch transition data from database (if available)
    // This will be used for TRANSITION period (2025-2027) calculations
    let transitionDataMap: Map<number, TransitionPeriodData> = new Map();
    let useTransitionData = false;

    if (params.versionId && typeof window === 'undefined') {
      // Only fetch on server-side
      try {
        const availabilityResult = await isTransitionDataAvailable(params.versionId);
        if (availabilityResult.success && availabilityResult.data) {
          // Fetch transition year data directly from database with NEW FIELDS
          const transitionYears = await prisma.transition_year_data.findMany({
            where: {
              year: { in: [2025, 2026, 2027] },
            },
            select: {
              year: true,
              targetEnrollment: true,
              staffCostBase: true,
              averageTuitionPerStudent: true, // NEW
              otherRevenue: true, // NEW
              staffCostGrowthPercent: true, // NEW
              rentGrowthPercent: true, // NEW
            },
          });

          if (transitionYears.length > 0) {
            // Map the fetched data to TransitionPeriodData format
            for (const yearData of transitionYears) {
              transitionDataMap.set(yearData.year, {
                year: yearData.year,
                targetEnrollment: yearData.targetEnrollment,
                staffCostBase: new Decimal(yearData.staffCostBase.toString()),
                rent: new Decimal(0), // Will be calculated based on rentGrowthPercent or fallback
                averageTuitionPerStudent: yearData.averageTuitionPerStudent
                  ? new Decimal(yearData.averageTuitionPerStudent.toString())
                  : null,
                otherRevenue: yearData.otherRevenue
                  ? new Decimal(yearData.otherRevenue.toString())
                  : null,
                staffCostGrowthPercent: yearData.staffCostGrowthPercent
                  ? new Decimal(yearData.staffCostGrowthPercent.toString())
                  : null,
                rentGrowthPercent: yearData.rentGrowthPercent
                  ? new Decimal(yearData.rentGrowthPercent.toString())
                  : null,
              });
            }
            useTransitionData = true;
            console.log(
              '[calculateFullProjection] ✅ Using transition data from database for years 2025-2027'
            );
          } else {
            console.log(
              '[calculateFullProjection] ℹ️ No transition year data found, using fallback logic'
            );
          }
        } else {
          console.log(
            '[calculateFullProjection] ℹ️ Transition data not available, using fallback logic'
          );
        }
      } catch (err) {
        console.error('[calculateFullProjection] ❌ Error fetching transition data:', err);
        // Continue with fallback logic
      }
    }

    // 🆕 PLANNING PERIODS: Get transition rent from rent_plans.parameters (FALLBACK)
    // This is used when transition data is not available from database
    const transitionRent = rentPlan.parameters.transitionRent
      ? toDecimal(rentPlan.parameters.transitionRent)
      : new Decimal(0);

    // 🆕 FORMULA-004: Get transition capacity (default: 1850) (FALLBACK)
    // Import constant from period-detection for consistency
    const transitionCapacity = params.transitionCapacity ?? 1850;

    // STEP 1 & 2: Calculate tuition growth and revenue for each curriculum
    const tuitionByCurriculum: Record<string, Array<{ year: number; tuition: Decimal }>> = {};
    const revenueByYear: Array<{ year: number; revenue: Decimal }> = [];
    const revenueByCurriculum: Record<string, Array<{ year: number; revenue: Decimal }>> = {};

    for (const curriculumPlan of curriculumPlans) {
      // Validate curriculum plan has required fields
      if (!curriculumPlan.studentsProjection || !Array.isArray(curriculumPlan.studentsProjection)) {
        return error(
          `Curriculum plan ${curriculumPlan.curriculumType} is missing students projection data`
        );
      }

      if (curriculumPlan.studentsProjection.length === 0) {
        return error(
          `Curriculum plan ${curriculumPlan.curriculumType} has empty students projection`
        );
      }

      const tuitionParams: TuitionGrowthParams = {
        tuitionBase: curriculumPlan.tuitionBase,
        cpiRate,
        cpiFrequency: curriculumPlan.cpiFrequency,
        baseYear: startYear,
        startYear,
        endYear,
      };

      const tuitionResult = calculateTuitionGrowth(tuitionParams);
      if (!tuitionResult.success) {
        return tuitionResult;
      }

      // Store tuition growth results for later use
      tuitionByCurriculum[curriculumPlan.curriculumType] = tuitionResult.data.map((item) => ({
        year: item.year,
        tuition: item.tuition,
      }));

      /**
       * 🆕 FORMULA-004: Apply capacity cap for transition period (2025-2027)
       *
       * UPDATED: Now uses transition data from database when available
       *
       * TWO MODES:
       * 1. Database mode (preferred): Use targetEnrollment from transition_year_data
       * 2. Fallback mode: Apply proportional capacity cap to projected students
       *
       * FALLBACK BUSINESS RULE: Maximum 1,850 students during transition due to temporary facility space constraints
       *
       * CALCULATION METHOD (Proportional Reduction):
       * 1. Identify transition years (2025-2027)
       * 2. Calculate total students across ALL curricula for each year
       * 3. If total > 1,850: apply proportional reduction
       * 4. Reduction factor = 1,850 / total
       * 5. Each curriculum's students multiplied by reduction factor
       * 6. Result: Total ≤ 1,850, curriculum proportions maintained
       *
       * EXAMPLE:
       * Year 2026: FR = 1,200, IB = 800 (total 2,000)
       * Reduction factor: 1,850 / 2,000 = 0.925
       * Adjusted: FR = 1,110, IB = 740 (total 1,850)
       * FR:IB ratio: 60:40 (maintained)
       */
      const adjustedStudentsProjection = curriculumPlan.studentsProjection.map((s) => {
        const period = getPeriodForYear(s.year);
        if (period === 'TRANSITION') {
          // Check if we have transition data from database
          if (useTransitionData && transitionDataMap.has(s.year)) {
            // MODE 1: Use database transition data (targetEnrollment)
            // This overrides the projected students with admin-set targets
            const transitionData = transitionDataMap.get(s.year)!;

            // Calculate this curriculum's proportion of total target enrollment
            const totalStudentsProjected = curriculumPlans.reduce((sum, plan) => {
              const yearData = plan.studentsProjection.find((sp) => sp.year === s.year);
              return sum + (yearData?.students || 0);
            }, 0);

            if (totalStudentsProjected === 0) {
              return { year: s.year, students: 0 };
            }

            // Proportional allocation of target enrollment to this curriculum
            const curriculumProportion = s.students / totalStudentsProjected;
            const adjustedStudents = Math.floor(
              transitionData.targetEnrollment * curriculumProportion
            );

            console.log(
              `[TRANSITION] Year ${s.year} ${curriculumPlan.curriculumType}: Using database target ${transitionData.targetEnrollment} → ${adjustedStudents}`
            );

            return {
              year: s.year,
              students: adjustedStudents,
            };
          } else {
            // MODE 2: Fallback mode (original logic)
            // Step 1: Calculate total students across ALL curricula for this year
            const totalStudentsThisYear = curriculumPlans.reduce((sum, plan) => {
              const yearData = plan.studentsProjection.find((sp) => sp.year === s.year);
              return sum + (yearData?.students || 0);
            }, 0);

            // Step 2: Check if reduction needed (total exceeds cap)
            if (totalStudentsThisYear > transitionCapacity) {
              // Step 3: Calculate proportional reduction factor
              const reductionFactor = transitionCapacity / totalStudentsThisYear;

              // Step 4: Apply reduction to this curriculum's students
              return {
                year: s.year,
                students: Math.floor(s.students * reductionFactor), // Floor to ensure whole number
              };
            }
          }
        }
        // No reduction needed (historical, dynamic, or under cap)
        return s;
      });

      // Calculate revenue using tuition growth results
      const revenueParams: RevenueParams = {
        tuitionByYear: tuitionResult.data,
        studentsByYear: adjustedStudentsProjection, // Use adjusted students
      };

      const revenueResult = calculateRevenue(revenueParams);
      if (!revenueResult.success) {
        return revenueResult;
      }

      revenueByCurriculum[curriculumPlan.curriculumType] = revenueResult.data.map((item) => ({
        year: item.year,
        revenue: item.revenue,
      }));

      // Sum revenue across curricula for each year
      for (const item of revenueResult.data) {
        const existing = revenueByYear.find((r) => r.year === item.year);
        if (existing) {
          existing.revenue = existing.revenue.plus(item.revenue);
        } else {
          revenueByYear.push({ year: item.year, revenue: item.revenue });
        }
      }
    }

    // ✅ FIX 1: Add Other Revenue to total revenue (after summing curricula)
    // 🆕 PLANNING PERIODS: Use historical actual revenue for 2023-2024
    // 🆕 TRANSITION FIELDS: Use averageTuitionPerStudent and otherRevenue from transition data
    const totalRevenueByYear: Array<{ year: number; revenue: Decimal }> = revenueByYear.map(
      (item) => {
        const period = getPeriodForYear(item.year);

        if (period === 'HISTORICAL') {
          // Use historical actual data
          const historical = historicalActualsMap.get(item.year);
          return {
            year: item.year,
            revenue: historical?.revenue ?? item.revenue, // Fallback to calculated if no historical data
          };
        } else if (period === 'TRANSITION') {
          // Check if we have transition data with new revenue fields
          if (useTransitionData && transitionDataMap.has(item.year)) {
            const transitionData = transitionDataMap.get(item.year)!;

            // Check if averageTuitionPerStudent is provided
            if (transitionData.averageTuitionPerStudent) {
              // Revenue = Enrollment × Tuition (FR only) + Other Revenue
              const tuitionRevenue = new Decimal(transitionData.targetEnrollment).times(
                transitionData.averageTuitionPerStudent
              );
              const otherRev = transitionData.otherRevenue || new Decimal(0);
              const totalRevenue = tuitionRevenue.plus(otherRev);

              console.log(
                `[TRANSITION] Year ${item.year} revenue: tuition=${tuitionRevenue.toString()}, other=${otherRev.toString()}, total=${totalRevenue.toString()}`
              );

              return {
                year: item.year,
                revenue: totalRevenue,
              };
            }
          }

          // Fallback: Use calculated revenue from curriculum plans + other revenue
          const otherRev = otherRevenueByYear.find((or) => or.year === item.year);
          const totalRevenue = otherRev ? item.revenue.plus(otherRev.amount) : item.revenue;
          return { year: item.year, revenue: totalRevenue };
        } else {
          // DYNAMIC: Use calculated revenue + other revenue
          const otherRev = otherRevenueByYear.find((or) => or.year === item.year);
          const totalRevenue = otherRev ? item.revenue.plus(otherRev.amount) : item.revenue;
          return { year: item.year, revenue: totalRevenue };
        }
      }
    );

    // STEP 3: Calculate rent with PERIOD-AWARE logic
    // 🆕 PLANNING PERIODS: Different rent calculation for each period
    // - HISTORICAL (2023-2024): Use actual data from database
    // - TRANSITION (2025-2027): Use manual transitionRent
    // - DYNAMIC (2028-2052): Use rent model calculation
    let rentByYear: Array<{ year: number; rent: Decimal }> = [];

    // First, calculate dynamic period rent (2028-2052) using existing rent model
    let dynamicRentByYear: Array<{ year: number; rent: Decimal }> = [];

    if (rentPlan.rentModel === 'FIXED_ESCALATION') {
      const rentParams: RentCalculationParams = {
        model: 'FIXED_ESCALATION',
        baseRent: (rentPlan.parameters.baseRent as Decimal | number | string) ?? 0,
        escalationRate: (rentPlan.parameters.escalationRate as Decimal | number | string) ?? 0,
        frequency: (rentPlan.parameters.frequency as number) ?? undefined,
        startYear: 2028, // Only calculate for dynamic period
        endYear: 2052,
      };

      const rentResult = calculateRent(rentParams);
      if (!rentResult.success) {
        return rentResult;
      }

      dynamicRentByYear = (rentResult.data as Array<{ year: number; rent: Decimal }>).map(
        (item) => ({
          year: item.year,
          rent: item.rent,
        })
      );
    } else if (rentPlan.rentModel === 'REVENUE_SHARE') {
      // Filter revenue to only dynamic period
      const dynamicRevenueByYear = totalRevenueByYear.filter(
        (r) => r.year >= 2028 && r.year <= 2052
      );

      const rentParams: RentCalculationParams = {
        model: 'REVENUE_SHARE',
        revenueByYear: dynamicRevenueByYear,
        revenueSharePercent:
          (rentPlan.parameters.revenueSharePercent as Decimal | number | string) ?? 0,
      };

      const rentResult = calculateRent(rentParams);
      if (!rentResult.success) {
        return rentResult;
      }

      dynamicRentByYear = (rentResult.data as Array<{ year: number; rent: Decimal }>).map(
        (item) => ({
          year: item.year,
          rent: item.rent,
        })
      );
    } else if (rentPlan.rentModel === 'PARTNER_MODEL') {
      const rentParams: RentCalculationParams = {
        model: 'PARTNER_MODEL',
        landSize: (rentPlan.parameters.landSize as Decimal | number | string) ?? 0,
        landPricePerSqm: (rentPlan.parameters.landPricePerSqm as Decimal | number | string) ?? 0,
        buaSize: (rentPlan.parameters.buaSize as Decimal | number | string) ?? 0,
        constructionCostPerSqm:
          (rentPlan.parameters.constructionCostPerSqm as Decimal | number | string) ?? 0,
        yieldBase: (rentPlan.parameters.yieldBase as Decimal | number | string) ?? 0,
        growthRate: (rentPlan.parameters.growthRate as Decimal | number | string) ?? undefined,
        frequency: (rentPlan.parameters.frequency as number) ?? undefined,
        startYear: 2028,
        endYear: 2052,
      };

      const rentResult = calculateRent(rentParams);
      if (!rentResult.success) {
        return rentResult;
      }

      dynamicRentByYear = (rentResult.data as Array<{ year: number; rent: Decimal }>).map(
        (item) => ({
          year: item.year,
          rent: item.rent,
        })
      );
    } else {
      return error(`Unknown rent model: ${rentPlan.rentModel}`);
    }

    // Now construct rentByYear with period-specific logic
    for (let year = startYear; year <= endYear; year++) {
      const period = getPeriodForYear(year);

      if (period === 'HISTORICAL') {
        // Use historical actual data
        const historical = historicalActualsMap.get(year);
        rentByYear.push({
          year,
          rent: historical?.rent ?? new Decimal(0),
        });
      } else if (period === 'TRANSITION') {
        // Check if we have transition data from database
        if (useTransitionData && transitionDataMap.has(year)) {
          const transitionData = transitionDataMap.get(year)!;

          // Check if per-year rent growth is specified
          if (
            transitionData.rentGrowthPercent !== null &&
            transitionData.rentGrowthPercent !== undefined
          ) {
            // MODE 1: Use base year 2024 + growth%
            try {
              const baseYear2024Rent = await getRentBase2024(params.versionId);
              const growthMultiplier = new Decimal(1).plus(
                transitionData.rentGrowthPercent.dividedBy(100)
              );
              const calculatedRent = baseYear2024Rent.times(growthMultiplier);

              rentByYear.push({
                year,
                rent: calculatedRent,
              });
              console.log(
                `[TRANSITION] Year ${year} rent: Base 2024 ${baseYear2024Rent.toString()} × ${growthMultiplier.toString()} = ${calculatedRent.toString()}`
              );
            } catch (err) {
              console.error(
                `[TRANSITION] Failed to get base year 2024 rent: ${err instanceof Error ? err.message : 'Unknown error'}`
              );
              // Fallback to transitionRent
              rentByYear.push({
                year,
                rent: transitionRent,
              });
            }
          } else if (transitionData.rent && !transitionData.rent.isZero()) {
            // MODE 2: Use pre-calculated rent from transition data
            rentByYear.push({
              year,
              rent: transitionData.rent,
            });
            console.log(
              `[TRANSITION] Year ${year} rent: Using database value ${transitionData.rent.toString()}`
            );
          } else {
            // MODE 3: Fallback - use manual transition rent from rent_plans.parameters
            rentByYear.push({
              year,
              rent: transitionRent,
            });
          }
        } else {
          // MODE 4: Fallback - use manual transition rent from rent_plans.parameters
          rentByYear.push({
            year,
            rent: transitionRent,
          });
        }
      } else {
        // Use calculated dynamic rent
        const dynamicRent = dynamicRentByYear.find((r) => r.year === year);
        rentByYear.push({
          year,
          rent: dynamicRent?.rent ?? new Decimal(0),
        });
      }
    }

    // STEP 4: Calculate staff costs (with CPI growth)
    // ✅ FIX: Use the same baseYear that was used to calculate staffCostBase
    // For RELOCATION_2028 mode, staffCostBase is calculated for year 2028, so baseYear should be 2028
    // For HISTORICAL_BASELINE mode, staffCostBase is calculated for year 2023, so baseYear should be 2023
    // This ensures year 2028 (or 2023) has CPI period 0 (no growth) in staff cost calculation
    // Get versionMode from params (default to RELOCATION_2028 if not provided)
    const mode = versionMode || 'RELOCATION_2028';
    const staffCostBaseYear = mode === 'RELOCATION_2028' ? 2028 : 2023;

    const staffCostParams: StaffCostParams = {
      baseStaffCost: staffCostBase,
      cpiRate,
      cpiFrequency: staffCostCpiFrequency,
      baseYear: staffCostBaseYear, // ✅ FIX: Use 2028 for relocation, 2023 for historical
      startYear,
      endYear,
    };

    // 🐛 DEBUG: Log staff cost calculation parameters
    console.log('[STAFF COST CPI DEBUG]', {
      versionMode: mode,
      staffCostBase:
        typeof staffCostBase === 'object' ? staffCostBase.toNumber() : Number(staffCostBase),
      cpiRate: cpiRate.toNumber(),
      cpiFrequency: staffCostCpiFrequency,
      staffCostBaseYear,
      startYear,
      endYear,
      year2028Period: Math.floor((2028 - staffCostBaseYear) / staffCostCpiFrequency),
      year2028Factor: Decimal.add(1, cpiRate)
        .pow(Math.floor((2028 - staffCostBaseYear) / staffCostCpiFrequency))
        .toNumber(),
      year2028StaffCost: (typeof staffCostBase === 'object'
        ? staffCostBase
        : new Decimal(staffCostBase)
      )
        .times(
          Decimal.add(1, cpiRate).pow(
            Math.floor((2028 - staffCostBaseYear) / staffCostCpiFrequency)
          )
        )
        .toNumber(),
    });

    const staffCostResult = calculateStaffCosts(staffCostParams);
    if (!staffCostResult.success) {
      return staffCostResult;
    }

    // 🆕 PLANNING PERIODS: Apply period-specific staff cost logic
    // - HISTORICAL (2023-2024): Use actual data
    // - TRANSITION (2025-2027): Use database data if available, else calculated
    // - DYNAMIC (2028-2052): Use calculated staff costs
    const staffCostByYear: Array<{ year: number; staffCost: Decimal }> = [];

    for (const item of staffCostResult.data) {
      const period = getPeriodForYear(item.year);

      if (period === 'HISTORICAL') {
        // Use historical actual data
        const historical = historicalActualsMap.get(item.year);
        staffCostByYear.push({
          year: item.year,
          staffCost: historical?.staffCost ?? item.staffCost, // Fallback to calculated if no historical data
        });
      } else if (period === 'TRANSITION') {
        // Check if we have transition data from database
        if (useTransitionData && transitionDataMap.has(item.year)) {
          const transitionData = transitionDataMap.get(item.year)!;

          // Check if growth percentage approach is used
          if (
            transitionData.staffCostGrowthPercent !== null &&
            transitionData.staffCostGrowthPercent !== undefined
          ) {
            // MODE 1: Use base year 2024 + growth%
            try {
              const baseYear2024 = await getStaffCostBase2024(params.versionId);
              const growthMultiplier = new Decimal(1).plus(
                transitionData.staffCostGrowthPercent.dividedBy(100)
              );
              const calculatedStaffCost = baseYear2024.times(growthMultiplier);

              staffCostByYear.push({
                year: item.year,
                staffCost: calculatedStaffCost,
              });
              console.log(
                `[TRANSITION] Year ${item.year} staff cost: Base 2024 ${baseYear2024.toString()} × ${growthMultiplier.toString()} = ${calculatedStaffCost.toString()}`
              );
            } catch (err) {
              console.error(
                `[TRANSITION] Failed to get base year 2024 staff cost: ${err instanceof Error ? err.message : 'Unknown error'}`
              );
              // Fallback to staffCostBase from transition data
              staffCostByYear.push({
                year: item.year,
                staffCost: transitionData.staffCostBase,
              });
            }
          } else {
            // MODE 2: Use absolute staffCostBase from transition data
            staffCostByYear.push({
              year: item.year,
              staffCost: transitionData.staffCostBase,
            });
            console.log(
              `[TRANSITION] Year ${item.year} staff cost: Using database value ${transitionData.staffCostBase.toString()}`
            );
          }
        } else {
          // MODE 3: Fallback - use calculated staff costs
          staffCostByYear.push({
            year: item.year,
            staffCost: item.staffCost,
          });
        }
      } else {
        // DYNAMIC: Use calculated staff costs
        staffCostByYear.push({
          year: item.year,
          staffCost: item.staffCost,
        });
      }
    }

    // STEP 5: Calculate opex
    const opexParams: OpexParams = {
      revenueByYear: totalRevenueByYear, // ✅ FIX 1: Use totalRevenue (includes Other Revenue)
      subAccounts: opexSubAccounts,
    };

    const opexResult = calculateOpex(opexParams);
    if (!opexResult.success) {
      return opexResult;
    }

    // 🆕 PLANNING PERIODS: Apply period-specific opex logic
    // - HISTORICAL (2023-2024): Use actual data
    // - TRANSITION + DYNAMIC (2025-2052): Use calculated opex
    const opexByYear: Array<{ year: number; totalOpex: Decimal }> = [];

    for (const item of opexResult.data) {
      const period = getPeriodForYear(item.year);

      if (period === 'HISTORICAL') {
        // Use historical actual data
        const historical = historicalActualsMap.get(item.year);
        opexByYear.push({
          year: item.year,
          totalOpex: historical?.opex ?? item.totalOpex, // Fallback to calculated if no historical data
        });
      } else {
        // TRANSITION + DYNAMIC: Use calculated opex
        opexByYear.push({
          year: item.year,
          totalOpex: item.totalOpex,
        });
      }
    }

    // STEP 6: Calculate EBITDA
    const ebitdaParams: EBITDAParams = {
      revenueByYear: totalRevenueByYear, // ✅ FIX 1: Use totalRevenue (includes Other Revenue)
      staffCostByYear,
      rentByYear,
      opexByYear,
    };

    const ebitdaResult = calculateEBITDA(ebitdaParams);
    if (!ebitdaResult.success) {
      return ebitdaResult;
    }

    // ✅ FIX 3: Integrate CircularSolver for Balance Sheet and Cash Flow calculations
    let solverResult: Awaited<ReturnType<CircularSolver['solve']>> | null = null; // Returns SolverResult<SolverResult>
    let cashFlowResult: {
      success: true;
      data: Array<{
        year: number;
        ebitda: Decimal;
        depreciation: Decimal;
        interestExpense: Decimal;
        interestIncome: Decimal;
        zakat: Decimal;
        netIncome: Decimal;
        workingCapitalChange: Decimal;
        operatingCashFlow: Decimal;
        investingCashFlow: Decimal;
        financingCashFlow: Decimal;
        netCashFlow: Decimal;
        capex: Decimal;
        interest: Decimal;
        cashFlow: Decimal;
      }>;
    } | null = null;

    // Only run CircularSolver if versionId is provided (required for solver)
    if (params.versionId) {
      try {
        // ✅ FIX 3: Get versionMode from params or default to RELOCATION_2028
        const versionMode = params.versionMode || 'RELOCATION_2028';

        // ✅ FIX 3: Calculate fixedAssetsOpening from historical capex (before startYear)
        const fixedAssetsOpening = capexItems
          .filter((item) => {
            const itemYear =
              typeof item.year === 'number' ? item.year : parseInt(String(item.year), 10);
            return itemYear < startYear;
          })
          .reduce((sum, item) => sum.plus(toDecimal(item.amount)), new Decimal(0));

        // ✅ FIX 3: Get depreciationRate from params or use default (10%)
        const depreciationRate = params.depreciationRate
          ? toDecimal(params.depreciationRate)
          : new Decimal(0.1); // Default: 10% straight-line
        // TODO: Fetch from admin settings when service layer is ready

        // ✅ FIX 3: Get balance sheet settings from params or use defaults
        const startingCash = params.balanceSheetSettings?.startingCash
          ? toDecimal(params.balanceSheetSettings.startingCash)
          : new Decimal(5_000_000); // Default: 5M SAR
        const openingEquity = params.balanceSheetSettings?.openingEquity
          ? toDecimal(params.balanceSheetSettings.openingEquity)
          : new Decimal(55_000_000); // Default: 55M SAR
        // TODO: Fetch from database when service layer is ready

        // Prepare 30-year arrays (2023-2052) for CircularSolver
        const revenueArray: Decimal[] = [];
        const ebitdaArray: Decimal[] = [];
        const capexArray: Decimal[] = [];
        const staffCostsArray: Decimal[] = [];

        for (let year = 2023; year <= 2052; year++) {
          const revenueItem = totalRevenueByYear.find((r) => r.year === year);
          const ebitdaItem = ebitdaResult.data.find((e) => e.year === year);
          const staffCostItem = staffCostByYear.find((s) => s.year === year);

          // 🆕 PLANNING PERIODS: Use historical capex for 2023-2024
          const period = getPeriodForYear(year);
          let capex: Decimal;

          if (period === 'HISTORICAL') {
            // Use historical actual capex
            const historical = historicalActualsMap.get(year);
            capex = historical?.capex ?? new Decimal(0);
          } else {
            // TRANSITION + DYNAMIC: Use capex from capexItems
            const capexItem = capexItems.find((c) => {
              const cYear = typeof c.year === 'number' ? c.year : parseInt(String(c.year), 10);
              return cYear === year;
            });
            capex = capexItem ? toDecimal(capexItem.amount) : new Decimal(0);
          }

          revenueArray.push(revenueItem?.revenue || new Decimal(0));
          ebitdaArray.push(ebitdaItem?.ebitda || new Decimal(0));
          capexArray.push(capex);
          staffCostsArray.push(staffCostItem?.staffCost || new Decimal(0));
        }

        // Call CircularSolver
        const solver = new CircularSolver();
        const solverParams: SolverParams = {
          versionId: params.versionId,
          versionMode,
          revenue: revenueArray,
          ebitda: ebitdaArray,
          capex: capexArray,
          fixedAssetsOpening,
          depreciationRate,
          staffCosts: staffCostsArray,
          startingCash,
          openingEquity,
        };

        solverResult = await solver.solve(solverParams);

        if (solverResult.success && solverResult.data.converged) {
          // ✅ FIX 3: Convert solver results to CashFlowResult format (year-based mapping)
          const solverYearMap = new Map(solverResult.data.projection.map((y) => [y.year, y]));

          cashFlowResult = {
            success: true,
            data: ebitdaResult.data.map((item) => {
              const solverYear = solverYearMap.get(item.year);
              if (!solverYear) {
                // Fallback if year not found (shouldn't happen)
                return {
                  year: item.year,
                  ebitda: item.ebitda,
                  depreciation: new Decimal(0),
                  interestExpense: new Decimal(0),
                  interestIncome: new Decimal(0),
                  zakat: item.ebitda.times(zakatRate),
                  netIncome: item.ebitda.minus(item.ebitda.times(zakatRate)),
                  workingCapitalChange: new Decimal(0),
                  operatingCashFlow: item.ebitda.minus(item.ebitda.times(zakatRate)),
                  investingCashFlow: new Decimal(0),
                  financingCashFlow: new Decimal(0),
                  netCashFlow: item.ebitda.minus(item.ebitda.times(zakatRate)),
                  capex: new Decimal(0),
                  interest: new Decimal(0),
                  taxes: item.ebitda.times(zakatRate), // Legacy field (taxes = zakat)
                  cashFlow: item.ebitda.minus(item.ebitda.times(zakatRate)),
                };
              }

              return {
                year: item.year,
                ebitda: item.ebitda,
                depreciation: solverYear.depreciation,
                interestExpense: solverYear.interestExpense,
                interestIncome: solverYear.interestIncome,
                zakat: solverYear.zakat,
                netIncome: solverYear.netResult,
                workingCapitalChange: solverYear.workingCapitalChange,
                operatingCashFlow: solverYear.operatingCashFlow,
                investingCashFlow: solverYear.investingCashFlow,
                financingCashFlow: solverYear.financingCashFlow,
                netCashFlow: solverYear.netCashFlow,
                capex: solverYear.capex,
                interest: solverYear.interestExpense, // Legacy field
                taxes: solverYear.zakat, // Legacy field (taxes = zakat in Saudi Arabia)
                cashFlow: solverYear.netCashFlow, // Legacy field
              };
            }),
          };
        } else {
          // Solver failed or didn't converge - use fallback
          console.warn(
            '[calculateFullProjection] CircularSolver failed or did not converge, using simplified calculation'
          );
        }
      } catch (err) {
        console.error('[calculateFullProjection] CircularSolver error:', err);
        // Continue with fallback calculation
      }
    }

    // Fallback: Use simplified cash flow if solver not available or failed
    if (!cashFlowResult) {
      cashFlowResult = {
        success: true,
        data: ebitdaResult.data.map((item) => ({
          year: item.year,
          ebitda: item.ebitda,
          depreciation: new Decimal(0),
          interestExpense: new Decimal(0),
          interestIncome: new Decimal(0),
          zakat: item.ebitda.times(zakatRate),
          netIncome: item.ebitda.minus(item.ebitda.times(zakatRate)),
          workingCapitalChange: new Decimal(0),
          operatingCashFlow: item.ebitda.minus(item.ebitda.times(zakatRate)),
          investingCashFlow: new Decimal(0),
          financingCashFlow: new Decimal(0),
          netCashFlow: item.ebitda.minus(item.ebitda.times(zakatRate)),
          capex: new Decimal(0),
          interest: new Decimal(0),
          taxes: item.ebitda.times(zakatRate), // Legacy field (taxes = zakat)
          cashFlow: item.ebitda.minus(item.ebitda.times(zakatRate)),
        })),
      };
    }

    // STEP 8 & 9: Calculate NPV for rent and cash flow (2028-2052)
    const npvStartYear = Math.max(2028, startYear);
    const npvEndYear = Math.min(2052, endYear);

    const npvRentParams: NPVParams = {
      amountsByYear: rentByYear
        .filter((item) => item.year >= npvStartYear && item.year <= npvEndYear)
        .map((item) => ({ year: item.year, amount: item.rent })),
      discountRate,
      startYear: npvStartYear,
      endYear: npvEndYear,
    };

    const npvRentResult = calculateNPV(npvRentParams);
    if (!npvRentResult.success) {
      return npvRentResult;
    }

    const npvCashFlowParams: NPVParams = {
      amountsByYear: cashFlowResult.data
        .filter((item) => item.year >= npvStartYear && item.year <= npvEndYear)
        .map((item) => ({ year: item.year, amount: item.cashFlow })),
      discountRate,
      startYear: npvStartYear,
      endYear: npvEndYear,
    };

    const npvCashFlowResult = calculateNPV(npvCashFlowParams);
    if (!npvCashFlowResult.success) {
      return npvCashFlowResult;
    }

    // STEP 10: Combine all results into yearly projections
    const years: YearlyProjection[] = [];

    // Create maps for quick lookup
    const frTuitionMap = new Map<number, Decimal>();
    const ibTuitionMap = new Map<number, Decimal>();
    const frStudentsMap = new Map<number, number>();
    const ibStudentsMap = new Map<number, number>();

    for (const curriculumPlan of curriculumPlans) {
      const tuitionData = tuitionByCurriculum[curriculumPlan.curriculumType];
      if (!tuitionData) continue;

      for (const item of tuitionData) {
        if (curriculumPlan.curriculumType === 'FR') {
          frTuitionMap.set(item.year, item.tuition);
        } else {
          ibTuitionMap.set(item.year, item.tuition);
        }
      }

      for (const item of curriculumPlan.studentsProjection) {
        if (curriculumPlan.curriculumType === 'FR') {
          frStudentsMap.set(item.year, item.students);
        } else {
          ibStudentsMap.set(item.year, item.students);
        }
      }
    }

    const ebitdaMap = new Map(ebitdaResult.data.map((item) => [item.year, item]));
    const cashFlowMap = new Map(cashFlowResult.data.map((item) => [item.year, item]));

    for (let year = startYear; year <= endYear; year++) {
      const revenueItem = totalRevenueByYear.find((r) => r.year === year); // ✅ FIX 1: Use totalRevenue
      const rentItem = rentByYear.find((r) => r.year === year);
      const staffCostItem = staffCostByYear.find((s) => s.year === year);
      const opexItem = opexByYear.find((o) => o.year === year);
      const ebitdaItem = ebitdaMap.get(year);
      const cashFlowItem = cashFlowMap.get(year);

      if (
        !revenueItem ||
        !rentItem ||
        !staffCostItem ||
        !opexItem ||
        !ebitdaItem ||
        !cashFlowItem
      ) {
        continue; // Skip years with missing data
      }

      const rentLoad = revenueItem.revenue.isZero()
        ? new Decimal(0)
        : safeDivide(rentItem.rent, revenueItem.revenue).times(100);

      const tuitionFR = frTuitionMap.get(year);
      const tuitionIB = ibTuitionMap.get(year);
      const studentsFR = frStudentsMap.get(year);
      const studentsIB = ibStudentsMap.get(year);

      // Get solver data for Balance Sheet fields (if solver was used)
      const solverYear = solverResult?.data?.projection.find((y) => y.year === year);

      const projection: YearlyProjection = {
        year,
        revenue: revenueItem.revenue,
        staffCost: staffCostItem.staffCost,
        staffCosts: staffCostItem.staffCost, // Alias for compatibility with PnLStatement
        rent: rentItem.rent,
        opex: opexItem.totalOpex,
        ebitda: ebitdaItem.ebitda,
        ebitdaMargin: ebitdaItem.ebitdaMargin,
        capex: cashFlowItem.capex,
        interest: cashFlowItem.interest, // Legacy
        taxes: cashFlowItem.taxes, // Legacy
        cashFlow: cashFlowItem.cashFlow, // Legacy
        rentLoad,

        // ✅ ADD: Merge CircularSolver results (with null checks for safety)
        depreciation: cashFlowItem?.depreciation ?? new Decimal(0),
        interestExpense: cashFlowItem?.interestExpense ?? new Decimal(0),
        interestIncome: cashFlowItem?.interestIncome ?? new Decimal(0),
        zakat: cashFlowItem?.zakat ?? new Decimal(0),
        netResult: cashFlowItem?.netIncome ?? new Decimal(0),
        workingCapitalChange: cashFlowItem?.workingCapitalChange ?? new Decimal(0),
        operatingCashFlow: cashFlowItem?.operatingCashFlow ?? new Decimal(0),
        investingCashFlow: cashFlowItem?.investingCashFlow ?? new Decimal(0),
        financingCashFlow: cashFlowItem?.financingCashFlow ?? new Decimal(0),
        netCashFlow: cashFlowItem?.netCashFlow ?? new Decimal(0),

        // ✅ ADD: Balance Sheet fields from CircularSolver (if available)
        cash: solverYear?.cash,
        accountsReceivable: solverYear?.accountsReceivable,
        fixedAssets: solverYear?.fixedAssets,
        totalAssets: solverYear?.totalAssets,
        accountsPayable: solverYear?.accountsPayable,
        deferredIncome: solverYear?.deferredIncome,
        accruedExpenses: solverYear?.accruedExpenses,
        shortTermDebt: solverYear?.shortTermDebt,
        totalLiabilities: solverYear?.totalLiabilities,
        openingEquity: solverYear?.openingEquity,
        retainedEarnings: solverYear?.retainedEarnings,
        totalEquity: solverYear?.totalEquity,
        theoreticalCash: solverYear?.theoreticalCash,
      };

      // Add optional fields if they exist
      if (tuitionFR !== undefined) {
        projection.tuitionFR = tuitionFR;
      }
      if (tuitionIB !== undefined) {
        projection.tuitionIB = tuitionIB;
      }
      if (studentsFR !== undefined) {
        projection.studentsFR = studentsFR;
      }
      if (studentsIB !== undefined) {
        projection.studentsIB = studentsIB;
      }

      years.push(projection);
    }

    // Validation: Ensure CircularSolver fields were merged (if solver was used)
    if (params.versionId && solverResult?.success && solverResult.data.converged) {
      const missingFields = years.filter(
        (y) =>
          y.depreciation === undefined ||
          y.interestExpense === undefined ||
          y.zakat === undefined ||
          y.netResult === undefined
      );

      if (missingFields.length > 0) {
        console.error(
          '[calculateFullProjection] ❌ CircularSolver merge incomplete for years:',
          missingFields.map((y) => y.year)
        );
      } else {
        console.log('[calculateFullProjection] ✅ CircularSolver results merged for all 30 years');
      }
    }

    // Validation: Check for undefined critical fields in all years
    const yearsWithUndefinedFields = years.filter(
      (y) =>
        y.revenue === undefined ||
        y.staffCost === undefined ||
        y.staffCosts === undefined ||
        y.ebitda === undefined
    );

    if (yearsWithUndefinedFields.length > 0) {
      console.error(
        '[calculateFullProjection] ❌ Critical fields undefined for years:',
        yearsWithUndefinedFields.map((y) => ({
          year: y.year,
          revenue: y.revenue === undefined ? 'UNDEFINED' : 'OK',
          staffCost: y.staffCost === undefined ? 'UNDEFINED' : 'OK',
          staffCosts: y.staffCosts === undefined ? 'UNDEFINED' : 'OK',
          ebitda: y.ebitda === undefined ? 'UNDEFINED' : 'OK',
        }))
      );
    } else {
      console.log('[calculateFullProjection] ✅ All critical fields populated for 30 years');
    }

    // Calculate summary metrics
    const totalRevenue = years.reduce((sum, y) => sum.plus(y.revenue), new Decimal(0));
    const totalStaffCost = years.reduce((sum, y) => sum.plus(y.staffCost), new Decimal(0));
    const totalRent = years.reduce((sum, y) => sum.plus(y.rent), new Decimal(0));
    const totalOpex = years.reduce((sum, y) => sum.plus(y.opex), new Decimal(0));
    const totalEBITDA = years.reduce((sum, y) => sum.plus(y.ebitda), new Decimal(0));
    const totalCapex = years.reduce((sum, y) => sum.plus(y.capex), new Decimal(0));
    const totalCashFlow = years.reduce((sum, y) => sum.plus(y.cashFlow), new Decimal(0));

    // Average EBITDA margin (sum of margins / count)
    const avgEBITDAMargin =
      years.length > 0
        ? years.reduce((sum, y) => sum.plus(y.ebitdaMargin), new Decimal(0)).div(years.length)
        : new Decimal(0);

    // Average rent load % for 2028-2052 period
    const rentLoadYears = years.filter((y) => y.year >= 2028 && y.year <= 2052);
    const avgRentLoad =
      rentLoadYears.length > 0
        ? rentLoadYears
            .reduce((sum, y) => sum.plus(y.rentLoad), new Decimal(0))
            .div(rentLoadYears.length)
        : new Decimal(0);

    const duration = performance.now() - startTime;

    return success({
      years,
      summary: {
        totalRevenue,
        totalStaffCost,
        totalRent,
        totalOpex,
        totalEBITDA,
        totalCapex,
        totalCashFlow,
        npvRent: npvRentResult.data.npv,
        npvCashFlow: npvCashFlowResult.data.npv,
        avgEBITDAMargin,
        avgRentLoad,
      },
      metadata: solverResult?.success
        ? {
            converged: solverResult.data.converged,
            iterations: solverResult.data.iterations,
            maxError: solverResult.data.maxError,
            duration: solverResult.data.duration,
            solverUsed: true,
          }
        : undefined,
      duration,
    });
  } catch (err) {
    return error(
      `Failed to calculate full projection: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
}
