/**
 * Versions API Route
 * Handles listing and creating versions
 * 
 * GET /api/versions - List all versions (paginated, filtered)
 * POST /api/versions - Create new version
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth, requireRole } from '@/lib/auth/middleware';
import { CreateVersionSchema } from '@/lib/validation/version';
import { logAudit } from '@/services/audit';
import { EntityType, type VersionStatus, type VersionMode } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { getCacheHeaders } from '@/lib/cache/revalidate';

/**
 * GET /api/versions
 * List all versions with pagination, filtering, and sorting
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication required
    const authResult = await requireAuth();
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error, code: authResult.code },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100); // Max 100
    const status = searchParams.get('status');
    const mode = searchParams.get('mode');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const lightweight = searchParams.get('lightweight') === 'true'; // Fast mode: only id, name, status, mode

    // Validate pagination
    if (page < 1) {
      return NextResponse.json(
        { success: false, error: 'Page must be >= 1', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: Prisma.versionsWhereInput = {
      createdBy: authResult.data.id, // Users can only see their own versions
    };

    // Filter by status
    if (status && status !== 'all') {
      where.status = status as VersionStatus;
    }

    // Filter by mode
    if (mode && mode !== 'all') {
      where.mode = mode as VersionMode;
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

    // Lightweight mode: skip count and includes for speed
    let total: number;
    let versions: any[];

    if (lightweight) {
      // Ultra-fast path: simplified query, no complex sorting
      // Use id-based ordering (fastest) instead of createdAt
      const queryStart = performance.now();
      versions = await prisma.versions.findMany({
        where: {
          createdBy: authResult.data.id, // Only filter by user (indexed)
          // Skip other filters for speed in lightweight mode
        },
        orderBy: {
          id: 'desc', // Use id (primary key, always indexed) instead of createdAt
        },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          status: true,
          mode: true,
        },
      });
      const queryTime = performance.now() - queryStart;
      
      // Log performance (query time only - network latency is separate)
      // Note: Total request time includes network latency to Supabase (ap-southeast-2)
      // Expected network latency: 1000-1500ms for cross-region connections
      if (queryTime > 100) {
        console.warn(`⚠️ Query execution slow: ${queryTime.toFixed(0)}ms (target: <100ms)`);
      }
      
      // Estimate total (don't count for speed)
      total = versions.length === limit ? (page * limit) + 1 : (page - 1) * limit + versions.length;
    } else {
      // Full mode: count and includes
      total = await prisma.versions.count({ where });

      versions = await prisma.versions.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
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
            },
          },
          _count: {
            select: {
              curriculum_plans: true,
              other_versions: true,
            },
          },
        },
      });
    }

    // Map Prisma snake_case relation names to camelCase field names expected by client
    const mappedVersions = versions.map((version: any) => {
      const mapped: any = { ...version };
      
      // Map relation names: users -> creator, versions -> basedOn
      // Always set creator (even if null) to ensure field exists
      mapped.creator = mapped.users || null;
      delete mapped.users;
      
      // Always set basedOn (even if null) to ensure field exists
      mapped.basedOn = mapped.versions || null;
      delete mapped.versions;
      
      // Map _count field names: curriculum_plans -> curriculumPlans, other_versions -> derivatives
      if (mapped._count) {
        mapped._count = {
          curriculumPlans: mapped._count.curriculum_plans || 0,
          derivatives: mapped._count.other_versions || 0,
        };
      } else {
        // Ensure _count exists even if not included
        mapped._count = {
          curriculumPlans: 0,
          derivatives: 0,
        };
      }
      
      return mapped;
    });

    // Add cache headers for GET requests
    // Lightweight requests: aggressive caching (5 minutes) since they don't change often
    // Full requests: shorter cache (60 seconds) since they include more data
    const cacheTime = lightweight ? 300 : 60; // 5 minutes for lightweight, 1 minute for full
    const headers = {
      'Cache-Control': getCacheHeaders(cacheTime, cacheTime * 2),
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          versions: mappedVersions,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      },
      { headers }
    );
  } catch (error) {
    console.error('Failed to list versions:', error);
    
    // Handle database errors
    const { handleDatabaseError } = await import('@/lib/utils/error-handler');
    const dbError = handleDatabaseError(error);
    
    // Return appropriate status code
    const statusCode = !dbError.success && (dbError.code === 'DATABASE_TIMEOUT' || dbError.code === 'DATABASE_CONNECTION_ERROR')
      ? 503 
      : 500;
    
    return NextResponse.json(
      { success: false, error: dbError.success ? 'Internal server error' : dbError.error, code: dbError.success ? 'INTERNAL_ERROR' : dbError.code },
      { status: statusCode }
    );
  }
}

/**
 * POST /api/versions
 * Create new version
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication required (ADMIN or PLANNER only)
    const authResult = await requireRole(['ADMIN', 'PLANNER']);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error, code: authResult.code },
        { status: authResult.code === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    const userId = authResult.data.id;

    // Parse and validate request body
    const body = await request.json();
    const validation = CreateVersionSchema.safeParse(body);

    if (!validation.success) {
      // Format validation errors for better user experience
      const { getValidationErrorMessage } = await import('@/lib/utils/error-handler');
      const formattedErrors: Record<string, string[]> = {};
      
      validation.error.errors.forEach((issue) => {
        const path = issue.path.join('.');
        if (!formattedErrors[path]) {
          formattedErrors[path] = [];
        }
        formattedErrors[path].push(getValidationErrorMessage(path, issue));
      });
      
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed. Please check your input and try again.',
          code: 'VALIDATION_ERROR',
          details: formattedErrors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Validate curriculum plans: FR is required, IB is optional
    const curriculumTypes = data.curriculumPlans.map((cp) => cp.curriculumType);
    if (!curriculumTypes.includes('FR')) {
      return NextResponse.json(
        {
          success: false,
          error: 'FR curriculum plan is required',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // IB is optional - check for duplicates if present
    const ibCount = curriculumTypes.filter(t => t === 'IB').length;
    if (ibCount > 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'IB curriculum plan can only appear once',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // Check for duplicate name (unique per user)
    const existingVersion = await prisma.versions.findUnique({
      where: {
        name_createdBy: {
          name: data.name,
          createdBy: userId,
        },
      },
    });

    if (existingVersion) {
      return NextResponse.json(
        {
          success: false,
          error: 'Version with this name already exists',
          code: 'DUPLICATE_ERROR',
        },
        { status: 409 }
      );
    }

    // Create version with all relationships in a transaction
    const version = await prisma.$transaction(async (tx) => {
      // 1. Create version
      const newVersion = await tx.versions.create({
        data: {
          name: data.name,
          ...(data.description !== undefined && { description: data.description }),
          mode: data.mode,
          status: 'DRAFT',
          createdBy: userId,
          ...(data.basedOnId && { basedOnId: data.basedOnId }),
        },
      });

      // 2. Create curriculum plans
      await tx.curriculum_plans.createMany({
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
      await tx.rent_plans.create({
        data: {
          versionId: newVersion.id,
          rentModel: data.rentPlan.rentModel,
          parameters: data.rentPlan.parameters as Prisma.InputJsonValue,
        },
      });

      // 4. Create default capex rules (one per category, base costs default to 0)
      const { CapexCategory } = await import('@prisma/client');
      await tx.capex_rules.createMany({
        data: [
          { versionId: newVersion.id, category: CapexCategory.BUILDING, cycleYears: 20, baseCost: 0, startingYear: 2028, inflationIndex: null },
          { versionId: newVersion.id, category: CapexCategory.TECHNOLOGY, cycleYears: 4, baseCost: 0, startingYear: 2028, inflationIndex: null },
          { versionId: newVersion.id, category: CapexCategory.EQUIPMENT, cycleYears: 7, baseCost: 0, startingYear: 2028, inflationIndex: null },
          { versionId: newVersion.id, category: CapexCategory.FURNITURE, cycleYears: 7, baseCost: 0, startingYear: 2028, inflationIndex: null },
          { versionId: newVersion.id, category: CapexCategory.VEHICLES, cycleYears: 10, baseCost: 0, startingYear: 2028, inflationIndex: null },
        ],
      });

      return newVersion;
    });

    // Fetch created version with relationships
    const createdVersion = await prisma.versions.findUnique({
      where: { id: version.id },
      include: {
        curriculumPlans: true,
        rentPlan: true,
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

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

    return NextResponse.json(
      { success: true, data: createdVersion },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create version:', error);

    // Handle database errors
    const { handleDatabaseError } = await import('@/lib/utils/error-handler');
    const dbError = handleDatabaseError(error);
    
    // Return appropriate status code
    let statusCode = 500;
    if (!dbError.success) {
      if (dbError.code === 'DUPLICATE_ERROR') {
        statusCode = 409;
      } else if (dbError.code === 'DATABASE_TIMEOUT' || dbError.code === 'DATABASE_CONNECTION_ERROR') {
        statusCode = 503;
      }
    }

    return NextResponse.json(
      { success: false, error: dbError.success ? 'Internal server error' : dbError.error, code: dbError.success ? 'INTERNAL_ERROR' : dbError.code },
      { status: statusCode }
    );
  }
}

