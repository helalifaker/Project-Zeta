import Decimal from 'decimal.js';

/**
 * Calculate staff cost for a transition year using backward deflation from 2028 base.
 *
 * Formula: staffCost(year) = base2028 / (1 + cpiRate)^(2028 - year)
 *
 * Example:
 * - base2028 = 10,000,000
 * - cpiRate = 0.03 (3%)
 * - For 2025: 10M / (1.03^3) = 10M / 1.092727 = 9,151,417
 *
 * @param year - The transition year (2025-2027)
 * @param base2028 - Staff cost baseline for year 2028
 * @param cpiRate - Annual CPI inflation rate (e.g., 0.03 for 3%)
 * @returns Deflated staff cost for the given year
 */
export function calculateTransitionStaffCost(
  year: number,
  base2028: Decimal,
  cpiRate: number
): Decimal {
  const yearsFromBase = 2028 - year;

  // If year is 2028 or later, return base value
  if (yearsFromBase <= 0) {
    return base2028;
  }

  // Calculate deflation factor: (1 + cpiRate)^yearsFromBase
  const deflationFactor = new Decimal(1 + cpiRate).pow(yearsFromBase);

  // Deflate base2028 backwards to target year
  return base2028.dividedBy(deflationFactor);
}

/**
 * Validate that a year is within the transition period range (2025-2027)
 *
 * @param year - Year to validate
 * @returns True if year is in transition period
 */
export function isValidTransitionYear(year: number): boolean {
  return year >= 2025 && year <= 2027;
}

/**
 * Calculate transition rent from historical 2024 base with adjustment percentage.
 *
 * Formula: transitionRent = historical2024Rent × (1 + adjustmentPercent / 100)
 *
 * Example:
 * - historical2024Rent = 1,000,000
 * - adjustmentPercent = 10
 * - Result: 1,000,000 × 1.10 = 1,100,000
 *
 * @param historical2024Rent - Rent paid in 2024 (from historical_actuals)
 * @param adjustmentPercent - Percentage adjustment (can be negative)
 * @returns Calculated transition rent
 */
export function calculateTransitionRent(
  historical2024Rent: Decimal,
  adjustmentPercent: number
): Decimal {
  return historical2024Rent.times(1 + adjustmentPercent / 100);
}

/**
 * Get all transition years as an array
 *
 * @returns Array [2025, 2026, 2027]
 */
export function getTransitionYears(): number[] {
  return [2025, 2026, 2027];
}

/**
 * Validate transition settings values
 *
 * @param capacityCap - Maximum enrollment capacity
 * @param rentAdjustmentPercent - Rent adjustment percentage
 * @returns Validation result with error message if invalid
 */
export function validateTransitionSettings(
  capacityCap: number,
  rentAdjustmentPercent: number
): { valid: boolean; error?: string } {
  if (capacityCap <= 0) {
    return { valid: false, error: 'Capacity cap must be positive' };
  }

  if (capacityCap > 5000) {
    return { valid: false, error: 'Capacity cap seems unreasonably high (>5000)' };
  }

  if (rentAdjustmentPercent < -100) {
    return { valid: false, error: 'Rent adjustment cannot be less than -100%' };
  }

  if (rentAdjustmentPercent > 1000) {
    return { valid: false, error: 'Rent adjustment seems unreasonably high (>1000%)' };
  }

  return { valid: true };
}
