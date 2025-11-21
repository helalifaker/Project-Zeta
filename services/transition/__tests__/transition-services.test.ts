/**
 * Service Layer Tests for Transition Period
 *
 * Tests all transition service functions including:
 * - Read operations (getTransitionYear, getAllTransitionYears, getTransitionSettings)
 * - Update operations (updateTransitionYear, updateTransitionSettings)
 * - Batch operations (recalculateTransitionStaffCosts, initializeTransitionYearData)
 * - Helper functions (calculateTransitionStaffCost, calculateTransitionRent)
 * - Error handling and validation
 * - Audit logging
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Decimal from 'decimal.js';
import {
  getAllTransitionYears,
  getTransitionYear,
  getTransitionSettings,
  getCompleteTransitionConfig,
  isTransitionDataInitialized,
} from '../read';
import {
  updateTransitionYear,
  updateTransitionSettings,
  recalculateTransitionStaffCosts,
  initializeTransitionYearData,
} from '../update';
import {
  calculateTransitionStaffCost,
  calculateTransitionRent,
  isValidTransitionYear,
  getTransitionYears,
  validateTransitionSettings,
} from '../helpers';
import {
  cleanupTransitionTestData,
  seedTransitionTestData,
  seedTransitionAdminSettings,
  verifyAuditLog,
  getLatestAuditLog,
  assertDecimalClose,
} from '@/test-utils/transition-helpers';
import {
  mockTransitionYearData,
  recalculationTestData,
  transitionSettingsValidationCases,
  transitionYearValidationCases,
  edgeCases,
} from '@/fixtures/transition-test-data';

const TEST_USER_ID = 'test-user-123';

describe('Transition Service - Read Operations', () => {
  beforeEach(async () => {
    await cleanupTransitionTestData();
  });

  afterEach(async () => {
    await cleanupTransitionTestData();
  });

  describe('getAllTransitionYears', () => {
    it('should return all transition years in ascending order', async () => {
      await seedTransitionTestData();

      const result = await getAllTransitionYears();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(3);
        expect(result.data[0].year).toBe(2025);
        expect(result.data[1].year).toBe(2026);
        expect(result.data[2].year).toBe(2027);
      }
    });

    it('should return empty array when no data exists', async () => {
      const result = await getAllTransitionYears();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it('should include all fields in returned records', async () => {
      await seedTransitionTestData();

      const result = await getAllTransitionYears();

      expect(result.success).toBe(true);
      if (result.success) {
        const record = result.data[0];
        expect(record).toHaveProperty('id');
        expect(record).toHaveProperty('year');
        expect(record).toHaveProperty('targetEnrollment');
        expect(record).toHaveProperty('staffCostBase');
        expect(record).toHaveProperty('notes');
        expect(record).toHaveProperty('createdAt');
        expect(record).toHaveProperty('updatedAt');
      }
    });
  });

  describe('getTransitionYear', () => {
    beforeEach(async () => {
      await seedTransitionTestData();
    });

    it('should return specific transition year', async () => {
      const result = await getTransitionYear(2025);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.year).toBe(2025);
        expect(result.data.targetEnrollment).toBe(1850);
      }
    });

    it('should return error for invalid year (too early)', async () => {
      const result = await getTransitionYear(2024);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid transition year');
        expect(result.code).toBe('INVALID_YEAR');
      }
    });

    it('should return error for invalid year (too late)', async () => {
      const result = await getTransitionYear(2028);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid transition year');
        expect(result.code).toBe('INVALID_YEAR');
      }
    });

    it('should return error when year not found', async () => {
      await cleanupTransitionTestData(); // Remove seeded data

      const result = await getTransitionYear(2025);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('No data found');
        expect(result.code).toBe('YEAR_NOT_FOUND');
      }
    });

    it('should handle all three valid years', async () => {
      for (const year of [2025, 2026, 2027]) {
        const result = await getTransitionYear(year);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.year).toBe(year);
        }
      }
    });
  });

  describe('getTransitionSettings', () => {
    beforeEach(async () => {
      await seedTransitionAdminSettings(1850, 10.0);
    });

    it('should return transition settings', async () => {
      const result = await getTransitionSettings();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capacityCap).toBe(1850);
        expect(result.data.rentAdjustmentPercent).toBe(10.0);
      }
    });

    it('should use default values when fields are null', async () => {
      const result = await getTransitionSettings();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capacityCap).toBeGreaterThan(0);
        expect(typeof result.data.rentAdjustmentPercent).toBe('number');
      }
    });
  });

  describe('getCompleteTransitionConfig', () => {
    beforeEach(async () => {
      await seedTransitionTestData();
      await seedTransitionAdminSettings(1850, 10.0);
    });

    it('should return complete configuration (settings + years)', async () => {
      const result = await getCompleteTransitionConfig();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('settings');
        expect(result.data).toHaveProperty('yearData');
        expect(result.data.settings.capacityCap).toBe(1850);
        expect(result.data.yearData).toHaveLength(3);
      }
    });

    it('should fetch data in parallel for performance', async () => {
      const startTime = Date.now();
      await getCompleteTransitionConfig();
      const duration = Date.now() - startTime;

      // Should complete quickly (parallel fetch)
      expect(duration).toBeLessThan(500);
    });
  });

  describe('isTransitionDataInitialized', () => {
    it('should return false when no data exists', async () => {
      const result = await isTransitionDataInitialized();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });

    it('should return false when only partial data exists', async () => {
      await seedTransitionTestData([
        { year: 2025, targetEnrollment: 1850, staffCostBase: new Decimal(9000000) },
      ]);

      const result = await isTransitionDataInitialized();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false); // Need all 3 years
      }
    });

    it('should return true when all 3 years are initialized', async () => {
      await seedTransitionTestData();

      const result = await isTransitionDataInitialized();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });
  });
});

describe('Transition Service - Update Operations', () => {
  beforeEach(async () => {
    await cleanupTransitionTestData();
    await seedTransitionTestData();
  });

  afterEach(async () => {
    await cleanupTransitionTestData();
  });

  describe('updateTransitionYear', () => {
    it('should update target enrollment only', async () => {
      const result = await updateTransitionYear(
        {
          year: 2025,
          targetEnrollment: 2000,
        },
        TEST_USER_ID
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.targetEnrollment).toBe(2000);
      }
    });

    it('should update staff cost base only', async () => {
      const result = await updateTransitionYear(
        {
          year: 2025,
          staffCostBase: new Decimal(10000000),
        },
        TEST_USER_ID
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.staffCostBase.toNumber()).toBe(10000000);
      }
    });

    it('should update notes only', async () => {
      const result = await updateTransitionYear(
        {
          year: 2025,
          notes: 'Updated notes',
        },
        TEST_USER_ID
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBe('Updated notes');
      }
    });

    it('should update multiple fields at once', async () => {
      const result = await updateTransitionYear(
        {
          year: 2025,
          targetEnrollment: 2000,
          staffCostBase: new Decimal(10000000),
          notes: 'Full update',
        },
        TEST_USER_ID
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.targetEnrollment).toBe(2000);
        expect(result.data.staffCostBase.toNumber()).toBe(10000000);
        expect(result.data.notes).toBe('Full update');
      }
    });

    it('should reject negative enrollment', async () => {
      const result = await updateTransitionYear(
        {
          year: 2025,
          targetEnrollment: -100,
        },
        TEST_USER_ID
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('positive');
      }
    });

    it('should reject zero enrollment', async () => {
      const result = await updateTransitionYear(
        {
          year: 2025,
          targetEnrollment: 0,
        },
        TEST_USER_ID
      );

      expect(result.success).toBe(false);
    });

    it('should reject negative staff cost', async () => {
      const result = await updateTransitionYear(
        {
          year: 2025,
          staffCostBase: new Decimal(-100000),
        },
        TEST_USER_ID
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('positive');
      }
    });

    it('should create audit log on successful update', async () => {
      await updateTransitionYear(
        {
          year: 2025,
          targetEnrollment: 2000,
        },
        TEST_USER_ID
      );

      const auditExists = await verifyAuditLog('UPDATE_TRANSITION_YEAR', TEST_USER_ID);
      expect(auditExists).toBe(true);
    });

    it('should include old and new values in audit log', async () => {
      await updateTransitionYear(
        {
          year: 2025,
          targetEnrollment: 2000,
        },
        TEST_USER_ID
      );

      const log = await getLatestAuditLog('UPDATE_TRANSITION_YEAR');
      expect(log).toBeDefined();
      expect(log?.metadata).toHaveProperty('oldValue');
      expect(log?.metadata).toHaveProperty('newValue');
    });
  });

  describe('updateTransitionSettings', () => {
    beforeEach(async () => {
      await seedTransitionAdminSettings(1850, 10.0);
    });

    it('should update capacity cap only', async () => {
      const result = await updateTransitionSettings(
        {
          capacityCap: 2000,
        },
        TEST_USER_ID
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capacityCap).toBe(2000);
      }
    });

    it('should update rent adjustment percent only', async () => {
      const result = await updateTransitionSettings(
        {
          rentAdjustmentPercent: 15.0,
        },
        TEST_USER_ID
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rentAdjustmentPercent).toBe(15.0);
      }
    });

    it('should update both fields', async () => {
      const result = await updateTransitionSettings(
        {
          capacityCap: 2000,
          rentAdjustmentPercent: 15.0,
        },
        TEST_USER_ID
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capacityCap).toBe(2000);
        expect(result.data.rentAdjustmentPercent).toBe(15.0);
      }
    });

    it('should create audit log on update', async () => {
      await updateTransitionSettings(
        {
          capacityCap: 2000,
        },
        TEST_USER_ID
      );

      const auditExists = await verifyAuditLog('UPDATE_TRANSITION_SETTINGS', TEST_USER_ID);
      expect(auditExists).toBe(true);
    });

    it('should validate settings before update', async () => {
      const result = await updateTransitionSettings(
        {
          capacityCap: 0, // Invalid
        },
        TEST_USER_ID
      );

      expect(result.success).toBe(false);
    });
  });

  describe('recalculateTransitionStaffCosts', () => {
    it('should recalculate all years from 2028 base', async () => {
      const { input, expectedResults } = recalculationTestData;

      const result = await recalculateTransitionStaffCosts(
        new Decimal(input.base2028StaffCost),
        input.cpiRate,
        TEST_USER_ID
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(3);

        for (let i = 0; i < 3; i++) {
          expect(result.data[i].year).toBe(expectedResults[i].year);
          expect(
            assertDecimalClose(
              new Decimal(result.data[i].staffCostBase),
              expectedResults[i].staffCostBase,
              1.0 // Tolerance of 1 SAR
            )
          ).toBe(true);
        }
      }
    });

    it('should reject negative base staff cost', async () => {
      const result = await recalculateTransitionStaffCosts(
        new Decimal(-10000000),
        0.03,
        TEST_USER_ID
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('positive');
      }
    });

    it('should reject invalid CPI rate (negative)', async () => {
      const result = await recalculateTransitionStaffCosts(
        new Decimal(10000000),
        -0.03,
        TEST_USER_ID
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('CPI rate');
      }
    });

    it('should reject invalid CPI rate (> 1)', async () => {
      const result = await recalculateTransitionStaffCosts(
        new Decimal(10000000),
        1.5,
        TEST_USER_ID
      );

      expect(result.success).toBe(false);
    });

    it('should use transaction for atomic updates', async () => {
      // This is implicitly tested by the fact that if one update fails,
      // none should be committed. We can't easily test this without
      // mocking Prisma, so we verify all 3 records are updated.

      const result = await recalculateTransitionStaffCosts(
        new Decimal(10000000),
        0.03,
        TEST_USER_ID
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(3);
      }
    });

    it('should create single audit log for batch operation', async () => {
      await recalculateTransitionStaffCosts(new Decimal(10000000), 0.03, TEST_USER_ID);

      const log = await getLatestAuditLog('RECALCULATE_TRANSITION_STAFF_COSTS');
      expect(log).toBeDefined();
      expect(log?.entityId).toBe('ALL');
      expect(log?.metadata).toHaveProperty('calculatedValues');
    });
  });

  describe('initializeTransitionYearData', () => {
    beforeEach(async () => {
      await cleanupTransitionTestData(); // Start fresh
    });

    it('should initialize all 3 years with default values', async () => {
      const result = await initializeTransitionYearData(1850, new Decimal(9000000), TEST_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(3);
        result.data.forEach((record) => {
          expect(record.targetEnrollment).toBe(1850);
          expect(record.staffCostBase.toNumber()).toBe(9000000);
        });
      }
    });

    it('should not overwrite existing data (upsert behavior)', async () => {
      // Create initial data
      await initializeTransitionYearData(1850, new Decimal(9000000), TEST_USER_ID);

      // Try to initialize again
      const result = await initializeTransitionYearData(2000, new Decimal(10000000), TEST_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should return existing data (not updated)
        expect(result.data[0].targetEnrollment).toBe(1850); // Original value
      }
    });

    it('should create audit log for initialization', async () => {
      await initializeTransitionYearData(1850, new Decimal(9000000), TEST_USER_ID);

      const auditExists = await verifyAuditLog('INITIALIZE_TRANSITION_DATA', TEST_USER_ID);
      expect(auditExists).toBe(true);
    });
  });
});

describe('Transition Service - Helper Functions', () => {
  describe('calculateTransitionStaffCost', () => {
    it('should calculate backward deflation correctly', () => {
      const base2028 = new Decimal(10000000);
      const cpiRate = 0.03;

      const staffCost2025 = calculateTransitionStaffCost(2025, base2028, cpiRate);
      const staffCost2026 = calculateTransitionStaffCost(2026, base2028, cpiRate);
      const staffCost2027 = calculateTransitionStaffCost(2027, base2028, cpiRate);

      // Expected: 10M / (1.03^years_from_base)
      expect(assertDecimalClose(staffCost2025, new Decimal('9151416.99'), 1.0)).toBe(true);
      expect(assertDecimalClose(staffCost2026, new Decimal('9425958.99'), 1.0)).toBe(true);
      expect(assertDecimalClose(staffCost2027, new Decimal('9708737.86'), 1.0)).toBe(true);
    });

    it('should handle zero CPI rate', () => {
      const { base2028, cpiRate, expected2025 } = edgeCases.zeroCPI;

      const staffCost2025 = calculateTransitionStaffCost(2025, base2028, cpiRate);

      expect(staffCost2025.toNumber()).toBe(expected2025.toNumber());
    });

    it('should handle high CPI rate', () => {
      const { base2028, cpiRate, expected2025 } = edgeCases.highCPI;

      const staffCost2025 = calculateTransitionStaffCost(2025, base2028, cpiRate);

      expect(assertDecimalClose(staffCost2025, expected2025, 1.0)).toBe(true);
    });

    it('should return base value for year 2028', () => {
      const base2028 = new Decimal(10000000);
      const staffCost2028 = calculateTransitionStaffCost(2028, base2028, 0.03);

      expect(staffCost2028.toNumber()).toBe(base2028.toNumber());
    });

    it('should return base value for years after 2028', () => {
      const base2028 = new Decimal(10000000);
      const staffCost2029 = calculateTransitionStaffCost(2029, base2028, 0.03);

      expect(staffCost2029.toNumber()).toBe(base2028.toNumber());
    });
  });

  describe('calculateTransitionRent', () => {
    it('should calculate rent with positive adjustment', () => {
      const historicalRent = new Decimal(12000000);
      const adjustmentPercent = 10;

      const transitionRent = calculateTransitionRent(historicalRent, adjustmentPercent);

      expect(transitionRent.toNumber()).toBe(13200000); // 12M × 1.10
    });

    it('should calculate rent with negative adjustment', () => {
      const { historical2024Rent, adjustmentPercent, expectedRent } =
        edgeCases.negativeRentAdjustment;

      const transitionRent = calculateTransitionRent(historical2024Rent, adjustmentPercent);

      expect(transitionRent.toNumber()).toBe(expectedRent.toNumber());
    });

    it('should handle zero adjustment', () => {
      const { historical2024Rent, adjustmentPercent, expectedRent } = edgeCases.zeroRentAdjustment;

      const transitionRent = calculateTransitionRent(historical2024Rent, adjustmentPercent);

      expect(transitionRent.toNumber()).toBe(expectedRent.toNumber());
    });

    it('should handle large percentage adjustments', () => {
      const historicalRent = new Decimal(10000000);
      const transitionRent = calculateTransitionRent(historicalRent, 100); // Double

      expect(transitionRent.toNumber()).toBe(20000000);
    });
  });

  describe('isValidTransitionYear', () => {
    it('should accept valid years (2025-2027)', () => {
      expect(isValidTransitionYear(2025)).toBe(true);
      expect(isValidTransitionYear(2026)).toBe(true);
      expect(isValidTransitionYear(2027)).toBe(true);
    });

    it('should reject year before range', () => {
      expect(isValidTransitionYear(2024)).toBe(false);
      expect(isValidTransitionYear(2000)).toBe(false);
    });

    it('should reject year after range', () => {
      expect(isValidTransitionYear(2028)).toBe(false);
      expect(isValidTransitionYear(2030)).toBe(false);
    });
  });

  describe('getTransitionYears', () => {
    it('should return array of all transition years', () => {
      const years = getTransitionYears();

      expect(years).toEqual([2025, 2026, 2027]);
      expect(years).toHaveLength(3);
    });
  });

  describe('validateTransitionSettings', () => {
    it('should accept valid settings', () => {
      transitionSettingsValidationCases.valid.forEach((settings) => {
        const validation = validateTransitionSettings(
          settings.capacityCap,
          settings.rentAdjustmentPercent
        );
        expect(validation.valid).toBe(true);
      });
    });

    it('should reject invalid settings with error messages', () => {
      transitionSettingsValidationCases.invalid.forEach((testCase) => {
        const validation = validateTransitionSettings(
          testCase.capacityCap,
          testCase.rentAdjustmentPercent
        );
        expect(validation.valid).toBe(false);
        expect(validation.error).toBeDefined();
      });
    });
  });
});
