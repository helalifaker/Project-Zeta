/**
 * Planning Periods Detection Utilities
 *
 * This module provides utilities to detect which planning period a given year belongs to.
 *
 * Three periods:
 * 1. HISTORICAL (2023-2024): Uploaded actual data, read-only
 * 2. TRANSITION (2025-2027): Manual rent entry, 1850 student capacity cap, calculated staff costs
 * 3. DYNAMIC (2028-2052): Fully dynamic planning (already implemented)
 */

export type Period = 'HISTORICAL' | 'TRANSITION' | 'DYNAMIC';

/**
 * Get the planning period for a given year
 *
 * @param year - The year to check (must be between 2023 and 2052)
 * @returns The period type ('HISTORICAL', 'TRANSITION', or 'DYNAMIC')
 * @throws Error if year is outside the valid range (2023-2052)
 *
 * @example
 * getPeriodForYear(2023) // 'HISTORICAL'
 * getPeriodForYear(2026) // 'TRANSITION'
 * getPeriodForYear(2030) // 'DYNAMIC'
 */
export function getPeriodForYear(year: number): Period {
  if (year < 2023 || year > 2052) {
    throw new Error(`Invalid year: ${year}. Must be between 2023 and 2052.`);
  }

  if (year >= 2023 && year <= 2024) {
    return 'HISTORICAL';
  } else if (year >= 2025 && year <= 2027) {
    return 'TRANSITION';
  } else {
    // year >= 2028 && year <= 2052
    return 'DYNAMIC';
  }
}

/**
 * Check if a year is in the historical period (2023-2024)
 *
 * @param year - The year to check
 * @returns true if the year is 2023 or 2024
 *
 * @example
 * isHistoricalYear(2023) // true
 * isHistoricalYear(2024) // true
 * isHistoricalYear(2025) // false
 */
export function isHistoricalYear(year: number): boolean {
  return year >= 2023 && year <= 2024;
}

/**
 * Check if a year is in the transition period (2025-2027)
 *
 * @param year - The year to check
 * @returns true if the year is between 2025 and 2027 (inclusive)
 *
 * @example
 * isTransitionYear(2025) // true
 * isTransitionYear(2026) // true
 * isTransitionYear(2027) // true
 * isTransitionYear(2028) // false
 */
export function isTransitionYear(year: number): boolean {
  return year >= 2025 && year <= 2027;
}

/**
 * Check if a year is in the dynamic period (2028-2052)
 *
 * @param year - The year to check
 * @returns true if the year is between 2028 and 2052 (inclusive)
 *
 * @example
 * isDynamicYear(2028) // true
 * isDynamicYear(2030) // true
 * isDynamicYear(2052) // true
 * isDynamicYear(2027) // false
 */
export function isDynamicYear(year: number): boolean {
  return year >= 2028 && year <= 2052;
}

/**
 * Get all years for a specific period
 *
 * @param period - The period type
 * @returns Array of years in that period
 *
 * @example
 * getYearsForPeriod('HISTORICAL') // [2023, 2024]
 * getYearsForPeriod('TRANSITION') // [2025, 2026, 2027]
 */
export function getYearsForPeriod(period: Period): number[] {
  switch (period) {
    case 'HISTORICAL':
      return [2023, 2024];
    case 'TRANSITION':
      return [2025, 2026, 2027];
    case 'DYNAMIC':
      return Array.from({ length: 25 }, (_, i) => 2028 + i); // 2028-2052
    default:
      throw new Error(`Invalid period: ${period}`);
  }
}

/**
 * Get period boundaries
 *
 * @param period - The period type
 * @returns Object with startYear and endYear for the period
 *
 * @example
 * getPeriodBoundaries('HISTORICAL') // { startYear: 2023, endYear: 2024 }
 */
export function getPeriodBoundaries(period: Period): { startYear: number; endYear: number } {
  switch (period) {
    case 'HISTORICAL':
      return { startYear: 2023, endYear: 2024 };
    case 'TRANSITION':
      return { startYear: 2025, endYear: 2027 };
    case 'DYNAMIC':
      return { startYear: 2028, endYear: 2052 };
    default:
      throw new Error(`Invalid period: ${period}`);
  }
}

/**
 * Get a human-readable description of a period
 *
 * @param period - The period type
 * @returns A descriptive string explaining the period
 */
export function getPeriodDescription(period: Period): string {
  switch (period) {
    case 'HISTORICAL':
      return 'Historical period (2023-2024): Actual data from uploaded records, read-only';
    case 'TRANSITION':
      return 'Transition period (2025-2027): Manual rent entry, 1850 student capacity cap, calculated staff costs';
    case 'DYNAMIC':
      return 'Dynamic period (2028-2052): Fully dynamic planning with all calculations enabled';
    default:
      throw new Error(`Invalid period: ${period}`);
  }
}
