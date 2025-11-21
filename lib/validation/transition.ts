import { z } from 'zod';

/**
 * Validation schema for updating a specific transition year (2025-2027)
 *
 * Enhanced with new revenue and growth fields for detailed transition modeling.
 */
export const TransitionYearUpdateSchema = z.object({
  year: z.number().int().min(2025).max(2027),
  targetEnrollment: z.number().int().positive().optional(),
  staffCostBase: z.number().positive().optional(),
  notes: z.string().max(500).optional(),

  // Revenue components
  averageTuitionPerStudent: z
    .number()
    .positive()
    .optional()
    .describe('FR curriculum tuition per student (IB not active during transition)'),
  otherRevenue: z
    .number()
    .nonnegative()
    .optional()
    .describe('Non-tuition revenue (fees, services, etc.)'),
  opex: z.number().nonnegative().optional().describe('Operating expenses for this transition year'),

  // Growth percentages from 2024 base year
  staffCostGrowthPercent: z
    .number()
    .min(-50)
    .max(200)
    .optional()
    .describe('Staff cost growth % from 2024 baseline (e.g., 5.0 = +5%)'),
  rentGrowthPercent: z
    .number()
    .min(-50)
    .max(200)
    .optional()
    .describe('Rent growth % from 2024 baseline (e.g., 10.0 = +10%)'),
});

/**
 * Validation schema for updating global transition settings
 *
 * Enhanced to include base year values for growth calculations.
 */
export const TransitionSettingsUpdateSchema = z.object({
  capacityCap: z.number().int().positive().optional(),
  rentAdjustmentPercent: z.number().min(-100).max(100).optional(),

  // Base year values for transition calculations
  transitionStaffCostBase2024: z
    .number()
    .positive()
    .optional()
    .describe('Base year (2024) staff costs for growth calculations'),
  transitionRentBase2024: z
    .number()
    .positive()
    .optional()
    .describe('Base year (2024) rent for growth calculations'),
});

/**
 * Validation schema for recalculating staff costs from 2028 base
 */
export const RecalculateStaffCostsSchema = z.object({
  base2028StaffCost: z.number().positive(),
  cpiRate: z.number().min(0).max(1),
});

/**
 * Complete validation schema for bulk update of transition data
 *
 * This schema accepts arrays of year data updates and global settings.
 */
export const BulkTransitionUpdateSchema = z.object({
  settings: TransitionSettingsUpdateSchema.optional(),
  yearData: z.array(TransitionYearUpdateSchema).optional(),
});

/**
 * Type exports for TypeScript usage
 */
export type TransitionYearUpdate = z.infer<typeof TransitionYearUpdateSchema>;
export type TransitionSettingsUpdate = z.infer<typeof TransitionSettingsUpdateSchema>;
export type RecalculateStaffCostsInput = z.infer<typeof RecalculateStaffCostsSchema>;
export type BulkTransitionUpdate = z.infer<typeof BulkTransitionUpdateSchema>;
