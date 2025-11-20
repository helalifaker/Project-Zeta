/**
 * EBITDA Calculation
 * Calculates Earnings Before Interest, Taxes, Depreciation, and Amortization
 *
 * Formula: EBITDA(t) = revenue(t) - staff_cost(t) - rent(t) - opex(t)
 *
 * @example
 * Revenue: 50M SAR
 * Staff Cost: 15M SAR
 * Rent: 10M SAR
 * Opex: 5M SAR
 * EBITDA = 50M - 15M - 10M - 5M = 20M SAR
 */

import Decimal from 'decimal.js';
import { toDecimal, safeSubtract, safeDivide } from '../decimal-helpers';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';

export interface EBITDAParams {
  revenueByYear: Array<{ year: number; revenue: Decimal }>;
  staffCostByYear: Array<{ year: number; staffCost: Decimal }>;
  rentByYear: Array<{ year: number; rent: Decimal }>;
  opexByYear: Array<{ year: number; totalOpex: Decimal }>;
}

export interface EBITDAResult {
  year: number;
  revenue: Decimal;
  staffCost: Decimal;
  rent: Decimal;
  opex: Decimal;
  ebitda: Decimal;
  ebitdaMargin: Decimal; // (EBITDA / Revenue) × 100
}

/**
 * Calculate EBITDA for a single year
 *
 * @param revenue - Revenue for the year
 * @param staffCost - Staff cost for the year
 * @param rent - Rent for the year
 * @param opex - Total opex for the year
 * @returns Result containing the calculated EBITDA and margin for the year
 *
 * @example
 * const result = calculateEBITDAForYear(
 *   new Decimal(50_000_000),
 *   new Decimal(15_000_000),
 *   new Decimal(10_000_000),
 *   new Decimal(5_000_000)
 * );
 * // Returns: { success: true, data: { ebitda: 20000000, ebitdaMargin: 40, ... } }
 */
export function calculateEBITDAForYear(
  revenue: Decimal | number | string,
  staffCost: Decimal | number | string,
  rent: Decimal | number | string,
  opex: Decimal | number | string
): Result<{
  ebitda: Decimal;
  ebitdaMargin: Decimal;
}> {
  try {
    const revenueDecimal = toDecimal(revenue);
    const staffCostDecimal = toDecimal(staffCost);
    const rentDecimal = toDecimal(rent);
    const opexDecimal = toDecimal(opex);

    // Validate inputs (allows zero revenue, but not negative)
    if (revenueDecimal.isNegative()) {
      return error('Revenue cannot be negative');
    }

    if (staffCostDecimal.isNegative()) {
      return error('Staff cost cannot be negative');
    }

    if (rentDecimal.isNegative()) {
      return error('Rent cannot be negative');
    }

    if (opexDecimal.isNegative()) {
      return error('Opex cannot be negative');
    }

    // Calculate EBITDA: Revenue - Staff Cost - Rent - Opex
    const ebitda = safeSubtract(
      safeSubtract(safeSubtract(revenueDecimal, staffCostDecimal), rentDecimal),
      opexDecimal
    );
    
    // 🐛 DEBUG: Log calculation details for investigation
    if (revenueDecimal.greaterThan(0)) {
      console.log('[EBITDA DEBUG]', {
        revenue: revenueDecimal.toNumber(),
        staffCost: staffCostDecimal.toNumber(),
        rent: rentDecimal.toNumber(),
        opex: opexDecimal.toNumber(),
        ebitda: ebitda.toNumber(),
      });
    }

    // Calculate EBITDA Margin: (EBITDA / Revenue) × 100
    // If revenue is zero, margin is undefined (return 0 or error)
    let ebitdaMargin: Decimal;
    if (revenueDecimal.isZero()) {
      ebitdaMargin = new Decimal(0);
    } else {
      ebitdaMargin = safeDivide(ebitda, revenueDecimal).times(100);
    }

    return success({
      ebitda,
      ebitdaMargin,
    });
  } catch (err) {
    return error(`Failed to calculate EBITDA: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Calculate EBITDA for multiple years
 *
 * @param params - EBITDAParams containing revenue, staff cost, rent, and opex by year
 * @returns Result containing array of EBITDA results for each year
 *
 * @example
 * const result = calculateEBITDA({
 *   revenueByYear: [{ year: 2028, revenue: new Decimal(50_000_000) }],
 *   staffCostByYear: [{ year: 2028, staffCost: new Decimal(15_000_000) }],
 *   rentByYear: [{ year: 2028, rent: new Decimal(10_000_000) }],
 *   opexByYear: [{ year: 2028, totalOpex: new Decimal(5_000_000) }]
 * });
 */
export function calculateEBITDA(
  params: EBITDAParams
): Result<EBITDAResult[]> {
  try {
    const { revenueByYear, staffCostByYear, rentByYear, opexByYear } = params;

    // Validate all arrays have the same length
    const length = revenueByYear.length;
    if (staffCostByYear.length !== length || rentByYear.length !== length || opexByYear.length !== length) {
      return error('All input arrays must have the same length');
    }

    if (length === 0) {
      return error('At least one year of data is required');
    }

    // Create maps for quick lookup by year
    const staffCostMap = new Map<number, Decimal>();
    for (const item of staffCostByYear) {
      staffCostMap.set(item.year, item.staffCost);
    }

    const rentMap = new Map<number, Decimal>();
    for (const item of rentByYear) {
      rentMap.set(item.year, item.rent);
    }

    const opexMap = new Map<number, Decimal>();
    for (const item of opexByYear) {
      opexMap.set(item.year, item.totalOpex);
    }

    const results: EBITDAResult[] = [];

    for (const revenueItem of revenueByYear) {
      const year = revenueItem.year;
      const revenue = revenueItem.revenue;

      // Get corresponding costs for this year
      const staffCost = staffCostMap.get(year);
      if (staffCost === undefined) {
        return error(`Staff cost data not found for year ${year}`);
      }

      const rent = rentMap.get(year);
      if (rent === undefined) {
        return error(`Rent data not found for year ${year}`);
      }

      const opex = opexMap.get(year);
      if (opex === undefined) {
        return error(`Opex data not found for year ${year}`);
      }

      // Calculate EBITDA for this year
      const yearResult = calculateEBITDAForYear(revenue, staffCost, rent, opex);

      if (!yearResult.success) {
        return yearResult;
      }

      results.push({
        year,
        revenue,
        staffCost,
        rent,
        opex,
        ebitda: yearResult.data.ebitda,
        ebitdaMargin: yearResult.data.ebitdaMargin,
      });
    }

    return success(results);
  } catch (err) {
    return error(`Failed to calculate EBITDA: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

