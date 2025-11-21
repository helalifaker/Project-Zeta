/**
 * Transition Period Calculation Helpers
 *
 * Purpose: Provide helper functions for transition period (2025-2027) calculations
 * These functions integrate with the existing calculation engine to use transition
 * data from the database without changing core calculation formulas.
 *
 * Key Features:
 * - Fetch transition year data from database
 * - Calculate transition rent from 2024 historical + adjustment
 * - Calculate weighted average tuition for revenue calculations
 * - Maintain backward compatibility with fallbacks
 */

import Decimal from 'decimal.js';
import { PrismaClient } from '@prisma/client';
import { success, error, type Result } from '@/types/result';
import { toDecimal } from '../decimal-helpers';
import { getTransitionYear, getTransitionSettings } from '@/services/transition/read';
import { calculateTransitionRent } from '@/services/transition/helpers';

const prisma = new PrismaClient();

/**
 * Transition Period Data - fetched from database
 */
export interface TransitionPeriodData {
  year: number;
  targetEnrollment: number;
  staffCostBase: Decimal;
  rent: Decimal; // Calculated from 2024 historical + adjustment

  // NEW FIELDS from transition_year_data schema
  averageTuitionPerStudent?: Decimal | null;
  otherRevenue?: Decimal | null;
  staffCostGrowthPercent?: Decimal | null;
  rentGrowthPercent?: Decimal | null;
}

/**
 * Transition Settings - global admin settings
 */
export interface TransitionSettings {
  capacityCap: number;
  rentAdjustmentPercent: number;
}

/**
 * Get transition data for a specific year from database
 *
 * This function fetches the transition year data and calculates the rent
 * based on 2024 historical rent + adjustment percentage.
 *
 * @param year - Transition year (2025-2027)
 * @param versionId - Version ID for fetching historical rent
 * @returns Result with complete transition period data including calculated rent
 */
export async function getTransitionPeriodData(
  year: number,
  versionId: string
): Promise<Result<TransitionPeriodData>> {
  try {
    // Validate year range
    if (year < 2025 || year > 2027) {
      return error(`Invalid transition year: ${year}. Must be 2025-2027`, 'INVALID_YEAR');
    }

    // Fetch transition year data
    const yearDataResult = await getTransitionYear(year);
    if (!yearDataResult.success) {
      return error(
        `Failed to fetch transition year ${year}: ${yearDataResult.error}`,
        'TRANSITION_DATA_ERROR'
      );
    }

    // Fetch transition settings
    const settingsResult = await getTransitionSettings();
    if (!settingsResult.success) {
      return error(
        `Failed to fetch transition settings: ${settingsResult.error}`,
        'TRANSITION_SETTINGS_ERROR'
      );
    }

    const yearData = yearDataResult.data;
    const settings = settingsResult.data;

    // Calculate rent from 2024 historical + adjustment
    const rentResult = await calculateTransitionRentFromHistorical(
      versionId,
      settings.rentAdjustmentPercent
    );

    if (!rentResult.success) {
      return error(
        `Failed to calculate transition rent: ${rentResult.error}`,
        'RENT_CALCULATION_ERROR'
      );
    }

    return success({
      year,
      targetEnrollment: yearData.targetEnrollment,
      staffCostBase: new Decimal(yearData.staffCostBase.toString()),
      rent: rentResult.data,
    });
  } catch (err) {
    return error(
      `Error fetching transition data for year ${year}: ${err instanceof Error ? err.message : 'Unknown error'}`,
      'TRANSITION_DATA_ERROR'
    );
  }
}

/**
 * Get transition data for all years (2025-2027)
 *
 * This is a convenience function that fetches data for all three transition years
 * in a single call, useful for pre-loading data in the calculation engine.
 *
 * @param versionId - Version ID for fetching historical rent
 * @returns Result with array of transition period data for all years
 */
export async function getAllTransitionPeriodData(
  versionId: string
): Promise<Result<TransitionPeriodData[]>> {
  try {
    const years = [2025, 2026, 2027];
    const results: TransitionPeriodData[] = [];

    for (const year of years) {
      const dataResult = await getTransitionPeriodData(year, versionId);
      if (!dataResult.success) {
        return error(
          `Failed to fetch transition data for year ${year}: ${dataResult.error}`,
          'TRANSITION_DATA_ERROR'
        );
      }
      results.push(dataResult.data);
    }

    return success(results);
  } catch (err) {
    return error(
      `Error fetching all transition data: ${err instanceof Error ? err.message : 'Unknown error'}`,
      'TRANSITION_DATA_ERROR'
    );
  }
}

/**
 * Calculate transition rent from 2024 historical rent + adjustment percentage
 *
 * Formula: transitionRent = historical2024Rent × (1 + adjustmentPercent / 100)
 *
 * @param versionId - Version ID for fetching historical rent
 * @param adjustmentPercent - Rent adjustment percentage (e.g., 10 for +10%)
 * @returns Result with calculated transition rent (same for all years 2025-2027)
 */
