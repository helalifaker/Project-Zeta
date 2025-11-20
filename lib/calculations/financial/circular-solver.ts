/**
 * Production Circular Calculation Solver
 * 
 * Purpose: Production-ready solver for Financial Statements circular calculations
 * 
 * Circular Dependencies:
 * Interest Expense → Debt → Cash → Net Result → Interest Expense (circular!)
 * 
 * Solution: Iterative solver with convergence check (validated by POC)
 * 
 * Performance Targets:
 * - Typical: <100ms for 30-year projection
 * - Worst case: <200ms
 * - Convergence: 1-4 iterations (validated by POC: 40/40 scenarios)
 * 
 * Reference: 
 * - POC: lib/calculations/financial/__poc__/circular-solver-poc.ts
 * - Plan: FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md (lines 1425-1994)
 */

import Decimal from 'decimal.js';
import type { WorkingCapitalSettings } from '@/lib/utils/admin-settings';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Result type for solver
 */
export type SolverResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

/**
 * Solver Parameters (30-year production model: 2023-2052)
 */
export interface SolverParams {
  // Version identifiers
  versionId: string;
  versionMode: 'RELOCATION_2028' | 'HISTORICAL_BASELINE';

  // Revenue & EBITDA inputs
  revenue: Decimal[]; // 30 years (2023-2052)
  ebitda: Decimal[]; // 30 years (2023-2052)

  // CapEx & Fixed Assets
  capex: Decimal[]; // 30 years (2023-2052)
  fixedAssetsOpening: Decimal; // Opening balance (Year 0)
  depreciationRate: Decimal; // e.g., 0.10 (10% straight-line)

  // OpEx (for working capital calculations)
  staffCosts: Decimal[]; // 30 years (2023-2052)

  // Balance Sheet starting balances
  startingCash: Decimal; // Year 0 ending cash (from balance_sheet_settings)
  openingEquity: Decimal; // Year 0 opening equity (from balance_sheet_settings)

  // Settings (from admin_settings - fetched automatically if not provided)
  zakatRate?: Decimal;
  debtInterestRate?: Decimal;
  bankDepositInterestRate?: Decimal;
  minimumCashBalance?: Decimal;
  workingCapitalSettings?: WorkingCapitalSettings;
}

/**
 * Year Projection Result (Production)
 */
export interface YearProjection {
  year: number; // 2023-2052

  // P&L Statement
  revenue: Decimal;
  staffCosts: Decimal;
  ebitda: Decimal;
  depreciation: Decimal;
  interestExpense: Decimal;
  interestIncome: Decimal;
  zakat: Decimal;
  netResult: Decimal; // EBITDA - Depreciation - Interest Expense + Interest Income - Zakat

  // Balance Sheet - Assets
  cash: Decimal;
  accountsReceivable: Decimal;
  fixedAssets: Decimal;
  totalAssets: Decimal;

  // Balance Sheet - Liabilities
  accountsPayable: Decimal;
  deferredIncome: Decimal;
  accruedExpenses: Decimal;
  shortTermDebt: Decimal;
  totalLiabilities: Decimal;

  // Balance Sheet - Equity
  openingEquity: Decimal;
  retainedEarnings: Decimal;
  totalEquity: Decimal;

  // Working Capital
  workingCapitalChange: Decimal; // Change from previous year

  // Cash Flow Statement
  operatingCashFlow: Decimal; // Net Result + Depreciation - WC Changes
  investingCashFlow: Decimal; // -CapEx
  financingCashFlow: Decimal; // Debt changes
  netCashFlow: Decimal; // Operating + Investing + Financing

  // Internal calculation fields
  theoreticalCash: Decimal; // Before balancing
  capex: Decimal;
}

/**
 * Solver Result (Production)
 */
export interface SolverResult {
  success: boolean;
  converged: boolean;
  iterations: number;
  maxError: Decimal;
  projection: YearProjection[];
  fallbackUsed?: boolean;
  duration: number; // milliseconds
}

/**
 * Convergence thresholds (from POC validation)
 */
const MAX_ITERATIONS = 10;
const CONVERGENCE_THRESHOLD = new Decimal(0.0001); // 0.01% relative error
const ABSOLUTE_ERROR_THRESHOLD = new Decimal(0.01); // For near-zero values

/**
 * Convergence Check Result
 */
interface ConvergenceCheckResult {
  converged: boolean;
  maxError: Decimal;
  errorType: 'absolute' | 'relative';
  yearWithMaxError: number;
}

