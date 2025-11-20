/**
 * API Routes: Historical Data Management
 *
 * Admin-only endpoint for managing complete historical financial statements (2023-2024)
 * Includes P&L, Balance Sheet, and Cash Flow data
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

// Helper to convert all Decimal fields to strings for JSON response
function serializeHistoricalData(data: any) {
  const result: any = {
    id: data.id,
    versionId: data.versionId,
    year: data.year,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };

  // Convert all Decimal fields to strings
  const decimalFields = [
    // P&L - Revenue
    'tuitionFrenchCurriculum',
    'tuitionIB',
    'otherIncome',
    'totalRevenues',
    // P&L - Expenses
    'salariesAndRelatedCosts',
    'schoolRent',
    'otherExpenses',
    'totalOperatingExpenses',
    // P&L - Other
    'depreciationAmortization',
    'interestIncome',
    'interestExpenses',
    'netResult',
    // Balance Sheet - Assets
    'cashOnHandAndInBank',
    'accountsReceivableAndOthers',
    'totalCurrentAssets',
    'tangibleIntangibleAssetsGross',
    'accumulatedDepreciationAmort',
    'nonCurrentAssets',
    'totalAssets',
    // Balance Sheet - Liabilities
    'accountsPayable',
    'deferredIncome',
    'totalCurrentLiabilities',
    'provisions',
    'totalLiabilities',
    // Balance Sheet - Equity
    'retainedEarnings',
    'equity',
    // Cash Flow - Operating
    'cfNetResult',
    'cfAccountsReceivable',
    'cfPrepaidExpenses',
    'cfLoans',
    'cfIntangibleAssets',
    'cfAccountsPayable',
    'cfAccruedExpenses',
    'cfDeferredIncome',
    'cfProvisions',
    'cfDepreciation',
    'netCashFromOperatingActivities',
    // Cash Flow - Investing
    'cfAdditionsFixedAssets',
    'netCashFromInvestingActivities',
    // Cash Flow - Financing
    'cfChangesInFundBalance',
    'netCashFromFinancingActivities',
    // Cash Flow - Summary
    'netIncreaseDecreaseCash',
    'cashBeginningOfPeriod',
    'cashEndOfPeriod',
  ];

  for (const field of decimalFields) {
    if (data[field] !== undefined && data[field] !== null) {
      result[field] = data[field].toString();
    }
  }

  return result;
}

// Helper to prepare data for upsert (convert to Decimal)
function prepareDataForUpsert(body: any) {
  const data: any = {};

  const decimalFields = [
    // P&L - Revenue
    'tuitionFrenchCurriculum',
    'tuitionIB',
    'otherIncome',
    'totalRevenues',
    // P&L - Expenses
    'salariesAndRelatedCosts',
    'schoolRent',
    'otherExpenses',
    'totalOperatingExpenses',
    // P&L - Other
    'depreciationAmortization',
    'interestIncome',
    'interestExpenses',
    'netResult',
    // Balance Sheet - Assets
    'cashOnHandAndInBank',
    'accountsReceivableAndOthers',
    'totalCurrentAssets',
    'tangibleIntangibleAssetsGross',
    'accumulatedDepreciationAmort',
    'nonCurrentAssets',
    'totalAssets',
    // Balance Sheet - Liabilities
    'accountsPayable',
    'deferredIncome',
    'totalCurrentLiabilities',
    'provisions',
    'totalLiabilities',
    // Balance Sheet - Equity
    'retainedEarnings',
    'equity',
    // Cash Flow - Operating
    'cfNetResult',
    'cfAccountsReceivable',
    'cfPrepaidExpenses',
    'cfLoans',
    'cfIntangibleAssets',
    'cfAccountsPayable',
    'cfAccruedExpenses',
    'cfDeferredIncome',
    'cfProvisions',
    'cfDepreciation',
    'netCashFromOperatingActivities',
    // Cash Flow - Investing
    'cfAdditionsFixedAssets',
    'netCashFromInvestingActivities',
    // Cash Flow - Financing
    'cfChangesInFundBalance',
    'netCashFromFinancingActivities',
    // Cash Flow - Summary
    'netIncreaseDecreaseCash',
    'cashBeginningOfPeriod',
    'cashEndOfPeriod',
  ];

  for (const field of decimalFields) {
    if (body[field] !== undefined && body[field] !== null) {
      data[field] = new Decimal(body[field] || 0).toFixed(2);
    } else {
      data[field] = new Decimal(0).toFixed(2);
    }
  }

  return data;
}

/**
 * POST /api/admin/historical-data
 * Create or update historical actuals for a specific year
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check
    // const session = await getServerSession();
    // if (!session || session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    const body = await request.json();

    // Validate required fields
    if (!body.versionId || !body.year) {
      return NextResponse.json(
        { error: 'versionId and year are required' },
        { status: 400 }
      );
    }

    // Validate year
    if (body.year !== 2023 && body.year !== 2024) {
      return NextResponse.json(
        { error: 'Year must be 2023 or 2024' },
        { status: 400 }
      );
    }

    // Verify version exists
    const version = await prisma.versions.findUnique({
      where: { id: body.versionId },
    });

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Prepare data for upsert
    const data = prepareDataForUpsert(body);

    // Upsert historical actuals
    const result = await prisma.historical_actuals.upsert({
      where: {
        versionId_year: {
          versionId: body.versionId,
          year: body.year,
        },
      },
      create: {
        versionId: body.versionId,
        year: body.year,
        ...data,
      },
      update: data,
    });

    return NextResponse.json({
      success: true,
      data: serializeHistoricalData(result),
    });
  } catch (error) {
    console.error('[POST /api/admin/historical-data] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to save historical data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/historical-data?versionId=xxx
 * Get historical actuals for a version
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const versionId = searchParams.get('versionId');

    if (!versionId) {
      return NextResponse.json(
        { error: 'versionId parameter is required' },
        { status: 400 }
      );
    }

    const historicalData = await prisma.historical_actuals.findMany({
      where: {
        versionId,
      },
      orderBy: {
        year: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: historicalData.map(serializeHistoricalData),
    });
  } catch (error) {
    console.error('[GET /api/admin/historical-data] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch historical data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/historical-data?id=xxx
 * Delete a historical actuals record
 */
export async function DELETE(request: NextRequest) {
  try {
    // TODO: Add authentication check
    // const session = await getServerSession();
    // if (!session || session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id parameter is required' },
        { status: 400 }
      );
    }

    await prisma.historical_actuals.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Historical data deleted successfully',
    });
  } catch (error) {
    console.error('[DELETE /api/admin/historical-data] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete historical data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
