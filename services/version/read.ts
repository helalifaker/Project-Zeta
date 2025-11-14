/**
 * Read Version Service
 * Business logic for reading versions (single and list)
 */

import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';
import type { VersionWithRelations } from './create';

export interface ListVersionsParams {
  page?: number;
  limit?: number;
  status?: string;
  mode?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type VersionListItem = Omit<VersionWithRelations, 'curriculumPlans' | 'rentPlan' | 'capexItems' | 'opexSubAccounts'> & {
  _count: {
    curriculumPlans: number;
    derivatives: number;
  };
};

export interface PaginatedVersions {
  versions: VersionListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get version by ID with all relationships
 * 
 * @param id - Version ID
 * @param userId - ID of user requesting the version
 * @returns Result containing version with all relationships
 * 
 * @example
 * const result = await getVersionById(versionId, userId);
 * if (result.success) {
 *   console.log(result.data.name);
 * }
 */
export async function getVersionById(
  id: string,
  userId: string
): Promise<Result<VersionWithRelations>> {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return error('Invalid version ID format', 'VALIDATION_ERROR');
    }

    // Fetch version with all relationships
    const version = await prisma.version.findUnique({
      where: { id },
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

    if (!version) {
      return error('Version not found', 'NOT_FOUND');
    }

    // Authorization: users can only view their own versions (unless ADMIN viewing all)
    // Note: This is a basic check. In production, you'd get the user's role from a session.
    // For now, we check if the user is the creator or if they're an ADMIN.
    // The API route will handle role checking, but we keep this as a safety check.
    if (version.createdBy !== userId) {
      // If userId is 'ADMIN', allow access (this is a simplified check)
      // In real implementation, you'd pass the user's role here
      // For now, return error and let API route handle authorization
      return error('Forbidden', 'FORBIDDEN');
    }

    return success(version as VersionWithRelations);
  } catch (err) {
    console.error('Failed to get version:', err);
    return error('Failed to get version', 'INTERNAL_ERROR');
  }
}

/**
 * List versions with pagination, filtering, and sorting
 * 
 * @param params - ListVersionsParams with pagination and filter options
 * @param userId - ID of user requesting the list
 * @returns Result containing paginated list of versions
 * 
 * @example
 * const result = await listVersions({
 *   page: 1,
 *   limit: 20,
 *   status: 'DRAFT',
 *   sortBy: 'createdAt',
 *   sortOrder: 'desc'
 * }, userId);
 */
export async function listVersions(
  params: ListVersionsParams,
  userId: string
): Promise<Result<PaginatedVersions>> {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      mode,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    // Validate pagination
    if (page < 1) {
      return error('Page must be >= 1', 'VALIDATION_ERROR');
    }

    const actualLimit = Math.min(limit, 100); // Max 100

    // Build where clause
    const where: Prisma.VersionWhereInput = {
      createdBy: userId, // Users can only see their own versions
    };

    // Filter by status
    if (status && status !== 'all') {
      where.status = status as any;
    }

    // Filter by mode
    if (mode && mode !== 'all') {
      where.mode = mode as any;
    }

    // Search in name and description
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Validate sortBy
    const validSortFields = ['name', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderBy: Prisma.VersionOrderByWithRelationInput = {
      [sortField]: sortOrder === 'asc' ? 'asc' : 'desc',
    };

    // Count total matching records
    const total = await prisma.version.count({ where });

    // Fetch versions
    const versions = await prisma.version.findMany({
      where,
      orderBy,
      skip: (page - 1) * actualLimit,
      take: actualLimit,
      include: {
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
          },
        },
        _count: {
          select: {
            curriculumPlans: true,
            derivatives: true,
          },
        },
      },
    });

    return success({
      versions: versions as VersionListItem[],
      pagination: {
        page,
        limit: actualLimit,
        total,
        totalPages: Math.ceil(total / actualLimit),
      },
    });
  } catch (err) {
    console.error('Failed to list versions:', err);
    return error('Failed to list versions', 'INTERNAL_ERROR');
  }
}

