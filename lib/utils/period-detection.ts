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
 * FORMULA-004: Transition Period Capacity Cap
 *
 * Maximum student capacity during transition period (2025-2027)
 * Set to 1,850 due to temporary facility space constraints
 *
 * BUSINESS JUSTIFICATION:
 * - During transition years, the school operates in a temporary location
 * - The temporary facility has physical space limitations
 * - 1,850 students is the maximum that can be safely accommodated
 * - This cap applies proportionally across all curricula (FR + IB)
 *
 * CALCULATION METHOD:
 * When total projected students exceeds 1,850:
 * 1. Calculate total target across all curricula
 * 2. If total > 1,850, calculate reduction factor: 1,850 / total
 * 3. Apply reduction factor proportionally to each curriculum
 * 4. Proportions between curricula are maintained
 *
 * EXAMPLE:
 * Target: FR = 1,200, IB = 800 (total 2,000)
 * Cap: 1,850 students
 * Reduction factor: 1,850 / 2,000 = 0.925
 * Result: FR = 1,110 (1,200 × 0.925), IB = 740 (800 × 0.925)
 * Total: 1,850 ✓
 * FR:IB ratio maintained: 60:40 before and after
 *
 * See PRD Section on Transition Period for business requirements
 */
export const TRANSITION_CAPACITY_CAP = 1850;

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
      return `Transition period (2025-2027): Manual rent entry, ${TRANSITION_CAPACITY_CAP} student capacity cap, calculated staff costs`;
    case 'DYNAMIC':
      return 'Dynamic period (2028-2052): Fully dynamic planning with all calculations enabled';
    default:
      throw new Error(`Invalid period: ${period}`);
  }
}

/**
 * FORMULA-004: Apply Transition Capacity Cap
 *
 * Calculates enrollment capacity during transition period (2025-2027)
 * with proportional reduction if total exceeds the cap.
 *
 * BUSINESS RULE: Capacity is capped at 1,850 students during transition
 * due to space constraints in temporary location.
 *
 * METHOD: Proportional reduction from target capacity
 * - If target capacity > 1,850: reduce proportionally across curricula
 * - If target capacity ≤ 1,850: no reduction needed
 * - Curriculum proportions are always maintained
 *
 * @param curricula - Array of curriculum targets with student counts
 * @returns Array of adjusted student counts that respect the cap
 *
 * @example
 * // Total exceeds cap - apply proportional reduction
 * const result = applyTransitionCapacityCap([
 *   { curriculumType: 'FR', students: 1200 },
 *   { curriculumType: 'IB', students: 800 }
 * ]);
 * // Returns: [{ curriculumType: 'FR', students: 1110 }, { curriculumType: 'IB', students: 740 }]
 * // Total: 1850 (capped), FR:IB ratio maintained (60:40)
 *
 * @example
 * // Total under cap - no reduction
 * const result = applyTransitionCapacityCap([
 *   { curriculumType: 'FR', students: 1000 },
 *   { curriculumType: 'IB', students: 600 }
 * ]);
 * // Returns: [{ curriculumType: 'FR', students: 1000 }, { curriculumType: 'IB', students: 600 }]
 * // Total: 1600 (under cap), no changes
 */
export function applyTransitionCapacityCap<T extends { students: number }>(curricula: T[]): T[] {
  // Step 1: Calculate total target capacity
  const totalTarget = curricula.reduce((sum, curr) => sum + curr.students, 0);

  // Step 2: Check if reduction needed
  if (totalTarget <= TRANSITION_CAPACITY_CAP) {
    // Under cap - no reduction needed
    return curricula;
  }

  // Step 3: Calculate proportional reduction factor
  const reductionFactor = TRANSITION_CAPACITY_CAP / totalTarget;

  // Step 4: Apply reduction to all curricula (maintain proportions)
  return curricula.map((curr) => ({
    ...curr,
    students: Math.floor(curr.students * reductionFactor),
  }));
}

/**
 * FORMULA-004: Validate Transition Capacity
 *
 * Validates that total student count respects the transition capacity cap
 *
 * @param totalStudents - Total student count to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * validateTransitionCapacity(1600); // { valid: true }
 * validateTransitionCapacity(1850); // { valid: true }
 * validateTransitionCapacity(2000); // { valid: false, error: "Exceeds cap..." }
 */
export function validateTransitionCapacity(totalStudents: number): {
  valid: boolean;
  error?: string;
  cap: number;
} {
  if (totalStudents <= TRANSITION_CAPACITY_CAP) {
    return { valid: true, cap: TRANSITION_CAPACITY_CAP };
  }

  return {
    valid: false,
    error:
      `Total students (${totalStudents}) exceeds transition capacity cap (${TRANSITION_CAPACITY_CAP}). ` +
      `Capacity will be reduced proportionally across curricula.`,
    cap: TRANSITION_CAPACITY_CAP,
  };
}
