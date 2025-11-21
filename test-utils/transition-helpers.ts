/**
 * Transition Period Test Utilities
 *
 * Provides helper functions for testing transition period features including:
 * - Test data cleanup
 * - Test data seeding
 * - Mock session creation
 * - Common test assertions
 */

import { prisma } from '@/lib/db/prisma';
import Decimal from 'decimal.js';
import type { transition_year_data } from '@prisma/client';

/**
 * Clean up all transition test data
 *
 * Removes transition year data and resets admin settings transition fields.
 * Use this in afterEach() or afterAll() hooks to ensure test isolation.
 */
export async function cleanupTransitionTestData(): Promise<void> {
  try {
    // Delete all transition year data
    await prisma.transition_year_data.deleteMany({});

    // Reset admin settings transition fields to defaults
    const adminSettings = await prisma.admin_settings.findFirst();
    if (adminSettings) {
      await prisma.admin_settings.update({
        where: { id: adminSettings.id },
        data: {
          transitionCapacityCap: 1850,
          transitionRentAdjustmentPercent: new Decimal(10.0),
        },
      });
    }

    // Clean up test audit logs
    await prisma.audit_logs.deleteMany({
      where: {
        entityType: 'TRANSITION_YEAR',
      },
    });
  } catch (err) {
    console.error('Error cleaning up transition test data:', err);
    throw err;
  }
}

/**
 * Seed transition year data with default test values
 *
 * Creates records for years 2025, 2026, 2027 with specified values.
 *
 * @param data - Optional custom data for each year (defaults provided)
 */
export async function seedTransitionTestData(
  data?: Partial<transition_year_data>[]
): Promise<transition_year_data[]> {
  const defaultData = [
    {
      year: 2025,
      targetEnrollment: 1850,
      staffCostBase: new Decimal(8500000),
      notes: 'Test data for 2025',
    },
    {
      year: 2026,
      targetEnrollment: 1850,
      staffCostBase: new Decimal(8755000),
      notes: 'Test data for 2026',
    },
    {
      year: 2027,
      targetEnrollment: 1850,
      staffCostBase: new Decimal(9017650),
      notes: 'Test data for 2027',
    },
  ];

  const recordsToCreate = data ?? defaultData;
  const created: transition_year_data[] = [];

  for (const record of recordsToCreate) {
    const result = await prisma.transition_year_data.create({
      data: record as any,
    });
    created.push(result);
  }

  return created;
}

/**
 * Seed admin settings with transition configuration
 *
 * @param capacityCap - Maximum enrollment capacity (default: 1850)
 * @param rentAdjustmentPercent - Rent adjustment percentage (default: 10.0)
 */
export async function seedTransitionAdminSettings(
  capacityCap: number = 1850,
  rentAdjustmentPercent: number = 10.0
): Promise<void> {
  const existing = await prisma.admin_settings.findFirst();

  if (existing) {
    await prisma.admin_settings.update({
      where: { id: existing.id },
      data: {
        transitionCapacityCap: capacityCap,
        transitionRentAdjustmentPercent: new Decimal(rentAdjustmentPercent),
      },
    });
  } else {
    // Create admin settings if not exists (for isolated test environments)
    await prisma.admin_settings.create({
      data: {
        key: 'test-settings',
        value: {},
        transitionCapacityCap: capacityCap,
        transitionRentAdjustmentPercent: new Decimal(rentAdjustmentPercent),
      },
    });
  }
}

/**
 * Create mock admin session for testing authenticated endpoints
 *
 * @param userId - User ID (default: 'test-admin-123')
 * @returns Mock session object with ADMIN role
 */
