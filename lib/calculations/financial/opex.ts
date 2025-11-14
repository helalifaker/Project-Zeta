/**
 * Opex Calculation
 * Calculates operating expenses with variable % of revenue and fixed amounts
 *
 * Formula: opex(t) = revenue(t) × variable_opex_percent + sum(fixed_amounts)
 *
 * @example
 * Revenue: 50M SAR, Sub-accounts:
 * - Marketing: 3% of revenue (variable) = 1.5M
 * - Utilities: 200K fixed = 0.2M
 * Total Opex: 1.5M + 0.2M = 1.7M
 */

import Decimal from 'decimal.js';
import { toDecimal, safeMultiply } from '../decimal-helpers';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';

export interface OpexSubAccount {
  subAccountName: string;
  percentOfRevenue: Decimal | number | string | null; // null if fixed
  isFixed: boolean;
  fixedAmount: Decimal | number | string | null; // null if percentage-based
}

export interface OpexParams {
  revenueByYear: Array<{ year: number; revenue: Decimal }>;
  subAccounts: OpexSubAccount[];
}

export interface OpexResult {
  year: number;
  revenue: Decimal;
  variableOpex: Decimal; // Sum of %-based sub-accounts
  fixedOpex: Decimal; // Sum of fixed sub-accounts
  totalOpex: Decimal;
  breakdown: Array<{
    subAccountName: string;
    amount: Decimal;
    type: 'variable' | 'fixed';
  }>;
}

/**
 * Calculate opex for a single year
 *
 * @param revenue - Revenue for the year
 * @param subAccounts - Array of opex sub-accounts (variable % or fixed)
 * @returns Result containing the calculated opex for the year
 *
 * @example
 * const result = calculateOpexForYear(
 *   new Decimal(50_000_000),
 *   [
 *     { subAccountName: 'Marketing', percentOfRevenue: 0.03, isFixed: false, fixedAmount: null },
 *     { subAccountName: 'Utilities', percentOfRevenue: null, isFixed: true, fixedAmount: 200_000 }
 *   ]
 * );
 * // Returns: { success: true, data: { totalOpex: 1700000, ... } }
 */
export function calculateOpexForYear(
  revenue: Decimal | number | string,
  subAccounts: OpexSubAccount[]
): Result<{
  variableOpex: Decimal;
  fixedOpex: Decimal;
  totalOpex: Decimal;
  breakdown: Array<{
    subAccountName: string;
    amount: Decimal;
    type: 'variable' | 'fixed';
  }>;
}> {
  try {
    const revenueDecimal = toDecimal(revenue);

    // Validate revenue
    if (revenueDecimal.isNegative()) {
      return error('Revenue cannot be negative');
    }

    let variableOpex = new Decimal(0);
    let fixedOpex = new Decimal(0);
    const breakdown: Array<{
      subAccountName: string;
      amount: Decimal;
      type: 'variable' | 'fixed';
    }> = [];

    // Process each sub-account
    for (const subAccount of subAccounts) {
      if (subAccount.isFixed) {
        // Fixed amount
        if (subAccount.fixedAmount === null || subAccount.fixedAmount === undefined) {
          return error(`Fixed amount is required for fixed sub-account: ${subAccount.subAccountName}`);
        }

        const fixedAmount = toDecimal(subAccount.fixedAmount);
        if (fixedAmount.isNegative()) {
          return error(`Fixed amount cannot be negative for sub-account: ${subAccount.subAccountName}`);
        }

        fixedOpex = fixedOpex.plus(fixedAmount);
        breakdown.push({
          subAccountName: subAccount.subAccountName,
          amount: fixedAmount,
          type: 'fixed',
        });
      } else {
        // Variable % of revenue
        if (subAccount.percentOfRevenue === null || subAccount.percentOfRevenue === undefined) {
          return error(`Percentage is required for variable sub-account: ${subAccount.subAccountName}`);
        }

        const percent = toDecimal(subAccount.percentOfRevenue);
        if (percent.isNegative()) {
          return error(`Percentage cannot be negative for sub-account: ${subAccount.subAccountName}`);
        }

        // Calculate: revenue × percent
        const variableAmount = safeMultiply(revenueDecimal, percent);
        variableOpex = variableOpex.plus(variableAmount);
        breakdown.push({
          subAccountName: subAccount.subAccountName,
          amount: variableAmount,
          type: 'variable',
        });
      }
    }

    const totalOpex = variableOpex.plus(fixedOpex);

    return success({
      variableOpex,
      fixedOpex,
      totalOpex,
      breakdown,
    });
  } catch (err) {
    return error(`Failed to calculate opex: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Calculate opex for multiple years
 *
 * @param params - OpexParams containing revenue by year and sub-accounts
 * @returns Result containing array of opex results for each year
 *
 * @example
 * const result = calculateOpex({
 *   revenueByYear: [
 *     { year: 2028, revenue: new Decimal(50_000_000) },
 *     { year: 2029, revenue: new Decimal(52_000_000) }
 *   ],
 *   subAccounts: [
 *     { subAccountName: 'Marketing', percentOfRevenue: 0.03, isFixed: false, fixedAmount: null },
 *     { subAccountName: 'Utilities', percentOfRevenue: null, isFixed: true, fixedAmount: 200_000 }
 *   ]
 * });
 */
export function calculateOpex(
  params: OpexParams
): Result<OpexResult[]> {
  try {
    const { revenueByYear, subAccounts } = params;

    if (revenueByYear.length === 0) {
      return error('Revenue data is required');
    }

    // Validate sub-accounts structure
    for (const subAccount of subAccounts) {
      if (subAccount.isFixed && (subAccount.fixedAmount === null || subAccount.fixedAmount === undefined)) {
        return error(`Fixed amount is required for fixed sub-account: ${subAccount.subAccountName}`);
      }

      if (!subAccount.isFixed && (subAccount.percentOfRevenue === null || subAccount.percentOfRevenue === undefined)) {
        return error(`Percentage is required for variable sub-account: ${subAccount.subAccountName}`);
      }
    }

    const results: OpexResult[] = [];

    for (const revenueItem of revenueByYear) {
      const yearResult = calculateOpexForYear(revenueItem.revenue, subAccounts);

      if (!yearResult.success) {
        return yearResult;
      }

      results.push({
        year: revenueItem.year,
        revenue: revenueItem.revenue,
        variableOpex: yearResult.data.variableOpex,
        fixedOpex: yearResult.data.fixedOpex,
        totalOpex: yearResult.data.totalOpex,
        breakdown: yearResult.data.breakdown,
      });
    }

    return success(results);
  } catch (err) {
    return error(`Failed to calculate opex: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

