/**
 * Revenue Calculation
 * Calculates revenue as tuition × students per curriculum
 *
 * Formula: revenue(t) = tuition(t) × students(t)
 *
 * CRITICAL BUSINESS RULE: Revenue = Tuition × Students (automatic calculation)
 * Tuition and Rent are INDEPENDENT (no automatic calculation linking them)
 */

import Decimal from 'decimal.js';
import { toDecimal, safeMultiply } from '../decimal-helpers';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';
import type { TuitionGrowthResult } from './tuition-growth';

export interface RevenueParams {
  tuitionByYear: TuitionGrowthResult[];
  studentsByYear: Array<{ year: number; students: number }>;
}

export interface RevenueResult {
  year: number;
  tuition: Decimal;
  students: number;
  revenue: Decimal;
}

/**
 * Calculate revenue for a single year
 */
export function calculateRevenueForYear(
  tuition: Decimal | number | string,
  students: number
): Result<Decimal> {
  try {
    const tuitionDecimal = toDecimal(tuition);

    // Validate inputs
    if (tuitionDecimal.isNegative()) {
      return error('Tuition cannot be negative');
    }

    if (students < 0) {
      return error('Students cannot be negative');
    }

    // Calculate: tuition × students
    const revenue = safeMultiply(tuitionDecimal, students);

    return success(revenue);
  } catch (err) {
    return error(`Failed to calculate revenue: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Calculate revenue for multiple years
 * Matches tuition and students data by year
 */
export function calculateRevenue(
  params: RevenueParams
): Result<RevenueResult[]> {
  try {
    const { tuitionByYear, studentsByYear } = params;

    if (tuitionByYear.length === 0) {
      return error('Tuition data is required');
    }

    if (studentsByYear.length === 0) {
      return error('Students data is required');
    }

    const results: RevenueResult[] = [];

    // Create a map of students by year for quick lookup
    const studentsMap = new Map<number, number>();
    for (const item of studentsByYear) {
      studentsMap.set(item.year, item.students);
    }

    for (const tuitionItem of tuitionByYear) {
      const students = studentsMap.get(tuitionItem.year);

      if (students === undefined) {
        return error(`Students data not found for year ${tuitionItem.year}`);
      }

      // Validate students
      if (students < 0) {
        return error(`Students for year ${tuitionItem.year} cannot be negative`);
      }

      // Calculate revenue: tuition × students
      const revenue = safeMultiply(tuitionItem.tuition, students);

      results.push({
        year: tuitionItem.year,
        tuition: tuitionItem.tuition,
        students,
        revenue,
      });
    }

    return success(results);
  } catch (err) {
    return error(`Failed to calculate revenue: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Calculate total revenue over a period
 */
export function calculateTotalRevenue(
  params: RevenueParams
): Result<Decimal> {
  const result = calculateRevenue(params);

  if (!result.success) {
    return result;
  }

  try {
    const total = result.data.reduce(
      (sum, item) => sum.plus(item.revenue),
      new Decimal(0)
    );

    return success(total);
  } catch (err) {
    return error(`Failed to calculate total revenue: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Calculate average revenue per year
 */
export function calculateAverageRevenue(
  params: RevenueParams
): Result<Decimal> {
  const result = calculateRevenue(params);

  if (!result.success) {
    return result;
  }

  try {
    if (result.data.length === 0) {
      return error('No revenue data available');
    }

    const total = result.data.reduce(
      (sum, item) => sum.plus(item.revenue),
      new Decimal(0)
    );

    const average = total.div(result.data.length);

    return success(average);
  } catch (err) {
    return error(`Failed to calculate average revenue: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

