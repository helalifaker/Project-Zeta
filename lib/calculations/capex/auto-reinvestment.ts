/**
 * Capex Auto-Reinvestment Calculation
 * Calculates capex items from reinvestment cycle rules
 *
 * Formula: amount = baseCost × (1 + cpiRate)^(reinvestmentYear - startingYear)
 *
 * Reinvestment years: startingYear + (cycleYears * n) where n = 0, 1, 2, ... until <= endYear
 *
 * @example
 * Rule: Building, cycleYears: 20, baseCost: 5M SAR, startingYear: 2028, cpiRate: 3%
 * Year 2028: 5M × (1.03)^0 = 5M (n=0)
 * Year 2048: 5M × (1.03)^20 = 9.03M (n=1, 20 years later)
 * Year 2068: 5M × (1.03)^40 = 16.31M (n=2, 40 years later, but beyond 2052 so not included)
 */

import Decimal from 'decimal.js';
import { toDecimal } from '../decimal-helpers';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';
import { CapexCategory } from '@prisma/client';

export interface CapexRule {
  id: string;
  category: CapexCategory;
  cycleYears: number;
  baseCost: Decimal | number | string;
  startingYear: number;
  inflationIndex?: string | null; // Optional CPI reference, defaults to global CPI
}

export interface CapexItem {
  year: number;
  category: CapexCategory;
  amount: Decimal;
  ruleId: string;
}

/**
 * Calculate capex items from a single rule
 */
export function calculateCapexFromRule(
  rule: CapexRule,
  cpiRate: Decimal | number | string,
  startYear: number,
  endYear: number
): Result<CapexItem[]> {
  try {
    const baseCost = toDecimal(rule.baseCost);
    const rate = toDecimal(cpiRate);

    // Validate inputs
    if (baseCost.isNegative() || baseCost.isZero()) {
      return error('Base cost must be positive');
    }

    if (rate.isNegative()) {
      return error('CPI rate cannot be negative');
    }

    if (rule.cycleYears < 1 || rule.cycleYears > 50) {
      return error('Cycle years must be between 1 and 50');
    }

    if (rule.startingYear < startYear || rule.startingYear > endYear) {
      return error(`Starting year must be between ${startYear} and ${endYear}`);
    }

    const items: CapexItem[] = [];
    let n = 0;
    let reinvestmentYear = rule.startingYear;

    // Calculate reinvestment years: startingYear + (cycleYears * n)
    while (reinvestmentYear <= endYear) {
      if (reinvestmentYear >= startYear) {
        // Calculate years since starting year
        const yearsSinceStart = reinvestmentYear - rule.startingYear;

        // Calculate amount with inflation: baseCost × (1 + cpiRate)^(years_since_start)
        const inflationFactor = Decimal.pow(
          Decimal.add(1, rate),
          yearsSinceStart
        );
        const amount = baseCost.times(inflationFactor);

        items.push({
          year: reinvestmentYear,
          category: rule.category,
          amount,
          ruleId: rule.id,
        });
      }

      n++;
      reinvestmentYear = rule.startingYear + rule.cycleYears * n;
    }

    return success(items);
  } catch (err) {
    return error(
      err instanceof Error ? err.message : 'Failed to calculate capex from rule'
    );
  }
}

/**
 * Calculate capex items from multiple rules
 */
export function calculateCapexFromRules(
  rules: CapexRule[],
  cpiRate: Decimal | number | string,
  startYear: number = 2023,
  endYear: number = 2052
): Result<CapexItem[]> {
  try {
    const allItems: CapexItem[] = [];

    for (const rule of rules) {
      const result = calculateCapexFromRule(rule, cpiRate, startYear, endYear);
      if (!result.success) {
        return result;
      }
      allItems.push(...result.data);
    }

    // Sort by year, then by category
    allItems.sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year;
      }
      return a.category.localeCompare(b.category);
    });

    return success(allItems);
  } catch (err) {
    return error(
      err instanceof Error
        ? err.message
        : 'Failed to calculate capex from rules'
    );
  }
}

