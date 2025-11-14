/**
 * Unit Tests: Staff Cost Calculation
 */

import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  calculateStaffCostForYear,
  calculateStaffCosts,
  type StaffCostParams,
} from '../staff-costs';

describe('Staff Cost Calculation', () => {
  describe('calculateStaffCostForYear', () => {
    it('should calculate staff cost for base year (no CPI applied)', () => {
      const result = calculateStaffCostForYear(
        15_000_000, // 15M SAR
        0.03, // 3% CPI
        2, // Every 2 years
        2028,
        2028
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(15_000_000);
      }
    });

    it('should keep same staff cost when frequency = 2 (year 2)', () => {
      const result = calculateStaffCostForYear(
        15_000_000,
        0.03,
        2,
        2028,
        2029 // Year 2, still in period 0
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(15_000_000);
      }
    });

    it('should apply CPI when frequency = 2 (year 3)', () => {
      const result = calculateStaffCostForYear(
        15_000_000,
        0.03,
        2,
        2028,
        2030 // Year 3, period 1
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // 15M × 1.03 = 15,450,000
        expect(result.data.toNumber()).toBe(15_450_000);
      }
    });

    it('should apply CPI correctly for frequency = 1 (annual)', () => {
      const result = calculateStaffCostForYear(
        15_000_000,
        0.03,
        1, // Annual
        2028,
        2029
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(15_450_000);
      }
    });

    it('should apply CPI correctly for frequency = 3 (every 3 years)', () => {
      const result = calculateStaffCostForYear(
        15_000_000,
        0.03,
        3,
        2028,
        2031 // Year 4, period 1
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(15_450_000);
      }
    });

    it('should handle zero CPI rate', () => {
      const result = calculateStaffCostForYear(
        15_000_000,
        0, // Zero CPI
        2,
        2028,
        2030
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Should remain at base cost
        expect(result.data.toNumber()).toBe(15_000_000);
      }
    });

    it('should reject negative base staff cost', () => {
      const result = calculateStaffCostForYear(
        -15_000_000,
        0.03,
        2,
        2028,
        2028
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Base staff cost must be positive');
      }
    });

    it('should reject zero base staff cost', () => {
      const result = calculateStaffCostForYear(
        0,
        0.03,
        2,
        2028,
        2028
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Base staff cost must be positive');
      }
    });

    it('should reject negative CPI rate', () => {
      const result = calculateStaffCostForYear(
        15_000_000,
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
      const result = calculateStaffCostForYear(
        15_000_000,
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

    it('should reject invalid CPI frequency', () => {
      // TypeScript will catch this, but test runtime validation
      const result = calculateStaffCostForYear(
        15_000_000,
        0.03,
        4 as 1 | 2 | 3, // Invalid frequency (force type for test)
        2028,
        2028
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('CPI frequency must be 1, 2, or 3 years');
      }
    });

    it('should work with Decimal.js inputs', () => {
      const result = calculateStaffCostForYear(
        new Decimal(15_000_000),
        new Decimal(0.03),
        2,
        2028,
        2030
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(15_450_000);
      }
    });
  });

  describe('calculateStaffCosts', () => {
    it('should calculate staff costs for multiple years with frequency = 2', () => {
      const params: StaffCostParams = {
        baseStaffCost: 15_000_000,
        cpiRate: 0.03,
        cpiFrequency: 2,
        baseYear: 2028,
        startYear: 2028,
        endYear: 2032,
      };

      const result = calculateStaffCosts(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(5);
        // Year 2028: period 0
        expect(result.data[0]?.year).toBe(2028);
        expect(result.data[0]?.staffCost.toNumber()).toBe(15_000_000);
        expect(result.data[0]?.cpiPeriod).toBe(0);
        // Year 2029: period 0 (same)
        expect(result.data[1]?.staffCost.toNumber()).toBe(15_000_000);
        expect(result.data[1]?.cpiPeriod).toBe(0);
        // Year 2030: period 1
        expect(result.data[2]?.staffCost.toNumber()).toBe(15_450_000);
        expect(result.data[2]?.cpiPeriod).toBe(1);
        // Year 2031: period 1 (same)
        expect(result.data[3]?.staffCost.toNumber()).toBe(15_450_000);
        // Year 2032: period 2
        expect(result.data[4]?.staffCost.toNumber()).toBeCloseTo(15_913_500, 0);
        expect(result.data[4]?.cpiPeriod).toBe(2);
      }
    });

    it('should handle 30-year period', () => {
      const params: StaffCostParams = {
        baseStaffCost: 15_000_000,
        cpiRate: 0.03,
        cpiFrequency: 1,
        baseYear: 2028,
        startYear: 2028,
        endYear: 2052,
      };

      const result = calculateStaffCosts(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(25);
        expect(result.data[0]?.year).toBe(2028);
        expect(result.data[result.data.length - 1]?.year).toBe(2052);
      }
    });

    it('should reject invalid year range', () => {
      const params: StaffCostParams = {
        baseStaffCost: 15_000_000,
        cpiRate: 0.03,
        cpiFrequency: 2,
        baseYear: 2028,
        startYear: 2030,
        endYear: 2028, // Invalid
      };

      const result = calculateStaffCosts(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Start year must be <= end year');
      }
    });

    it('should reject years outside 2023-2052 range', () => {
      const params: StaffCostParams = {
        baseStaffCost: 15_000_000,
        cpiRate: 0.03,
        cpiFrequency: 2,
        baseYear: 2020,
        startYear: 2020, // Invalid
        endYear: 2022,
      };

      const result = calculateStaffCosts(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Years must be between 2023 and 2052');
      }
    });

    it('should reject base year after start year', () => {
      const params: StaffCostParams = {
        baseStaffCost: 15_000_000,
        cpiRate: 0.03,
        cpiFrequency: 2,
        baseYear: 2030,
        startYear: 2028, // Invalid
        endYear: 2030,
      };

      const result = calculateStaffCosts(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Base year must be <= start year');
      }
    });
  });
});

