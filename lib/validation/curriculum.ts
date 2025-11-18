/**
 * Curriculum Validation Schemas
 * Zod schemas for curriculum plan inputs
 */

import { z } from 'zod';
import { CurriculumType } from '@prisma/client';

export const CurriculumPlanSchema = z.object({
  curriculumType: z.nativeEnum(CurriculumType),
  capacity: z.number().int().min(0, 'Capacity cannot be negative').max(10000, 'Capacity cannot exceed 10,000 students'),
  tuitionBase: z.number().positive('Tuition must be positive').finite().max(1000000, 'Tuition cannot exceed 1,000,000 SAR'),
  cpiFrequency: z.number().int().min(1).max(3, 'CPI frequency must be 1, 2, or 3 years'),
  studentsProjection: z.array(
    z.object({
      year: z.number().int().min(2023).max(2052),
      students: z.number().int().nonnegative('Students cannot be negative').max(10000, 'Students cannot exceed 10,000 per year'),
    })
  ).min(1, 'At least one year of student projection is required'),
});

export const CreateCurriculumPlanSchema = z.object({
  versionId: z.string().uuid('Invalid version ID'),
  curriculumPlan: CurriculumPlanSchema,
});

export const UpdateCurriculumPlanSchema = CurriculumPlanSchema.partial();

export type CurriculumPlanInput = z.infer<typeof CurriculumPlanSchema>;
export type CreateCurriculumPlanInput = z.infer<typeof CreateCurriculumPlanSchema>;
export type UpdateCurriculumPlanInput = z.infer<typeof UpdateCurriculumPlanSchema>;

