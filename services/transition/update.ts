import { prisma } from '@/lib/db/prisma';
import { logAudit } from '../audit';
import { success, error, type Result } from '@/types/result';
import Decimal from 'decimal.js';
import type { transition_year_data } from '@prisma/client';
import {
  isValidTransitionYear,
  calculateTransitionStaffCost,
  getTransitionYears,
  validateTransitionSettings,
} from './helpers';

/**
 * Input for updating a specific transition year
 *
 * Enhanced with new revenue and growth fields.
 */
export interface UpdateTransitionYearInput {
  year: number;
  targetEnrollment?: number | undefined;
  staffCostBase?: Decimal | number | undefined;
  notes?: string | undefined;

  // Revenue components (NEW)
  averageTuitionPerStudent?: Decimal | number | undefined;
  otherRevenue?: Decimal | number | undefined;
  opex?: Decimal | number | undefined;

  // Growth percentages from 2024 base year (NEW)
  staffCostGrowthPercent?: Decimal | number | undefined;
  rentGrowthPercent?: Decimal | number | undefined;
}

/**
 * Input for updating global transition settings
 *
 * Enhanced to include base year values.
 */
export interface UpdateTransitionSettingsInput {
  capacityCap?: number | undefined;
  rentAdjustmentPercent?: Decimal | number | undefined;

  // Base year values for transition calculations (NEW)
  transitionStaffCostBase2024?: Decimal | number | undefined;
  transitionRentBase2024?: Decimal | number | undefined;
}

/**
 * Update specific transition year data
 *
 * @param input - Update data (only provided fields will be updated)
 * @param userId - User performing the update (for audit logging)
 * @returns Result with updated transition year record
 */