export function mockAdminSession(userId: string = 'test-admin-123') {
  return {
    user: {
      id: userId,
      email: 'admin@test.com',
      role: 'ADMIN' as const,
      name: 'Test Admin',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
  };
}

/**
 * Create mock planner session (for testing authorization failures)
 *
 * @param userId - User ID (default: 'test-planner-123')
 * @returns Mock session object with PLANNER role
 */
export function mockPlannerSession(userId: string = 'test-planner-123') {
  return {
    user: {
      id: userId,
      email: 'planner@test.com',
      role: 'PLANNER' as const,
      name: 'Test Planner',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Create mock viewer session (for testing authorization failures)
 *
 * @param userId - User ID (default: 'test-viewer-123')
 * @returns Mock session object with VIEWER role
 */
export function mockViewerSession(userId: string = 'test-viewer-123') {
  return {
    user: {
      id: userId,
      email: 'viewer@test.com',
      role: 'VIEWER' as const,
      name: 'Test Viewer',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Seed historical actuals for 2024 (required for transition calculations)
 *
 * @param versionId - Version ID to associate with historical data
 */
export async function seedHistorical2024Data(versionId: string): Promise<void> {
  await prisma.historical_actuals.upsert({
    where: {
      versionId_year: {
        versionId,
        year: 2024,
      },
    },
    update: {},
    create: {
      versionId,
      year: 2024,
      // P&L - Revenue
      tuitionFrenchCurriculum: new Decimal(40000000), // 40M
      tuitionIB: new Decimal(10000000), // 10M
      otherIncome: new Decimal(2000000), // 2M
      totalRevenues: new Decimal(52000000), // 52M

      // P&L - Expenses
      salariesAndRelatedCosts: new Decimal(25000000), // 25M
      schoolRent: new Decimal(12000000), // 12M (baseline for transition rent)
      otherExpenses: new Decimal(8000000), // 8M
      totalOperatingExpenses: new Decimal(45000000), // 45M

      // P&L - Other
      depreciationAmortization: new Decimal(1000000),
      interestIncome: new Decimal(100000),
      interestExpenses: new Decimal(200000),
      netResult: new Decimal(6900000), // ~7M profit

      // Balance Sheet - Assets
      cashOnHandAndInBank: new Decimal(5000000),
      accountsReceivableAndOthers: new Decimal(3000000),
      totalCurrentAssets: new Decimal(8000000),
      tangibleIntangibleAssetsGross: new Decimal(10000000),
      accumulatedDepreciationAmort: new Decimal(3000000),
      nonCurrentAssets: new Decimal(7000000),
      totalAssets: new Decimal(15000000),

      // Balance Sheet - Liabilities
      accountsPayable: new Decimal(2000000),
      deferredIncome: new Decimal(4000000),
      totalCurrentLiabilities: new Decimal(6000000),
      provisions: new Decimal(1000000),
      totalLiabilities: new Decimal(7000000),

      // Balance Sheet - Equity
      retainedEarnings: new Decimal(8000000),
      equity: new Decimal(8000000),

      // Cash Flow - Operating Activities
      cfNetResult: new Decimal(6900000),
      cfAccountsReceivable: new Decimal(-500000),
      cfPrepaidExpenses: new Decimal(0),
      cfLoans: new Decimal(0),
      cfIntangibleAssets: new Decimal(0),
      cfAccountsPayable: new Decimal(300000),
      cfAccruedExpenses: new Decimal(0),
      cfDeferredIncome: new Decimal(500000),
      cfProvisions: new Decimal(100000),
      cfDepreciation: new Decimal(1000000),
      netCashFromOperatingActivities: new Decimal(8300000),

      // Cash Flow - Investing Activities
      cfAdditionsFixedAssets: new Decimal(-2000000),
      netCashFromInvestingActivities: new Decimal(-2000000),

      // Cash Flow - Financing Activities
      cfChangesInFundBalance: new Decimal(0),
      netCashFromFinancingActivities: new Decimal(0),

      // Cash Flow - Summary
      netIncreaseDecreaseCash: new Decimal(6300000),
      cashBeginningOfPeriod: new Decimal(5000000),
      cashEndOfPeriod: new Decimal(11300000),
    },
  });
}

/**
 * Verify audit log was created for an action
 *
 * @param action - Audit log action name
 * @param userId - User ID who performed the action
 * @returns True if audit log exists
 */
export async function verifyAuditLog(action: string, userId: string): Promise<boolean> {
  const log = await prisma.audit_logs.findFirst({
    where: {
      action,
      userId,
    },
    orderBy: {
      timestamp: 'desc',
    },
  });

  return log !== null;
}

/**
 * Get the most recent audit log for an action
 *
 * @param action - Audit log action name
 */
export async function getLatestAuditLog(action: string) {
  return await prisma.audit_logs.findFirst({
    where: { action },
    orderBy: { timestamp: 'desc' },
  });
}

/**
 * Assert that a Decimal value is close to expected (within tolerance)
 *
 * Useful for financial calculations where exact equality might not be guaranteed
 * due to rounding.
 *
 * @param actual - Actual Decimal value
 * @param expected - Expected Decimal value
 * @param tolerance - Maximum allowed difference (default: 0.01)
 */
export function assertDecimalClose(
  actual: Decimal,
  expected: Decimal,
  tolerance: number = 0.01
): boolean {
  const diff = actual.minus(expected).abs();
  return diff.lessThanOrEqualTo(tolerance);
}

/**
 * Create a test version with all required data
 *
 * @param userId - User ID creating the version
 * @param mode - Version mode (default: RELOCATION_2028)
 * @returns Created version with ID
 */
export async function createTestVersion(
  userId: string,
  mode: 'RELOCATION_2028' | 'HISTORICAL_BASELINE' = 'RELOCATION_2028'
) {
  // Create or get test user
  let user = await prisma.users.findUnique({
    where: { id: userId },
  });

  if (!user) {
    user = await prisma.users.create({
      data: {
        id: userId,
        email: `${userId}@test.com`,
        name: 'Test User',
        role: 'ADMIN',
      },
    });
  }

  // Create version
  const version = await prisma.versions.create({
    data: {
      name: `Test Version ${Date.now()}`,
      description: 'Test version for transition tests',
      mode,
      status: 'DRAFT',
      createdBy: userId,
      transitionCapacity: 1850,
    },
  });

  // Create curriculum plans (required)
  await prisma.curriculum_plans.createMany({
    data: [
      {
        versionId: version.id,
        curriculumType: 'FR',
        capacity: 1500,
        tuitionBase: new Decimal(50000),
        cpiFrequency: 1,
        studentsProjection: [
          { year: 2023, students: 800 },
          { year: 2024, students: 850 },
          { year: 2025, students: 900 },
        ],
      },
      {
        versionId: version.id,
        curriculumType: 'IB',
        capacity: 500,
        tuitionBase: new Decimal(60000),
        cpiFrequency: 1,
        studentsProjection: [
          { year: 2023, students: 200 },
          { year: 2024, students: 250 },
          { year: 2025, students: 300 },
        ],
      },
    ],
  });

  // Seed 2024 historical data
  await seedHistorical2024Data(version.id);

  return version;
}

/**
 * Cleanup test version and all related data
 *
 * @param versionId - Version ID to delete
 */
export async function cleanupTestVersion(versionId: string): Promise<void> {
  await prisma.versions.delete({
    where: { id: versionId },
  });
}
