/**
 * Update Other Revenue Service
 * Updates Other Revenue items for a version (delete all, insert new)
 */

import { prisma } from '@/lib/db/prisma';
import { EntityType } from '@prisma/client';
import Decimal from 'decimal.js';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';
import { logAudit } from '@/services/audit';

export interface OtherRevenueItemInput {
  year: number;
  amount: number | string | Decimal;
}

export interface OtherRevenueItem {
  id: string;
  versionId: string;
  year: number;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Update Other Revenue items for a version
 * Deletes all existing items and creates new ones
 */
export async function updateOtherRevenue(
  versionId: string,
  items: OtherRevenueItemInput[],
  userId: string
): Promise<Result<OtherRevenueItem[]>> {
  try {
    if (!Array.isArray(items)) {
      return error('Items must be an array', 'VALIDATION_ERROR');
    }

    // Validate each item
    for (const item of items) {
      if (item.year < 2023 || item.year > 2052) {
        return error(`Year ${item.year} must be between 2023 and 2052`, 'VALIDATION_ERROR');
      }

      const amount = new Decimal(item.amount);
      if (amount.isNegative()) {
        return error(`Amount for year ${item.year} cannot be negative`, 'VALIDATION_ERROR');
      }
    }

    // Verify version exists and is not locked
    const version = await prisma.versions.findUnique({
      where: { id: versionId },
      select: { id: true, status: true },
    });

    if (!version) {
      return error('Version not found', 'VERSION_NOT_FOUND');
    }

    if (version.status === 'LOCKED') {
      return error('Version is locked and cannot be modified', 'VERSION_LOCKED');
    }

    // Calculate total amount for audit log
    const totalAmount = items.reduce(
      (sum, item) => sum.plus(new Decimal(item.amount)),
      new Decimal(0)
    );

    // Use transaction for atomic update
    const createdItems = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.other_revenue_items.deleteMany({
        where: { versionId },
      });

      // ✅ FIX 4: Use individual creates to return IDs (not createMany)
      const created = await Promise.all(
        items.map((item) =>
          tx.other_revenue_items.create({
            data: {
              versionId,
              year: item.year,
              amount: new Decimal(item.amount).toFixed(2),
            },
          })
        )
      );

      return created;
    });

    // Log audit entry
    await logAudit({
      action: 'UPDATE_OTHER_REVENUE',
      userId,
      entityType: EntityType.VERSION,
      entityId: versionId,
      metadata: {
        itemCount: items.length,
        totalAmount: totalAmount.toString(),
        years: items.map((item) => item.year),
      },
    });

    // Return created items with IDs
    return success(
      createdItems.map((item) => ({
        id: item.id,
        versionId: item.versionId,
        year: item.year,
        amount: parseFloat(item.amount.toString()),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }))
    );
  } catch (err) {
    console.error('Failed to update Other Revenue items:', err);
    return error('Failed to update Other Revenue items');
  }
}

