/**
 * Revenue Share Rent Model
 * Calculates rent as a percentage of revenue
 *
 * Formula: rent(t) = revenue(t) × revenue_share_percent
 *
 * @example
 * Revenue: 10M SAR, Share: 8%
 * Rent: 10M × 0.08 = 800K SAR
 */

import Decimal from 'decimal.js';
import { toDecimal } from '../decimal-helpers';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';

export interface RevenueShareParams {
  revenueByYear: Array<{ year: number; revenue: Decimal | number | string }>;
  revenueSharePercent: Decimal | number | string; // e.g., 0.08 for 8%
}

export interface RevenueShareResult {
  year: number;
  revenue: Decimal;
  rent: Decimal;
  rentLoad: Decimal; // rent / revenue × 100
}

/**
 * Calculate rent for a single year using revenue share
 */
export function calculateRevenueShareRentForYear(
  revenue: Decimal | number | string,
  revenueSharePercent: Decimal | number | string
): Result<Decimal> {
  try {
    const rev = toDecimal(revenue);
    const share = toDecimal(revenueSharePercent);

    // Validate inputs
    if (rev.isNegative()) {
      return error('Revenue cannot be negative');
    }

    if (share.isNegative() || share.greaterThan(1)) {
      return error('Revenue share must be between 0 and 1 (0% to 100%)');
    }

    // Calculate: revenue × revenue_share_percent
    const rent = rev.times(share);

    return success(rent);
  } catch (err) {
    return error(`Failed to calculate revenue share rent: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Calculate rent for multiple years using revenue share
 */
export function calculateRevenueShareRent(
  params: RevenueShareParams
): Result<RevenueShareResult[]> {
  try {
    const { revenueByYear, revenueSharePercent } = params;

    if (revenueByYear.length === 0) {
      return error('Revenue data is required');
    }

    const share = toDecimal(revenueSharePercent);

    // Validate share percentage
    if (share.isNegative() || share.greaterThan(1)) {
      return error('Revenue share must be between 0 and 1 (0% to 100%)');
    }

    const results: RevenueShareResult[] = [];

    for (const item of revenueByYear) {
      const revenue = toDecimal(item.revenue);

      // Validate revenue
      if (revenue.isNegative()) {
        return error(`Revenue for year ${item.year} cannot be negative`);
      }

      // Calculate rent
      const rent = revenue.times(share);

      // Calculate rent load (rent / revenue × 100)
      const rentLoad = revenue.isZero()
        ? new Decimal(0)
        : rent.div(revenue).times(100);

      results.push({
        year: item.year,
        revenue,
        rent,
        rentLoad,
      });
    }

    return success(results);
  } catch (err) {
    return error(`Failed to calculate revenue share rent: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Calculate total rent over a period (sum of all years)
 */
export function calculateRevenueShareTotalRent(
  params: RevenueShareParams
): Result<Decimal> {
  const result = calculateRevenueShareRent(params);

  if (!result.success) {
    return result;
  }

  try {
    const total = result.data.reduce(
      (sum, item) => sum.plus(item.rent),
      new Decimal(0)
    );

    return success(total);
  } catch (err) {
    return error(`Failed to calculate total rent: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

