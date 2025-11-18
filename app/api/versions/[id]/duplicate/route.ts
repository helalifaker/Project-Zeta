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
    const sourceVersion = await prisma.versions.findUnique({
      where: { id },
      include: {
        curriculum_plans: true,
        rent_plans: true,
        capex_items: true,
        opex_sub_accounts: true,
        capex_rules: true,
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
    const existingVersion = await prisma.versions.findUnique({
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
      const newVersion = await tx.versions.create({
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

      // 4. Duplicate capex rules (auto-reinvestment rules)
      if (sourceVersion.capex_rules && sourceVersion.capex_rules.length > 0) {
        await tx.capex_rules.createMany({
          data: sourceVersion.capex_rules.map((rule) => ({
            versionId: newVersion.id,
            category: rule.category,
            cycleYears: rule.cycleYears,
            baseCost: rule.baseCost,
            startingYear: rule.startingYear,
            inflationIndex: rule.inflationIndex,
          })),
        });
      }

      // 5. Duplicate capex items (MANUAL ONLY)
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

      // 6. Duplicate opex sub-accounts
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

    // Fetch duplicated version with relationships (snake_case from Prisma)
    const newVersionRaw = await prisma.versions.findUnique({
      where: { id: duplicatedVersion.id },
      include: {
        curriculum_plans: true,
        rent_plans: true,
        capex_items: true,
        opex_sub_accounts: true,
        capex_rules: true,
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
      },
    });

    // Map to camelCase fields expected by client
    const newVersionWithRelations: any = newVersionRaw
      ? {
          ...newVersionRaw,
          curriculumPlans: newVersionRaw.curriculum_plans,
          rentPlan: newVersionRaw.rent_plans,
          capexItems: newVersionRaw.capex_items,
          opexSubAccounts: newVersionRaw.opex_sub_accounts,
          capexRules: newVersionRaw.capex_rules,
          creator: newVersionRaw.users,
          basedOn: newVersionRaw.versions,
        }
      : null;

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

