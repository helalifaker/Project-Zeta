/**
 * Delete Version Service
 * Business logic for deleting versions (ADMIN only)
 */

import { prisma } from '@/lib/db/prisma';
import { EntityType, Prisma, VersionStatus } from '@prisma/client';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';
import { logAudit } from '@/services/audit';

/**
 * Delete a version (ADMIN only)
 * Cascade delete will handle related records
 * 
 * @param id - Version ID
 * @param userId - ID of admin user deleting the version
 * @returns Result<void>
 * 
 * @example
 * const result = await deleteVersion(versionId, adminUserId);
 * if (result.success) {
 *   console.log('Version deleted');
 * }
 */
export async function deleteVersion(
  id: string,
  userId: string
): Promise<Result<void>> {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return error('Invalid version ID format', 'VALIDATION_ERROR');
    }

    // Check if version exists
    const existingVersion = await prisma.version.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    if (!existingVersion) {
      return error('Version not found', 'NOT_FOUND');
    }

    // Cannot delete LOCKED versions
    if (existingVersion.status === VersionStatus.LOCKED) {
      return error('Cannot delete LOCKED version', 'LOCKED_VERSION');
    }

    // Delete version (cascade will delete related records)
    await prisma.version.delete({
      where: { id },
    });

    // Audit log
    await logAudit({
      action: 'DELETE_VERSION',
      userId,
      entityType: EntityType.VERSION,
      entityId: id,
      metadata: {
        versionName: existingVersion.name,
      },
    });

    return success(undefined);
  } catch (err) {
    console.error('Failed to delete version:', err);

    // Handle Prisma not found error
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return error('Version not found', 'NOT_FOUND');
      }
    }

    return error('Failed to delete version', 'INTERNAL_ERROR');
  }
}

