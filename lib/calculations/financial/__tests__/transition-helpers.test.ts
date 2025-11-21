/**
 * Unit Tests: Transition Helper Functions
 *
 * Tests the enhanced transition period helper functions, focusing on:
 * - getStaffCostBase2024() - Fetches base year staff costs with fallback logic
 * - getRentBase2024() - Fetches base year rent with fallback logic
 *
 * These functions support the new transition calculation approach where:
 * - Staff costs calculated from 2024 base + growth%
 * - Rent calculated from 2024 base + growth%
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { getStaffCostBase2024, getRentBase2024 } from '../transition-helpers';

const prisma = new PrismaClient();

describe('Transition Helper Functions - Base Year 2024 Fetchers', () => {
  const TEST_VERSION_ID = 'test-version-helpers';
  const STAFF_COST_2024 = new Decimal('32000000'); // 32M SAR
  const RENT_2024 = new Decimal('12000000'); // 12M SAR

  beforeEach(async () => {
    // Clean up any existing test data
    await prisma.admin_settings.deleteMany({ where: { key: 'general' } });
    await prisma.historical_actuals.deleteMany({ where: { versionId: TEST_VERSION_ID } });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.admin_settings.deleteMany({ where: { key: 'general' } });
    await prisma.historical_actuals.deleteMany({ where: { versionId: TEST_VERSION_ID } });
  });

  describe('getStaffCostBase2024', () => {
    describe('when admin_settings has transitionStaffCostBase2024', () => {
      it('should fetch from admin_settings as priority source', async () => {
        // Setup: admin_settings with staff cost base
        await prisma.admin_settings.create({
          data: {
            key: 'general',
            transitionStaffCostBase2024: STAFF_COST_2024,
            // Other required fields with defaults
            cpiRate: new Decimal('0.03'),
            discountRate: new Decimal('0.08'),
            zakatRate: new Decimal('0.025'),
          },
        });

        // Act
        const result = await getStaffCostBase2024();

        // Assert
        expect(result).toBeInstanceOf(Decimal);
        expect(result.toNumber()).toBe(STAFF_COST_2024.toNumber());
      });

      it('should use admin_settings even when versionId provided', async () => {
        // Setup: Both admin_settings and historical_actuals exist
        await prisma.admin_settings.create({
          data: {
            key: 'general',
            transitionStaffCostBase2024: STAFF_COST_2024,
            cpiRate: new Decimal('0.03'),
            discountRate: new Decimal('0.08'),
            zakatRate: new Decimal('0.025'),
          },
        });

        // Create historical data with DIFFERENT value
        await prisma.historical_actuals.create({
          data: {
            versionId: TEST_VERSION_ID,
            year: 2024,
            salariesAndRelatedCosts: new Decimal('30000000'), // Different value
            // Other required fields (minimal for test)
            totalRevenues: new Decimal('80000000'),
            schoolRent: RENT_2024,
            netIncome: new Decimal('5000000'),
          },
        });

        // Act
        const result = await getStaffCostBase2024(TEST_VERSION_ID);

        // Assert: Should use admin_settings (32M), not historical (30M)
        expect(result.toNumber()).toBe(STAFF_COST_2024.toNumber());
        expect(result.toNumber()).not.toBe(30000000);
      });
    });

    describe('when admin_settings.transitionStaffCostBase2024 is null', () => {
      it('should fallback to historical_actuals.salariesAndRelatedCosts', async () => {
        // Setup: admin_settings exists but transitionStaffCostBase2024 is null
        await prisma.admin_settings.create({
          data: {
            key: 'general',
            transitionStaffCostBase2024: null, // Explicitly null
            cpiRate: new Decimal('0.03'),
            discountRate: new Decimal('0.08'),
            zakatRate: new Decimal('0.025'),
          },
        });

        // Create historical data
        await prisma.historical_actuals.create({
          data: {
            versionId: TEST_VERSION_ID,
            year: 2024,
            salariesAndRelatedCosts: STAFF_COST_2024,
            totalRevenues: new Decimal('80000000'),
            schoolRent: RENT_2024,
            netIncome: new Decimal('5000000'),
          },
        });

        // Act
        const result = await getStaffCostBase2024(TEST_VERSION_ID);

        // Assert
        expect(result).toBeInstanceOf(Decimal);
        expect(result.toNumber()).toBe(STAFF_COST_2024.toNumber());
      });

      it('should require versionId when falling back to historical_actuals', async () => {
        // Setup: admin_settings is null, no versionId provided
        await prisma.admin_settings.create({
          data: {
            key: 'general',
            transitionStaffCostBase2024: null,
            cpiRate: new Decimal('0.03'),
            discountRate: new Decimal('0.08'),
            zakatRate: new Decimal('0.025'),
          },
        });

        // Act & Assert: Should throw error
        await expect(async () => {
          await getStaffCostBase2024(); // No versionId
        }).rejects.toThrow(
          'Base year 2024 staff costs not found in admin_settings and no versionId provided'
        );
      });
    });

    describe('when no admin_settings record exists', () => {
      it('should fallback to historical_actuals when versionId provided', async () => {
        // Setup: NO admin_settings at all
        await prisma.admin_settings.deleteMany({});

        // Create historical data
        await prisma.historical_actuals.create({
          data: {
            versionId: TEST_VERSION_ID,
            year: 2024,
            salariesAndRelatedCosts: STAFF_COST_2024,
            totalRevenues: new Decimal('80000000'),
            schoolRent: RENT_2024,
            netIncome: new Decimal('5000000'),
          },
        });

        // Act
        const result = await getStaffCostBase2024(TEST_VERSION_ID);

        // Assert
        expect(result.toNumber()).toBe(STAFF_COST_2024.toNumber());
      });

      it('should throw error when no versionId provided', async () => {
        // Setup: NO admin_settings
        await prisma.admin_settings.deleteMany({});

        // Act & Assert
        await expect(async () => {
          await getStaffCostBase2024();
        }).rejects.toThrow('no versionId provided');
      });
    });

    describe('edge cases', () => {
      it('should throw error when neither source has data', async () => {
        // Setup: admin_settings with null, no historical data
        await prisma.admin_settings.create({
          data: {
            key: 'general',
            transitionStaffCostBase2024: null,
            cpiRate: new Decimal('0.03'),
            discountRate: new Decimal('0.08'),
            zakatRate: new Decimal('0.025'),
          },
        });

        // Act & Assert
        await expect(async () => {
          await getStaffCostBase2024(TEST_VERSION_ID);
        }).rejects.toThrow(
          'Base year 2024 staff costs not found in admin_settings or historical_actuals'
        );
      });

      it('should throw error when historical data exists but year is not 2024', async () => {
        // Setup: Only 2023 historical data
        await prisma.historical_actuals.create({
          data: {
            versionId: TEST_VERSION_ID,
            year: 2023, // Wrong year
            salariesAndRelatedCosts: STAFF_COST_2024,
            totalRevenues: new Decimal('80000000'),
            schoolRent: RENT_2024,
            netIncome: new Decimal('5000000'),
          },
        });

        // Act & Assert
        await expect(async () => {
          await getStaffCostBase2024(TEST_VERSION_ID);
        }).rejects.toThrow('Base year 2024 staff costs not found');
      });

      it('should handle very large staff cost values', async () => {
        const largeStaffCost = new Decimal('999999999999'); // ~1 trillion SAR

        await prisma.admin_settings.create({
          data: {
            key: 'general',
            transitionStaffCostBase2024: largeStaffCost,
            cpiRate: new Decimal('0.03'),
            discountRate: new Decimal('0.08'),
            zakatRate: new Decimal('0.025'),
          },
        });

        const result = await getStaffCostBase2024();

        expect(result.toNumber()).toBe(largeStaffCost.toNumber());
        expect(result).toBeInstanceOf(Decimal); // Precision maintained
      });

      it('should handle zero staff cost (edge case)', async () => {
        const zeroStaffCost = new Decimal('0');

        await prisma.admin_settings.create({
          data: {
            key: 'general',
            transitionStaffCostBase2024: zeroStaffCost,
            cpiRate: new Decimal('0.03'),
            discountRate: new Decimal('0.08'),
            zakatRate: new Decimal('0.025'),
          },
        });

        const result = await getStaffCostBase2024();

        expect(result.toNumber()).toBe(0);
      });
    });
  });

  describe('getRentBase2024', () => {
    describe('when admin_settings has transitionRentBase2024', () => {
      it('should fetch from admin_settings as priority source', async () => {
        // Setup
        await prisma.admin_settings.create({
          data: {
            key: 'general',
            transitionRentBase2024: RENT_2024,
            cpiRate: new Decimal('0.03'),
            discountRate: new Decimal('0.08'),
            zakatRate: new Decimal('0.025'),
          },
        });

        // Act
        const result = await getRentBase2024();

        // Assert
        expect(result).toBeInstanceOf(Decimal);
        expect(result.toNumber()).toBe(RENT_2024.toNumber());
      });

      it('should use admin_settings even when versionId provided', async () => {
        // Setup: Both sources exist
        await prisma.admin_settings.create({
          data: {
            key: 'general',
            transitionRentBase2024: RENT_2024,
            cpiRate: new Decimal('0.03'),
            discountRate: new Decimal('0.08'),
            zakatRate: new Decimal('0.025'),
          },
        });

        await prisma.historical_actuals.create({
          data: {
            versionId: TEST_VERSION_ID,
            year: 2024,
            schoolRent: new Decimal('10000000'), // Different value
            salariesAndRelatedCosts: STAFF_COST_2024,
            totalRevenues: new Decimal('80000000'),
            netIncome: new Decimal('5000000'),
          },
        });

        // Act
        const result = await getRentBase2024(TEST_VERSION_ID);

        // Assert: Should use admin_settings (12M), not historical (10M)
        expect(result.toNumber()).toBe(RENT_2024.toNumber());
        expect(result.toNumber()).not.toBe(10000000);
      });
    });

    describe('when admin_settings.transitionRentBase2024 is null', () => {
      it('should fallback to historical_actuals.schoolRent', async () => {
        // Setup
        await prisma.admin_settings.create({
          data: {
            key: 'general',
            transitionRentBase2024: null,
            cpiRate: new Decimal('0.03'),
            discountRate: new Decimal('0.08'),
            zakatRate: new Decimal('0.025'),
          },
        });

        await prisma.historical_actuals.create({
          data: {
            versionId: TEST_VERSION_ID,
            year: 2024,
            schoolRent: RENT_2024,
            salariesAndRelatedCosts: STAFF_COST_2024,
            totalRevenues: new Decimal('80000000'),
            netIncome: new Decimal('5000000'),
          },
        });

        // Act
        const result = await getRentBase2024(TEST_VERSION_ID);

        // Assert
        expect(result.toNumber()).toBe(RENT_2024.toNumber());
      });

      it('should require versionId when falling back', async () => {
        // Setup
        await prisma.admin_settings.create({
          data: {
            key: 'general',
            transitionRentBase2024: null,
            cpiRate: new Decimal('0.03'),
            discountRate: new Decimal('0.08'),
            zakatRate: new Decimal('0.025'),
          },
        });

        // Act & Assert
        await expect(async () => {
          await getRentBase2024(); // No versionId
        }).rejects.toThrow(
          'Base year 2024 rent not found in admin_settings and no versionId provided'
        );
      });
    });

    describe('when no admin_settings record exists', () => {
      it('should fallback to historical_actuals', async () => {
        // Setup
        await prisma.admin_settings.deleteMany({});

        await prisma.historical_actuals.create({
          data: {
            versionId: TEST_VERSION_ID,
            year: 2024,
            schoolRent: RENT_2024,
            salariesAndRelatedCosts: STAFF_COST_2024,
            totalRevenues: new Decimal('80000000'),
            netIncome: new Decimal('5000000'),
          },
        });

        // Act
        const result = await getRentBase2024(TEST_VERSION_ID);

        // Assert
        expect(result.toNumber()).toBe(RENT_2024.toNumber());
      });

      it('should throw error when no versionId provided', async () => {
        await prisma.admin_settings.deleteMany({});

        await expect(async () => {
          await getRentBase2024();
        }).rejects.toThrow('no versionId provided');
      });
    });

    describe('edge cases', () => {
      it('should throw error when neither source has data', async () => {
        // Setup
        await prisma.admin_settings.create({
          data: {
            key: 'general',
            transitionRentBase2024: null,
            cpiRate: new Decimal('0.03'),
            discountRate: new Decimal('0.08'),
            zakatRate: new Decimal('0.025'),
          },
        });

        // Act & Assert
        await expect(async () => {
          await getRentBase2024(TEST_VERSION_ID);
        }).rejects.toThrow('Base year 2024 rent not found in admin_settings or historical_actuals');
      });

      it('should throw error when only 2023 historical data exists', async () => {
        await prisma.historical_actuals.create({
          data: {
            versionId: TEST_VERSION_ID,
            year: 2023,
            schoolRent: RENT_2024,
            salariesAndRelatedCosts: STAFF_COST_2024,
            totalRevenues: new Decimal('80000000'),
            netIncome: new Decimal('5000000'),
          },
        });

        await expect(async () => {
          await getRentBase2024(TEST_VERSION_ID);
        }).rejects.toThrow('Base year 2024 rent not found');
      });

      it('should handle very large rent values', async () => {
        const largeRent = new Decimal('500000000000'); // 500B SAR

        await prisma.admin_settings.create({
          data: {
            key: 'general',
            transitionRentBase2024: largeRent,
            cpiRate: new Decimal('0.03'),
            discountRate: new Decimal('0.08'),
            zakatRate: new Decimal('0.025'),
          },
        });

        const result = await getRentBase2024();

        expect(result.toNumber()).toBe(largeRent.toNumber());
        expect(result).toBeInstanceOf(Decimal);
      });

      it('should handle zero rent (edge case)', async () => {
        const zeroRent = new Decimal('0');

        await prisma.admin_settings.create({
          data: {
            key: 'general',
            transitionRentBase2024: zeroRent,
            cpiRate: new Decimal('0.03'),
            discountRate: new Decimal('0.08'),
            zakatRate: new Decimal('0.025'),
          },
        });

        const result = await getRentBase2024();

        expect(result.toNumber()).toBe(0);
      });
    });
  });

  describe('Combined scenarios', () => {
    it('should fetch both staff cost and rent from same admin_settings', async () => {
      // Setup
      await prisma.admin_settings.create({
        data: {
          key: 'general',
          transitionStaffCostBase2024: STAFF_COST_2024,
          transitionRentBase2024: RENT_2024,
          cpiRate: new Decimal('0.03'),
          discountRate: new Decimal('0.08'),
          zakatRate: new Decimal('0.025'),
        },
      });

      // Act
      const staffCost = await getStaffCostBase2024();
      const rent = await getRentBase2024();

      // Assert
      expect(staffCost.toNumber()).toBe(STAFF_COST_2024.toNumber());
      expect(rent.toNumber()).toBe(RENT_2024.toNumber());
    });

    it('should fetch staff from admin_settings and rent from historical', async () => {
      // Setup: Mixed sources
      await prisma.admin_settings.create({
        data: {
          key: 'general',
          transitionStaffCostBase2024: STAFF_COST_2024,
          transitionRentBase2024: null, // Null - will fallback
          cpiRate: new Decimal('0.03'),
          discountRate: new Decimal('0.08'),
          zakatRate: new Decimal('0.025'),
        },
      });

      await prisma.historical_actuals.create({
        data: {
          versionId: TEST_VERSION_ID,
          year: 2024,
          schoolRent: RENT_2024,
          salariesAndRelatedCosts: new Decimal('99999999'), // Different - won't be used
          totalRevenues: new Decimal('80000000'),
          netIncome: new Decimal('5000000'),
        },
      });

      // Act
      const staffCost = await getStaffCostBase2024(TEST_VERSION_ID);
      const rent = await getRentBase2024(TEST_VERSION_ID);

      // Assert
      expect(staffCost.toNumber()).toBe(STAFF_COST_2024.toNumber()); // From admin_settings
      expect(rent.toNumber()).toBe(RENT_2024.toNumber()); // From historical_actuals
    });

    it('should fetch both from historical when admin_settings has nulls', async () => {
      // Setup
      await prisma.admin_settings.create({
        data: {
          key: 'general',
          transitionStaffCostBase2024: null,
          transitionRentBase2024: null,
          cpiRate: new Decimal('0.03'),
          discountRate: new Decimal('0.08'),
          zakatRate: new Decimal('0.025'),
        },
      });

      await prisma.historical_actuals.create({
        data: {
          versionId: TEST_VERSION_ID,
          year: 2024,
          schoolRent: RENT_2024,
          salariesAndRelatedCosts: STAFF_COST_2024,
          totalRevenues: new Decimal('80000000'),
          netIncome: new Decimal('5000000'),
        },
      });

      // Act
      const staffCost = await getStaffCostBase2024(TEST_VERSION_ID);
      const rent = await getRentBase2024(TEST_VERSION_ID);

      // Assert
      expect(staffCost.toNumber()).toBe(STAFF_COST_2024.toNumber());
      expect(rent.toNumber()).toBe(RENT_2024.toNumber());
    });
  });
});
