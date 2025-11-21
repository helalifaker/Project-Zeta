/**
 * Regression Test: YearlyProjection Field Population
 *
 * Purpose: Verify that calculateFullProjection populates ALL fields in YearlyProjection
 * to prevent DecimalError from undefined values in UI components.
 *
 * This test addresses the bug where PnLStatement.tsx received undefined staffCosts
 * causing: [DecimalError] Invalid argument: undefined
 *
 * Reference: Challenge 2 - DecimalError in PnLStatement.tsx
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { calculateFullProjection } from '../projection';
import type { FullProjectionParams, YearlyProjection } from '../projection';
import Decimal from 'decimal.js';

// Configure Decimal.js
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Helper to create minimal test parameters for projection
 */
function createTestProjectionParams(versionId?: string): FullProjectionParams {
  return {
    curriculumPlans: [
      {
        curriculumType: 'FR',
        capacity: 1000,
        tuitionBase: new Decimal(50000),
        cpiFrequency: 2,
        studentsProjection: Array.from({ length: 30 }, (_, i) => ({
          year: 2023 + i,
          students: 800 + i * 10, // Gradual growth
        })),
      },
      {
        curriculumType: 'IB',
        capacity: 800,
        tuitionBase: new Decimal(60000),
        cpiFrequency: 2,
        studentsProjection: Array.from({ length: 30 }, (_, i) => ({
          year: 2023 + i,
          students: 400 + i * 15, // Gradual growth
        })),
      },
    ],
    rentPlan: {
      rentModel: 'FIXED_ESCALATION',
      parameters: {
        baseRent: 10000000, // 10M SAR
        escalationRate: 0.03, // 3% annual
        frequency: 1,
        transitionRent: 8000000, // 8M SAR for transition period
      },
    },
    staffCostBase: 15000000, // 15M SAR
    staffCostCpiFrequency: 2,
    capexItems: [
      { year: 2028, amount: 5000000 }, // 5M SAR in 2028
      { year: 2035, amount: 3000000 }, // 3M SAR in 2035
    ],
    opexSubAccounts: [
      {
        subAccountName: 'Marketing',
        percentOfRevenue: 0.03, // 3% of revenue
        isFixed: false,
        fixedAmount: null,
      },
      {
        subAccountName: 'Utilities',
        percentOfRevenue: null,
        isFixed: true,
        fixedAmount: 500000, // 500K SAR fixed
      },
    ],
    adminSettings: {
      cpiRate: 0.03, // 3%
      discountRate: 0.08, // 8%
      zakatRate: 0.025, // 2.5%
    },
    startYear: 2023,
    endYear: 2052,
    versionId, // Optional - triggers CircularSolver if provided
    versionMode: 'RELOCATION_2028',
    balanceSheetSettings: {
      startingCash: 5000000,
      openingEquity: 55000000,
    },
    depreciationRate: 0.1,
    transitionCapacity: 1850,
  };
}

/**
 * Check if a value is a valid Decimal (not undefined, not null)
 */
function isValidDecimal(value: any): boolean {
  return value !== undefined && value !== null && value instanceof Decimal;
}

/**
 * Validate that all critical fields in YearlyProjection are defined
 */
