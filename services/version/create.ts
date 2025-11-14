/**
 * Create Version Service
 * Business logic for creating versions with all relationships
 */

import { prisma } from '@/lib/db/prisma';
import { EntityType, Prisma } from '@prisma/client';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';
import { logAudit } from '@/services/audit';
import type { CreateVersionInput } from '@/lib/validation/version';
import type { Version } from '@prisma/client';

export type VersionWithRelations = Version & {
  curriculumPlans: Array<{
    id: string;
    versionId: string;
    curriculumType: string;
    capacity: number;
    tuitionBase: Prisma.Decimal;
    cpiFrequency: number;
    studentsProjection: unknown;
    createdAt: Date;
    updatedAt: Date;
  }>;
  rentPlan: {
    id: string;
    versionId: string;
    rentModel: string;
    parameters: unknown;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  capexItems: Array<{
    id: string;
    versionId: string;
    year: number;
    category: string;
    amount: Prisma.Decimal;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  opexSubAccounts: Array<{
    id: string;
    versionId: string;
    subAccountName: string;
    percentOfRevenue: Prisma.Decimal | null;
    isFixed: boolean;
    fixedAmount: Prisma.Decimal | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  creator: {
    id: string;
    email: string;
    name: string | null;
  };
  basedOn: {
    id: string;
    name: string;
    mode: string;
  } | null;
  derivatives?: Array<{
    id: string;
    name: string;
    mode: string;
  }>;
};

/**
 * Create a new version with all relationships
 * 
 * @param data - CreateVersionInput with version data, curriculum plans, and rent plan
 * @param userId - ID of user creating the version
 * @returns Result containing created version with all relationships
 * 
 * @example
 * const result = await createVersion({
 *   name: 'Version 1',
 *   mode: 'RELOCATION_2028',
 *   curriculumPlans: [frPlan, ibPlan],
 *   rentPlan: { rentModel: 'FIXED_ESCALATION', parameters: {...} }
 * }, userId);
 */
export async function createVersion(
  data: CreateVersionInput,
  userId: string
): Promise<Result<VersionWithRelations>> {
  try {
    // Validate curriculum plans have both FR and IB
    const curriculumTypes = data.curriculumPlans.map((cp) => cp.curriculumType);
    if (!curriculumTypes.includes('FR') || !curriculumTypes.includes('IB')) {
      return error('Must include both FR and IB curriculum plans', 'VALIDATION_ERROR');
    }

    // Check for duplicate name (unique per user)
    const existingVersion = await prisma.version.findUnique({
      where: {
        name_createdBy: {
          name: data.name,
          createdBy: userId,
        },
      },
    });

    if (existingVersion) {
      return error('Version with this name already exists', 'DUPLICATE_ERROR');
    }

    // Create version with all relationships in a transaction
    const version = await prisma.$transaction(async (tx) => {
      // 1. Create version
      const newVersion = await tx.version.create({
        data: {
          name: data.name,
          ...(data.description !== undefined && { description: data.description }),
          mode: data.mode,
          status: 'DRAFT',
          createdBy: userId,
          ...(data.basedOnId && { basedOnId: data.basedOnId }),
        },
      });

      // 2. Create curriculum plans (FR + IB)
      await tx.curriculumPlan.createMany({
        data: data.curriculumPlans.map((cp) => ({
          versionId: newVersion.id,
          curriculumType: cp.curriculumType,
          capacity: cp.capacity,
          tuitionBase: cp.tuitionBase,
          cpiFrequency: cp.cpiFrequency,
          studentsProjection: cp.studentsProjection as Prisma.InputJsonValue,
        })),
      });

      // 3. Create rent plan
      await tx.rentPlan.create({
        data: {
          versionId: newVersion.id,
          rentModel: data.rentPlan.rentModel,
          parameters: data.rentPlan.parameters as Prisma.InputJsonValue,
        },
      });

      return newVersion;
    });

    // Fetch created version with relationships
    const createdVersion = await prisma.version.findUnique({
      where: { id: version.id },
      include: {
        curriculumPlans: true,
        rentPlan: true,
        capexItems: true,
        opexSubAccounts: true,
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        basedOn: {
          select: {
            id: true,
            name: true,
            mode: true,
          },
        },
        derivatives: {
          select: {
            id: true,
            name: true,
            mode: true,
          },
        },
      },
    });

    if (!createdVersion) {
      return error('Failed to fetch created version', 'NOT_FOUND');
    }

    // Audit log
    await logAudit({
      action: 'CREATE_VERSION',
      userId,
      entityType: EntityType.VERSION,
      entityId: version.id,
      metadata: {
        versionName: version.name,
        mode: version.mode,
      },
    });

    return success(createdVersion as VersionWithRelations);
  } catch (err) {
    console.error('Failed to create version:', err);

    // Handle Prisma unique constraint error
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return error('Version with this name already exists', 'DUPLICATE_ERROR');
      }
      if (err.code === 'P2003') {
        return error('Invalid foreign key reference', 'VALIDATION_ERROR');
      }
    }

    return error('Failed to create version', 'INTERNAL_ERROR');
  }
}

