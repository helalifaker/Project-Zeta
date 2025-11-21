# Financial Statements Implementation - Clean Refactor Proposal

**Date:** November 18, 2025  
**Status:** 📋 **PROPOSAL FOR REVIEW**  
**Approach:** Clean Architecture, No Workarounds, Production-Ready

---

## Executive Summary

This proposal addresses all critical, major, and minor issues identified in the implementation review with a **clean, scalable architecture** that follows existing patterns and eliminates all workarounds.

### Key Principles

1. ✅ **No Workarounds** - All calculations integrated properly
2. ✅ **Service Layer Pattern** - Consistent with existing codebase (`services/version/`)
3. ✅ **Audit Logging** - All mutations logged (per `.cursorrules`)
4. ✅ **Authorization** - Security checks on all endpoints
5. ✅ **Single Source of Truth** - One calculation path, no duplication
6. ✅ **Type Safety** - Full TypeScript strict mode compliance
7. ✅ **Testability** - Service layer enables unit testing

---

## 📊 Current State Analysis

### What's Working ✅

- Database schema: Perfect
- Circular Solver: Production-ready, well-tested
- UI Components: Excellent structure
- Revenue calculation: Has Other Revenue support (but not used)
- Zakat migration: ✅ **COMPLETE** (already fixed)

### What's Broken ❌

1. **Other Revenue** - Not integrated into projection engine
2. **Cash Flow** - Uses old formula, missing breakdown
3. **Projection Engine** - Doesn't use CircularSolver
4. **Service Layer** - Missing for Other Revenue & Balance Sheet Settings
5. **Audit Logging** - Missing in API routes
6. **Authorization** - Missing in API routes

---

## 🏗️ Proposed Architecture

### Data Flow (Clean Integration)

```
┌─────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                      │
│  - Authentication & Authorization                           │
│  - Request Validation (Zod)                                 │
│  - Response Formatting                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Service Layer (Business Logic)                  │
│  - services/other-revenue/read.ts                           │
│  - services/other-revenue/update.ts                         │
│  - services/balance-sheet-settings/read.ts                  │
│  - services/balance-sheet-settings/update.ts                │
│  - Audit Logging (via services/audit.ts)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Calculation Engine (Pure Functions)             │
│                                                              │
│  projection.ts                                               │
│    ├─→ calculateRevenue() [with Other Revenue]              │
│    ├─→ calculateRent() [uses totalRevenue]                  │
│    ├─→ calculateOpex() [uses totalRevenue]                  │
│    ├─→ calculateEBITDA()                                    │
│    └─→ CircularSolver.solve() [Balance Sheet + Cash Flow]   │
│                                                              │
│  circular-solver.ts                                         │
│    ├─→ Operating Cash Flow                                  │
│    ├─→ Investing Cash Flow                                  │
│    ├─→ Financing Cash Flow                                  │
│    └─→ Balance Sheet Balancing                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Detailed Fix Proposals

### Fix 1: Other Revenue Integration (2-3 hours)

**Problem:** Other Revenue exists in `revenue.ts` but not used in `projection.ts`

**Solution:** Clean integration following existing patterns

#### Step 1.1: Update `projection.ts` to Accept Other Revenue

```typescript
// lib/calculations/financial/projection.ts

export interface FullProjectionParams {
  // ... existing fields ...
  otherRevenueByYear?: Array<{ year: number; amount: Decimal | number | string }>; // ✅ ADD
  versionId?: string; // ✅ ADD (for fetching Other Revenue if not provided)
}

