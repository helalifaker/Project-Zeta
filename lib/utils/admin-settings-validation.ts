/**
 * Admin Settings Validation Utilities
 *
 * FORMULA-001: Staff Ratio Data Validation
 *
 * This module provides validation for admin_settings values to ensure
 * data integrity and prevent calculation errors.
 *
 * Key validations:
 * - teacherStudentRatio: MUST be decimal (0-1), NOT percentage
 * - Other ratios and rates: Similar decimal validation
 */

import Decimal from 'decimal.js';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  correctedValue?: number;
}

/**
 * FORMULA-001: Validate Teacher-Student Ratio
 *
 * Enforces that teacher-student ratio is stored as decimal (0-1), not percentage.
 *
 * VALID INPUTS:
 * - 0.0714 (decimal for 7.14%)
 * - 0.05 (decimal for 5%)
 * - 0.1 (decimal for 10%)
 *
 * INVALID INPUTS:
 * - 7.14 (percentage - should be 0.0714)
 * - 5 (percentage - should be 0.05)
 * - 1.5 (exceeds 100%)
 * - -0.05 (negative not allowed)
 *
 * @param value - The ratio value to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * validateTeacherStudentRatio(0.0714); // { valid: true }
 * validateTeacherStudentRatio(7.14);   // { valid: false, error: "...", correctedValue: 0.0714 }
 * validateTeacherStudentRatio(-0.05);  // { valid: false, error: "..." }
 */
export function validateTeacherStudentRatio(value: number | string | Decimal): ValidationResult {
  // Convert to Decimal for precise validation
  let decimal: Decimal;
  try {
    decimal = new Decimal(value);
  } catch {
    return {
      valid: false,
      error: 'Invalid number format. Must be a valid decimal number.',
    };
  }

  // Check if NaN
  if (decimal.isNaN()) {
    return {
      valid: false,
      error: 'Invalid number (NaN). Must be a valid decimal number.',
    };
  }

  // Check for negative values
  if (decimal.isNegative()) {
    return {
      valid: false,
      error: 'Teacher-student ratio cannot be negative. Must be between 0 and 1.',
    };
  }

  // FORMULA-001: Validate range (0-1 for decimal)
  if (decimal.greaterThan(1)) {
    // User likely entered percentage format (e.g., 7.14 instead of 0.0714)
    // Provide corrected value
    const correctedValue = decimal.dividedBy(100).toNumber();

    if (correctedValue > 1) {
      // Even after correction, still > 1 (e.g., 150 → 1.5)
      return {
        valid: false,
        error: `Teacher-student ratio must be between 0 and 1. Got: ${decimal.toNumber()}. This represents ${decimal.times(100).toNumber()}% which exceeds 100%.`,
      };
    }

    return {
      valid: false,
      error:
        `Teacher-student ratio must be between 0 and 1 (decimal format). Got: ${decimal.toNumber()}. ` +
        `Did you mean ${correctedValue.toFixed(4)}? (Enter as decimal, e.g., 0.0714 for 7.14%, not 7.14)`,
      correctedValue,
    };
  }

  // Valid: between 0 and 1
  return { valid: true };
}

/**
 * FORMULA-001: Format Teacher-Student Ratio for Display
 *
 * Converts decimal ratio to human-readable format
 *
 * @param value - Decimal ratio (0-1)
 * @returns Formatted string
 *
 * @example
 * formatTeacherStudentRatio(0.0714); // "7.14% (1 teacher per 14 students)"
 * formatTeacherStudentRatio(0.05);   // "5.00% (1 teacher per 20 students)"
 */
export function formatTeacherStudentRatio(value: number | string | Decimal): string {
  const decimal = new Decimal(value);
  const percentage = decimal.times(100);
  const studentsPerTeacher = decimal.greaterThan(0)
    ? new Decimal(1).dividedBy(decimal)
    : new Decimal(0);

  return `${percentage.toFixed(2)}% (1 teacher per ${studentsPerTeacher.toFixed(0)} students)`;
}

/**
 * FORMULA-001: Convert Percentage to Decimal
 *
 * Helper to convert user input from percentage to decimal format
 *
 * @param percentage - Percentage value (e.g., 7.14)
 * @returns Decimal value (e.g., 0.0714)
 *
 * @example
 * percentageToDecimal(7.14); // 0.0714
 * percentageToDecimal(5);    // 0.05
 */
export function percentageToDecimal(percentage: number): number {
  return new Decimal(percentage).dividedBy(100).toNumber();
}

/**
 * FORMULA-001: Convert Decimal to Percentage
 *
 * Helper to convert stored decimal to percentage for display
 *
 * @param decimal - Decimal value (e.g., 0.0714)
 * @returns Percentage value (e.g., 7.14)
 *
 * @example
 * decimalToPercentage(0.0714); // 7.14
 * decimalToPercentage(0.05);   // 5.00
 */
export function decimalToPercentage(decimal: number): number {
  return new Decimal(decimal).times(100).toNumber();
}

/**
 * Validate Generic Ratio/Rate (0-1 range)
 *
 * Generic validation for any ratio or rate that should be stored as decimal
 *
 * @param value - The value to validate
 * @param fieldName - Name of the field (for error messages)
 * @param maxValue - Maximum allowed value (default: 1.0)
 * @returns Validation result
 */
export function validateRatio(
  value: number | string | Decimal,
  fieldName: string,
  maxValue = 1.0
): ValidationResult {
  let decimal: Decimal;
  try {
    decimal = new Decimal(value);
  } catch {
    return {
      valid: false,
      error: `Invalid ${fieldName} format. Must be a valid decimal number.`,
    };
  }

  if (decimal.isNaN()) {
    return {
      valid: false,
      error: `Invalid ${fieldName} (NaN). Must be a valid decimal number.`,
    };
  }

  if (decimal.isNegative()) {
    return {
      valid: false,
      error: `${fieldName} cannot be negative. Must be between 0 and ${maxValue}.`,
    };
  }

  if (decimal.greaterThan(maxValue)) {
    return {
      valid: false,
      error: `${fieldName} must be between 0 and ${maxValue}. Got: ${decimal.toNumber()}.`,
    };
  }

  return { valid: true };
}

/**
 * Validate Admin Settings Value
 *
 * Main validation function that routes to appropriate validator based on key
 *
 * @param key - The settings key
 * @param value - The value to validate
 * @returns Validation result
 */
export function validateAdminSettingValue(key: string, value: unknown): ValidationResult {
  // Route to specific validators based on key
  switch (key) {
    case 'teacherStudentRatio':
      return validateTeacherStudentRatio(value as number);

    case 'zakatRate':
      return validateRatio(value as number, 'Zakat rate', 0.1); // Max 10%

    case 'debt_interest_rate':
      return validateRatio(value as number, 'Debt interest rate', 0.3); // Max 30%

    case 'bank_deposit_interest_rate':
      return validateRatio(value as number, 'Bank deposit interest rate', 0.2); // Max 20%

    default:
      // No specific validation for this key
      return { valid: true };
  }
}
