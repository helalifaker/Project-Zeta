/**
 * Fixed Escalation Rent Model
 * Calculates rent with a fixed annual escalation rate
 *
 * Formula: rent(t) = base_rent × (1 + escalation_rate)^(t - start_year)
 *
 * @example
 * Base rent: 1M SAR, Escalation: 4%, Start year: 2028
 * Year 2028: 1M × (1.04)^0 = 1M
 * Year 2029: 1M × (1.04)^1 = 1.04M
 * Year 2030: 1M × (1.04)^2 = 1.0816M
 */

import Decimal from 'decimal.js';
import { toDecimal } from '../decimal-helpers';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';

export interface FixedEscalationParams {
  baseRent: Decimal | number | string;
  escalationRate: Decimal | number | string; // e.g., 0.04 for 4%
  startYear: number;
  endYear: number;
}

export interface FixedEscalationResult {
  year: number;
  rent: Decimal;
  escalationFactor: Decimal;
}

/**
 * Calculate rent for a single year using fixed escalation
 */
export function calculateFixedEscalationRentForYear(
  baseRent: Decimal | number | string,
  escalationRate: Decimal | number | string,
  startYear: number,
  year: number
): Result<Decimal> {
  try {
    const base = toDecimal(baseRent);
    const rate = toDecimal(escalationRate);
    const yearsFromStart = year - startYear;

    // Validate inputs
    if (base.isNegative() || base.isZero()) {
      return error('Base rent must be positive');
    }

    if (rate.isNegative()) {
      return error('Escalation rate cannot be negative');
    }

    if (yearsFromStart < 0) {
      return error('Year must be >= start year');
    }

    // Calculate: base_rent × (1 + escalation_rate)^years
    const escalationFactor = Decimal.add(1, rate).pow(yearsFromStart);
    const rent = base.times(escalationFactor);

    return success(rent);
  } catch (err) {
    return error(`Failed to calculate fixed escalation rent: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Calculate rent for multiple years using fixed escalation
 */
export function calculateFixedEscalationRent(
  params: FixedEscalationParams
): Result<FixedEscalationResult[]> {
  try {
    const { baseRent, escalationRate, startYear, endYear } = params;

    // Validate year range
    if (startYear > endYear) {
      return error('Start year must be <= end year');
    }

    if (startYear < 2023 || endYear > 2052) {
      return error('Years must be between 2023 and 2052');
    }

    const base = toDecimal(baseRent);
    const rate = toDecimal(escalationRate);

    // Validate inputs
    if (base.isNegative() || base.isZero()) {
      return error('Base rent must be positive');
    }

    if (rate.isNegative()) {
      return error('Escalation rate cannot be negative');
    }

    const results: FixedEscalationResult[] = [];
    const escalationFactorBase = Decimal.add(1, rate);

    for (let year = startYear; year <= endYear; year++) {
      const yearsFromStart = year - startYear;
      const escalationFactor = escalationFactorBase.pow(yearsFromStart);
      const rent = base.times(escalationFactor);

      results.push({
        year,
        rent,
        escalationFactor,
      });
    }

    return success(results);
  } catch (err) {
    return error(`Failed to calculate fixed escalation rent: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Calculate total rent over a period (sum of all years)
 */
export function calculateFixedEscalationTotalRent(
  params: FixedEscalationParams
): Result<Decimal> {
  const result = calculateFixedEscalationRent(params);

  if (!result.success) {
    return result;
  }

  try {
    const total = result.data.reduce(
      (sum, item) => sum.plus(item.rent),
      new Decimal(0)
    );

    return success(total);
  } catch (err) {
    return error(`Failed to calculate total rent: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