// In calculateFullProjection():
export async function calculateFullProjection(
  params: FullProjectionParams
): Promise<Result<FullProjectionResult>> {
  // ... existing code ...

  // ✅ ADD: Fetch Other Revenue if versionId provided and otherRevenueByYear not provided
  let otherRevenueByYear: Array<{ year: number; amount: Decimal }> = [];

  if (params.otherRevenueByYear) {
    // Use provided Other Revenue
    otherRevenueByYear = params.otherRevenueByYear.map((item) => ({
      year: item.year,
      amount: toDecimal(item.amount),
    }));
  } else if (params.versionId) {
    // Fetch from database via service layer
    const otherRevenueResult = await getOtherRevenueByVersion(params.versionId);
    if (otherRevenueResult.success) {
      otherRevenueByYear = otherRevenueResult.data.map((item) => ({
        year: item.year,
        amount: toDecimal(item.amount),
      }));
    }
    // If fetch fails, continue with empty array (graceful degradation)
  }

  // ✅ UPDATE: Pass Other Revenue to calculateRevenue()
  for (const curriculumPlan of curriculumPlans) {
    // ... existing tuition growth calculation ...

    const revenueParams: RevenueParams = {
      tuitionByYear: tuitionResult.data,
      studentsByYear: curriculumPlan.studentsProjection,
      otherRevenueByYear, // ✅ ADD THIS
    };

    const revenueResult = calculateRevenue(revenueParams);
    // ... rest of code ...

    // ✅ USE: totalRevenue (not revenue) for rent/opex calculations
    const totalRevenue = revenueResult.data.map((r) => r.totalRevenue);
  }
}
```

#### Step 1.2: Update Rent & Opex to Use `totalRevenue`

```typescript
// lib/calculations/financial/projection.ts

// ✅ UPDATE: Use totalRevenue for rent calculation
const rentParams: RentCalculationParams = {
  rentModel: rentPlan.rentModel,
  parameters: rentPlan.parameters,
  revenueByYear: revenueByYear.map((r) => ({
    year: r.year,
    revenue: r.totalRevenue, // ✅ Use totalRevenue, not revenue
  })),
  // ... other params
};

// ✅ UPDATE: Use totalRevenue for opex calculation
const opexParams: OpexParams = {
  revenueByYear: revenueByYear.map((r) => ({
    year: r.year,
    revenue: r.totalRevenue, // ✅ Use totalRevenue, not revenue
  })),
  opexSubAccounts,
};
```

#### Step 1.3: Remove Workaround from `FinancialStatementsWrapper.tsx`

```typescript
// components/versions/financial-statements/FinancialStatementsWrapper.tsx

// ❌ REMOVE: Manual Other Revenue addition (line ~208)
// const otherRev = otherRevenue[year] || 0;
// revenue.push(yearData.revenue.plus(otherRev).toNumber());

// ✅ USE: totalRevenue from projection result
revenue.push(yearData.revenue.toNumber()); // revenue already includes Other Revenue
```

**Files to Modify:**

- `lib/calculations/financial/projection.ts` - Add Other Revenue fetching and pass to `calculateRevenue()`
- `lib/calculations/financial/projection.ts` - Use `totalRevenue` for rent/opex
- `components/versions/financial-statements/FinancialStatementsWrapper.tsx` - Remove manual addition

**Effort:** 2-3 hours

---

### Fix 2: Cash Flow Formula Update (4-5 hours)

**Problem:** `cashflow.ts` uses old formula, missing Operating/Investing/Financing breakdown

**Solution:** Complete rewrite to match Financial Statements requirements

#### Step 2.1: Update `CashFlowParams` Interface

```typescript
// lib/calculations/financial/cashflow.ts

export interface CashFlowParams {
  ebitdaByYear: Array<{ year: number; ebitda: Decimal }>;
  capexItems: CapexItem[];

  // ✅ ADD: Required for proper Cash Flow calculation
  depreciationByYear: Array<{ year: number; depreciation: Decimal }>;
  interestExpenseByYear: Array<{ year: number; interestExpense: Decimal }>;
  interestIncomeByYear: Array<{ year: number; interestIncome: Decimal }>;
  workingCapitalChanges: Array<{ year: number; change: Decimal }>; // Positive = uses cash, Negative = provides cash
  debtChanges: Array<{ year: number; change: Decimal }>; // Positive = borrowing, Negative = paydown

