/**
 * Calculation Engine Tests for Transition Period Logic
 *
 * Tests transition period calculation helpers and their integration into
 * the main calculation engine. Focuses on:
 * - Transition enrollment adjustments
 * - Transition staff cost usage (no backward deflation in calculations)
 * - Transition rent calculation
 * - Weighted average tuition
 * - Revenue calculation with transition data
 * - Edge cases and boundary conditions
 * - Fallback behavior when data unavailable
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Decimal from 'decimal.js';
import {
  getTransitionPeriodData,
  getAllTransitionPeriodData,
  calculateTransitionRentFromHistorical,
  calculateTransitionWeightedAverageTuition,
  calculateTransitionRevenue,
  isTransitionDataAvailable,
} from '../transition-helpers';
import {
  createTestVersion,
  cleanupTestVersion,
  seedTransitionTestData,
  seedHistorical2024Data,
  seedTransitionAdminSettings,
  cleanupTransitionTestData,
  assertDecimalClose,
} from '@/test-utils/transition-helpers';
import {
  mockHistorical2024,
  expectedTransitionRent,
  expectedAvgTuition2024,
  expectedAvgTuition2025,
  expectedTransitionRevenue2025,
  edgeCases,
} from '@/fixtures/transition-test-data';

describe('Transition Calculation Helpers', () => {
  let testVersionId: string;
  const TEST_USER_ID = 'test-calc-user';

  beforeAll(async () => {
    // Create test version with curriculum plans and historical data
    const version = await createTestVersion(TEST_USER_ID, 'RELOCATION_2028');
    testVersionId = version.id;

    // Seed transition data
    await seedTransitionTestData();
    await seedTransitionAdminSettings(1850, 10.0);
  });

  afterAll(async () => {
    await cleanupTransitionTestData();
    await cleanupTestVersion(testVersionId);
  });

  describe('Transition Period Data Retrieval', () => {
    it('should fetch complete transition data for a single year', async () => {
      const result = await getTransitionPeriodData(2025, testVersionId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.year).toBe(2025);
        expect(result.data.targetEnrollment).toBe(1850);
        expect(result.data.staffCostBase).toBeInstanceOf(Decimal);
        expect(result.data.rent).toBeInstanceOf(Decimal);
      }
    });

    it('should calculate rent from 2024 historical baseline', async () => {
      const result = await getTransitionPeriodData(2025, testVersionId);

      expect(result.success).toBe(true);
      if (result.success) {
        // Expected: 12M (from historical 2024) × 1.10 = 13.2M
        expect(assertDecimalClose(result.data.rent, expectedTransitionRent, 0.01)).toBe(true);
      }
    });

    it('should fetch all transition years with consistent rent', async () => {
      const result = await getAllTransitionPeriodData(testVersionId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(3);

        // All years should have same rent (calculated from 2024 + adjustment)
        const rents = result.data.map((d) => d.rent.toNumber());
        expect(rents[0]).toBe(rents[1]);
        expect(rents[1]).toBe(rents[2]);
      }
    });

    it('should return error for year outside range', async () => {
      const result2024 = await getTransitionPeriodData(2024, testVersionId);
      const result2028 = await getTransitionPeriodData(2028, testVersionId);

      expect(result2024.success).toBe(false);
      expect(result2028.success).toBe(false);
    });

    it('should handle missing historical data gracefully', async () => {
      // Create version without historical data
      const emptyVersion = await createTestVersion('test-empty-user', 'RELOCATION_2028');

      // Delete historical data
      const { prisma } = await import('@/lib/db/prisma');
      await prisma.historical_actuals.deleteMany({
        where: { versionId: emptyVersion.id },
      });

      const result = await getTransitionPeriodData(2025, emptyVersion.id);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('2024');
      }

      await cleanupTestVersion(emptyVersion.id);
    });
  });

  describe('Transition Rent Calculation', () => {
    it('should calculate rent with positive adjustment', async () => {
      const result = await calculateTransitionRentFromHistorical(testVersionId, 10.0);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(assertDecimalClose(result.data, expectedTransitionRent, 0.01)).toBe(true);
      }
    });

    it('should calculate rent with negative adjustment', async () => {
      const { historical2024Rent, adjustmentPercent, expectedRent } =
        edgeCases.negativeRentAdjustment;

      // Temporarily update historical rent
      const { prisma } = await import('@/lib/db/prisma');
      await prisma.historical_actuals.update({
        where: {
          versionId_year: {
            versionId: testVersionId,
            year: 2024,
          },
        },
        data: {
          schoolRent: historical2024Rent,
        },
      });

      const result = await calculateTransitionRentFromHistorical(testVersionId, adjustmentPercent);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(assertDecimalClose(result.data, expectedRent, 0.01)).toBe(true);
      }

      // Restore original rent
      await prisma.historical_actuals.update({
        where: {
          versionId_year: {
            versionId: testVersionId,
            year: 2024,
          },
        },
        data: {
          schoolRent: mockHistorical2024.schoolRent,
        },
      });
    });

    it('should handle zero rent adjustment', async () => {
      const { historical2024Rent, adjustmentPercent, expectedRent } = edgeCases.zeroRentAdjustment;

      const { prisma } = await import('@/lib/db/prisma');
      await prisma.historical_actuals.update({
        where: {
          versionId_year: {
            versionId: testVersionId,
            year: 2024,
          },
        },
        data: {
          schoolRent: historical2024Rent,
        },
      });

      const result = await calculateTransitionRentFromHistorical(testVersionId, adjustmentPercent);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(expectedRent.toNumber());
      }

      // Restore
      await prisma.historical_actuals.update({
        where: {
          versionId_year: {
            versionId: testVersionId,
            year: 2024,
          },
        },
        data: {
          schoolRent: mockHistorical2024.schoolRent,
        },
      });
    });

    it('should handle large adjustment percentages', async () => {
      const result = await calculateTransitionRentFromHistorical(testVersionId, 100.0); // Double rent

      expect(result.success).toBe(true);
      if (result.success) {
        const historical = mockHistorical2024.schoolRent;
        const expected = historical.times(2);
        expect(assertDecimalClose(result.data, expected, 0.01)).toBe(true);
      }
    });

    it('should fail when 2024 historical data is missing', async () => {
      const testVersion = await createTestVersion('test-no-hist', 'RELOCATION_2028');

      // Delete historical data
      const { prisma } = await import('@/lib/db/prisma');
      await prisma.historical_actuals.deleteMany({
        where: { versionId: testVersion.id },
      });

      const result = await calculateTransitionRentFromHistorical(testVersion.id, 10.0);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('No historical data found for year 2024');
        expect(result.code).toBe('HISTORICAL_DATA_NOT_FOUND');
      }

      await cleanupTestVersion(testVersion.id);
    });
  });

  describe('Weighted Average Tuition Calculation', () => {
    it('should calculate weighted average from 2024 tuition revenues', async () => {
      const result = await calculateTransitionWeightedAverageTuition(testVersionId, 2025, 0.03);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should use CPI growth: avgTuition2024 × (1.03^1)
        expect(assertDecimalClose(result.data, expectedAvgTuition2025, 0.01)).toBe(true);
      }
    });

    it('should apply CPI growth correctly for each year', async () => {
      const result2025 = await calculateTransitionWeightedAverageTuition(testVersionId, 2025, 0.03);
      const result2026 = await calculateTransitionWeightedAverageTuition(testVersionId, 2026, 0.03);
      const result2027 = await calculateTransitionWeightedAverageTuition(testVersionId, 2027, 0.03);

      expect(result2025.success).toBe(true);
      expect(result2026.success).toBe(true);
      expect(result2027.success).toBe(true);

      if (result2025.success && result2026.success && result2027.success) {
        // Each year should be higher due to CPI growth
        expect(result2026.data.greaterThan(result2025.data)).toBe(true);
        expect(result2027.data.greaterThan(result2026.data)).toBe(true);

        // Verify growth rate
        const growthRate2025to2026 = result2026.data.dividedBy(result2025.data).minus(1);
        expect(assertDecimalClose(growthRate2025to2026, new Decimal(0.03), 0.001)).toBe(true);
      }
    });

    it('should handle zero CPI rate (no growth)', async () => {
      const result2025 = await calculateTransitionWeightedAverageTuition(testVersionId, 2025, 0);
      const result2026 = await calculateTransitionWeightedAverageTuition(testVersionId, 2026, 0);

      expect(result2025.success).toBe(true);
      expect(result2026.success).toBe(true);

      if (result2025.success && result2026.success) {
        // With 0% CPI, tuition should stay constant
        expect(result2025.data.toNumber()).toBeCloseTo(result2026.data.toNumber(), 2);
      }
    });

    it('should reject year outside transition range', async () => {
      const result2024 = await calculateTransitionWeightedAverageTuition(testVersionId, 2024, 0.03);
      const result2028 = await calculateTransitionWeightedAverageTuition(testVersionId, 2028, 0.03);

      expect(result2024.success).toBe(false);
      expect(result2028.success).toBe(false);
    });

    it('should handle missing curriculum data gracefully', async () => {
      const testVersion = await createTestVersion('test-no-curric', 'RELOCATION_2028');

      // Delete curriculum plans
      const { prisma } = await import('@/lib/db/prisma');
      await prisma.curriculum_plans.deleteMany({
        where: { versionId: testVersion.id },
      });

      const result = await calculateTransitionWeightedAverageTuition(testVersion.id, 2025, 0.03);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('curriculum data');
      }

      await cleanupTestVersion(testVersion.id);
    });

    it('should handle zero enrollment (edge case)', async () => {
      const testVersion = await createTestVersion('test-zero-enrollment', 'RELOCATION_2028');

      // Update curriculum plans to have zero enrollment
      const { prisma } = await import('@/lib/db/prisma');
      await prisma.curriculum_plans.updateMany({
        where: { versionId: testVersion.id },
        data: {
          studentsProjection: [{ year: 2024, students: 0 }],
        },
      });

      const result = await calculateTransitionWeightedAverageTuition(testVersion.id, 2025, 0.03);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('zero');
      }

      await cleanupTestVersion(testVersion.id);
    });
  });

  describe('Transition Revenue Calculation', () => {
    it('should calculate revenue as avgTuition × enrollment', async () => {
      const result = await calculateTransitionRevenue(testVersionId, 2025, 1850, 0.03);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(assertDecimalClose(result.data, expectedTransitionRevenue2025, 100.0)).toBe(true);
      }
    });

    it('should handle different enrollment values', async () => {
      const result1500 = await calculateTransitionRevenue(testVersionId, 2025, 1500, 0.03);
      const result2000 = await calculateTransitionRevenue(testVersionId, 2025, 2000, 0.03);

      expect(result1500.success).toBe(true);
      expect(result2000.success).toBe(true);

      if (result1500.success && result2000.success) {
        // Revenue should scale linearly with enrollment
        const ratio = result2000.data.dividedBy(result1500.data);
        expect(assertDecimalClose(ratio, new Decimal(2000 / 1500), 0.001)).toBe(true);
      }
    });

    it('should handle zero enrollment', async () => {
      const result = await calculateTransitionRevenue(testVersionId, 2025, 0, 0.03);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(0);
      }
    });

    it('should reject negative enrollment', async () => {
      const result = await calculateTransitionRevenue(testVersionId, 2025, -100, 0.03);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('cannot be negative');
      }
    });

    it('should calculate revenue for all transition years', async () => {
      const result2025 = await calculateTransitionRevenue(testVersionId, 2025, 1850, 0.03);
      const result2026 = await calculateTransitionRevenue(testVersionId, 2026, 1850, 0.03);
      const result2027 = await calculateTransitionRevenue(testVersionId, 2027, 1850, 0.03);

      expect(result2025.success).toBe(true);
      expect(result2026.success).toBe(true);
      expect(result2027.success).toBe(true);

      if (result2025.success && result2026.success && result2027.success) {
        // Revenue should increase year over year due to CPI growth (same enrollment)
        expect(result2026.data.greaterThan(result2025.data)).toBe(true);
        expect(result2027.data.greaterThan(result2026.data)).toBe(true);
      }
    });
  });

  describe('Transition Data Availability Check', () => {
    it('should return true when all required data exists', async () => {
      const result = await isTransitionDataAvailable(testVersionId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('should return false when transition year data is missing', async () => {
      const testVersion = await createTestVersion('test-no-transition', 'RELOCATION_2028');

      // Delete transition data
      await cleanupTransitionTestData();

      const result = await isTransitionDataAvailable(testVersion.id);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }

      // Restore transition data
      await seedTransitionTestData();
      await cleanupTestVersion(testVersion.id);
    });

    it('should return false when 2024 historical data is missing', async () => {
      const testVersion = await createTestVersion('test-no-2024', 'RELOCATION_2028');

      // Delete historical data
      const { prisma } = await import('@/lib/db/prisma');
      await prisma.historical_actuals.deleteMany({
        where: { versionId: testVersion.id },
      });

      const result = await isTransitionDataAvailable(testVersion.id);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }

      await cleanupTestVersion(testVersion.id);
    });

    it('should return false when only partial transition data exists', async () => {
      const testVersion = await createTestVersion('test-partial', 'RELOCATION_2028');

      // Delete transition data and create only 2 years
      await cleanupTransitionTestData();
      await seedTransitionTestData([
        { year: 2025, targetEnrollment: 1850, staffCostBase: new Decimal(9000000) },
        { year: 2026, targetEnrollment: 1850, staffCostBase: new Decimal(9300000) },
      ]);

      const result = await isTransitionDataAvailable(testVersion.id);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false); // Need all 3 years
      }

      // Restore full data
      await seedTransitionTestData();
      await cleanupTestVersion(testVersion.id);
    });

    it('should handle database errors gracefully', async () => {
      // Use invalid version ID
      const result = await isTransitionDataAvailable('invalid-version-id');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false); // Should default to false on error
      }
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle very large enrollment numbers', async () => {
      const result = await calculateTransitionRevenue(testVersionId, 2025, 10000, 0.03);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.greaterThan(0)).toBe(true);
      }
    });

    it('should handle high CPI rates', async () => {
      const result = await calculateTransitionWeightedAverageTuition(testVersionId, 2025, 0.1); // 10%

      expect(result.success).toBe(true);
      if (result.success) {
        // Should apply 10% growth
        const expectedWithHighCPI = expectedAvgTuition2024.times(1.1);
        expect(assertDecimalClose(result.data, expectedWithHighCPI, 0.01)).toBe(true);
      }
    });

    it('should maintain precision with Decimal.js', async () => {
      const result = await calculateTransitionRevenue(testVersionId, 2025, 1234, 0.03);

      expect(result.success).toBe(true);
      if (result.success) {
        // Verify no floating point errors
        expect(result.data).toBeInstanceOf(Decimal);
        expect(result.data.decimalPlaces()).toBeLessThanOrEqual(2); // Max 2 decimal places for money
      }
    });

    it('should handle missing notes in transition data', async () => {
      // Create transition data without notes
      await cleanupTransitionTestData();
      await seedTransitionTestData([
        {
          year: 2025,
          targetEnrollment: 1850,
          staffCostBase: new Decimal(9000000),
          notes: undefined as any,
        },
      ]);
      await seedTransitionTestData([
        { year: 2026, targetEnrollment: 1850, staffCostBase: new Decimal(9300000) },
        { year: 2027, targetEnrollment: 1850, staffCostBase: new Decimal(9600000) },
      ]);

      const result = await getTransitionPeriodData(2025, testVersionId);

      expect(result.success).toBe(true);
      // Should not fail when notes are missing

      // Restore full data
      await seedTransitionTestData();
    });
  });
});
