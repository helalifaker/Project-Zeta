/**
 * Lock Version API Route
 * Handles locking a version
 * 
 * POST /api/versions/[id]/lock - Lock a version
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/middleware';
import { LockVersionSchema } from '@/lib/validation/version';
import { logAudit } from '@/services/audit';
import { EntityType, VersionStatus } from '@prisma/client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/versions/[id]/lock
 * Lock a version (change status to LOCKED)
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    // Authentication required (ADMIN or PLANNER only)
    const authResult = await requireRole(['ADMIN', 'PLANNER']);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error, code: authResult.code },
        { status: authResult.code === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    const { id } = await context.params;
    const userId = authResult.data.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid version ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Check if version exists
    const existingVersion = await prisma.versions.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        createdBy: true,
      },
    });

    if (!existingVersion) {
      return NextResponse.json(
        { success: false, error: 'Version not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Users can only lock their own versions (unless ADMIN)
    if (existingVersion.createdBy !== userId && authResult.data.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Check if already locked
    if (existingVersion.status === 'LOCKED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Version is already locked',
          code: 'ALREADY_LOCKED',
        },
        { status: 409 }
      );
    }

    // Parse request body (optional lock reason)
    const body = await request.json().catch(() => ({}));
    const validation = LockVersionSchema.safeParse(body);

    if (!validation.success && body.lockReason !== undefined) {
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

    const lockReason = validation.success ? validation.data.lockReason : body.lockReason;

    // Lock version (snake_case relations from Prisma)
    const lockedVersionRaw = await prisma.versions.update({
      where: { id },
      data: {
        status: VersionStatus.LOCKED,
        lockedAt: new Date(),
        lockedBy: userId,
        ...(lockReason && { lockReason }),
      },
      include: {
        curriculum_plans: true,
        rent_plans: true,
        users: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Map to camelCase fields expected by client
    const lockedVersion: any = {
      ...lockedVersionRaw,
      curriculumPlans: lockedVersionRaw.curriculum_plans,
      rentPlan: lockedVersionRaw.rent_plans,
      creator: lockedVersionRaw.users,
    };

    // Audit log
    await logAudit({
      action: 'LOCK_VERSION',
      userId,
      entityType: EntityType.VERSION,
      entityId: id,
      metadata: {
        versionName: lockedVersion.name,
        lockReason: lockReason || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: lockedVersion,
    });
  } catch (error) {
    console.error('Failed to lock version:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