  zakatRate: Decimal | number | string;
}
```

#### Step 2.2: Update `CashFlowResult` Interface

```typescript
// lib/calculations/financial/cashflow.ts

export interface CashFlowResult {
  year: number;

  // P&L Components
  ebitda: Decimal;
  depreciation: Decimal;
  interestExpense: Decimal;
  interestIncome: Decimal;
  zakat: Decimal;
  netIncome: Decimal; // EBITDA - Depreciation - Interest Expense + Interest Income - Zakat

  // Working Capital
  workingCapitalChange: Decimal; // Positive = uses cash, Negative = provides cash

  // Cash Flow Statement
  operatingCashFlow: Decimal; // Net Income + Depreciation - Working Capital Changes
  investingCashFlow: Decimal; // -Capex
  financingCashFlow: Decimal; // Debt Changes
  netCashFlow: Decimal; // Operating + Investing + Financing
}
```

#### Step 2.3: Rewrite Calculation Logic

```typescript
// lib/calculations/financial/cashflow.ts

export function calculateCashFlow(params: CashFlowParams): Result<CashFlowResult[]> {
  try {
    const {
      ebitdaByYear,
      capexItems,
      depreciationByYear,
      interestExpenseByYear,
      interestIncomeByYear,
      workingCapitalChanges,
      debtChanges,
      zakatRate,
    } = params;

    // Create maps for quick lookup
    const capexMap = new Map<number, Decimal>();
    const depreciationMap = new Map<number, Decimal>();
    const interestExpenseMap = new Map<number, Decimal>();
    const interestIncomeMap = new Map<number, Decimal>();
    const wcChangeMap = new Map<number, Decimal>();
    const debtChangeMap = new Map<number, Decimal>();

    // ... populate maps ...

    const zakatRateDecimal = toDecimal(zakatRate);
    const results: CashFlowResult[] = [];

    for (const ebitdaItem of ebitdaByYear) {
      const year = ebitdaItem.year;
      const ebitda = ebitdaItem.ebitda;

      // Get components for this year
      const depreciation = depreciationMap.get(year) || new Decimal(0);
      const interestExpense = interestExpenseMap.get(year) || new Decimal(0);
      const interestIncome = interestIncomeMap.get(year) || new Decimal(0);
      const workingCapitalChange = wcChangeMap.get(year) || new Decimal(0);
      const capex = capexMap.get(year) || new Decimal(0);
      const debtChange = debtChangeMap.get(year) || new Decimal(0);

      // Calculate Net Income
      // Net Income = EBITDA - Depreciation - Interest Expense + Interest Income - Zakat
      const taxableIncome = ebitda.minus(depreciation).minus(interestExpense).plus(interestIncome);

      const taxableIncomePositive = max(taxableIncome, 0);
      const zakat = taxableIncomePositive.times(zakatRateDecimal);

      const netIncome = taxableIncome.minus(zakat);

      // Calculate Operating Cash Flow
      // Operating Cash Flow = Net Income + Depreciation - Working Capital Changes
      const operatingCashFlow = netIncome.plus(depreciation).minus(workingCapitalChange); // WC increase uses cash (subtract), WC decrease provides cash (add)

      // Calculate Investing Cash Flow
      // Investing Cash Flow = -Capex
      const investingCashFlow = capex.negated();

      // Calculate Financing Cash Flow
      // Financing Cash Flow = Debt Changes (borrowing = positive, paydown = negative)
      const financingCashFlow = debtChange;

      // Calculate Net Cash Flow
      const netCashFlow = operatingCashFlow.plus(investingCashFlow).plus(financingCashFlow);

      results.push({
        year,
        ebitda,
        depreciation,
        interestExpense,
        interestIncome,
        zakat,
        netIncome,
        workingCapitalChange,
        operatingCashFlow,
        investingCashFlow,
        financingCashFlow,
        netCashFlow,
      });
    }

    return success(results);
  } catch (err) {
    return error(
      `Failed to calculate cash flow: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
}
```

**Files to Modify:**

- `lib/calculations/financial/cashflow.ts` - Complete rewrite with new formula

**Effort:** 4-5 hours

---

### Fix 3: CircularSolver Integration (6-8 hours)

**Problem:** `projection.ts` doesn't use `CircularSolver`, missing Balance Sheet data

**Solution:** Integrate CircularSolver as the final step in projection calculation

#### Step 3.1: Update `FullProjectionParams` to Include Balance Sheet Settings

```typescript
// lib/calculations/financial/projection.ts

export interface FullProjectionParams {
  // ... existing fields ...
  versionId?: string; // ✅ ADD (required for fetching settings)

  // Optional: Can be provided directly or fetched from database
  balanceSheetSettings?: {
    startingCash: Decimal | number | string;
    openingEquity: Decimal | number | string;
  };
}
```

#### Step 3.2: Fetch Balance Sheet Settings in `calculateFullProjection()`

```typescript
// lib/calculations/financial/projection.ts

export async function calculateFullProjection(
  params: FullProjectionParams
): Promise<Result<FullProjectionResult>> {
  // ... existing revenue, rent, staff, opex, ebitda calculations ...

  // ✅ ADD: Fetch Balance Sheet Settings
  let startingCash = new Decimal(0);
  let openingEquity = new Decimal(0);

  if (params.balanceSheetSettings) {
    startingCash = toDecimal(params.balanceSheetSettings.startingCash);
    openingEquity = toDecimal(params.balanceSheetSettings.openingEquity);
  } else if (params.versionId) {
    const bsSettingsResult = await getBalanceSheetSettings(params.versionId);
    if (bsSettingsResult.success) {
      startingCash = toDecimal(bsSettingsResult.data.startingCash);
      openingEquity = toDecimal(bsSettingsResult.data.openingEquity);
    }
    // If fetch fails, use defaults (0) - graceful degradation
  }

  // ✅ ADD: Use CircularSolver for Balance Sheet + Cash Flow
  const solver = new CircularSolver();

  // Prepare solver parameters
  const solverParams: SolverParams = {
    versionId: params.versionId || '',
    versionMode: 'RELOCATION_2028', // TODO: Get from version or params
    revenue: revenueByYear.map((r) => r.totalRevenue), // Use totalRevenue (includes Other Revenue)
    ebitda: ebitdaByYear.map((e) => e.ebitda),
    capex: capexByYear.map((c) => c.amount),
    fixedAssetsOpening: new Decimal(0), // TODO: Calculate from historical capex or provide as param
    depreciationRate: new Decimal(0.1), // TODO: Get from admin settings or provide as param
    staffCosts: staffCostByYear.map((s) => s.staffCost),
    startingCash,
    openingEquity,
  };

  const solverResult = await solver.solve(solverParams);

  if (!solverResult.success) {
    return error(`Circular solver failed: ${solverResult.error}`);
  }

  // ✅ ADD: Merge solver results into projection
  const solverData = solverResult.data;

  // Update yearly projections with Balance Sheet and Cash Flow data
  const enhancedYears: YearlyProjection[] = years.map((year, index) => {
    const solverYear = solverData.years[index];

    return {
      ...year,
      // ✅ ADD: Balance Sheet data
      cash: solverYear.cash,
      accountsReceivable: solverYear.accountsReceivable,
      fixedAssets: solverYear.fixedAssets,
      accountsPayable: solverYear.accountsPayable,
      deferredIncome: solverYear.deferredIncome,
      accruedExpenses: solverYear.accruedExpenses,
      shortTermDebt: solverYear.shortTermDebt,
      totalAssets: solverYear.totalAssets,
      totalLiabilities: solverYear.totalLiabilities,
      totalEquity: solverYear.totalEquity,

      // ✅ ADD: Cash Flow breakdown
      depreciation: solverYear.depreciation,
      interestExpense: solverYear.interestExpense,
      interestIncome: solverYear.interestIncome,
      zakat: solverYear.zakat,
      netResult: solverYear.netResult,
      operatingCashFlow: solverYear.operatingCashFlow,
      investingCashFlow: solverYear.investingCashFlow,
      financingCashFlow: solverYear.financingCashFlow,
      netCashFlow: solverYear.netCashFlow,
    };
  });

  return success({
    years: enhancedYears,
    summary: {
      // ... existing summary ...
      // ✅ ADD: Balance Sheet summary metrics
      totalAssets: solverData.years[solverData.years.length - 1].totalAssets,
      totalLiabilities: solverData.years[solverData.years.length - 1].totalLiabilities,
      totalEquity: solverData.years[solverData.years.length - 1].totalEquity,
    },
    duration: performance.now() - startTime,
  });
}
```

#### Step 3.3: Update `YearlyProjection` Interface

```typescript
// lib/calculations/financial/projection.ts

export interface YearlyProjection {
  year: number;

  // Existing fields
  tuitionFR?: Decimal;
  tuitionIB?: Decimal;
  studentsFR?: number;
  studentsIB?: number;
  revenue: Decimal;
  staffCost: Decimal;
  rent: Decimal;
  opex: Decimal;
  ebitda: Decimal;
  ebitdaMargin: Decimal;
  capex: Decimal;
  rentLoad: Decimal;

  // ✅ ADD: Balance Sheet fields
  cash?: Decimal;
  accountsReceivable?: Decimal;
  fixedAssets?: Decimal;
  accountsPayable?: Decimal;
  deferredIncome?: Decimal;
  accruedExpenses?: Decimal;
  shortTermDebt?: Decimal;
  totalAssets?: Decimal;
  totalLiabilities?: Decimal;
  totalEquity?: Decimal;

  // ✅ ADD: Cash Flow breakdown
  depreciation?: Decimal;
  interestExpense?: Decimal;
  interestIncome?: Decimal;
  zakat?: Decimal;
  netResult?: Decimal;
  operatingCashFlow?: Decimal;
  investingCashFlow?: Decimal;
  financingCashFlow?: Decimal;
  netCashFlow?: Decimal;
}
```

**Files to Modify:**

- `lib/calculations/financial/projection.ts` - Add CircularSolver integration
- `lib/calculations/financial/projection.ts` - Update `YearlyProjection` interface

**Effort:** 6-8 hours

---

### Fix 4: Service Layer Functions (3-4 hours)

**Problem:** API routes call Prisma directly, no service layer abstraction

**Solution:** Create service layer following existing pattern (`services/version/`)

#### Step 4.1: Create `services/other-revenue/read.ts`

```typescript
// services/other-revenue/read.ts

import { prisma } from '@/lib/db/prisma';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';
import Decimal from 'decimal.js';

export interface OtherRevenueItem {
  id: string;
  versionId: string;
  year: number;
  amount: Decimal;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all Other Revenue items for a version
 *
 * @param versionId - Version ID
 * @returns Result containing array of Other Revenue items
 */
export async function getOtherRevenueByVersion(
  versionId: string
): Promise<Result<OtherRevenueItem[]>> {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(versionId)) {
      return error('Invalid version ID format', 'VALIDATION_ERROR');
    }

    // Verify version exists
    const version = await prisma.versions.findUnique({
      where: { id: versionId },
      select: { id: true },
    });

    if (!version) {
      return error('Version not found', 'VERSION_NOT_FOUND');
    }

    // Fetch Other Revenue items
    const items = await prisma.other_revenue_items.findMany({
      where: { versionId },
      orderBy: { year: 'asc' },
    });

    // Convert to service layer format
    const result: OtherRevenueItem[] = items.map((item) => ({
      id: item.id,
      versionId: item.versionId,
      year: item.year,
      amount: new Decimal(item.amount.toString()),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return success(result);
  } catch (err) {
    console.error('Failed to fetch Other Revenue items:', err);
    return error('Failed to fetch Other Revenue items');
  }
}
```

#### Step 4.2: Create `services/other-revenue/update.ts`

```typescript
// services/other-revenue/update.ts

import { prisma } from '@/lib/db/prisma';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';
import { logAudit } from '@/services/audit';
import Decimal from 'decimal.js';

export interface OtherRevenueItemInput {
  year: number;
  amount: Decimal | number | string;
}

/**
 * Update Other Revenue items for a version (bulk upsert)
 *
 * @param versionId - Version ID
 * @param items - Array of Other Revenue items to upsert
 * @param userId - User ID for audit logging
 * @returns Result containing updated items
 */
export async function updateOtherRevenueBulk(
  versionId: string,
  items: OtherRevenueItemInput[],
  userId: string
): Promise<
  Result<
    Array<{
      id: string;
      year: number;
      amount: Decimal;
    }>
  >
> {
  try {
    // Validate inputs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(versionId)) {
      return error('Invalid version ID format', 'VALIDATION_ERROR');
    }

    if (!Array.isArray(items)) {
      return error('Items must be an array', 'VALIDATION_ERROR');
    }

    // Validate each item
    for (const item of items) {
      if (item.year < 2023 || item.year > 2052) {
        return error(`Year ${item.year} must be between 2023 and 2052`, 'VALIDATION_ERROR');
      }

      const amount = new Decimal(item.amount);
      if (amount.isNegative()) {
        return error(`Amount for year ${item.year} cannot be negative`, 'VALIDATION_ERROR');
      }
    }

    // Verify version exists and is not locked
    const version = await prisma.versions.findUnique({
      where: { id: versionId },
      select: { id: true, status: true },
    });

    if (!version) {
      return error('Version not found', 'VERSION_NOT_FOUND');
    }

    if (version.status === 'LOCKED') {
      return error('Version is locked and cannot be modified', 'VERSION_LOCKED');
    }

    // Use transaction for atomic update
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.other_revenue_items.deleteMany({
        where: { versionId },
      });

      // Insert new items
      const created = await tx.other_revenue_items.createMany({
        data: items.map((item) => ({
          versionId,
          year: item.year,
          amount: new Decimal(item.amount).toFixed(2),
        })),
      });

      return created;
    });

    // Calculate total amount for audit log
    const totalAmount = items.reduce(
      (sum, item) => sum.plus(new Decimal(item.amount)),
      new Decimal(0)
    );

    // Log audit entry
    await logAudit({
      action: 'UPDATE_OTHER_REVENUE',
      userId,
      entityType: 'VERSION',
      entityId: versionId,
      metadata: {
        itemCount: items.length,
        totalAmount: totalAmount.toString(),
        years: items.map((item) => item.year),
      },
    });

    // Return updated items
    const updatedItems = items.map((item, index) => ({
      id: `temp-${index}`, // IDs are generated by database
      year: item.year,
      amount: new Decimal(item.amount),
    }));

    return success(updatedItems);
  } catch (err) {
    console.error('Failed to update Other Revenue items:', err);
    return error('Failed to update Other Revenue items');
  }
}
```

#### Step 4.3: Create `services/balance-sheet-settings/read.ts` and `update.ts`

Similar pattern to `services/other-revenue/` but for Balance Sheet Settings.

**Files to Create:**

- `services/other-revenue/read.ts`
- `services/other-revenue/update.ts`
- `services/other-revenue/index.ts` (exports)
- `services/balance-sheet-settings/read.ts`
- `services/balance-sheet-settings/update.ts`
- `services/balance-sheet-settings/index.ts` (exports)

**Files to Modify:**

- `app/api/versions/[id]/other-revenue/route.ts` - Use service layer
- `app/api/versions/[id]/balance-sheet-settings/route.ts` - Use service layer

**Effort:** 3-4 hours

---

### Fix 5: Audit Logging (1-2 hours)

**Problem:** API routes don't log audit entries

**Solution:** Add audit logging to all mutation endpoints using existing `logAudit()` function

#### Step 5.1: Update API Routes to Use Service Layer (which includes audit logging)

Since service layer functions will include audit logging, API routes just need to:

1. Get user session
2. Call service layer function
3. Service layer handles audit logging

**Files to Modify:**

- `app/api/versions/[id]/other-revenue/route.ts` - Already handled by service layer
- `app/api/versions/[id]/balance-sheet-settings/route.ts` - Already handled by service layer

**Effort:** 1-2 hours (mostly verification)

---

### Fix 6: Authorization Checks (2-3 hours)

**Problem:** API routes don't check user authorization

**Solution:** Add authorization middleware/checks following existing patterns

#### Step 6.1: Create Authorization Helper

```typescript
// lib/auth/authorization.ts

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';

export interface AuthorizationResult {
  userId: string;
  userRole: string;
  isAuthorized: boolean;
}

/**
 * Check if user is authorized to modify a version
 *
 * @param versionId - Version ID
 * @param requireOwnership - If true, user must own the version (unless ADMIN)
 * @returns Result containing authorization status
 */
export async function checkVersionAuthorization(
  versionId: string,
  requireOwnership: boolean = true
): Promise<Result<AuthorizationResult>> {
  try {
    // Get session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return error('Unauthorized', 'UNAUTHORIZED');
    }

    const userId = session.user.id;
    const userRole = session.user.role || 'VIEWER';

    // ADMIN can access all versions
    if (userRole === 'ADMIN') {
      return success({
        userId,
        userRole,
        isAuthorized: true,
      });
    }

    // Check version ownership
    if (requireOwnership) {
      const version = await prisma.versions.findUnique({
        where: { id: versionId },
        select: { createdBy: true, status: true },
      });

      if (!version) {
        return error('Version not found', 'VERSION_NOT_FOUND');
      }

      if (version.createdBy !== userId) {
        return error('Forbidden: You do not have permission to modify this version', 'FORBIDDEN');
      }

      if (version.status === 'LOCKED') {
        return error('Version is locked and cannot be modified', 'VERSION_LOCKED');
      }
    }

    return success({
      userId,
      userRole,
      isAuthorized: true,
    });
  } catch (err) {
    console.error('Authorization check failed:', err);
    return error('Authorization check failed');
  }
}
```

#### Step 6.2: Update API Routes to Use Authorization Helper

```typescript
// app/api/versions/[id]/other-revenue/route.ts

import { checkVersionAuthorization } from '@/lib/auth/authorization';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const versionId = params.id;

    // ✅ ADD: Check authorization
    const authResult = await checkVersionAuthorization(versionId, true);
    if (!authResult.success) {
      return NextResponse.json(authResult, {
        status: authResult.code === 'UNAUTHORIZED' ? 401 : 403,
      });
    }

    const { userId } = authResult.data;

    // Parse request body
    const body = await req.json();
    // ... validation ...

    // ✅ USE: Service layer (includes audit logging)
    const result = await updateOtherRevenueBulk(versionId, items, userId);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // ... error handling ...
  }
}
```

**Files to Create:**

- `lib/auth/authorization.ts` - Authorization helper

**Files to Modify:**

- `app/api/versions/[id]/other-revenue/route.ts` - Add authorization checks
- `app/api/versions/[id]/balance-sheet-settings/route.ts` - Add authorization checks

**Effort:** 2-3 hours

---

## 📋 Implementation Order

### Phase 1: Critical Fixes (12-16 hours)

1. **Fix 1: Other Revenue Integration** (2-3h)
   - Update `projection.ts` to fetch and pass Other Revenue
   - Use `totalRevenue` for rent/opex calculations
   - Remove workaround from `FinancialStatementsWrapper.tsx`

2. **Fix 2: Cash Flow Formula** (4-5h)
   - Rewrite `cashflow.ts` with Operating/Investing/Financing breakdown
   - Update interfaces and calculation logic

3. **Fix 3: CircularSolver Integration** (6-8h)
   - Integrate `CircularSolver` into `projection.ts`
   - Merge Balance Sheet and Cash Flow data into projection
   - Update `YearlyProjection` interface

### Phase 2: Major Fixes (6-9 hours)

4. **Fix 4: Service Layer** (3-4h)
   - Create `services/other-revenue/` functions
   - Create `services/balance-sheet-settings/` functions
   - Update API routes to use service layer

5. **Fix 5: Audit Logging** (1-2h)
   - Verify audit logging in service layer functions
   - Test audit log entries

6. **Fix 6: Authorization** (2-3h)
   - Create authorization helper
   - Add authorization checks to API routes

### Phase 3: Testing & Validation (4-6 hours)

7. **Unit Tests** (2-3h)
   - Test Other Revenue integration
   - Test Cash Flow formula
   - Test service layer functions

8. **Integration Tests** (2-3h)
   - Test projection + CircularSolver integration
   - Test API routes with authorization
   - Test audit logging

---

## ✅ Quality Assurance Checklist

### Before Implementation

- [ ] Review proposal with team
- [ ] Verify existing service layer patterns
- [ ] Check CircularSolver interface compatibility
- [ ] Verify audit logging requirements

### During Implementation

- [ ] Follow existing code patterns
- [ ] Use TypeScript strict mode
- [ ] Use Decimal.js for all money calculations
- [ ] Use Result<T> pattern for error handling
- [ ] Add JSDoc comments
- [ ] Write unit tests as you go

### After Implementation

- [ ] All tests pass
- [ ] No linter errors
- [ ] No TypeScript errors
- [ ] Manual testing complete
- [ ] Code review complete

---

## 🎯 Success Criteria

### Functional Requirements

- ✅ Other Revenue included in all revenue calculations
- ✅ Cash Flow has Operating/Investing/Financing breakdown
- ✅ Projection includes Balance Sheet data
- ✅ All API routes have authorization
- ✅ All mutations have audit logs
- ✅ Service layer abstraction in place

### Non-Functional Requirements

- ✅ No workarounds
- ✅ Consistent with existing patterns
- ✅ Type-safe (strict TypeScript)
- ✅ Testable (service layer enables unit tests)
- ✅ Scalable (easy to extend)
- ✅ Maintainable (clear separation of concerns)

---

## 📊 Risk Assessment

### Low Risk ✅

- Service layer pattern already established
- Audit logging function already exists
- CircularSolver is production-ready
- Revenue calculation already supports Other Revenue

### Medium Risk ⚠️

- Cash Flow formula rewrite (needs careful testing)
- CircularSolver integration (needs to merge data correctly)
- Authorization helper (needs to match existing patterns)

### Mitigation

- Write tests before implementation (TDD)
- Incremental implementation (one fix at a time)
- Code review after each fix
- Manual testing after each fix

---

## 📝 Notes

### Design Decisions

1. **Service Layer First**: Create service layer before updating API routes (enables testing)
2. **Graceful Degradation**: If Other Revenue or Balance Sheet Settings can't be fetched, use defaults (0)
3. **Backward Compatibility**: Keep existing `FullProjectionParams` fields, add new optional fields
4. **Single Source of Truth**: Use `totalRevenue` from revenue calculation, don't recalculate

### Future Enhancements

- Add caching for Other Revenue and Balance Sheet Settings
- Add validation for Balance Sheet Settings (e.g., startingCash + fixedAssets = openingEquity)
- Add performance monitoring for CircularSolver integration
- Add export functionality for Financial Statements

---

## ✅ Approval Required

**Status:** 📋 **AWAITING REVIEW**

Please review this proposal and provide feedback before implementation begins.

**Questions for Review:**

1. Does the service layer pattern match your expectations?
2. Is the authorization approach acceptable?
3. Should we add any additional validation?
4. Are there any concerns about the CircularSolver integration approach?

**Next Steps After Approval:**

1. Begin Phase 1 implementation
2. Create TODO list with specific tasks
3. Implement fixes one at a time
4. Test after each fix
5. Code review after each fix

---

**Document Status:** ✅ **PROPOSAL COMPLETE**  
**Last Updated:** November 18, 2025  
**Estimated Total Effort:** 18-25 hours (3-4 days)