export async function calculateTransitionRentFromHistorical(
  versionId: string,
  adjustmentPercent: number
): Promise<Result<Decimal>> {
  try {
    // Fetch 2024 historical rent
    const historical2024 = await prisma.historical_actuals.findFirst({
      where: {
        versionId,
        year: 2024,
      },
      select: {
        schoolRent: true,
      },
    });

    if (!historical2024) {
      return error(
        'No historical data found for year 2024. Transition rent requires 2024 baseline.',
        'HISTORICAL_DATA_NOT_FOUND'
      );
    }

    const rent2024 = new Decimal(historical2024.schoolRent.toString());

    // Calculate adjusted rent using helper function
    const transitionRent = calculateTransitionRent(rent2024, adjustmentPercent);

    return success(transitionRent);
  } catch (err) {
    return error(
      `Failed to calculate transition rent: ${err instanceof Error ? err.message : 'Unknown error'}`,
      'RENT_CALCULATION_ERROR'
    );
  }
}

/**
 * Calculate weighted average tuition from 2024 historical data
 *
 * This is used for transition period revenue calculation since we have
 * total enrollment (no FR/IB split) during transition.
 *
 * Formula:
 * avgTuition2024 = (frRevenue2024 + ibRevenue2024) / (frEnrollment2024 + ibEnrollment2024)
 * avgTuitionGrown = avgTuition2024 × (1 + cpiRate)^(year - 2024)
 *
 * @param versionId - Version ID for fetching historical data
 * @param year - Transition year (2025-2027)
 * @param cpiRate - Annual CPI rate (e.g., 0.03 for 3%)
 * @returns Result with weighted average tuition for the year
 */
export async function calculateTransitionWeightedAverageTuition(
  versionId: string,
  year: number,
  cpiRate: Decimal | number | string
): Promise<Result<Decimal>> {
  try {
    // Validate year range
    if (year < 2025 || year > 2027) {
      return error(`Invalid transition year: ${year}. Must be 2025-2027`, 'INVALID_YEAR');
    }

    // Fetch 2024 historical data (P&L statement fields)
    const historical2024 = await prisma.historical_actuals.findFirst({
      where: {
        versionId,
        year: 2024,
      },
      select: {
        tuitionFrenchCurriculum: true,
        tuitionIB: true,
        totalRevenues: true,
      },
    });

    if (!historical2024) {
      return error(
        'No historical data found for year 2024. Cannot calculate weighted average tuition.',
        'HISTORICAL_DATA_NOT_FOUND'
      );
    }

    // Calculate total tuition revenue (FR + IB)
    const frRevenue = new Decimal(historical2024.tuitionFrenchCurriculum.toString());
    const ibRevenue = new Decimal(historical2024.tuitionIB.toString());
    const totalTuitionRevenue = frRevenue.plus(ibRevenue);

    // Fetch enrollment data from curriculum_plans for 2024
    const curricula = await prisma.curriculum_plans.findMany({
      where: { versionId },
      select: {
        curriculumType: true,
        studentsProjection: true,
      },
    });

    if (curricula.length === 0) {
      return error(
        'No curriculum data found for version. Cannot calculate enrollment.',
        'CURRICULUM_DATA_NOT_FOUND'
      );
    }

    // Extract 2024 enrollment from studentsProjection JSON
    let frEnrollment = 0;
    let ibEnrollment = 0;

    for (const curriculum of curricula) {
      const projection = curriculum.studentsProjection as Array<{ year: number; students: number }>;
      const year2024Data = projection.find((p) => p.year === 2024);

      if (year2024Data) {
        if (curriculum.curriculumType === 'FR') {
          frEnrollment = year2024Data.students;
        } else if (curriculum.curriculumType === 'IB') {
          ibEnrollment = year2024Data.students;
        }
      }
    }

    const totalEnrollment = frEnrollment + ibEnrollment;

    if (totalEnrollment === 0) {
      return error(
        'Total enrollment for 2024 is zero. Cannot calculate average tuition.',
        'ZERO_ENROLLMENT'
      );
    }

    // Calculate weighted average tuition for 2024
    const avgTuition2024 = totalTuitionRevenue.dividedBy(totalEnrollment);

    // Apply CPI growth from 2024 to target year
    const cpiRateDecimal = toDecimal(cpiRate);
    const yearsFromBase = year - 2024;
    const cpiGrowthFactor = new Decimal(1).plus(cpiRateDecimal).pow(yearsFromBase);
    const avgTuitionGrown = avgTuition2024.times(cpiGrowthFactor);

    return success(avgTuitionGrown);
  } catch (err) {
    return error(
      `Failed to calculate weighted average tuition: ${err instanceof Error ? err.message : 'Unknown error'}`,
      'TUITION_CALCULATION_ERROR'
    );
  }
}

