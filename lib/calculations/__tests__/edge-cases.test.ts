/**
 * Edge Case Tests for Financial Calculations
 * Tests zero values, negative values, very large numbers, division by zero, etc.
 */

import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { calculateFixedEscalationRent } from '../rent/fixed-escalation';
import { calculateRevenueShareRent } from '../rent/revenue-share';
import { calculatePartnerModelBaseRent } from '../rent/partner-model';
import { calculateRevenueForYear } from '../revenue/revenue';
import { calculateTuitionGrowth } from '../revenue/tuition-growth';
import { calculateEBITDAForYear } from '../financial/ebitda';
import { calculateCashFlowForYear } from '../financial/cashflow';
import { calculateNPV } from '../financial/npv';

describe('Edge Cases: Financial Calculations', () => {
  describe('Rent Calculations - Edge Cases', () => {
    it('should handle zero escalation rate (no growth)', () => {
      const result = calculateFixedEscalationRent({
        baseRent: 1000000,
        escalationRate: 0,
        startYear: 2028,
        endYear: 2030,
      });

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data).toHaveLength(3);
        // All years should have same rent
        expect(result.data[0]?.rent.toString()).toBe('1000000');
        expect(result.data[1]?.rent.toString()).toBe('1000000');
        expect(result.data[2]?.rent.toString()).toBe('1000000');
      }
    });

    it('should handle very large base rent (100M+ SAR)', () => {
      const result = calculateFixedEscalationRent({
        baseRent: 100000000, // 100M SAR
        escalationRate: 0.04,
        startYear: 2028,
        endYear: 2029,
      });

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data[0]?.rent.toNumber()).toBe(100000000);
        expect(result.data[1]?.rent.toNumber()).toBe(104000000);
      }
    });

    it('should handle zero revenue in revenue share model', () => {
      const result = calculateRevenueShareRent({
        revenueByYear: [
          { year: 2028, revenue: 0 },
          { year: 2029, revenue: 10000000 },
        ],
        revenueSharePercent: 0.08,
      });

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data[0]?.rent.toString()).toBe('0');
        expect(result.data[0]?.rentLoad.toString()).toBe('0'); // Division by zero handled
        expect(result.data[1]?.rent.toNumber()).toBe(800000);
      }
    });

    it('should handle very large land size in partner model', () => {
      const result = calculatePartnerModelBaseRent(
        1000000, // 1M sqm
        5000, // 5K SAR/sqm
        800000, // 800K sqm BUA
        3000, // 3K SAR/sqm
        0.045 // 4.5% yield
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // (1M × 5K + 800K × 3K) × 0.045 = (5B + 2.4B) × 0.045 = 333M
        const expected = (1000000 * 5000 + 800000 * 3000) * 0.045;
        expect(result.data.toNumber()).toBeCloseTo(expected, 0);
      }
    });
  });

  describe('Revenue Calculations - Edge Cases', () => {
    it('should handle zero students (zero revenue)', () => {
      const result = calculateRevenueForYear(50000, 0);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toString()).toBe('0');
      }
    });

    it('should handle zero tuition (zero revenue)', () => {
      const result = calculateRevenueForYear(0, 100);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toString()).toBe('0');
      }
    });

    it('should handle very large tuition (1M SAR)', () => {
      const result = calculateRevenueForYear(1000000, 500);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(500000000); // 500M SAR
      }
    });

    it('should handle very large student count (10K students)', () => {
      const result = calculateRevenueForYear(50000, 10000);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(500000000); // 500M SAR
      }
    });

    it('should handle zero CPI rate in tuition growth', () => {
      const result = calculateTuitionGrowth({
        tuitionBase: 50000,
        cpiRate: 0,
        cpiFrequency: 1,
        baseYear: 2028,
        startYear: 2028,
        endYear: 2030,
      });

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        // All years should have same tuition
        expect(result.data[0]?.tuition.toString()).toBe('50000');
        expect(result.data[1]?.tuition.toString()).toBe('50000');
        expect(result.data[2]?.tuition.toString()).toBe('50000');
      }
    });
  });

  describe('EBITDA Calculations - Edge Cases', () => {
    it('should handle negative EBITDA (loss scenario)', () => {
      const result = calculateEBITDAForYear(
        new Decimal(10000000),
        new Decimal(8000000),
        new Decimal(5000000),
        new Decimal(3000000)
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // 10M - 8M - 5M - 3M = -6M
        expect(result.data.ebitda.isNegative()).toBe(true);
        expect(result.data.ebitda.toNumber()).toBe(-6000000);
      }
    });

    it('should handle zero revenue (EBITDA margin = 0)', () => {
      const result = calculateEBITDAForYear(
        new Decimal(0),
        new Decimal(5000000),
        new Decimal(3000000),
        new Decimal(2000000)
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ebitda.toNumber()).toBe(-10000000);
        expect(result.data.ebitdaMargin.toString()).toBe('0'); // Division by zero handled
      }
    });

    it('should handle very large revenue (1B SAR)', () => {
      const result = calculateEBITDAForYear(
        new Decimal(1000000000), // 1B SAR
        new Decimal(200000000),
        new Decimal(100000000),
        new Decimal(50000000)
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // 1B - 200M - 100M - 50M = 650M
        expect(result.data.ebitda.toNumber()).toBe(650000000);
        expect(result.data.ebitdaMargin.toNumber()).toBeCloseTo(65, 1);
      }
    });
  });

  describe('Cash Flow Calculations - Edge Cases', () => {
    it('should handle zero capex', () => {
      const result = calculateCashFlowForYear(
        new Decimal(10000000),
        new Decimal(0),
        new Decimal(0),
        new Decimal(0.15)
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // 10M - 0 - 1.5M = 8.5M
        expect(result.data.cashFlow.toNumber()).toBe(8500000);
      }
    });

    it('should handle zero tax rate', () => {
      const result = calculateCashFlowForYear(
        new Decimal(10000000),
        new Decimal(2000000),
        new Decimal(0),
        new Decimal(0)
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // 10M - 2M - 0 = 8M
        expect(result.data.cashFlow.toNumber()).toBe(8000000);
      }
    });

    it('should handle loss scenario (zero taxes)', () => {
      const result = calculateCashFlowForYear(
        new Decimal(-5000000), // Loss
        new Decimal(1000000),
        new Decimal(0),
        new Decimal(0.15)
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // -5M - 1M - 0 (no tax on losses) = -6M
        expect(result.data.cashFlow.toNumber()).toBe(-6000000);
        expect(result.data.taxes.toString()).toBe('0');
      }
    });
  });

  describe('NPV Calculations - Edge Cases', () => {
    it('should handle zero discount rate', () => {
      const result = calculateNPV({
        amountsByYear: [
          { year: 2028, amount: new Decimal(5000000) },
          { year: 2029, amount: new Decimal(6000000) },
          { year: 2030, amount: new Decimal(7000000) },
        ],
        discountRate: new Decimal(0),
        startYear: 2028,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // With 0% discount, NPV = sum of cash flows
        expect(result.data.npv.toNumber()).toBe(18000000);
      }
    });

    it('should handle negative cash flows (loss years)', () => {
      const result = calculateNPV({
        amountsByYear: [
          { year: 2028, amount: new Decimal(-5000000) }, // Loss year
          { year: 2029, amount: new Decimal(10000000) }, // Profit year
          { year: 2030, amount: new Decimal(15000000) }, // Profit year
        ],
        discountRate: new Decimal(0.08),
        startYear: 2028,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // NPV can be positive or negative depending on amounts
        expect(result.data.npv.toNumber()).toBeGreaterThan(0);
      }
    });

    it('should handle very large cash flows (100M+ SAR)', () => {
      const result = calculateNPV({
        amountsByYear: [
          { year: 2028, amount: new Decimal(100000000) }, // 100M
          { year: 2029, amount: new Decimal(120000000) }, // 120M
          { year: 2030, amount: new Decimal(150000000) }, // 150M
        ],
        discountRate: new Decimal(0.08),
        startYear: 2028,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.npv.toNumber()).toBeGreaterThan(300000000);
      }
    });

    it('should handle all zero cash flows', () => {
      const result = calculateNPV({
        amountsByYear: [
          { year: 2028, amount: new Decimal(0) },
          { year: 2029, amount: new Decimal(0) },
          { year: 2030, amount: new Decimal(0) },
        ],
        discountRate: new Decimal(0.08),
        startYear: 2028,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.npv.toString()).toBe('0');
      }
    });
  });

  describe('Boundary Values', () => {
    it('should handle minimum valid year (2023)', () => {
      const result = calculateFixedEscalationRent({
        baseRent: 1000000,
        escalationRate: 0.04,
        startYear: 2023,
        endYear: 2023,
      });

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data[0]?.year).toBe(2023);
      }
    });

    it('should handle maximum valid year (2052)', () => {
      const result = calculateFixedEscalationRent({
        baseRent: 1000000,
        escalationRate: 0.04,
        startYear: 2052,
        endYear: 2052,
      });

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data[0]?.year).toBe(2052);
      }
    });

    it('should reject year before 2023', () => {
      const result = calculateFixedEscalationRent({
        baseRent: 1000000,
        escalationRate: 0.04,
        startYear: 2022,
        endYear: 2023,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('2023');
      }
    });

    it('should reject year after 2052', () => {
      const result = calculateFixedEscalationRent({
        baseRent: 1000000,
        escalationRate: 0.04,
        startYear: 2052,
        endYear: 2053,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('2052');
      }
    });
  });
});

