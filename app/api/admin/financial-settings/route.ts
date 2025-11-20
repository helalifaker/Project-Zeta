/**
 * API Route: Get All Financial Settings
 * 
 * Returns all financial settings needed for circular solver:
 * - Zakat rate
 * - Debt interest rate
 * - Bank deposit interest rate
 * - Minimum cash balance
 * - Working capital settings
 * 
 * This route runs server-side only (Prisma access).
 */

import { NextResponse } from 'next/server';
import { getAllFinancialSettings } from '@/lib/utils/admin-settings';

/**
 * GET /api/admin/financial-settings
 * 
 * Returns all financial settings as JSON (server-side only)
 */
export async function GET(): Promise<NextResponse> {
  try {
    const result = await getAllFinancialSettings();

    if (!result.success) {
      console.error('[GET /api/admin/financial-settings] Settings fetch failed:', result.error, result.code);
      // Return defaults if settings don't exist (not a critical error)
      return NextResponse.json({
        success: true,
        data: {
          zakatRate: 0.025, // Default 2.5%
          debtInterestRate: 0.05, // Default 5%
          bankDepositInterestRate: 0.02, // Default 2%
          minimumCashBalance: 1_000_000, // Default 1M SAR
          workingCapitalSettings: {
            accountsReceivable: { collectionDays: 30 },
            accountsPayable: { paymentDays: 45 },
            deferredIncome: { collectionDays: 0 },
            accruedExpenses: { paymentDays: 0 },
          },
        },
      });
    }

    // Convert Decimal values to numbers for JSON serialization
    const settings = {
      success: true,
      data: {
        zakatRate: result.data.zakatRate.toNumber(),
        debtInterestRate: result.data.debtInterestRate.toNumber(),
        bankDepositInterestRate: result.data.bankDepositInterestRate.toNumber(),
        minimumCashBalance: result.data.minimumCashBalance.toNumber(),
        workingCapitalSettings: result.data.workingCapitalSettings,
      },
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error('[GET /api/admin/financial-settings] Unexpected error:', error);
    // Return defaults on error (better than failing completely)
    return NextResponse.json({
      success: true,
      data: {
        zakatRate: 0.025,
        debtInterestRate: 0.05,
        bankDepositInterestRate: 0.02,
        minimumCashBalance: 1_000_000,
        workingCapitalSettings: {
          accountsReceivable: { collectionDays: 30 },
          accountsPayable: { paymentDays: 45 },
          deferredIncome: { collectionDays: 0 },
          accruedExpenses: { paymentDays: 0 },
        },
      },
    });
  }
}

