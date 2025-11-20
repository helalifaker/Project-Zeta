/**
 * Staff Cost Calculation
 * Calculates staff cost growth based on CPI with configurable frequency
 *
 * Formula: staff_cost(t) = base_staff_cost × (1 + cpi_rate)^(floor((t - base_year) / frequency))
 *
 * @example
 * Base staff cost: 15M SAR, CPI: 3%, Frequency: 2 years
 * Year 2028: 15M × (1.03)^0 = 15M
 * Year 2029: 15M × (1.03)^0 = 15M (same as 2028, frequency = 2)
 * Year 2030: 15M × (1.03)^1 = 15.45M
 * Year 2031: 15M × (1.03)^1 = 15.45M (same as 2030)
 * Year 2032: 15M × (1.03)^2 = 15.9135M
 */

import Decimal from 'decimal.js';
import { toDecimal } from '../decimal-helpers';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';

/**
 * Curriculum Plan interface for staff cost calculation
 */
export interface CurriculumPlanForStaffCost {
  curriculumType: 'FR' | 'IB';
  studentsProjection: Array<{ year: number; students: number }>;
  teacherRatio: Decimal | number | string | null; // Ratio of teachers per student (e.g., 0.0714 = 1/14, meaning 1 teacher per 14 students)
  nonTeacherRatio: Decimal | number | string | null; // Ratio of non-teachers per student (e.g., 0.08 = 1/12.5)
  teacherMonthlySalary: Decimal | number | string | null;
  nonTeacherMonthlySalary: Decimal | number | string | null;
}

export interface StaffCostParams {
  baseStaffCost: Decimal | number | string;
  cpiRate: Decimal | number | string; // e.g., 0.03 for 3%
  cpiFrequency: 1 | 2 | 3; // Apply CPI every 1, 2, or 3 years
  baseYear: number; // Starting year (usually 2023 or 2028)
  startYear: number;
  endYear: number;
}

export interface StaffCostResult {
  year: number;
  staffCost: Decimal;
  cpiPeriod: number; // Which CPI period this year belongs to (0, 1, 2, ...)
}

/**
 * Calculate staff cost for a single year
 *
 * @param baseStaffCost - Base staff cost amount (e.g., 15_000_000)
 * @param cpiRate - CPI rate as decimal (e.g., 0.03 for 3%)
 * @param cpiFrequency - Frequency of CPI application: 1, 2, or 3 years
 * @param baseYear - Base year for CPI calculation (usually 2023 or 2028)
 * @param year - Year to calculate staff cost for
 * @returns Result containing the calculated staff cost for the year
 *
 * @example
 * const result = calculateStaffCostForYear(15_000_000, 0.03, 2, 2028, 2030);
 * // Returns: { success: true, data: 15450000 } // 15M × 1.03^1
 */