/**
 * Calculate transition period revenue
 *
 * Formula: revenue = weightedAverageTuition × totalEnrollment
 *
 * @param versionId - Version ID
 * @param year - Transition year (2025-2027)
 * @param totalEnrollment - Total student enrollment (from transition_year_data)
 * @param cpiRate - Annual CPI rate
 * @returns Result with calculated revenue for the year
 */
export async function calculateTransitionRevenue(
  versionId: string,
  year: number,
  totalEnrollment: number,
  cpiRate: Decimal | number | string
): Promise<Result<Decimal>> {
  try {
    // Validate inputs
    if (totalEnrollment < 0) {
      return error('Total enrollment cannot be negative', 'INVALID_ENROLLMENT');
    }

    // Calculate weighted average tuition
    const tuitionResult = await calculateTransitionWeightedAverageTuition(versionId, year, cpiRate);

    if (!tuitionResult.success) {
      return error(
        `Failed to calculate tuition: ${tuitionResult.error}`,
        'TUITION_CALCULATION_ERROR'
      );
    }

    // Calculate revenue: tuition × enrollment
    const revenue = tuitionResult.data.times(totalEnrollment);

    return success(revenue);
  } catch (err) {
    return error(
      `Failed to calculate transition revenue: ${err instanceof Error ? err.message : 'Unknown error'}`,
      'REVENUE_CALCULATION_ERROR'
    );
  }
}

/**
 * Check if transition data is available for calculation
 *
 * This function performs a quick check to determine if the calculation engine
 * should attempt to use transition data or fall back to the old logic.
 *
 * @param versionId - Version ID
 * @returns Result with boolean indicating if transition data is available
 */
export async function isTransitionDataAvailable(versionId: string): Promise<Result<boolean>> {
  try {
    // Check if transition year data exists
    const transitionYearCount = await prisma.transition_year_data.count();

    if (transitionYearCount !== 3) {
      return success(false); // Need all 3 years
    }

    // Check if 2024 historical data exists (required for rent and tuition calculations)
    const historical2024 = await prisma.historical_actuals.findFirst({
      where: { versionId, year: 2024 },
    });

    if (!historical2024) {
      return success(false);
    }

    // Check if admin settings exist
    const settings = await prisma.admin_settings.findFirst();

    if (!settings) {
      return success(false);
    }

    return success(true);
  } catch (err) {
    console.error('Error checking transition data availability:', err);
    return success(false); // Default to false on error (use fallback)
  }
}

/**
 * Fetch base year 2024 staff costs for transition calculations
 *
 * Tries admin_settings.transitionStaffCostBase2024 first, then falls back to
 * historical_actuals.salariesAndRelatedCosts for year 2024.
 *
 * @param versionId - Optional version ID (required for historical_actuals fallback)
 * @returns Decimal value of 2024 staff costs
 * @throws Error if base year 2024 staff costs not found in either source
 */
export async function getStaffCostBase2024(versionId?: string): Promise<Decimal> {
  // Try admin_settings first
  const settings = await prisma.admin_settings.findFirst({
    where: { key: 'general' },
    select: { transitionStaffCostBase2024: true },
  });

  if (settings?.transitionStaffCostBase2024) {
    return new Decimal(settings.transitionStaffCostBase2024.toString());
  }

  // Fallback to historical_actuals (requires versionId)
  if (!versionId) {
    throw new Error(
      'Base year 2024 staff costs not found in admin_settings and no versionId provided for historical_actuals fallback'
    );
  }

  const historical = await prisma.historical_actuals.findFirst({
    where: {
      versionId,
      year: 2024,
    },
    select: { salariesAndRelatedCosts: true },
  });

  if (historical) {
    return new Decimal(historical.salariesAndRelatedCosts.toString());
  }

  throw new Error('Base year 2024 staff costs not found in admin_settings or historical_actuals');
}

/**
 * Fetch base year 2024 rent for transition calculations
 *
 * Tries admin_settings.transitionRentBase2024 first, then falls back to
 * historical_actuals.schoolRent for year 2024.
 *
 * @param versionId - Optional version ID (required for historical_actuals fallback)
 * @returns Decimal value of 2024 rent
 * @throws Error if base year 2024 rent not found in either source
 */
export async function getRentBase2024(versionId?: string): Promise<Decimal> {
  // Try admin_settings first
  const settings = await prisma.admin_settings.findFirst({
    where: { key: 'general' },
    select: { transitionRentBase2024: true },
  });

  if (settings?.transitionRentBase2024) {
    return new Decimal(settings.transitionRentBase2024.toString());
  }

  // Fallback to historical_actuals (requires versionId)
  if (!versionId) {
    throw new Error(
      'Base year 2024 rent not found in admin_settings and no versionId provided for historical_actuals fallback'
    );
  }

  const historical = await prisma.historical_actuals.findFirst({
    where: {
      versionId,
      year: 2024,
    },
    select: { schoolRent: true },
  });

  if (historical) {
    return new Decimal(historical.schoolRent.toString());
  }

  throw new Error('Base year 2024 rent not found in admin_settings or historical_actuals');
}
