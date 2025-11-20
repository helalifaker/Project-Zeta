/**
 * Balance Sheet Settings API
 * 
 * Endpoints:
 * - GET /api/versions/[id]/balance-sheet-settings - Fetch balance sheet settings for a version
 * - POST /api/versions/[id]/balance-sheet-settings - Upsert balance sheet settings
 * 
 * Reference: FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md (lines 389-425)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getBalanceSheetSettingsByVersion, updateBalanceSheetSettings } from '@/services/balance-sheet-settings';
import { requireAuth } from '@/lib/auth/middleware';

/**
 * Result type for API responses
 */
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

/**
 * Validation schema for balance sheet settings
 */
const BalanceSheetSettingsSchema = z.object({
  startingCash: z.number().nonnegative(),
  openingEquity: z.number().nonnegative(),
});

/**
 * GET /api/versions/[id]/balance-sheet-settings
 * 
 * Fetch balance sheet settings for a version
 * Returns defaults if settings don't exist
 * 
 * @param req - Next.js request
 * @param params - Route parameters { id: versionId }
 * @returns JSON response with balance sheet settings
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
    const result = await getBalanceSheetSettingsByVersion(versionId);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    const settings = result.data;

    // If settings don't exist, return defaults
    if (!settings) {
      return NextResponse.json(
        {
          success: true,
          data: {
            versionId,
            startingCash: 0,
            openingEquity: 0,
            createdAt: null,
            updatedAt: null,
            isDefault: true,
          },
        } as Result<{
          versionId: string;
          startingCash: number;
          openingEquity: number;
          createdAt: string | null;
          updatedAt: string | null;
          isDefault: boolean;
        }>,
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          versionId,
          startingCash: settings.startingCash,
          openingEquity: settings.openingEquity,
          createdAt: settings.createdAt.toISOString(),
          updatedAt: settings.updatedAt.toISOString(),
          isDefault: false,
        },
      } as Result<{
        versionId: string;
        startingCash: number;
        openingEquity: number;
        createdAt: string;
        updatedAt: string;
        isDefault: boolean;
      }>,
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/versions/[id]/balance-sheet-settings]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch balance sheet settings',
        code: 'INTERNAL_ERROR',
      } as Result<never>,
      { status: 500 }
    );
  }
}

/**
 * POST /api/versions/[id]/balance-sheet-settings
 * 
 * Upsert balance sheet settings for a version
 * Creates new settings if they don't exist, updates existing settings
 * 
 * @param req - Next.js request
 * @param params - Route parameters { id: versionId }
 * @returns JSON response with upserted balance sheet settings
 * 
 * @example
 * POST /api/versions/abc-123/balance-sheet-settings
 * Body:
 * {
 *   "startingCash": 5000000,
 *   "openingEquity": 10000000
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
    const validation = BalanceSheetSettingsSchema.safeParse(body);

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

    const { startingCash, openingEquity } = validation.data;

    // ✅ FIX 4: Use service layer (includes validation, transaction, audit logging)
    const result = await updateBalanceSheetSettings(
      versionId,
      { startingCash, openingEquity },
      userId
    );

    if (!result.success) {
      const status = result.code === 'VERSION_NOT_FOUND' ? 404 
        : result.code === 'VERSION_LOCKED' ? 403
        : result.code === 'VALIDATION_ERROR' ? 400
        : 500;
      return NextResponse.json(result, { status });
    }

    const settings = result.data;

    return NextResponse.json(
      {
        success: true,
        data: {
          versionId,
          startingCash: settings.startingCash,
          openingEquity: settings.openingEquity,
          createdAt: settings.createdAt.toISOString(),
          updatedAt: settings.updatedAt.toISOString(),
          isDefault: false,
        },
      } as Result<{
        versionId: string;
        startingCash: number;
        openingEquity: number;
        createdAt: string;
        updatedAt: string;
        isDefault: boolean;
      }>,
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/versions/[id]/balance-sheet-settings]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upsert balance sheet settings',
        code: 'INTERNAL_ERROR',
      } as Result<never>,
      { status: 500 }
    );
  }
}