/**
 * Production Circular Calculation Solver
 * 
 * @example
 * const solver = new CircularSolver();
 * const params: SolverParams = {
 *   versionId: 'abc-123',
 *   versionMode: 'RELOCATION_2028',
 *   revenue: [...], // 30 years
 *   ebitda: [...],  // 30 years
 *   capex: [...],   // 30 years
 *   fixedAssetsOpening: new Decimal(50000000),
 *   depreciationRate: new Decimal(0.10),
 *   staffCosts: [...], // 30 years
 *   startingCash: new Decimal(5000000),
 *   openingEquity: new Decimal(10000000),
 * };
 * 
 * const result = await solver.solve(params);
 * if (result.success) {
 *   console.log('Projection:', result.data.projection);
 * }
 */
export class CircularSolver {
  /**
   * Solve circular calculation for 30-year projection
   * 
   * @param params - Solver parameters
   * @returns Solver result with 30-year projection
   */
  async solve(params: SolverParams): Promise<SolverResult<SolverResult>> {
    const startTime = performance.now();

    try {
      // Fetch financial settings from admin_settings (if not provided)
      const settingsResult = await this.fetchFinancialSettings(params);
      if (!settingsResult.success) {
        return {
          success: false,
          error: settingsResult.error,
          code: settingsResult.code,
        };
      }

      const {
        zakatRate,
        debtInterestRate,
        bankDepositInterestRate,
        minimumCashBalance,
        workingCapitalSettings,
      } = settingsResult.data;

      // Validate input arrays (must be 30 years: 2023-2052)
      const validationResult = this.validateInputs(params);
      if (!validationResult.success) {
        return validationResult;
      }

      // Initialize first iteration (zero interest guess)
      let currentProjection = this.initializeFirstIteration(
        params,
        zakatRate,
        minimumCashBalance,
        workingCapitalSettings
      );
      let previousProjection: YearProjection[] = [];

      let converged = false;
      let iteration = 0;
      let convergenceResult: ConvergenceCheckResult = {
        converged: false,
        maxError: new Decimal(1),
        errorType: 'relative',
        yearWithMaxError: 2023,
      };

      // Iterative solver loop
      for (iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
        // Check convergence (skip first iteration)
        if (iteration > 1) {
          convergenceResult = this.checkConvergence(
            previousProjection,
            currentProjection
          );

          if (convergenceResult.converged) {
            converged = true;
            break;
          }
        }

        // Store current as previous for next iteration
        previousProjection = currentProjection;

        // Calculate next iteration with updated interest
        currentProjection = this.calculateIteration(
          params,
          previousProjection,
          zakatRate,
          debtInterestRate,
          bankDepositInterestRate,
          minimumCashBalance,
          workingCapitalSettings
        );
      }

      const duration = performance.now() - startTime;

      // Log performance warning if slow
      if (duration > 100) {
        console.warn(
          `⚠️ Circular solver took ${duration.toFixed(2)}ms (target: <100ms)`
        );
      }

      // Return result
      return {
        success: true,
        data: {
          success: true,
          converged,
          iterations: iteration,
          maxError: convergenceResult.maxError,
          projection: currentProjection,
          fallbackUsed: !converged,
          duration,
        },
      };
    } catch (error) {
      console.error('[CircularSolver] Unexpected error:', error);
      return {
        success: false,
        error: 'Circular solver failed',
        code: 'SOLVER_ERROR',
      };
    }
  }

