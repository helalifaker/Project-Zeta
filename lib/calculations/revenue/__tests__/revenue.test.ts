/**
 * Unit Tests: Revenue Calculation
 */

import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  calculateRevenueForYear,
  calculateRevenue,
  calculateTotalRevenue,
  calculateAverageRevenue,
  type RevenueParams,
} from '../revenue';
import type { TuitionGrowthResult } from '../tuition-growth';

describe('Revenue Calculation', () => {
  describe('calculateRevenueForYear', () => {
    it('should calculate revenue as tuition × students', () => {
      const result = calculateRevenueForYear(
        50_000, // 50K SAR tuition
        200 // 200 students
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(10_000_000); // 50K × 200 = 10M
      }
    });

    it('should handle zero students', () => {
      const result = calculateRevenueForYear(50_000, 0);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(0);
      }
    });

    it('should handle zero tuition', () => {
      const result = calculateRevenueForYear(0, 200);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(0);
      }
    });

    it('should reject negative tuition', () => {
      const result = calculateRevenueForYear(-50_000, 200);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Tuition cannot be negative');
      }
    });

    it('should reject negative students', () => {
      const result = calculateRevenueForYear(50_000, -10);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Students cannot be negative');
      }
    });

    it('should work with Decimal.js inputs', () => {
      const result = calculateRevenueForYear(
        new Decimal(50_000),
        200
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(10_000_000);
      }
    });
  });

  describe('calculateRevenue', () => {
    it('should calculate revenue for multiple years', () => {
      const tuitionByYear: TuitionGrowthResult[] = [
        { year: 2028, tuition: new Decimal(50_000), cpiPeriod: 0 },
        { year: 2029, tuition: new Decimal(50_000), cpiPeriod: 0 },
        { year: 2030, tuition: new Decimal(51_500), cpiPeriod: 1 },
      ];

      const params: RevenueParams = {
        tuitionByYear,
        studentsByYear: [
          { year: 2028, students: 200 },
          { year: 2029, students: 220 },
          { year: 2030, students: 240 },
        ],
      };

      const result = calculateRevenue(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(3);
        // Year 2028: 50K × 200 = 10M
        expect(result.data[0]?.year).toBe(2028);
        expect(result.data[0]?.tuition.toNumber()).toBe(50_000);
        expect(result.data[0]?.students).toBe(200);
        expect(result.data[0]?.revenue.toNumber()).toBe(10_000_000);
        // Year 2029: 50K × 220 = 11M
        expect(result.data[1]?.revenue.toNumber()).toBe(11_000_000);
        // Year 2030: 51.5K × 240 = 12.36M
        expect(result.data[2]?.revenue.toNumber()).toBe(12_360_000);
      }
    });

    it('should reject empty tuition data', () => {
      const params: RevenueParams = {
        tuitionByYear: [],
        studentsByYear: [{ year: 2028, students: 200 }],
      };

      const result = calculateRevenue(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Tuition data is required');
      }
    });

    it('should reject empty students data', () => {
      const params: RevenueParams = {
        tuitionByYear: [{ year: 2028, tuition: new Decimal(50_000), cpiPeriod: 0 }],
        studentsByYear: [],
      };

      const result = calculateRevenue(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Students data is required');
      }
    });

    it('should reject missing students for a year', () => {
      const params: RevenueParams = {
        tuitionByYear: [
          { year: 2028, tuition: new Decimal(50_000), cpiPeriod: 0 },
          { year: 2029, tuition: new Decimal(50_000), cpiPeriod: 0 },
        ],
        studentsByYear: [
          { year: 2028, students: 200 },
          // Missing 2029
        ],
      };

      const result = calculateRevenue(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Students data not found for year 2029');
      }
    });

    it('should reject negative students in any year', () => {
      const params: RevenueParams = {
        tuitionByYear: [
          { year: 2028, tuition: new Decimal(50_000), cpiPeriod: 0 },
        ],
        studentsByYear: [
          { year: 2028, students: -10 },
        ],
      };

      const result = calculateRevenue(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Students for year 2028 cannot be negative');
      }
    });
  });

  describe('calculateTotalRevenue', () => {
    it('should calculate total revenue over period', () => {
      const params: RevenueParams = {
        tuitionByYear: [
          { year: 2028, tuition: new Decimal(50_000), cpiPeriod: 0 },
          { year: 2029, tuition: new Decimal(50_000), cpiPeriod: 0 },
        ],
        studentsByYear: [
          { year: 2028, students: 200 },
          { year: 2029, students: 220 },
        ],
      };

      const result = calculateTotalRevenue(params);

      expect(result.success).toBe(true);
      if (result.success) {
        // 10M + 11M = 21M
        expect(result.data.toNumber()).toBe(21_000_000);
      }
    });
  });

  describe('calculateAverageRevenue', () => {
    it('should calculate average revenue per year', () => {
      const params: RevenueParams = {
        tuitionByYear: [
          { year: 2028, tuition: new Decimal(50_000), cpiPeriod: 0 },
          { year: 2029, tuition: new Decimal(50_000), cpiPeriod: 0 },
        ],
        studentsByYear: [
          { year: 2028, students: 200 },
          { year: 2029, students: 220 },
        ],
      };

      const result = calculateAverageRevenue(params);

      expect(result.success).toBe(true);
      if (result.success) {
        // (10M + 11M) / 2 = 10.5M
        expect(result.data.toNumber()).toBe(10_500_000);
      }
    });
  });
});

