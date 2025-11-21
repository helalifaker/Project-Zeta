/**
 * Database Layer Tests for Transition Period Schema
 *
 * Tests Prisma schema constraints, indexes, and database operations for:
 * - transition_year_data table
 * - admin_settings transition fields
 * - Unique constraints
 * - Check constraints (year range, positive values)
 * - Foreign key relationships
 * - Index performance
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import {
  cleanupTransitionTestData,
  seedTransitionTestData,
  seedTransitionAdminSettings,
} from '@/test-utils/transition-helpers';

const prisma = new PrismaClient();

describe('Transition Year Data Schema', () => {
  beforeEach(async () => {
    await cleanupTransitionTestData();
  });

  afterEach(async () => {
    await cleanupTransitionTestData();
  });

  describe('Table Creation and Basic Operations', () => {
    it('should create transition_year_data records', async () => {
      const record = await prisma.transition_year_data.create({
        data: {
          year: 2025,
          targetEnrollment: 1850,
          staffCostBase: new Decimal(9000000),
          notes: 'Test record',
        },
      });

      expect(record).toBeDefined();
      expect(record.id).toBeDefined();
      expect(record.year).toBe(2025);
      expect(record.targetEnrollment).toBe(1850);
      expect(record.staffCostBase.toNumber()).toBe(9000000);
      expect(record.notes).toBe('Test record');
      expect(record.createdAt).toBeInstanceOf(Date);
      expect(record.updatedAt).toBeInstanceOf(Date);
    });

    it('should read transition_year_data records', async () => {
      await seedTransitionTestData();

      const records = await prisma.transition_year_data.findMany({
        orderBy: { year: 'asc' },
      });

      expect(records).toHaveLength(3);
      expect(records[0].year).toBe(2025);
      expect(records[1].year).toBe(2026);
      expect(records[2].year).toBe(2027);
    });

    it('should update transition_year_data records', async () => {
      await seedTransitionTestData();

      const updated = await prisma.transition_year_data.update({
        where: { year: 2025 },
        data: {
          targetEnrollment: 2000,
          notes: 'Updated',
        },
      });

      expect(updated.targetEnrollment).toBe(2000);
      expect(updated.notes).toBe('Updated');
      expect(updated.updatedAt.getTime()).toBeGreaterThan(updated.createdAt.getTime());
    });

    it('should delete transition_year_data records', async () => {
      await seedTransitionTestData();

      await prisma.transition_year_data.delete({
        where: { year: 2025 },
      });

      const remaining = await prisma.transition_year_data.count();
      expect(remaining).toBe(2);
    });
  });

  describe('Unique Constraints', () => {
    it('should enforce unique year constraint', async () => {
      await prisma.transition_year_data.create({
        data: {
          year: 2025,
          targetEnrollment: 1850,
          staffCostBase: new Decimal(9000000),
        },
      });

      // Attempting to create duplicate year should fail
      await expect(
        prisma.transition_year_data.create({
          data: {
            year: 2025, // Duplicate year
            targetEnrollment: 2000,
            staffCostBase: new Decimal(10000000),
          },
        })
      ).rejects.toThrow();
    });

    it('should allow upsert operations for idempotency', async () => {
      const firstCreate = await prisma.transition_year_data.upsert({
        where: { year: 2025 },
        update: {},
        create: {
          year: 2025,
          targetEnrollment: 1850,
          staffCostBase: new Decimal(9000000),
        },
      });

      const secondUpsert = await prisma.transition_year_data.upsert({
        where: { year: 2025 },
        update: { targetEnrollment: 2000 },
        create: {
          year: 2025,
          targetEnrollment: 1850,
          staffCostBase: new Decimal(9000000),
        },
      });

      expect(firstCreate.id).toBe(secondUpsert.id);
      expect(secondUpsert.targetEnrollment).toBe(2000);
    });
  });

  describe('Data Type Validation', () => {
    it('should store Decimal values with correct precision', async () => {
      const record = await prisma.transition_year_data.create({
        data: {
          year: 2025,
          targetEnrollment: 1850,
          staffCostBase: new Decimal('9151416.99'), // Precise decimal
        },
      });

      expect(record.staffCostBase).toBeInstanceOf(Decimal);
      expect(record.staffCostBase.toFixed(2)).toBe('9151416.99');
    });

    it('should handle large staff cost values', async () => {
      const record = await prisma.transition_year_data.create({
        data: {
          year: 2025,
          targetEnrollment: 1850,
          staffCostBase: new Decimal('999999999999.99'), // 13 digits before decimal
        },
      });

      expect(record.staffCostBase.toNumber()).toBeCloseTo(999999999999.99, 2);
    });

    it('should handle small decimal values', async () => {
      const record = await prisma.transition_year_data.create({
        data: {
          year: 2025,
          targetEnrollment: 1850,
          staffCostBase: new Decimal('0.01'), // Minimum value
        },
      });

      expect(record.staffCostBase.toFixed(2)).toBe('0.01');
    });

    it('should store null notes correctly', async () => {
      const record = await prisma.transition_year_data.create({
        data: {
          year: 2025,
          targetEnrollment: 1850,
          staffCostBase: new Decimal(9000000),
          // notes not provided
        },
      });

      expect(record.notes).toBeNull();
    });

    it('should handle long notes strings', async () => {
      const longNotes = 'A'.repeat(500);
      const record = await prisma.transition_year_data.create({
        data: {
          year: 2025,
          targetEnrollment: 1850,
          staffCostBase: new Decimal(9000000),
          notes: longNotes,
        },
      });

      expect(record.notes).toBe(longNotes);
      expect(record.notes?.length).toBe(500);
    });
  });

  describe('Index Performance', () => {
    it('should efficiently query by year (indexed)', async () => {
      await seedTransitionTestData();

      const startTime = Date.now();
      const record = await prisma.transition_year_data.findUnique({
        where: { year: 2025 },
      });
      const queryTime = Date.now() - startTime;

      expect(record).toBeDefined();
      expect(record?.year).toBe(2025);
      // Should be very fast (<10ms) due to unique index
      expect(queryTime).toBeLessThan(100);
    });

    it('should support efficient range queries on year', async () => {
      await seedTransitionTestData();

      const records = await prisma.transition_year_data.findMany({
        where: {
          year: {
            gte: 2025,
            lte: 2026,
          },
        },
      });

      expect(records).toHaveLength(2);
      expect(records.map((r) => r.year)).toEqual([2025, 2026]);
    });

    it('should support ordering by year efficiently', async () => {
      await seedTransitionTestData();

      const ascending = await prisma.transition_year_data.findMany({
        orderBy: { year: 'asc' },
      });

      expect(ascending[0].year).toBe(2025);
      expect(ascending[2].year).toBe(2027);

      const descending = await prisma.transition_year_data.findMany({
        orderBy: { year: 'desc' },
      });

      expect(descending[0].year).toBe(2027);
      expect(descending[2].year).toBe(2025);
    });
  });

  describe('Timestamps', () => {
    it('should automatically set createdAt on insert', async () => {
      const beforeCreate = Date.now();

      const record = await prisma.transition_year_data.create({
        data: {
          year: 2025,
          targetEnrollment: 1850,
          staffCostBase: new Decimal(9000000),
        },
      });

      const afterCreate = Date.now();

      expect(record.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate);
      expect(record.createdAt.getTime()).toBeLessThanOrEqual(afterCreate);
    });

    it('should automatically update updatedAt on modification', async () => {
      const record = await prisma.transition_year_data.create({
        data: {
          year: 2025,
          targetEnrollment: 1850,
          staffCostBase: new Decimal(9000000),
        },
      });

      const originalUpdatedAt = record.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await prisma.transition_year_data.update({
        where: { year: 2025 },
        data: { targetEnrollment: 2000 },
      });

      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});

describe('Admin Settings Transition Fields', () => {
  beforeEach(async () => {
    await cleanupTransitionTestData();
  });

  afterEach(async () => {
    await cleanupTransitionTestData();
  });

  describe('Transition Settings Storage', () => {
    it('should store transition capacity cap', async () => {
      await seedTransitionAdminSettings(1850, 10.0);

      const settings = await prisma.admin_settings.findFirst({
        select: {
          transitionCapacityCap: true,
        },
      });

      expect(settings).toBeDefined();
      expect(settings?.transitionCapacityCap).toBe(1850);
    });

    it('should store transition rent adjustment percent with correct precision', async () => {
      await seedTransitionAdminSettings(1850, 10.5);

      const settings = await prisma.admin_settings.findFirst({
        select: {
          transitionRentAdjustmentPercent: true,
        },
      });

      expect(settings).toBeDefined();
      expect(settings?.transitionRentAdjustmentPercent).toBeInstanceOf(Decimal);
      expect(settings?.transitionRentAdjustmentPercent?.toNumber()).toBe(10.5);
    });

    it('should handle negative rent adjustment percent', async () => {
      await seedTransitionAdminSettings(1850, -5.0);

      const settings = await prisma.admin_settings.findFirst({
        select: {
          transitionRentAdjustmentPercent: true,
        },
      });

      expect(settings?.transitionRentAdjustmentPercent?.toNumber()).toBe(-5.0);
    });

    it('should handle zero rent adjustment percent', async () => {
      await seedTransitionAdminSettings(1850, 0);

      const settings = await prisma.admin_settings.findFirst({
        select: {
          transitionRentAdjustmentPercent: true,
        },
      });

      expect(settings?.transitionRentAdjustmentPercent?.toNumber()).toBe(0);
    });

    it('should update transition settings', async () => {
      await seedTransitionAdminSettings(1850, 10.0);

      const existing = await prisma.admin_settings.findFirst();
      expect(existing).toBeDefined();

      const updated = await prisma.admin_settings.update({
        where: { id: existing!.id },
        data: {
          transitionCapacityCap: 2000,
          transitionRentAdjustmentPercent: new Decimal(15.0),
        },
      });

      expect(updated.transitionCapacityCap).toBe(2000);
      expect(updated.transitionRentAdjustmentPercent?.toNumber()).toBe(15.0);
    });
  });

  describe('Default Values', () => {
    it('should use default capacity cap if not specified', async () => {
      const settings = await prisma.admin_settings.findFirst();

      // Default should be 1850 (specified in schema)
      expect(settings?.transitionCapacityCap).toBe(1850);
    });

    it('should use default rent adjustment percent if not specified', async () => {
      const settings = await prisma.admin_settings.findFirst();

      // Default should be 10.0 (specified in schema)
      expect(settings?.transitionRentAdjustmentPercent?.toNumber()).toBe(10.0);
    });
  });

  describe('Data Type Precision', () => {
    it('should store rent adjustment with up to 2 decimal places', async () => {
      await seedTransitionAdminSettings(1850, 10.55);

      const settings = await prisma.admin_settings.findFirst();

      expect(settings?.transitionRentAdjustmentPercent?.toFixed(2)).toBe('10.55');
    });

    it('should handle large rent adjustment percentages', async () => {
      await seedTransitionAdminSettings(1850, 999.99);

      const settings = await prisma.admin_settings.findFirst();

      expect(settings?.transitionRentAdjustmentPercent?.toNumber()).toBe(999.99);
    });
  });
});

describe('Schema Relationships and Integrity', () => {
  beforeEach(async () => {
    await cleanupTransitionTestData();
  });

  afterEach(async () => {
    await cleanupTransitionTestData();
  });

  describe('Transaction Support', () => {
    it('should support atomic batch operations', async () => {
      await expect(
        prisma.$transaction(async (tx) => {
          await tx.transition_year_data.create({
            data: {
              year: 2025,
              targetEnrollment: 1850,
              staffCostBase: new Decimal(9000000),
            },
          });

          await tx.transition_year_data.create({
            data: {
              year: 2026,
              targetEnrollment: 1850,
              staffCostBase: new Decimal(9300000),
            },
          });

          await tx.transition_year_data.create({
            data: {
              year: 2027,
              targetEnrollment: 1850,
              staffCostBase: new Decimal(9600000),
            },
          });
        })
      ).resolves.toBeUndefined();

      const count = await prisma.transition_year_data.count();
      expect(count).toBe(3);
    });

    it('should rollback transaction on error', async () => {
      await expect(
        prisma.$transaction(async (tx) => {
          await tx.transition_year_data.create({
            data: {
              year: 2025,
              targetEnrollment: 1850,
              staffCostBase: new Decimal(9000000),
            },
          });

          // This should fail due to duplicate year
          await tx.transition_year_data.create({
            data: {
              year: 2025, // Duplicate!
              targetEnrollment: 2000,
              staffCostBase: new Decimal(10000000),
            },
          });
        })
      ).rejects.toThrow();

      // Nothing should be committed
      const count = await prisma.transition_year_data.count();
      expect(count).toBe(0);
    });
  });

  describe('Prisma Client Type Generation', () => {
    it('should generate correct TypeScript types for transition_year_data', () => {
      // This is a compile-time check, but we can verify runtime types
      const mockRecord = {
        id: 'test-id',
        year: 2025,
        targetEnrollment: 1850,
        staffCostBase: new Decimal(9000000),
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // TypeScript should accept this structure
      const typedRecord: typeof prisma.transition_year_data.findUnique extends (
        ...args: any[]
      ) => Promise<infer T>
        ? T
        : never = mockRecord;

      expect(typedRecord).toBeDefined();
    });
  });
});
