/**
 * Cash Flow Calculation
 * Calculates Cash Flow Statement with Operating/Investing/Financing breakdown
 *
 * Formula:
 * - Net Income = EBITDA - Depreciation - Interest Expense + Interest Income - Zakat
 * - Operating Cash Flow = Net Income + Depreciation - Working Capital Changes
 * - Investing Cash Flow = -Capex
 * - Financing Cash Flow = Debt Changes
 * - Net Cash Flow = Operating + Investing + Financing
 *
 * Working Capital Changes:
 * - Positive = working capital increase (uses cash, reduces cash flow)
 * - Negative = working capital decrease (provides cash, increases cash flow)
 *
 * @example
 * EBITDA: 20M SAR
 * Depreciation: 2M SAR
 * Interest Expense: 500K SAR
 * Interest Income: 100K SAR
 * Zakat Rate: 2.5%
 * Capex: 3M SAR
 * Working Capital Change: -500K SAR (decrease, provides cash)
 * Debt Change: 1M SAR (borrowing, increases cash)
 *
 * Net Income = 20M - 2M - 500K + 100K - 437.5K = 17.1625M SAR
 * Operating Cash Flow = 17.1625M + 2M - (-500K) = 19.6625M SAR
 * Investing Cash Flow = -3M SAR
 * Financing Cash Flow = 1M SAR
 * Net Cash Flow = 19.6625M - 3M + 1M = 17.6625M SAR
 */

import Decimal from 'decimal.js';
import { toDecimal, max } from '../decimal-helpers';
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
  
  // ✅ FIX 2: Required for proper Cash Flow calculation
  depreciationByYear: Array<{ year: number; depreciation: Decimal }>;
  interestExpenseByYear: Array<{ year: number; interestExpense: Decimal }>;
  interestIncomeByYear: Array<{ year: number; interestIncome: Decimal }>;
  workingCapitalChanges: Array<{ year: number; change: Decimal }>; 
  // Positive = working capital increase (uses cash, reduces cash flow)
  // Negative = working capital decrease (provides cash, increases cash flow)
  debtChanges: Array<{ year: number; change: Decimal }>; 
  // Positive = borrowing (increases cash), Negative = paydown (decreases cash)
  
  zakatRate: Decimal | number | string; // From admin settings (e.g., 0.025 for 2.5%)
  
  // ⚠️ DEPRECATED: Use interestExpenseByYear instead
  interestByYear?: Array<{ year: number; interest: Decimal }>; 
}

export interface CashFlowResult {
  year: number;
  
  // P&L Components
  ebitda: Decimal;
  depreciation: Decimal;
  interestExpense: Decimal;
  interestIncome: Decimal;
  zakat: Decimal;
  netIncome: Decimal; // EBITDA - Depreciation - Interest Expense + Interest Income - Zakat
  
  // Working Capital
  workingCapitalChange: Decimal; // Positive = uses cash, Negative = provides cash
  
  // Cash Flow Statement
  operatingCashFlow: Decimal; // Net Income + Depreciation - Working Capital Changes
  investingCashFlow: Decimal; // -Capex
  financingCashFlow: Decimal; // Debt Changes
  netCashFlow: Decimal; // Operating + Investing + Financing
  
  // Legacy fields (for backward compatibility)
  capex: Decimal;
  interest: Decimal; // Same as interestExpense (deprecated)
  cashFlow: Decimal; // Same as netCashFlow (deprecated)
}

/**
 * Calculate cash flow for a single year with Operating/Investing/Financing breakdown
 *
 * @param ebitda - EBITDA for the year
 * @param depreciation - Depreciation for the year
 * @param interestExpense - Interest expense for the year
 * @param interestIncome - Interest income for the year
 * @param zakatRate - Zakat rate as decimal (e.g., 0.025 for 2.5%)
 * @param workingCapitalChange - Working capital change (positive = uses cash, negative = provides cash)
 * @param capex - Capex amount for the year
 * @param debtChange - Debt change (positive = borrowing, negative = paydown)
 * @returns Result containing the calculated cash flow components for the year
 *
 * @example
 * const result = calculateCashFlowForYear(
 *   new Decimal(20_000_000), // EBITDA
 *   new Decimal(2_000_000), // Depreciation
 *   new Decimal(500_000), // Interest Expense
 *   new Decimal(100_000), // Interest Income
 *   new Decimal(0.025), // Zakat Rate
 *   new Decimal(-500_000), // Working Capital Change (decrease, provides cash)
 *   new Decimal(3_000_000), // Capex
 *   new Decimal(1_000_000) // Debt Change (borrowing)
 * );
 */
