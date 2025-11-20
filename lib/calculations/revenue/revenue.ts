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
  otherRevenueByYear?: Array<{ year: number; amount: Decimal | number | string }>;
}

export interface RevenueResult {
  year: number;
  tuition: Decimal;
  students: number;
  revenue: Decimal; // Curriculum revenue (tuition × students)
  otherRevenue: Decimal; // Additional revenue sources
  totalRevenue: Decimal; // revenue + otherRevenue
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

    // Validate inputs exist and are arrays
    if (!tuitionByYear || !Array.isArray(tuitionByYear)) {
      return error('Tuition data must be an array');
    }

    if (!studentsByYear || !Array.isArray(studentsByYear)) {
      return error('Students data must be an array');
    }

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

    // Create a map of other revenue by year for quick lookup
    const otherRevenueMap = new Map<number, Decimal>();
    if (params.otherRevenueByYear) {
      for (const item of params.otherRevenueByYear) {
        const amount = toDecimal(item.amount);
        if (amount.isNegative()) {
          return error(`Other revenue for year ${item.year} cannot be negative`);
        }
        otherRevenueMap.set(item.year, amount);
      }
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

      // Calculate curriculum revenue: tuition × students
      const revenue = safeMultiply(tuitionItem.tuition, students);

      // Get other revenue for this year (default to zero if not provided)
      const otherRevenue = otherRevenueMap.get(tuitionItem.year) || new Decimal(0);

      // Calculate total revenue: curriculum revenue + other revenue
      const totalRevenue = revenue.plus(otherRevenue);

      results.push({
        year: tuitionItem.year,
        tuition: tuitionItem.tuition,
        students,
        revenue, // Curriculum revenue only
        otherRevenue, // Additional revenue sources
        totalRevenue, // Total revenue (curriculum + other)
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
    // Use totalRevenue if available, otherwise fall back to revenue
    const total = result.data.reduce(
      (sum, item) => sum.plus(item.totalRevenue || item.revenue),
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

    // Use totalRevenue if available, otherwise fall back to revenue
    const total = result.data.reduce(
      (sum, item) => sum.plus(item.totalRevenue || item.revenue),
      new Decimal(0)
    );

    const average = total.div(result.data.length);

    return success(average);
  } catch (err) {
    return error(`Failed to calculate average revenue: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

