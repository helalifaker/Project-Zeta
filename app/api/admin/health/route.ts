/**
 * System Health API Route
 * GET: Get system health metrics
 */

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { getSystemHealth } from '@/services/admin/health';

/**
 * GET /api/admin/health
 * Get system health metrics
 */
export async function GET(): Promise<Response> {
  try {
    // Require ADMIN role
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error, code: authResult.code },
        { status: 401 }
      );
    }

    const result = await getSystemHealth();

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Unexpected error in GET /api/admin/health:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