export function calculateCashFlowForYear(
  ebitda: Decimal | number | string,
  depreciation: Decimal | number | string,
  interestExpense: Decimal | number | string,
  interestIncome: Decimal | number | string,
  zakatRate: Decimal | number | string,
  workingCapitalChange: Decimal | number | string,
  capex: Decimal | number | string,
  debtChange: Decimal | number | string
): Result<{
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
}> {
  try {
    const ebitdaDecimal = toDecimal(ebitda);
    const depreciationDecimal = toDecimal(depreciation);
    const interestExpenseDecimal = toDecimal(interestExpense);
    const interestIncomeDecimal = toDecimal(interestIncome);
    const zakatRateDecimal = toDecimal(zakatRate);
    const workingCapitalChangeDecimal = toDecimal(workingCapitalChange);
    const capexDecimal = toDecimal(capex);
    const debtChangeDecimal = toDecimal(debtChange);

    // Validate inputs
    if (depreciationDecimal.isNegative()) {
      return error('Depreciation cannot be negative');
    }

    if (interestExpenseDecimal.isNegative()) {
      return error('Interest expense cannot be negative');
    }

    if (interestIncomeDecimal.isNegative()) {
      return error('Interest income cannot be negative');
    }

    if (capexDecimal.isNegative()) {
      return error('Capex cannot be negative');
    }

    if (zakatRateDecimal.isNegative() || zakatRateDecimal.greaterThan(1)) {
      return error('Zakat rate must be between 0 and 1 (0% to 100%)');
    }

    // Calculate Net Income
    // Net Income = EBITDA - Depreciation - Interest Expense + Interest Income - Zakat
    const taxableIncome = ebitdaDecimal
      .minus(depreciationDecimal)
      .minus(interestExpenseDecimal)
      .plus(interestIncomeDecimal);
    
    const taxableIncomePositive = max(taxableIncome, 0);
    const zakat = taxableIncomePositive.times(zakatRateDecimal);
    
    const netIncome = taxableIncome.minus(zakat);

    // Calculate Operating Cash Flow
    // Operating Cash Flow = Net Income + Depreciation - Working Capital Changes
    // Note: WC increase (positive) uses cash (subtract), WC decrease (negative) provides cash (add)
    const operatingCashFlow = netIncome
      .plus(depreciationDecimal)
      .minus(workingCapitalChangeDecimal);

    // Calculate Investing Cash Flow
    // Investing Cash Flow = -Capex
    const investingCashFlow = capexDecimal.negated();

    // Calculate Financing Cash Flow
    // Financing Cash Flow = Debt Changes (borrowing = positive, paydown = negative)
    const financingCashFlow = debtChangeDecimal;

    // Calculate Net Cash Flow
    const netCashFlow = operatingCashFlow
      .plus(investingCashFlow)
      .plus(financingCashFlow);

    return success({
      depreciation: depreciationDecimal,
      interestExpense: interestExpenseDecimal,
      interestIncome: interestIncomeDecimal,
      zakat,
      netIncome,
      workingCapitalChange: workingCapitalChangeDecimal,
      operatingCashFlow,
      investingCashFlow,
      financingCashFlow,
      netCashFlow,
    });
  } catch (err) {
    return error(`Failed to calculate cash flow: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Calculate cash flow for multiple years with Operating/Investing/Financing breakdown
 *
 * @param params - CashFlowParams containing all required inputs
 * @returns Result containing array of cash flow results for each year
 *
 * @example
 * const result = calculateCashFlow({
 *   ebitdaByYear: [{ year: 2028, ebitda: new Decimal(20_000_000) }],
 *   capexItems: [{ year: 2028, amount: new Decimal(3_000_000), category: 'BUILDING' }],
 *   depreciationByYear: [{ year: 2028, depreciation: new Decimal(2_000_000) }],
 *   interestExpenseByYear: [{ year: 2028, interestExpense: new Decimal(500_000) }],
 *   interestIncomeByYear: [{ year: 2028, interestIncome: new Decimal(100_000) }],
 *   workingCapitalChanges: [{ year: 2028, change: new Decimal(-500_000) }],
 *   debtChanges: [{ year: 2028, change: new Decimal(1_000_000) }],
 *   zakatRate: 0.025
 * });
 */
export function calculateCashFlow(
  params: CashFlowParams
): Result<CashFlowResult[]> {
  try {
    const {
      ebitdaByYear,
      capexItems,
      depreciationByYear,
      interestExpenseByYear,
      interestIncomeByYear,
      workingCapitalChanges,
      debtChanges,
      zakatRate,
      interestByYear, // Deprecated, but kept for backward compatibility
    } = params;

    if (ebitdaByYear.length === 0) {
      return error('EBITDA data is required');
    }

    // Validate required arrays have same length
    if (depreciationByYear.length !== ebitdaByYear.length) {
      return error('Depreciation data must have same length as EBITDA data');
    }

    if (interestExpenseByYear.length !== ebitdaByYear.length) {
      return error('Interest expense data must have same length as EBITDA data');
    }

    if (interestIncomeByYear.length !== ebitdaByYear.length) {
      return error('Interest income data must have same length as EBITDA data');
    }

    if (workingCapitalChanges.length !== ebitdaByYear.length) {
      return error('Working capital changes must have same length as EBITDA data');
    }

    if (debtChanges.length !== ebitdaByYear.length) {
      return error('Debt changes must have same length as EBITDA data');
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

    const depreciationMap = new Map<number, Decimal>();
    for (const item of depreciationByYear) {
      const amount = toDecimal(item.depreciation);
      if (amount.isNegative()) {
        return error(`Depreciation cannot be negative for year ${item.year}`);
      }
      depreciationMap.set(item.year, amount);
    }

    const interestExpenseMap = new Map<number, Decimal>();
    for (const item of interestExpenseByYear) {
      const amount = toDecimal(item.interestExpense);
      if (amount.isNegative()) {
        return error(`Interest expense cannot be negative for year ${item.year}`);
      }
      interestExpenseMap.set(item.year, amount);
    }

    const interestIncomeMap = new Map<number, Decimal>();
    for (const item of interestIncomeByYear) {
      const amount = toDecimal(item.interestIncome);
      if (amount.isNegative()) {
        return error(`Interest income cannot be negative for year ${item.year}`);
      }
      interestIncomeMap.set(item.year, amount);
    }

    const wcChangeMap = new Map<number, Decimal>();
    for (const item of workingCapitalChanges) {
      wcChangeMap.set(item.year, toDecimal(item.change));
    }

    const debtChangeMap = new Map<number, Decimal>();
    for (const item of debtChanges) {
      debtChangeMap.set(item.year, toDecimal(item.change));
    }

    // Backward compatibility: If interestByYear provided, use it as interestExpense
    if (interestByYear) {
      for (const item of interestByYear) {
        if (!interestExpenseMap.has(item.year)) {
          const amount = toDecimal(item.interest);
          if (amount.isNegative()) {
            return error(`Interest cannot be negative for year ${item.year}`);
          }
          interestExpenseMap.set(item.year, amount);
        }
      }
    }

    const results: CashFlowResult[] = [];

    for (const ebitdaItem of ebitdaByYear) {
      const year = ebitdaItem.year;
      const ebitda = ebitdaItem.ebitda;

      // Get components for this year
      const depreciation = depreciationMap.get(year) || new Decimal(0);
      const interestExpense = interestExpenseMap.get(year) || new Decimal(0);
      const interestIncome = interestIncomeMap.get(year) || new Decimal(0);
      const workingCapitalChange = wcChangeMap.get(year) || new Decimal(0);
      const capex = capexMap.get(year) || new Decimal(0);
      const debtChange = debtChangeMap.get(year) || new Decimal(0);

      // Calculate cash flow for this year
      const yearResult = calculateCashFlowForYear(
        ebitda,
        depreciation,
        interestExpense,
        interestIncome,
        zakatRate,
        workingCapitalChange,
        capex,
        debtChange
      );

      if (!yearResult.success) {
        return yearResult;
      }

      results.push({
        year,
        ebitda,
        depreciation: yearResult.data.depreciation,
        interestExpense: yearResult.data.interestExpense,
        interestIncome: yearResult.data.interestIncome,
        zakat: yearResult.data.zakat,
        netIncome: yearResult.data.netIncome,
        workingCapitalChange: yearResult.data.workingCapitalChange,
        operatingCashFlow: yearResult.data.operatingCashFlow,
        investingCashFlow: yearResult.data.investingCashFlow,
        financingCashFlow: yearResult.data.financingCashFlow,
        netCashFlow: yearResult.data.netCashFlow,
        // Legacy fields (for backward compatibility)
        capex,
        interest: interestExpense, // Deprecated: same as interestExpense
        cashFlow: yearResult.data.netCashFlow, // Deprecated: same as netCashFlow
      });
    }

    return success(results);
  } catch (err) {
    return error(`Failed to calculate cash flow: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

