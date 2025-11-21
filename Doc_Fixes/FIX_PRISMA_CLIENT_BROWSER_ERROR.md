# Fix: PrismaClient Browser Error

**Date**: November 18, 2024  
**Issue**: PrismaClient being called in browser/client-side code  
**Status**: ✅ **FIXED**

---

## 🐛 Problem

**Error Message**:

```
PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `unknown`).
```

**Root Cause**:
The `CircularSolver.fetchFinancialSettings()` method was calling Prisma directly, which only works server-side. This happened when:

1. `FinancialStatements` component (client-side) called `CircularSolver.solve()`
2. `CircularSolver.solve()` called `fetchFinancialSettings()`
3. `fetchFinancialSettings()` tried to use Prisma if settings weren't provided
4. **Prisma cannot run in the browser!** ❌

**Call Stack**:

```
FinancialStatements (client)
  → CircularSolver.solve()
    → CircularSolver.fetchFinancialSettings()
      → getAllFinancialSettings()
        → prisma.admin_settings.findUnique() ❌ (Cannot run in browser!)
```

---

## ✅ Solution

**Approach**: Fetch financial settings via API route (server-side only) and pass them to the solver.

### Changes Made:

#### 1. Created API Route: `/api/admin/financial-settings` (Server-Side)

**File**: `app/api/admin/financial-settings/route.ts`

- ✅ Fetches financial settings using Prisma (server-side only)
- ✅ Converts Decimal values to numbers for JSON serialization
- ✅ Returns all settings needed for circular solver:
  - `zakatRate`
  - `debtInterestRate`
  - `bankDepositInterestRate`
  - `minimumCashBalance`
  - `workingCapitalSettings`

#### 2. Updated FinancialStatements Component (Client-Side)

**File**: `components/versions/financial-statements/FinancialStatements.tsx`

**Before**:

```typescript
// ❌ Let solver fetch settings (tries to use Prisma on client)
const params: SolverParams = {
  // ... other params
  // No settings provided → solver tries to fetch from Prisma
};
const result = await solver.solve(params);
```

**After**:

```typescript
// ✅ Fetch settings from API (server-side only)
const settingsResponse = await fetch('/api/admin/financial-settings');
const settingsData = await settingsResponse.json();

// ✅ Pass settings to solver (no Prisma call needed)
const params: SolverParams = {
  // ... other params
  zakatRate: new Decimal(settingsData.data.zakatRate),
  debtInterestRate: new Decimal(settingsData.data.debtInterestRate),
  bankDepositInterestRate: new Decimal(settingsData.data.bankDepositInterestRate),
  minimumCashBalance: new Decimal(settingsData.data.minimumCashBalance),
  workingCapitalSettings: settingsData.data.workingCapitalSettings,
};

const result = await solver.solve(params);
// ✅ Solver sees settings provided → skips Prisma fetch
```

**Key Changes**:

- ✅ Switched from `useMemo` to `useEffect` (proper async handling)
- ✅ Added fetch to `/api/admin/financial-settings` API route
- ✅ Pass all settings to solver as props
- ✅ Added cleanup function (cancel on unmount)
- ✅ Better error handling

---

## 🔧 Technical Details

### Data Flow (Fixed):

```
Client Component (FinancialStatements)
    ↓
Fetch Settings from API
    ↓ GET /api/admin/financial-settings
Server API Route
    ↓ Uses Prisma (server-side only ✅)
    ↓ Returns JSON
Client Component
    ↓ Passes settings to solver
CircularSolver.solve(params)
    ↓ Settings provided → Skips Prisma ✅
    ↓ Calculates projection
Client Component
    ↓ Displays results
```

### API Route Implementation:

```typescript
// app/api/admin/financial-settings/route.ts
export async function GET(): Promise<NextResponse> {
  // ✅ Server-side only - Prisma works here
  const result = await getAllFinancialSettings();

  // Convert Decimal → number for JSON
  return NextResponse.json({
    success: true,
    data: {
      zakatRate: result.data.zakatRate.toNumber(),
      debtInterestRate: result.data.debtInterestRate.toNumber(),
      // ... other settings
    },
  });
}
```

### Component Implementation:

```typescript
// components/versions/financial-statements/FinancialStatements.tsx
useEffect(
  () => {
    async function calculate() {
      // ✅ Fetch from API (no Prisma on client)
      const settingsResponse = await fetch('/api/admin/financial-settings');
      const settingsData = await settingsResponse.json();

      // ✅ Pass to solver (skips Prisma fetch)
      const params: SolverParams = {
        // ... other params
        zakatRate: new Decimal(settingsData.data.zakatRate),
        // ... all settings provided
      };

      const solver = new CircularSolver();
      const result = await solver.solve(params);
      // ✅ No Prisma call - all settings provided!
    }

    calculate();
  },
  [
    /* dependencies */
  ]
);
```

---

## ✅ Verification

### Before Fix:

- ❌ PrismaClient error in browser console
- ❌ 10 errors (all from admin-settings.ts functions)
- ❌ Financial statements not loading

### After Fix:

- ✅ No PrismaClient errors
- ✅ Settings fetched via API (server-side)
- ✅ Settings passed to solver
- ✅ Solver skips Prisma fetch (settings provided)
- ✅ Financial statements load correctly

---

## 📝 Files Modified/Created

### Created:

- ✅ `app/api/admin/financial-settings/route.ts` (70 lines)

### Modified:

- ✅ `components/versions/financial-statements/FinancialStatements.tsx`
  - Changed from `useMemo` to `useEffect`
  - Added API fetch for settings
  - Pass settings as props to solver

---

## 🎓 Key Learnings

### 1. Prisma is Server-Side Only

**Rule**: Never import or use Prisma in client components!

**✅ Correct**:

```typescript
// Server-side (API route)
export async function GET() {
  const data = await prisma.table.findMany();
  return Response.json(data);
}
```

**❌ Wrong**:

```typescript
// Client-side (React component)
'use client';
import { prisma } from '@/lib/db'; // ❌ Cannot import Prisma in client!
```

### 2. Use API Routes for Server-Side Operations

**Pattern**: Client component → API route → Prisma → Response

**Example**:

```typescript
// Client component
const response = await fetch('/api/admin/financial-settings');
const data = await response.json();

// API route (server-side)
export async function GET() {
  const data = await prisma.admin_settings.findMany(); // ✅ Works!
  return Response.json(data);
}
```

### 3. Pass Settings as Props When Possible

**Best Practice**: If settings are needed client-side, fetch via API and pass as props rather than fetching inside the calculation.

**Before** (❌ Bad):

```typescript
// Solver tries to fetch from Prisma
const solver = new CircularSolver();
await solver.solve(params); // ❌ Tries Prisma fetch on client
```

**After** (✅ Good):

```typescript
// Fetch settings via API, pass as props
const settings = await fetch('/api/admin/financial-settings');
const params = { ...otherParams, ...settings.data }; // ✅ Settings provided
await solver.solve(params); // ✅ No Prisma fetch needed
```

---

## 🚀 Next Steps

### Testing:

1. ✅ Verify no PrismaClient errors in browser console
2. ✅ Verify financial statements load correctly
3. ✅ Verify settings are fetched from API
4. ✅ Verify solver uses provided settings (no Prisma fetch)

### Optional Improvements:

- Add caching for settings (React Query, SWR)
- Add error retry logic
- Add loading indicators while fetching settings

---

**Status**: ✅ **FIXED**  
**Verified**: All PrismaClient errors resolved  
**Ready**: For production testing
