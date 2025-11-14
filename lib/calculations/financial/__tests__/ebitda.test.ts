/**
 * Unit Tests: EBITDA Calculation
 */

import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  calculateEBITDAForYear,
  calculateEBITDA,
  type EBITDAParams,
} from '../ebitda';

describe('EBITDA Calculation', () => {
  describe('calculateEBITDAForYear', () => {
    it('should calculate positive EBITDA', () => {
      const result = calculateEBITDAForYear(
        50_000_000, // Revenue: 50M
        15_000_000, // Staff Cost: 15M
        10_000_000, // Rent: 10M
        5_000_000   // Opex: 5M
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // EBITDA = 50M - 15M - 10M - 5M = 20M
        expect(result.data.ebitda.toNumber()).toBe(20_000_000);
        // Margin = (20M / 50M) × 100 = 40%
        expect(result.data.ebitdaMargin.toNumber()).toBe(40);
      }
    });

    it('should calculate negative EBITDA', () => {
      const result = calculateEBITDAForYear(
        30_000_000, // Revenue: 30M
        15_000_000, // Staff Cost: 15M
        10_000_000, // Rent: 10M
        10_000_000  // Opex: 10M
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // EBITDA = 30M - 15M - 10M - 10M = -5M
        expect(result.data.ebitda.toNumber()).toBe(-5_000_000);
        // Margin = (-5M / 30M) × 100 = -16.67%
        expect(result.data.ebitdaMargin.toNumber()).toBeCloseTo(-16.67, 1);
      }
    });

    it('should calculate zero EBITDA', () => {
      const result = calculateEBITDAForYear(
        30_000_000, // Revenue: 30M
        15_000_000, // Staff Cost: 15M
        10_000_000, // Rent: 10M
        5_000_000   // Opex: 5M
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // EBITDA = 30M - 15M - 10M - 5M = 0
        expect(result.data.ebitda.toNumber()).toBe(0);
        expect(result.data.ebitdaMargin.toNumber()).toBe(0);
      }
    });

    it('should handle zero revenue', () => {
      const result = calculateEBITDAForYear(
        0,           // Revenue: 0
        15_000_000,  // Staff Cost: 15M
        10_000_000,  // Rent: 10M
        5_000_000    // Opex: 5M
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // EBITDA = 0 - 15M - 10M - 5M = -30M
        expect(result.data.ebitda.toNumber()).toBe(-30_000_000);
        // Margin = 0 when revenue is zero
        expect(result.data.ebitdaMargin.toNumber()).toBe(0);
      }
    });

    it('should handle zero costs', () => {
      const result = calculateEBITDAForYear(
        50_000_000, // Revenue: 50M
        0,          // Staff Cost: 0
        0,          // Rent: 0
        0           // Opex: 0
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // EBITDA = 50M - 0 - 0 - 0 = 50M
        expect(result.data.ebitda.toNumber()).toBe(50_000_000);
        // Margin = (50M / 50M) × 100 = 100%
        expect(result.data.ebitdaMargin.toNumber()).toBe(100);
      }
    });

    it('should reject negative revenue', () => {
      const result = calculateEBITDAForYear(
        -50_000_000,
        15_000_000,
        10_000_000,
        5_000_000
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Revenue cannot be negative');
      }
    });

    it('should reject negative staff cost', () => {
      const result = calculateEBITDAForYear(
        50_000_000,
        -15_000_000,
        10_000_000,
        5_000_000
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Staff cost cannot be negative');
      }
    });

    it('should reject negative rent', () => {
      const result = calculateEBITDAForYear(
        50_000_000,
        15_000_000,
        -10_000_000,
        5_000_000
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Rent cannot be negative');
      }
    });

    it('should reject negative opex', () => {
      const result = calculateEBITDAForYear(
        50_000_000,
        15_000_000,
        10_000_000,
        -5_000_000
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Opex cannot be negative');
      }
    });

    it('should work with Decimal.js inputs', () => {
      const result = calculateEBITDAForYear(
        new Decimal(50_000_000),
        new Decimal(15_000_000),
        new Decimal(10_000_000),
        new Decimal(5_000_000)
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ebitda.toNumber()).toBe(20_000_000);
        expect(result.data.ebitdaMargin.toNumber()).toBe(40);
      }
    });
  });

  describe('calculateEBITDA', () => {
    it('should calculate EBITDA for multiple years', () => {
      const params: EBITDAParams = {
        revenueByYear: [
          { year: 2028, revenue: new Decimal(50_000_000) },
          { year: 2029, revenue: new Decimal(52_000_000) },
        ],
        staffCostByYear: [
          { year: 2028, staffCost: new Decimal(15_000_000) },
          { year: 2029, staffCost: new Decimal(15_450_000) },
        ],
        rentByYear: [
          { year: 2028, rent: new Decimal(10_000_000) },
          { year: 2029, rent: new Decimal(10_000_000) },
        ],
        opexByYear: [
          { year: 2028, totalOpex: new Decimal(5_000_000) },
          { year: 2029, totalOpex: new Decimal(5_200_000) },
        ],
      };

      const result = calculateEBITDA(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        // Year 2028: 50M - 15M - 10M - 5M = 20M
        expect(result.data[0]?.year).toBe(2028);
        expect(result.data[0]?.ebitda.toNumber()).toBe(20_000_000);
        expect(result.data[0]?.ebitdaMargin.toNumber()).toBe(40);
        // Year 2029: 52M - 15.45M - 10M - 5.2M = 21.35M
        expect(result.data[1]?.year).toBe(2029);
        expect(result.data[1]?.ebitda.toNumber()).toBe(21_350_000);
      }
    });

    it('should handle positive and negative EBITDA in same calculation', () => {
      const params: EBITDAParams = {
        revenueByYear: [
          { year: 2028, revenue: new Decimal(50_000_000) },
          { year: 2029, revenue: new Decimal(30_000_000) }, // Lower revenue
        ],
        staffCostByYear: [
          { year: 2028, staffCost: new Decimal(15_000_000) },
          { year: 2029, staffCost: new Decimal(15_000_000) },
        ],
        rentByYear: [
          { year: 2028, rent: new Decimal(10_000_000) },
          { year: 2029, rent: new Decimal(10_000_000) },
        ],
        opexByYear: [
          { year: 2028, totalOpex: new Decimal(5_000_000) },
          { year: 2029, totalOpex: new Decimal(15_000_000) }, // Higher opex
        ],
      };

      const result = calculateEBITDA(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        // Year 2028: Positive EBITDA
        expect(result.data[0]?.ebitda.toNumber()).toBe(20_000_000);
        // Year 2029: Negative EBITDA (30M - 15M - 10M - 15M = -10M)
        expect(result.data[1]?.ebitda.toNumber()).toBe(-10_000_000);
        expect(result.data[1]?.ebitdaMargin.toNumber()).toBeCloseTo(-33.33, 1);
      }
    });

    it('should reject mismatched array lengths', () => {
      const params: EBITDAParams = {
        revenueByYear: [
          { year: 2028, revenue: new Decimal(50_000_000) },
          { year: 2029, revenue: new Decimal(52_000_000) },
        ],
        staffCostByYear: [
          { year: 2028, staffCost: new Decimal(15_000_000) },
          // Missing year 2029
        ],
        rentByYear: [
          { year: 2028, rent: new Decimal(10_000_000) },
          { year: 2029, rent: new Decimal(10_000_000) },
        ],
        opexByYear: [
          { year: 2028, totalOpex: new Decimal(5_000_000) },
          { year: 2029, totalOpex: new Decimal(5_200_000) },
        ],
      };

      const result = calculateEBITDA(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('All input arrays must have the same length');
      }
    });

    it('should reject empty arrays', () => {
      const params: EBITDAParams = {
        revenueByYear: [],
        staffCostByYear: [],
        rentByYear: [],
        opexByYear: [],
      };

      const result = calculateEBITDA(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('At least one year of data is required');
      }
    });

    it('should reject missing data for a year', () => {
      const params: EBITDAParams = {
        revenueByYear: [
          { year: 2028, revenue: new Decimal(50_000_000) },
          { year: 2029, revenue: new Decimal(52_000_000) },
        ],
        staffCostByYear: [
          { year: 2028, staffCost: new Decimal(15_000_000) },
          { year: 2029, staffCost: new Decimal(15_450_000) },
        ],
        rentByYear: [
          { year: 2028, rent: new Decimal(10_000_000) },
          // Missing year 2029
        ],
        opexByYear: [
          { year: 2028, totalOpex: new Decimal(5_000_000) },
          { year: 2029, totalOpex: new Decimal(5_200_000) },
        ],
      };

      const result = calculateEBITDA(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        // Validation checks array lengths first
        expect(result.error).toContain('All input arrays must have the same length');
      }
    });

    it('should reject missing year in data arrays', () => {
      const params: EBITDAParams = {
        revenueByYear: [
          { year: 2028, revenue: new Decimal(50_000_000) },
          { year: 2029, revenue: new Decimal(52_000_000) },
        ],
        staffCostByYear: [
          { year: 2028, staffCost: new Decimal(15_000_000) },
          { year: 2029, staffCost: new Decimal(15_450_000) },
        ],
        rentByYear: [
          { year: 2028, rent: new Decimal(10_000_000) },
          { year: 2030, rent: new Decimal(10_000_000) }, // Wrong year (2029 missing)
        ],
        opexByYear: [
          { year: 2028, totalOpex: new Decimal(5_000_000) },
          { year: 2029, totalOpex: new Decimal(5_200_000) },
        ],
      };

      const result = calculateEBITDA(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Rent data not found for year');
      }
    });
  });
});

