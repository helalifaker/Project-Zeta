import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { updateTransitionSettings } from '@/services/transition';
import { TransitionSettingsUpdateSchema } from '@/lib/validation/transition';

/**
 * PUT /api/admin/transition/settings
 *
 * Updates global transition settings (capacity cap and rent adjustment percent)
 *
 * Authorization: ADMIN only
 *
 * Request body:
 * {
 *   capacityCap?: 1850,
 *   rentAdjustmentPercent?: 10.0
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     capacityCap: 1850,
 *     rentAdjustmentPercent: 10.0
 *   }
 * }
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication check
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization check (ADMIN only)
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = TransitionSettingsUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    // Call service layer
    const result = await updateTransitionSettings(validationResult.data, session.user.id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('API Error [PUT /api/admin/transition/settings]:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
