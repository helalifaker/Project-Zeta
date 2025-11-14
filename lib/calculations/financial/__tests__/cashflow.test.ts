/**
 * Unit Tests: Cash Flow Calculation
 */

import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  calculateCashFlowForYear,
  calculateCashFlow,
  type CashFlowParams,
} from '../cashflow';

describe('Cash Flow Calculation', () => {
  describe('calculateCashFlowForYear', () => {
    it('should calculate cash flow with positive EBITDA', () => {
      const result = calculateCashFlowForYear(
        20_000_000, // EBITDA: 20M
        2_000_000,  // Capex: 2M
        0,          // Interest: 0
        0.20        // Tax Rate: 20%
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Taxable Income: 20M - 0 = 20M
        // Taxes: 20M × 0.20 = 4M
        // Cash Flow: 20M - 2M - 0 - 4M = 14M
        expect(result.data.interest.toNumber()).toBe(0);
        expect(result.data.taxes.toNumber()).toBe(4_000_000);
        expect(result.data.cashFlow.toNumber()).toBe(14_000_000);
      }
    });

    it('should calculate cash flow with interest expense', () => {
      const result = calculateCashFlowForYear(
        20_000_000, // EBITDA: 20M
        2_000_000,  // Capex: 2M
        1_000_000,  // Interest: 1M
        0.20        // Tax Rate: 20%
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Taxable Income: 20M - 1M = 19M
        // Taxes: 19M × 0.20 = 3.8M
        // Cash Flow: 20M - 2M - 1M - 3.8M = 13.2M
        expect(result.data.interest.toNumber()).toBe(1_000_000);
        expect(result.data.taxes.toNumber()).toBe(3_800_000);
        expect(result.data.cashFlow.toNumber()).toBe(13_200_000);
      }
    });

    it('should calculate cash flow with zero capex', () => {
      const result = calculateCashFlowForYear(
        20_000_000, // EBITDA: 20M
        0,          // Capex: 0
        0,          // Interest: 0
        0.20        // Tax Rate: 20%
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Taxes: 20M × 0.20 = 4M
        // Cash Flow: 20M - 0 - 0 - 4M = 16M
        expect(result.data.taxes.toNumber()).toBe(4_000_000);
        expect(result.data.cashFlow.toNumber()).toBe(16_000_000);
      }
    });

    it('should calculate zero taxes for loss scenario', () => {
      const result = calculateCashFlowForYear(
        -5_000_000, // EBITDA: -5M (loss)
        2_000_000,  // Capex: 2M
        0,          // Interest: 0
        0.20        // Tax Rate: 20%
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Taxable Income: -5M - 0 = -5M (negative, so no tax)
        // Taxes: max(0, -5M) × 0.20 = 0
        // Cash Flow: -5M - 2M - 0 - 0 = -7M
        expect(result.data.taxes.toNumber()).toBe(0);
        expect(result.data.cashFlow.toNumber()).toBe(-7_000_000);
      }
    });

    it('should calculate zero taxes when EBITDA equals interest', () => {
      const result = calculateCashFlowForYear(
        10_000_000, // EBITDA: 10M
        2_000_000,  // Capex: 2M
        10_000_000, // Interest: 10M (equals EBITDA)
        0.20        // Tax Rate: 20%
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Taxable Income: 10M - 10M = 0 (no profit)
        // Taxes: max(0, 0) × 0.20 = 0
        // Cash Flow: 10M - 2M - 10M - 0 = -2M
        expect(result.data.taxes.toNumber()).toBe(0);
        expect(result.data.cashFlow.toNumber()).toBe(-2_000_000);
      }
    });

    it('should handle zero tax rate', () => {
      const result = calculateCashFlowForYear(
        20_000_000, // EBITDA: 20M
        2_000_000,  // Capex: 2M
        0,          // Interest: 0
        0           // Tax Rate: 0%
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Taxes: 20M × 0 = 0
        // Cash Flow: 20M - 2M - 0 - 0 = 18M
        expect(result.data.taxes.toNumber()).toBe(0);
        expect(result.data.cashFlow.toNumber()).toBe(18_000_000);
      }
    });

    it('should handle null/undefined interest (defaults to zero)', () => {
      const result = calculateCashFlowForYear(
        20_000_000,
        2_000_000,
        null,       // Interest: null
        0.20
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.interest.toNumber()).toBe(0);
        expect(result.data.cashFlow.toNumber()).toBe(14_000_000);
      }
    });

    it('should reject negative capex', () => {
      const result = calculateCashFlowForYear(
        20_000_000,
        -2_000_000,
        0,
        0.20
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Capex cannot be negative');
      }
    });

    it('should reject negative interest', () => {
      const result = calculateCashFlowForYear(
        20_000_000,
        2_000_000,
        -1_000_000,
        0.20
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Interest cannot be negative');
      }
    });

    it('should reject negative tax rate', () => {
      const result = calculateCashFlowForYear(
        20_000_000,
        2_000_000,
        0,
        -0.01
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Tax rate must be between 0 and 1');
      }
    });

    it('should reject tax rate > 100%', () => {
      const result = calculateCashFlowForYear(
        20_000_000,
        2_000_000,
        0,
        1.1
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Tax rate must be between 0 and 1');
      }
    });

    it('should work with Decimal.js inputs', () => {
      const result = calculateCashFlowForYear(
        new Decimal(20_000_000),
        new Decimal(2_000_000),
        new Decimal(0),
        new Decimal(0.20)
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cashFlow.toNumber()).toBe(14_000_000);
      }
    });
  });

  describe('calculateCashFlow', () => {
    it('should calculate cash flow for multiple years', () => {
      const params: CashFlowParams = {
        ebitdaByYear: [
          { year: 2028, ebitda: new Decimal(20_000_000) },
          { year: 2029, ebitda: new Decimal(22_000_000) },
        ],
        capexItems: [
          { year: 2028, amount: new Decimal(2_000_000), category: 'BUILDING' },
          { year: 2029, amount: new Decimal(1_000_000), category: 'EQUIPMENT' },
        ],
        interestByYear: [
          { year: 2028, interest: new Decimal(0) },
          { year: 2029, interest: new Decimal(500_000) },
        ],
        taxRate: 0.20,
      };

      const result = calculateCashFlow(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        // Year 2028: 20M - 2M - 0 - 4M = 14M
        expect(result.data[0]?.year).toBe(2028);
        expect(result.data[0]?.ebitda.toNumber()).toBe(20_000_000);
        expect(result.data[0]?.capex.toNumber()).toBe(2_000_000);
        expect(result.data[0]?.interest.toNumber()).toBe(0);
        expect(result.data[0]?.taxes.toNumber()).toBe(4_000_000);
        expect(result.data[0]?.cashFlow.toNumber()).toBe(14_000_000);
        // Year 2029: 22M - 1M - 0.5M - 4.3M = 16.2M
        expect(result.data[1]?.year).toBe(2029);
        expect(result.data[1]?.cashFlow.toNumber()).toBe(16_200_000);
      }
    });

    it('should sum multiple capex items for same year', () => {
      const params: CashFlowParams = {
        ebitdaByYear: [
          { year: 2028, ebitda: new Decimal(20_000_000) },
        ],
        capexItems: [
          { year: 2028, amount: new Decimal(2_000_000), category: 'BUILDING' },
          { year: 2028, amount: new Decimal(1_000_000), category: 'EQUIPMENT' },
        ],
        taxRate: 0.20,
      };

      const result = calculateCashFlow(params);

      expect(result.success).toBe(true);
      if (result.success) {
        // Total capex: 2M + 1M = 3M
        expect(result.data[0]?.capex.toNumber()).toBe(3_000_000);
        // Cash Flow: 20M - 3M - 0 - 4M = 13M
        expect(result.data[0]?.cashFlow.toNumber()).toBe(13_000_000);
      }
    });

    it('should default interest to zero when not provided', () => {
      const params: CashFlowParams = {
        ebitdaByYear: [
          { year: 2028, ebitda: new Decimal(20_000_000) },
        ],
        capexItems: [
          { year: 2028, amount: new Decimal(2_000_000) },
        ],
        // interestByYear not provided
        taxRate: 0.20,
      };

      const result = calculateCashFlow(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0]?.interest.toNumber()).toBe(0);
        expect(result.data[0]?.cashFlow.toNumber()).toBe(14_000_000);
      }
    });

    it('should default capex to zero when no items for year', () => {
      const params: CashFlowParams = {
        ebitdaByYear: [
          { year: 2028, ebitda: new Decimal(20_000_000) },
          { year: 2029, ebitda: new Decimal(22_000_000) },
        ],
        capexItems: [
          { year: 2028, amount: new Decimal(2_000_000) },
          // No capex for 2029
        ],
        taxRate: 0.20,
      };

      const result = calculateCashFlow(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0]?.capex.toNumber()).toBe(2_000_000);
        expect(result.data[1]?.capex.toNumber()).toBe(0);
      }
    });

    it('should handle loss scenarios (zero taxes)', () => {
      const params: CashFlowParams = {
        ebitdaByYear: [
          { year: 2028, ebitda: new Decimal(-5_000_000) }, // Loss
          { year: 2029, ebitda: new Decimal(20_000_000) }, // Profit
        ],
        capexItems: [
          { year: 2028, amount: new Decimal(2_000_000) },
          { year: 2029, amount: new Decimal(2_000_000) },
        ],
        taxRate: 0.20,
      };

      const result = calculateCashFlow(params);

      expect(result.success).toBe(true);
      if (result.success) {
        // Year 2028: Loss, no taxes
        expect(result.data[0]?.taxes.toNumber()).toBe(0);
        expect(result.data[0]?.cashFlow.toNumber()).toBe(-7_000_000);
        // Year 2029: Profit, taxes apply
        expect(result.data[1]?.taxes.toNumber()).toBe(4_000_000);
        expect(result.data[1]?.cashFlow.toNumber()).toBe(14_000_000);
      }
    });

    it('should reject negative capex amount', () => {
      const params: CashFlowParams = {
        ebitdaByYear: [
          { year: 2028, ebitda: new Decimal(20_000_000) },
        ],
        capexItems: [
          { year: 2028, amount: new Decimal(-2_000_000) },
        ],
        taxRate: 0.20,
      };

      const result = calculateCashFlow(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Capex amount cannot be negative');
      }
    });

    it('should reject negative interest', () => {
      const params: CashFlowParams = {
        ebitdaByYear: [
          { year: 2028, ebitda: new Decimal(20_000_000) },
        ],
        capexItems: [],
        interestByYear: [
          { year: 2028, interest: new Decimal(-1_000_000) },
        ],
        taxRate: 0.20,
      };

      const result = calculateCashFlow(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Interest cannot be negative');
      }
    });

    it('should reject empty EBITDA array', () => {
      const params: CashFlowParams = {
        ebitdaByYear: [],
        capexItems: [],
        taxRate: 0.20,
      };

      const result = calculateCashFlow(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('EBITDA data is required');
      }
    });
  });
});

