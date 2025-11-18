/**
 * System Health API Route
 * GET: Get system health metrics
 */

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { getSystemHealth } from '@/services/admin/health';
import { getCacheHeaders } from '@/lib/cache/revalidate';

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

    // Cache health data for 30 seconds (balance between freshness and performance)
    const headers = {
      'Cache-Control': getCacheHeaders(30, 60), // 30s cache, 60s stale
    };

    return NextResponse.json({ success: true, data: result.data }, { headers });
  } catch (error) {
    console.error('Unexpected error in GET /api/admin/health:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

