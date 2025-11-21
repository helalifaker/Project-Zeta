import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { updateTransitionYear } from '@/services/transition';
import { TransitionYearUpdateSchema } from '@/lib/validation/transition';

/**
 * PUT /api/admin/transition/year/[year]
 *
 * Updates a specific transition year's data (2025, 2026, or 2027)
 *
 * Authorization: ADMIN only
 *
 * Request body:
 * {
 *   targetEnrollment?: 1850,
 *   staffCostBase?: 8500000,
 *   notes?: "Updated capacity"
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     id: "...",
 *     year: 2025,
 *     targetEnrollment: 1850,
 *     staffCostBase: "8500000.00",
 *     notes: "Updated capacity",
 *     createdAt: "...",
 *     updatedAt: "..."
 *   }
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { year: string } }
): Promise<NextResponse> {
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

    // Parse year from params
    const year = parseInt(params.year, 10);
    if (isNaN(year)) {
      return NextResponse.json(
        { success: false, error: 'Invalid year parameter' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = TransitionYearUpdateSchema.safeParse({
      year,
      ...body,
    });

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
    const result = await updateTransitionYear(validationResult.data, session.user.id);

    if (!result.success) {
      const statusCode = result.code === 'YEAR_NOT_FOUND' ? 404 : 400;
      return NextResponse.json({ success: false, error: result.error }, { status: statusCode });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error(`API Error [PUT /api/admin/transition/year/${params.year}]:`, error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
