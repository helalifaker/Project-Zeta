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

    // Validate pagination
    if (page < 1) {
      return NextResponse.json(
        { success: false, error: 'Page must be >= 1', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: Prisma.VersionWhereInput = {
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
    const orderBy: Prisma.VersionOrderByWithRelationInput = {
      [sortField]: sortOrder === 'asc' ? 'asc' : 'desc',
    };

    // Count total matching records
    const total = await prisma.version.count({ where });

    // Fetch versions
    const versions = await prisma.version.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
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

    // Add cache headers for GET requests (cache for 60 seconds)
    const headers = {
      'Cache-Control': getCacheHeaders(60, 300),
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          versions,
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
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
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
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Validate curriculum plans have both FR and IB
    const curriculumTypes = data.curriculumPlans.map((cp) => cp.curriculumType);
    if (!curriculumTypes.includes('FR') || !curriculumTypes.includes('IB')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Must include both FR and IB curriculum plans',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
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

      // 2. Create curriculum plans
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

    // Handle Prisma unique constraint error
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          {
            success: false,
            error: 'Version with this name already exists',
            code: 'DUPLICATE_ERROR',
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

