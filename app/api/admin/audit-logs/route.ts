/**
 * Audit Logs API Route
 * GET: List audit logs with filters and pagination
 */

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { listAuditLogs } from '@/services/admin/audit';
import { AuditLogFiltersSchema } from '@/lib/validation/admin';

/**
 * GET /api/admin/audit-logs
 * List audit logs with filters and pagination
 */
export async function GET(req: Request): Promise<Response> {
  try {
    // Require ADMIN role
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error, code: authResult.code },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const filters = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined,
      userId: searchParams.get('userId') || undefined,
      entityType: searchParams.get('entityType') || undefined,
      action: searchParams.get('action') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    };

    const validation = AuditLogFiltersSchema.safeParse(filters);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const result = await listAuditLogs(validation.data);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Unexpected error in GET /api/admin/audit-logs:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