export async function updateTransitionYear(
  input: UpdateTransitionYearInput,
  userId: string
): Promise<Result<transition_year_data>> {
  try {
    const {
      year,
      targetEnrollment,
      staffCostBase,
      notes,
      averageTuitionPerStudent,
      otherRevenue,
      opex,
      staffCostGrowthPercent,
      rentGrowthPercent,
    } = input;

    // Validate year range
    if (!isValidTransitionYear(year)) {
      return error(`Invalid transition year: ${year}. Must be 2025-2027`, 'INVALID_YEAR');
    }

    // Check if record exists
    const existing = await prisma.transition_year_data.findUnique({
      where: { year },
    });

    if (!existing) {
      return error(`No data found for transition year ${year}`, 'YEAR_NOT_FOUND');
    }

    // Build update data object
    const updateData: {
      targetEnrollment?: number;
      staffCostBase?: Decimal;
      notes?: string;
      averageTuitionPerStudent?: Decimal;
      otherRevenue?: Decimal;
      opex?: Decimal;
      staffCostGrowthPercent?: Decimal;
      rentGrowthPercent?: Decimal;
    } = {};

    if (targetEnrollment !== undefined) {
      if (targetEnrollment <= 0) {
        return error('Target enrollment must be positive', 'INVALID_ENROLLMENT');
      }
      updateData.targetEnrollment = targetEnrollment;
    }

    if (staffCostBase !== undefined) {
      const staffCostDecimal = new Decimal(staffCostBase);
      if (staffCostDecimal.lessThanOrEqualTo(0)) {
        return error('Staff cost base must be positive', 'INVALID_STAFF_COST');
      }
      updateData.staffCostBase = staffCostDecimal;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // NEW FIELDS
    if (averageTuitionPerStudent !== undefined) {
      const tuitionDecimal = new Decimal(averageTuitionPerStudent);
      if (tuitionDecimal.lessThanOrEqualTo(0)) {
        return error('Average tuition per student must be positive', 'INVALID_TUITION');
      }
      updateData.averageTuitionPerStudent = tuitionDecimal;
    }

    if (otherRevenue !== undefined) {
      const otherRevenueDecimal = new Decimal(otherRevenue);
      if (otherRevenueDecimal.lessThan(0)) {
        return error('Other revenue cannot be negative', 'INVALID_OTHER_REVENUE');
      }
      updateData.otherRevenue = otherRevenueDecimal;
    }

    if (opex !== undefined) {
      const opexDecimal = new Decimal(opex);
      if (opexDecimal.lessThan(0)) {
        return error('Operating expenses cannot be negative', 'INVALID_OPEX');
      }
      updateData.opex = opexDecimal;
    }

    if (staffCostGrowthPercent !== undefined) {
      const growthDecimal = new Decimal(staffCostGrowthPercent);
      if (growthDecimal.lessThan(-50) || growthDecimal.greaterThan(200)) {
        return error(
          'Staff cost growth percent must be between -50 and 200',
          'INVALID_STAFF_GROWTH'
        );
      }
      updateData.staffCostGrowthPercent = growthDecimal;
    }

    if (rentGrowthPercent !== undefined) {
      const rentGrowthDecimal = new Decimal(rentGrowthPercent);
      if (rentGrowthDecimal.lessThan(-50) || rentGrowthDecimal.greaterThan(200)) {
        return error('Rent growth percent must be between -50 and 200', 'INVALID_RENT_GROWTH');
      }
      updateData.rentGrowthPercent = rentGrowthDecimal;
    }

    // Update the record
    const updated = await prisma.transition_year_data.update({
      where: { year },
      data: updateData,
    });

    // Audit log with complete old/new values
    await logAudit({
      action: 'UPDATE_TRANSITION_YEAR',
      userId,
      entityType: 'TRANSITION_YEAR',
      entityId: year.toString(),
      metadata: {
        oldValue: {
          targetEnrollment: existing.targetEnrollment,
          staffCostBase: existing.staffCostBase.toNumber(),
          notes: existing.notes,
          averageTuitionPerStudent: existing.averageTuitionPerStudent?.toNumber() ?? null,
          otherRevenue: existing.otherRevenue?.toNumber() ?? null,
          opex: existing.opex?.toNumber() ?? null,
          staffCostGrowthPercent: existing.staffCostGrowthPercent?.toNumber() ?? null,
          rentGrowthPercent: existing.rentGrowthPercent?.toNumber() ?? null,
        },
        newValue: {
          targetEnrollment: updated.targetEnrollment,
          staffCostBase: updated.staffCostBase.toNumber(),
          notes: updated.notes,
          averageTuitionPerStudent: updated.averageTuitionPerStudent?.toNumber() ?? null,
          otherRevenue: updated.otherRevenue?.toNumber() ?? null,
          opex: updated.opex?.toNumber() ?? null,
          staffCostGrowthPercent: updated.staffCostGrowthPercent?.toNumber() ?? null,
          rentGrowthPercent: updated.rentGrowthPercent?.toNumber() ?? null,
        },
      },
    });

    return success(updated);
  } catch (err) {
    console.error('Failed to update transition year:', err);
    return error('Failed to update transition year', 'TRANSITION_UPDATE_ERROR');
  }
}

/**
 * Update global transition settings in admin_settings
 *
 * @param input - Update data (only provided fields will be updated)
 * @param userId - User performing the update (for audit logging)
 * @returns Result with updated settings
 */
export async function updateTransitionSettings(
  input: UpdateTransitionSettingsInput,
  userId: string
): Promise<
  Result<{
    capacityCap: number;
    rentAdjustmentPercent: number;
    staffCostBase2024: string | null;
    rentBase2024: string | null;
  }>
> {
  try {
    const {
      capacityCap,
      rentAdjustmentPercent,
      transitionStaffCostBase2024,
      transitionRentBase2024,
    } = input;

    // Get existing settings
    const existing = await prisma.admin_settings.findFirst();

    if (!existing) {
      return error('Admin settings not found', 'SETTINGS_NOT_FOUND');
    }

    // Build update data object
    const updateData: {
      transitionCapacityCap?: number;
      transitionRentAdjustmentPercent?: Decimal;
      transitionStaffCostBase2024?: Decimal;
      transitionRentBase2024?: Decimal;
    } = {};

    if (capacityCap !== undefined) {
      updateData.transitionCapacityCap = capacityCap;
    }

    if (rentAdjustmentPercent !== undefined) {
      updateData.transitionRentAdjustmentPercent = new Decimal(rentAdjustmentPercent);
    }

    // NEW FIELDS
    if (transitionStaffCostBase2024 !== undefined) {
      updateData.transitionStaffCostBase2024 = new Decimal(transitionStaffCostBase2024);
    }

    if (transitionRentBase2024 !== undefined) {
      updateData.transitionRentBase2024 = new Decimal(transitionRentBase2024);
    }

    // Validate settings
    const finalCapacityCap = capacityCap ?? existing.transitionCapacityCap ?? 1850;
    const finalRentAdjustment =
      rentAdjustmentPercent !== undefined
        ? new Decimal(rentAdjustmentPercent).toNumber()
        : (existing.transitionRentAdjustmentPercent?.toNumber() ?? 10.0);

    const validation = validateTransitionSettings(finalCapacityCap, finalRentAdjustment);
    if (!validation.valid) {
      return error(validation.error!, 'INVALID_SETTINGS');
    }

    // Update settings
    const updated = await prisma.admin_settings.update({
      where: { id: existing.id },
      data: updateData,
    });

    // Audit log with complete old/new values
    await logAudit({
      action: 'UPDATE_TRANSITION_SETTINGS',
      userId,
      entityType: 'SETTING',
      entityId: existing.id,
      metadata: {
        oldValue: {
          capacityCap: existing.transitionCapacityCap ?? 1850,
          rentAdjustmentPercent: existing.transitionRentAdjustmentPercent?.toNumber() ?? 10.0,
          staffCostBase2024: existing.transitionStaffCostBase2024?.toNumber() ?? null,
          rentBase2024: existing.transitionRentBase2024?.toNumber() ?? null,
        },
        newValue: {
          capacityCap: updated.transitionCapacityCap ?? 1850,
          rentAdjustmentPercent: updated.transitionRentAdjustmentPercent?.toNumber() ?? 10.0,
          staffCostBase2024: updated.transitionStaffCostBase2024?.toNumber() ?? null,
          rentBase2024: updated.transitionRentBase2024?.toNumber() ?? null,
        },
      },
    });

    return success({
      capacityCap: updated.transitionCapacityCap ?? 1850,
      rentAdjustmentPercent: updated.transitionRentAdjustmentPercent?.toNumber() ?? 10.0,
      staffCostBase2024: updated.transitionStaffCostBase2024?.toString() ?? null,
      rentBase2024: updated.transitionRentBase2024?.toString() ?? null,
    });
  } catch (err) {
    console.error('Failed to update transition settings:', err);
    return error('Failed to update transition settings', 'SETTINGS_UPDATE_ERROR');
  }
}

/**
 * Recalculate all transition year staff costs from 2028 base
 *
 * This is useful when the user wants to automatically calculate transition
 * staff costs based on a 2028 baseline, deflating backwards using CPI.
 *
 * Formula: staffCost(year) = base2028 / (1 + cpiRate)^(2028 - year)
 *
 * @param base2028StaffCost - Staff cost baseline for year 2028
 * @param cpiRate - Annual CPI inflation rate (e.g., 0.03 for 3%)
 * @param userId - User performing the recalculation (for audit logging)
 * @returns Result with array of updated transition year records
 */
export async function recalculateTransitionStaffCosts(
  base2028StaffCost: Decimal,
  cpiRate: number,
  userId: string
): Promise<Result<transition_year_data[]>> {
  try {
    // Validate inputs
    if (base2028StaffCost.lessThanOrEqualTo(0)) {
      return error('Base 2028 staff cost must be positive', 'INVALID_BASE_STAFF_COST');
    }

    if (cpiRate < 0 || cpiRate > 1) {
      return error('CPI rate must be between 0 and 1', 'INVALID_CPI_RATE');
    }

    // Calculate staff costs for each transition year
    const transitionYears = getTransitionYears();
    const updates: transition_year_data[] = [];

    // Use transaction to ensure all updates succeed or none do
    await prisma.$transaction(async (tx) => {
      for (const year of transitionYears) {
        const staffCost = calculateTransitionStaffCost(year, base2028StaffCost, cpiRate);

        const updated = await tx.transition_year_data.update({
          where: { year },
          data: { staffCostBase: staffCost },
        });

        updates.push(updated);
      }

      // Single audit log for the batch operation
      await tx.audit_logs.create({
        data: {
          action: 'RECALCULATE_TRANSITION_STAFF_COSTS',
          userId,
          entityType: 'TRANSITION_YEAR',
          entityId: 'ALL',
          metadata: {
            base2028StaffCost: base2028StaffCost.toNumber(),
            cpiRate,
            calculatedValues: updates.map((u) => ({
              year: u.year,
              staffCostBase: u.staffCostBase.toNumber(),
            })),
          },
        },
      });
    });

    return success(updates);
  } catch (err) {
    console.error('Failed to recalculate transition staff costs:', err);
    return error('Failed to recalculate transition staff costs', 'RECALCULATE_ERROR');
  }
}

/**
 * Initialize transition year data for all years (2025-2027) if not already present
 *
 * This should be called during system setup or when admin settings are first configured.
 * Uses default values that can be updated later.
 *
 * @param defaultCapacityCap - Default capacity cap (e.g., 1850)
 * @param defaultStaffCostBase - Default staff cost base for all years
 * @param userId - User performing the initialization (for audit logging)
 * @returns Result with array of created/existing transition year records
 */
export async function initializeTransitionYearData(
  defaultCapacityCap: number,
  defaultStaffCostBase: Decimal,
  userId: string
): Promise<Result<transition_year_data[]>> {
  try {
    const transitionYears = getTransitionYears();
    const results: transition_year_data[] = [];

    await prisma.$transaction(async (tx) => {
      for (const year of transitionYears) {
        // Use upsert to avoid duplicate errors
        const record = await tx.transition_year_data.upsert({
          where: { year },
          update: {}, // Don't update if already exists
          create: {
            year,
            targetEnrollment: defaultCapacityCap,
            staffCostBase: defaultStaffCostBase,
            notes: `Initialized with default values`,
          },
        });

        results.push(record);
      }

      // Audit log
      await tx.audit_logs.create({
        data: {
          action: 'INITIALIZE_TRANSITION_DATA',
          userId,
          entityType: 'TRANSITION_YEAR',
          entityId: 'ALL',
          metadata: {
            defaultCapacityCap,
            defaultStaffCostBase: defaultStaffCostBase.toNumber(),
          },
        },
      });
    });

    return success(results);
  } catch (err) {
    console.error('Failed to initialize transition year data:', err);
    return error('Failed to initialize transition year data', 'INITIALIZE_ERROR');
  }
}
