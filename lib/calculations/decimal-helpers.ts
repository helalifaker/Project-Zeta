/**
 * Decimal.js Helper Utilities
 * Financial calculations using Decimal.js for precision
 */

import Decimal from 'decimal.js';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Convert number or string to Decimal
 */
export function toDecimal(value: number | string | Decimal): Decimal {
  if (value instanceof Decimal) {
    return value;
  }
  return new Decimal(value);
}

/**
 * Format money value with currency
 */
export function formatMoney(value: Decimal | number | string, currency: string = 'SAR'): string {
  const decimal = toDecimal(value);
  const formatted = decimal.toNumber().toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${currency}`;
}

/**
 * Format money in millions (e.g., "1.5M SAR")
 */
export function formatMoneyMillions(value: Decimal | number | string, currency: string = 'SAR'): string {
  const decimal = toDecimal(value);
  const millions = decimal.div(1_000_000);
  return `${millions.toFixed(2)}M ${currency}`;
}

/**
 * Safe addition (handles null/undefined)
 */
export function safeAdd(
  a: Decimal | number | string | null | undefined,
  b: Decimal | number | string | null | undefined
): Decimal {
  const aDecimal = a != null ? toDecimal(a) : new Decimal(0);
  const bDecimal = b != null ? toDecimal(b) : new Decimal(0);
  return aDecimal.plus(bDecimal);
}

/**
 * Safe subtraction (handles null/undefined)
 */
export function safeSubtract(
  a: Decimal | number | string | null | undefined,
  b: Decimal | number | string | null | undefined
): Decimal {
  const aDecimal = a != null ? toDecimal(a) : new Decimal(0);
  const bDecimal = b != null ? toDecimal(b) : new Decimal(0);
  return aDecimal.minus(bDecimal);
}

/**
 * Safe multiplication (handles null/undefined)
 */
export function safeMultiply(
  a: Decimal | number | string | null | undefined,
  b: Decimal | number | string | null | undefined
): Decimal {
  const aDecimal = a != null ? toDecimal(a) : new Decimal(0);
  const bDecimal = b != null ? toDecimal(b) : new Decimal(0);
  return aDecimal.times(bDecimal);
}

/**
 * Safe division (handles null/undefined, division by zero)
 */
export function safeDivide(
  a: Decimal | number | string | null | undefined,
  b: Decimal | number | string | null | undefined
): Decimal {
  const aDecimal = a != null ? toDecimal(a) : new Decimal(0);
  const bDecimal = b != null ? toDecimal(b) : new Decimal(0);
  
  if (bDecimal.isZero()) {
    return new Decimal(0);
  }
  
  return aDecimal.div(bDecimal);
}

/**
 * Calculate percentage of value
 */
export function percentageOf(value: Decimal | number | string, percent: Decimal | number | string): Decimal {
  const valueDecimal = toDecimal(value);
  const percentDecimal = toDecimal(percent);
  return valueDecimal.times(percentDecimal).div(100);
}

/**
 * Calculate percentage change
 */
export function percentageChange(
  oldValue: Decimal | number | string,
  newValue: Decimal | number | string
): Decimal {
  const old = toDecimal(oldValue);
  const newVal = toDecimal(newValue);
  
  if (old.isZero()) {
    return new Decimal(0);
  }
  
  return newVal.minus(old).div(old).times(100);
}

/**
 * Round to specified decimal places
 */
export function round(value: Decimal | number | string, places: number = 2): Decimal {
  return toDecimal(value).toDecimalPlaces(places);
}

/**
 * Check if value is zero (within tolerance)
 */
export function isZero(value: Decimal | number | string, tolerance: number = 0.01): boolean {
  return toDecimal(value).abs().lessThanOrEqualTo(tolerance);
}

/**
 * Check if value is positive
 */
export function isPositive(value: Decimal | number | string): boolean {
  return toDecimal(value).isPositive();
}

/**
 * Check if value is negative
 */
export function isNegative(value: Decimal | number | string): boolean {
  return toDecimal(value).isNegative();
}

/**
 * Get maximum of two values
 */
export function max(
  a: Decimal | number | string,
  b: Decimal | number | string
): Decimal {
  const aDecimal = toDecimal(a);
  const bDecimal = toDecimal(b);
  return Decimal.max(aDecimal, bDecimal);
}

/**
 * Get minimum of two values
 */
export function min(
  a: Decimal | number | string,
  b: Decimal | number | string
): Decimal {
  const aDecimal = toDecimal(a);
  const bDecimal = toDecimal(b);
  return Decimal.min(aDecimal, bDecimal);
}

