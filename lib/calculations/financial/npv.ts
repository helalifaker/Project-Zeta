/**
 * NPV (Net Present Value) Calculation
 * Calculates the present value of future cash flows or rent amounts
 *
 * Formula: NPV = Σ(amount(t) / (1 + discount_rate)^(t - base_year))
 * For 2028-2052 period (25 years), base_year = 2027
 * Note: 2028 = year 1 (t - 2027 = 1), 2029 = year 2, etc.
 *
 * @example
 * Cash flows: [5M, 6M, 7M] for years 2028-2030
 * Discount rate: 8%
 * Year 2028: 5M / 1.08^1 = 4.63M
 * Year 2029: 6M / 1.08^2 = 5.14M
 * Year 2030: 7M / 1.08^3 = 5.56M
 * NPV = 4.63M + 5.14M + 5.56M = 15.33M
 */

import Decimal from 'decimal.js';
import { toDecimal } from '../decimal-helpers';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';

export interface NPVParams {
  amountsByYear: Array<{ year: number; amount: Decimal }>;
  discountRate: Decimal | number | string; // Default: 0.08 (8%)
  startYear?: number; // Default: 2028
  endYear?: number; // Default: 2052
  baseYear?: number; // Default: 2027 (for discount factor calculation)
}

export interface NPVResult {
  npv: Decimal;
  presentValues: Array<{
    year: number;
    amount: Decimal;
    discountFactor: Decimal;
    presentValue: Decimal;
  }>;
  totalYears: number;
  discountRate: Decimal;
}

/**
 * Calculate present value for a single year
 *
 * @param amount - Cash flow or rent amount for the year
 * @param year - Year to calculate present value for
 * @param discountRate - Discount rate as decimal (e.g., 0.08 for 8%)
 * @param baseYear - Base year for discount calculation (default: 2027)
 * @returns Result containing present value and discount factor
 *
 * @example
 * const result = calculateNPVForYear(
 *   new Decimal(5_000_000),
 *   2028,
 *   0.08,
 *   2027
 * );
 * // Returns: { success: true, data: { presentValue: 4629629.63, discountFactor: 1.08 } }
 */
export function calculateNPVForYear(
  amount: Decimal | number | string,
  year: number,
  discountRate: Decimal | number | string,
  baseYear: number = 2027
): Result<{
  presentValue: Decimal;
  discountFactor: Decimal;
}> {
  try {
    const amountDecimal = toDecimal(amount);
    const rateDecimal = toDecimal(discountRate);

    // Validate inputs
    if (year < 2023 || year > 2052) {
      return error('Year must be between 2023 and 2052');
    }

    if (rateDecimal.isNegative() || rateDecimal.greaterThan(1)) {
      return error('Discount rate must be between 0 and 1 (0% to 100%)');
    }

    if (year < baseYear) {
      return error('Year must be >= base year');
    }

    // Calculate discount factor: (1 + discount_rate)^(t - base_year)
    const yearsFromBase = year - baseYear;
    const discountFactor = Decimal.add(1, rateDecimal).pow(yearsFromBase);

    // Calculate present value: amount / discount_factor
    const presentValue = amountDecimal.div(discountFactor);

    return success({
      presentValue,
      discountFactor,
    });
  } catch (err) {
    return error(`Failed to calculate NPV for year: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Calculate NPV for multiple years
 *
 * @param params - NPVParams containing amounts by year, discount rate, and year range
 * @returns Result containing NPV, present values breakdown, and metadata
 *
 * @example
 * const result = calculateNPV({
 *   amountsByYear: [
 *     { year: 2028, amount: new Decimal(5_000_000) },
 *     { year: 2029, amount: new Decimal(6_000_000) },
 *     { year: 2030, amount: new Decimal(7_000_000) }
 *   ],
 *   discountRate: 0.08,
 *   startYear: 2028,
 *   endYear: 2030
 * });
 */
export function calculateNPV(
  params: NPVParams
): Result<NPVResult> {
  try {
    const {
      amountsByYear,
      discountRate,
      startYear = 2028,
      endYear = 2052,
      baseYear = 2027,
    } = params;

    // Validate year range
    if (startYear > endYear) {
      return error('Start year must be <= end year');
    }

    if (startYear < 2023 || endYear > 2052) {
      return error('Years must be between 2023 and 2052');
    }

    if (startYear < baseYear) {
      return error('Start year must be >= base year');
    }

    const rateDecimal = toDecimal(discountRate);

    // Validate discount rate
    if (rateDecimal.isNegative() || rateDecimal.greaterThan(1)) {
      return error('Discount rate must be between 0 and 1 (0% to 100%)');
    }

    if (amountsByYear.length === 0) {
      return error('At least one year of data is required');
    }

    // Create map for quick lookup by year
    const amountsMap = new Map<number, Decimal>();
    for (const item of amountsByYear) {
      amountsMap.set(item.year, item.amount);
    }

    const presentValues: Array<{
      year: number;
      amount: Decimal;
      discountFactor: Decimal;
      presentValue: Decimal;
    }> = [];

    let npv = new Decimal(0);
    let validYearCount = 0;

    // Calculate NPV for each year in the range
    for (let year = startYear; year <= endYear; year++) {
      const amount = amountsMap.get(year);

      // Skip years without data (allow partial data)
      if (amount === undefined) {
        continue;
      }

      // Calculate present value for this year
      const yearResult = calculateNPVForYear(amount, year, rateDecimal, baseYear);

      if (!yearResult.success) {
        return yearResult;
      }

      const { presentValue, discountFactor } = yearResult.data;

      presentValues.push({
        year,
        amount,
        discountFactor,
        presentValue,
      });

      npv = npv.plus(presentValue);
      validYearCount++;
    }

    if (validYearCount === 0) {
      return error('No valid data found for the specified year range');
    }

    return success({
      npv,
      presentValues,
      totalYears: validYearCount,
      discountRate: rateDecimal,
    });
  } catch (err) {
    return error(`Failed to calculate NPV: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

