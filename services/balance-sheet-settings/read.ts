/**
 * Read Balance Sheet Settings Service
 * Fetches Balance Sheet Settings for a version
 */

import { prisma } from '@/lib/db/prisma';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';

export interface BalanceSheetSettings {
  id: string;
  versionId: string;
  startingCash: number;
  openingEquity: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get Balance Sheet Settings for a version
 */
export async function getBalanceSheetSettingsByVersion(
  versionId: string
): Promise<Result<BalanceSheetSettings | null>> {
  try {
    const settings = await prisma.balance_sheet_settings.findUnique({
      where: { versionId },
    });

    if (!settings) {
      return success(null);
    }

    return success({
      id: settings.id,
      versionId: settings.versionId,
      startingCash: parseFloat(settings.startingCash.toString()),
      openingEquity: parseFloat(settings.openingEquity.toString()),
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    });
  } catch (err) {
    console.error('Failed to fetch Balance Sheet Settings:', err);
    return error('Failed to fetch Balance Sheet Settings');
  }
}

