/**
 * Unit Tests: Revenue Share Rent Model
 */

import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  calculateRevenueShareRent,
  calculateRevenueShareRentForYear,
  calculateRevenueShareTotalRent,
  type RevenueShareParams,
} from '../revenue-share';

describe('Revenue Share Rent Model', () => {
  describe('calculateRevenueShareRentForYear', () => {
    it('should calculate rent as 8% of revenue', () => {
      const result = calculateRevenueShareRentForYear(
        10_000_000, // 10M SAR revenue
        0.08 // 8% share
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(800_000); // 10M × 0.08 = 800K
      }
    });

    it('should handle zero revenue', () => {
      const result = calculateRevenueShareRentForYear(0, 0.08);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(0);
      }
    });

    it('should handle zero revenue share', () => {
      const result = calculateRevenueShareRentForYear(10_000_000, 0);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(0);
      }
    });

    it('should handle 100% revenue share', () => {
      const result = calculateRevenueShareRentForYear(10_000_000, 1.0);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(10_000_000);
      }
    });

    it('should reject negative revenue', () => {
      const result = calculateRevenueShareRentForYear(-10_000_000, 0.08);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Revenue cannot be negative');
      }
    });

    it('should reject negative revenue share', () => {
      const result = calculateRevenueShareRentForYear(10_000_000, -0.01);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Revenue share must be between 0 and 1');
      }
    });

    it('should reject revenue share > 100%', () => {
      const result = calculateRevenueShareRentForYear(10_000_000, 1.1);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Revenue share must be between 0 and 1');
      }
    });

    it('should work with Decimal.js inputs', () => {
      const result = calculateRevenueShareRentForYear(
        new Decimal(10_000_000),
        new Decimal(0.08)
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(800_000);
      }
    });
  });

  describe('calculateRevenueShareRent', () => {
    it('should calculate rent for multiple years', () => {
      const params: RevenueShareParams = {
        revenueByYear: [
          { year: 2028, revenue: 10_000_000 },
          { year: 2029, revenue: 11_000_000 },
          { year: 2030, revenue: 12_000_000 },
        ],
        revenueSharePercent: 0.08, // 8%
      };

      const result = calculateRevenueShareRent(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(3);
        expect(result.data[0]?.year).toBe(2028);
        expect(result.data[0]?.revenue.toNumber()).toBe(10_000_000);
        expect(result.data[0]?.rent.toNumber()).toBe(800_000);
        expect(result.data[0]?.rentLoad.toNumber()).toBe(8); // 8%

        expect(result.data[1]?.year).toBe(2029);
        expect(result.data[1]?.rent.toNumber()).toBe(880_000); // 11M × 0.08

        expect(result.data[2]?.year).toBe(2030);
        expect(result.data[2]?.rent.toNumber()).toBe(960_000); // 12M × 0.08
      }
    });

    it('should calculate rent load correctly', () => {
      const params: RevenueShareParams = {
        revenueByYear: [
          { year: 2028, revenue: 10_000_000 },
        ],
        revenueSharePercent: 0.08,
      };

      const result = calculateRevenueShareRent(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0]?.rentLoad.toNumber()).toBe(8); // 8%
      }
    });

    it('should handle zero revenue (rent load = 0)', () => {
      const params: RevenueShareParams = {
        revenueByYear: [
          { year: 2028, revenue: 0 },
        ],
        revenueSharePercent: 0.08,
      };

      const result = calculateRevenueShareRent(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0]?.rent.toNumber()).toBe(0);
        expect(result.data[0]?.rentLoad.toNumber()).toBe(0);
      }
    });

    it('should reject empty revenue data', () => {
      const params: RevenueShareParams = {
        revenueByYear: [],
        revenueSharePercent: 0.08,
      };

      const result = calculateRevenueShareRent(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Revenue data is required');
      }
    });

    it('should reject negative revenue in any year', () => {
      const params: RevenueShareParams = {
        revenueByYear: [
          { year: 2028, revenue: 10_000_000 },
          { year: 2029, revenue: -5_000_000 },
        ],
        revenueSharePercent: 0.08,
      };

      const result = calculateRevenueShareRent(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Revenue for year 2029 cannot be negative');
      }
    });
  });

  describe('calculateRevenueShareTotalRent', () => {
    it('should calculate total rent over period', () => {
      const params: RevenueShareParams = {
        revenueByYear: [
          { year: 2028, revenue: 10_000_000 },
          { year: 2029, revenue: 11_000_000 },
          { year: 2030, revenue: 12_000_000 },
        ],
        revenueSharePercent: 0.08,
      };

      const result = calculateRevenueShareTotalRent(params);

      expect(result.success).toBe(true);
      if (result.success) {
        // 800K + 880K + 960K = 2,640,000
        expect(result.data.toNumber()).toBe(2_640_000);
      }
    });
  });
});

