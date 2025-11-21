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

/**
 * FORMULA-002: OpEx Percentage Storage Convention
 *
 * IMPORTANT: OpEx percentages are stored as WHOLE NUMBERS, not decimals.
 *
 * Storage Format:
 * - OpEx Sub-Accounts: `6` means 6% (stored as whole number)
 * - This differs from other rates in the system which use decimals (e.g., 0.06 for 6%)
 *
 * Historical Reason:
 * - This convention was established early in the project for user-friendliness
 * - Users enter "6" in the UI to mean 6%, not "0.06"
 * - Maintained for backward compatibility with existing data
 *
 * Database Schema:
 * - opex_sub_accounts.percentOfRevenue: Decimal(5,2) stores whole number (e.g., 6.00)
 * - Valid range: 0-100 (representing 0%-100%)
 *
 * Calculation Logic:
 * - MUST divide by 100 when calculating: `percentDecimal = percent / 100`
 * - Example: 6 (stored) → 0.06 (calculated) → revenue × 0.06
 *
 * Other Rates (for comparison):
 * - zakatRate: stored as 0.025 for 2.5%
 * - debtInterestRate: stored as 0.05 for 5%
 * - bankDepositInterestRate: stored as 0.02 for 2%
 *
 * Future Consideration:
 * - Standardizing all rates to decimal format is possible but requires:
 *   1. Database migration script
 *   2. UI changes (convert user input: input/100)
 *   3. Testing all OpEx calculations
 *   4. Backward compatibility plan
 * - Currently in technical debt backlog
 */

export interface OpexSubAccount {
  subAccountName: string;
  /**
   * Percentage of revenue as WHOLE NUMBER (e.g., 6 for 6%, NOT 0.06)
   * Only used if isFixed = false
   * Valid range: 0-100
   *
   * NOTE: This differs from other rates which use decimals (0.06 for 6%)
   * See FORMULA-002 documentation above for details
   */
  percentOfRevenue: Decimal | number | string | null; // null if fixed
  isFixed: boolean;
  /**
   * Fixed annual amount in SAR
   * Only used if isFixed = true
   */
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

    // 🐛 DEBUG: Log opex calculation details
    if (revenueDecimal.greaterThan(0)) {
      console.log('[OPEX DEBUG] Calculating opex:', {
        revenue: revenueDecimal.toNumber(),
        subAccountsCount: subAccounts.length,
      });

      subAccounts.forEach((sa, idx) => {
        console.log(`  [OPEX SUB-ACCOUNT ${idx + 1}]`, {
          name: sa.subAccountName,
          isFixed: sa.isFixed,
          percentOfRevenue: sa.percentOfRevenue,
          fixedAmount: sa.fixedAmount,
        });
      });
    }

    // Process each sub-account
    for (const subAccount of subAccounts) {
      if (subAccount.isFixed) {
        // Fixed amount
        if (subAccount.fixedAmount === null || subAccount.fixedAmount === undefined) {
          return error(
            `Fixed amount is required for fixed sub-account: ${subAccount.subAccountName}`
          );
        }

        const fixedAmount = toDecimal(subAccount.fixedAmount);
        if (fixedAmount.isNegative()) {
          return error(
            `Fixed amount cannot be negative for sub-account: ${subAccount.subAccountName}`
          );
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
          return error(
            `Percentage is required for variable sub-account: ${subAccount.subAccountName}`
          );
        }

        const percent = toDecimal(subAccount.percentOfRevenue);

        // FORMULA-002: Validate range (0-100 for whole number percentages)
        if (percent.isNegative() || percent.greaterThan(100)) {
          return error(
            `Percentage must be between 0 and 100 for sub-account: ${subAccount.subAccountName}. ` +
              `Got: ${percent.toNumber()}. Remember: Enter 6 for 6%, not 0.06.`
          );
        }

        // ✅ FORMULA-002: percentOfRevenue is stored as whole number (6 = 6%, not 0.06)
        // Step 1: Convert whole number to decimal (6 → 0.06)
        const percentDecimal = percent.dividedBy(100);

        // Step 2: Calculate variable amount (revenue × decimal percentage)
        // Example: 50,000,000 SAR × 0.06 = 3,000,000 SAR
        const variableAmount = safeMultiply(revenueDecimal, percentDecimal);

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
    return error(
      `Failed to calculate opex: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
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
export function calculateOpex(params: OpexParams): Result<OpexResult[]> {
  try {
    const { revenueByYear, subAccounts } = params;

    if (revenueByYear.length === 0) {
      return error('Revenue data is required');
    }

    // Validate sub-accounts structure
    for (const subAccount of subAccounts) {
      if (
        subAccount.isFixed &&
        (subAccount.fixedAmount === null || subAccount.fixedAmount === undefined)
      ) {
        return error(
          `Fixed amount is required for fixed sub-account: ${subAccount.subAccountName}`
        );
      }

      if (
        !subAccount.isFixed &&
        (subAccount.percentOfRevenue === null || subAccount.percentOfRevenue === undefined)
      ) {
        return error(
          `Percentage is required for variable sub-account: ${subAccount.subAccountName}`
        );
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
    return error(
      `Failed to calculate opex: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
}

/**
 * FORMULA-002: Helper function to format OpEx percentage for display
 *
 * Formats OpEx percentage from stored whole number to display format
 *
 * @param value - Whole number percentage (e.g., 6)
 * @returns Formatted string (e.g., "6.00%")
 *
 * @example
 * formatOpExPercentage(6); // "6.00%"
 * formatOpExPercentage(3.5); // "3.50%"
 * formatOpExPercentage(12.75); // "12.75%"
 */
export function formatOpExPercentage(value: number | Decimal): string {
  const decimal = value instanceof Decimal ? value : new Decimal(value);
  return `${decimal.toFixed(2)}%`;
}

/**
 * FORMULA-002: Helper function to validate OpEx percentage input
 *
 * Validates that user input is in correct range for whole number percentage
 *
 * @param value - User input value
 * @returns Error message if invalid, null if valid
 *
 * @example
 * validateOpExPercentage(6); // null (valid)
 * validateOpExPercentage(0.06); // "Enter as whole number (6 for 6%, not 0.06)"
 * validateOpExPercentage(150); // "Must be between 0 and 100"
 * validateOpExPercentage(-5); // "Must be between 0 and 100"
 */
export function validateOpExPercentage(value: number | Decimal | string): string | null {
  const decimal = toDecimal(value);

  if (decimal.isNaN()) {
    return 'Invalid number';
  }

  if (decimal.lessThan(0) || decimal.greaterThan(100)) {
    return 'Must be between 0 and 100';
  }

  // Warn if user likely entered decimal format (0.06 instead of 6)
  if (decimal.greaterThan(0) && decimal.lessThan(1)) {
    return 'Enter as whole number (e.g., 6 for 6%, not 0.06)';
  }

  return null; // Valid
}
