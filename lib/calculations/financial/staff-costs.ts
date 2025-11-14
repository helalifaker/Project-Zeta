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

    if (baseYear > startYear) {
      return error('Base year must be <= start year');
    }

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
      const cpiPeriod = Math.floor(yearsFromBase / cpiFrequency);
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

