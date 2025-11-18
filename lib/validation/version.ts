/**
 * Version Validation Schemas
 * Zod schemas for version-related inputs
 */

import { z } from 'zod';
import { VersionMode, VersionStatus, RentModel, CapexCategory } from '@prisma/client';
import { CurriculumPlanSchema } from './curriculum';
import { RentPlanBaseSchema } from './rent';

export const CreateVersionSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  mode: z.nativeEnum(VersionMode),
  basedOnId: z.string().uuid('Invalid version ID').optional(),
  curriculumPlans: z.array(CurriculumPlanSchema)
    .min(1, 'At least one curriculum plan (FR) is required')
    .max(2, 'Maximum two curriculum plans (FR and IB) allowed')
    .refine(
      (plans) => {
        const types = plans.map(p => p.curriculumType);
        // FR is always required
        if (!types.includes('FR')) {
          return false;
        }
        // IB can be optional, but if present, must be unique
        const ibCount = types.filter(t => t === 'IB').length;
        return ibCount <= 1; // Allow 0 or 1 IB
      },
      {
        message: 'FR curriculum is required. IB curriculum is optional but can only appear once.',
      }
    ),
  rentPlan: RentPlanBaseSchema, // versionId will be set by API
});

export const UpdateVersionSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.nativeEnum(VersionStatus).optional(),
  expectedUpdatedAt: z.string().datetime().optional(), // For optimistic locking
  curriculumPlans: z.array(
    z.object({
      id: z.string().uuid('Invalid curriculum plan ID'),
      capacity: z.number().int().nonnegative().optional(), // Allow 0 for IB when disabled
      tuitionBase: z.number().positive().finite().optional(),
      cpiFrequency: z.number().int().min(1).max(3).optional(),
      tuitionGrowthRate: z.number().min(0).max(1).optional(), // Tuition growth rate (0-1, e.g., 0.05 = 5%), separate from CPI
      teacherRatio: z.number().min(0).max(1).optional(), // Teachers per student (e.g., 0.15 = 1:6.67)
      nonTeacherRatio: z.number().min(0).max(1).optional(), // Non-teaching staff per student (e.g., 0.08)
      teacherMonthlySalary: z.number().positive().finite().optional(), // Teacher monthly salary in SAR
      nonTeacherMonthlySalary: z.number().positive().finite().optional(), // Non-teacher monthly salary in SAR
      studentsProjection: z.array(
        z.object({
          year: z.number().int().min(2023).max(2052),
          students: z.number().int().nonnegative().max(10000),
        })
      ).optional(), // Year-by-year enrollment projection
    })
  ).optional(),
  rentPlan: z.object({
    id: z.string().uuid('Invalid rent plan ID'),
    rentModel: z.nativeEnum(RentModel).optional(),
    parameters: z.record(z.union([z.number(), z.string()])).optional(),
  }).optional(),
  opexSubAccounts: z.array(
    z.object({
      id: z.string().uuid('Invalid opex sub-account ID').optional(), // Optional for new accounts
      subAccountName: z.string().min(1, 'Sub-account name is required').max(100),
      percentOfRevenue: z.number().min(0).max(100).nullable(),
      isFixed: z.boolean(),
      fixedAmount: z.number().min(0).nullable(),
    })
  ).optional(),
  capexRules: z.array(
    z.object({
      id: z.string().uuid('Invalid capex rule ID').optional(), // Optional for new rules
      category: z.nativeEnum(CapexCategory),
      cycleYears: z.number().int().min(1).max(50),
      baseCost: z.number().nonnegative().finite(), // Allow 0 (can be updated later)
      startingYear: z.number().int().min(2023).max(2052),
      inflationIndex: z.string().optional().nullable(), // Optional, defaults to global CPI
    })
  ).optional(),
  capexItems: z.array(
    z.object({
      id: z.string().uuid('Invalid capex item ID').optional(), // Optional for new items
      year: z.number().int().min(2023).max(2052),
      category: z.nativeEnum(CapexCategory),
      amount: z.number().min(0).finite(),
      description: z.string().max(500).nullable().optional(),
    })
  ).optional(),
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

