/**
 * Tuition Growth Calculation
 * Calculates tuition growth based on CPI with configurable frequency
 *
 * Formula: tuition(t) = tuition_base × (1 + cpi_rate)^(floor((t - base_year) / frequency))
 *
 * @example
 * Base tuition: 50K SAR, CPI: 3%, Frequency: 2 years
 * Year 2028: 50K × (1.03)^0 = 50K
 * Year 2029: 50K × (1.03)^0 = 50K (same as 2028, frequency = 2)
 * Year 2030: 50K × (1.03)^1 = 51.5K
 * Year 2031: 50K × (1.03)^1 = 51.5K (same as 2030)
 * Year 2032: 50K × (1.03)^2 = 53.045K
 */

import Decimal from 'decimal.js';
import { toDecimal } from '../decimal-helpers';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';

export interface TuitionGrowthParams {
  tuitionBase: Decimal | number | string;
  cpiRate: Decimal | number | string; // e.g., 0.03 for 3%
  cpiFrequency: 1 | 2 | 3; // Apply CPI every 1, 2, or 3 years
  baseYear: number; // Starting year (usually 2023 or 2028)
  startYear: number;
  endYear: number;
}

export interface TuitionGrowthResult {
  year: number;
  tuition: Decimal;
  cpiPeriod: number; // Which CPI period this year belongs to (0, 1, 2, ...)
}

/**
 * Calculate tuition for a single year
 */
export function calculateTuitionForYear(
  tuitionBase: Decimal | number | string,
  cpiRate: Decimal | number | string,
  cpiFrequency: 1 | 2 | 3,
  baseYear: number,
  year: number
): Result<Decimal> {
  try {
    const base = toDecimal(tuitionBase);
    const rate = toDecimal(cpiRate);

    // Validate inputs - check for NaN first
    if (base.isNaN()) {
      return error('Base tuition is invalid (NaN)');
    }

    if (rate.isNaN()) {
      return error('CPI rate is invalid (NaN)');
    }

    if (base.isNegative() || base.isZero()) {
      return error('Base tuition must be positive');
    }

    if (rate.isNegative()) {
      return error('CPI rate cannot be negative');
    }

    if (year < baseYear) {
      return error('Year must be >= base year');
    }

    if (cpiFrequency !== 1 && cpiFrequency !== 2 && cpiFrequency !== 3) {
      return error('CPI frequency must be 1, 2, or 3 years');
    }

    // Calculate which CPI period this year belongs to
    // Period 0: baseYear to baseYear + frequency - 1
    // Period 1: baseYear + frequency to baseYear + 2*frequency - 1
    // etc.
    const yearsFromBase = year - baseYear;
    const cpiPeriod = Math.floor(yearsFromBase / cpiFrequency);

    // Calculate: tuition_base × (1 + cpi_rate)^period
    const escalationFactor = Decimal.add(1, rate).pow(cpiPeriod);
    
    // Validate escalation factor is not NaN
    if (escalationFactor.isNaN()) {
      return error('CPI escalation factor is invalid (NaN)');
    }
    
    const tuition = base.times(escalationFactor);

    // Validate tuition is not NaN
    if (tuition.isNaN()) {
      return error(`Tuition calculation resulted in NaN for year ${year}`);
    }

    return success(tuition);
  } catch (err) {
    return error(`Failed to calculate tuition: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Calculate tuition for multiple years
 */
export function calculateTuitionGrowth(
  params: TuitionGrowthParams
): Result<TuitionGrowthResult[]> {
  try {
    const { tuitionBase, cpiRate, cpiFrequency, baseYear, startYear, endYear } = params;

    // Validate year range
    if (startYear > endYear) {
      return error('Start year must be <= end year');
    }

    if (startYear < 2023 || endYear > 2052) {
      return error('Years must be between 2023 and 2052');
    }

    if (baseYear > startYear) {
      return error('Base year must be <= start year');
    }

    const base = toDecimal(tuitionBase);
    const rate = toDecimal(cpiRate);

    // Validate inputs - check for NaN first
    if (base.isNaN()) {
      return error('Base tuition is invalid (NaN)');
    }

    if (rate.isNaN()) {
      return error('CPI rate is invalid (NaN)');
    }

    if (base.isNegative() || base.isZero()) {
      return error('Base tuition must be positive');
    }

    if (rate.isNegative()) {
      return error('CPI rate cannot be negative');
    }

    if (cpiFrequency !== 1 && cpiFrequency !== 2 && cpiFrequency !== 3) {
      return error('CPI frequency must be 1, 2, or 3 years');
    }

    const results: TuitionGrowthResult[] = [];
    const escalationFactorBase = Decimal.add(1, rate);

    // Validate escalation factor is not NaN
    if (escalationFactorBase.isNaN()) {
      return error('CPI escalation factor is invalid (NaN)');
    }

    for (let year = startYear; year <= endYear; year++) {
      const yearsFromBase = year - baseYear;
      const cpiPeriod = Math.floor(yearsFromBase / cpiFrequency);
      const escalationFactor = escalationFactorBase.pow(cpiPeriod);
      const tuition = base.times(escalationFactor);

      // Validate tuition is not NaN before adding to results
      if (tuition.isNaN()) {
        return error(`Tuition calculation resulted in NaN for year ${year}`);
      }

      results.push({
        year,
        tuition,
        cpiPeriod,
      });
    }

    return success(results);
  } catch (err) {
    return error(`Failed to calculate tuition growth: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

