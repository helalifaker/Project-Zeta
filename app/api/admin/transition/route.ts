import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import {
  getCompleteTransitionConfig,
  updateTransitionYear,
  updateTransitionSettings,
} from '@/services/transition';
import { BulkTransitionUpdateSchema } from '@/lib/validation/transition';

/**
 * GET /api/admin/transition
 *
 * Fetches complete transition configuration including:
 * - Global settings (capacity cap, rent adjustment percent, base year values)
 * - Year-specific data for 2025, 2026, 2027
 *
 * Authorization: ADMIN only
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     settings: {
 *       capacityCap: 1850,
 *       rentAdjustmentPercent: 10.0,
 *       staffCostBase2024: "8000000",
 *       rentBase2024: "2500000"
 *     },
 *     yearData: [
 *       {
 *         id: "...",
 *         year: 2025,
 *         targetEnrollment: 1850,
 *         staffCostBase: "8500000",
 *         averageTuitionPerStudent: "50000",
 *         otherRevenue: "100000",
 *         staffCostGrowthPercent: "5.0",
 *         rentGrowthPercent: "10.0",
 *         notes: "...",
 *         ...
 *       },
 *       ...
 *     ]
 *   }
 * }
 */
export async function GET(): Promise<NextResponse> {
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

    // Fetch complete transition configuration
    const result = await getCompleteTransitionConfig();

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('API Error [GET /api/admin/transition]:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/transition
 *
 * Updates transition configuration (settings and/or year data)
 *
 * Authorization: ADMIN only
 *
 * Request Body:
 * {
 *   settings?: {
 *     capacityCap?: number,
 *     rentAdjustmentPercent?: number,
 *     transitionStaffCostBase2024?: number,
 *     transitionRentBase2024?: number
 *   },
 *   yearData?: [
 *     {
 *       year: 2025,
 *       targetEnrollment?: number,
 *       staffCostBase?: number,
 *       averageTuitionPerStudent?: number,
 *       otherRevenue?: number,
 *       staffCostGrowthPercent?: number,
 *       rentGrowthPercent?: number,
 *       notes?: string
 *     },
 *     ...
 *   ]
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     settings: { ... },
 *     yearData: [ ... ]
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
    const validationResult = BulkTransitionUpdateSchema.safeParse(body);

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

    const { settings, yearData } = validationResult.data;
    const userId = session.user.id;

    // Update settings if provided
    if (settings) {
      const settingsResult = await updateTransitionSettings(settings, userId);

      if (!settingsResult.success) {
        return NextResponse.json({ success: false, error: settingsResult.error }, { status: 500 });
      }
    }

    // Update year data if provided
    if (yearData && yearData.length > 0) {
      for (const yearUpdate of yearData) {
        const yearResult = await updateTransitionYear(yearUpdate, userId);

        if (!yearResult.success) {
          return NextResponse.json({ success: false, error: yearResult.error }, { status: 500 });
        }
      }
    }

    // Fetch complete updated configuration
    const result = await getCompleteTransitionConfig();

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Transition configuration updated successfully',
    });
  } catch (error) {
    console.error('API Error [PUT /api/admin/transition]:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
