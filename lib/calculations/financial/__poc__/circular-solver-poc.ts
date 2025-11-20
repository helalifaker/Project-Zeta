/**
 * Proof of Concept - Circular Calculation Solver
 * 
 * Purpose: Validate circular calculation approach BEFORE building full system.
 * 
 * Circular Dependency:
 * Interest Expense → Debt → Cash → Net Result → Interest Expense (circular!)
 * 
 * Solution: Iterative solver with convergence check
 * 
 * Success Criteria:
 * - Convergence within 5 iterations for 90% of scenarios
 * - Performance < 10ms per scenario (5-year model)
 * - Max 10 iterations before fallback
 * 
 * Reference: FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md (lines 1159-1424)
 */

import Decimal from 'decimal.js';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Working Capital Settings
 */
export interface WorkingCapitalSettings {
  accountsReceivable: { collectionDays: number }; // Default: 0
  accountsPayable: { paymentDays: number }; // Default: 30
  deferredIncome: { deferralFactor: number }; // Default: 0.25 (25%)
  accruedExpenses: { accrualDays: number }; // Default: 15
}

/**
 * POC Parameters (Simplified 5-year model)
 */
export interface POCParams {
  ebitda: Decimal[]; // 5 years of EBITDA
  capex: Decimal[]; // 5 years of CapEx
  debtInterestRate: Decimal; // e.g., 0.05 (5%)
  bankDepositInterestRate: Decimal; // e.g., 0.02 (2%)
  minimumCashBalance: Decimal; // e.g., 1,000,000 SAR
  startingCash: Decimal; // Year 0 ending cash (default: 0)
  zakatRate: Decimal; // e.g., 0.025 (2.5% - Saudi law)
  // Working capital parameters (optional - for Day -2 testing)
  revenue?: Decimal[]; // 5 years of revenue (for AR, deferred income)
  staffCosts?: Decimal[]; // 5 years of staff costs (for AP, accrued expenses)
  workingCapitalSettings?: WorkingCapitalSettings;
}

/**
 * Year Projection Result
 */
export interface YearProjection {
  year: number;
  ebitda: Decimal;
  capex: Decimal;
  depreciation: Decimal; // Currently 0 (not tracked)
  interestExpense: Decimal; // Calculated from debt
  interestIncome: Decimal; // Calculated from cash
  zakat: Decimal; // Calculated from net result
  netResult: Decimal; // EBITDA - Depreciation - Interest Expense + Interest Income - Zakat
  // Working capital (if enabled)
  accountsReceivable?: Decimal;
  accountsPayable?: Decimal;
  deferredIncome?: Decimal;
  accruedExpenses?: Decimal;
  workingCapitalChange?: Decimal; // Change from previous year
  operatingCashFlow: Decimal; // Net Result + Depreciation - WC Changes
  investingCashFlow: Decimal; // -CapEx
  netCashFlow: Decimal; // Operating + Investing
  theoreticalCash: Decimal; // Before balancing
  cash: Decimal; // After balancing (enforced minimum)
  shortTermDebt: Decimal; // Created if cash < minimum
}

/**
 * POC Solver Result
 */
export interface POCResult {
  success: boolean;
  converged: boolean;
  iterations: number;
  maxError: Decimal;
  projection: YearProjection[];
  fallbackUsed?: boolean;
}

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
 * Circular Calculation Solver (POC)
 * 
 * Implements iterative approach to solve circular dependency:
 * Interest → Debt → Cash → Net Result → Interest
 */
export class CircularSolverPOC {
  private readonly MAX_ITERATIONS = 10;
  private readonly CONVERGENCE_THRESHOLD = new Decimal(0.0001); // 0.01%
  private readonly ABSOLUTE_ERROR_THRESHOLD = new Decimal(0.01); // For near-zero values

  /**
   * Solve circular calculation
   */
  public solve(params: POCParams): POCResult {
    let currentIteration = this.initializeFirstIteration(params);
    let previousIteration: YearProjection[] | null = null;

    for (let iteration = 0; iteration < this.MAX_ITERATIONS; iteration++) {
      // Calculate projection with current estimates
      currentIteration = this.calculateIteration(params, currentIteration);

      // Check convergence (skip first iteration - no baseline yet)
      if (iteration > 0 && previousIteration) {
        const convergenceCheck = this.checkConvergence(
          previousIteration,
          currentIteration
        );

        // Log convergence progress
        if (process.env.NODE_ENV !== 'test') {
          console.log(
            `[POC] Iteration ${iteration}: ${convergenceCheck.converged ? '✅' : '⏳'} ` +
            `Max error: ${(convergenceCheck.maxError.toNumber() * 100).toFixed(4)}% ` +
            `(${convergenceCheck.errorType}, Year ${convergenceCheck.yearWithMaxError})`
          );
        }

        if (convergenceCheck.converged) {
          return {
            success: true,
            converged: true,
            iterations: iteration,
            maxError: convergenceCheck.maxError,
            projection: currentIteration,
          };
        }
      }

      // Store for next convergence check (deep clone with Decimal preservation)
      previousIteration = this.cloneProjection(currentIteration);
    }

    // Did not converge - use fallback
    console.warn('[POC] ⚠️ Convergence failed after max iterations. Using fallback.');

    return {
      success: true,
      converged: false,
      iterations: this.MAX_ITERATIONS,
      maxError: new Decimal(1), // 100% error (did not converge)
      projection: currentIteration,
      fallbackUsed: true,
    };
  }

