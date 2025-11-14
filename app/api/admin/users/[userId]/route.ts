/**
 * User Management API Route (Single User)
 * GET: Get user details
 * PATCH: Update user
 * DELETE: Delete user
 */

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { getUserById, updateUser, deleteUser } from '@/services/admin/users';
import { UpdateUserSchema } from '@/lib/validation/admin';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

/**
 * GET /api/admin/users/[userId]
 * Get user details
 */
export async function GET(
  _req: Request,
  { params }: RouteParams
): Promise<Response> {
  try {
    // Require ADMIN role
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error, code: authResult.code },
        { status: 401 }
      );
    }

    const { userId } = await params;
    const result = await getUserById(userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Unexpected error in GET /api/admin/users/[userId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[userId]
 * Update user
 */
export async function PATCH(
  req: Request,
  { params }: RouteParams
): Promise<Response> {
  try {
    // Require ADMIN role
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error, code: authResult.code },
        { status: 401 }
      );
    }

    const { userId } = await params;
    const body = await req.json();
    const validation = UpdateUserSchema.safeParse(body);

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

    const result = await updateUser(userId, validation.data, authResult.data.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/admin/users/[userId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[userId]
 * Delete user
 */
export async function DELETE(
  _req: Request,
  { params }: RouteParams
): Promise<Response> {
  try {
    // Require ADMIN role
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error, code: authResult.code },
        { status: 401 }
      );
    }

    const { userId } = await params;
    const result = await deleteUser(userId, authResult.data.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/admin/users/[userId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

