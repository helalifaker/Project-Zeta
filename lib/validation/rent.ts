/**
 * Rent Plan Validation Schemas
 * Zod schemas for rent plan inputs
 */

import { z } from 'zod';
import { RentModel } from '@prisma/client';

// Fixed Escalation parameters
const FixedEscalationParamsSchema = z.object({
  baseRent: z.number().positive('Base rent must be positive').finite().max(100000000, 'Base rent cannot exceed 100,000,000 SAR'),
  escalationRate: z.number().min(0, 'Escalation rate cannot be negative').max(1, 'Escalation rate cannot exceed 100%'),
  startYear: z.number().int().min(2023).max(2052),
});

// Revenue Share parameters
const RevenueShareParamsSchema = z.object({
  revenueSharePercent: z.number().min(0, 'Revenue share cannot be negative').max(1, 'Revenue share cannot exceed 100%'),
});

// Partner Model parameters
const PartnerModelParamsSchema = z.object({
  landSize: z.number().positive('Land size must be positive').finite().max(1000000, 'Land size cannot exceed 1,000,000 sqm'),
  landPricePerSqm: z.number().positive('Land price must be positive').finite().max(100000, 'Land price cannot exceed 100,000 SAR per sqm'),
  buaSize: z.number().positive('BUA size must be positive').finite().max(1000000, 'BUA size cannot exceed 1,000,000 sqm'),
  constructionCostPerSqm: z.number().positive('Construction cost must be positive').finite().max(100000, 'Construction cost cannot exceed 100,000 SAR per sqm'),
  yieldBase: z.number().min(0, 'Yield cannot be negative').max(1, 'Yield cannot exceed 100%'),
});

// Base rent plan schema (without versionId for use in CreateVersionSchema)
export const RentPlanBaseSchema = z.object({
  rentModel: z.nativeEnum(RentModel),
  parameters: z.union([
    FixedEscalationParamsSchema,
    RevenueShareParamsSchema,
    PartnerModelParamsSchema,
  ]),
});

// Full rent plan schema (with versionId)
export const RentPlanSchema = RentPlanBaseSchema.extend({
  versionId: z.string().uuid('Invalid version ID'),
});

export const CreateRentPlanSchema = RentPlanSchema;

export const UpdateRentPlanSchema = z.object({
  rentModel: z.nativeEnum(RentModel).optional(),
  parameters: z.union([
    FixedEscalationParamsSchema,
    RevenueShareParamsSchema,
    PartnerModelParamsSchema,
  ]).optional(),
});

export type RentPlanInput = z.infer<typeof RentPlanSchema>;
export type CreateRentPlanInput = z.infer<typeof CreateRentPlanSchema>;
export type UpdateRentPlanInput = z.infer<typeof UpdateRentPlanSchema>;

