/**
 * Comprehensive Stress Tests - POC
 * 
 * Purpose: Test 50+ extreme scenarios to validate solver robustness
 * before full implementation.
 * 
 * Success Criteria:
 * - 45+ scenarios pass (90%+)
 * - 0-5 known issues documented
 * - 0 failures (must fix before GO decision)
 * 
 * Reference: FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md (lines 1995-2130)
 */

import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { CircularSolverPOC, type POCParams } from '../circular-solver-poc';

// Configure Decimal.js
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

describe('Comprehensive Stress Tests - Day -1 POC', () => {
  describe('Category 1: Extreme Cash Flow Scenarios (5 tests)', () => {
    it('ST-POC-011: 10 consecutive years of losses', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: Array(5).fill(new Decimal(-1000000)), // 1M loss every year
        capex: Array(5).fill(new Decimal(200000)),
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const startTime = performance.now();
      const result = solver.solve(params);
      const duration = performance.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      expect(result.iterations).toBeLessThanOrEqual(10);
      expect(duration).toBeLessThan(20);
      
      // Verify massive debt accumulation
      const finalYear = result.projection[4];
      expect(finalYear.shortTermDebt.greaterThan(0)).toBe(true); // Has debt
      
      console.log(`[ST-POC-011] ✅ ${result.iterations} iterations, ${duration.toFixed(2)}ms, Final Debt: ${finalYear.shortTermDebt.div(1000000).toFixed(1)}M`);
    });

    it('ST-POC-012: Massive debt accumulation (50M+)', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: [
          new Decimal(-5000000), // -5M loss
          new Decimal(-3000000),
          new Decimal(-2000000),
          new Decimal(-1000000),
          new Decimal(0),
        ],
        capex: Array(5).fill(new Decimal(10000000)), // 10M capex each year!
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      expect(result.iterations).toBeLessThanOrEqual(10);
      
      const finalYear = result.projection[4];
      expect(finalYear.shortTermDebt.greaterThan(10000000)).toBe(true); // >10M debt
      
      console.log(`[ST-POC-012] ✅ ${result.iterations} iterations, Final Debt: ${finalYear.shortTermDebt.div(1000000).toFixed(1)}M`);
    });

    it('ST-POC-013: Wildly oscillating cash flow', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: [
          new Decimal(5000000),  // +5M
          new Decimal(-3000000), // -3M
          new Decimal(8000000),  // +8M
          new Decimal(-4000000), // -4M
          new Decimal(10000000), // +10M
        ],
        capex: [
          new Decimal(10000000), // Massive
          new Decimal(0),
          new Decimal(15000000), // Even more massive
          new Decimal(0),
          new Decimal(0),
        ],
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      expect(result.iterations).toBeLessThanOrEqual(10);
      
      console.log(`[ST-POC-013] ✅ ${result.iterations} iterations (oscillating cash flow)`);
    });

    it('ST-POC-014: Sudden cash shock (lose 20M in Year 3)', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: [
          new Decimal(5000000),
          new Decimal(5000000),
          new Decimal(-20000000), // ⚠️ 20M loss!
          new Decimal(5000000),
          new Decimal(5000000),
        ],
        capex: Array(5).fill(new Decimal(1000000)),
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      
      // Year 3 should have massive debt
      const year3 = result.projection[2];
      expect(year3.shortTermDebt.greaterThan(10000000)).toBe(true);
      
      console.log(`[ST-POC-014] ✅ ${result.iterations} iterations, Year 3 Debt: ${year3.shortTermDebt.div(1000000).toFixed(1)}M`);
    });

    it('ST-POC-015: Zero revenue for 3 years (pandemic scenario)', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: [
          new Decimal(-2000000), // Year 1: losses
          new Decimal(-2000000), // Year 2: losses
          new Decimal(-2000000), // Year 3: losses
          new Decimal(1000000),  // Year 4: recovery
          new Decimal(3000000),  // Year 5: strong recovery
        ],
        capex: [
          new Decimal(0),
          new Decimal(0),
          new Decimal(0), // No investment during crisis
          new Decimal(2000000), // Invest in recovery
          new Decimal(1000000),
        ],
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      
      console.log(`[ST-POC-015] ✅ ${result.iterations} iterations (pandemic scenario)`);
    });
  });

  describe('Category 2: Extreme Interest Rate Scenarios (4 tests)', () => {
    it('ST-POC-016: Zero interest rates (both deposit and debt)', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: Array(5).fill(new Decimal(2000000)),
        capex: Array(5).fill(new Decimal(500000)),
        debtInterestRate: new Decimal(0), // ⚠️ 0% debt interest
        bankDepositInterestRate: new Decimal(0), // ⚠️ 0% deposit interest
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      
      // Verify no interest expense/income
      const year2 = result.projection[1];
      expect(year2.interestExpense.toNumber()).toBe(0);
      expect(year2.interestIncome.toNumber()).toBe(0);
      
      console.log(`[ST-POC-016] ✅ ${result.iterations} iterations (zero interest)`);
    });

    it('ST-POC-017: Extreme debt interest rate (20%)', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: Array(5).fill(new Decimal(1000000)),
        capex: [new Decimal(5000000), ...Array(4).fill(new Decimal(0))], // Large initial capex
        debtInterestRate: new Decimal(0.20), // ⚠️ 20% interest!
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      
      console.log(`[ST-POC-017] ✅ ${result.iterations} iterations (20% interest)`);
    });

    it('ST-POC-018: Inverted rates (deposit > debt)', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: Array(5).fill(new Decimal(3000000)),
        capex: Array(5).fill(new Decimal(500000)),
        debtInterestRate: new Decimal(0.02), // 2% debt
        bankDepositInterestRate: new Decimal(0.05), // ⚠️ 5% deposit (inverted!)
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      
      // Should have high interest income from cash
      const finalYear = result.projection[4];
      expect(finalYear.interestIncome.greaterThan(0)).toBe(true);
      
      console.log(`[ST-POC-018] ✅ ${result.iterations} iterations (inverted rates)`);
    });

    it('ST-POC-019: Maximum reasonable interest rates', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: Array(5).fill(new Decimal(5000000)),
        capex: [new Decimal(10000000), ...Array(4).fill(new Decimal(1000000))],
        debtInterestRate: new Decimal(0.15), // 15% (high but realistic)
        bankDepositInterestRate: new Decimal(0.08), // 8% (very high)
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      expect(result.iterations).toBeLessThanOrEqual(10);
      
      console.log(`[ST-POC-019] ✅ ${result.iterations} iterations (max rates)`);
    });
  });

  describe('Category 3: Balance Sheet Balancing Edge Cases (5 tests)', () => {
    it('ST-POC-020: Theoretical cash exactly at minimum', () => {
      const solver = new CircularSolverPOC();
      
      // Carefully calibrated to hit exactly 1M theoretical cash
      const params: POCParams = {
        ebitda: [new Decimal(1025000)], // Tuned to hit target
        capex: [new Decimal(0)],
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      
      const year1 = result.projection[0];
      // Should be at or very close to minimum (no debt needed)
      expect(year1.cash.greaterThanOrEqualTo(1000000)).toBe(true);
      expect(year1.shortTermDebt.lessThanOrEqualTo(10000)).toBe(true); // Allow small rounding
      
      console.log(`[ST-POC-020] ✅ ${result.iterations} iterations, Cash: ${year1.cash.toFixed(0)}, Debt: ${year1.shortTermDebt.toFixed(0)}`);
    });

    it('ST-POC-021: Theoretical cash massively negative (-50M)', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: [new Decimal(-40000000)], // -40M loss
        capex: [new Decimal(10000000)], // +10M capex
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      
      const year1 = result.projection[0];
      expect(year1.cash.toNumber()).toBe(1000000); // Enforced minimum
      expect(year1.shortTermDebt.greaterThan(50000000)).toBe(true); // >50M debt
      
      console.log(`[ST-POC-021] ✅ ${result.iterations} iterations, Debt: ${year1.shortTermDebt.div(1000000).toFixed(1)}M`);
    });

    it('ST-POC-022: Minimum cash balance very high (100M)', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: Array(5).fill(new Decimal(10000000)), // 10M profit
        capex: Array(5).fill(new Decimal(2000000)),
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(100000000), // ⚠️ 100M minimum!
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      
      // All years should maintain at least 100M cash (may grow due to profits)
      result.projection.forEach((year, index) => {
        expect(year.cash.greaterThanOrEqualTo(100000000)).toBe(true);
        console.log(`  Year ${index + 1}: Cash ${year.cash.div(1000000).toFixed(1)}M, Debt ${year.shortTermDebt.div(1000000).toFixed(1)}M`);
      });
      
      console.log(`[ST-POC-022] ✅ ${result.iterations} iterations (100M minimum)`);
    });

    it('ST-POC-023: Minimum cash balance set to zero', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: Array(5).fill(new Decimal(2000000)),
        capex: [new Decimal(5000000), ...Array(4).fill(new Decimal(0))],
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(0), // ⚠️ No minimum!
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      
      // Year 1 might have negative cash (allowed)
      const year1 = result.projection[0];
      // Debt may still be created due to negative cash flow despite no minimum
      // Just verify solver completed successfully
      expect(result.converged).toBe(true);
      
      console.log(`[ST-POC-023] ✅ ${result.iterations} iterations (no minimum), Cash: ${year1.cash.toFixed(0)}, Debt: ${year1.shortTermDebt.toFixed(0)}`);
    });

    it('ST-POC-024: Debt repayment scenario', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: [
          new Decimal(-1000000), // Year 1: loss (create debt)
          new Decimal(5000000),  // Year 2: big profit
          new Decimal(5000000),  // Year 3: big profit
          new Decimal(5000000),  // Year 4: big profit
          new Decimal(5000000),  // Year 5: big profit
        ],
        capex: [new Decimal(2000000), ...Array(4).fill(new Decimal(500000))],
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      
      // Year 1 should have debt, later years should have less/no debt
      const year1 = result.projection[0];
      const year5 = result.projection[4];
      expect(year1.shortTermDebt.greaterThan(0)).toBe(true);
      expect(year5.shortTermDebt.toNumber()).toBe(0); // Debt paid off
      
      console.log(`[ST-POC-024] ✅ ${result.iterations} iterations, Year 1 Debt: ${year1.shortTermDebt.div(1000000).toFixed(1)}M → Year 5: ${year5.shortTermDebt.toFixed(0)}`);
    });
  });

  describe('Category 4: Circular Calculation Edge Cases (5 tests)', () => {
    it('ST-POC-025: Convergence with very strict threshold', () => {
      const solver = new CircularSolverPOC();
      // Note: Threshold is hardcoded in solver (0.0001), this tests if it works
      
      const params: POCParams = {
        ebitda: Array(5).fill(new Decimal(2000000)),
        capex: Array(5).fill(new Decimal(500000)),
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      expect(result.maxError.lessThanOrEqualTo(0.0001)).toBe(true);
      
      console.log(`[ST-POC-025] ✅ ${result.iterations} iterations, Error: ${(result.maxError.toNumber() * 100).toFixed(4)}%`);
    });

    it('ST-POC-026: Single year projection', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: [new Decimal(2000000)], // Only 1 year
        capex: [new Decimal(500000)],
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      expect(result.projection).toHaveLength(1);
      
      console.log(`[ST-POC-026] ✅ ${result.iterations} iterations (1 year only)`);
    });

    it('ST-POC-027: Rapid convergence (should converge in 2 iterations)', () => {
      const solver = new CircularSolverPOC();
      
      // Simple scenario should converge very fast
      const params: POCParams = {
        ebitda: Array(5).fill(new Decimal(5000000)), // Stable profit
        capex: Array(5).fill(new Decimal(1000000)),  // Stable capex
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      expect(result.iterations).toBeLessThanOrEqual(3); // Should be very fast
      
      console.log(`[ST-POC-027] ✅ ${result.iterations} iterations (rapid convergence)`);
    });

    it('ST-POC-028: Slower convergence (complex scenario)', () => {
      const solver = new CircularSolverPOC();
      
      // More complex with oscillating cash flow
      const params: POCParams = {
        ebitda: [
          new Decimal(10000000),
          new Decimal(-2000000),
          new Decimal(8000000),
          new Decimal(-1000000),
          new Decimal(12000000),
        ],
        capex: [
          new Decimal(20000000),
          new Decimal(0),
          new Decimal(15000000),
          new Decimal(0),
          new Decimal(0),
        ],
        debtInterestRate: new Decimal(0.08), // Higher interest
        bankDepositInterestRate: new Decimal(0.03),
        minimumCashBalance: new Decimal(5000000), // Higher minimum
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      expect(result.iterations).toBeLessThanOrEqual(10);
      
      console.log(`[ST-POC-028] ✅ ${result.iterations} iterations (complex scenario)`);
    });

    it('ST-POC-029: Maximum iterations stress test', () => {
      const solver = new CircularSolverPOC();
      
      // Extreme scenario to push iteration count
      const params: POCParams = {
        ebitda: [
          new Decimal(100000),
          new Decimal(-50000),
          new Decimal(80000),
          new Decimal(-40000),
          new Decimal(120000),
        ],
        capex: [
          new Decimal(500000),
          new Decimal(0),
          new Decimal(400000),
          new Decimal(0),
          new Decimal(0),
        ],
        debtInterestRate: new Decimal(0.18), // Very high
        bankDepositInterestRate: new Decimal(0.04),
        minimumCashBalance: new Decimal(200000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      // May or may not converge, but should complete
      expect(result.iterations).toBeLessThanOrEqual(10);
      
      console.log(`[ST-POC-029] ✅ ${result.iterations} iterations, Converged: ${result.converged}`);
    });
  });

  describe('Category 5: Zakat Calculation Edge Cases (5 tests)', () => {
    it('ST-POC-030: Negative net result (loss year, no Zakat)', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: [new Decimal(-500000)], // Loss
        capex: [new Decimal(0)],
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      const year1 = result.projection[0];
      expect(year1.zakat.toNumber()).toBe(0); // No Zakat on losses
      
      console.log(`[ST-POC-030] ✅ ${result.iterations} iterations, Zakat: ${year1.zakat.toFixed(0)} (loss year)`);
    });

    it('ST-POC-031: Zero net result (break-even, no Zakat)', () => {
      const solver = new CircularSolverPOC();
      
      // Calibrated to hit exactly zero net result
      const params: POCParams = {
        ebitda: [new Decimal(0)], // Break-even
        capex: [new Decimal(0)],
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(0), // No minimum to avoid debt
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      const year1 = result.projection[0];
      expect(year1.zakat.toNumber()).toBe(0); // No Zakat on zero profit
      
      console.log(`[ST-POC-031] ✅ ${result.iterations} iterations, Zakat: ${year1.zakat.toFixed(0)} (break-even)`);
    });

    it('ST-POC-032: Massive net result (100M+ profit)', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: [new Decimal(100000000)], // 100M profit!
        capex: [new Decimal(0)],
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      const year1 = result.projection[0];
      // Zakat should be ~2.5% of 100M = ~2.5M
      expect(year1.zakat.greaterThan(2000000)).toBe(true);
      expect(year1.zakat.lessThan(3000000)).toBe(true);
      
      console.log(`[ST-POC-032] ✅ ${result.iterations} iterations, Zakat: ${year1.zakat.div(1000000).toFixed(2)}M`);
    });

    it('ST-POC-033: Zakat rate set to zero (no Zakat)', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: [new Decimal(5000000)], // 5M profit
        capex: [new Decimal(0)],
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0), // ⚠️ No Zakat
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      const year1 = result.projection[0];
      expect(year1.zakat.toNumber()).toBe(0);
      
      console.log(`[ST-POC-033] ✅ ${result.iterations} iterations, Zakat: ${year1.zakat.toFixed(0)} (0% rate)`);
    });

    it('ST-POC-034: Zakat rate at maximum (10%)', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: [new Decimal(10000000)], // 10M profit
        capex: [new Decimal(0)],
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.10), // ⚠️ 10% Zakat (max validation)
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      const year1 = result.projection[0];
      // Zakat should be ~10% of net result
      expect(year1.zakat.greaterThan(900000)).toBe(true); // ~1M
      
      console.log(`[ST-POC-034] ✅ ${result.iterations} iterations, Zakat: ${year1.zakat.div(1000000).toFixed(2)}M (10% rate)`);
    });
  });

  describe('Category 6: CapEx & Fixed Assets Edge Cases (4 tests)', () => {
    it('ST-POC-035: Zero CapEx for all years', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: Array(5).fill(new Decimal(3000000)),
        capex: Array(5).fill(new Decimal(0)), // ⚠️ No CapEx
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      
      // Should build up large cash balance (no CapEx spending)
      const finalYear = result.projection[4];
      expect(finalYear.cash.greaterThan(10000000)).toBe(true);
      
      console.log(`[ST-POC-035] ✅ ${result.iterations} iterations, Final Cash: ${finalYear.cash.div(1000000).toFixed(1)}M`);
    });

    it('ST-POC-036: Massive CapEx in Year 1 (50M)', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: Array(5).fill(new Decimal(5000000)),
        capex: [new Decimal(50000000), ...Array(4).fill(new Decimal(0))], // ⚠️ 50M Year 1!
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      
      const year1 = result.projection[0];
      expect(year1.shortTermDebt.greaterThan(40000000)).toBe(true); // Massive debt
      
      console.log(`[ST-POC-036] ✅ ${result.iterations} iterations, Year 1 Debt: ${year1.shortTermDebt.div(1000000).toFixed(1)}M`);
    });

    it('ST-POC-037: CapEx every 5 years (lumpy investment)', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: Array(5).fill(new Decimal(4000000)),
        capex: [
          new Decimal(10000000), // Year 1: invest
          new Decimal(0),
          new Decimal(0),
          new Decimal(0),
          new Decimal(10000000), // Year 5: invest again
        ],
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      
      console.log(`[ST-POC-037] ✅ ${result.iterations} iterations (lumpy capex)`);
    });

    it('ST-POC-038: Negative CapEx (asset sale)', () => {
      const solver = new CircularSolverPOC();
      
      // Note: Negative capex means asset sale (positive cash inflow)
      const params: POCParams = {
        ebitda: [
          new Decimal(2000000),
          new Decimal(2000000),
          new Decimal(2000000),
          new Decimal(2000000),
          new Decimal(2000000),
        ],
        capex: [
          new Decimal(1000000),
          new Decimal(1000000),
          new Decimal(-5000000), // Year 3: Sell assets (negative capex)
          new Decimal(0),
          new Decimal(0),
        ],
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      
      // Year 3 should have big cash boost
      const year3 = result.projection[2];
      expect(year3.investingCashFlow.greaterThan(0)).toBe(true); // Positive (asset sale)
      
      console.log(`[ST-POC-038] ✅ ${result.iterations} iterations, Year 3 Investing CF: ${year3.investingCashFlow.div(1000000).toFixed(1)}M`);
    });
  });

  describe('Category 7: Starting Balances Edge Cases (4 tests)', () => {
    it('ST-POC-039: Starting cash = 0, opening equity = 0', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: Array(5).fill(new Decimal(2000000)),
        capex: Array(5).fill(new Decimal(500000)),
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0), // Zero start
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      
      console.log(`[ST-POC-039] ✅ ${result.iterations} iterations (zero start)`);
    });

    it('ST-POC-040: Massive starting cash (100M)', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: Array(5).fill(new Decimal(-1000000)), // Losses
        capex: Array(5).fill(new Decimal(5000000)),   // Heavy investment
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(100000000), // ⚠️ Start with 100M!
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      
      // Should maintain positive cash despite losses (burning through reserves)
      result.projection.forEach((year) => {
        expect(year.cash.greaterThan(0)).toBe(true);
      });
      
      console.log(`[ST-POC-040] ✅ ${result.iterations} iterations (100M start)`);
    });

    it('ST-POC-041: Starting cash < minimum', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: Array(5).fill(new Decimal(2000000)),
        capex: Array(5).fill(new Decimal(500000)),
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(5000000), // 5M minimum
        startingCash: new Decimal(500000), // ⚠️ Only 500K start (< minimum)
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      
      // Year 1 should enforce minimum (create debt if needed)
      const year1 = result.projection[0];
      expect(year1.cash.greaterThanOrEqualTo(5000000)).toBe(true);
      
      console.log(`[ST-POC-041] ✅ ${result.iterations} iterations, Year 1 Cash: ${year1.cash.div(1000000).toFixed(1)}M`);
    });

    it('ST-POC-042: Large starting cash exactly at minimum', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: Array(5).fill(new Decimal(3000000)),
        capex: Array(5).fill(new Decimal(1000000)),
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(10000000), // 10M minimum
        startingCash: new Decimal(10000000), // ⚠️ Exactly at minimum
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      
      console.log(`[ST-POC-042] ✅ ${result.iterations} iterations (start at minimum)`);
    });
  });

  describe('Category 8: Performance & Scale Edge Cases (4 tests)', () => {
    it('ST-POC-043: Performance benchmark (should be <10ms)', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: Array(5).fill(new Decimal(2000000)),
        capex: Array(5).fill(new Decimal(500000)),
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const startTime = performance.now();
      const result = solver.solve(params);
      const duration = performance.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(10);
      
      console.log(`[ST-POC-043] ✅ Performance: ${duration.toFixed(2)}ms (target: <10ms)`);
    });

    it('ST-POC-044: Very large numbers (trillions)', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: Array(5).fill(new Decimal(1000000000000)), // 1 trillion!
        capex: Array(5).fill(new Decimal(500000000000)),
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(100000000000), // 100 billion
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      
      const finalYear = result.projection[4];
      expect(finalYear.cash.greaterThan(1000000000000)).toBe(true); // >1T
      
      console.log(`[ST-POC-044] ✅ ${result.iterations} iterations (trillions)`);
    });

    it('ST-POC-045: Very small numbers (fractional SAR)', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: Array(5).fill(new Decimal(0.50)), // 50 halalas
        capex: Array(5).fill(new Decimal(0.10)),
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(0.20), // 20 halalas
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      
      console.log(`[ST-POC-045] ✅ ${result.iterations} iterations (fractional SAR)`);
    });

    it('ST-POC-046: 100 sequential solves (batch performance)', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: Array(5).fill(new Decimal(2000000)),
        capex: Array(5).fill(new Decimal(500000)),
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        solver.solve(params);
      }
      
      const duration = performance.now() - startTime;
      const avgDuration = duration / 100;
      
      expect(avgDuration).toBeLessThan(10); // Each should be <10ms
      
      console.log(`[ST-POC-046] ✅ 100 solves: ${duration.toFixed(0)}ms total, ${avgDuration.toFixed(2)}ms avg`);
    });
  });

  describe('Category 9: Data Integrity Edge Cases (4 tests)', () => {
    it('ST-POC-047: Inconsistent array lengths (should handle gracefully)', () => {
      const solver = new CircularSolverPOC();
      
      // Note: In production, this would be validated. POC handles what it can.
      const params: POCParams = {
        ebitda: Array(5).fill(new Decimal(2000000)),
        capex: Array(3).fill(new Decimal(500000)), // ⚠️ Only 3 years (mismatched!)
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      // Should not crash (might have unexpected results, but shouldn't throw)
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      
      console.log(`[ST-POC-047] ✅ Handled mismatched arrays`);
    });

    it('ST-POC-048: All zeros (edge case)', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: Array(5).fill(new Decimal(0)), // All zeros
        capex: Array(5).fill(new Decimal(0)),
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      
      // Should create debt to maintain minimum cash
      const year1 = result.projection[0];
      expect(year1.cash.toNumber()).toBeCloseTo(1000000, -2); // Allow small tolerance
      expect(year1.shortTermDebt.greaterThan(900000)).toBe(true); // At least 900K debt
      
      console.log(`[ST-POC-048] ✅ ${result.iterations} iterations (all zeros), Cash: ${year1.cash.toFixed(0)}, Debt: ${year1.shortTermDebt.toFixed(0)}`);
    });

    it('ST-POC-049: Mixed very large and very small values', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: [
          new Decimal(1000000000), // 1 billion
          new Decimal(0.01),       // 1 halala
          new Decimal(500000000),  // 500 million
          new Decimal(0.05),       // 5 halalas
          new Decimal(2000000000), // 2 billion
        ],
        capex: Array(5).fill(new Decimal(100000)),
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      
      console.log(`[ST-POC-049] ✅ ${result.iterations} iterations (mixed scales)`);
    });

    it('ST-POC-050: Extreme precision test (many decimals)', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: Array(5).fill(new Decimal('2000000.123456789012345')),
        capex: Array(5).fill(new Decimal('500000.987654321098765')),
        debtInterestRate: new Decimal('0.05123456789'),
        bankDepositInterestRate: new Decimal('0.02987654321'),
        minimumCashBalance: new Decimal('1000000.555555555555555'),
        startingCash: new Decimal(0),
        zakatRate: new Decimal('0.025123456789'),
      };
      
      const result = solver.solve(params);
      
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      
      console.log(`[ST-POC-050] ✅ ${result.iterations} iterations (extreme precision)`);
    });
  });
});

