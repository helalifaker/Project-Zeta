import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fetchTransitionBaseYear, updateTransitionBaseYear } from '../fetch-base-year';
import { prisma } from '@/lib/db/prisma';
import Decimal from 'decimal.js';

describe('Transition Base Year Service', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.admin_settings.deleteMany();
    await prisma.historical_actuals.deleteMany();
  });

  afterEach(async () => {
    // Clean up after tests
    await prisma.admin_settings.deleteMany();
    await prisma.historical_actuals.deleteMany();
  });

  describe('fetchTransitionBaseYear', () => {
    it('should fetch base year values from admin_settings when present', async () => {
      // Arrange: Create admin_settings with base year values
      await prisma.admin_settings.create({
        data: {
          key: 'general',
          value: {},
          transitionStaffCostBase2024: new Decimal(8000000),
          transitionRentBase2024: new Decimal(2500000),
        },
      });

      // Act
      const result = await fetchTransitionBaseYear();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe('admin_settings');
        expect(result.data.staffCostBase2024?.toNumber()).toBe(8000000);
        expect(result.data.rentBase2024?.toNumber()).toBe(2500000);
      }
    });

    it('should fallback to historical_actuals when admin_settings values are null', async () => {
      // Arrange: Create admin_settings without base year values
      await prisma.admin_settings.create({
        data: {
          key: 'general',
          value: {},
          transitionStaffCostBase2024: null,
          transitionRentBase2024: null,
        },
      });

      // Create historical_actuals for 2024
      await prisma.historical_actuals.create({
        data: {
          versionId: 'test-version-id',
          year: 2024,
          salariesAndRelatedCosts: new Decimal(7500000),
          schoolRent: new Decimal(2400000),
          // Other required fields with default values
          totalRevenues: new Decimal(0),
          otherRevenues: new Decimal(0),
          otherCosts: new Decimal(0),
          ebitda: new Decimal(0),
          depreciation: new Decimal(0),
          interestExpense: new Decimal(0),
          ebt: new Decimal(0),
          zakat: new Decimal(0),
          netIncome: new Decimal(0),
          totalAssets: new Decimal(0),
          totalLiabilities: new Decimal(0),
          totalEquity: new Decimal(0),
          operatingCashFlow: new Decimal(0),
          investingCashFlow: new Decimal(0),
          financingCashFlow: new Decimal(0),
          netCashFlow: new Decimal(0),
        },
      });

      // Act
      const result = await fetchTransitionBaseYear();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe('historical_actuals');
        expect(result.data.staffCostBase2024?.toNumber()).toBe(7500000);
        expect(result.data.rentBase2024?.toNumber()).toBe(2400000);
      }
    });

    it('should return not_found when no data exists', async () => {
      // Act
      const result = await fetchTransitionBaseYear();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe('not_found');
        expect(result.data.staffCostBase2024).toBeNull();
        expect(result.data.rentBase2024).toBeNull();
      }
    });
  });

  describe('updateTransitionBaseYear', () => {
    it('should update base year values in admin_settings', async () => {
      // Arrange: Create admin_settings
      await prisma.admin_settings.create({
        data: {
          key: 'general',
          value: {},
          transitionStaffCostBase2024: new Decimal(8000000),
          transitionRentBase2024: new Decimal(2500000),
        },
      });

      // Act: Update values
      const result = await updateTransitionBaseYear(new Decimal(8500000), new Decimal(2700000));

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.staffCostBase2024?.toNumber()).toBe(8500000);
        expect(result.data.rentBase2024?.toNumber()).toBe(2700000);
      }

      // Verify in database
      const settings = await prisma.admin_settings.findFirst();
      expect(settings?.transitionStaffCostBase2024?.toNumber()).toBe(8500000);
      expect(settings?.transitionRentBase2024?.toNumber()).toBe(2700000);
    });

    it('should create admin_settings if not exists', async () => {
      // Act: Update values when no settings exist
      const result = await updateTransitionBaseYear(new Decimal(8000000), new Decimal(2500000));

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.staffCostBase2024?.toNumber()).toBe(8000000);
        expect(result.data.rentBase2024?.toNumber()).toBe(2500000);
      }

      // Verify in database
      const settings = await prisma.admin_settings.findFirst();
      expect(settings).toBeTruthy();
      expect(settings?.transitionStaffCostBase2024?.toNumber()).toBe(8000000);
      expect(settings?.transitionRentBase2024?.toNumber()).toBe(2700000);
    });

    it('should update only provided values', async () => {
      // Arrange: Create admin_settings with initial values
      await prisma.admin_settings.create({
        data: {
          key: 'general',
          value: {},
          transitionStaffCostBase2024: new Decimal(8000000),
          transitionRentBase2024: new Decimal(2500000),
        },
      });

      // Act: Update only staff cost
      const result = await updateTransitionBaseYear(new Decimal(8200000), undefined);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.staffCostBase2024?.toNumber()).toBe(8200000);
        expect(result.data.rentBase2024?.toNumber()).toBe(2500000); // Unchanged
      }
    });
  });
});