  /**
   * Fetch financial settings from admin_settings (if not provided in params)
   */
  private async fetchFinancialSettings(
    params: SolverParams
  ): Promise<
    SolverResult<{
      zakatRate: Decimal;
      debtInterestRate: Decimal;
      bankDepositInterestRate: Decimal;
      minimumCashBalance: Decimal;
      workingCapitalSettings: WorkingCapitalSettings;
    }>
  > {
    // Use provided settings if available
    if (
      params.zakatRate &&
      params.debtInterestRate &&
      params.bankDepositInterestRate &&
      params.minimumCashBalance &&
      params.workingCapitalSettings
    ) {
      return {
        success: true,
        data: {
          zakatRate: params.zakatRate,
          debtInterestRate: params.debtInterestRate,
          bankDepositInterestRate: params.bankDepositInterestRate,
          minimumCashBalance: params.minimumCashBalance,
          workingCapitalSettings: params.workingCapitalSettings,
        },
      };
    }

    // ✅ FIX: Fetch from API instead of direct Prisma call (browser-safe)
    try {
      // Use absolute URL for server-side compatibility
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXTAUTH_URL || 'http://localhost:3000';
      
      const response = await fetch(`${baseUrl}/api/admin/financial-settings`, {
        cache: 'no-store', // Always fetch fresh data
      });
      
      if (!response.ok) {
        console.error('[CircularSolver] API fetch failed:', response.status, response.statusText);
        // Return defaults instead of failing completely
        return {
          success: true,
          data: {
            zakatRate: new Decimal(0.025),
            debtInterestRate: new Decimal(0.05),
            bankDepositInterestRate: new Decimal(0.02),
            minimumCashBalance: new Decimal(1_000_000),
            workingCapitalSettings: {
              accountsReceivable: { collectionDays: 30 },
              accountsPayable: { paymentDays: 45 },
              deferredIncome: { collectionDays: 0 },
              accruedExpenses: { paymentDays: 0 },
            },
          },
        };
      }

      const apiResult = await response.json();
      if (!apiResult.success || !apiResult.data) {
        console.warn('[CircularSolver] API returned error, using defaults:', apiResult.error);
        // Return defaults instead of failing
        return {
          success: true,
          data: {
            zakatRate: new Decimal(0.025),
            debtInterestRate: new Decimal(0.05),
            bankDepositInterestRate: new Decimal(0.02),
            minimumCashBalance: new Decimal(1_000_000),
            workingCapitalSettings: {
              accountsReceivable: { collectionDays: 30 },
              accountsPayable: { paymentDays: 45 },
              deferredIncome: { collectionDays: 0 },
              accruedExpenses: { paymentDays: 0 },
            },
          },
        };
      }

      // Convert API response to Decimal values
      const data = apiResult.data;
      return {
        success: true,
        data: {
          zakatRate: new Decimal(data.zakatRate ?? 0.025),
          debtInterestRate: new Decimal(data.debtInterestRate ?? 0.05),
          bankDepositInterestRate: new Decimal(data.bankDepositInterestRate ?? 0.02),
          minimumCashBalance: new Decimal(data.minimumCashBalance ?? 1_000_000),
          workingCapitalSettings: data.workingCapitalSettings ?? {
            accountsReceivable: { collectionDays: 30 },
            accountsPayable: { paymentDays: 45 },
            deferredIncome: { collectionDays: 0 },
            accruedExpenses: { paymentDays: 0 },
          },
        },
      };
    } catch (error) {
      console.error('[CircularSolver] Failed to fetch financial settings, using defaults:', error);
      // Return defaults instead of failing completely
      return {
        success: true,
        data: {
          zakatRate: new Decimal(0.025),
          debtInterestRate: new Decimal(0.05),
          bankDepositInterestRate: new Decimal(0.02),
          minimumCashBalance: new Decimal(1_000_000),
          workingCapitalSettings: {
            accountsReceivable: { collectionDays: 30 },
            accountsPayable: { paymentDays: 45 },
            deferredIncome: { collectionDays: 0 },
            accruedExpenses: { paymentDays: 0 },
          },
        },
      };
    }
  }

  /**
   * Validate input arrays (must be 30 years)
   */
  private validateInputs(params: SolverParams): SolverResult<void> {
    const requiredLength = 30; // 2023-2052

    if (params.revenue.length !== requiredLength) {
      return {
        success: false,
        error: `Revenue array must have ${requiredLength} years (got ${params.revenue.length})`,
        code: 'INVALID_REVENUE_LENGTH',
      };
    }

    if (params.ebitda.length !== requiredLength) {
      return {
        success: false,
        error: `EBITDA array must have ${requiredLength} years (got ${params.ebitda.length})`,
        code: 'INVALID_EBITDA_LENGTH',
      };
    }

    if (params.capex.length !== requiredLength) {
      return {
        success: false,
        error: `CapEx array must have ${requiredLength} years (got ${params.capex.length})`,
        code: 'INVALID_CAPEX_LENGTH',
      };
    }

    if (params.staffCosts.length !== requiredLength) {
      return {
        success: false,
        error: `Staff costs array must have ${requiredLength} years (got ${params.staffCosts.length})`,
        code: 'INVALID_STAFF_COSTS_LENGTH',
      };
    }

    return { success: true, data: undefined };
  }

