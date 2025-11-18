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

// Import calculation modules
import { calculateTuitionGrowth, type TuitionGrowthParams } from '../revenue/tuition-growth';
import { calculateRevenue, type RevenueParams } from '../revenue/revenue';
import { calculateRent, type RentCalculationParams } from '../rent';
import { calculateStaffCosts, type StaffCostParams } from './staff-costs';
import { calculateOpex, type OpexParams } from './opex';
import { calculateEBITDA, type EBITDAParams } from './ebitda';
import { calculateCashFlow, type CashFlowParams } from './cashflow';
import { calculateNPV, type NPVParams } from './npv';

export interface AdminSettings {
  cpiRate: Decimal | number | string;
  discountRate: Decimal | number | string;
  taxRate: Decimal | number | string;
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
  staffCost: Decimal;
  rent: Decimal;
  opex: Decimal;
  ebitda: Decimal;
  ebitdaMargin: Decimal;
  capex: Decimal;
  interest: Decimal;
  taxes: Decimal;
  cashFlow: Decimal;
  // Metrics
  rentLoad: Decimal; // (Rent / Revenue) × 100
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
  duration: number; // milliseconds
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
 *   adminSettings: { cpiRate: 0.03, discountRate: 0.08, taxRate: 0.20 }
 * });
 */
