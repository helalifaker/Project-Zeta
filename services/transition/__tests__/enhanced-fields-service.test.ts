/**
 * Service Layer Tests: Enhanced Transition Fields
 *
 * Tests transition service functions with new fields:
 * - updateTransitionYear() with new fields
 * - getCompleteTransitionConfig() includes new fields and base year values
 * - Validation of new field ranges
 * - Audit logging for new fields
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import {
  updateTransitionYear,
  type UpdateTransitionYearInput,
  updateTransitionSettings,
  type UpdateTransitionSettingsInput,
} from '../update';
import { getCompleteTransitionConfig } from '../read';

const prisma = new PrismaClient();
const TEST_USER_ID = 'test-service-user';

describe('Transition Service - Enhanced Fields', () => {
  beforeEach(async () => {
    // Clean up
    await prisma.transition_year_data.deleteMany({});
    await prisma.admin_settings.deleteMany({ where: { key: 'general' } });
    await prisma.audit_logs.deleteMany({});

    // Seed admin settings
    await prisma.admin_settings.create({
      data: {
        key: 'general',
        cpiRate: new Decimal('0.03'),
        discountRate: new Decimal('0.08'),
        zakatRate: new Decimal('0.025'),
        transitionCapacityCap: 1850,
        transitionRentAdjustmentPercent: new Decimal('10.0'),
        transitionStaffCostBase2024: new Decimal('32000000'),
        transitionRentBase2024: new Decimal('12000000'),
      },
    });

    // Seed transition year data
    await prisma.transition_year_data.createMany({
      data: [
        {
          year: 2025,
          targetEnrollment: 1800,
          staffCostBase: new Decimal('33000000'),
          averageTuitionPerStudent: new Decimal('50000'),
          otherRevenue: new Decimal('2000000'),
          staffCostGrowthPercent: new Decimal('5.0'),
          rentGrowthPercent: new Decimal('10.0'),
          notes: 'Initial 2025',
        },
        {
          year: 2026,
          targetEnrollment: 1850,
          staffCostBase: new Decimal('34000000'),
          averageTuitionPerStudent: new Decimal('51500'),
          otherRevenue: new Decimal('2100000'),
          staffCostGrowthPercent: new Decimal('8.0'),
          rentGrowthPercent: new Decimal('15.0'),
          notes: 'Initial 2026',
        },
        {
          year: 2027,
          targetEnrollment: 1850,
          staffCostBase: new Decimal('35000000'),
          averageTuitionPerStudent: new Decimal('53000'),
          otherRevenue: new Decimal('2200000'),
          staffCostGrowthPercent: new Decimal('10.0'),
          rentGrowthPercent: new Decimal('18.0'),
          notes: 'Initial 2027',
        },
      ],
    });
  });

  afterEach(async () => {
    await prisma.transition_year_data.deleteMany({});
    await prisma.admin_settings.deleteMany({ where: { key: 'general' } });
    await prisma.audit_logs.deleteMany({});
  });

  describe('updateTransitionYear - New Fields', () => {
    describe('averageTuitionPerStudent', () => {
      it('should update averageTuitionPerStudent successfully', async () => {
        const input: UpdateTransitionYearInput = {
          year: 2025,
          averageTuitionPerStudent: new Decimal('60000'),
        };

        const result = await updateTransitionYear(input, TEST_USER_ID);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.averageTuitionPerStudent?.toNumber()).toBe(60000);
        }
      });

      it('should reject zero averageTuitionPerStudent', async () => {
        const input: UpdateTransitionYearInput = {
          year: 2025,
          averageTuitionPerStudent: new Decimal('0'),
        };

        const result = await updateTransitionYear(input, TEST_USER_ID);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('positive');
          expect(result.code).toBe('INVALID_TUITION');
        }
      });

      it('should reject negative averageTuitionPerStudent', async () => {
        const input: UpdateTransitionYearInput = {
          year: 2025,
          averageTuitionPerStudent: new Decimal('-5000'),
        };

        const result = await updateTransitionYear(input, TEST_USER_ID);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('positive');
          expect(result.code).toBe('INVALID_TUITION');
        }
      });

      it('should handle very large tuition values', async () => {
        const input: UpdateTransitionYearInput = {
          year: 2025,
          averageTuitionPerStudent: new Decimal('9999999'),
        };

        const result = await updateTransitionYear(input, TEST_USER_ID);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.averageTuitionPerStudent?.toNumber()).toBe(9999999);
        }
      });

      it('should maintain decimal precision', async () => {
        const input: UpdateTransitionYearInput = {
          year: 2025,
          averageTuitionPerStudent: new Decimal('50123.45'),
        };

        const result = await updateTransitionYear(input, TEST_USER_ID);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.averageTuitionPerStudent).toBeInstanceOf(Decimal);
          expect(result.data.averageTuitionPerStudent?.toNumber()).toBeCloseTo(50123.45, 2);
        }
      });
    });

    describe('otherRevenue', () => {
      it('should update otherRevenue successfully', async () => {
        const input: UpdateTransitionYearInput = {
          year: 2025,
          otherRevenue: new Decimal('3500000'),
        };

        const result = await updateTransitionYear(input, TEST_USER_ID);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.otherRevenue?.toNumber()).toBe(3500000);
        }
      });

      it('should accept zero otherRevenue', async () => {
        const input: UpdateTransitionYearInput = {
          year: 2025,
          otherRevenue: new Decimal('0'),
        };

        const result = await updateTransitionYear(input, TEST_USER_ID);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.otherRevenue?.toNumber()).toBe(0);
        }
      });

      it('should reject negative otherRevenue', async () => {
        const input: UpdateTransitionYearInput = {
          year: 2025,
          otherRevenue: new Decimal('-1000000'),
        };

        const result = await updateTransitionYear(input, TEST_USER_ID);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('cannot be negative');
          expect(result.code).toBe('INVALID_OTHER_REVENUE');
        }
      });

      it('should handle very large other revenue values', async () => {
        const input: UpdateTransitionYearInput = {
          year: 2025,
          otherRevenue: new Decimal('999999999999'),
        };

        const result = await updateTransitionYear(input, TEST_USER_ID);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.otherRevenue?.toNumber()).toBe(999999999999);
        }
      });
    });

    describe('staffCostGrowthPercent', () => {
      it('should update staffCostGrowthPercent successfully', async () => {
        const input: UpdateTransitionYearInput = {
          year: 2025,
          staffCostGrowthPercent: new Decimal('7.5'),
        };

        const result = await updateTransitionYear(input, TEST_USER_ID);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.staffCostGrowthPercent?.toNumber()).toBeCloseTo(7.5, 1);
        }
      });

      it('should accept negative growth (cost reduction)', async () => {
        const input: UpdateTransitionYearInput = {
          year: 2025,
          staffCostGrowthPercent: new Decimal('-10.0'),
        };

        const result = await updateTransitionYear(input, TEST_USER_ID);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.staffCostGrowthPercent?.toNumber()).toBeCloseTo(-10.0, 1);
        }
      });

      it('should accept zero growth', async () => {
        const input: UpdateTransitionYearInput = {
          year: 2025,
          staffCostGrowthPercent: new Decimal('0.0'),
        };

        const result = await updateTransitionYear(input, TEST_USER_ID);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.staffCostGrowthPercent?.toNumber()).toBe(0);
        }
      });

      it('should accept boundary value -50%', async () => {
        const input: UpdateTransitionYearInput = {
          year: 2025,
          staffCostGrowthPercent: new Decimal('-50.0'),
        };

        const result = await updateTransitionYear(input, TEST_USER_ID);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.staffCostGrowthPercent?.toNumber()).toBe(-50.0);
        }
      });

      it('should accept boundary value 200%', async () => {
        const input: UpdateTransitionYearInput = {
          year: 2025,
          staffCostGrowthPercent: new Decimal('200.0'),
        };

        const result = await updateTransitionYear(input, TEST_USER_ID);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.staffCostGrowthPercent?.toNumber()).toBe(200.0);
        }
      });

      it('should reject value below -50%', async () => {
        const input: UpdateTransitionYearInput = {
          year: 2025,
          staffCostGrowthPercent: new Decimal('-50.1'),
        };

        const result = await updateTransitionYear(input, TEST_USER_ID);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('between -50 and 200');
          expect(result.code).toBe('INVALID_STAFF_GROWTH');
        }
      });

      it('should reject value above 200%', async () => {
        const input: UpdateTransitionYearInput = {
          year: 2025,
          staffCostGrowthPercent: new Decimal('200.1'),
        };

        const result = await updateTransitionYear(input, TEST_USER_ID);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('between -50 and 200');
          expect(result.code).toBe('INVALID_STAFF_GROWTH');
        }
      });

      it('should handle decimal precision', async () => {
        const input: UpdateTransitionYearInput = {
          year: 2025,
          staffCostGrowthPercent: new Decimal('7.3333'),
        };

        const result = await updateTransitionYear(input, TEST_USER_ID);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.staffCostGrowthPercent).toBeInstanceOf(Decimal);
          expect(result.data.staffCostGrowthPercent?.toNumber()).toBeCloseTo(7.3333, 4);
        }
      });
    });

    describe('rentGrowthPercent', () => {
      it('should update rentGrowthPercent successfully', async () => {
        const input: UpdateTransitionYearInput = {
          year: 2025,
          rentGrowthPercent: new Decimal('12.5'),
        };

        const result = await updateTransitionYear(input, TEST_USER_ID);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.rentGrowthPercent?.toNumber()).toBeCloseTo(12.5, 1);
        }
      });

      it('should accept negative rent growth', async () => {
        const input: UpdateTransitionYearInput = {
          year: 2025,
          rentGrowthPercent: new Decimal('-20.0'),
        };

        const result = await updateTransitionYear(input, TEST_USER_ID);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.rentGrowthPercent?.toNumber()).toBeCloseTo(-20.0, 1);
        }
      });

      it('should validate range (-50% to 200%)', async () => {
        // Below range
        const input1: UpdateTransitionYearInput = {
          year: 2025,
          rentGrowthPercent: new Decimal('-51.0'),
        };
        const result1 = await updateTransitionYear(input1, TEST_USER_ID);
        expect(result1.success).toBe(false);

        // Above range
        const input2: UpdateTransitionYearInput = {
          year: 2025,
          rentGrowthPercent: new Decimal('201.0'),
        };
        const result2 = await updateTransitionYear(input2, TEST_USER_ID);
        expect(result2.success).toBe(false);

        // Within range
        const input3: UpdateTransitionYearInput = {
          year: 2025,
          rentGrowthPercent: new Decimal('15.0'),
        };
        const result3 = await updateTransitionYear(input3, TEST_USER_ID);
        expect(result3.success).toBe(true);
      });
    });

    describe('Multiple fields update', () => {
      it('should update all new fields simultaneously', async () => {
        const input: UpdateTransitionYearInput = {
          year: 2025,
          averageTuitionPerStudent: new Decimal('65000'),
          otherRevenue: new Decimal('4000000'),
          staffCostGrowthPercent: new Decimal('12.0'),
          rentGrowthPercent: new Decimal('18.0'),
        };

        const result = await updateTransitionYear(input, TEST_USER_ID);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.averageTuitionPerStudent?.toNumber()).toBe(65000);
          expect(result.data.otherRevenue?.toNumber()).toBe(4000000);
          expect(result.data.staffCostGrowthPercent?.toNumber()).toBeCloseTo(12.0, 1);
          expect(result.data.rentGrowthPercent?.toNumber()).toBeCloseTo(18.0, 1);
        }
      });

      it('should update mix of old and new fields', async () => {
        const input: UpdateTransitionYearInput = {
          year: 2025,
          targetEnrollment: 2000, // Old field
          averageTuitionPerStudent: new Decimal('55000'), // New field
          notes: 'Mixed update', // Old field
          staffCostGrowthPercent: new Decimal('6.0'), // New field
        };

        const result = await updateTransitionYear(input, TEST_USER_ID);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.targetEnrollment).toBe(2000);
          expect(result.data.averageTuitionPerStudent?.toNumber()).toBe(55000);
          expect(result.data.notes).toBe('Mixed update');
          expect(result.data.staffCostGrowthPercent?.toNumber()).toBeCloseTo(6.0, 1);
        }
      });
    });

    describe('Audit logging', () => {
      it('should create audit log with old and new values for new fields', async () => {
        const input: UpdateTransitionYearInput = {
          year: 2025,
          averageTuitionPerStudent: new Decimal('60000'), // Changed from 50000
          otherRevenue: new Decimal('3000000'), // Changed from 2000000
        };

        await updateTransitionYear(input, TEST_USER_ID);

        const auditLog = await prisma.audit_logs.findFirst({
          where: {
            action: 'UPDATE_TRANSITION_YEAR',
            userId: TEST_USER_ID,
          },
          orderBy: { createdAt: 'desc' },
        });

        expect(auditLog).toBeDefined();
        const metadata = auditLog?.metadata as any;

        expect(metadata.oldValue.averageTuitionPerStudent).toBe(50000);
        expect(metadata.newValue.averageTuitionPerStudent).toBe(60000);
        expect(metadata.oldValue.otherRevenue).toBe(2000000);
        expect(metadata.newValue.otherRevenue).toBe(3000000);
      });

      it('should include growth percents in audit log', async () => {
        const input: UpdateTransitionYearInput = {
          year: 2025,
          staffCostGrowthPercent: new Decimal('8.0'), // Changed from 5.0
          rentGrowthPercent: new Decimal('15.0'), // Changed from 10.0
        };

        await updateTransitionYear(input, TEST_USER_ID);

        const auditLog = await prisma.audit_logs.findFirst({
          where: { action: 'UPDATE_TRANSITION_YEAR' },
          orderBy: { createdAt: 'desc' },
        });

        expect(auditLog).toBeDefined();
        const metadata = auditLog?.metadata as any;

        expect(metadata.oldValue.staffCostGrowthPercent).toBe(5.0);
        expect(metadata.newValue.staffCostGrowthPercent).toBe(8.0);
        expect(metadata.oldValue.rentGrowthPercent).toBe(10.0);
        expect(metadata.newValue.rentGrowthPercent).toBe(15.0);
      });

      it('should log null when field transitions from null', async () => {
        // First set field to null
        await prisma.transition_year_data.update({
          where: { year: 2025 },
          data: { averageTuitionPerStudent: null },
        });

        // Now update to a value
        const input: UpdateTransitionYearInput = {
          year: 2025,
          averageTuitionPerStudent: new Decimal('55000'),
        };

        await updateTransitionYear(input, TEST_USER_ID);

        const auditLog = await prisma.audit_logs.findFirst({
          where: { action: 'UPDATE_TRANSITION_YEAR' },
          orderBy: { createdAt: 'desc' },
        });

        const metadata = auditLog?.metadata as any;
        expect(metadata.oldValue.averageTuitionPerStudent).toBeNull();
        expect(metadata.newValue.averageTuitionPerStudent).toBe(55000);
      });
    });
  });

  describe('updateTransitionSettings - Base Year Values', () => {
    it('should update transitionStaffCostBase2024', async () => {
      const input: UpdateTransitionSettingsInput = {
        transitionStaffCostBase2024: new Decimal('35000000'),
      };

      const result = await updateTransitionSettings(input, TEST_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(parseFloat(result.data.staffCostBase2024!)).toBe(35000000);
      }
    });

    it('should update transitionRentBase2024', async () => {
      const input: UpdateTransitionSettingsInput = {
        transitionRentBase2024: new Decimal('14000000'),
      };

      const result = await updateTransitionSettings(input, TEST_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(parseFloat(result.data.rentBase2024!)).toBe(14000000);
      }
    });

    it('should update both base year values simultaneously', async () => {
      const input: UpdateTransitionSettingsInput = {
        transitionStaffCostBase2024: new Decimal('40000000'),
        transitionRentBase2024: new Decimal('15000000'),
      };

      const result = await updateTransitionSettings(input, TEST_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(parseFloat(result.data.staffCostBase2024!)).toBe(40000000);
        expect(parseFloat(result.data.rentBase2024!)).toBe(15000000);
      }
    });

    it('should create audit log for base year value updates', async () => {
      const input: UpdateTransitionSettingsInput = {
        transitionStaffCostBase2024: new Decimal('35000000'),
      };

      await updateTransitionSettings(input, TEST_USER_ID);

      const auditLog = await prisma.audit_logs.findFirst({
        where: {
          action: 'UPDATE_TRANSITION_SETTINGS',
          userId: TEST_USER_ID,
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).toBeDefined();
      const metadata = auditLog?.metadata as any;
      expect(metadata.oldValue.staffCostBase2024).toBe(32000000);
      expect(metadata.newValue.staffCostBase2024).toBe(35000000);
    });
  });

  describe('getCompleteTransitionConfig - Enhanced Response', () => {
    it('should include all new fields in yearData', async () => {
      const result = await getCompleteTransitionConfig();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.yearData).toHaveLength(3);

        const year2025 = result.data.yearData.find((y) => y.year === 2025);
        expect(year2025).toBeDefined();
        expect(year2025?.averageTuitionPerStudent).toBeInstanceOf(Decimal);
        expect(year2025?.otherRevenue).toBeInstanceOf(Decimal);
        expect(year2025?.staffCostGrowthPercent).toBeInstanceOf(Decimal);
        expect(year2025?.rentGrowthPercent).toBeInstanceOf(Decimal);
      }
    });

    it('should include base year 2024 values in settings', async () => {
      const result = await getCompleteTransitionConfig();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.settings.staffCostBase2024).toBeDefined();
        expect(result.data.settings.rentBase2024).toBeDefined();
        expect(parseFloat(result.data.settings.staffCostBase2024!)).toBe(32000000);
        expect(parseFloat(result.data.settings.rentBase2024!)).toBe(12000000);
      }
    });

    it('should handle null new fields gracefully', async () => {
      // Update one year to have null new fields
      await prisma.transition_year_data.update({
        where: { year: 2025 },
        data: {
          averageTuitionPerStudent: null,
          otherRevenue: null,
          staffCostGrowthPercent: null,
          rentGrowthPercent: null,
        },
      });

      const result = await getCompleteTransitionConfig();

      expect(result.success).toBe(true);
      if (result.success) {
        const year2025 = result.data.yearData.find((y) => y.year === 2025);
        expect(year2025?.averageTuitionPerStudent).toBeNull();
        expect(year2025?.otherRevenue).toBeNull();
        expect(year2025?.staffCostGrowthPercent).toBeNull();
        expect(year2025?.rentGrowthPercent).toBeNull();
      }
    });
  });
});