  /**
   * Initialize first iteration (zero interest guess)
   */
  private initializeFirstIteration(
    params: SolverParams,
    zakatRate: Decimal,
    minimumCashBalance: Decimal,
    workingCapitalSettings: WorkingCapitalSettings
  ): YearProjection[] {
    const projection: YearProjection[] = [];
    let previousCash = params.startingCash;
    let previousDebt = new Decimal(0);
    let previousFixedAssets = params.fixedAssetsOpening;
    let cumulativeRetainedEarnings = new Decimal(0);

    // Previous year working capital (for change calculation)
    let previousAR = new Decimal(0);
    let previousAP = new Decimal(0);
    let previousDeferred = new Decimal(0);
    let previousAccrued = new Decimal(0);

    for (let i = 0; i < params.revenue.length; i++) {
      const year = 2023 + i;
      const revenue = params.revenue[i];
      const ebitda = params.ebitda[i];
      const capex = params.capex[i];
      const staffCosts = params.staffCosts[i];

      // Depreciation (straight-line on fixed assets)
      const depreciation = previousFixedAssets.times(params.depreciationRate);

      // First iteration: assume zero interest
      const interestExpense = new Decimal(0);
      const interestIncome = new Decimal(0);

      // Calculate net result (simplified Zakat method)
      const netResultBeforeZakat = ebitda
        .minus(depreciation)
        .minus(interestExpense)
        .plus(interestIncome);
      const zakat = Decimal.max(0, netResultBeforeZakat).times(zakatRate);
      const netResult = netResultBeforeZakat.minus(zakat);

      // Working capital calculations
      const avgRevenuePerDay = revenue.div(365);
      const avgStaffCostsPerDay = staffCosts.div(365);

      const accountsReceivable = avgRevenuePerDay.times(
        workingCapitalSettings.accountsReceivable.collectionDays
      );
      const accountsPayable = avgStaffCostsPerDay.times(
        workingCapitalSettings.accountsPayable.paymentDays
      );
      const deferredIncome = revenue.times(
        workingCapitalSettings.deferredIncome.deferralFactor
      );
      const accruedExpenses = staffCosts.times(
        workingCapitalSettings.accruedExpenses.accrualDays / 365
      );

      // Working capital change (positive = uses cash, negative = provides cash)
      const workingCapitalChange = accountsReceivable
        .minus(previousAR) // AR increase uses cash
        .minus(accountsPayable.minus(previousAP)) // AP increase provides cash
        .minus(deferredIncome.minus(previousDeferred)) // Deferred increase provides cash
        .minus(accruedExpenses.minus(previousAccrued)); // Accrued increase provides cash

      // Cash flow calculations
      const operatingCashFlow = netResult
        .plus(depreciation)
        .minus(workingCapitalChange);
      const investingCashFlow = capex.neg();
      
      // Theoretical cash (before balancing - only operating + investing)
      const theoreticalCash = previousCash.plus(operatingCashFlow).plus(investingCashFlow);

      // Balance sheet balancing (automatic debt creation)
      let cash: Decimal;
      let shortTermDebt: Decimal;
      let financingCashFlow: Decimal;

      if (theoreticalCash.gte(minimumCashBalance.plus(previousDebt))) {
        // Can pay down debt and maintain minimum cash
        shortTermDebt = new Decimal(0);
        financingCashFlow = new Decimal(0).minus(previousDebt); // Pay down previous debt
        cash = theoreticalCash.minus(previousDebt); // Cash after debt paydown
      } else if (theoreticalCash.gte(minimumCashBalance)) {
        // Can maintain minimum cash but cannot pay down debt
        cash = theoreticalCash;
        shortTermDebt = previousDebt; // Keep existing debt
        financingCashFlow = new Decimal(0); // No change in debt
      } else {
        // Need to borrow more to maintain minimum cash
        cash = minimumCashBalance;
        shortTermDebt = previousDebt.plus(minimumCashBalance.minus(theoreticalCash));
        financingCashFlow = shortTermDebt.minus(previousDebt);
      }
      
      // Net cash flow = operating + investing + financing
      const netCashFlow = operatingCashFlow.plus(investingCashFlow).plus(financingCashFlow);

      // Fixed assets (opening + capex - depreciation)
      const fixedAssets = previousFixedAssets.plus(capex).minus(depreciation);

      // Balance sheet totals
      const totalAssets = cash.plus(accountsReceivable).plus(fixedAssets);
      const totalLiabilities = accountsPayable
        .plus(deferredIncome)
        .plus(accruedExpenses)
        .plus(shortTermDebt);

      cumulativeRetainedEarnings = cumulativeRetainedEarnings.plus(netResult);
      const totalEquity = params.openingEquity.plus(cumulativeRetainedEarnings);

      projection.push({
        year,
        revenue,
        staffCosts,
        ebitda,
        depreciation,
        interestExpense,
        interestIncome,
        zakat,
        netResult,
        cash,
        accountsReceivable,
        fixedAssets,
        totalAssets,
        accountsPayable,
        deferredIncome,
        accruedExpenses,
        shortTermDebt,
        totalLiabilities,
        openingEquity: params.openingEquity,
        retainedEarnings: cumulativeRetainedEarnings,
        totalEquity,
        workingCapitalChange,
        operatingCashFlow,
        investingCashFlow,
        financingCashFlow,
        netCashFlow,
        theoreticalCash,
        capex,
      });

      // Update for next iteration
      previousCash = cash;
      previousDebt = shortTermDebt;
      previousFixedAssets = fixedAssets;
      previousAR = accountsReceivable;
      previousAP = accountsPayable;
      previousDeferred = deferredIncome;
      previousAccrued = accruedExpenses;
    }

    return projection;
  }

