/**
 * Unit Tests: NPV Calculation
 */

import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  calculateNPVForYear,
  calculateNPV,
  type NPVParams,
} from '../npv';

describe('NPV Calculation', () => {
  describe('calculateNPVForYear', () => {
    it('should calculate present value for year 2028 (year 1)', () => {
      const result = calculateNPVForYear(
        5_000_000, // 5M SAR
        2028,      // Year
        0.08,      // 8% discount rate
        2027       // Base year
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // PV = 5M / 1.08^1 = 4.629629...M
        expect(result.data.presentValue.toNumber()).toBeCloseTo(4_629_629.63, 1);
        expect(result.data.discountFactor.toNumber()).toBe(1.08);
      }
    });

    it('should calculate present value for year 2029 (year 2)', () => {
      const result = calculateNPVForYear(
        6_000_000, // 6M SAR
        2029,      // Year
        0.08,      // 8% discount rate
        2027       // Base year
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // PV = 6M / 1.08^2 ≈ 5.144033M (allow tolerance)
        expect(result.data.presentValue.toNumber()).toBeCloseTo(5_144_033.21, 0);
        expect(result.data.discountFactor.toNumber()).toBeCloseTo(1.1664, 3);
      }
    });

    it('should calculate present value with zero discount rate', () => {
      const result = calculateNPVForYear(
        5_000_000,
        2028,
        0,         // 0% discount rate
        2027
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // PV = 5M / 1.00^1 = 5M (no discount)
        expect(result.data.presentValue.toNumber()).toBe(5_000_000);
        expect(result.data.discountFactor.toNumber()).toBe(1.0);
      }
    });

    it('should handle negative amounts (losses)', () => {
      const result = calculateNPVForYear(
        -2_000_000, // -2M SAR (loss)
        2028,
        0.08,
        2027
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // PV = -2M / 1.08^1 = -1.851851...M
        expect(result.data.presentValue.toNumber()).toBeCloseTo(-1_851_851.85, 1);
        expect(result.data.presentValue.isNegative()).toBe(true);
      }
    });

    it('should reject year before base year', () => {
      const result = calculateNPVForYear(
        5_000_000,
        2026,      // Before base year 2027
        0.08,
        2027
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Year must be >= base year');
      }
    });

    it('should reject year outside 2023-2052 range', () => {
      const result = calculateNPVForYear(
        5_000_000,
        2020,      // Before 2023
        0.08,
        2027
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Year must be between 2023 and 2052');
      }
    });

    it('should reject negative discount rate', () => {
      const result = calculateNPVForYear(
        5_000_000,
        2028,
        -0.01,     // Negative rate
        2027
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Discount rate must be between 0 and 1');
      }
    });

    it('should reject discount rate > 100%', () => {
      const result = calculateNPVForYear(
        5_000_000,
        2028,
        1.1,       // 110%
        2027
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Discount rate must be between 0 and 1');
      }
    });

    it('should work with Decimal.js inputs', () => {
      const result = calculateNPVForYear(
        new Decimal(5_000_000),
        2028,
        new Decimal(0.08),
        2027
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.presentValue.toNumber()).toBeCloseTo(4_629_629.63, 1);
      }
    });
  });

  describe('calculateNPV', () => {
    it('should calculate NPV for multiple years with positive cash flows', () => {
      const params: NPVParams = {
        amountsByYear: [
          { year: 2028, amount: new Decimal(5_000_000) },
          { year: 2029, amount: new Decimal(6_000_000) },
          { year: 2030, amount: new Decimal(7_000_000) },
        ],
        discountRate: 0.08,
        startYear: 2028,
        endYear: 2030,
      };

      const result = calculateNPV(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalYears).toBe(3);
        expect(result.data.presentValues).toHaveLength(3);
        
        // Year 2028: 5M / 1.08^1 ≈ 4.63M
        expect(result.data.presentValues[0]?.year).toBe(2028);
        const pv2028 = result.data.presentValues[0]?.presentValue.toNumber() || 0;
        expect(pv2028).toBeGreaterThan(4_629_600);
        expect(pv2028).toBeLessThan(4_629_700);
        
        // Year 2029: 6M / 1.08^2 ≈ 5.14M
        const pv2029 = result.data.presentValues[1]?.presentValue.toNumber() || 0;
        expect(pv2029).toBeGreaterThan(5_144_000);
        expect(pv2029).toBeLessThan(5_145_000);
        
        // Year 2030: 7M / 1.08^3 ≈ 5.56M (allow wider range for precision)
        const pv2030 = result.data.presentValues[2]?.presentValue.toNumber() || 0;
        expect(pv2030).toBeGreaterThan(5_555_600);
        expect(pv2030).toBeLessThan(5_557_000);
        
        // Total NPV ≈ 15.33M (verify in range, allowing for Decimal.js precision)
        expect(result.data.npv.toNumber()).toBeGreaterThan(15_329_000);
        expect(result.data.npv.toNumber()).toBeLessThan(15_331_000);
      }
    });

    it('should calculate NPV for 25-year period (2028-2052)', () => {
      const amountsByYear = [];
      for (let year = 2028; year <= 2052; year++) {
        amountsByYear.push({ year, amount: new Decimal(10_000_000) }); // 10M per year
      }

      const params: NPVParams = {
        amountsByYear,
        discountRate: 0.08,
        startYear: 2028,
        endYear: 2052,
      };

      const result = calculateNPV(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalYears).toBe(25);
        expect(result.data.presentValues).toHaveLength(25);
        expect(result.data.npv.isPositive()).toBe(true);
        // NPV should be less than 250M (25 years × 10M) due to discounting
        expect(result.data.npv.toNumber()).toBeLessThan(250_000_000);
        expect(result.data.npv.toNumber()).toBeGreaterThan(100_000_000);
      }
    });

    it('should handle negative cash flows (loss scenarios)', () => {
      const params: NPVParams = {
        amountsByYear: [
          { year: 2028, amount: new Decimal(-5_000_000) }, // Loss
          { year: 2029, amount: new Decimal(10_000_000) }, // Profit
          { year: 2030, amount: new Decimal(-2_000_000) }, // Loss
        ],
        discountRate: 0.08,
        startYear: 2028,
        endYear: 2030,
      };

      const result = calculateNPV(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalYears).toBe(3);
        // NPV can be positive or negative depending on amounts
        // Year 1: -5M / 1.08 = -4.629M
        // Year 2: 10M / 1.08^2 = 8.573M
        // Year 3: -2M / 1.08^3 = -1.588M
        // NPV ≈ 2.356M (positive overall, verify in range)
        expect(result.data.npv.isPositive()).toBe(true);
        expect(result.data.npv.toNumber()).toBeGreaterThan(2_356_000);
        expect(result.data.npv.toNumber()).toBeLessThan(2_357_000);
      }
    });

    it('should handle all negative cash flows', () => {
      const params: NPVParams = {
        amountsByYear: [
          { year: 2028, amount: new Decimal(-5_000_000) },
          { year: 2029, amount: new Decimal(-3_000_000) },
        ],
        discountRate: 0.08,
        startYear: 2028,
        endYear: 2029,
      };

      const result = calculateNPV(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.npv.isNegative()).toBe(true);
      }
    });

    it('should calculate NPV with different discount rates', () => {
      const amountsByYear = [
        { year: 2028, amount: new Decimal(10_000_000) },
        { year: 2029, amount: new Decimal(10_000_000) },
      ];

      // Test with 5% discount rate
      const result5 = calculateNPV({
        amountsByYear,
        discountRate: 0.05,
        startYear: 2028,
        endYear: 2029,
      });

      // Test with 10% discount rate
      const result10 = calculateNPV({
        amountsByYear,
        discountRate: 0.10,
        startYear: 2028,
        endYear: 2029,
      });

      // Test with 15% discount rate
      const result15 = calculateNPV({
        amountsByYear,
        discountRate: 0.15,
        startYear: 2028,
        endYear: 2029,
      });

      expect(result5.success).toBe(true);
      expect(result10.success).toBe(true);
      expect(result15.success).toBe(true);

      if (result5.success && result10.success && result15.success) {
        // Higher discount rate = lower NPV
        expect(result5.data.npv.greaterThan(result10.data.npv)).toBe(true);
        expect(result10.data.npv.greaterThan(result15.data.npv)).toBe(true);
      }
    });

    it('should handle zero cash flows', () => {
      const params: NPVParams = {
        amountsByYear: [
          { year: 2028, amount: new Decimal(0) },
          { year: 2029, amount: new Decimal(0) },
        ],
        discountRate: 0.08,
        startYear: 2028,
        endYear: 2029,
      };

      const result = calculateNPV(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.npv.toNumber()).toBe(0);
      }
    });

    it('should handle partial year range', () => {
      const params: NPVParams = {
        amountsByYear: [
          { year: 2028, amount: new Decimal(5_000_000) },
          { year: 2029, amount: new Decimal(6_000_000) },
          { year: 2030, amount: new Decimal(7_000_000) },
          { year: 2031, amount: new Decimal(8_000_000) },
          { year: 2032, amount: new Decimal(9_000_000) },
        ],
        discountRate: 0.08,
        startYear: 2029, // Start from 2029
        endYear: 2031,   // End at 2031
      };

      const result = calculateNPV(params);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should only include 2029, 2030, 2031 (3 years)
        expect(result.data.totalYears).toBe(3);
        expect(result.data.presentValues).toHaveLength(3);
        expect(result.data.presentValues[0]?.year).toBe(2029);
        expect(result.data.presentValues[2]?.year).toBe(2031);
      }
    });

    it('should skip missing years in data', () => {
      const params: NPVParams = {
        amountsByYear: [
          { year: 2028, amount: new Decimal(5_000_000) },
          // Missing 2029
          { year: 2030, amount: new Decimal(7_000_000) },
        ],
        discountRate: 0.08,
        startYear: 2028,
        endYear: 2030,
      };

      const result = calculateNPV(params);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should only include 2028 and 2030 (2 years)
        expect(result.data.totalYears).toBe(2);
        expect(result.data.presentValues).toHaveLength(2);
      }
    });

    it('should reject empty amounts array', () => {
      const params: NPVParams = {
        amountsByYear: [],
        discountRate: 0.08,
        startYear: 2028,
        endYear: 2030,
      };

      const result = calculateNPV(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('At least one year of data is required');
      }
    });

    it('should reject invalid year range', () => {
      const params: NPVParams = {
        amountsByYear: [
          { year: 2028, amount: new Decimal(5_000_000) },
        ],
        discountRate: 0.08,
        startYear: 2030,
        endYear: 2028, // Invalid
      };

      const result = calculateNPV(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Start year must be <= end year');
      }
    });

    it('should reject years outside 2023-2052 range', () => {
      const params: NPVParams = {
        amountsByYear: [
          { year: 2020, amount: new Decimal(5_000_000) },
        ],
        discountRate: 0.08,
        startYear: 2020,
        endYear: 2022,
      };

      const result = calculateNPV(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Years must be between 2023 and 2052');
      }
    });

    it('should reject no valid data for year range', () => {
      const params: NPVParams = {
        amountsByYear: [
          { year: 2028, amount: new Decimal(5_000_000) },
        ],
        discountRate: 0.08,
        startYear: 2030, // No data for this range
        endYear: 2035,
      };

      const result = calculateNPV(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('No valid data found for the specified year range');
      }
    });

    it('should verify mathematical accuracy with known example', () => {
      // Known example: 5M per year for 3 years @ 8%
      // Year 1: 5M / 1.08^1 = 4.629629...M
      // Year 2: 5M / 1.08^2 = 4.286694...M
      // Year 3: 5M / 1.08^3 = 3.969162...M
      // NPV ≈ 12.885M
      const params: NPVParams = {
        amountsByYear: [
          { year: 2028, amount: new Decimal(5_000_000) },
          { year: 2029, amount: new Decimal(5_000_000) },
          { year: 2030, amount: new Decimal(5_000_000) },
        ],
        discountRate: 0.08,
        startYear: 2028,
        endYear: 2030,
      };

      const result = calculateNPV(params);

      expect(result.success).toBe(true);
      if (result.success) {
        // Verify NPV is positive and close to expected value
        // Actual: ~12.885M (allowing for rounding differences)
        expect(result.data.npv.isPositive()).toBe(true);
        expect(result.data.npv.toNumber()).toBeGreaterThan(12_885_000);
        expect(result.data.npv.toNumber()).toBeLessThan(12_886_000);
        
        // Verify each present value (allow for Decimal.js precision differences)
        const pv0 = result.data.presentValues[0]?.presentValue.toNumber() || 0;
        expect(pv0).toBeGreaterThan(4_629_600);
        expect(pv0).toBeLessThan(4_629_700);
        
        const pv1 = result.data.presentValues[1]?.presentValue.toNumber() || 0;
        expect(pv1).toBeGreaterThan(4_286_600);
        expect(pv1).toBeLessThan(4_286_800);
        
        const pv2 = result.data.presentValues[2]?.presentValue.toNumber() || 0;
        expect(pv2).toBeGreaterThan(3_969_100);
        expect(pv2).toBeLessThan(3_969_300);
      }
    });

    it('should handle single year NPV', () => {
      const params: NPVParams = {
        amountsByYear: [
          { year: 2028, amount: new Decimal(10_000_000) },
        ],
        discountRate: 0.08,
        startYear: 2028,
        endYear: 2028,
      };

      const result = calculateNPV(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalYears).toBe(1);
        expect(result.data.npv.toNumber()).toBeCloseTo(9_259_259.26, 1);
      }
    });

    it('should default to 2028-2052 if not specified', () => {
      const amountsByYear = [];
      for (let year = 2028; year <= 2052; year++) {
        amountsByYear.push({ year, amount: new Decimal(1_000_000) });
      }

      const params: NPVParams = {
        amountsByYear,
        discountRate: 0.08,
        // startYear and endYear not specified (should default to 2028-2052)
      };

      const result = calculateNPV(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalYears).toBe(25);
        expect(result.data.presentValues[0]?.year).toBe(2028);
        expect(result.data.presentValues[24]?.year).toBe(2052);
      }
    });
  });
});

