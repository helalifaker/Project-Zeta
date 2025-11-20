/**
 * Proof of Concept - Circular Calculation Solver Tests
 * 
 * Purpose: Validate that circular calculations converge reliably BEFORE
 * building the full system.
 * 
 * Success Criteria:
 * - Convergence within 5 iterations for 90% of scenarios
 * - Performance < 10ms per scenario (5-year model)
 * - Clear understanding of edge cases
 * 
 * Reference: FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md (lines 1159-1424)
 */

import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  CircularSolverPOC,
  type POCParams,
  type POCResult,
} from '../circular-solver-poc';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

describe('Phase 0 POC - Day -3: Simple Circular Calculation', () => {
  describe('Basic Convergence Tests (5 mandatory scenarios)', () => {
    it('ST-POC-001: Positive EBITDA, no debt needed (typical case)', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: [
          new Decimal(2000000), // Year 1: 2M profit
          new Decimal(2200000), // Year 2: 2.2M profit
          new Decimal(2400000), // Year 3: 2.4M profit
          new Decimal(2600000), // Year 4: 2.6M profit
          new Decimal(2800000), // Year 5: 2.8M profit
        ],
        capex: [
          new Decimal(500000), // Year 1: 500K capex
          new Decimal(300000), // Year 2: 300K capex
          new Decimal(200000), // Year 3: 200K capex
          new Decimal(100000), // Year 4: 100K capex
          new Decimal(0),      // Year 5: 0 capex
        ],
        debtInterestRate: new Decimal(0.05), // 5%
        bankDepositInterestRate: new Decimal(0.02), // 2%
        minimumCashBalance: new Decimal(1000000), // 1M SAR minimum
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025), // 2.5% Zakat
      };
      
      const startTime = performance.now();
      const result = solver.solve(params);
      const duration = performance.now() - startTime;
      
      // Assertions
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      expect(result.iterations).toBeLessThanOrEqual(5);
      expect(duration).toBeLessThan(10); // <10ms
      
      // Verify no debt needed (positive cash flow)
      const finalYear = result.projection[4];
      expect(finalYear.shortTermDebt.toNumber()).toBe(0);
      expect(finalYear.cash.greaterThan(1000000)).toBe(true);
      
      console.log(`[ST-POC-001] ✅ Converged in ${result.iterations} iterations, ${duration.toFixed(2)}ms`);
    });

    it('ST-POC-002: Negative EBITDA, debt created (loss scenario)', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: [
          new Decimal(-500000),  // Year 1: 500K loss
          new Decimal(-300000),  // Year 2: 300K loss
          new Decimal(0),        // Year 3: break-even
          new Decimal(200000),   // Year 4: 200K profit (recovery)
          new Decimal(500000),   // Year 5: 500K profit
        ],
        capex: [
          new Decimal(100000),
          new Decimal(100000),
          new Decimal(50000),
          new Decimal(0),
          new Decimal(0),
        ],
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const startTime = performance.now();
      const result = solver.solve(params);
      const duration = performance.now() - startTime;
      
      // Assertions
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      expect(result.iterations).toBeLessThanOrEqual(5);
      expect(duration).toBeLessThan(10);
      
      // Verify debt created (negative cash flow)
      const year1 = result.projection[0];
      expect(year1.shortTermDebt.greaterThan(0)).toBe(true);
      expect(year1.cash.toNumber()).toBe(1000000); // Enforced minimum
      
      console.log(`[ST-POC-002] ✅ Converged in ${result.iterations} iterations, ${duration.toFixed(2)}ms`);
      console.log(`  Year 1 Debt: ${year1.shortTermDebt.toFixed(0)} SAR`);
    });

    it('ST-POC-003: Oscillating cash flow (convergence challenge)', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: [
          new Decimal(2000000),  // Year 1: profit
          new Decimal(-500000),  // Year 2: loss
          new Decimal(1800000),  // Year 3: profit
          new Decimal(-300000),  // Year 4: loss
          new Decimal(2500000),  // Year 5: big profit
        ],
        capex: [
          new Decimal(1000000), // Year 1: large capex
          new Decimal(0),
          new Decimal(800000),  // Year 3: large capex
          new Decimal(0),
          new Decimal(0),
        ],
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const startTime = performance.now();
      const result = solver.solve(params);
      const duration = performance.now() - startTime;
      
      // Assertions
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      expect(result.iterations).toBeLessThanOrEqual(8); // May need more iterations
      expect(duration).toBeLessThan(15); // Allow slightly more time
      
      console.log(`[ST-POC-003] ✅ Converged in ${result.iterations} iterations, ${duration.toFixed(2)}ms`);
    });

    it('ST-POC-004: Extreme debt interest rate (20%)', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: [
          new Decimal(1000000),
          new Decimal(1100000),
          new Decimal(1200000),
          new Decimal(1300000),
          new Decimal(1400000),
        ],
        capex: [
          new Decimal(2000000), // Large initial capex creates debt
          new Decimal(0),
          new Decimal(0),
          new Decimal(0),
          new Decimal(0),
        ],
        debtInterestRate: new Decimal(0.20), // ⚠️ 20% interest!
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(1000000),
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const startTime = performance.now();
      const result = solver.solve(params);
      const duration = performance.now() - startTime;
      
      // Assertions
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      expect(result.iterations).toBeLessThanOrEqual(10); // High interest may slow convergence
      expect(duration).toBeLessThan(20);
      
      // Verify high interest expense
      const year2 = result.projection[1];
      expect(year2.interestExpense.greaterThan(0)).toBe(true);
      
      console.log(`[ST-POC-004] ✅ Converged in ${result.iterations} iterations, ${duration.toFixed(2)}ms`);
      console.log(`  Year 2 Interest Expense: ${year2.interestExpense.toFixed(0)} SAR`);
    });

    it('ST-POC-005: Very high minimum cash balance (50M)', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: [
          new Decimal(5000000),
          new Decimal(5500000),
          new Decimal(6000000),
          new Decimal(6500000),
          new Decimal(7000000),
        ],
        capex: [
          new Decimal(1000000),
          new Decimal(1000000),
          new Decimal(1000000),
          new Decimal(1000000),
          new Decimal(1000000),
        ],
        debtInterestRate: new Decimal(0.05),
        bankDepositInterestRate: new Decimal(0.02),
        minimumCashBalance: new Decimal(50000000), // ⚠️ 50M minimum!
        startingCash: new Decimal(0),
        zakatRate: new Decimal(0.025),
      };
      
      const startTime = performance.now();
      const result = solver.solve(params);
      const duration = performance.now() - startTime;
      
      // Assertions
      expect(result.success).toBe(true);
      expect(result.converged).toBe(true);
      expect(result.iterations).toBeLessThanOrEqual(10);
      expect(duration).toBeLessThan(20);
      
      // Verify large debt created to maintain minimum
      const year1 = result.projection[0];
      expect(year1.shortTermDebt.greaterThan(40000000)).toBe(true);
      expect(year1.cash.toNumber()).toBe(50000000); // Enforced minimum
      
      console.log(`[ST-POC-005] ✅ Converged in ${result.iterations} iterations, ${duration.toFixed(2)}ms`);
      console.log(`  Year 1 Debt: ${year1.shortTermDebt.div(1000000).toFixed(1)}M SAR`);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete typical scenario in <10ms', () => {
      const solver = new CircularSolverPOC();
      
      const params: POCParams = {
        ebitda: [
          new Decimal(2000000),
          new Decimal(2200000),
          new Decimal(2400000),
          new Decimal(2600000),
          new Decimal(2800000),
        ],
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
      
      console.log(`[PERFORMANCE] ✅ ${duration.toFixed(2)}ms (target: <10ms)`);
    });
  });
});

