/**
 * Single Version API Route
 * Handles getting, updating, and deleting a specific version
 * 
 * GET /api/versions/[id] - Get version details
 * PATCH /api/versions/[id] - Update version
 * DELETE /api/versions/[id] - Delete version
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth, requireRole } from '@/lib/auth/middleware';
import { UpdateVersionSchema } from '@/lib/validation/version';
import { logAudit } from '@/services/audit';
import { EntityType } from '@prisma/client';
import { getCacheHeaders } from '@/lib/cache/revalidate';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/versions/[id]
 * Get version details with all relationships
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    // Authentication required
    const authResult = await requireAuth();
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error, code: authResult.code },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid version ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { success: false, error: 'Version not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Users can only view their own versions (unless ADMIN viewing all)
    if (version.createdBy !== authResult.data.id && authResult.data.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Add cache headers for GET requests (cache for 60 seconds)
    const headers = {
      'Cache-Control': getCacheHeaders(60, 300),
    };

    return NextResponse.json(
      {
        success: true,
        data: version,
      },
      { headers }
    );
  } catch (error) {
    console.error('Failed to get version:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/versions/[id]
 * Update version
 */
export async function PATCH(
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

    // Check if version exists and get current status
    const existingVersion = await prisma.version.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        createdBy: true,
        name: true,
      },
    });

    if (!existingVersion) {
      return NextResponse.json(
        { success: false, error: 'Version not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Users can only update their own versions (unless ADMIN)
    if (existingVersion.createdBy !== userId && authResult.data.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Cannot update LOCKED versions
    if (existingVersion.status === 'LOCKED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot update LOCKED version',
          code: 'LOCKED_VERSION',
        },
        { status: 409 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = UpdateVersionSchema.safeParse(body);

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

    // Check for duplicate name if name is being updated
    if (data.name && data.name !== existingVersion.name) {
      const duplicateCheck = await prisma.version.findUnique({
        where: {
          name_createdBy: {
            name: data.name,
            createdBy: existingVersion.createdBy,
          },
        },
      });

      if (duplicateCheck && duplicateCheck.id !== id) {
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

    // Update version
    const updatedVersion = await prisma.version.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status && { status: data.status }),
      },
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
      action: 'UPDATE_VERSION',
      userId,
      entityType: EntityType.VERSION,
      entityId: id,
      metadata: {
        versionName: updatedVersion.name,
        changes: data,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedVersion,
    });
  } catch (error) {
    console.error('Failed to update version:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/versions/[id]
 * Delete version (ADMIN only)
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    // Authentication required (ADMIN only)
    const authResult = await requireRole(['ADMIN']);
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
    const existingVersion = await prisma.version.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    if (!existingVersion) {
      return NextResponse.json(
        { success: false, error: 'Version not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Cannot delete LOCKED versions
    if (existingVersion.status === 'LOCKED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete LOCKED version',
          code: 'LOCKED_VERSION',
        },
        { status: 409 }
      );
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

    return NextResponse.json({
      success: true,
      data: { message: 'Version deleted successfully' },
    });
  } catch (error) {
    console.error('Failed to delete version:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