function validateYearlyProjection(year: YearlyProjection): {
  valid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  // Core financial fields (MUST be defined)
  if (!isValidDecimal(year.revenue)) missingFields.push('revenue');
  if (!isValidDecimal(year.staffCost)) missingFields.push('staffCost');
  if (!isValidDecimal(year.staffCosts)) missingFields.push('staffCosts'); // Alias field
  if (!isValidDecimal(year.rent)) missingFields.push('rent');
  if (!isValidDecimal(year.opex)) missingFields.push('opex');
  if (!isValidDecimal(year.ebitda)) missingFields.push('ebitda');
  if (!isValidDecimal(year.ebitdaMargin)) missingFields.push('ebitdaMargin');
  if (!isValidDecimal(year.capex)) missingFields.push('capex');
  if (!isValidDecimal(year.rentLoad)) missingFields.push('rentLoad');

  // Legacy fields (should be defined for backward compatibility)
  if (!isValidDecimal(year.interest)) missingFields.push('interest');
  if (!isValidDecimal(year.taxes)) missingFields.push('taxes');
  if (!isValidDecimal(year.cashFlow)) missingFields.push('cashFlow');

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Validate CircularSolver fields (optional fields, only if solver was used)
 */
function validateCircularSolverFields(year: YearlyProjection): {
  valid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  if (!isValidDecimal(year.depreciation)) missingFields.push('depreciation');
  if (!isValidDecimal(year.interestExpense)) missingFields.push('interestExpense');
  if (!isValidDecimal(year.interestIncome)) missingFields.push('interestIncome');
  if (!isValidDecimal(year.zakat)) missingFields.push('zakat');
  if (!isValidDecimal(year.netResult)) missingFields.push('netResult');
  if (!isValidDecimal(year.workingCapitalChange)) missingFields.push('workingCapitalChange');
  if (!isValidDecimal(year.operatingCashFlow)) missingFields.push('operatingCashFlow');
  if (!isValidDecimal(year.investingCashFlow)) missingFields.push('investingCashFlow');
  if (!isValidDecimal(year.financingCashFlow)) missingFields.push('financingCashFlow');
  if (!isValidDecimal(year.netCashFlow)) missingFields.push('netCashFlow');

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

describe('YearlyProjection Field Population (Regression Test)', () => {
  describe('Core Financial Fields', () => {
    it('should populate all core financial fields for all 30 years', async () => {
      const params = createTestProjectionParams();
      const result = await calculateFullProjection(params);

      expect(result.success).toBe(true);
      if (!result.success) return;

      const { years } = result.data;

      // Should have 30 years (2023-2052)
      expect(years.length).toBe(30);

      // Validate each year
      const invalidYears: Array<{ year: number; missingFields: string[] }> = [];

      years.forEach((year) => {
        const validation = validateYearlyProjection(year);
        if (!validation.valid) {
          invalidYears.push({
            year: year.year,
            missingFields: validation.missingFields,
          });
        }
      });

      // All years should have valid fields
      expect(invalidYears).toEqual([]);

      if (invalidYears.length > 0) {
        console.error('❌ Invalid years found:', JSON.stringify(invalidYears, null, 2));
      }
    });

    it('should have staffCosts field matching staffCost field', async () => {
      const params = createTestProjectionParams();
      const result = await calculateFullProjection(params);

      expect(result.success).toBe(true);
      if (!result.success) return;

      const { years } = result.data;

      years.forEach((year) => {
        expect(year.staffCosts).toBeDefined();
        expect(year.staffCost).toBeDefined();

        // staffCosts (plural) should equal staffCost (singular)
        expect(year.staffCosts?.toNumber()).toEqual(year.staffCost.toNumber());
      });
    });

    it('should have no undefined values in critical fields', async () => {
      const params = createTestProjectionParams();
      const result = await calculateFullProjection(params);

      expect(result.success).toBe(true);
      if (!result.success) return;

      const { years } = result.data;

      years.forEach((year) => {
        // Check that no critical field is undefined
        expect(year.revenue).not.toBeUndefined();
        expect(year.staffCost).not.toBeUndefined();
        expect(year.staffCosts).not.toBeUndefined();
        expect(year.ebitda).not.toBeUndefined();
        expect(year.rent).not.toBeUndefined();
        expect(year.opex).not.toBeUndefined();
      });
    });

    it('should handle zero revenue without division errors', async () => {
      // Create params with zero students (zero revenue)
      const params = createTestProjectionParams();
      params.curriculumPlans = params.curriculumPlans.map((cp) => ({
        ...cp,
        studentsProjection: cp.studentsProjection.map((sp) => ({
          ...sp,
          students: 0, // Zero students = zero revenue
        })),
      }));

      const result = await calculateFullProjection(params);

      expect(result.success).toBe(true);
      if (!result.success) return;

      const { years } = result.data;

      years.forEach((year) => {
        // EBITDA margin and rent load should be 0 (not NaN or undefined)
        expect(year.ebitdaMargin.toNumber()).toBe(0);
        expect(year.rentLoad.toNumber()).toBe(0);
      });
    });
  });

  describe('CircularSolver Fields (when versionId provided)', () => {
    it('should populate CircularSolver fields when versionId is provided', async () => {
      const params = createTestProjectionParams('test-version-id');
      const result = await calculateFullProjection(params);

      expect(result.success).toBe(true);
      if (!result.success) return;

      const { years, metadata } = result.data;

      // If solver converged, all fields should be populated
      if (metadata?.converged) {
        const invalidYears: Array<{ year: number; missingFields: string[] }> = [];

        years.forEach((year) => {
          const validation = validateCircularSolverFields(year);
          if (!validation.valid) {
            invalidYears.push({
              year: year.year,
              missingFields: validation.missingFields,
            });
          }
        });

        expect(invalidYears).toEqual([]);

        if (invalidYears.length > 0) {
          console.error(
            '❌ CircularSolver fields missing for years:',
            JSON.stringify(invalidYears, null, 2)
          );
        }
      }
    });

    it('should have depreciation field populated when solver is used', async () => {
      const params = createTestProjectionParams('test-version-id');
      const result = await calculateFullProjection(params);

      expect(result.success).toBe(true);
      if (!result.success) return;

      const { years, metadata } = result.data;

      if (metadata?.converged) {
        years.forEach((year) => {
          expect(year.depreciation).toBeDefined();
          expect(year.depreciation).toBeInstanceOf(Decimal);
        });
      }
    });

    it('should have zakat field populated when solver is used', async () => {
      const params = createTestProjectionParams('test-version-id');
      const result = await calculateFullProjection(params);

      expect(result.success).toBe(true);
      if (!result.success) return;

      const { years, metadata } = result.data;

      if (metadata?.converged) {
        years.forEach((year) => {
          expect(year.zakat).toBeDefined();
          expect(year.zakat).toBeInstanceOf(Decimal);
        });
      }
    });
  });

  describe('Fallback Behavior (when solver not available)', () => {
    it('should populate CircularSolver fields with defaults when versionId is not provided', async () => {
      const params = createTestProjectionParams(); // No versionId
      const result = await calculateFullProjection(params);

      expect(result.success).toBe(true);
      if (!result.success) return;

      const { years } = result.data;

      years.forEach((year) => {
        // Solver fields should still be defined (with fallback values)
        expect(year.depreciation).toBeDefined();
        expect(year.interestExpense).toBeDefined();
        expect(year.interestIncome).toBeDefined();
        expect(year.zakat).toBeDefined();
        expect(year.netResult).toBeDefined();

        // Fallback values should be Decimal instances
        expect(year.depreciation).toBeInstanceOf(Decimal);
        expect(year.interestExpense).toBeInstanceOf(Decimal);
        expect(year.zakat).toBeInstanceOf(Decimal);
      });
    });
  });

  describe('Historical Period Fields', () => {
    it('should populate all fields for historical years (2023-2024)', async () => {
      const params = createTestProjectionParams('test-version-id');

      // Add historical actuals
      params.historicalActuals = [
        {
          year: 2023,
          revenue: 50000000,
          staffCost: 15000000,
          rent: 8000000,
          opex: 5000000,
          capex: 2000000,
        },
        {
          year: 2024,
          revenue: 52000000,
          staffCost: 15500000,
          rent: 8240000,
          opex: 5200000,
          capex: 1500000,
        },
      ];

      const result = await calculateFullProjection(params);

      expect(result.success).toBe(true);
      if (!result.success) return;

      const { years } = result.data;

      // Validate 2023 and 2024 specifically
      const year2023 = years.find((y) => y.year === 2023);
      const year2024 = years.find((y) => y.year === 2024);

      expect(year2023).toBeDefined();
      expect(year2024).toBeDefined();

      if (year2023) {
        const validation = validateYearlyProjection(year2023);
        expect(validation.valid).toBe(true);
        if (!validation.valid) {
          console.error('❌ Year 2023 missing fields:', validation.missingFields);
        }
      }

      if (year2024) {
        const validation = validateYearlyProjection(year2024);
        expect(validation.valid).toBe(true);
        if (!validation.valid) {
          console.error('❌ Year 2024 missing fields:', validation.missingFields);
        }
      }
    });
  });

  describe('Performance & Edge Cases', () => {
    it('should complete projection in under 3000ms (including CircularSolver)', async () => {
      const params = createTestProjectionParams('test-version-id');

      const startTime = performance.now();
      const result = await calculateFullProjection(params);
      const duration = performance.now() - startTime;

      expect(result.success).toBe(true);
      // CircularSolver adds ~1-2s, so total should be <3s
      expect(duration).toBeLessThan(3000);

      console.log(`⏱️ Projection with CircularSolver calculated in ${duration.toFixed(2)}ms`);
    });

    it('should handle negative EBITDA without errors', async () => {
      const params = createTestProjectionParams();

      // Set very high staff costs to create negative EBITDA
      params.staffCostBase = 100000000; // 100M SAR (unrealistic but tests edge case)

      const result = await calculateFullProjection(params);

      expect(result.success).toBe(true);
      if (!result.success) return;

      const { years } = result.data;

      // Should have negative EBITDA but all fields still defined
      const negativeYears = years.filter((y) => y.ebitda.isNegative());
      expect(negativeYears.length).toBeGreaterThan(0);

      negativeYears.forEach((year) => {
        const validation = validateYearlyProjection(year);
        expect(validation.valid).toBe(true);
      });
    });
  });
});
