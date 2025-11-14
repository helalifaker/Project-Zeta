/**
 * User Management API Route
 * GET: List all users
 * POST: Create new user
 */

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { listUsers, createUser } from '@/services/admin/users';
import { CreateUserSchema, UserListFiltersSchema } from '@/lib/validation/admin';

/**
 * GET /api/admin/users
 * List all users with filters and pagination
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
      role: searchParams.get('role') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const validation = UserListFiltersSchema.safeParse(filters);
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

    const result = await listUsers(validation.data, authResult.data.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Unexpected error in GET /api/admin/users:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create new user
 */
export async function POST(req: Request): Promise<Response> {
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
    const validation = CreateUserSchema.safeParse(body);

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

    const result = await createUser(validation.data, authResult.data.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'User created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/admin/users:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

