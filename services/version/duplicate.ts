/**
 * Duplicate Version Service
 * Business logic for duplicating versions with all relationships
 */

import { prisma } from '@/lib/db/prisma';
import { EntityType, Prisma } from '@prisma/client';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';
import { logAudit } from '@/services/audit';
import type { VersionWithRelations } from './create';

/**
 * Duplicate a version with all its relationships
 * 
 * @param id - Source version ID
 * @param userId - ID of user duplicating the version
 * @param newName - Optional new name for duplicated version
 * @returns Result containing duplicated version with all relationships
 * 
 * @example
 * const result = await duplicateVersion(sourceVersionId, userId, 'New Version Name');
 * if (result.success) {
 *   console.log(result.data.name); // 'New Version Name'
 * }
 */
export async function duplicateVersion(
  id: string,
  userId: string,
  newName?: string
): Promise<Result<VersionWithRelations>> {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return error('Invalid version ID format', 'VALIDATION_ERROR');
    }

    // Check if source version exists
    const sourceVersion = await prisma.versions.findUnique({
      where: { id },
      include: {
        curriculum_plans: true,
        rent_plans: true,
        capex_items: true,
        opex_sub_accounts: true,
      },
    });

    if (!sourceVersion) {
      return error('Version not found', 'NOT_FOUND');
    }

    // Determine new name
    const finalName = newName || `${sourceVersion.name} (Copy)`;

    // Check for duplicate name
    const existingVersion = await prisma.versions.findUnique({
      where: {
        name_createdBy: {
          name: finalName,
          createdBy: userId,
        },
      },
    });

    if (existingVersion) {
      return error('Version with this name already exists', 'DUPLICATE_ERROR');
    }

    // Duplicate version with all relationships in a transaction
    const duplicatedVersion = await prisma.$transaction(async (tx) => {
      // 1. Create new version
      const newVersion = await tx.versions.create({
        data: {
          name: finalName,
          description: sourceVersion.description,
          mode: sourceVersion.mode,
          status: 'DRAFT',
          createdBy: userId,
          basedOnId: id, // Reference to original version
        },
      });

      // 2. Duplicate curriculum plans
      if (sourceVersion.curriculum_plans.length > 0) {
        await tx.curriculum_plans.createMany({
          data: sourceVersion.curriculum_plans.map((cp) => ({
            versionId: newVersion.id,
            curriculumType: cp.curriculumType,
            capacity: cp.capacity,
            tuitionBase: cp.tuitionBase,
            cpiFrequency: cp.cpiFrequency,
            studentsProjection: cp.studentsProjection as Prisma.InputJsonValue,
          })),
        });
      }

      // 3. Duplicate rent plan
      if (sourceVersion.rent_plans) {
        await tx.rent_plans.create({
          data: {
            versionId: newVersion.id,
            rentModel: sourceVersion.rent_plans.rentModel,
            parameters: sourceVersion.rent_plans.parameters as Prisma.InputJsonValue,
          },
        });
      }

      // 4. Duplicate capex items (MANUAL ONLY)
      // Auto-generated items (ruleId IS NOT NULL) should NOT be copied
      // They will be regenerated from capex_rules after duplication
      const manualCapexItems = sourceVersion.capex_items.filter((item) => item.ruleId === null);
      if (manualCapexItems.length > 0) {
        await tx.capex_items.createMany({
          data: manualCapexItems.map((item) => ({
            versionId: newVersion.id,
            year: item.year,
            category: item.category,
            amount: item.amount,
            description: item.description,
            ruleId: null, // Explicitly set to null for manual items
          })),
        });
      }

      // 5. Duplicate opex sub-accounts
      if (sourceVersion.opex_sub_accounts.length > 0) {
        await tx.opex_sub_accounts.createMany({
          data: sourceVersion.opex_sub_accounts.map((account) => ({
            versionId: newVersion.id,
            subAccountName: account.subAccountName,
            percentOfRevenue: account.percentOfRevenue,
            isFixed: account.isFixed,
            fixedAmount: account.fixedAmount,
          })),
        });
      }

      return newVersion;
    });

    // Fetch duplicated version with relationships
    const newVersionWithRelations = await prisma.versions.findUnique({
      where: { id: duplicatedVersion.id },
      include: {
        curriculum_plans: true,
        rent_plans: true,
        capex_items: true,
        opex_sub_accounts: true,
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

    if (!newVersionWithRelations) {
      return error('Failed to fetch duplicated version', 'NOT_FOUND');
    }

    // Audit log
    await logAudit({
      action: 'DUPLICATE_VERSION',
      userId,
      entityType: EntityType.VERSION,
      entityId: duplicatedVersion.id,
      metadata: {
        versionName: duplicatedVersion.name,
        sourceVersionId: id,
        sourceVersionName: sourceVersion.name,
      },
    });

    return success(newVersionWithRelations as VersionWithRelations);
  } catch (err) {
    console.error('Failed to duplicate version:', err);

    // Handle Prisma unique constraint error
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return error('Version with this name already exists', 'DUPLICATE_ERROR');
      }
      if (err.code === 'P2025') {
        return error('Version not found', 'NOT_FOUND');
      }
    }

    return error('Failed to duplicate version', 'INTERNAL_ERROR');
  }
}

