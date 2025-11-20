/**
 * Update Version Service
 * Business logic for updating versions
 */

import { prisma } from '@/lib/db/prisma';
import { EntityType, Prisma, VersionStatus } from '@prisma/client';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';
import { logAudit } from '@/services/audit';
import type { UpdateVersionInput } from '@/lib/validation/version';
import type { VersionWithRelations } from './create';

/**
 * Update a version
 * 
 * @param id - Version ID
 * @param data - UpdateVersionInput with fields to update
 * @param userId - ID of user updating the version
 * @returns Result containing updated version
 * 
 * @example
 * const result = await updateVersion(versionId, {
 *   name: 'Updated Name',
 *   description: 'New description'
 * }, userId);
 */
export async function updateVersion(
  id: string,
  data: UpdateVersionInput,
  userId: string
): Promise<Result<VersionWithRelations>> {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return error('Invalid version ID format', 'VALIDATION_ERROR');
    }

    // Check if version exists and get current status
    const existingVersion = await prisma.versions.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        createdBy: true,
        name: true,
      },
    });

    if (!existingVersion) {
      return error('Version not found', 'NOT_FOUND');
    }

    // Users can only update their own versions (unless ADMIN - checked in API route)
    // This is a safety check
    if (existingVersion.createdBy !== userId) {
      return error('Forbidden', 'FORBIDDEN');
    }

    // Cannot update LOCKED versions
    if (existingVersion.status === VersionStatus.LOCKED) {
      return error('Cannot update LOCKED version', 'LOCKED_VERSION');
    }

    // Check for duplicate name if name is being updated
    if (data.name && data.name !== existingVersion.name) {
      const duplicateCheck = await prisma.versions.findUnique({
        where: {
          name_createdBy: {
            name: data.name,
            createdBy: existingVersion.createdBy,
          },
        },
      });

      if (duplicateCheck && duplicateCheck.id !== id) {
        return error('Version with this name already exists', 'DUPLICATE_ERROR');
      }
    }

    // Update version
    const updatedVersion = await prisma.versions.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status && { status: data.status }),
      },
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

    // Audit log
    await logAudit({
      action: 'UPDATE_VERSION',
      userId,
      entityType: EntityType.VERSION,
      entityId: id,
      metadata: {
        versionName: updatedVersion.name,
        changes: data,
      },
    });

    return success(updatedVersion as VersionWithRelations);
  } catch (err) {
    console.error('Failed to update version:', err);

    // Handle Prisma unique constraint error
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return error('Version with this name already exists', 'DUPLICATE_ERROR');
      }
      if (err.code === 'P2025') {
        return error('Version not found', 'NOT_FOUND');
      }
    }

    return error('Failed to update version', 'INTERNAL_ERROR');
  }
}