export function calculateFullProjection(
  params: FullProjectionParams
): Result<FullProjectionResult> {
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
    const taxRate = toDecimal(adminSettings.taxRate);

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

      // Calculate revenue using tuition growth results
      const revenueParams: RevenueParams = {
        tuitionByYear: tuitionResult.data,
        studentsByYear: curriculumPlan.studentsProjection,
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

    // STEP 3: Calculate rent (may depend on revenue for RevenueShare model)
    let rentByYear: Array<{ year: number; rent: Decimal }> = [];

    if (rentPlan.rentModel === 'FIXED_ESCALATION') {
      const rentParams: RentCalculationParams = {
        model: 'FIXED_ESCALATION',
        baseRent: (rentPlan.parameters.baseRent as Decimal | number | string) ?? 0,
        escalationRate: (rentPlan.parameters.escalationRate as Decimal | number | string) ?? 0,
        frequency: (rentPlan.parameters.frequency as number) ?? undefined,
        startYear,
        endYear,
      };

      const rentResult = calculateRent(rentParams);
      if (!rentResult.success) {
        return rentResult;
      }

      rentByYear = (rentResult.data as Array<{ year: number; rent: Decimal }>).map((item) => ({
        year: item.year,
        rent: item.rent,
      }));
    } else if (rentPlan.rentModel === 'REVENUE_SHARE') {
      const rentParams: RentCalculationParams = {
        model: 'REVENUE_SHARE',
        revenueByYear,
        revenueSharePercent: (rentPlan.parameters.revenueSharePercent as Decimal | number | string) ?? 0,
      };

      const rentResult = calculateRent(rentParams);
      if (!rentResult.success) {
        return rentResult;
      }

      rentByYear = (rentResult.data as Array<{ year: number; rent: Decimal }>).map((item) => ({
        year: item.year,
        rent: item.rent,
      }));
    } else if (rentPlan.rentModel === 'PARTNER_MODEL') {
      const rentParams: RentCalculationParams = {
        model: 'PARTNER_MODEL',
        landSize: (rentPlan.parameters.landSize as Decimal | number | string) ?? 0,
        landPricePerSqm: (rentPlan.parameters.landPricePerSqm as Decimal | number | string) ?? 0,
        buaSize: (rentPlan.parameters.buaSize as Decimal | number | string) ?? 0,
        constructionCostPerSqm: (rentPlan.parameters.constructionCostPerSqm as Decimal | number | string) ?? 0,
        yieldBase: (rentPlan.parameters.yieldBase as Decimal | number | string) ?? 0,
        growthRate: (rentPlan.parameters.growthRate as Decimal | number | string) ?? undefined,
        frequency: (rentPlan.parameters.frequency as number) ?? undefined,
        startYear,
        endYear,
      };

      const rentResult = calculateRent(rentParams);
      if (!rentResult.success) {
        return rentResult;
      }

      rentByYear = (rentResult.data as Array<{ year: number; rent: Decimal }>).map((item) => ({
        year: item.year,
        rent: item.rent,
      }));
    } else {
      return error(`Unknown rent model: ${rentPlan.rentModel}`);
    }

    // STEP 4: Calculate staff costs (with CPI growth)
    const staffCostParams: StaffCostParams = {
      baseStaffCost: staffCostBase,
      cpiRate,
      cpiFrequency: staffCostCpiFrequency,
      baseYear: startYear,
      startYear,
      endYear,
    };

    const staffCostResult = calculateStaffCosts(staffCostParams);
    if (!staffCostResult.success) {
      return staffCostResult;
    }

    const staffCostByYear = staffCostResult.data.map((item) => ({
      year: item.year,
      staffCost: item.staffCost,
    }));

    // STEP 5: Calculate opex
    const opexParams: OpexParams = {
      revenueByYear,
      subAccounts: opexSubAccounts,
    };

    const opexResult = calculateOpex(opexParams);
    if (!opexResult.success) {
      return opexResult;
    }

    const opexByYear = opexResult.data.map((item) => ({
      year: item.year,
      totalOpex: item.totalOpex,
    }));

    // STEP 6: Calculate EBITDA
    const ebitdaParams: EBITDAParams = {
      revenueByYear,
      staffCostByYear,
      rentByYear,
      opexByYear,
    };

    const ebitdaResult = calculateEBITDA(ebitdaParams);
    if (!ebitdaResult.success) {
      return ebitdaResult;
    }

    // STEP 7: Calculate cash flow
    const cashFlowParams: CashFlowParams = {
      ebitdaByYear: ebitdaResult.data.map((item) => ({
        year: item.year,
        ebitda: item.ebitda,
      })),
      capexItems: capexItems.map((item) => ({
        year: item.year,
        amount: toDecimal(item.amount),
      })),
      taxRate,
    };

    const cashFlowResult = calculateCashFlow(cashFlowParams);
    if (!cashFlowResult.success) {
      return cashFlowResult;
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
      const revenueItem = revenueByYear.find((r) => r.year === year);
      const rentItem = rentByYear.find((r) => r.year === year);
      const staffCostItem = staffCostByYear.find((s) => s.year === year);
      const opexItem = opexByYear.find((o) => o.year === year);
      const ebitdaItem = ebitdaMap.get(year);
      const cashFlowItem = cashFlowMap.get(year);

      if (!revenueItem || !rentItem || !staffCostItem || !opexItem || !ebitdaItem || !cashFlowItem) {
        continue; // Skip years with missing data
      }

      const rentLoad = revenueItem.revenue.isZero()
        ? new Decimal(0)
        : safeDivide(rentItem.rent, revenueItem.revenue).times(100);

      const tuitionFR = frTuitionMap.get(year);
      const tuitionIB = ibTuitionMap.get(year);
      const studentsFR = frStudentsMap.get(year);
      const studentsIB = ibStudentsMap.get(year);

      const projection: YearlyProjection = {
        year,
        revenue: revenueItem.revenue,
        staffCost: staffCostItem.staffCost,
        rent: rentItem.rent,
        opex: opexItem.totalOpex,
        ebitda: ebitdaItem.ebitda,
        ebitdaMargin: ebitdaItem.ebitdaMargin,
        capex: cashFlowItem.capex,
        interest: cashFlowItem.interest,
        taxes: cashFlowItem.taxes,
        cashFlow: cashFlowItem.cashFlow,
        rentLoad,
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

    // Calculate summary metrics
    const totalRevenue = years.reduce((sum, y) => sum.plus(y.revenue), new Decimal(0));
    const totalStaffCost = years.reduce((sum, y) => sum.plus(y.staffCost), new Decimal(0));
    const totalRent = years.reduce((sum, y) => sum.plus(y.rent), new Decimal(0));
    const totalOpex = years.reduce((sum, y) => sum.plus(y.opex), new Decimal(0));
    const totalEBITDA = years.reduce((sum, y) => sum.plus(y.ebitda), new Decimal(0));
    const totalCapex = years.reduce((sum, y) => sum.plus(y.capex), new Decimal(0));
    const totalCashFlow = years.reduce((sum, y) => sum.plus(y.cashFlow), new Decimal(0));

    // Average EBITDA margin (sum of margins / count)
    const avgEBITDAMargin = years.length > 0
      ? years.reduce((sum, y) => sum.plus(y.ebitdaMargin), new Decimal(0)).div(years.length)
      : new Decimal(0);

    // Average rent load % for 2028-2052 period
    const rentLoadYears = years.filter((y) => y.year >= 2028 && y.year <= 2052);
    const avgRentLoad = rentLoadYears.length > 0
      ? rentLoadYears.reduce((sum, y) => sum.plus(y.rentLoad), new Decimal(0)).div(rentLoadYears.length)
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
      duration,
    });
  } catch (err) {
    return error(`Failed to calculate full projection: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

