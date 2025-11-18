/**
 * Fixed Escalation Rent Model
 * Calculates rent with a fixed escalation rate applied every N years
 *
 * Formula: rent(t) = base_rent × (1 + escalation_rate)^escalations
 * Where escalations = floor((year - start_year) / frequency)
 *
 * @example
 * Base rent: 1M SAR, Escalation: 4%, Frequency: 1 year, Start year: 2028
 * Year 2028: 1M × (1.04)^0 = 1M
 * Year 2029: 1M × (1.04)^1 = 1.04M
 * Year 2030: 1M × (1.04)^2 = 1.0816M
 *
 * @example
 * Base rent: 1M SAR, Escalation: 3%, Frequency: 2 years, Start year: 2028
 * Years 2028-2029: 1M × (1.03)^0 = 1M (no escalation)
 * Years 2030-2031: 1M × (1.03)^1 = 1.03M (first escalation)
 * Years 2032-2033: 1M × (1.03)^2 = 1.0609M (second escalation)
 */

import Decimal from 'decimal.js';
import { toDecimal } from '../decimal-helpers';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';

export interface FixedEscalationParams {
  baseRent: Decimal | number | string;
  escalationRate: Decimal | number | string; // e.g., 0.04 for 4%
  frequency?: number; // Apply escalation every N years (1, 2, 3, 4, or 5), optional, default 1
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
  year: number,
  frequency: number = 1
): Result<Decimal> {
  try {
    const base = toDecimal(baseRent);
    const rate = toDecimal(escalationRate);
    const freq = frequency ?? 1;
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

    // Validate frequency (1, 2, 3, 4, or 5)
    if (![1, 2, 3, 4, 5].includes(freq)) {
      return error('Frequency must be 1, 2, 3, 4, or 5 years');
    }

    // Calculate number of escalations: floor(yearsFromStart / frequency)
    const escalations = Math.floor(yearsFromStart / freq);

    // Calculate: base_rent × (1 + escalation_rate)^escalations
    const escalationFactor = Decimal.add(1, rate).pow(escalations);
    const rent = base.times(escalationFactor);

    return success(rent);
  } catch (err) {
    return error(`Failed to calculate fixed escalation rent: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Calculate rent for multiple years using fixed escalation
 * Supports optional frequency parameter to apply escalation every N years
 */
export function calculateFixedEscalationRent(
  params: FixedEscalationParams
): Result<FixedEscalationResult[]> {
  try {
    const { baseRent, escalationRate, frequency = 1, startYear, endYear } = params;

    // Validate year range
    if (startYear > endYear) {
      return error('Start year must be <= end year');
    }

    if (startYear < 2023 || endYear > 2052) {
      return error('Years must be between 2023 and 2052');
    }

    const base = toDecimal(baseRent);
    const rate = toDecimal(escalationRate);
    const freq = frequency ?? 1;

    // Validate inputs
    if (base.isNegative() || base.isZero()) {
      return error('Base rent must be positive');
    }

    if (rate.isNegative()) {
      return error('Escalation rate cannot be negative');
    }

    // Validate frequency (1, 2, 3, 4, or 5)
    if (![1, 2, 3, 4, 5].includes(freq)) {
      return error('Frequency must be 1, 2, 3, 4, or 5 years');
    }

    const results: FixedEscalationResult[] = [];
    const escalationFactorBase = Decimal.add(1, rate);

    for (let year = startYear; year <= endYear; year++) {
      const yearsFromStart = year - startYear;
      // Calculate number of escalations: floor(yearsFromStart / frequency)
      const escalations = Math.floor(yearsFromStart / freq);
      const escalationFactor = escalationFactorBase.pow(escalations);
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

