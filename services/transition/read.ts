import { prisma } from '@/lib/db/prisma';
import { success, error, type Result } from '@/types/result';
import type { transition_year_data } from '@prisma/client';
import { isValidTransitionYear } from './helpers';

/**
 * Get all transition year data (2025-2027)
 *
 * @returns Result with array of transition year records, ordered by year ascending
 */
export async function getAllTransitionYears(): Promise<Result<transition_year_data[]>> {
  try {
    const yearData = await prisma.transition_year_data.findMany({
      orderBy: { year: 'asc' },
    });

    return success(yearData);
  } catch (err) {
    console.error('Failed to fetch transition year data:', err);
    return error('Failed to fetch transition year data', 'TRANSITION_READ_ERROR');
  }
}

/**
 * Get specific transition year data
 *
 * @param year - The transition year (2025-2027)
 * @returns Result with transition year record
 */
export async function getTransitionYear(year: number): Promise<Result<transition_year_data>> {
  try {
    // Validate year range
    if (!isValidTransitionYear(year)) {
      return error(`Invalid transition year: ${year}. Must be 2025-2027`, 'INVALID_YEAR');
    }

    const yearData = await prisma.transition_year_data.findUnique({
      where: { year },
    });

    if (!yearData) {
      return error(`No data found for transition year ${year}`, 'YEAR_NOT_FOUND');
    }

    return success(yearData);
  } catch (err) {
    console.error(`Failed to fetch transition year ${year}:`, err);
    return error(`Failed to fetch transition year ${year}`, 'TRANSITION_READ_ERROR');
  }
}

/**
 * Get global transition settings from admin_settings
 *
 * @returns Result with capacity cap and rent adjustment percent
 */
export async function getTransitionSettings(): Promise<
  Result<{
    capacityCap: number;
    rentAdjustmentPercent: number;
  }>
> {
  try {
    const settings = await prisma.admin_settings.findFirst({
      select: {
        transitionCapacityCap: true,
        transitionRentAdjustmentPercent: true,
      },
    });

    if (!settings) {
      return error('Admin settings not found', 'SETTINGS_NOT_FOUND');
    }

    return success({
      capacityCap: settings.transitionCapacityCap ?? 1850,
      rentAdjustmentPercent: settings.transitionRentAdjustmentPercent?.toNumber() ?? 10.0,
    });
  } catch (err) {
    console.error('Failed to fetch transition settings:', err);
    return error('Failed to fetch transition settings', 'SETTINGS_READ_ERROR');
  }
}

/**
 * Get complete transition configuration (settings + all year data + base year values)
 *
 * This is a convenience function for fetching all transition-related data
 * in a single operation, useful for admin UI rendering.
 *
 * Enhanced to include 2024 base year values for growth calculations.
 *
 * @returns Result with settings, year data, and base year values
 */
export async function getCompleteTransitionConfig(): Promise<
  Result<{
    settings: {
      capacityCap: number;
      rentAdjustmentPercent: number;
      staffCostBase2024: string | null;
      rentBase2024: string | null;
    };
    yearData: transition_year_data[];
  }>
> {
  try {
    // Fetch settings with base year values
    const settingsWithBase = await prisma.admin_settings.findFirst({
      select: {
        transitionCapacityCap: true,
        transitionRentAdjustmentPercent: true,
        transitionStaffCostBase2024: true,
        transitionRentBase2024: true,
      },
    });

    // Fetch year data
    const yearDataResult = await getAllTransitionYears();

    if (!yearDataResult.success) {
      return error(yearDataResult.error, yearDataResult.code);
    }

    // ALWAYS fetch base year values from historical_actuals (2024) first
    // This ensures we always show the correct values from historical data
    // admin_settings values are only used as fallback if historical data doesn't exist
    const historical2024 = await prisma.historical_actuals.findFirst({
      where: {
        year: 2024,
      },
      select: {
        salariesAndRelatedCosts: true,
        schoolRent: true,
      },
      orderBy: {
        updatedAt: 'desc', // Get the most recently updated
      },
    });

    let staffCostBase2024: string | null = null;
    let rentBase2024: string | null = null;

    // Priority 1: Use historical_actuals (2024) values if available
    if (historical2024) {
      if (
        historical2024.salariesAndRelatedCosts &&
        historical2024.salariesAndRelatedCosts.greaterThan(0)
      ) {
        staffCostBase2024 = historical2024.salariesAndRelatedCosts.toString();
      }
      if (historical2024.schoolRent && historical2024.schoolRent.greaterThan(0)) {
        rentBase2024 = historical2024.schoolRent.toString();
      }
    }

    // Priority 2: Fallback to admin_settings if historical data not available
    if (!staffCostBase2024 && settingsWithBase?.transitionStaffCostBase2024) {
      staffCostBase2024 = settingsWithBase.transitionStaffCostBase2024.toString();
    }
    if (!rentBase2024 && settingsWithBase?.transitionRentBase2024) {
      rentBase2024 = settingsWithBase.transitionRentBase2024.toString();
    }

    return success({
      settings: {
        capacityCap: settingsWithBase?.transitionCapacityCap ?? 1850,
        rentAdjustmentPercent:
          settingsWithBase?.transitionRentAdjustmentPercent?.toNumber() ?? 10.0,
        staffCostBase2024,
        rentBase2024,
      },
      yearData: yearDataResult.data,
    });
  } catch (err) {
    console.error('Failed to fetch complete transition config:', err);
    return error('Failed to fetch complete transition configuration', 'TRANSITION_CONFIG_ERROR');
  }
}

/**
 * Check if transition year data exists for all years (2025-2027)
 *
 * @returns Result with boolean indicating if all years are initialized
 */
export async function isTransitionDataInitialized(): Promise<Result<boolean>> {
  try {
    const count = await prisma.transition_year_data.count();
    return success(count === 3); // Should have exactly 3 records (2025, 2026, 2027)
  } catch (err) {
    console.error('Failed to check transition data initialization:', err);
    return error('Failed to check transition data initialization', 'TRANSITION_CHECK_ERROR');
  }
}
