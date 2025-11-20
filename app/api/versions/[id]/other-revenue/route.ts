/**
 * Other Revenue Items API
 * 
 * Endpoints:
 * - GET /api/versions/[id]/other-revenue - Fetch all other revenue items for a version
 * - POST /api/versions/[id]/other-revenue - Upsert other revenue items (bulk)
 * 
 * Reference: FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md (lines 375-425)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOtherRevenueByVersion, updateOtherRevenue } from '@/services/other-revenue';
import { requireAuth } from '@/lib/auth/middleware';

/**
 * Result type for API responses
 */
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

/**
 * Validation schema for other revenue item
 */
const OtherRevenueItemSchema = z.object({
  year: z.number().int().min(2023).max(2052),
  amount: z.number().nonnegative(),
});

/**
 * Validation schema for bulk upsert
 */
const BulkUpsertSchema = z.object({
  items: z.array(OtherRevenueItemSchema).min(1).max(30), // 30 years max
});

/**
 * GET /api/versions/[id]/other-revenue
 * 
 * Fetch all other revenue items for a version (2023-2052)
 * 
 * @param req - Next.js request
 * @param params - Route parameters { id: versionId }
 * @returns JSON response with other revenue items
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: versionId } = await params;

  try {
    // ✅ FIX 6: Require authentication
    const authResult = await requireAuth();
    if (!authResult.success) {
      return NextResponse.json(authResult, { status: 401 });
    }

    // ✅ FIX 4: Use service layer
    const result = await getOtherRevenueByVersion(versionId);
    
    if (!result.success) {
      // Return 500 for service errors, not 404 (404 is for route not found)
      return NextResponse.json(result, { status: 500 });
    }
    
    // ✅ Always return 200 OK, even if items array is empty

    const items = result.data;
    const serializedItems = items.map((item) => ({
      id: item.id,
      year: item.year,
      amount: item.amount,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          versionId,
          items: serializedItems,
          totalAmount: serializedItems.reduce((sum, item) => sum + item.amount, 0),
        },
      } as Result<{
        versionId: string;
        items: typeof serializedItems;
        totalAmount: number;
      }>,
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/versions/[id]/other-revenue]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch other revenue items',
        code: 'INTERNAL_ERROR',
      } as Result<never>,
      { status: 500 }
    );
  }
}

/**
 * POST /api/versions/[id]/other-revenue
 * 
 * Upsert other revenue items (bulk) for a version
 * Replaces all existing other revenue items with provided items
 * 
 * @param req - Next.js request
 * @param params - Route parameters { id: versionId }
 * @returns JSON response with upserted other revenue items
 * 
 * @example
 * POST /api/versions/abc-123/other-revenue
 * Body:
 * {
 *   "items": [
 *     { "year": 2028, "amount": 500000 },
 *     { "year": 2029, "amount": 750000 }
 *   ]
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: versionId } = await params;

  try {
    // ✅ FIX 6: Require authentication
    const authResult = await requireAuth();
    if (!authResult.success) {
      return NextResponse.json(authResult, { status: 401 });
    }

    const userId = authResult.data.id;

    // Parse and validate request body
    const body = await req.json();
    const validation = BulkUpsertSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          code: 'VALIDATION_ERROR',
          details: validation.error.flatten(),
        } as Result<never>,
        { status: 400 }
      );
    }

    const { items } = validation.data;

    // Check for duplicate years in request
    const years = items.map((item) => item.year);
    const uniqueYears = new Set(years);
    if (years.length !== uniqueYears.size) {
      return NextResponse.json(
        {
          success: false,
          error: 'Duplicate years in request',
          code: 'DUPLICATE_YEARS',
        } as Result<never>,
        { status: 400 }
      );
    }

    // ✅ FIX 4: Use service layer (includes validation, transaction, audit logging)
    const result = await updateOtherRevenue(versionId, items, userId);

    if (!result.success) {
      const status = result.code === 'VERSION_NOT_FOUND' ? 404 
        : result.code === 'VERSION_LOCKED' ? 403
        : result.code === 'VALIDATION_ERROR' ? 400
        : 500;
      return NextResponse.json(result, { status });
    }

    // Serialize result
    const serializedResult = result.data.map((item) => ({
      id: item.id,
      year: item.year,
      amount: item.amount,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          versionId,
          items: serializedResult,
          totalAmount: serializedResult.reduce((sum, item) => sum + item.amount, 0),
        },
      } as Result<{
        versionId: string;
        items: typeof serializedResult;
        totalAmount: number;
      }>,
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/versions/[id]/other-revenue]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upsert other revenue items',
        code: 'INTERNAL_ERROR',
      } as Result<never>,
      { status: 500 }
    );
  }
}

