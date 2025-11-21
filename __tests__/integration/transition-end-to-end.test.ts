/**
 * End-to-End Integration Tests for Transition Period Feature
 *
 * Tests complete workflows spanning database, service, calculation, and API layers.
 *
 * Workflows tested:
 * 1. Admin creates and updates transition data
 * 2. Recalculate staff costs from 2028 baseline
 * 3. Version creation with transition period projection
 * 4. Full projection calculation using transition data
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Decimal from 'decimal.js';
import {
  createTestVersion,
  cleanupTestVersion,
  seedTransitionTestData,
  seedTransitionAdminSettings,
  cleanupTransitionTestData,
  assertDecimalClose,
} from '@/test-utils/transition-helpers';
import { getAllTransitionYears, getCompleteTransitionConfig } from '@/services/transition/read';
import {
  updateTransitionYear,
  updateTransitionSettings,
  recalculateTransitionStaffCosts,
  initializeTransitionYearData,
} from '@/services/transition/update';
import {
  getAllTransitionPeriodData,
  calculateTransitionRevenue,
} from '@/lib/calculations/financial/transition-helpers';
import {
  calculateFullProjection,
  type FullProjectionParams,
} from '@/lib/calculations/financial/projection';

const TEST_USER_ID = 'integration-test-user';

describe('Transition E2E - Admin Creates and Updates Data', () => {
  let versionId: string;

  beforeAll(async () => {
    const version = await createTestVersion(TEST_USER_ID, 'RELOCATION_2028');
    versionId = version.id;
    await cleanupTransitionTestData();
  });

  afterAll(async () => {
    await cleanupTransitionTestData();
    await cleanupTestVersion(versionId);
  });

  it('should complete full workflow: initialize → update → verify', async () => {
    // Step 1: Initialize transition data
    const initResult = await initializeTransitionYearData(1850, new Decimal(9000000), TEST_USER_ID);

    expect(initResult.success).toBe(true);
    if (!initResult.success) return;
    expect(initResult.data).toHaveLength(3);

    // Step 2: Verify initialization
    const allYears = await getAllTransitionYears();
    expect(allYears.success).toBe(true);
    if (!allYears.success) return;
    expect(allYears.data).toHaveLength(3);

    // Step 3: Update settings
    const settingsResult = await updateTransitionSettings(
      {
        capacityCap: 2000,
        rentAdjustmentPercent: 15.0,
      },
      TEST_USER_ID
    );

    expect(settingsResult.success).toBe(true);
    if (!settingsResult.success) return;
    expect(settingsResult.data.capacityCap).toBe(2000);
    expect(settingsResult.data.rentAdjustmentPercent).toBe(15.0);

    // Step 4: Update specific year
    const yearUpdateResult = await updateTransitionYear(
      {
        year: 2025,
        targetEnrollment: 1900,
        notes: 'Updated enrollment',
      },
      TEST_USER_ID
    );

    expect(yearUpdateResult.success).toBe(true);
    if (!yearUpdateResult.success) return;
    expect(yearUpdateResult.data.targetEnrollment).toBe(1900);
    expect(yearUpdateResult.data.notes).toBe('Updated enrollment');

    // Step 5: Verify update persisted
    const configResult = await getCompleteTransitionConfig();
    expect(configResult.success).toBe(true);
    if (!configResult.success) return;

    const year2025 = configResult.data.yearData.find((y) => y.year === 2025);
    expect(year2025).toBeDefined();
    if (year2025) {
      expect(year2025.targetEnrollment).toBe(1900);
    }
    expect(configResult.data.settings.capacityCap).toBe(2000);
  });

  it('should handle multiple sequential updates', async () => {
    await seedTransitionTestData();

    // First update
    const update1 = await updateTransitionYear(
      { year: 2025, targetEnrollment: 1800 },
      TEST_USER_ID
    );
    expect(update1.success).toBe(true);

    // Second update (different year)
    const update2 = await updateTransitionYear(
      { year: 2026, targetEnrollment: 1900 },
      TEST_USER_ID
    );
    expect(update2.success).toBe(true);

    // Third update (same year as first)
    const update3 = await updateTransitionYear(
      { year: 2025, targetEnrollment: 2000 },
      TEST_USER_ID
    );
    expect(update3.success).toBe(true);

    // Verify final state
    const finalConfig = await getCompleteTransitionConfig();
    if (!finalConfig.success) return;

    const year2025 = finalConfig.data.yearData.find((y) => y.year === 2025);
    const year2026 = finalConfig.data.yearData.find((y) => y.year === 2026);

    if (year2025 && year2026) {
      expect(year2025.targetEnrollment).toBe(2000); // Last update
      expect(year2026.targetEnrollment).toBe(1900);
    }
  });
});

describe('Transition E2E - Recalculate from 2028 Baseline', () => {
  beforeAll(async () => {
    await cleanupTransitionTestData();
    await seedTransitionTestData();
  });

  afterAll(async () => {
    await cleanupTransitionTestData();
  });

  it('should recalculate all years and verify backward deflation', async () => {
    const base2028 = new Decimal(10000000);
    const cpiRate = 0.03;

    // Step 1: Recalculate
    const recalcResult = await recalculateTransitionStaffCosts(base2028, cpiRate, TEST_USER_ID);

    expect(recalcResult.success).toBe(true);
    if (!recalcResult.success) return;
    expect(recalcResult.data).toHaveLength(3);

    // Step 2: Verify calculations
    const year2025 = recalcResult.data.find((y) => y.year === 2025);
    const year2026 = recalcResult.data.find((y) => y.year === 2026);
    const year2027 = recalcResult.data.find((y) => y.year === 2027);

    expect(year2025).toBeDefined();
    expect(year2026).toBeDefined();
    expect(year2027).toBeDefined();

    // Expected: 10M / (1.03^3), 10M / (1.03^2), 10M / (1.03^1)
    const expected2025 = base2028.dividedBy(new Decimal(1.03).pow(3));
    const expected2026 = base2028.dividedBy(new Decimal(1.03).pow(2));
    const expected2027 = base2028.dividedBy(new Decimal(1.03).pow(1));

    expect(assertDecimalClose(new Decimal(year2025!.staffCostBase), expected2025, 1.0)).toBe(true);
    expect(assertDecimalClose(new Decimal(year2026!.staffCostBase), expected2026, 1.0)).toBe(true);
    expect(assertDecimalClose(new Decimal(year2027!.staffCostBase), expected2027, 1.0)).toBe(true);

    // Step 3: Verify persistence
    const allYears = await getAllTransitionYears();
    expect(allYears.success).toBe(true);
    if (!allYears.success) return;

    const persistedYear2025 = allYears.data.find((y) => y.year === 2025);
    expect(
      assertDecimalClose(new Decimal(persistedYear2025!.staffCostBase), expected2025, 1.0)
    ).toBe(true);
  });

  it('should handle recalculation with different CPI rates', async () => {
    const base2028 = new Decimal(12000000);

    // Recalculate with 5% CPI
    const result1 = await recalculateTransitionStaffCosts(base2028, 0.05, TEST_USER_ID);

    expect(result1.success).toBe(true);
    if (!result1.success) return;

    const staffCost2025_5pct = new Decimal(
      result1.data.find((y) => y.year === 2025)!.staffCostBase
    );

    // Recalculate with 2% CPI
    const result2 = await recalculateTransitionStaffCosts(base2028, 0.02, TEST_USER_ID);

    expect(result2.success).toBe(true);
    if (!result2.success) return;

    const staffCost2025_2pct = new Decimal(
      result2.data.find((y) => y.year === 2025)!.staffCostBase
    );

    // Higher CPI should result in lower deflated value
    expect(staffCost2025_5pct.lessThan(staffCost2025_2pct)).toBe(true);
  });
});

describe('Transition E2E - Version Creation with Projection', () => {
  let versionId: string;

  beforeAll(async () => {
    await cleanupTransitionTestData();
    await seedTransitionTestData();
    await seedTransitionAdminSettings(1850, 10.0);

    const version = await createTestVersion(TEST_USER_ID, 'RELOCATION_2028');
    versionId = version.id;
  });

  afterAll(async () => {
    await cleanupTransitionTestData();
    await cleanupTestVersion(versionId);
  });

  it('should fetch transition data for projection', async () => {
    const transitionData = await getAllTransitionPeriodData(versionId);

    expect(transitionData.success).toBe(true);
    if (!transitionData.success) return;

    expect(transitionData.data).toHaveLength(3);

    // Verify all required fields are present
    transitionData.data.forEach((yearData) => {
      expect(yearData.year).toBeGreaterThanOrEqual(2025);
      expect(yearData.year).toBeLessThanOrEqual(2027);
      expect(yearData.targetEnrollment).toBeGreaterThan(0);
      expect(yearData.staffCostBase).toBeInstanceOf(Decimal);
      expect(yearData.rent).toBeInstanceOf(Decimal);
    });
  });

  it('should calculate revenue for transition years', async () => {
    const year2025Revenue = await calculateTransitionRevenue(versionId, 2025, 1850, 0.03);

    expect(year2025Revenue.success).toBe(true);
    if (!year2025Revenue.success) return;

    expect(year2025Revenue.data.greaterThan(0)).toBe(true);
    expect(year2025Revenue.data).toBeInstanceOf(Decimal);

    // Revenue should be realistic (in millions)
    const revenueInMillions = year2025Revenue.data.dividedBy(1000000);
    expect(revenueInMillions.greaterThan(50)).toBe(true); // At least 50M
    expect(revenueInMillions.lessThan(200)).toBe(true); // Less than 200M
  });
});

describe('Transition E2E - Full Projection Calculation', () => {
  let versionId: string;

  beforeAll(async () => {
    await cleanupTransitionTestData();
    await seedTransitionTestData();
    await seedTransitionAdminSettings(1850, 10.0);

    const version = await createTestVersion(TEST_USER_ID, 'RELOCATION_2028');
    versionId = version.id;
  });

  afterAll(async () => {
    await cleanupTransitionTestData();
    await cleanupTestVersion(versionId);
  });

  it('should run full projection using transition data', async () => {
    // Fetch curriculum plans
    const { prisma } = await import('@/lib/db/prisma');
    const curricula = await prisma.curriculum_plans.findMany({
      where: { versionId },
    });

    expect(curricula).toHaveLength(2); // FR + IB

    // Prepare projection params
    const params: FullProjectionParams = {
      curriculumPlans: curricula.map((c) => ({
        curriculumType: c.curriculumType as 'FR' | 'IB',
        capacity: c.capacity,
        tuitionBase: c.tuitionBase,
        cpiFrequency: c.cpiFrequency as 1 | 2 | 3,
        studentsProjection: c.studentsProjection as Array<{ year: number; students: number }>,
      })),
      rentPlan: {
        rentModel: 'FIXED_ESCALATION',
        parameters: {
          baseRent: 12000000,
          escalationRate: 0.03,
          frequency: 1,
          transitionRent: 13200000, // Fallback (should use calculated from DB)
        },
      },
      staffCostBase: 9000000,
      staffCostCpiFrequency: 1,
      capexItems: [],
      opexSubAccounts: [
        { subAccountName: 'Marketing', percentOfRevenue: 0.03, isFixed: false, fixedAmount: null },
      ],
      adminSettings: {
        cpiRate: 0.03,
        discountRate: 0.08,
        zakatRate: 0.025,
      },
      versionId,
      versionMode: 'RELOCATION_2028',
      startYear: 2023,
      endYear: 2030,
    };

    const result = await calculateFullProjection(params);

    expect(result.success).toBe(true);
    if (!result.success) {
      console.error('Projection error:', result.error);
      return;
    }

    // Verify transition years in projection
    const year2025 = result.data.years.find((y) => y.year === 2025);
    const year2026 = result.data.years.find((y) => y.year === 2026);
    const year2027 = result.data.years.find((y) => y.year === 2027);

    expect(year2025).toBeDefined();
    expect(year2026).toBeDefined();
    expect(year2027).toBeDefined();

    if (!year2025 || !year2026 || !year2027) return;

    // Verify transition data is used
    // Rent should be calculated from 2024 + 10% = 13.2M
    expect(year2025.rent.toNumber()).toBeCloseTo(13200000, -5); // Within 100k
    expect(year2026.rent.toNumber()).toBeCloseTo(13200000, -5);
    expect(year2027.rent.toNumber()).toBeCloseTo(13200000, -5);

    // Staff costs should match database values
    const transitionData = await getAllTransitionPeriodData(versionId);
    if (!transitionData.success) return;

    const db2025 = transitionData.data.find((y) => y.year === 2025);
    const db2026 = transitionData.data.find((y) => y.year === 2026);
    const db2027 = transitionData.data.find((y) => y.year === 2027);

    expect(year2025.staffCost.toNumber()).toBeCloseTo(db2025!.staffCostBase.toNumber(), -3);
    expect(year2026.staffCost.toNumber()).toBeCloseTo(db2026!.staffCostBase.toNumber(), -3);
    expect(year2027.staffCost.toNumber()).toBeCloseTo(db2027!.staffCostBase.toNumber(), -3);

    // Enrollment should match targetEnrollment
    const total2025 = (year2025.studentsFR || 0) + (year2025.studentsIB || 0);
    const total2026 = (year2026.studentsFR || 0) + (year2026.studentsIB || 0);
    const total2027 = (year2027.studentsFR || 0) + (year2027.studentsIB || 0);

    expect(total2025).toBeCloseTo(db2025!.targetEnrollment, 5);
    expect(total2026).toBeCloseTo(db2026!.targetEnrollment, 5);
    expect(total2027).toBeCloseTo(db2027!.targetEnrollment, 5);
  }, 30000); // 30 second timeout for full projection

  it('should preserve historical period data (2023-2024)', async () => {
    const { prisma } = await import('@/lib/db/prisma');
    const curricula = await prisma.curriculum_plans.findMany({
      where: { versionId },
    });

    const params: FullProjectionParams = {
      curriculumPlans: curricula.map((c) => ({
        curriculumType: c.curriculumType as 'FR' | 'IB',
        capacity: c.capacity,
        tuitionBase: c.tuitionBase,
        cpiFrequency: c.cpiFrequency as 1 | 2 | 3,
        studentsProjection: c.studentsProjection as Array<{ year: number; students: number }>,
      })),
      rentPlan: {
        rentModel: 'FIXED_ESCALATION',
        parameters: {
          baseRent: 12000000,
          escalationRate: 0.03,
          frequency: 1,
        },
      },
      staffCostBase: 9000000,
      staffCostCpiFrequency: 1,
      capexItems: [],
      opexSubAccounts: [],
      adminSettings: {
        cpiRate: 0.03,
        discountRate: 0.08,
        zakatRate: 0.025,
      },
      versionId,
      versionMode: 'RELOCATION_2028',
      startYear: 2023,
      endYear: 2030,
    };

    const result = await calculateFullProjection(params);

    expect(result.success).toBe(true);
    if (!result.success) return;

    // Verify historical years use historical_actuals data
    const year2023 = result.data.years.find((y) => y.year === 2023);
    const year2024 = result.data.years.find((y) => y.year === 2024);

    expect(year2023).toBeDefined();
    expect(year2024).toBeDefined();

    if (!year2024) return;

    // 2024 rent should match historical data (12M from our seed)
    expect(year2024.rent.toNumber()).toBe(12000000);
  }, 30000);

  it('should handle dynamic period correctly (2028+)', async () => {
    const { prisma } = await import('@/lib/db/prisma');
    const curricula = await prisma.curriculum_plans.findMany({
      where: { versionId },
    });

    const params: FullProjectionParams = {
      curriculumPlans: curricula.map((c) => ({
        curriculumType: c.curriculumType as 'FR' | 'IB',
        capacity: c.capacity,
        tuitionBase: c.tuitionBase,
        cpiFrequency: c.cpiFrequency as 1 | 2 | 3,
        studentsProjection: c.studentsProjection as Array<{ year: number; students: number }>,
      })),
      rentPlan: {
        rentModel: 'FIXED_ESCALATION',
        parameters: {
          baseRent: 12000000,
          escalationRate: 0.03,
          frequency: 1,
        },
      },
      staffCostBase: 10000000,
      staffCostCpiFrequency: 1,
      capexItems: [],
      opexSubAccounts: [],
      adminSettings: {
        cpiRate: 0.03,
        discountRate: 0.08,
        zakatRate: 0.025,
      },
      versionId,
      versionMode: 'RELOCATION_2028',
      startYear: 2028,
      endYear: 2030,
    };

    const result = await calculateFullProjection(params);

    expect(result.success).toBe(true);
    if (!result.success) return;

    const year2028 = result.data.years.find((y) => y.year === 2028);
    const year2029 = result.data.years.find((y) => y.year === 2029);

    expect(year2028).toBeDefined();
    expect(year2029).toBeDefined();

    // Dynamic period should use rent model (not transition data)
    if (!year2028 || !year2029) return;

    // Rent should escalate according to model
    const expectedRent2029 = new Decimal(year2028.rent).times(1.03);
    expect(assertDecimalClose(year2029.rent, expectedRent2029, 1000)).toBe(true);
  }, 30000);
});

describe('Transition E2E - Error Recovery and Edge Cases', () => {
  let versionId: string;

  beforeAll(async () => {
    const version = await createTestVersion(TEST_USER_ID, 'RELOCATION_2028');
    versionId = version.id;
  });

  afterAll(async () => {
    await cleanupTestVersion(versionId);
  });

  it('should handle missing transition data gracefully', async () => {
    // Delete all transition data
    await cleanupTransitionTestData();

    // Try to fetch data
    const result = await getAllTransitionPeriodData(versionId);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }

    // Restore data
    await seedTransitionTestData();
  });

  it('should recover from partial data corruption', async () => {
    await seedTransitionTestData();

    // Delete one year
    const { prisma } = await import('@/lib/db/prisma');
    await prisma.transition_year_data.delete({
      where: { year: 2026 },
    });

    // Try to fetch all years
    const allYears = await getAllTransitionYears();
    expect(allYears.success).toBe(true);
    if (allYears.success) {
      // Should return only 2 years
      expect(allYears.data).toHaveLength(2);
    }

    // Restore missing year
    await seedTransitionTestData();
  });

  it('should handle concurrent updates safely', async () => {
    await seedTransitionTestData();

    // Simulate concurrent updates to different years
    const updates = Promise.all([
      updateTransitionYear({ year: 2025, targetEnrollment: 1800 }, TEST_USER_ID),
      updateTransitionYear({ year: 2026, targetEnrollment: 1900 }, TEST_USER_ID),
      updateTransitionYear({ year: 2027, targetEnrollment: 2000 }, TEST_USER_ID),
    ]);

    const results = await updates;
    results.forEach((result) => {
      expect(result.success).toBe(true);
    });

    // Verify all updates persisted correctly
    const config = await getCompleteTransitionConfig();
    expect(config.success).toBe(true);
    if (config.success) {
      expect(config.data.yearData[0].targetEnrollment).toBe(1800);
      expect(config.data.yearData[1].targetEnrollment).toBe(1900);
      expect(config.data.yearData[2].targetEnrollment).toBe(2000);
    }
  });
});
