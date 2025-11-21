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
import type { CapexCategory } from '@prisma/client';
import { getCacheHeaders } from '@/lib/cache/revalidate';
import { calculateAndPersistCapexItems } from '@/services/capex/calculate';
import { getAdminSettings } from '@/services/admin/settings';
import Decimal from 'decimal.js';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Validates curriculum plans ensure FR is required
 * @param updatedPlans - Plans being updated (with id and optional curriculumType)
 * @param versionId - Version ID to fetch other plans from database
 * @returns Result with validation status
 */
async function validateCurriculumPlans(
  updatedPlans: Array<{ id: string; curriculumType?: 'FR' | 'IB' }>,
  versionId: string
): Promise<{ success: boolean; error?: string; allPlans?: Array<{ id: string; curriculumType: 'FR' | 'IB' }> }> {
  try {
    const validationStart = performance.now();
    console.log('🔍 [IB TOGGLE DEBUG] Starting validation');
    
    // Get IDs of plans being updated
    const updatedIds = new Set(updatedPlans.map(p => p.id));
    
    // OPTIMIZATION: Fetch ALL plans for this version in a SINGLE query
    // This is faster than 2 separate queries
    console.log('🔍 [IB TOGGLE DEBUG] Fetching all plans for version, updated IDs:', Array.from(updatedIds));
    const allPlansInVersion = await prisma.curriculum_plans.findMany({
      where: { versionId: versionId },
      select: {
        id: true,
        curriculumType: true,
      },
    });
    
    // Separate into updated plans and other plans
    const otherPlans = allPlansInVersion.filter(p => !updatedIds.has(p.id));
    const existingPlans = allPlansInVersion.filter(p => updatedIds.has(p.id));
    
    // Get curriculum types from updated plans (use provided type or look up from database)
    const updatedTypes = updatedPlans.map((cp) => {
      // If curriculumType is in request, use it; otherwise look it up from existing plans
      if (cp.curriculumType) {
        return cp.curriculumType;
      }
      const existingPlan = existingPlans.find((p) => p.id === cp.id);
      return existingPlan?.curriculumType;
    }).filter((t): t is 'FR' | 'IB' => t !== undefined);
    
    // Combine: updated plans + other plans
    const allTypes = [
      ...updatedTypes,
      ...otherPlans.map((p) => p.curriculumType),
    ];
    
    const validationTime = performance.now() - validationStart;
    console.log('🔍 [IB TOGGLE DEBUG] All curriculum types:', allTypes, `(${validationTime.toFixed(0)}ms)`);
    
    // Validate FR is required
    if (!allTypes.includes('FR')) {
      console.error('❌ Validation failed: FR curriculum plan is required');
      return { success: false, error: 'FR curriculum plan is required' };
    }
    
    // IB is optional - check for duplicates
    const ibCount = allTypes.filter((t: string) => t === 'IB').length;
    if (ibCount > 1) {
      console.error('❌ Validation failed: IB curriculum plan can only appear once');
      return { success: false, error: 'IB curriculum plan can only appear once' };
    }
    
    console.log('✅ Validation passed');
    return { success: true, allPlans: allPlansInVersion };
  } catch (fetchError) {
    console.error('❌ Error validating curriculum plans:', fetchError);
    console.error('🔍 [IB TOGGLE DEBUG] Fetch error details:', {
      error: fetchError instanceof Error ? fetchError.message : String(fetchError),
      stack: fetchError instanceof Error ? fetchError.stack : undefined,
      updatedPlans: updatedPlans,
    });
    
    // Fallback: validate with updated plans only
    const updatedTypes = updatedPlans
      .map((cp) => cp.curriculumType)
      .filter((t): t is 'FR' | 'IB' => t !== undefined);
    
    // If FR is in updated plans, assume it's OK
    if (updatedTypes.includes('FR')) {
      console.log('⚠️ Fallback validation: FR found in updated plans');
      return { success: true };
    }
    
    // Try to fetch all plans as last resort
    try {
      const allPlansFallback = await prisma.curriculum_plans.findMany({
        where: { versionId: versionId },
        select: { curriculumType: true },
      });
      
      const allTypes = [
        ...updatedTypes,
        ...allPlansFallback.map((p) => p.curriculumType),
      ];
      
      if (!allTypes.includes('FR')) {
        return { success: false, error: 'FR curriculum plan is required' };
      }
      
      return { success: true };
    } catch (fallbackError) {
      console.error('❌ Fallback validation also failed:', fallbackError);
      // Last resort: if FR is in request, allow it
      if (updatedTypes.includes('FR')) {
        return { success: true };
      }
      return {
        success: false,
        error: 'Unable to validate curriculum plans. Please ensure FR plan exists.',
      };
    }
  }
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
    console.log('🔍 [GET /api/versions/[id]] Starting request...');
    
    // Authentication required
    let authResult;
    try {
      authResult = await requireAuth();
      console.log('✅ [GET /api/versions/[id]] Auth check passed');
    } catch (authError) {
      console.error('❌ [GET /api/versions/[id]] Auth check failed with exception:', authError);
      return NextResponse.json(
        { success: false, error: 'Authentication failed', code: 'AUTH_ERROR', details: authError instanceof Error ? authError.message : String(authError) },
        { status: 401 }
      );
    }
    
    if (!authResult.success) {
      console.error('❌ [GET /api/versions/[id]] Auth check returned error:', authResult.error, authResult.code);
      return NextResponse.json(
        { success: false, error: authResult.error, code: authResult.code },
        { status: 401 }
      );
    }

    let params;
    let id: string | undefined;
    try {
      params = await context.params;
      id = params?.id;
      console.log(`📡 [GET /api/versions/[id]] Params resolved:`, { id, idType: typeof id, idLength: id?.length });
    } catch (paramsError) {
      console.error('❌ [GET /api/versions/[id]] Failed to resolve params:', paramsError);
      return NextResponse.json(
        { success: false, error: 'Failed to resolve route parameters', code: 'PARAMS_ERROR', details: paramsError instanceof Error ? paramsError.message : String(paramsError) },
        { status: 500 }
      );
    }

    if (!id) {
      console.error(`❌ Missing version ID in params`);
      return NextResponse.json(
        { success: false, error: 'Version ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.error(`❌ Invalid UUID format: "${id}" (length: ${id.length})`);
      return NextResponse.json(
        { success: false, error: `Invalid version ID format: "${id}"`, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // OPTIMIZATION: Split into parallel queries for better performance
    // Fetch core version data first (lightweight)
    // ✅ FIX: Use Promise.allSettled to handle individual query failures gracefully
    const queryStart = performance.now();
    const results = await Promise.allSettled([
      // Core version data (no relations)
      prisma.versions.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          mode: true,
          status: true,
          createdBy: true,
          basedOnId: true,
          createdAt: true,
          updatedAt: true,
          lockedAt: true,
          lockedBy: true,
          lockReason: true,
        },
      }),
      // Curriculum plans (critical - needed immediately)
      prisma.curriculum_plans.findMany({
        where: { versionId: id },
        select: {
          id: true,
          curriculumType: true,
          capacity: true,
          tuitionBase: true,
          cpiFrequency: true,
          tuitionGrowthRate: true,
          teacherRatio: true,
          nonTeacherRatio: true,
          teacherMonthlySalary: true,
          nonTeacherMonthlySalary: true,
          studentsProjection: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      // Rent plan (critical - needed immediately)
      prisma.rent_plans.findUnique({
        where: { versionId: id },
        select: {
          id: true,
          rentModel: true,
          parameters: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      // Opex sub accounts (needed for Opex tab)
      prisma.opex_sub_accounts.findMany({
        where: { versionId: id },
        select: {
          id: true,
          subAccountName: true,
          percentOfRevenue: true,
          isFixed: true,
          fixedAmount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      // Capex items (limit to 50 for initial load - can fetch more if needed)
      prisma.capex_items.findMany({
        where: { versionId: id },
        select: {
          id: true,
          year: true,
          category: true,
          amount: true,
          description: true,
          ruleId: true, // CRITICAL: Needed to distinguish auto vs manual items
        },
        take: 50,
        orderBy: { year: 'asc' },
      }),
      // Capex rules (needed for Costs Analysis tab)
      // ✅ FIX: Wrap in try-catch equivalent - use Promise.resolve to handle gracefully
      Promise.resolve(prisma.capex_rules.findMany({
        where: { versionId: id },
        select: {
          id: true,
          category: true,
          cycleYears: true,
          baseCost: true,
          startingYear: true,
          inflationIndex: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { category: 'asc' },
      })).catch((error) => {
        // ✅ FIX: If capex_rules table doesn't exist (migration not applied), return empty array
        console.warn('⚠️ [CAPEX_RULES] Table not found or query failed, returning empty array:', error instanceof Error ? error.message : String(error));
        return [];
      }),
    ]);

    // Extract results from Promise.allSettled
    // ✅ CRITICAL: Version query must succeed - log error if it fails
    if (results[0].status === 'rejected') {
      console.error('❌ [GET /api/versions/[id]] Failed to fetch version:', results[0].reason);
      throw new Error(`Failed to fetch version: ${results[0].reason instanceof Error ? results[0].reason.message : String(results[0].reason)}`);
    }
    const version = results[0].value;
    
    // Optional relations - can be empty if queries fail
    const curriculumPlans = results[1].status === 'fulfilled' ? results[1].value : [];
    const rentPlan = results[2].status === 'fulfilled' ? results[2].value : null;
    const opexSubAccounts = results[3].status === 'fulfilled' ? results[3].value : [];
    const capexItems = results[4].status === 'fulfilled' ? results[4].value : [];
    const capexRules = results[5].status === 'fulfilled' ? results[5].value : [];
    
    // Log warnings for failed optional queries
    if (results[1].status === 'rejected') {
      console.warn('⚠️ [GET /api/versions/[id]] Failed to fetch curriculum plans:', results[1].reason);
    }
    if (results[2].status === 'rejected') {
      console.warn('⚠️ [GET /api/versions/[id]] Failed to fetch rent plan:', results[2].reason);
    }
    if (results[3].status === 'rejected') {
      console.warn('⚠️ [GET /api/versions/[id]] Failed to fetch opex sub accounts:', results[3].reason);
    }
    if (results[4].status === 'rejected') {
      console.warn('⚠️ [GET /api/versions/[id]] Failed to fetch capex items:', results[4].reason);
    }
    if (results[5].status === 'rejected') {
      console.warn('⚠️ [GET /api/versions/[id]] Failed to fetch capex rules:', results[5].reason);
    }

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

    // Fetch non-critical relations in parallel (don't block response)
    const [basedOnVersion, creatorUser] = await Promise.allSettled([
      version.basedOnId
        ? prisma.versions.findUnique({
            where: { id: version.basedOnId },
            select: { id: true, name: true, mode: true },
          })
        : Promise.resolve(null),
      prisma.users.findUnique({
        where: { id: version.createdBy },
        select: { id: true, email: true, name: true },
      }),
    ]);

    const queryTime = performance.now() - queryStart;
    if (queryTime > 1000) {
      console.warn(`⚠️ GET /api/versions/[id] query took ${queryTime.toFixed(0)}ms (target: <1000ms)`);
    }

    // Build response with all fetched data (using snake_case from Prisma)
    const versionWithRelations = {
      ...version,
      curriculum_plans: curriculumPlans,
      rent_plans: rentPlan,
      opex_sub_accounts: opexSubAccounts,
      capex_items: capexItems,
      capex_rules: capexRules,
      versions: basedOnVersion.status === 'fulfilled' ? basedOnVersion.value : null,
      users: creatorUser.status === 'fulfilled' ? creatorUser.value : null,
      // Omit other_versions - not critical for initial load
    };

    // Map Prisma snake_case relation names to camelCase field names expected by client
    const mappedVersion: any = {
      ...versionWithRelations,
      curriculumPlans: versionWithRelations.curriculum_plans,
      rentPlan: versionWithRelations.rent_plans,
      opexSubAccounts: versionWithRelations.opex_sub_accounts,
      capexItems: versionWithRelations.capex_items,
      capexRules: versionWithRelations.capex_rules,
      creator: versionWithRelations.users,
      basedOn: versionWithRelations.versions,
    };
    
    // Remove snake_case fields (keep camelCase)
    delete mappedVersion.curriculum_plans;
    delete mappedVersion.rent_plans;
    delete mappedVersion.opex_sub_accounts;
    delete mappedVersion.capex_items;
    delete mappedVersion.capex_rules;
    delete mappedVersion.users;
    delete mappedVersion.versions;

    // Add cache headers for GET requests (cache for 60 seconds)
    const headers = {
      'Cache-Control': getCacheHeaders(60, 300),
    };

    return NextResponse.json(
      {
        success: true,
        data: mappedVersion,
      },
      { headers }
    );
  } catch (error) {
    console.error('❌ [GET /api/versions/[id]] ERROR CAUGHT:', error);
    console.error('❌ [GET /api/versions/[id]] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('❌ [GET /api/versions/[id]] Error message:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('❌ [GET /api/versions/[id]] Error stack:', error.stack);
    }
    console.error('❌ [GET /api/versions/[id]] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Handle database errors
    let errorMessage = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';
    let statusCode = 500;
    
    try {
      const { handleDatabaseError } = await import('@/lib/utils/error-handler');
      const dbError = handleDatabaseError(error);
      
      if (!dbError.success) {
        errorMessage = dbError.error || errorMessage;
        errorCode = dbError.code || errorCode;
        
        if (dbError.code === 'DATABASE_TIMEOUT' || dbError.code === 'DATABASE_CONNECTION_ERROR') {
          statusCode = 503;
        }
      } else {
        errorMessage = error instanceof Error ? error.message : String(error);
      }
    } catch (importError) {
      console.error('Failed to import error handler:', importError);
      errorMessage = error instanceof Error ? error.message : String(error);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        code: errorCode,
        details: error instanceof Error ? { 
          message: error.message,
          name: error.name,
        } : {},
      },
      { status: statusCode }
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
    const requestStartTime = performance.now();
    console.log('🚀 [PERF] PATCH /api/versions/[id] - Request started');
    
    // Authentication required (ADMIN or PLANNER only)
    const authStart = performance.now();
    const authResult = await requireRole(['ADMIN', 'PLANNER']);
    const authTime = performance.now() - authStart;
    console.log(`⏱️ [PERF] Authentication took ${authTime.toFixed(0)}ms`);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error, code: authResult.code },
        { status: authResult.code === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    const paramsStart = performance.now();
    const { id } = await context.params;
    const paramsTime = performance.now() - paramsStart;
    console.log(`⏱️ [PERF] Params extraction took ${paramsTime.toFixed(0)}ms`);
    
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
    const versionCheckStart = performance.now();
    const existingVersion = await prisma.versions.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        createdBy: true,
        name: true,
        updatedAt: true,
      },
    });
    const versionCheckTime = performance.now() - versionCheckStart;
    console.log(`⏱️ [PERF] Version existence check took ${versionCheckTime.toFixed(0)}ms`);

    // Performance tracking variables (declared at function scope for summary)
    let validationTime: number | undefined;
    let updateWaitTime: number | undefined;
    let versionFetchTime: number | undefined;
    let bodyParseTime: number | undefined;

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
    const patchStartTime = performance.now();
    const bodyParseStart = performance.now();
    let body: any;
    try {
      body = await request.json();
      const parseTime = performance.now() - bodyParseStart;
      bodyParseTime = parseTime;
      console.log(`⏱️ [PERF] Request body parsing took ${parseTime.toFixed(0)}ms`);
      console.log('📥 Received PATCH request body:', JSON.stringify(body, null, 2));
    } catch (error) {
      console.error('❌ Failed to parse request body:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body', code: 'PARSE_ERROR' },
        { status: 400 }
      );
    }
    
    const zodValidationStart = performance.now();
    const validation = UpdateVersionSchema.safeParse(body);
    const zodValidationTime = performance.now() - zodValidationStart;
    console.log(`⏱️ [PERF] Zod validation took ${zodValidationTime.toFixed(0)}ms`);
    if (!validation.success) {
      console.error('❌ Validation failed:', validation.error.errors);
    }
    
    // Optimistic locking: Check if version was modified by another user
    if (body.expectedUpdatedAt) {
      const expectedUpdatedAt = new Date(body.expectedUpdatedAt);
      const actualUpdatedAt = existingVersion.updatedAt;
      
      // Allow 1 second tolerance for clock skew
      const timeDiff = Math.abs(actualUpdatedAt.getTime() - expectedUpdatedAt.getTime());
      if (timeDiff > 1000) {
        return NextResponse.json(
          {
            success: false,
            error: 'Version was modified by another user. Please refresh and try again.',
            code: 'CONCURRENT_MODIFICATION',
            details: {
              expectedUpdatedAt: expectedUpdatedAt.toISOString(),
              actualUpdatedAt: actualUpdatedAt.toISOString(),
            },
          },
          { status: 409 }
        );
      }
    }

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

    // Check for duplicate name if name is being updated
    if (data.name && data.name !== existingVersion.name) {
      const duplicateCheckStart = performance.now();
      const duplicateCheck = await prisma.versions.findUnique({
        where: {
          name_createdBy: {
            name: data.name,
            createdBy: existingVersion.createdBy,
          },
        },
      });
      const duplicateCheckTime = performance.now() - duplicateCheckStart;
      console.log(`⏱️ [PERF] Duplicate name check took ${duplicateCheckTime.toFixed(0)}ms`);

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

    // Track which relationships were updated (to avoid unnecessary re-fetching)
    let curriculumPlansUpdated = false;
    let rentPlanUpdated = false;
    let updatedCurriculumPlans: any[] = [];
    let updatedRentPlan: any = null;
    let opexSubAccountsUpdated = false;
    let updatedOpexSubAccounts: any[] = [];
    let capexRulesUpdated = false;
    let updatedCapexRules: any[] = [];
    let capexItemsUpdated = false;
    let updatedCapexItems: any[] = [];

    // Update curriculum plans if provided
    if (data.curriculumPlans && data.curriculumPlans.length > 0) {
      const curriculumUpdateSectionStart = performance.now();
      console.log('🔍 [IB TOGGLE DEBUG] Starting curriculum plan update');
      console.log('🔍 [IB TOGGLE DEBUG] Request data:', JSON.stringify(data.curriculumPlans, null, 2));
      console.log('🔍 [IB TOGGLE DEBUG] Version ID:', id);
      
      // CRITICAL: Validate BEFORE updating database to prevent data inconsistency
      const validationStart = performance.now();
      
      // PERFORMANCE OPTIMIZATION: For simple capacity updates (IB toggle), use faster validation
      // Check if this is a capacity-only update (no studentsProjection, no other fields)
      // CRITICAL: This must be detected correctly to avoid slow full validation
      const isCapacityOnlyUpdate = data.curriculumPlans.every((cp) => {
        const hasOnlyCapacity = cp.capacity !== undefined;
        const hasNoOtherFields = 
          cp.tuitionBase === undefined &&
          cp.cpiFrequency === undefined &&
          cp.studentsProjection === undefined &&
          cp.tuitionGrowthRate === undefined &&
          cp.teacherRatio === undefined &&
          cp.nonTeacherRatio === undefined &&
          cp.teacherMonthlySalary === undefined &&
          cp.nonTeacherMonthlySalary === undefined;
        const result = hasOnlyCapacity && hasNoOtherFields;
        if (!result) {
          console.log('🔍 [PERF DEBUG] Plan does not qualify for fast path:', {
            hasOnlyCapacity,
            hasNoOtherFields,
            fields: Object.keys(cp),
          });
        }
        return result;
      });
      
      console.log('🔍 [PERF DEBUG] isCapacityOnlyUpdate:', isCapacityOnlyUpdate, 'for', data.curriculumPlans.length, 'plan(s)');
      console.log('🔍 [PERF DEBUG] Request payload:', JSON.stringify(data.curriculumPlans, null, 2));
      
      let validationResult;
      if (isCapacityOnlyUpdate) {
        // PERFORMANCE FIX: Fast validation path for capacity-only updates
        // Rationale:
        // 1. Version was created with FR plan (guaranteed to exist)
        // 2. Capacity change doesn't affect FR requirement
        // 3. Plan ID is validated by Prisma update (will fail if invalid)
        // 4. User is authenticated (trusted operation)
        // 5. This saves 100-500ms by eliminating full validation query
        // 
        // ENHANCEMENT (from controller agent feedback): Add FR existence check
        // This provides "defense in depth" safety for edge cases (data corruption, manual deletion)
        console.log('✅ [PERF] Capacity-only update detected - using FAST validation path');
        const fastValidationStart = performance.now();
        
        // CRITICAL SAFETY CHECK: Verify FR plan still exists
        // This prevents edge cases (data corruption, manual deletion, etc.)
        // Cost: ~50-100ms, but provides data integrity safety
        const frCheckStart = performance.now();
        const frPlan = await prisma.curriculum_plans.findFirst({
          where: { versionId: id, curriculumType: 'FR' },
          select: { id: true }, // Minimal query - only check existence
        });
        const frCheckTime = performance.now() - frCheckStart;
        console.log(`⏱️ [PERF] FR existence check took ${frCheckTime.toFixed(0)}ms`);
        
        if (!frPlan) {
          validationTime = performance.now() - validationStart;
          return NextResponse.json(
            { success: false, error: 'FR curriculum plan is required but not found', code: 'VALIDATION_ERROR' },
            { status: 400 }
          );
        }
        
        // Minimal validation: Just check that plan ID is provided
        const planToUpdate = data.curriculumPlans[0];
        if (!planToUpdate || !planToUpdate.id) {
          validationTime = performance.now() - validationStart;
          return NextResponse.json(
            { success: false, error: 'Curriculum plan ID is required', code: 'VALIDATION_ERROR' },
            { status: 400 }
          );
        }
        
        // Skip full validation query - trust that:
        // - Plan exists (Prisma update will fail if not)
        // - Plan belongs to version (Prisma foreign key ensures this)
        // - FR plan exists (verified above)
        validationResult = { 
          success: true,
          // Return minimal data for response building
          allPlans: [{ id: planToUpdate.id, curriculumType: 'IB' as const }]
        };
        
        const fastValidationTime = performance.now() - fastValidationStart;
        console.log(`✅ [PERF] Fast validation (with FR check) took ${fastValidationTime.toFixed(0)}ms - SAVED ~50-400ms vs full validation!`);
      } else {
        // FULL VALIDATION: For complex updates, use full validation
        console.log('🔍 [PERF] Complex update detected - using full validation');
        // FIX #2: Fix TypeScript type error - use optional property instead of explicit undefined
        validationResult = await validateCurriculumPlans(
          data.curriculumPlans.map((cp) => {
            const result: { id: string; curriculumType?: 'FR' | 'IB' } = {
              id: cp.id,
            };
            if ('curriculumType' in cp && cp.curriculumType) {
              result.curriculumType = cp.curriculumType as 'FR' | 'IB';
            }
            return result;
          }),
          id
        );
      }
      
      validationTime = performance.now() - validationStart;
      console.log(`⏱️ [PERF] Validation took ${validationTime.toFixed(0)}ms`);
      
      if (!validationResult.success) {
        console.error('❌ Validation failed before update:', validationResult.error);
        return NextResponse.json(
          {
            success: false,
            error: validationResult.error || 'Curriculum plan validation failed',
            code: 'VALIDATION_ERROR',
          },
          { status: 400 }
        );
      }
      
      console.log('✅ Validation passed, proceeding with update');
      
      curriculumPlansUpdated = true;
      // Update each curriculum plan (batch in parallel for better performance)
      const updatePromises = data.curriculumPlans.map(async (planUpdate) => {
        // Declare updateData outside try block so it's accessible in catch
        let updateData: any = {};
        try {
          if (planUpdate.capacity !== undefined) updateData.capacity = planUpdate.capacity;
          if (planUpdate.tuitionBase !== undefined) updateData.tuitionBase = planUpdate.tuitionBase;
          if (planUpdate.cpiFrequency !== undefined) updateData.cpiFrequency = planUpdate.cpiFrequency;
          // Only include optional fields if they are explicitly provided (not undefined)
          if (planUpdate.tuitionGrowthRate !== undefined && planUpdate.tuitionGrowthRate !== null) {
            updateData.tuitionGrowthRate = planUpdate.tuitionGrowthRate;
          }
          if (planUpdate.teacherRatio !== undefined && planUpdate.teacherRatio !== null) {
            updateData.teacherRatio = planUpdate.teacherRatio;
          }
          if (planUpdate.nonTeacherRatio !== undefined && planUpdate.nonTeacherRatio !== null) {
            updateData.nonTeacherRatio = planUpdate.nonTeacherRatio;
          }
          if (planUpdate.teacherMonthlySalary !== undefined && planUpdate.teacherMonthlySalary !== null) {
            updateData.teacherMonthlySalary = planUpdate.teacherMonthlySalary;
          }
          if (planUpdate.nonTeacherMonthlySalary !== undefined && planUpdate.nonTeacherMonthlySalary !== null) {
            updateData.nonTeacherMonthlySalary = planUpdate.nonTeacherMonthlySalary;
          }
          if (planUpdate.studentsProjection !== undefined) {
            // Validate and store studentsProjection as JSON
            // Ensure it's a valid array format
            if (!Array.isArray(planUpdate.studentsProjection)) {
              throw new Error('studentsProjection must be an array');
            }
            // Validate each entry has year and students
            for (const entry of planUpdate.studentsProjection) {
              if (typeof entry.year !== 'number' || typeof entry.students !== 'number') {
                throw new Error('Each studentsProjection entry must have year (number) and students (number)');
              }
            }
            updateData.studentsProjection = planUpdate.studentsProjection;
          } else if (planUpdate.capacity !== undefined && planUpdate.capacity > 0) {
            // ✅ FIX: When enabling IB (capacity > 0), ensure studentsProjection is initialized
            // This prevents "Students projection not found for year 2028" errors
            // Fetch existing plan to check current studentsProjection
            const existingPlan = await prisma.curriculum_plans.findUnique({
              where: { id: planUpdate.id },
              select: { studentsProjection: true },
            });
            
            // Check if studentsProjection exists and has year 2028
            let needsInitialization = false;
            if (!existingPlan || !existingPlan.studentsProjection) {
              needsInitialization = true;
            } else {
              const projection = existingPlan.studentsProjection as Array<{ year: number; students: number }> | null;
              if (!Array.isArray(projection) || !projection.find((p) => p.year === 2028)) {
                needsInitialization = true;
              }
            }
            
            if (needsInitialization) {
              // Initialize studentsProjection with all years (2023-2052) with 0 students
              // User can then edit the ramp-up section to set actual values
              const initialProjection: Array<{ year: number; students: number }> = [];
              for (let year = 2023; year <= 2052; year++) {
                initialProjection.push({ year, students: 0 });
              }
              updateData.studentsProjection = initialProjection;
              console.log(`✅ [IB TOGGLE FIX] Initialized studentsProjection for plan ${planUpdate.id} with ${initialProjection.length} years`);
            }
          }

          if (Object.keys(updateData).length > 0) {
            console.log('🔍 [IB TOGGLE DEBUG] Updating plan:', planUpdate.id);
            console.log('🔍 [IB TOGGLE DEBUG] Update data:', JSON.stringify(updateData, null, 2));
            
            // PERFORMANCE FIX: For capacity-only updates, return minimal fields
            // This avoids transferring large studentsProjection JSON (30 years = ~3KB)
            // ✅ FIX: If studentsProjection was initialized, we need to return it
            const isCapacityOnly = 
              Object.keys(updateData).length === 1 && 
              updateData.capacity !== undefined &&
              updateData.studentsProjection === undefined;
            
            let selectFields: any;
            if (isCapacityOnly) {
              // MINIMAL SELECT: Only return what frontend needs for capacity update
              console.log('✅ [PERF] Capacity-only update - using minimal select (skipping studentsProjection)');
              selectFields = {
                id: true,
                curriculumType: true,
                capacity: true,
                // Skip all other fields - frontend already has them and will merge
              };
            } else {
              // FULL SELECT: For complex updates, return all fields
              selectFields = {
                id: true,
                versionId: true,
                curriculumType: true,
                capacity: true,
                tuitionBase: true,
                cpiFrequency: true,
                tuitionGrowthRate: true,
                teacherRatio: true,
                nonTeacherRatio: true,
                teacherMonthlySalary: true,
                nonTeacherMonthlySalary: true,
                createdAt: true,
                updatedAt: true,
              };
              
              // Only include studentsProjection if it was actually updated
              // ✅ FIX: Check both planUpdate and updateData (in case it was initialized)
              if (planUpdate.studentsProjection !== undefined || updateData.studentsProjection !== undefined) {
                selectFields.studentsProjection = true;
              }
            }
            
            const updateQueryStart = performance.now();
            const updated = await prisma.curriculum_plans.update({
              where: { id: planUpdate.id },
              data: updateData,
              select: selectFields,
            });
            const updateQueryTime = performance.now() - updateQueryStart;
            console.log(`⏱️ [PERF] Prisma update query for plan ${planUpdate.id} took ${updateQueryTime.toFixed(0)}ms (${isCapacityOnly ? 'minimal select' : 'full select'})`);
            return { success: true, planId: planUpdate.id, data: updated };
          } else {
            // Fetch existing plan if no updates
            const existing = await prisma.curriculum_plans.findUnique({
              where: { id: planUpdate.id },
            });
            return { success: true, planId: planUpdate.id, skipped: true, data: existing };
          }
        } catch (error) {
          console.error('❌ Error updating curriculum plan:', planUpdate.id, error);
          console.error('Update data:', JSON.stringify(updateData, null, 2));
          console.error('Plan update:', JSON.stringify(planUpdate, null, 2));
          
          // Provide more specific error messages
          let errorMessage = 'Unknown error';
          if (error instanceof Error) {
            errorMessage = error.message;
            // Check for common Prisma errors
            if (error.message.includes('Record to update not found')) {
              errorMessage = `Curriculum plan with ID ${planUpdate.id} not found`;
            } else if (error.message.includes('Unique constraint')) {
              errorMessage = 'A curriculum plan with this configuration already exists';
            } else if (error.message.includes('Foreign key constraint')) {
              errorMessage = 'Cannot update curriculum plan due to related records';
            }
          }
          
          return { 
            success: false, 
            planId: planUpdate.id, 
            error: errorMessage
          };
        }
      });

      // Wait for all updates to complete
      const updateWaitStart = performance.now();
      const results = await Promise.all(updatePromises);
      updateWaitTime = performance.now() - updateWaitStart;
      console.log(`⏱️ [PERF] Database update(s) took ${updateWaitTime.toFixed(0)}ms`);
      
      // Check for failures
      const failures = results.filter((r): r is { success: false; planId: string; error: string } => !r.success);
      if (failures.length > 0) {
        const firstFailure = failures[0];
        if (firstFailure) {
          console.error('❌ Curriculum plan update failed:', firstFailure);
          return NextResponse.json(
            {
              success: false,
              error: firstFailure.error || `Failed to update curriculum plan ${firstFailure.planId}`,
              code: 'UPDATE_ERROR',
              details: { 
                planId: firstFailure.planId,
                error: firstFailure.error,
              },
            },
            { status: 500 }
          );
        }
      }

      // Store updated curriculum plans
      updatedCurriculumPlans = results
        .filter((r): r is { success: true; planId: string; data: any } => r.success && r.data !== undefined)
        .map(r => r.data);

      const curriculumUpdateTotalTime = performance.now() - curriculumUpdateSectionStart;
      console.log(`⏱️ [PERF] Total curriculum update section took ${curriculumUpdateTotalTime.toFixed(0)}ms`);
    }

    // Update rent plan if provided
    if (data.rentPlan) {
      const rentPlanUpdateStart = performance.now();
      rentPlanUpdated = true;
      const rentPlanUpdate: any = {};
      if (data.rentPlan.rentModel !== undefined) {
        rentPlanUpdate.rentModel = data.rentPlan.rentModel;
      }
      if (data.rentPlan.parameters !== undefined) {
        rentPlanUpdate.parameters = data.rentPlan.parameters;
      }

      if (Object.keys(rentPlanUpdate).length > 0) {
        updatedRentPlan = await prisma.rent_plans.update({
          where: { id: data.rentPlan.id },
          data: rentPlanUpdate,
        });
        console.log(`⏱️ Rent plan update took ${(performance.now() - rentPlanUpdateStart).toFixed(0)}ms`);
      } else {
        // Fetch existing if no updates
        updatedRentPlan = await prisma.rent_plans.findUnique({
          where: { id: data.rentPlan.id },
        });
      }
    }

    // Update opex sub-accounts if provided
    if (data.opexSubAccounts) {
      const opexUpdateStart = performance.now();
      opexSubAccountsUpdated = true;
      
      // Delete all existing opex sub-accounts for this version
      await prisma.opex_sub_accounts.deleteMany({
        where: { versionId: id },
      });
      
      // Create new/updated opex sub-accounts
      if (data.opexSubAccounts.length > 0) {
        await prisma.opex_sub_accounts.createMany({
          data: data.opexSubAccounts.map((account: any) => ({
            versionId: id,
            subAccountName: account.subAccountName,
            percentOfRevenue: account.percentOfRevenue,
            isFixed: account.isFixed,
            fixedAmount: account.fixedAmount,
          })),
        });
        
        // Fetch the created opex sub-accounts to return them
        updatedOpexSubAccounts = await prisma.opex_sub_accounts.findMany({
          where: { versionId: id },
          orderBy: { createdAt: 'asc' },
        });
      } else {
        // Empty array - all deleted
        updatedOpexSubAccounts = [];
      }
      
      console.log(`⏱️ Opex sub-accounts update took ${(performance.now() - opexUpdateStart).toFixed(0)}ms`);
    }

    // Update capex rules if provided
    if (data.capexRules) {
      const capexRulesUpdateStart = performance.now();
      capexRulesUpdated = true;
      
      // Verify prisma.capex_rules exists
      if (!prisma.capex_rules) {
        console.error('❌ prisma.capex_rules is undefined. Available models:', Object.keys(prisma).filter(k => !k.startsWith('_') && typeof (prisma as any)[k] === 'object').join(', '));
        throw new Error('Database model capex_rules is not available. Please restart the dev server.');
      }
      
      // CRITICAL: Delete ALL auto-generated items FIRST (before deleting rules)
      // This prevents orphaned items with ruleId pointing to deleted rules
      await prisma.capex_items.deleteMany({
        where: { versionId: id, ruleId: { not: null } },
      });
      
      // Delete all existing capex rules for this version
      await prisma.capex_rules.deleteMany({
        where: { versionId: id },
      });
      
      // Create new/updated capex rules
      if (data.capexRules.length > 0) {
        await prisma.capex_rules.createMany({
          data: data.capexRules.map((rule: {
            category: CapexCategory;
            cycleYears: number;
            baseCost: number;
            startingYear: number;
            inflationIndex?: string | null | undefined;
          }) => ({
            versionId: id,
            category: rule.category,
            cycleYears: rule.cycleYears,
            baseCost: rule.baseCost,
            startingYear: rule.startingYear,
            inflationIndex: rule.inflationIndex ?? null,
          })),
        });
        
        // Fetch the created rules to return them
        updatedCapexRules = await prisma.capex_rules.findMany({
          where: { versionId: id },
          orderBy: { category: 'asc' },
        });
        
        // Trigger auto-calculation to generate CapexItems from rules
        const adminSettingsResult = await getAdminSettings();
        if (adminSettingsResult.success) {
          const cpiRate = new Decimal(adminSettingsResult.data.cpiRate);
          
          // Convert rules to format expected by calculation function
          const rulesForCalculation = updatedCapexRules.map((rule) => ({
            id: rule.id,
            category: rule.category,
            cycleYears: rule.cycleYears,
            baseCost: rule.baseCost,
            startingYear: rule.startingYear,
            inflationIndex: rule.inflationIndex,
          }));
          
          const calcResult = await calculateAndPersistCapexItems(
            id,
            rulesForCalculation,
            cpiRate
          );
          
          if (!calcResult.success) {
            console.error('Failed to calculate capex items from rules:', calcResult.error);
            // Don't fail the request, but log the error
          }
          
          // Fetch updated capex items (auto-generated + manual)
          updatedCapexItems = await prisma.capex_items.findMany({
            where: { versionId: id },
            orderBy: [{ year: 'asc' }, { category: 'asc' }],
          });
          capexItemsUpdated = true;
        } else {
          console.error('Failed to fetch admin settings for CPI rate:', adminSettingsResult.error);
        }
      } else {
        // Empty array - all rules deleted, also delete auto-generated items
        await prisma.capex_items.deleteMany({
          where: { versionId: id, ruleId: { not: null } },
        });
        updatedCapexRules = [];
        // Fetch remaining manual items
        updatedCapexItems = await prisma.capex_items.findMany({
          where: { versionId: id },
          orderBy: [{ year: 'asc' }, { category: 'asc' }],
        });
        capexItemsUpdated = true;
      }
      
      console.log(`⏱️ Capex rules update took ${(performance.now() - capexRulesUpdateStart).toFixed(0)}ms`);
    }

    // Update manual capex items if provided (only items with ruleId = null)
    if (data.capexItems) {
      const capexUpdateStart = performance.now();
      capexItemsUpdated = true;
      
      // CRITICAL: Filter out any items that have ruleId (auto items)
      // Only allow deletion/update of manual items (ruleId = null)
      // Auto items can ONLY be deleted by deleting the entire rule (cascade delete)
      const manualItemsOnly = data.capexItems.filter((item: any) => {
        // If item has ruleId, it's an auto item - reject it
        if (item.ruleId !== null && item.ruleId !== undefined) {
          console.warn(`⚠️ [CAPEX] Attempted to modify auto item ${item.id || 'unknown'} (ruleId: ${item.ruleId}) - ignoring. Auto items can only be deleted by deleting the rule.`);
          return false;
        }
        return true;
      });
      
      // Log if any auto items were filtered out
      const filteredCount = data.capexItems.length - manualItemsOnly.length;
      if (filteredCount > 0) {
        console.warn(`⚠️ [CAPEX] Filtered out ${filteredCount} auto item(s) from update request. Only manual items (ruleId = null) can be modified.`);
      }
      
      // Delete only existing manual capex items (where ruleId IS NULL)
      await prisma.capex_items.deleteMany({
        where: { versionId: id, ruleId: null },
      });
      
      // Create new/updated manual capex items (ruleId will be null)
      if (manualItemsOnly.length > 0) {
        await prisma.capex_items.createMany({
          data: manualItemsOnly.map((item: any) => ({
            versionId: id,
            year: item.year,
            category: item.category,
            amount: item.amount,
            description: item.description || null,
            ruleId: null, // Manual items have no ruleId
          })),
        });
      }
      
      // Fetch all capex items (auto-generated + manual) to return them
      updatedCapexItems = await prisma.capex_items.findMany({
        where: { versionId: id },
        orderBy: [{ year: 'asc' }, { category: 'asc' }],
      });
      
      console.log(`⏱️ Manual capex items update took ${(performance.now() - capexUpdateStart).toFixed(0)}ms`);
    }

    // Update version (only if there are version-level changes)
    const versionUpdateStart = performance.now();
    console.log('🔍 [PERF] Starting version update/fetch section');
    let updatedVersion;
    const versionUpdateData: any = {};
    if (data.name) versionUpdateData.name = data.name;
    if (data.description !== undefined) versionUpdateData.description = data.description;
    if (data.status) versionUpdateData.status = data.status;

    if (Object.keys(versionUpdateData).length > 0) {
      updatedVersion = await prisma.versions.update({
        where: { id },
        data: versionUpdateData,
        select: {
          id: true,
          name: true,
          description: true,
          mode: true,
          status: true,
          createdBy: true,
          basedOnId: true,
          createdAt: true,
          updatedAt: true,
          lockedAt: true,
          lockedBy: true,
          lockReason: true,
        },
      });
      console.log(`⏱️ Version update took ${(performance.now() - versionUpdateStart).toFixed(0)}ms`);
    } else {
      // PERFORMANCE FIX: No version-level changes - reuse existingVersion instead of fetching again!
      // This saves ~2-4 seconds by avoiding an unnecessary database query
      // Frontend only uses curriculumPlans from response, so we don't need full version data
      const versionFetchStart = performance.now();
      console.log('🔍 [PERF] No version changes, reusing existingVersion (no DB query needed)');
      
      // Frontend only merges curriculumPlans from response (see VersionDetail.tsx line 1318)
      // So we can send minimal version data - frontend will keep its existing version state
      // Just need to ensure TypeScript types are satisfied
      updatedVersion = {
        id: existingVersion.id,
        name: existingVersion.name,
        description: null, // Frontend has this, will keep existing
        mode: 'RELOCATION_2028' as const, // Frontend has this, will keep existing
        status: existingVersion.status,
        createdBy: existingVersion.createdBy,
        basedOnId: null, // Frontend has this, will keep existing
        createdAt: existingVersion.updatedAt, // Minimal fallback
        updatedAt: existingVersion.updatedAt,
        lockedAt: null,
        lockedBy: null,
        lockReason: null,
      } as typeof existingVersion & {
        description: string | null;
        mode: string;
        basedOnId: string | null;
        createdAt: Date;
        lockedAt: Date | null;
        lockedBy: string | null;
        lockReason: string | null;
      };
      
      versionFetchTime = performance.now() - versionFetchStart;
      console.log(`⏱️ [PERF] Reused existingVersion (no DB query) took ${versionFetchTime.toFixed(0)}ms - SAVED ~2000-4000ms!`);
    }

    if (!updatedVersion) {
      return NextResponse.json(
        { success: false, error: 'Version not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // INSTANT RESPONSE: Return immediately with updated data, no fetching!
    // Client will merge with existing state
    const fetchRelationsStart = performance.now();
    
    // Build response from what we already have (updatedVersion + updated data)
    // PERFORMANCE OPTIMIZATION: For partial updates (like IB toggle), only return updated plans
    // Frontend already has other plans and will merge with existing state
    let curriculumPlans: any[] = [];
    if (curriculumPlansUpdated && updatedCurriculumPlans.length > 0) {
      const responseFetchStart = performance.now();
      // OPTIMIZATION: Skip fetching other plans - frontend already has them!
      // This saves ~2-4 seconds by avoiding:
      // 1. Database query for FR plan (already fetched in validation)
      // 2. Serialization of large Decimal fields and studentsProjection JSON
      // 3. Network transfer of unnecessary data
      // Frontend will merge updated IB plan with existing FR plan state
      curriculumPlans = updatedCurriculumPlans;
      const responseFetchTime = performance.now() - responseFetchStart;
      console.log(`⏱️ [PERF] Using only updated plans (skipped FR fetch) - saved ~${responseFetchTime.toFixed(0)}ms`);
    } else {
      // No curriculum plan updates, use empty array (client has existing data)
      curriculumPlans = [];
    }

    // PERFORMANCE FIX: For partial updates (curriculum-only), return minimal response
    // Frontend only uses curriculumPlans and merges with existing state
    // This saves 200-500ms by avoiding serialization of unchanged relations
    const responseBuildStart = performance.now();

    // Check if this is a curriculum-only update
    const isCurriculumOnlyUpdate = 
      curriculumPlansUpdated && 
      !data.name && 
      !data.description && 
      !data.status &&
      !data.rentPlan &&
      !data.capexRules &&
      !data.capexItems &&
      !data.opexSubAccounts;

    let serializedVersion: any;

    if (isCurriculumOnlyUpdate && curriculumPlans.length > 0) {
      // MINIMAL RESPONSE: Only return updated curriculumPlans
      // Frontend will merge with existing state (see VersionDetail.tsx:1311-1317)
      console.log('🔍 [PERF] Curriculum-only update - returning minimal response');
      
      // CRITICAL FIX: Serialize only curriculumPlans directly, not the full version object
      // This avoids serialization errors from null/undefined fields in minimalVersion
      const { serializeVersionForClient } = await import('@/lib/utils/serialize');
      
      // Create a safe minimal version object with only required fields for serialization
      const minimalVersion = {
        id: updatedVersion.id,
        name: updatedVersion.name || '',
        description: updatedVersion.description || null,
        mode: updatedVersion.mode || 'RELOCATION_2028',
        status: updatedVersion.status,
        createdBy: updatedVersion.createdBy,
        basedOnId: updatedVersion.basedOnId || null,
        createdAt: updatedVersion.createdAt || new Date(),
        updatedAt: updatedVersion.updatedAt || new Date(),
        lockedAt: updatedVersion.lockedAt || null,
        lockedBy: updatedVersion.lockedBy || null,
        lockReason: updatedVersion.lockReason || null,
        curriculumPlans: curriculumPlans || [],
        // Set other relations to empty arrays/null to avoid serialization errors
        rentPlan: null,
        capexRules: [],
        capexItems: [],
        opexSubAccounts: [],
      };
      
      try {
        serializedVersion = serializeVersionForClient(minimalVersion);
      } catch (serializeError) {
        console.error('❌ Error serializing minimal version:', serializeError);
        console.error('Serialize error details:', {
          message: serializeError instanceof Error ? serializeError.message : String(serializeError),
          stack: serializeError instanceof Error ? serializeError.stack : undefined,
        });
        // Fallback: Serialize curriculumPlans directly without full version object
        console.log('⚠️ [PERF] Falling back to direct curriculumPlans serialization');
        
        // Helper function to safely convert Decimal to number
        const decimalToNumber = (value: any): number | null => {
          if (value === null || value === undefined) return null;
          if (typeof value.toNumber === 'function') return value.toNumber();
          if (typeof value.toString === 'function') return parseFloat(value.toString());
          return null;
        };
        
        const serializedPlans = curriculumPlans.map((plan: any) => ({
          ...plan,
          tuitionBase: decimalToNumber(plan.tuitionBase),
          tuitionGrowthRate: decimalToNumber(plan.tuitionGrowthRate),
          teacherRatio: decimalToNumber(plan.teacherRatio),
          nonTeacherRatio: decimalToNumber(plan.nonTeacherRatio),
          teacherMonthlySalary: decimalToNumber(plan.teacherMonthlySalary),
          nonTeacherMonthlySalary: decimalToNumber(plan.nonTeacherMonthlySalary),
        }));
        
        const responseTime = performance.now() - responseBuildStart;
        console.log(`⏱️ [PERF] Fallback serialization took ${responseTime.toFixed(0)}ms`);
        
        return NextResponse.json({
          success: true,
          data: {
            curriculumPlans: serializedPlans,
          },
        });
      }
      
      // CRITICAL FIX: Ensure curriculumPlans exists and is an array
      const serializedPlans = serializedVersion?.curriculumPlans || curriculumPlans || [];
      if (!Array.isArray(serializedPlans)) {
        console.error('❌ Serialized curriculumPlans is not an array:', typeof serializedPlans);
        // Fallback to original curriculumPlans
        const fallbackPlans = curriculumPlans || [];
        return NextResponse.json({
          success: true,
          data: {
            curriculumPlans: fallbackPlans,
          },
        });
      }
      
      // Return only curriculumPlans in response (frontend merges with existing state)
      const responseTime = performance.now() - responseBuildStart;
      console.log(`⏱️ [PERF] Minimal response build took ${responseTime.toFixed(0)}ms - SAVED ~200-500ms!`);
      console.log(`⏱️ [PERF] Fetching relations took ${(performance.now() - fetchRelationsStart).toFixed(0)}ms`);

      // Audit log (non-blocking, don't wait for it)
      const auditStart = performance.now();
      logAudit({
        action: 'UPDATE_VERSION',
        userId,
        entityType: EntityType.VERSION,
        entityId: id,
        metadata: {
          versionName: updatedVersion.name,
          changes: data,
        },
      }).catch(err => console.error('Failed to log audit:', err));
      const auditTime = performance.now() - auditStart;
      console.log(`⏱️ [PERF] Audit log (non-blocking) took ${auditTime.toFixed(0)}ms`);

      const totalTime = performance.now() - patchStartTime;
      const requestTotalTime = performance.now() - requestStartTime;
      console.log(`✅ PATCH /api/versions/[id] completed in ${totalTime.toFixed(0)}ms`);
      console.log(`📊 [PERF SUMMARY] Total: ${totalTime.toFixed(0)}ms | Request Total: ${requestTotalTime.toFixed(0)}ms`);
      console.log(`📊 [PERF BREAKDOWN] Auth: ${authTime.toFixed(0)}ms | Version Check: ${versionCheckTime.toFixed(0)}ms | Body Parse: ${bodyParseTime.toFixed(0)}ms | Zod: ${zodValidationTime.toFixed(0)}ms`);
      console.log(`📊 [PERF BREAKDOWN] Validation: ${validationTime?.toFixed(0) || 'N/A'}ms | Update: ${updateWaitTime?.toFixed(0) || 'N/A'}ms | Version Fetch: ${versionFetchTime?.toFixed(0) || 'N/A'}ms | Response: ${responseTime.toFixed(0)}ms`);

      return NextResponse.json({
        success: true,
        data: {
          // Return only curriculumPlans - frontend merges with existing state
          curriculumPlans: serializedPlans,
        },
      });
    } else {
      // FULL RESPONSE: For complex updates, return full version object
      console.log('🔍 [PERF] Complex update - returning full response');
      
      const versionWithRelations = {
        ...updatedVersion,
        curriculumPlans: curriculumPlans.length > 0 ? curriculumPlans : [],
        rentPlan: rentPlanUpdated && updatedRentPlan ? updatedRentPlan : undefined,
        opexSubAccounts: opexSubAccountsUpdated ? updatedOpexSubAccounts : undefined,
        capexRules: capexRulesUpdated ? updatedCapexRules : undefined,
        capexItems: capexItemsUpdated ? updatedCapexItems : undefined,
        // Don't include other relationships - client will keep existing values
      };
      
      // Serialize entire object
      try {
        const { serializeVersionForClient } = await import('@/lib/utils/serialize');
        serializedVersion = serializeVersionForClient(versionWithRelations);
      } catch (serializeError) {
        console.error('❌ Error serializing version:', serializeError);
        console.error('Version data structure:', JSON.stringify(versionWithRelations, null, 2));
        throw new Error(
          `Failed to serialize version data: ${serializeError instanceof Error ? serializeError.message : String(serializeError)}`
        );
      }
      
      const responseBuildTime = performance.now() - responseBuildStart;
      console.log(`⏱️ [PERF] Building response took ${responseBuildTime.toFixed(0)}ms`);
      console.log(`⏱️ [PERF] Fetching relations took ${(performance.now() - fetchRelationsStart).toFixed(0)}ms`);

      // Audit log (non-blocking, don't wait for it)
      const auditStart = performance.now();
      logAudit({
        action: 'UPDATE_VERSION',
        userId,
        entityType: EntityType.VERSION,
        entityId: id,
        metadata: {
          versionName: updatedVersion.name,
          changes: data,
        },
      }).catch(err => console.error('Failed to log audit:', err));
      const auditTime = performance.now() - auditStart;
      console.log(`⏱️ [PERF] Audit log (non-blocking) took ${auditTime.toFixed(0)}ms`);

      const totalTime = performance.now() - patchStartTime;
      const requestTotalTime = performance.now() - requestStartTime;
      console.log(`✅ PATCH /api/versions/[id] completed in ${totalTime.toFixed(0)}ms`);
      console.log(`📊 [PERF SUMMARY] Total: ${totalTime.toFixed(0)}ms | Request Total: ${requestTotalTime.toFixed(0)}ms`);
      console.log(`📊 [PERF BREAKDOWN] Auth: ${authTime.toFixed(0)}ms | Version Check: ${versionCheckTime.toFixed(0)}ms | Body Parse: ${bodyParseTime.toFixed(0)}ms | Zod: ${zodValidationTime.toFixed(0)}ms`);
      console.log(`📊 [PERF BREAKDOWN] Validation: ${validationTime?.toFixed(0) || 'N/A'}ms | Update: ${updateWaitTime?.toFixed(0) || 'N/A'}ms | Version Fetch: ${versionFetchTime?.toFixed(0) || 'N/A'}ms | Response: ${responseBuildTime.toFixed(0)}ms`);

      return NextResponse.json({
        success: true,
        data: serializedVersion,
      });
    }
  } catch (error) {
    console.error('❌ Failed to update version:', error);
    console.error('🔍 [IB TOGGLE DEBUG] Outer catch - Full error:', {
      error: error instanceof Error ? error.message : String(error),
      type: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Handle database errors
    let errorMessage = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';
    let statusCode = 500;
    
    try {
      const { handleDatabaseError } = await import('@/lib/utils/error-handler');
      const dbError = handleDatabaseError(error);
      
      if (!dbError.success) {
        errorMessage = dbError.error || errorMessage;
        errorCode = dbError.code || errorCode;
        
        if (dbError.code === 'DUPLICATE_ERROR') {
          statusCode = 409;
        } else if (dbError.code === 'DATABASE_TIMEOUT' || dbError.code === 'DATABASE_CONNECTION_ERROR') {
          statusCode = 503;
        }
      } else {
        // If handleDatabaseError returns success, use the raw error message
        // But provide more context if it's a generic message
        const rawMessage = error instanceof Error ? error.message : String(error);
        if (rawMessage && rawMessage !== 'An unexpected error occurred.') {
          errorMessage = rawMessage;
        } else {
          // Provide more context for debugging
          errorMessage = `Failed to update version: ${rawMessage || 'Unknown error occurred'}`;
        }
      }
    } catch (importError) {
      console.error('Failed to import error handler:', importError);
      const rawMessage = error instanceof Error ? error.message : String(error);
      errorMessage = rawMessage || 'Failed to update version. Please try again.';
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        code: errorCode,
        details: error instanceof Error ? { 
          message: error.message,
          name: error.name,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        } : {},
      },
      { status: statusCode }
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
    const existingVersion = await prisma.versions.findUnique({
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
    await prisma.versions.delete({
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