  /**
   * Calculate next iteration with updated interest
   */
  private calculateIteration(
    params: SolverParams,
    previousIteration: YearProjection[],
    zakatRate: Decimal,
    debtInterestRate: Decimal,
    bankDepositInterestRate: Decimal,
    minimumCashBalance: Decimal,
    workingCapitalSettings: WorkingCapitalSettings
  ): YearProjection[] {
    const projection: YearProjection[] = [];
    let previousCash = params.startingCash;
    let previousDebt = new Decimal(0);
    let previousFixedAssets = params.fixedAssetsOpening;
    let cumulativeRetainedEarnings = new Decimal(0);

    // Previous year working capital
    let previousAR = new Decimal(0);
    let previousAP = new Decimal(0);
    let previousDeferred = new Decimal(0);
    let previousAccrued = new Decimal(0);

    for (let i = 0; i < params.revenue.length; i++) {
      const year = 2023 + i;
      const revenue = params.revenue[i];
      const ebitda = params.ebitda[i];
      const capex = params.capex[i];
      const staffCosts = params.staffCosts[i];

      // Depreciation
      const depreciation = previousFixedAssets.times(params.depreciationRate);

      // Calculate interest using previous iteration's balances
      const currentDebt = i < previousIteration.length ? previousIteration[i].shortTermDebt : new Decimal(0);
      const currentCash = i < previousIteration.length ? previousIteration[i].cash : previousCash;

      // Average debt/cash for interest calculation (BOY + EOY) / 2
      const averageDebt = previousDebt.plus(currentDebt).div(2);
      const averageCash = previousCash.plus(currentCash).div(2);

      const interestExpense = averageDebt.times(debtInterestRate);
      const interestIncome = averageCash.times(bankDepositInterestRate);

      // Calculate net result
      const netResultBeforeZakat = ebitda
        .minus(depreciation)
        .minus(interestExpense)
        .plus(interestIncome);
      const zakat = Decimal.max(0, netResultBeforeZakat).times(zakatRate);
      const netResult = netResultBeforeZakat.minus(zakat);

      // Working capital
      const avgRevenuePerDay = revenue.div(365);
      const avgStaffCostsPerDay = staffCosts.div(365);

      const accountsReceivable = avgRevenuePerDay.times(
        workingCapitalSettings.accountsReceivable.collectionDays
      );
      const accountsPayable = avgStaffCostsPerDay.times(
        workingCapitalSettings.accountsPayable.paymentDays
      );
      const deferredIncome = revenue.times(
        workingCapitalSettings.deferredIncome.deferralFactor
      );
      const accruedExpenses = staffCosts.times(
        workingCapitalSettings.accruedExpenses.accrualDays / 365
      );

      // Working capital change (positive = uses cash, negative = provides cash)
      const workingCapitalChange = accountsReceivable
        .minus(previousAR) // AR increase uses cash
        .minus(accountsPayable.minus(previousAP)) // AP increase provides cash
        .minus(deferredIncome.minus(previousDeferred)) // Deferred increase provides cash
        .minus(accruedExpenses.minus(previousAccrued)); // Accrued increase provides cash

      // Cash flow
      const operatingCashFlow = netResult
        .plus(depreciation)
        .minus(workingCapitalChange);
      const investingCashFlow = capex.neg();
      
      // Theoretical cash (before balancing - only operating + investing)
      const theoreticalCash = previousCash.plus(operatingCashFlow).plus(investingCashFlow);

      // Balance sheet balancing
      let cash: Decimal;
      let shortTermDebt: Decimal;
      let financingCashFlow: Decimal;

      if (theoreticalCash.gte(minimumCashBalance.plus(previousDebt))) {
        // Can pay down debt and maintain minimum cash
        shortTermDebt = new Decimal(0);
        financingCashFlow = new Decimal(0).minus(previousDebt); // Pay down previous debt
        cash = theoreticalCash.minus(previousDebt); // Cash after debt paydown
      } else if (theoreticalCash.gte(minimumCashBalance)) {
        // Can maintain minimum cash but cannot pay down debt
        cash = theoreticalCash;
        shortTermDebt = previousDebt; // Keep existing debt
        financingCashFlow = new Decimal(0); // No change in debt
      } else {
        // Need to borrow more to maintain minimum cash
        cash = minimumCashBalance;
        shortTermDebt = previousDebt.plus(minimumCashBalance.minus(theoreticalCash));
        financingCashFlow = shortTermDebt.minus(previousDebt);
      }
      
      // Net cash flow = operating + investing + financing
      const netCashFlow = operatingCashFlow.plus(investingCashFlow).plus(financingCashFlow);

      // Fixed assets
      const fixedAssets = previousFixedAssets.plus(capex).minus(depreciation);

      // Balance sheet totals
      const totalAssets = cash.plus(accountsReceivable).plus(fixedAssets);
      const totalLiabilities = accountsPayable
        .plus(deferredIncome)
        .plus(accruedExpenses)
        .plus(shortTermDebt);

      cumulativeRetainedEarnings = cumulativeRetainedEarnings.plus(netResult);
      const totalEquity = params.openingEquity.plus(cumulativeRetainedEarnings);

      projection.push({
        year,
        revenue,
        staffCosts,
        ebitda,
        depreciation,
        interestExpense,
        interestIncome,
        zakat,
        netResult,
        cash,
        accountsReceivable,
        fixedAssets,
        totalAssets,
        accountsPayable,
        deferredIncome,
        accruedExpenses,
        shortTermDebt,
        totalLiabilities,
        openingEquity: params.openingEquity,
        retainedEarnings: cumulativeRetainedEarnings,
        totalEquity,
        workingCapitalChange,
        operatingCashFlow,
        investingCashFlow,
        financingCashFlow,
        netCashFlow,
        theoreticalCash,
        capex,
      });

      // Update for next year
      previousCash = cash;
      previousDebt = shortTermDebt;
      previousFixedAssets = fixedAssets;
      previousAR = accountsReceivable;
      previousAP = accountsPayable;
      previousDeferred = deferredIncome;
      previousAccrued = accruedExpenses;
    }

    return projection;
  }

