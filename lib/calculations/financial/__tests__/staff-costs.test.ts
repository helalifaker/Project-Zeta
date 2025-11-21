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
      const result = calculateStaffCostForYear(-15_000_000, 0.03, 2, 2028, 2028);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Base staff cost must be positive');
      }
    });

    it('should reject zero base staff cost', () => {
      const result = calculateStaffCostForYear(0, 0.03, 2, 2028, 2028);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Base staff cost must be positive');
      }
    });

    it('should reject negative CPI rate', () => {
      const result = calculateStaffCostForYear(15_000_000, -0.01, 2, 2028, 2028);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('CPI rate cannot be negative');
      }
    });

    // ✅ FORMULA-005 FIX: Years before base year now supported with backward deflation
    it('should deflate staff costs for years before base year', () => {
      const result = calculateStaffCostForYear(
        10_000_000, // 10M SAR base (for year 2028)
        0.03, // 3% CPI
        1, // Annual frequency
        2028, // Base year
        2027 // 1 year before base
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // 10M / (1.03)^1 = 9,708,737.86
        expect(result.data.toNumber()).toBeCloseTo(9_708_737.86, 2);
      }
    });

    it('should deflate staff costs for multiple years before base year', () => {
      const result = calculateStaffCostForYear(
        10_000_000,
        0.03,
        1,
        2028,
        2025 // 3 years before base
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // 10M / (1.03)^3 = 9,151,416.59
        expect(result.data.toNumber()).toBeCloseTo(9_151_416.59, 0);
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

    // ✅ FORMULA-005 FIX: Base year after start year is now allowed (backward deflation)
    it('should handle base year after start year with backward deflation (RELOCATION_2028 mode)', () => {
      const params: StaffCostParams = {
        baseStaffCost: 10_000_000, // 10M SAR base for 2028
        cpiRate: 0.03, // 3% CPI
        cpiFrequency: 1, // Annual
        baseYear: 2028,
        startYear: 2025, // 3 years before base
        endYear: 2030,
      };

      const result = calculateStaffCosts(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(6); // 2025-2030 = 6 years

        // Year 2025: 3 years before base, deflate by (1.03)^3
        expect(result.data[0]?.year).toBe(2025);
        expect(result.data[0]?.staffCost.toNumber()).toBeCloseTo(9_151_416.59, 0);
        expect(result.data[0]?.cpiPeriod).toBe(-3); // Negative indicates backward period

        // Year 2026: 2 years before base
        expect(result.data[1]?.year).toBe(2026);
        expect(result.data[1]?.staffCost.toNumber()).toBeCloseTo(9_425_959.41, 0);
        expect(result.data[1]?.cpiPeriod).toBe(-2);

        // Year 2027: 1 year before base
        expect(result.data[2]?.year).toBe(2027);
        expect(result.data[2]?.staffCost.toNumber()).toBeCloseTo(9_708_737.86, 0);
        expect(result.data[2]?.cpiPeriod).toBe(-1);

        // Year 2028: Base year (no adjustment)
        expect(result.data[3]?.year).toBe(2028);
        expect(result.data[3]?.staffCost.toNumber()).toBe(10_000_000);
        expect(result.data[3]?.cpiPeriod).toBe(0);

        // Year 2029: 1 year after base
        expect(result.data[4]?.year).toBe(2029);
        expect(result.data[4]?.staffCost.toNumber()).toBe(10_300_000);
        expect(result.data[4]?.cpiPeriod).toBe(1);

        // Year 2030: 2 years after base
        expect(result.data[5]?.year).toBe(2030);
        expect(result.data[5]?.staffCost.toNumber()).toBeCloseTo(10_609_000, 0);
        expect(result.data[5]?.cpiPeriod).toBe(2);
      }
    });

    it('should have monotonically increasing staff costs from 2025 to 2052', () => {
      const params: StaffCostParams = {
        baseStaffCost: 10_000_000,
        cpiRate: 0.03,
        cpiFrequency: 1,
        baseYear: 2028,
        startYear: 2025,
        endYear: 2052,
      };

      const result = calculateStaffCosts(params);

      expect(result.success).toBe(true);
      if (result.success) {
        // Verify staff costs increase monotonically
        for (let i = 1; i < result.data.length; i++) {
          const current = result.data[i]?.staffCost.toNumber() ?? 0;
          const previous = result.data[i - 1]?.staffCost.toNumber() ?? 0;
          expect(current).toBeGreaterThan(previous);
        }
      }
    });

    it('should handle zero CPI rate with no deflation/growth', () => {
      const params: StaffCostParams = {
        baseStaffCost: 10_000_000,
        cpiRate: 0, // Zero CPI
        cpiFrequency: 1,
        baseYear: 2028,
        startYear: 2025,
        endYear: 2030,
      };

      const result = calculateStaffCosts(params);

      expect(result.success).toBe(true);
      if (result.success) {
        // All years should have the same staff cost (no deflation/growth)
        for (const yearData of result.data) {
          expect(yearData.staffCost.toNumber()).toBe(10_000_000);
        }
      }
    });
  });

  describe('Staff Cost Backward Deflation (FORMULA-005 Fix Verification)', () => {
    it('should correctly deflate staff costs for TRANSITION period (2025-2027)', () => {
      // Real-world scenario: RELOCATION_2028 mode
      const params: StaffCostParams = {
        baseStaffCost: 15_000_000, // 15M SAR for year 2028
        cpiRate: 0.03, // 3% CPI
        cpiFrequency: 1, // Annual
        baseYear: 2028,
        startYear: 2025,
        endYear: 2028,
      };

      const result = calculateStaffCosts(params);

      expect(result.success).toBe(true);
      if (result.success) {
        // Verify backward deflation
        const staffCost2025 = result.data[0]?.staffCost.toNumber() ?? 0;
        const staffCost2026 = result.data[1]?.staffCost.toNumber() ?? 0;
        const staffCost2027 = result.data[2]?.staffCost.toNumber() ?? 0;
        const staffCost2028 = result.data[3]?.staffCost.toNumber() ?? 0;

        // Expected calculations:
        // 2025: 15M / (1.03)^3 = 13,727,124.89
        // 2026: 15M / (1.03)^2 = 14,138,939.11
        // 2027: 15M / (1.03)^1 = 14,563,106.80
        // 2028: 15M (base year)

        expect(staffCost2025).toBeCloseTo(13_727_124.89, 0);
        expect(staffCost2026).toBeCloseTo(14_138_939.11, 0);
        expect(staffCost2027).toBeCloseTo(14_563_106.8, 0);
        expect(staffCost2028).toBe(15_000_000);

        // Verify monotonic increase
        expect(staffCost2026).toBeGreaterThan(staffCost2025);
        expect(staffCost2027).toBeGreaterThan(staffCost2026);
        expect(staffCost2028).toBeGreaterThan(staffCost2027);
      }
    });

    it('should match base year value exactly at 2028', () => {
      const baseStaffCost = 10_500_000;
      const result = calculateStaffCostForYear(baseStaffCost, 0.03, 1, 2028, 2028);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(baseStaffCost);
      }
    });

    it('should grow forward after base year (2029+)', () => {
      const params: StaffCostParams = {
        baseStaffCost: 10_000_000,
        cpiRate: 0.03,
        cpiFrequency: 1,
        baseYear: 2028,
        startYear: 2028,
        endYear: 2032,
      };

      const result = calculateStaffCosts(params);

      expect(result.success).toBe(true);
      if (result.success) {
        // Verify forward growth
        expect(result.data[0]?.staffCost.toNumber()).toBe(10_000_000); // 2028
        expect(result.data[1]?.staffCost.toNumber()).toBe(10_300_000); // 2029
        expect(result.data[2]?.staffCost.toNumber()).toBeCloseTo(10_609_000, 0); // 2030
        expect(result.data[3]?.staffCost.toNumber()).toBeCloseTo(10_927_270, 0); // 2031
        expect(result.data[4]?.staffCost.toNumber()).toBeCloseTo(11_255_088, 0); // 2032
      }
    });

    it('should calculate correct overstatement amount from old formula', () => {
      // Test case from issue description
      const baseStaffCost = 10_000_000;
      const params: StaffCostParams = {
        baseStaffCost,
        cpiRate: 0.03,
        cpiFrequency: 1,
        baseYear: 2028,
        startYear: 2025,
        endYear: 2027,
      };

      const result = calculateStaffCosts(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const totalCorrect = result.data.reduce(
          (sum, year) => sum.plus(year.staffCost),
          new Decimal(0)
        );

        // Old formula would have been: 10M + 10M + 10M = 30M
        const totalOld = new Decimal(30_000_000);

        // Calculate overstatement
        const overstatement = totalOld.minus(totalCorrect);

        // Expected: ~1.7M SAR overstatement
        // Actual calculation:
        // 2025: 9,151,416.59
        // 2026: 9,425,959.41
        // 2027: 9,708,737.86
        // Total: 28,286,113.86
        // Overstatement: 30,000,000 - 28,286,113.86 = 1,713,886.14

        expect(overstatement.toNumber()).toBeCloseTo(1_713_886, 0);
        expect(overstatement.toNumber()).toBeGreaterThan(1_500_000); // At least 1.5M
      }
    });
  });
});
