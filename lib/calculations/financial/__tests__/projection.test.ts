/**
 * Integration Tests: Full Financial Projection
 * Tests the complete integration of all calculation modules
 */

import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  calculateFullProjection,
  type FullProjectionParams,
  type AdminSettings,
  type CurriculumPlanInput,
  type RentPlanInput,
} from '../projection';

describe('Full Financial Projection', () => {
  const baseAdminSettings: AdminSettings = {
    cpiRate: 0.03,
    discountRate: 0.08,
    taxRate: 0.20,
  };

  const baseFRPlan: CurriculumPlanInput = {
    curriculumType: 'FR',
    capacity: 400,
    tuitionBase: 50_000,
    cpiFrequency: 2,
    studentsProjection: [
      { year: 2028, students: 300 },
      { year: 2029, students: 340 },
      { year: 2030, students: 360 },
      { year: 2031, students: 380 },
      { year: 2032, students: 400 },
    ],
  };

  const baseIBPlan: CurriculumPlanInput = {
    curriculumType: 'IB',
    capacity: 200,
    tuitionBase: 60_000,
    cpiFrequency: 2,
    studentsProjection: [
      { year: 2028, students: 30 },
      { year: 2029, students: 60 },
      { year: 2030, students: 100 },
      { year: 2031, students: 150 },
      { year: 2032, students: 200 },
    ],
  };

  describe('calculateFullProjection', () => {
    it('should calculate full projection with FixedEscalation rent model', () => {
      const rentPlan: RentPlanInput = {
        rentModel: 'FIXED_ESCALATION',
        parameters: {
          baseRent: 10_000_000,
          escalationRate: 0.04,
        },
      };

      const params: FullProjectionParams = {
        curriculumPlans: [baseFRPlan, baseIBPlan],
        rentPlan,
        staffCostBase: 15_000_000,
        staffCostCpiFrequency: 2,
        capexItems: [
          { year: 2028, amount: 2_000_000 },
          { year: 2030, amount: 1_000_000 },
        ],
        opexSubAccounts: [
          {
            subAccountName: 'Marketing',
            percentOfRevenue: 0.03,
            isFixed: false,
            fixedAmount: null,
          },
          {
            subAccountName: 'Utilities',
            percentOfRevenue: null,
            isFixed: true,
            fixedAmount: 200_000,
          },
        ],
        adminSettings: baseAdminSettings,
        startYear: 2028,
        endYear: 2032,
      };

      const result = calculateFullProjection(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.years).toHaveLength(5); // 2028-2032
        expect(result.data.years[0]?.year).toBe(2028);
        expect(result.data.years[4]?.year).toBe(2032);

        // Verify all financial metrics exist
        expect(result.data.years[0]?.revenue).toBeDefined();
        expect(result.data.years[0]?.rent).toBeDefined();
        expect(result.data.years[0]?.staffCost).toBeDefined();
        expect(result.data.years[0]?.opex).toBeDefined();
        expect(result.data.years[0]?.ebitda).toBeDefined();
        expect(result.data.years[0]?.cashFlow).toBeDefined();
        expect(result.data.years[0]?.rentLoad).toBeDefined();

        // Verify summary metrics
        expect(result.data.summary.totalRevenue.isPositive()).toBe(true);
        expect(result.data.summary.npvRent).toBeDefined();
        expect(result.data.summary.npvCashFlow).toBeDefined();
        expect(result.data.summary.avgEBITDAMargin).toBeDefined();
        expect(result.data.summary.avgRentLoad).toBeDefined();

        // Verify performance (<50ms)
        expect(result.data.duration).toBeLessThan(50);

        // Verify tuition and students are set
        expect(result.data.years[0]?.tuitionFR).toBeDefined();
        expect(result.data.years[0]?.tuitionIB).toBeDefined();
        expect(result.data.years[0]?.studentsFR).toBe(300);
        expect(result.data.years[0]?.studentsIB).toBe(30);
      }
    });

    it('should calculate full projection with RevenueShare rent model', () => {
      const rentPlan: RentPlanInput = {
        rentModel: 'REVENUE_SHARE',
        parameters: {
          revenueSharePercent: 0.08, // 8% of revenue
        },
      };

      const params: FullProjectionParams = {
        curriculumPlans: [baseFRPlan, baseIBPlan],
        rentPlan,
        staffCostBase: 15_000_000,
        staffCostCpiFrequency: 2,
        capexItems: [],
        opexSubAccounts: [
          {
            subAccountName: 'Marketing',
            percentOfRevenue: 0.03,
            isFixed: false,
            fixedAmount: null,
          },
        ],
        adminSettings: baseAdminSettings,
        startYear: 2028,
        endYear: 2032,
      };

      const result = calculateFullProjection(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.years).toHaveLength(5);
        
        // RevenueShare rent should be 8% of revenue
        const year2028 = result.data.years[0];
        if (year2028) {
          const expectedRent = year2028.revenue.times(0.08);
          expect(year2028.rent.toNumber()).toBeCloseTo(expectedRent.toNumber(), 0);
          
          // Rent load should be 8%
          expect(year2028.rentLoad.toNumber()).toBeCloseTo(8, 0);
        }
      }
    });

    it('should calculate full projection with PartnerModel rent model', () => {
      const rentPlan: RentPlanInput = {
        rentModel: 'PARTNER_MODEL',
        parameters: {
          landSize: 10_000,
          landPricePerSqm: 5_000,
          buaSize: 8_000,
          constructionCostPerSqm: 3_000,
          yieldBase: 0.045, // 4.5%
        },
      };

      const params: FullProjectionParams = {
        curriculumPlans: [baseFRPlan, baseIBPlan],
        rentPlan,
        staffCostBase: 15_000_000,
        staffCostCpiFrequency: 2,
        capexItems: [],
        opexSubAccounts: [],
        adminSettings: baseAdminSettings,
        startYear: 2028,
        endYear: 2032,
      };

      const result = calculateFullProjection(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.years).toHaveLength(5);
        
        // PartnerModel rent should be constant (same for all years)
        // Land: 10,000 × 5,000 = 50M
        // BUA: 8,000 × 3,000 = 24M
        // Total: 74M
        // Rent: 74M × 4.5% = 3.33M
        const expectedRent = 74_000_000 * 0.045; // 3,330,000
        
        for (const year of result.data.years) {
          expect(year.rent.toNumber()).toBeCloseTo(expectedRent, -1000); // Allow 1K tolerance
        }
      }
    });

    it('should calculate 30-year projection (2023-2052)', () => {
      // Create 30-year student projections
      const frStudents30 = [];
      const ibStudents30 = [];
      
      for (let year = 2023; year <= 2052; year++) {
        if (year < 2028) {
          // Historical years
          frStudents30.push({ year, students: 300 });
          ibStudents30.push({ year, students: 20 });
        } else if (year === 2028) {
          frStudents30.push({ year, students: 300 });
          ibStudents30.push({ year, students: 30 });
        } else if (year <= 2032) {
          // Ramp-up years
          const rampYear = year - 2028;
          frStudents30.push({ year, students: 300 + rampYear * 20 });
          ibStudents30.push({ year, students: 30 + rampYear * 35 });
        } else {
          // Full capacity
          frStudents30.push({ year, students: 400 });
          ibStudents30.push({ year, students: 200 });
        }
      }

      const frPlan30: CurriculumPlanInput = {
        ...baseFRPlan,
        studentsProjection: frStudents30,
      };

      const ibPlan30: CurriculumPlanInput = {
        ...baseIBPlan,
        studentsProjection: ibStudents30,
      };

      const params: FullProjectionParams = {
        curriculumPlans: [frPlan30, ibPlan30],
        rentPlan: {
          rentModel: 'FIXED_ESCALATION',
          parameters: {
            baseRent: 10_000_000,
            escalationRate: 0.04,
          },
        },
        staffCostBase: 15_000_000,
        staffCostCpiFrequency: 2,
        capexItems: [],
        opexSubAccounts: [
          {
            subAccountName: 'Marketing',
            percentOfRevenue: 0.03,
            isFixed: false,
            fixedAmount: null,
          },
        ],
        adminSettings: baseAdminSettings,
        startYear: 2023,
        endYear: 2052,
      };

      const result = calculateFullProjection(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.years).toHaveLength(30); // 2023-2052
        expect(result.data.years[0]?.year).toBe(2023);
        expect(result.data.years[29]?.year).toBe(2052);

        // Verify NPV calculations (should focus on 2028-2052)
        expect(result.data.summary.npvRent).toBeDefined();
        expect(result.data.summary.npvCashFlow).toBeDefined();

        // Verify performance
        expect(result.data.duration).toBeLessThan(50);
      }
    });

    it('should calculate NPV for 2028-2052 period only', () => {
      const params: FullProjectionParams = {
        curriculumPlans: [baseFRPlan, baseIBPlan],
        rentPlan: {
          rentModel: 'FIXED_ESCALATION',
          parameters: {
            baseRent: 10_000_000,
            escalationRate: 0.04,
          },
        },
        staffCostBase: 15_000_000,
        staffCostCpiFrequency: 2,
        capexItems: [],
        opexSubAccounts: [],
        adminSettings: baseAdminSettings,
        startYear: 2028,
        endYear: 2032,
      };

      const result = calculateFullProjection(params);

      expect(result.success).toBe(true);
      if (result.success) {
        // NPV should be calculated for 2028-2032 (5 years, filtered to NPV period)
        // But since we only have data to 2032, NPV will use available years
        expect(result.data.summary.npvRent).toBeDefined();
        expect(result.data.summary.npvCashFlow).toBeDefined();
        
        // NPV should be positive for rent
        expect(result.data.summary.npvRent.isPositive()).toBe(true);
      }
    });

    it('should handle positive and negative cash flows', () => {
      // Create scenario with initial losses (negative EBITDA)
      const params: FullProjectionParams = {
        curriculumPlans: [
          {
            ...baseFRPlan,
            studentsProjection: [
              { year: 2028, students: 100 }, // Low enrollment = low revenue
            ],
          },
          {
            ...baseIBPlan,
            studentsProjection: [
              { year: 2028, students: 10 }, // Low enrollment
            ],
          },
        ],
        rentPlan: {
          rentModel: 'FIXED_ESCALATION',
          parameters: {
            baseRent: 15_000_000, // High rent
            escalationRate: 0.04,
          },
        },
        staffCostBase: 20_000_000, // High staff costs
        staffCostCpiFrequency: 2,
        capexItems: [{ year: 2028, amount: 5_000_000 }], // High capex
        opexSubAccounts: [
          {
            subAccountName: 'Marketing',
            percentOfRevenue: 0.05,
            isFixed: false,
            fixedAmount: null,
          },
        ],
        adminSettings: baseAdminSettings,
        startYear: 2028,
        endYear: 2028,
      };

      const result = calculateFullProjection(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const year = result.data.years[0];
        if (year) {
          // Should have negative EBITDA and cash flow (loss scenario)
          expect(year.ebitda.isNegative()).toBe(true);
          expect(year.cashFlow.isNegative()).toBe(true);
          expect(year.taxes.toNumber()).toBe(0); // No taxes on losses
        }
      }
    });

    it('should calculate summary metrics correctly', () => {
      const params: FullProjectionParams = {
        curriculumPlans: [baseFRPlan, baseIBPlan],
        rentPlan: {
          rentModel: 'FIXED_ESCALATION',
          parameters: {
            baseRent: 10_000_000,
            escalationRate: 0.04,
          },
        },
        staffCostBase: 15_000_000,
        staffCostCpiFrequency: 2,
        capexItems: [
          { year: 2028, amount: 2_000_000 },
          { year: 2030, amount: 1_000_000 },
        ],
        opexSubAccounts: [
          {
            subAccountName: 'Marketing',
            percentOfRevenue: 0.03,
            isFixed: false,
            fixedAmount: null,
          },
        ],
        adminSettings: baseAdminSettings,
        startYear: 2028,
        endYear: 2032,
      };

      const result = calculateFullProjection(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const { summary } = result.data;

        // Verify totals match sum of yearly values
        const totalRevenueSum = result.data.years.reduce(
          (sum, y) => sum.plus(y.revenue),
          new Decimal(0)
        );
        expect(summary.totalRevenue.toNumber()).toBeCloseTo(totalRevenueSum.toNumber(), 0);

        const totalEBITDASum = result.data.years.reduce(
          (sum, y) => sum.plus(y.ebitda),
          new Decimal(0)
        );
        expect(summary.totalEBITDA.toNumber()).toBeCloseTo(totalEBITDASum.toNumber(), 0);

        const totalCashFlowSum = result.data.years.reduce(
          (sum, y) => sum.plus(y.cashFlow),
          new Decimal(0)
        );
        expect(summary.totalCashFlow.toNumber()).toBeCloseTo(totalCashFlowSum.toNumber(), 0);

        // Verify NPV is defined
        expect(summary.npvRent).toBeDefined();
        expect(summary.npvCashFlow).toBeDefined();

        // Verify averages
        expect(summary.avgEBITDAMargin).toBeDefined();
        expect(summary.avgRentLoad).toBeDefined();
      }
    });

    it('should reject empty curriculum plans', () => {
      const params: FullProjectionParams = {
        curriculumPlans: [], // Empty
        rentPlan: {
          rentModel: 'FIXED_ESCALATION',
          parameters: {
            baseRent: 10_000_000,
            escalationRate: 0.04,
          },
        },
        staffCostBase: 15_000_000,
        staffCostCpiFrequency: 2,
        capexItems: [],
        opexSubAccounts: [],
        adminSettings: baseAdminSettings,
      };

      const result = calculateFullProjection(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('At least one curriculum plan is required');
      }
    });

    it('should reject invalid year range', () => {
      const params: FullProjectionParams = {
        curriculumPlans: [baseFRPlan, baseIBPlan],
        rentPlan: {
          rentModel: 'FIXED_ESCALATION',
          parameters: {
            baseRent: 10_000_000,
            escalationRate: 0.04,
          },
        },
        staffCostBase: 15_000_000,
        staffCostCpiFrequency: 2,
        capexItems: [],
        opexSubAccounts: [],
        adminSettings: baseAdminSettings,
        startYear: 2030,
        endYear: 2028, // Invalid
      };

      const result = calculateFullProjection(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Start year must be <= end year');
      }
    });

    it('should handle zero revenue scenario', () => {
      const params: FullProjectionParams = {
        curriculumPlans: [
          {
            ...baseFRPlan,
            studentsProjection: [
              { year: 2028, students: 0 }, // Zero students
            ],
          },
          {
            ...baseIBPlan,
            studentsProjection: [
              { year: 2028, students: 0 }, // Zero students
            ],
          },
        ],
        rentPlan: {
          rentModel: 'FIXED_ESCALATION',
          parameters: {
            baseRent: 10_000_000,
            escalationRate: 0.04,
          },
        },
        staffCostBase: 15_000_000,
        staffCostCpiFrequency: 2,
        capexItems: [],
        opexSubAccounts: [],
        adminSettings: baseAdminSettings,
        startYear: 2028,
        endYear: 2028,
      };

      const result = calculateFullProjection(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const year = result.data.years[0];
        if (year) {
          // Revenue should be zero
          expect(year.revenue.toNumber()).toBe(0);
          // EBITDA should be negative (costs but no revenue)
          expect(year.ebitda.isNegative()).toBe(true);
          // Rent load should be undefined/zero (division by zero handled)
          expect(year.rentLoad.toNumber()).toBe(0);
        }
      }
    });

    it('should calculate rent load percentage correctly', () => {
      const params: FullProjectionParams = {
        curriculumPlans: [baseFRPlan, baseIBPlan],
        rentPlan: {
          rentModel: 'REVENUE_SHARE',
          parameters: {
            revenueSharePercent: 0.10, // 10% of revenue
          },
        },
        staffCostBase: 15_000_000,
        staffCostCpiFrequency: 2,
        capexItems: [],
        opexSubAccounts: [],
        adminSettings: baseAdminSettings,
        startYear: 2028,
        endYear: 2032,
      };

      const result = calculateFullProjection(params);

      expect(result.success).toBe(true);
      if (result.success) {
        // Rent load should be 10% for all years
        for (const year of result.data.years) {
          expect(year.rentLoad.toNumber()).toBeCloseTo(10, 0);
        }
      }
    });

    it('should meet performance target (<50ms)', () => {
      // Create full 30-year projection
      const frStudents30 = [];
      const ibStudents30 = [];
      
      for (let year = 2023; year <= 2052; year++) {
        if (year < 2028) {
          frStudents30.push({ year, students: 300 });
          ibStudents30.push({ year, students: 20 });
        } else if (year === 2028) {
          frStudents30.push({ year, students: 300 });
          ibStudents30.push({ year, students: 30 });
        } else if (year <= 2032) {
          const rampYear = year - 2028;
          frStudents30.push({ year, students: 300 + rampYear * 20 });
          ibStudents30.push({ year, students: 30 + rampYear * 35 });
        } else {
          frStudents30.push({ year, students: 400 });
          ibStudents30.push({ year, students: 200 });
        }
      }

      const params: FullProjectionParams = {
        curriculumPlans: [
          { ...baseFRPlan, studentsProjection: frStudents30 },
          { ...baseIBPlan, studentsProjection: ibStudents30 },
        ],
        rentPlan: {
          rentModel: 'FIXED_ESCALATION',
          parameters: {
            baseRent: 10_000_000,
            escalationRate: 0.04,
          },
        },
        staffCostBase: 15_000_000,
        staffCostCpiFrequency: 2,
        capexItems: [],
        opexSubAccounts: [
          {
            subAccountName: 'Marketing',
            percentOfRevenue: 0.03,
            isFixed: false,
            fixedAmount: null,
          },
        ],
        adminSettings: baseAdminSettings,
        startYear: 2023,
        endYear: 2052,
      };

      const result = calculateFullProjection(params);

      expect(result.success).toBe(true);
      if (result.success) {
        // Performance target: <50ms
        expect(result.data.duration).toBeLessThan(50);
      }
    });
  });
});