  /**
   * Initialize first iteration (assume zero interest)
   */
  private initializeFirstIteration(params: POCParams): YearProjection[] {
    const projection: YearProjection[] = [];
    let previousCash = params.startingCash;
    // previousDebt is assigned for consistency with calculateIteration but not used in first iteration
    let _previousDebt = new Decimal(0);

    for (let i = 0; i < params.ebitda.length; i++) {
      const year = i + 1;
      const ebitda = params.ebitda[i];
      const capex = params.capex[i] || new Decimal(0); // Handle undefined

      // Initial guess: zero interest
      const interestExpense = new Decimal(0);
      const interestIncome = new Decimal(0);
      const depreciation = new Decimal(0); // Not tracked

      // Calculate net result (simplified Zakat method)
      const netResultBeforeZakat = ebitda
        .minus(depreciation)
        .minus(interestExpense)
        .plus(interestIncome);

      const zakat = Decimal.max(0, netResultBeforeZakat).times(params.zakatRate);

      const netResult = netResultBeforeZakat.minus(zakat);

      // Calculate cash flow
      const operatingCashFlow = netResult.plus(depreciation);
      const investingCashFlow = capex.neg();
      const netCashFlow = operatingCashFlow.plus(investingCashFlow);

      // Calculate cash position (before balancing)
      const theoreticalCash = previousCash.plus(netCashFlow);

      // Apply balancing mechanism
      let cash: Decimal;
      let shortTermDebt: Decimal;

      if (theoreticalCash.greaterThanOrEqualTo(params.minimumCashBalance)) {
        cash = theoreticalCash;
        shortTermDebt = new Decimal(0);
      } else {
        cash = params.minimumCashBalance;
        shortTermDebt = params.minimumCashBalance.minus(theoreticalCash);
      }

      projection.push({
        year,
        ebitda,
        capex,
        depreciation,
        interestExpense,
        interestIncome,
        zakat,
        netResult,
        operatingCashFlow,
        investingCashFlow,
        netCashFlow,
        theoreticalCash,
        cash,
        shortTermDebt,
      });

      previousCash = cash;
      // previousDebt assigned but not used in first iteration (zero interest assumption)
      _previousDebt = shortTermDebt;
    }

    return projection;
  }

  /**
   * Calculate next iteration using previous iteration's interest
   */
  private calculateIteration(
    params: POCParams,
    previousIteration: YearProjection[]
  ): YearProjection[] {
    const projection: YearProjection[] = [];
    let previousCash = params.startingCash;
    let previousDebt = new Decimal(0);

    for (let i = 0; i < params.ebitda.length; i++) {
      const year = i + 1;
      const ebitda = params.ebitda[i];
      const capex = params.capex[i] || new Decimal(0); // Handle undefined
      const depreciation = new Decimal(0);

      // Calculate interest using previous iteration's balances
      const currentDebt = i < previousIteration.length ? previousIteration[i].shortTermDebt : new Decimal(0);
      const currentCash = i < previousIteration.length ? previousIteration[i].cash : previousCash;

      // Average debt/cash for interest calculation
      const averageDebt = previousDebt.plus(currentDebt).div(2);
      const averageCash = previousCash.plus(currentCash).div(2);

      const interestExpense = averageDebt.times(params.debtInterestRate);
      const interestIncome = averageCash.times(params.bankDepositInterestRate);

      // Calculate net result
      const netResultBeforeZakat = ebitda
        .minus(depreciation)
        .minus(interestExpense)
        .plus(interestIncome);

      const zakat = Decimal.max(0, netResultBeforeZakat).times(params.zakatRate);

      const netResult = netResultBeforeZakat.minus(zakat);

      // Calculate cash flow
      const operatingCashFlow = netResult.plus(depreciation);
      const investingCashFlow = capex.neg();
      const netCashFlow = operatingCashFlow.plus(investingCashFlow);

      // Calculate cash position
      const theoreticalCash = previousCash.plus(netCashFlow);

      // Apply balancing mechanism
      let cash: Decimal;
      let shortTermDebt: Decimal;

      if (theoreticalCash.greaterThanOrEqualTo(params.minimumCashBalance)) {
        cash = theoreticalCash;
        shortTermDebt = new Decimal(0);
      } else {
        cash = params.minimumCashBalance;
        shortTermDebt = params.minimumCashBalance.minus(theoreticalCash);
      }

      projection.push({
        year,
        ebitda,
        capex,
        depreciation,
        interestExpense,
        interestIncome,
        zakat,
        netResult,
        operatingCashFlow,
        investingCashFlow,
        netCashFlow,
        theoreticalCash,
        cash,
        shortTermDebt,
      });

      previousCash = cash;
      previousDebt = shortTermDebt;
    }

    return projection;
  }

