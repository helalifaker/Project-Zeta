/**
 * Capex Calculation Service
 * Calculates and persists CapexItems from CapexRules
 */

import { prisma } from '@/lib/db/prisma';
import { calculateCapexFromRules, type CapexRule } from '@/lib/calculations/capex';
import Decimal from 'decimal.js';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';

/**
 * Calculate and persist CapexItems from rules
 * Deletes existing auto-generated items (where ruleId IS NOT NULL) and creates new ones
 * Keeps manual items (where ruleId IS NULL) untouched
 */
export async function calculateAndPersistCapexItems(
  versionId: string,
  rules: CapexRule[],
  cpiRate: Decimal | number | string
): Promise<Result<void>> {
  try {
    // Calculate capex items from rules
    const calculationResult = calculateCapexFromRules(
      rules,
      cpiRate,
      2023, // startYear
      2052 // endYear
    );

    if (!calculationResult.success) {
      return calculationResult;
    }

    const calculatedItems = calculationResult.data;

    // Delete existing auto-generated items (where ruleId IS NOT NULL)
    await prisma.capex_items.deleteMany({
      where: {
        versionId,
        ruleId: { not: null },
      },
    });

    // Create new CapexItem records for calculated items
    if (calculatedItems.length > 0) {
      await prisma.capex_items.createMany({
        data: calculatedItems.map((item) => ({
          versionId,
          year: item.year,
          category: item.category,
          amount: item.amount,
          ruleId: item.ruleId,
          description: null, // Auto-generated items don't have descriptions
        })),
      });
    }

    return success(undefined);
  } catch (err) {
    console.error('Failed to calculate and persist capex items:', err);
    return error(
      err instanceof Error
        ? err.message
        : 'Failed to calculate and persist capex items'
    );
  }
}

