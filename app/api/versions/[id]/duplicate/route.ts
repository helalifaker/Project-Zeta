/**
 * Duplicate Version API Route
 * Handles duplicating a version
 * 
 * POST /api/versions/[id]/duplicate - Duplicate a version
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/middleware';
import { DuplicateVersionSchema } from '@/lib/validation/version';
import { logAudit } from '@/services/audit';
import { EntityType } from '@prisma/client';
import { Prisma } from '@prisma/client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/versions/[id]/duplicate
 * Duplicate a version with all its relationships
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

    // Check if source version exists
    const sourceVersion = await prisma.version.findUnique({
      where: { id },
      include: {
        curriculumPlans: true,
        rentPlan: true,
        capexItems: true,
        opexSubAccounts: true,
      },
    });

    if (!sourceVersion) {
      return NextResponse.json(
        { success: false, error: 'Version not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Parse request body (optional new name)
    const body = await request.json().catch(() => ({}));
    const validation = DuplicateVersionSchema.safeParse(body);

    if (!validation.success && body.name !== undefined) {
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

    const newName = validation.success && validation.data.name
      ? validation.data.name
      : `${sourceVersion.name} (Copy)`;

    // Check for duplicate name
    const existingVersion = await prisma.version.findUnique({
      where: {
        name_createdBy: {
          name: newName,
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

    // Duplicate version with all relationships in a transaction
    const duplicatedVersion = await prisma.$transaction(async (tx) => {
      // 1. Create new version
      const newVersion = await tx.version.create({
        data: {
          name: newName,
          description: sourceVersion.description,
          mode: sourceVersion.mode,
          status: 'DRAFT',
          createdBy: userId,
          basedOnId: id, // Reference to original version
        },
      });

      // 2. Duplicate curriculum plans
      if (sourceVersion.curriculumPlans.length > 0) {
        await tx.curriculumPlan.createMany({
          data: sourceVersion.curriculumPlans.map((cp) => ({
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
      if (sourceVersion.rentPlan) {
        await tx.rentPlan.create({
          data: {
            versionId: newVersion.id,
            rentModel: sourceVersion.rentPlan.rentModel,
            parameters: sourceVersion.rentPlan.parameters as Prisma.InputJsonValue,
          },
        });
      }

      // 4. Duplicate capex items
      if (sourceVersion.capexItems.length > 0) {
        await tx.capexItem.createMany({
          data: sourceVersion.capexItems.map((item) => ({
            versionId: newVersion.id,
            year: item.year,
            category: item.category,
            amount: item.amount,
            description: item.description,
          })),
        });
      }

      // 5. Duplicate opex sub-accounts
      if (sourceVersion.opexSubAccounts.length > 0) {
        await tx.opexSubAccount.createMany({
          data: sourceVersion.opexSubAccounts.map((account) => ({
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
    const newVersionWithRelations = await prisma.version.findUnique({
      where: { id: duplicatedVersion.id },
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
      },
    });

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

    return NextResponse.json(
      {
        success: true,
        data: newVersionWithRelations,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to duplicate version:', error);

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

