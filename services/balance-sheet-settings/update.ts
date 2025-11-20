/**
 * Update Balance Sheet Settings Service
 * Creates or updates Balance Sheet Settings for a version
 */

import { prisma } from '@/lib/db/prisma';
import { EntityType } from '@prisma/client';
import Decimal from 'decimal.js';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';
import { logAudit } from '@/services/audit';

export interface BalanceSheetSettingsInput {
  startingCash: number | string | Decimal;
  openingEquity: number | string | Decimal;
}

export interface BalanceSheetSettings {
  id: string;
  versionId: string;
  startingCash: number;
  openingEquity: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Update Balance Sheet Settings for a version
 * Creates if doesn't exist, updates if exists
 */
export async function updateBalanceSheetSettings(
  versionId: string,
  settings: BalanceSheetSettingsInput,
  userId: string
): Promise<Result<BalanceSheetSettings>> {
  try {
    const startingCash = new Decimal(settings.startingCash);
    const openingEquity = new Decimal(settings.openingEquity);

    // Validate inputs
    if (startingCash.isNegative()) {
      return error('Starting cash cannot be negative', 'VALIDATION_ERROR');
    }

    if (openingEquity.isNegative()) {
      return error('Opening equity cannot be negative', 'VALIDATION_ERROR');
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

    // Use upsert to create or update
    const updatedSettings = await prisma.balance_sheet_settings.upsert({
      where: { versionId },
      create: {
        versionId,
        startingCash: startingCash.toFixed(2),
        openingEquity: openingEquity.toFixed(2),
      },
      update: {
        startingCash: startingCash.toFixed(2),
        openingEquity: openingEquity.toFixed(2),
      },
    });

    // Log audit entry
    await logAudit({
      action: 'UPDATE_BALANCE_SHEET_SETTINGS',
      userId,
      entityType: EntityType.VERSION,
      entityId: versionId,
      metadata: {
        startingCash: startingCash.toString(),
        openingEquity: openingEquity.toString(),
      },
    });

    return success({
      id: updatedSettings.id,
      versionId: updatedSettings.versionId,
      startingCash: parseFloat(updatedSettings.startingCash.toString()),
      openingEquity: parseFloat(updatedSettings.openingEquity.toString()),
      createdAt: updatedSettings.createdAt,
      updatedAt: updatedSettings.updatedAt,
    });
  } catch (err) {
    console.error('Failed to update Balance Sheet Settings:', err);
    return error('Failed to update Balance Sheet Settings');
  }
}

