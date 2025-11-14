/**
 * Unit Tests: Tuition Growth Calculation
 */

import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  calculateTuitionForYear,
  calculateTuitionGrowth,
  type TuitionGrowthParams,
} from '../tuition-growth';

describe('Tuition Growth Calculation', () => {
  describe('calculateTuitionForYear', () => {
    it('should calculate tuition for base year (no CPI applied)', () => {
      const result = calculateTuitionForYear(
        50_000, // 50K SAR
        0.03, // 3% CPI
        2, // Every 2 years
        2028,
        2028
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(50_000);
      }
    });

    it('should keep same tuition when frequency = 2 (year 2)', () => {
      const result = calculateTuitionForYear(
        50_000,
        0.03,
        2,
        2028,
        2029 // Year 2, still in period 0
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(50_000);
      }
    });

    it('should apply CPI when frequency = 2 (year 3)', () => {
      const result = calculateTuitionForYear(
        50_000,
        0.03,
        2,
        2028,
        2030 // Year 3, period 1
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // 50K × 1.03 = 51,500
        expect(result.data.toNumber()).toBe(51_500);
      }
    });

    it('should apply CPI correctly for frequency = 1 (annual)', () => {
      const result = calculateTuitionForYear(
        50_000,
        0.03,
        1, // Annual
        2028,
        2029
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(51_500);
      }
    });

    it('should apply CPI correctly for frequency = 3 (every 3 years)', () => {
      const result = calculateTuitionForYear(
        50_000,
        0.03,
        3,
        2028,
        2031 // Year 4, period 1
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(51_500);
      }
    });

    it('should reject negative base tuition', () => {
      const result = calculateTuitionForYear(
        -50_000,
        0.03,
        2,
        2028,
        2028
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Base tuition must be positive');
      }
    });

    it('should reject negative CPI rate', () => {
      const result = calculateTuitionForYear(
        50_000,
        -0.01,
        2,
        2028,
        2028
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('CPI rate cannot be negative');
      }
    });

    it('should reject year before base year', () => {
      const result = calculateTuitionForYear(
        50_000,
        0.03,
        2,
        2028,
        2027
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Year must be >= base year');
      }
    });

    it('should work with Decimal.js inputs', () => {
      const result = calculateTuitionForYear(
        new Decimal(50_000),
        new Decimal(0.03),
        2,
        2028,
        2030
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(51_500);
      }
    });
  });

  describe('calculateTuitionGrowth', () => {
    it('should calculate tuition for multiple years with frequency = 2', () => {
      const params: TuitionGrowthParams = {
        tuitionBase: 50_000,
        cpiRate: 0.03,
        cpiFrequency: 2,
        baseYear: 2028,
        startYear: 2028,
        endYear: 2032,
      };

      const result = calculateTuitionGrowth(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(5);
        // Year 2028: period 0
        expect(result.data[0]?.year).toBe(2028);
        expect(result.data[0]?.tuition.toNumber()).toBe(50_000);
        expect(result.data[0]?.cpiPeriod).toBe(0);
        // Year 2029: period 0 (same)
        expect(result.data[1]?.tuition.toNumber()).toBe(50_000);
        expect(result.data[1]?.cpiPeriod).toBe(0);
        // Year 2030: period 1
        expect(result.data[2]?.tuition.toNumber()).toBe(51_500);
        expect(result.data[2]?.cpiPeriod).toBe(1);
        // Year 2031: period 1 (same)
        expect(result.data[3]?.tuition.toNumber()).toBe(51_500);
        // Year 2032: period 2
        expect(result.data[4]?.tuition.toNumber()).toBeCloseTo(53_045, 0);
        expect(result.data[4]?.cpiPeriod).toBe(2);
      }
    });

    it('should handle 30-year period', () => {
      const params: TuitionGrowthParams = {
        tuitionBase: 50_000,
        cpiRate: 0.03,
        cpiFrequency: 1,
        baseYear: 2028,
        startYear: 2028,
        endYear: 2052,
      };

      const result = calculateTuitionGrowth(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(25);
        expect(result.data[0]?.year).toBe(2028);
        expect(result.data[result.data.length - 1]?.year).toBe(2052);
      }
    });

    it('should reject invalid year range', () => {
      const params: TuitionGrowthParams = {
        tuitionBase: 50_000,
        cpiRate: 0.03,
        cpiFrequency: 2,
        baseYear: 2028,
        startYear: 2030,
        endYear: 2028, // Invalid
      };

      const result = calculateTuitionGrowth(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Start year must be <= end year');
      }
    });

    it('should reject base year after start year', () => {
      const params: TuitionGrowthParams = {
        tuitionBase: 50_000,
        cpiRate: 0.03,
        cpiFrequency: 2,
        baseYear: 2030,
        startYear: 2028, // Invalid
        endYear: 2030,
      };

      const result = calculateTuitionGrowth(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Base year must be <= start year');
      }
    });
  });
});

