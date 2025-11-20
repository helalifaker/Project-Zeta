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
    curriculum_plans: number;
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
 * @param userRole - Optional role of user (ADMIN can view all versions)
 * @returns Result containing version with all relationships
 * 
 * @example
 * const result = await getVersionById(versionId, userId, 'ADMIN');
 * if (result.success) {
 *   console.log(result.data.name);
 * }
 */
export async function getVersionById(
  id: string,
  userId: string,
  userRole?: string
): Promise<Result<VersionWithRelations>> {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return error('Invalid version ID format', 'VALIDATION_ERROR');
    }

    // Fetch version with all relationships
    const version = await prisma.versions.findUnique({
      where: { id },
      include: {
        curriculum_plans: true,
        rent_plans: true,
        capex_items: true,
        opex_sub_accounts: true,
        users: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        versions: {
          select: {
            id: true,
            name: true,
            mode: true,
          },
        },
        other_versions: {
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
    if (version.createdBy !== userId && userRole !== 'ADMIN') {
      return error('Forbidden', 'FORBIDDEN');
    }

    // Map snake_case to camelCase for client
    const mappedVersion: any = {
      ...version,
      curriculumPlans: version.curriculum_plans,
      rentPlan: version.rent_plans,
      capexItems: version.capex_items,
      opexSubAccounts: version.opex_sub_accounts,
      creator: version.users,
      basedOn: version.versions,
      derivatives: version.other_versions,
    };
    delete mappedVersion.curriculum_plans;
    delete mappedVersion.rent_plans;
    delete mappedVersion.capex_items;
    delete mappedVersion.opex_sub_accounts;
    delete mappedVersion.users;
    delete mappedVersion.versions;
    delete mappedVersion.other_versions;

    return success(mappedVersion as VersionWithRelations);
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
    const where: Prisma.versionsWhereInput = {
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
    const orderBy: Prisma.versionsOrderByWithRelationInput = {
      [sortField]: sortOrder === 'asc' ? 'asc' : 'desc',
    };

    // Count total matching records
    const total = await prisma.versions.count({ where });

    // Fetch versions
    const versions = await prisma.versions.findMany({
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
            curriculum_plans: true,
            derivatives: true,
          },
        },
      },
    });

    return success({
      versions: versions as unknown as VersionListItem[],
      pagination: {
        page,
        limit: actualLimit,
        total,
        totalPages: Math.ceil(total / actualLimit),
      },
    });
  } catch (err) {
    console.error('Failed to list versions:', err);
    // Provide more detailed error message
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const errorCode = err instanceof Prisma.PrismaClientKnownRequestError 
      ? 'DATABASE_ERROR'
      : err instanceof Prisma.PrismaClientInitializationError
      ? 'DATABASE_CONNECTION_ERROR'
      : 'INTERNAL_ERROR';
    return error(`Failed to list versions: ${errorMessage}`, errorCode);
  }
}

