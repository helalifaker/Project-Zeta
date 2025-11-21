import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { recalculateTransitionStaffCosts } from '@/services/transition';
import { RecalculateStaffCostsSchema } from '@/lib/validation/transition';
import Decimal from 'decimal.js';

/**
 * POST /api/admin/transition/recalculate
 *
 * Recalculates all transition year staff costs (2025-2027) from 2028 baseline
 * using backward deflation with CPI rate.
 *
 * Formula: staffCost(year) = base2028 / (1 + cpiRate)^(2028 - year)
 *
 * Authorization: ADMIN only
 *
 * Request body:
 * {
 *   base2028StaffCost: 10000000,
 *   cpiRate: 0.03
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: [
 *     { id: "...", year: 2025, staffCostBase: "9151416.99", ... },
 *     { id: "...", year: 2026, staffCostBase: "9425958.99", ... },
 *     { id: "...", year: 2027, staffCostBase: "9708737.86", ... }
 *   ]
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
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
    const validationResult = RecalculateStaffCostsSchema.safeParse(body);

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

    const { base2028StaffCost, cpiRate } = validationResult.data;

    // Convert to Decimal for precision
    const base2028Decimal = new Decimal(base2028StaffCost);

    // Call service layer
    const result = await recalculateTransitionStaffCosts(base2028Decimal, cpiRate, session.user.id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('API Error [POST /api/admin/transition/recalculate]:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
