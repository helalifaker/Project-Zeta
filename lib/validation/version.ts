/**
 * Version Validation Schemas
 * Zod schemas for version-related inputs
 */

import { z } from 'zod';
import { VersionMode, VersionStatus } from '@prisma/client';
import { CurriculumPlanSchema } from './curriculum';
import { RentPlanBaseSchema } from './rent';

export const CreateVersionSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  mode: z.nativeEnum(VersionMode),
  basedOnId: z.string().uuid('Invalid version ID').optional(),
  curriculumPlans: z.array(CurriculumPlanSchema).length(2, 'Must include exactly 2 curriculum plans (FR and IB)'),
  rentPlan: RentPlanBaseSchema, // versionId will be set by API
});

export const UpdateVersionSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.nativeEnum(VersionStatus).optional(),
});

export const DuplicateVersionSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name must be less than 100 characters').optional(),
});

export const LockVersionSchema = z.object({
  lockReason: z.string().max(500, 'Lock reason must be less than 500 characters').optional(),
});

export type CreateVersionInput = z.infer<typeof CreateVersionSchema>;
export type UpdateVersionInput = z.infer<typeof UpdateVersionSchema>;
export type DuplicateVersionInput = z.infer<typeof DuplicateVersionSchema>;
export type LockVersionInput = z.infer<typeof LockVersionSchema>;