  /**
   * Check convergence between iterations
   */
  private checkConvergence(
    previousIteration: YearProjection[],
    currentIteration: YearProjection[]
  ): ConvergenceCheckResult {
    let maxError = new Decimal(0);
    let errorType: 'absolute' | 'relative' = 'relative';
    let yearWithMaxError = 2023;
    let converged = true;

    for (let i = 0; i < currentIteration.length; i++) {
      const prevNetResult = previousIteration[i].netResult;
      const currNetResult = currentIteration[i].netResult;

      // Hybrid convergence check (absolute for near-zero, relative for larger values)
      let error: Decimal;
      let currentErrorType: 'absolute' | 'relative';

      if (prevNetResult.abs().lt(ABSOLUTE_ERROR_THRESHOLD)) {
        // Near zero: Use absolute error
        error = currNetResult.minus(prevNetResult).abs();
        currentErrorType = 'absolute';
      } else {
        // Larger values: Use relative error
        error = currNetResult.minus(prevNetResult).abs().div(prevNetResult.abs());
        currentErrorType = 'relative';
      }

      if (error.gt(maxError)) {
        maxError = error;
        errorType = currentErrorType;
        yearWithMaxError = currentIteration[i].year;
      }

      if (error.gt(CONVERGENCE_THRESHOLD)) {
        converged = false;
      }
    }

    return {
      converged,
      maxError,
      errorType,
      yearWithMaxError,
    };
  }
}

