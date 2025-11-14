/**
 * Cash Flow Calculation
 * Calculates cash flow from EBITDA, accounting for capex, interest, and taxes
 *
 * Formula: cash_flow(t) = EBITDA(t) - capex(t) - interest(t) - taxes(t)
 * Taxes: taxes(t) = max(0, EBITDA(t) - interest(t)) × tax_rate (only on positive profit)
 *
 * @example
 * EBITDA: 20M SAR
 * Capex: 2M SAR
 * Interest: 0 SAR (placeholder for future)
 * Tax Rate: 20%
 * Taxable Income: 20M - 0 = 20M
 * Taxes: 20M × 0.20 = 4M
 * Cash Flow = 20M - 2M - 0 - 4M = 14M SAR
 */

import Decimal from 'decimal.js';
import { toDecimal, safeSubtract, max } from '../decimal-helpers';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';

export interface CapexItem {
  year: number;
  amount: Decimal | number | string;
  category?: string;
}

export interface CashFlowParams {
  ebitdaByYear: Array<{ year: number; ebitda: Decimal }>;
  capexItems: CapexItem[];
  interestByYear?: Array<{ year: number; interest: Decimal }>; // Optional, defaults to zero
  taxRate: Decimal | number | string; // From admin settings (e.g., 0.20 for 20%)
}

export interface CashFlowResult {
  year: number;
  ebitda: Decimal;
  capex: Decimal;
  interest: Decimal;
  taxes: Decimal;
  cashFlow: Decimal;
}

/**
 * Calculate cash flow for a single year
 *
 * @param ebitda - EBITDA for the year
 * @param capex - Capex amount for the year (can be zero)
 * @param interest - Interest expense for the year (optional, defaults to zero)
 * @param taxRate - Tax rate as decimal (e.g., 0.20 for 20%)
 * @returns Result containing the calculated cash flow components for the year
 *
 * @example
 * const result = calculateCashFlowForYear(
 *   new Decimal(20_000_000),
 *   new Decimal(2_000_000),
 *   new Decimal(0),
 *   new Decimal(0.20)
 * );
 * // Returns: { success: true, data: { cashFlow: 14000000, taxes: 4000000, ... } }
 */
export function calculateCashFlowForYear(
  ebitda: Decimal | number | string,
  capex: Decimal | number | string,
  interest: Decimal | number | string | null | undefined,
  taxRate: Decimal | number | string
): Result<{
  interest: Decimal;
  taxes: Decimal;
  cashFlow: Decimal;
}> {
  try {
    const ebitdaDecimal = toDecimal(ebitda);
    const capexDecimal = toDecimal(capex);
    const interestDecimal = interest != null ? toDecimal(interest) : new Decimal(0);
    const taxRateDecimal = toDecimal(taxRate);

    // Validate inputs
    if (capexDecimal.isNegative()) {
      return error('Capex cannot be negative');
    }

    if (interestDecimal.isNegative()) {
      return error('Interest cannot be negative');
    }

    if (taxRateDecimal.isNegative() || taxRateDecimal.greaterThan(1)) {
      return error('Tax rate must be between 0 and 1 (0% to 100%)');
    }

    // Calculate taxable income: EBITDA - Interest
    const taxableIncome = safeSubtract(ebitdaDecimal, interestDecimal);

    // Calculate taxes: max(0, taxable_income) × tax_rate
    // Only tax positive profit (losses have zero tax)
    const taxableIncomePositive = max(taxableIncome, 0);
    const taxes = taxableIncomePositive.times(taxRateDecimal);

    // Calculate cash flow: EBITDA - Capex - Interest - Taxes
    const cashFlow = safeSubtract(
      safeSubtract(safeSubtract(ebitdaDecimal, capexDecimal), interestDecimal),
      taxes
    );

    return success({
      interest: interestDecimal,
      taxes,
      cashFlow,
    });
  } catch (err) {
    return error(`Failed to calculate cash flow: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Calculate cash flow for multiple years
 *
 * @param params - CashFlowParams containing EBITDA by year, capex items, interest (optional), and tax rate
 * @returns Result containing array of cash flow results for each year
 *
 * @example
 * const result = calculateCashFlow({
 *   ebitdaByYear: [{ year: 2028, ebitda: new Decimal(20_000_000) }],
 *   capexItems: [{ year: 2028, amount: new Decimal(2_000_000), category: 'BUILDING' }],
 *   interestByYear: [{ year: 2028, interest: new Decimal(0) }],
 *   taxRate: 0.20
 * });
 */
export function calculateCashFlow(
  params: CashFlowParams
): Result<CashFlowResult[]> {
  try {
    const { ebitdaByYear, capexItems, interestByYear, taxRate } = params;

    if (ebitdaByYear.length === 0) {
      return error('EBITDA data is required');
    }

    // Create maps for quick lookup by year
    const capexMap = new Map<number, Decimal>();
    for (const item of capexItems) {
      const existing = capexMap.get(item.year);
      const amount = toDecimal(item.amount);

      if (amount.isNegative()) {
        return error(`Capex amount cannot be negative for year ${item.year}`);
      }

      // Sum capex if multiple items exist for same year
      if (existing) {
        capexMap.set(item.year, existing.plus(amount));
      } else {
        capexMap.set(item.year, amount);
      }
    }

    const interestMap = new Map<number, Decimal>();
    if (interestByYear) {
      for (const item of interestByYear) {
        const amount = toDecimal(item.interest);

        if (amount.isNegative()) {
          return error(`Interest cannot be negative for year ${item.year}`);
        }

        interestMap.set(item.year, amount);
      }
    }

    const results: CashFlowResult[] = [];

    for (const ebitdaItem of ebitdaByYear) {
      const year = ebitdaItem.year;
      const ebitda = ebitdaItem.ebitda;

      // Get capex for this year (default to zero if not found)
      const capex = capexMap.get(year) || new Decimal(0);

      // Get interest for this year (default to zero if not found)
      const interest = interestMap.get(year) || new Decimal(0);

      // Calculate cash flow for this year
      const yearResult = calculateCashFlowForYear(ebitda, capex, interest, taxRate);

      if (!yearResult.success) {
        return yearResult;
      }

      results.push({
        year,
        ebitda,
        capex,
        interest: yearResult.data.interest,
        taxes: yearResult.data.taxes,
        cashFlow: yearResult.data.cashFlow,
      });
    }

    return success(results);
  } catch (err) {
    return error(`Failed to calculate cash flow: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

