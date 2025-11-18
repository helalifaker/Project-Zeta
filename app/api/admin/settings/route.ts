/**
 * Admin Settings API Route
 * GET: Fetch all admin settings
 * PATCH: Update admin settings
 */

import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/middleware';
import { getAdminSettings, updateAdminSettings } from '@/services/admin/settings';
import { UpdateAdminSettingsSchema } from '@/lib/validation/admin';
import { getCacheHeaders } from '@/lib/cache/revalidate';

/**
 * GET /api/admin/settings
 * Fetch all admin settings
 * Note: Any authenticated user can read settings (needed for calculations)
 * Only updates require ADMIN role
 */
export async function GET(): Promise<Response> {
  try {
    // Allow any authenticated user to read settings (needed for calculations)
    const authResult = await requireAuth();
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error, code: authResult.code },
        { status: 401 }
      );
    }

    const result = await getAdminSettings();

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Settings rarely change - cache aggressively (10 minutes)
    const headers = {
      'Cache-Control': getCacheHeaders(600, 1200), // 10 min cache, 20 min stale
    };

    return NextResponse.json({ success: true, data: result.data }, { headers });
  } catch (error) {
    console.error('Unexpected error in GET /api/admin/settings:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/settings
 * Update admin settings
 */
export async function PATCH(req: Request): Promise<Response> {
  try {
    // Require ADMIN role
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error, code: authResult.code },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = UpdateAdminSettingsSchema.safeParse(body);

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

    const result = await updateAdminSettings(validation.data, authResult.data.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/admin/settings:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

