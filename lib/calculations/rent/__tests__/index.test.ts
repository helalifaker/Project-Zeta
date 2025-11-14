/**
 * Unit Tests: Rent Calculation Router
 */

import { describe, it, expect } from 'vitest';
import {
  calculateRent,
  calculateRentForYear,
  calculateTotalRent,
} from '../index';

describe('Rent Calculation Router', () => {
  describe('calculateRent', () => {
    it('should route to Fixed Escalation model', () => {
      const result = calculateRent({
        model: 'FIXED_ESCALATION',
        baseRent: 1_000_000,
        escalationRate: 0.04,
        startYear: 2028,
        endYear: 2030,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(3);
        expect(result.data[0]?.year).toBe(2028);
      }
    });

    it('should route to Revenue Share model', () => {
      const result = calculateRent({
        model: 'REVENUE_SHARE',
        revenueByYear: [
          { year: 2028, revenue: 10_000_000 },
          { year: 2029, revenue: 11_000_000 },
        ],
        revenueSharePercent: 0.08,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0]?.year).toBe(2028);
      }
    });

    it('should route to Partner Model', () => {
      const result = calculateRent({
        model: 'PARTNER_MODEL',
        landSize: 10_000,
        landPricePerSqm: 5_000,
        buaSize: 8_000,
        constructionCostPerSqm: 3_000,
        yieldBase: 0.045,
        startYear: 2028,
        endYear: 2030,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(3);
        expect(result.data[0]?.year).toBe(2028);
      }
    });

    it('should reject unknown model', () => {
      const result = calculateRent({
        model: 'UNKNOWN_MODEL' as 'FIXED_ESCALATION',
        baseRent: 1_000_000,
        escalationRate: 0.04,
        startYear: 2028,
        endYear: 2030,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Unknown rent model');
      }
    });
  });

  describe('calculateRentForYear', () => {
    it('should calculate Fixed Escalation for a year', () => {
      const result = calculateRentForYear(
        'FIXED_ESCALATION',
        {
          baseRent: 1_000_000,
          escalationRate: 0.04,
          startYear: 2028,
          endYear: 2030,
        },
        2029
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rent).toBe(1_040_000);
      }
    });

    it('should calculate Revenue Share for a year', () => {
      const result = calculateRentForYear(
        'REVENUE_SHARE',
        {
          revenueByYear: [
            { year: 2028, revenue: 10_000_000 },
            { year: 2029, revenue: 11_000_000 },
          ],
          revenueSharePercent: 0.08,
        },
        2029
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rent).toBe(880_000); // 11M × 0.08
      }
    });

    it('should calculate Partner Model for a year', () => {
      const result = calculateRentForYear(
        'PARTNER_MODEL',
        {
          landSize: 10_000,
          landPricePerSqm: 5_000,
          buaSize: 8_000,
          constructionCostPerSqm: 3_000,
          yieldBase: 0.045,
          startYear: 2028,
          endYear: 2030,
        },
        2029
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rent).toBeCloseTo(3_330_000, 0);
      }
    });

    it('should handle missing revenue data for Revenue Share', () => {
      const result = calculateRentForYear(
        'REVENUE_SHARE',
        {
          revenueByYear: [
            { year: 2028, revenue: 10_000_000 },
          ],
          revenueSharePercent: 0.08,
        },
        2029 // Year not in data
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Revenue data not found');
      }
    });
  });

  describe('calculateTotalRent', () => {
    it('should calculate total for Fixed Escalation', () => {
      const result = calculateTotalRent({
        model: 'FIXED_ESCALATION',
        baseRent: 1_000_000,
        escalationRate: 0.04,
        startYear: 2028,
        endYear: 2030,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeCloseTo(3_121_600, 0);
      }
    });

    it('should calculate total for Revenue Share', () => {
      const result = calculateTotalRent({
        model: 'REVENUE_SHARE',
        revenueByYear: [
          { year: 2028, revenue: 10_000_000 },
          { year: 2029, revenue: 11_000_000 },
        ],
        revenueSharePercent: 0.08,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1_680_000); // 800K + 880K
      }
    });

    it('should calculate total for Partner Model', () => {
      const result = calculateTotalRent({
        model: 'PARTNER_MODEL',
        landSize: 10_000,
        landPricePerSqm: 5_000,
        buaSize: 8_000,
        constructionCostPerSqm: 3_000,
        yieldBase: 0.045,
        startYear: 2028,
        endYear: 2030,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Allow for small rounding differences
        const total = result.data;
        expect(total).toBeGreaterThan(9_980_000);
        expect(total).toBeLessThan(10_000_000);
      }
    });
  });
});

