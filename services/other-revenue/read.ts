/**
 * Read Other Revenue Service
 * Fetches Other Revenue items for a version
 */

import { prisma } from '@/lib/db/prisma';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';

export interface OtherRevenueItem {
  id: string;
  versionId: string;
  year: number;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get Other Revenue items for a version
 */
export async function getOtherRevenueByVersion(
  versionId: string
): Promise<Result<OtherRevenueItem[]>> {
  try {
    const items = await prisma.other_revenue_items.findMany({
      where: { versionId },
      orderBy: { year: 'asc' },
    });

    return success(
      items.map((item) => ({
        id: item.id,
        versionId: item.versionId,
        year: item.year,
        amount: parseFloat(item.amount.toString()),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }))
    );
  } catch (err) {
    console.error('Failed to fetch Other Revenue items:', err);
    return error('Failed to fetch Other Revenue items');
  }
}

