/**
 * Convergence Algorithm Tests - Edge Cases
 * 
 * Purpose: Test convergence algorithm handles edge cases correctly
 * (division by zero, near-zero values, negative values, mixed signs)
 * 
 * Reference: FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md (lines 1356-1416)
 */

import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { CircularSolverPOC, type YearProjection } from '../circular-solver-poc';

// Configure Decimal.js
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Helper to create mock projection
 */
function createMockProjection(netResults: Decimal[]): YearProjection[] {
  return netResults.map((netResult, index) => ({
    year: index + 1,
    ebitda: new Decimal(0),
    capex: new Decimal(0),
    depreciation: new Decimal(0),
    interestExpense: new Decimal(0),
    interestIncome: new Decimal(0),
    zakat: new Decimal(0),
    netResult,
    operatingCashFlow: netResult,
    investingCashFlow: new Decimal(0),
    netCashFlow: netResult,
    theoreticalCash: new Decimal(0),
    cash: new Decimal(0),
    shortTermDebt: new Decimal(0),
  }));
}

describe('Convergence Algorithm - Edge Cases', () => {
  // Access private method via any cast (for testing only)
  const solver = new CircularSolverPOC();
  const checkConvergence = (solver as any).checkConvergence.bind(solver);

  describe('ST-CONV-001: Division by zero protection', () => {
    it('should use absolute error when Net Result = 0', () => {
      const prev = createMockProjection([new Decimal(0)]);
      const curr = createMockProjection([new Decimal(0.00005)]); // Very small change

      const result = checkConvergence(prev, curr);

      // Should use absolute error (not division)
      expect(result.errorType).toBe('absolute');
      expect(result.converged).toBe(true); // 0.00005 < 0.0001 threshold
    });

    it('should converge when both iterations are zero', () => {
      const prev = createMockProjection([new Decimal(0)]);
      const curr = createMockProjection([new Decimal(0)]);

      const result = checkConvergence(prev, curr);

      expect(result.converged).toBe(true);
      expect(result.maxError.toNumber()).toBe(0);
    });
  });

  describe('ST-CONV-002: Near-zero values use absolute error', () => {
    it('should use absolute error for values < 0.01', () => {
      const prev = createMockProjection([new Decimal(0.008)]);
      const curr = createMockProjection([new Decimal(0.00805)]); // Smaller change

      const result = checkConvergence(prev, curr);

      expect(result.errorType).toBe('absolute');
      expect(result.maxError.toNumber()).toBeCloseTo(0.00005, 6);
      expect(result.converged).toBe(true); // 0.00005 < 0.0001 threshold
    });

    it('should converge when change is very small', () => {
      const prev = createMockProjection([new Decimal(0.009)]);
      const curr = createMockProjection([new Decimal(0.0091)]);

      const result = checkConvergence(prev, curr);

      expect(result.converged).toBe(true);
    });
  });

  describe('ST-CONV-003: Large values use relative error', () => {
    it('should use relative error for values > 0.01', () => {
      const prev = createMockProjection([new Decimal(1000000)]); // 1M
      const curr = createMockProjection([new Decimal(1000100)]); // 1M + 100

      const result = checkConvergence(prev, curr);

      expect(result.errorType).toBe('relative');
      expect(result.maxError.toNumber()).toBeCloseTo(0.0001, 5); // 0.01%
      expect(result.converged).toBe(true); // 0.0001 = 0.01% (at threshold)
    });

    it('should not converge when relative change is too large', () => {
      const prev = createMockProjection([new Decimal(1000000)]); // 1M
      const curr = createMockProjection([new Decimal(1010000)]); // 1M + 10K

      const result = checkConvergence(prev, curr);

      expect(result.errorType).toBe('relative');
      expect(result.maxError.toNumber()).toBeCloseTo(0.01, 5); // 1%
      expect(result.converged).toBe(false); // 1% > 0.01% threshold
    });
  });

  describe('ST-CONV-004: Negative values handled correctly', () => {
    it('should use absolute value for error calculation', () => {
      const prev = createMockProjection([new Decimal(-1000)]);
      const curr = createMockProjection([new Decimal(-1000.05)]); // Very small change

      const result = checkConvergence(prev, curr);

      // Should use absolute value: |(-1000.05) - (-1000)| / |-1000| = 0.05/1000 = 0.00005 = 0.005%
      expect(result.maxError.toNumber()).toBeCloseTo(0.00005, 6); // 0.005%
      expect(result.converged).toBe(true); // 0.005% < 0.01% threshold
    });

    it('should handle negative to positive transition', () => {
      const prev = createMockProjection([new Decimal(-100)]);
      const curr = createMockProjection([new Decimal(100)]);

      const result = checkConvergence(prev, curr);

      // Large change: |100 - (-100)| / |-100| = 200/100 = 2.0 = 200%
      expect(result.converged).toBe(false); // 200% > 0.01%
    });
  });

  describe('ST-CONV-005: Convergence with mixed positive/negative values', () => {
    it('should check convergence across all years', () => {
      const prev = createMockProjection([
        new Decimal(1000),    // Year 1: large positive
        new Decimal(-500),    // Year 2: medium negative
        new Decimal(0.005),   // Year 3: near-zero
      ]);

      const curr = createMockProjection([
        new Decimal(1000.1),  // Year 1: small change
        new Decimal(-500.05), // Year 2: small change
        new Decimal(0.0051),  // Year 3: small change
      ]);

      const result = checkConvergence(prev, curr);

      // All years should converge (small changes)
      expect(result.converged).toBe(true);
    });

    it('should fail if any year does not converge', () => {
      const prev = createMockProjection([
        new Decimal(1000),    // Year 1: will converge
        new Decimal(1000),    // Year 2: will NOT converge
        new Decimal(0.005),   // Year 3: will converge
      ]);

      const curr = createMockProjection([
        new Decimal(1000.1),  // Year 1: 0.01% change (OK)
        new Decimal(1010),    // Year 2: 1% change (TOO LARGE!)
        new Decimal(0.0051),  // Year 3: small change (OK)
      ]);

      const result = checkConvergence(prev, curr);

      expect(result.converged).toBe(false); // Year 2 fails
      expect(result.yearWithMaxError).toBe(2); // Identifies problematic year
    });
  });

  describe('Additional Edge Cases', () => {
    it('should handle very large numbers (trillions)', () => {
      const prev = createMockProjection([new Decimal(1e12)]); // 1 trillion
      const curr = createMockProjection([new Decimal(1e12 + 1e8)]); // +100M

      const result = checkConvergence(prev, curr);

      // 100M / 1T = 0.0001 = 0.01% (at threshold)
      expect(result.converged).toBe(true);
    });

    it('should handle very small numbers (fractional SAR)', () => {
      const prev = createMockProjection([new Decimal(0.0001)]);
      const curr = createMockProjection([new Decimal(0.00011)]);

      const result = checkConvergence(prev, curr);

      // Near-zero: use absolute error
      expect(result.errorType).toBe('absolute');
      expect(result.converged).toBe(true); // 0.00001 < 0.01 threshold
    });

    it('should track year with maximum error', () => {
      const prev = createMockProjection([
        new Decimal(1000),  // Year 1: 0.1% change
        new Decimal(1000),  // Year 2: 0.5% change (max)
        new Decimal(1000),  // Year 3: 0.2% change
      ]);

      const curr = createMockProjection([
        new Decimal(1001),  // Year 1: +1
        new Decimal(1005),  // Year 2: +5 (largest)
        new Decimal(1002),  // Year 3: +2
      ]);

      const result = checkConvergence(prev, curr);

      expect(result.yearWithMaxError).toBe(2); // Year 2 has max error
      expect(result.maxError.toNumber()).toBeCloseTo(0.005, 5); // 0.5%
    });
  });
});