export function calculateStaffCostForYear(
  baseStaffCost: Decimal | number | string,
  cpiRate: Decimal | number | string,
  cpiFrequency: 1 | 2 | 3,
  baseYear: number,
  year: number
): Result<Decimal> {
  try {
    const base = toDecimal(baseStaffCost);
    const rate = toDecimal(cpiRate);

    // Validate inputs
    if (base.isNegative() || base.isZero()) {
      return error('Base staff cost must be positive');
    }

    if (rate.isNegative()) {
      return error('CPI rate cannot be negative');
    }

    if (year < baseYear) {
      return error('Year must be >= base year');
    }

    if (cpiFrequency !== 1 && cpiFrequency !== 2 && cpiFrequency !== 3) {
      return error('CPI frequency must be 1, 2, or 3 years');
    }

    // Calculate which CPI period this year belongs to
    // Period 0: baseYear to baseYear + frequency - 1
    // Period 1: baseYear + frequency to baseYear + 2*frequency - 1
    // etc.
    const yearsFromBase = year - baseYear;
    const cpiPeriod = Math.floor(yearsFromBase / cpiFrequency);

    // Calculate: base_staff_cost × (1 + cpi_rate)^period
    const escalationFactor = Decimal.add(1, rate).pow(cpiPeriod);
    const staffCost = base.times(escalationFactor);

    return success(staffCost);
  } catch (err) {
    return error(`Failed to calculate staff cost: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Calculate staff costs for multiple years
 *
 * @param params - StaffCostParams containing base cost, CPI rate, frequency, and year range
 * @returns Result containing array of staff cost results for each year
 *
 * @example
 * const result = calculateStaffCosts({
 *   baseStaffCost: 15_000_000,
 *   cpiRate: 0.03,
 *   cpiFrequency: 2,
 *   baseYear: 2028,
 *   startYear: 2028,
 *   endYear: 2032
 * });
 * // Returns array with staff costs for 2028-2032
 */
export function calculateStaffCosts(
  params: StaffCostParams
): Result<StaffCostResult[]> {
  try {
    const { baseStaffCost, cpiRate, cpiFrequency, baseYear, startYear, endYear } = params;

    // Validate year range
    if (startYear > endYear) {
      return error('Start year must be <= end year');
    }

    if (startYear < 2023 || endYear > 2052) {
      return error('Years must be between 2023 and 2052');
    }

    // ✅ FIX: Allow baseYear > startYear for relocation mode (baseYear=2028, startYear=2023)
    // For years before baseYear, we'll use the base value (no backward projection)
    // Note: This is valid for RELOCATION_2028 mode where staff cost base is calculated for 2028
    // but we project from 2023-2052
    // if (baseYear > startYear) {
    //   return error('Base year must be <= start year');
    // }

    const base = toDecimal(baseStaffCost);
    const rate = toDecimal(cpiRate);

    // Validate inputs
    if (base.isNegative() || base.isZero()) {
      return error('Base staff cost must be positive');
    }

    if (rate.isNegative()) {
      return error('CPI rate cannot be negative');
    }

    if (cpiFrequency !== 1 && cpiFrequency !== 2 && cpiFrequency !== 3) {
      return error('CPI frequency must be 1, 2, or 3 years');
    }

    const results: StaffCostResult[] = [];
    const escalationFactorBase = Decimal.add(1, rate);

    for (let year = startYear; year <= endYear; year++) {
      const yearsFromBase = year - baseYear;
      
      // ✅ FIX: Handle years before baseYear (e.g., 2023-2027 when baseYear=2028)
      // For relocation mode: use base value for years before relocation (no growth)
      // For years >= baseYear: apply CPI growth normally
      let cpiPeriod: number;
      if (yearsFromBase < 0) {
        // Year is before base year: use base value (period 0, no growth)
        cpiPeriod = 0;
      } else {
        // Year is >= base year: calculate CPI period normally
        cpiPeriod = Math.floor(yearsFromBase / cpiFrequency);
      }
      
      const escalationFactor = escalationFactorBase.pow(cpiPeriod);
      const staffCost = base.times(escalationFactor);

      results.push({
        year,
        staffCost,
        cpiPeriod,
      });
    }

    return success(results);
  } catch (err) {
    return error(`Failed to calculate staff costs: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Calculate staff cost base from curriculum plans for a specific year
 * 
 * Formula per curriculum:
 * - Number of teachers = students / teacherRatio
 * - Number of non-teachers = students / nonTeacherRatio
 * - Annual teacher cost = (students / teacherRatio) × teacherMonthlySalary × 12
 * - Annual non-teacher cost = (students / nonTeacherRatio) × nonTeacherMonthlySalary × 12
 * - Total curriculum staff cost = teacher cost + non-teacher cost
 * 
 * Total staff cost = sum across all curricula
 *
 * @param curriculumPlans - Array of curriculum plans with staff cost data
 * @param baseYear - Year to calculate staff cost base for (usually 2028 for relocation)
 * @returns Result containing the calculated base staff cost
 *
 * @example
 * const result = calculateStaffCostBaseFromCurriculum([
 *   {
 *     curriculumType: 'FR',
 *     studentsProjection: [{ year: 2028, students: 200 }],
 *     teacherRatio: 0.0714, // 1/14 = 0.0714 (1 teacher per 14 students)
 *     nonTeacherRatio: 0.0385, // 1/26 = 0.0385 (1 non-teacher per 26 students)
 *     teacherMonthlySalary: 20000,
 *     nonTeacherMonthlySalary: 15000
 *   }
 * ], 2028);
 * // Returns: { success: true, data: 3423076.92 } // (200 × 0.0714 × 20000 × 12) + (200 × 0.0385 × 15000 × 12)
 */
export function calculateStaffCostBaseFromCurriculum(
  curriculumPlans: CurriculumPlanForStaffCost[],
  baseYear: number
): Result<Decimal> {
  try {
    if (!curriculumPlans || curriculumPlans.length === 0) {
      return error('At least one curriculum plan is required');
    }

    if (baseYear < 2023 || baseYear > 2052) {
      return error('Base year must be between 2023 and 2052');
    }

    let totalStaffCost = new Decimal(0);

    for (const plan of curriculumPlans) {
      // Find students for the base year
      const yearData = plan.studentsProjection.find((p) => p.year === baseYear);
      if (!yearData) {
        return error(`Students projection not found for year ${baseYear} in curriculum ${plan.curriculumType}`);
      }

      const students = yearData.students;

      // Validate required fields
      if (
        plan.teacherRatio === null ||
        plan.teacherRatio === undefined ||
        plan.nonTeacherRatio === null ||
        plan.nonTeacherRatio === undefined ||
        plan.teacherMonthlySalary === null ||
        plan.teacherMonthlySalary === undefined ||
        plan.nonTeacherMonthlySalary === null ||
        plan.nonTeacherMonthlySalary === undefined
      ) {
        return error(
          `Staff cost configuration incomplete for curriculum ${plan.curriculumType}. ` +
            'Please configure teacher ratio, non-teacher ratio, and monthly salaries.'
        );
      }

      let teacherRatio = toDecimal(plan.teacherRatio);
      let nonTeacherRatio = toDecimal(plan.nonTeacherRatio);
      const teacherMonthlySalary = toDecimal(plan.teacherMonthlySalary);
      const nonTeacherMonthlySalary = toDecimal(plan.nonTeacherMonthlySalary);

      // 🐛 DEBUG: Log staff cost calculation details BEFORE fix
      console.log(`[STAFF COST DEBUG - RAW] ${plan.curriculumType}:`, {
        students,
        teacherRatioRaw: teacherRatio.toNumber(),
        nonTeacherRatioRaw: nonTeacherRatio.toNumber(),
        teacherMonthlySalary: teacherMonthlySalary.toNumber(),
        nonTeacherMonthlySalary: nonTeacherMonthlySalary.toNumber(),
      });

      // ✅ FIX: If ratio is > 1, it's likely stored as percentage (e.g., 7.14 instead of 0.0714)
      // Teacher ratio should be fraction (e.g., 0.0714 = 1/14 teachers per student)
      // Convert from percentage to decimal if needed
      if (teacherRatio.greaterThan(1)) {
        console.warn(`⚠️ Teacher ratio (${teacherRatio}) > 1, converting from percentage to decimal`);
        teacherRatio = teacherRatio.dividedBy(100);
      }
      
      if (nonTeacherRatio.greaterThan(1)) {
        console.warn(`⚠️ Non-teacher ratio (${nonTeacherRatio}) > 1, converting from percentage to decimal`);
        nonTeacherRatio = nonTeacherRatio.dividedBy(100);
      }

      // 🐛 DEBUG: Log staff cost calculation details AFTER fix
      console.log(`[STAFF COST DEBUG - FIXED] ${plan.curriculumType}:`, {
        students,
        teacherRatio: teacherRatio.toNumber(),
        nonTeacherRatio: nonTeacherRatio.toNumber(),
        teacherMonthlySalary: teacherMonthlySalary.toNumber(),
        nonTeacherMonthlySalary: nonTeacherMonthlySalary.toNumber(),
      });

      // Validate ratios are positive
      if (teacherRatio.isZero() || teacherRatio.isNegative()) {
        return error(`Teacher ratio must be positive for curriculum ${plan.curriculumType}`);
      }

      if (nonTeacherRatio.isZero() || nonTeacherRatio.isNegative()) {
        return error(`Non-teacher ratio must be positive for curriculum ${plan.curriculumType}`);
      }

      // Validate salaries are positive
      if (teacherMonthlySalary.isNegative() || teacherMonthlySalary.isZero()) {
        return error(`Teacher monthly salary must be positive for curriculum ${plan.curriculumType}`);
      }

      if (nonTeacherMonthlySalary.isNegative() || nonTeacherMonthlySalary.isZero()) {
        return error(`Non-teacher monthly salary must be positive for curriculum ${plan.curriculumType}`);
      }

      // Calculate number of staff members
      // teacherRatio is stored as a ratio (e.g., 0.0714 = 1/14, meaning 1 teacher per 14 students)
      // Formula: numTeachers = students × teacherRatio
      // Example: 200 students × 0.0714 = 14.28 teachers
      const numTeachers = toDecimal(students).times(teacherRatio);
      const numNonTeachers = toDecimal(students).times(nonTeacherRatio);

      // Calculate annual costs (monthly salary × 12 months)
      const annualTeacherCost = numTeachers.times(teacherMonthlySalary).times(12);
      const annualNonTeacherCost = numNonTeachers.times(nonTeacherMonthlySalary).times(12);

      // Add to total
      const curriculumStaffCost = annualTeacherCost.plus(annualNonTeacherCost);
      
      // 🐛 DEBUG: Log detailed calculation for verification
      console.log(`[STAFF COST CALCULATION] ${plan.curriculumType}:`, {
        students: students,
        numTeachers: numTeachers.toNumber(),
        numNonTeachers: numNonTeachers.toNumber(),
        teacherMonthlySalary: teacherMonthlySalary.toNumber(),
        nonTeacherMonthlySalary: nonTeacherMonthlySalary.toNumber(),
        annualTeacherCost: annualTeacherCost.toNumber(),
        annualNonTeacherCost: annualNonTeacherCost.toNumber(),
        curriculumStaffCost: curriculumStaffCost.toNumber(),
        runningTotal: totalStaffCost.plus(curriculumStaffCost).toNumber(),
      });
      
      totalStaffCost = totalStaffCost.plus(curriculumStaffCost);
    }
    
    // 🐛 DEBUG: Log final total
    console.log('[STAFF COST BASE] Final total:', {
      totalStaffCost: totalStaffCost.toNumber(),
      totalStaffCostFormatted: totalStaffCost.toNumber().toLocaleString('en-US'),
    });

    if (totalStaffCost.isZero()) {
      return error('Calculated staff cost is zero. Please check curriculum plan configuration.');
    }

    return success(totalStaffCost);
  } catch (err) {
    return error(
      `Failed to calculate staff cost base from curriculum: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
}

