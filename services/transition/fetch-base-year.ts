import { prisma } from '@/lib/db/prisma';
import { success, error, type Result } from '@/types/result';
import Decimal from 'decimal.js';

/**
 * Base year values for transition calculations
 *
 * These values represent the 2024 baseline for calculating
 * transition period (2025-2027) staff costs and rent.
 */
export interface BaseYearValues {
  staffCostBase2024: Decimal | null;
  rentBase2024: Decimal | null;
  source: 'admin_settings' | 'historical_actuals' | 'not_found';
}

/**
 * Fetch 2024 base year values for transition calculations
 *
 * Retrieval strategy:
 * 1. First try admin_settings (transitionStaffCostBase2024, transitionRentBase2024)
 * 2. If not found or null, fallback to historical_actuals (year 2024)
 * 3. If still not found, return null values
 *
 * @returns Result with base year values and their source
 */
export async function fetchTransitionBaseYear(): Promise<Result<BaseYearValues>> {
  try {
    // Step 1: Try admin_settings first
    const settings = await prisma.admin_settings.findFirst({
      select: {
        transitionStaffCostBase2024: true,
        transitionRentBase2024: true,
      },
    });

    // Check if both values exist in admin_settings
    if (settings?.transitionStaffCostBase2024 && settings?.transitionRentBase2024) {
      return success({
        staffCostBase2024: new Decimal(settings.transitionStaffCostBase2024.toString()),
        rentBase2024: new Decimal(settings.transitionRentBase2024.toString()),
        source: 'admin_settings',
      });
    }

    // Step 2: Fallback to historical_actuals for year 2024
    // Fetch from any version with year 2024 data
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

    if (historical2024) {
      return success({
        staffCostBase2024: historical2024.salariesAndRelatedCosts
          ? new Decimal(historical2024.salariesAndRelatedCosts.toString())
          : null,
        rentBase2024: historical2024.schoolRent
          ? new Decimal(historical2024.schoolRent.toString())
          : null,
        source: 'historical_actuals',
      });
    }

    // Step 3: No data found
    return success({
      staffCostBase2024: null,
      rentBase2024: null,
      source: 'not_found',
    });
  } catch (err) {
    console.error('Failed to fetch transition base year values:', err);
    return error('Failed to fetch transition base year values', 'BASE_YEAR_FETCH_ERROR');
  }
}

/**
 * Update base year values in admin_settings
 *
 * This function updates the 2024 base year values that are used
 * for transition period calculations. These values are typically
 * derived from historical_actuals but can be manually adjusted.
 *
 * @param staffCostBase2024 - Base year staff costs (optional)
 * @param rentBase2024 - Base year rent (optional)
 * @returns Result with updated settings
 */
export async function updateTransitionBaseYear(
  staffCostBase2024?: Decimal | number,
  rentBase2024?: Decimal | number
): Promise<Result<{ staffCostBase2024: Decimal | null; rentBase2024: Decimal | null }>> {
  try {
    // Find or create admin_settings record
    let settings = await prisma.admin_settings.findFirst();

    if (!settings) {
      // Create new settings record with default values
      settings = await prisma.admin_settings.create({
        data: {
          key: 'general',
          value: {},
          transitionStaffCostBase2024: staffCostBase2024
            ? new Decimal(staffCostBase2024.toString())
            : null,
          transitionRentBase2024: rentBase2024 ? new Decimal(rentBase2024.toString()) : null,
        },
      });
    } else {
      // Update existing settings
      const updateData: {
        transitionStaffCostBase2024?: Decimal;
        transitionRentBase2024?: Decimal;
      } = {};

      if (staffCostBase2024 !== undefined) {
        updateData.transitionStaffCostBase2024 = new Decimal(staffCostBase2024.toString());
      }

      if (rentBase2024 !== undefined) {
        updateData.transitionRentBase2024 = new Decimal(rentBase2024.toString());
      }

      settings = await prisma.admin_settings.update({
        where: { id: settings.id },
        data: updateData,
      });
    }

    return success({
      staffCostBase2024: settings.transitionStaffCostBase2024
        ? new Decimal(settings.transitionStaffCostBase2024.toString())
        : null,
      rentBase2024: settings.transitionRentBase2024
        ? new Decimal(settings.transitionRentBase2024.toString())
        : null,
    });
  } catch (err) {
    console.error('Failed to update transition base year values:', err);
    return error('Failed to update transition base year values', 'BASE_YEAR_UPDATE_ERROR');
  }
}