  /**
   * Calculate working capital items for a year
   */
  private calculateWorkingCapital(
    revenue: Decimal,
    staffCosts: Decimal,
    settings: WorkingCapitalSettings
  ): {
    accountsReceivable: Decimal;
    accountsPayable: Decimal;
    deferredIncome: Decimal;
    accruedExpenses: Decimal;
  } {
    // AR = Revenue × (Collection Days / 365)
    const accountsReceivable = revenue
      .times(settings.accountsReceivable.collectionDays)
      .div(365);

    // AP = Staff Costs × (Payment Days / 365)
    const accountsPayable = staffCosts
      .times(settings.accountsPayable.paymentDays)
      .div(365);

    // Deferred Income = Revenue × Deferral Factor
    const deferredIncome = revenue.times(settings.deferredIncome.deferralFactor);

    // Accrued Expenses = Staff Costs × (Accrual Days / 365)
    const accruedExpenses = staffCosts
      .times(settings.accruedExpenses.accrualDays)
      .div(365);

    return {
      accountsReceivable,
      accountsPayable,
      deferredIncome,
      accruedExpenses,
    };
  }

  /**
   * Clone projection preserving Decimal objects
   */
  private cloneProjection(projection: YearProjection[]): YearProjection[] {
    return projection.map(year => ({
      year: year.year,
      ebitda: new Decimal(year.ebitda),
      capex: new Decimal(year.capex),
      depreciation: new Decimal(year.depreciation),
      interestExpense: new Decimal(year.interestExpense),
      interestIncome: new Decimal(year.interestIncome),
      zakat: new Decimal(year.zakat),
      netResult: new Decimal(year.netResult),
      // Working capital (optional)
      ...(year.accountsReceivable && { accountsReceivable: new Decimal(year.accountsReceivable) }),
      ...(year.accountsPayable && { accountsPayable: new Decimal(year.accountsPayable) }),
      ...(year.deferredIncome && { deferredIncome: new Decimal(year.deferredIncome) }),
      ...(year.accruedExpenses && { accruedExpenses: new Decimal(year.accruedExpenses) }),
      ...(year.workingCapitalChange && { workingCapitalChange: new Decimal(year.workingCapitalChange) }),
      operatingCashFlow: new Decimal(year.operatingCashFlow),
      investingCashFlow: new Decimal(year.investingCashFlow),
      netCashFlow: new Decimal(year.netCashFlow),
      theoreticalCash: new Decimal(year.theoreticalCash),
      cash: new Decimal(year.cash),
      shortTermDebt: new Decimal(year.shortTermDebt),
    }));
  }

  /**
   * Check convergence between two projection iterations
   * 
   * Strategy:
   * - For Net Result near zero (|Net Result| < 0.01): Use absolute error
   * - For larger Net Result: Use relative error (percentage change)
   * 
   * This avoids division-by-zero issues while maintaining accuracy
   */
  private checkConvergence(
    previousIteration: YearProjection[],
    currentIteration: YearProjection[]
  ): ConvergenceCheckResult {
    let maxError = new Decimal(0);
    let errorType: 'absolute' | 'relative' = 'relative';
    let yearWithMaxError = 0;

    // Compare Net Result for each year
    for (let i = 0; i < currentIteration.length; i++) {
      const prevYear = previousIteration[i];
      const currYear = currentIteration[i];

      const prevNetResult = prevYear.netResult;
      const currNetResult = currYear.netResult;

      const absDiff = currNetResult.minus(prevNetResult).abs();

      // Decision: Use absolute or relative error?
      if (prevNetResult.abs().lt(this.ABSOLUTE_ERROR_THRESHOLD)) {
        // Near zero: Use absolute error to avoid division by zero
        const error = absDiff;

        if (error.gt(maxError)) {
          maxError = error;
          errorType = 'absolute';
          yearWithMaxError = currYear.year;
        }
      } else {
        // Larger values: Use relative error (percentage change)
        const relError = absDiff.div(prevNetResult.abs());

        if (relError.gt(maxError)) {
          maxError = relError;
          errorType = 'relative';
          yearWithMaxError = currYear.year;
        }
      }
    }

    // Converged if max error < threshold
    const converged = maxError.lte(this.CONVERGENCE_THRESHOLD);

    return {
      converged,
      maxError,
      errorType,
      yearWithMaxError,
    };
  }
}

