# Critical Issues Fix Proposal

**Date:** November 18, 2025  
**Status:** 🔴 **CRITICAL ISSUES IDENTIFIED - FIX PROPOSAL**

---

## Executive Summary

**Issues Found:** 3 Critical Issues  
**Root Causes:** Data flow issues, missing await params, depreciation calculation bug  
**Priority:** P0 - Must fix before production  
**Estimated Fix Time:** 6-8 hours

---

## Root Cause Analysis

### 🔴 Critical Discovery: Dual Calculation Paths

**The core issue is that there are TWO separate calculation paths:**

1. **Path 1: FinancialStatementsWrapper → calculateFullProjection()**
   - Calls `calculateFullProjection()` which now includes CircularSolver (Fix 3)
   - Extracts data from `projection.years` (YearlyProjection[])
   - Passes arrays to `FinancialStatements` component

2. **Path 2: FinancialStatements → CircularSolver**
   - Receives arrays from `FinancialStatementsWrapper`
   - Calls CircularSolver AGAIN (duplicate calculation!)
   - Gets result with `projection.projection` (YearProjection[])
   - Passes to `PnLStatement`

**Problem:**
- EBITDA might be calculated twice (once in `calculateFullProjection`, once in CircularSolver)
- Depreciation is ONLY in CircularSolver result (`projection.projection`), NOT in `projection.years`
- `FinancialStatementsWrapper` extracts from `projection.years` which doesn't have depreciation
- Data mismatch between the two paths

**Solution:**
- **Option A (Recommended):** Remove duplicate CircularSolver call in `FinancialStatements`, use data from `calculateFullProjection` result
- **Option B:** Extract depreciation from CircularSolver result in `FinancialStatementsWrapper` and merge into `projection.years`
- **Option C:** Refactor to single calculation path (FinancialStatementsWrapper prepares data, FinancialStatements calls CircularSolver once)

**Recommended Approach:** Option A - Use `calculateFullProjection` result which already includes CircularSolver data, remove duplicate call in `FinancialStatements`

---

## Issue Analysis

### 🔴 Issue 1: 404 Error - Other Revenue API Route

**Root Cause:** Next.js 15 App Router requires `await params` in route handlers

**Current Code:**
```typescript
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const versionId = params.id; // ❌ params is a Promise in Next.js 15
```

**Fix:**
```typescript
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: versionId } = await params; // ✅ Await params
```

**Files to Fix:**
- `app/api/versions/[id]/other-revenue/route.ts` (GET and POST)
- `app/api/versions/[id]/balance-sheet-settings/route.ts` (GET and POST)

---

### 🔴 Issue 2: Incorrect EBITDA Values (-3.6 Billion)

**Root Cause Analysis:**

**Hypothesis 1: Data Type Mismatch**
- `FinancialStatementsWrapper` extracts data from `projection.years` using `.find()`
- If year doesn't exist, fills with `0`
- But if year order is wrong, might be getting wrong year's data

**Hypothesis 2: Array Index Mismatch**
- `CircularSolver` expects arrays in order (2023-2052)
- `projection.ts` creates arrays by iterating years 2023-2052
- But if `ebitdaResult.data` has different year order, mapping will be wrong

**Hypothesis 3: Staff Costs Sign Issue**
- Staff costs displayed in parentheses (negative format) is just display
- But if staff costs are actually negative in the array, EBITDA will be wrong

**Investigation Steps:**

1. **Check Data Flow:**
   ```typescript
   // In FinancialStatementsWrapper.tsx, after projection calculation
   console.log('EBITDA Result (2028):', ebitdaResult.data.find(e => e.year === 2028));
   console.log('EBITDA Array for Solver:', ebitdaArray);
   console.log('Staff Costs Array for Solver:', staffCostsArray);
   ```

2. **Check Array Creation:**
   ```typescript
   // In projection.ts, verify arrays are in correct order
   for (let year = 2023; year <= 2052; year++) {
     const ebitdaItem = ebitdaResult.data.find(e => e.year === year);
     // ⚠️ ISSUE: .find() might return undefined if year not found
     // Then pushes new Decimal(0), which is correct
     // But if year exists but in wrong position, might get wrong data
   }
   ```

3. **Check CircularSolver Input:**
   ```typescript
   // In FinancialStatements.tsx, before calling solver
   console.log('Solver Params:', {
     revenue: params.revenue.slice(0, 5), // First 5 years
     ebitda: params.ebitda.slice(0, 5),
     staffCosts: params.staffCosts.slice(0, 5),
   });
   ```

**Most Likely Root Cause:** Array index mismatch or data extraction issue in `FinancialStatementsWrapper.tsx`

**Fix Strategy:**
1. Verify year order in all arrays
2. Add validation to ensure arrays are 30 elements (2023-2052)
3. Add debugging to trace data flow
4. Fix data extraction in `FinancialStatementsWrapper.tsx`

---

### 🔴 Issue 3: Depreciation Not Appearing (0)

**Root Cause Analysis:**

**Current Code:**
```typescript
// In circular-solver.ts
let previousFixedAssets = params.fixedAssetsOpening; // Starts at opening

for (let i = 0; i < params.revenue.length; i++) {
  const depreciation = previousFixedAssets.times(params.depreciationRate);
  // ...
  const fixedAssets = previousFixedAssets.plus(capex).minus(depreciation);
  // ...
  previousFixedAssets = fixedAssets; // Update for next iteration
}
```

**Issue:**
- If `fixedAssetsOpening` is 0 (no historical capex), first year depreciation = 0 ✅ Correct
- But after first capex (e.g., 2028: 2M), `fixedAssets` should be 2M
- Next year (2029), `previousFixedAssets` should be 2M, depreciation = 200K
- **But depreciation is 0 for ALL years** ❌

**Possible Causes:**

1. **Fixed Assets Not Updating:**
   - `previousFixedAssets = fixedAssets` might not be executing
   - Or `fixedAssets` calculation is wrong

2. **Depreciation Not Being Passed to Display:**
   - CircularSolver calculates depreciation correctly
   - But it's not being passed to `PnLStatement` component

3. **Data Extraction Issue:**
   - `FinancialStatementsWrapper` extracts depreciation from solver result
   - But might be extracting wrong field or year

**Investigation Steps:**

1. **Check Fixed Assets Calculation:**
   ```typescript
   // In circular-solver.ts, add logging
   console.log('Fixed Assets Calculation:', {
     year,
     previousFixedAssets: previousFixedAssets.toString(),
     capex: capex.toString(),
     depreciation: depreciation.toString(),
     fixedAssets: fixedAssets.toString(),
   });
   ```

2. **Check Depreciation in Solver Result:**
   ```typescript
   // In FinancialStatements.tsx, after solver
   console.log('Solver Result (2028):', result.data.projection.find(p => p.year === 2028));
   console.log('Depreciation (2028):', result.data.projection.find(p => p.year === 2028)?.depreciation);
   ```

3. **Check Data Extraction:**
   ```typescript
   // In FinancialStatementsWrapper.tsx, check how depreciation is extracted
   // Currently extracts from projection.years, but might be wrong
   ```

**Most Likely Root Cause:** Depreciation is calculated correctly in CircularSolver, but not being passed to the display component, OR `previousFixedAssets` is not being updated correctly between iterations.

**Fix Strategy:**
1. Verify `previousFixedAssets` is updated correctly
2. Verify depreciation is in solver result
3. Fix data extraction in `FinancialStatementsWrapper.tsx`
4. Add validation to ensure depreciation is calculated

---

## Proposed Fixes

### Fix 1: Next.js 15 Route Params (30 minutes)

**Files:**
- `app/api/versions/[id]/other-revenue/route.ts`
- `app/api/versions/[id]/balance-sheet-settings/route.ts`

**Changes:**
```typescript
// Before
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const versionId = params.id;

// After
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: versionId } = await params;
```

**Testing:**
- Test GET endpoint: `curl http://localhost:3000/api/versions/[id]/other-revenue`
- Test POST endpoint with valid data
- Verify 404 error is resolved

---

### Fix 2: Fix Dual Calculation Path & EBITDA Issue (3-4 hours)

**Root Cause:** 
- `calculateFullProjection` calls CircularSolver and merges results into `cashFlowResult`
- But `YearlyProjection` interface doesn't include `depreciation`, `interestExpense`, `interestIncome`, `netResult`
- These fields are in `cashFlowResult.data` but NOT merged into `projection.years`
- `FinancialStatementsWrapper` extracts from `projection.years` (missing depreciation)
- `FinancialStatements` calls CircularSolver AGAIN (duplicate calculation)

**Fix Strategy:**

**Step 1: Update YearlyProjection Interface**

**File:** `lib/calculations/financial/projection.ts`

```typescript
export interface YearlyProjection {
  year: number;
  // Tuition (per curriculum)
  tuitionFR?: Decimal;
  tuitionIB?: Decimal;
  // Enrollment (per curriculum)
  studentsFR?: number;
  studentsIB?: number;
  // Financials
  revenue: Decimal;
  staffCost: Decimal;
  rent: Decimal;
  opex: Decimal;
  ebitda: Decimal;
  ebitdaMargin: Decimal;
  capex: Decimal;
  interest: Decimal; // Deprecated: use interestExpense
  taxes: Decimal; // Deprecated: use zakat
  cashFlow: Decimal; // Deprecated: use netCashFlow
  // Metrics
  rentLoad: Decimal; // (Rent / Revenue) × 100
  
  // ✅ ADD: Fields from CircularSolver
  depreciation?: Decimal;
  interestExpense?: Decimal;
  interestIncome?: Decimal;
  zakat?: Decimal;
  netResult?: Decimal; // Net Income
  workingCapitalChange?: Decimal;
  operatingCashFlow?: Decimal;
  investingCashFlow?: Decimal;
  financingCashFlow?: Decimal;
  netCashFlow?: Decimal;
}
```

**Step 2: Merge CircularSolver Results into YearlyProjection**

**File:** `lib/calculations/financial/projection.ts`

```typescript
// After creating projection (line 646), merge CircularSolver data
const projection: YearlyProjection = {
  year,
  revenue: revenueItem.revenue,
  staffCost: staffCostItem.staffCost,
  rent: rentItem.rent,
  opex: opexItem.totalOpex,
  ebitda: ebitdaItem.ebitda,
  ebitdaMargin: ebitdaItem.ebitdaMargin,
  capex: cashFlowItem.capex,
  interest: cashFlowItem.interest,
  taxes: cashFlowItem.taxes,
  cashFlow: cashFlowItem.cashFlow,
  rentLoad,
  
  // ✅ ADD: Merge CircularSolver results if available
  depreciation: cashFlowItem.depreciation,
  interestExpense: cashFlowItem.interestExpense,
  interestIncome: cashFlowItem.interestIncome,
  zakat: cashFlowItem.zakat,
  netResult: cashFlowItem.netIncome,
  workingCapitalChange: cashFlowItem.workingCapitalChange,
  operatingCashFlow: cashFlowItem.operatingCashFlow,
  investingCashFlow: cashFlowItem.investingCashFlow,
  financingCashFlow: cashFlowItem.financingCashFlow,
  netCashFlow: cashFlowItem.netCashFlow,
};
```

**Step 3: Remove Duplicate CircularSolver Call**

**File:** `components/versions/financial-statements/FinancialStatements.tsx`

**Current:** Calls CircularSolver again (duplicate)
**Fix:** Use data from `FinancialStatementsWrapper` which already has CircularSolver results

**Option A: Pass Full Projection Data**
- `FinancialStatementsWrapper` passes `projection.years` directly
- `FinancialStatements` uses this data (no CircularSolver call)
- `PnLStatement` receives `YearlyProjection[]` instead of `YearProjection[]`

**Option B: Keep Current Structure**
- `FinancialStatementsWrapper` extracts arrays (current approach)
- `FinancialStatements` calls CircularSolver (current approach)
- But ensure depreciation is passed correctly

**Recommended:** Option A - Remove duplicate calculation

**Step 4: Fix Data Extraction in FinancialStatementsWrapper**

**File:** `components/versions/financial-statements/FinancialStatementsWrapper.tsx`

```typescript
// After projection calculation, extract ALL fields including depreciation
for (let year = 2023; year <= 2052; year++) {
  const yearData = projection.years.find((y) => y.year === year);
  if (yearData) {
    revenue.push(yearData.revenue.toNumber());
    ebitda.push(yearData.ebitda.toNumber());
    staffCosts.push(yearData.staffCost.toNumber());
    capex.push(yearData.capex.toNumber());
    
    // ✅ ADD: Extract depreciation if available
    // Note: depreciation might be undefined if CircularSolver didn't run
    // In that case, it will be 0 (which is correct for first year)
  }
}
```

**Step 5: Pass Depreciation to FinancialStatements**

**File:** `components/versions/financial-statements/FinancialStatementsWrapper.tsx`

```typescript
// ✅ ADD: Extract depreciation array
const depreciation: number[] = [];
for (let year = 2023; year <= 2052; year++) {
  const yearData = projection.years.find((y) => y.year === year);
  depreciation.push(yearData?.depreciation?.toNumber() || 0);
}

// ✅ ADD: Pass to FinancialStatements
<FinancialStatements
  // ... existing props
  depreciation={depreciation} // ✅ NEW PROP
/>
```

**Step 6: Update FinancialStatements Interface**

**File:** `components/versions/financial-statements/FinancialStatements.tsx`

```typescript
export interface FinancialStatementsProps {
  // ... existing props
  depreciation: number[]; // ✅ ADD: Depreciation array
}
```

**Step 7: Use Depreciation in PnLStatement**

**File:** `components/versions/financial-statements/PnLStatement.tsx`

Currently receives `YearProjection[]` from CircularSolver result.
If we use Option A, it will receive `YearlyProjection[]` from `calculateFullProjection`.

**Testing:**
- Verify depreciation appears in PnL statement
- Verify EBITDA values are correct
- Verify no duplicate calculations

---

### Fix 2 (Alternative): EBITDA Calculation Debugging & Fix (2-3 hours)

**Step 1: Add Comprehensive Debugging**

**File:** `lib/calculations/financial/projection.ts`

```typescript
// After calculating EBITDA (line 386)
const ebitdaResult = calculateEBITDA(ebitdaParams);
if (!ebitdaResult.success) {
  return ebitdaResult;
}

// ✅ ADD: Debugging for 2028
const ebitda2028 = ebitdaResult.data.find(e => e.year === 2028);
if (ebitda2028) {
  console.log('[DEBUG] EBITDA Calculation (2028):', {
    revenue: totalRevenueByYear.find(r => r.year === 2028)?.revenue.toString(),
    staffCost: staffCostByYear.find(s => s.year === 2028)?.staffCost.toString(),
    rent: rentByYear.find(r => r.year === 2028)?.rent.toString(),
    opex: opexByYear.find(o => o.year === 2028)?.totalOpex.toString(),
    ebitda: ebitda2028.ebitda.toString(),
    ebitdaMargin: ebitda2028.ebitdaMargin.toString(),
  });
}
```

**Step 2: Verify Array Creation**

**File:** `lib/calculations/financial/projection.ts`

```typescript
// Before creating arrays for CircularSolver (line 440)
// ✅ ADD: Validation
if (ebitdaResult.data.length !== 30) {
  console.error('[ERROR] EBITDA array length mismatch:', {
    expected: 30,
    actual: ebitdaResult.data.length,
    years: ebitdaResult.data.map(e => e.year),
  });
}

// ✅ ADD: Verify year order
const years = ebitdaResult.data.map(e => e.year);
const expectedYears = Array.from({ length: 30 }, (_, i) => 2023 + i);
if (JSON.stringify(years) !== JSON.stringify(expectedYears)) {
  console.error('[ERROR] EBITDA years out of order:', {
    expected: expectedYears,
    actual: years,
  });
}
```

**Step 3: Fix Array Creation (if needed)**

**File:** `lib/calculations/financial/projection.ts`

```typescript
// ✅ FIX: Ensure arrays are in correct order (2023-2052)
const revenueArray: Decimal[] = [];
const ebitdaArray: Decimal[] = [];
const capexArray: Decimal[] = [];
const staffCostsArray: Decimal[] = [];

// Sort ebitdaResult.data by year to ensure correct order
const sortedEbitda = [...ebitdaResult.data].sort((a, b) => a.year - b.year);

for (let year = 2023; year <= 2052; year++) {
  const revenueItem = totalRevenueByYear.find(r => r.year === year);
  const ebitdaItem = sortedEbitda.find(e => e.year === year); // Use sorted array
  const capexItem = capexItems.find(c => {
    const cYear = typeof c.year === 'number' ? c.year : parseInt(String(c.year), 10);
    return cYear === year;
  });
  const staffCostItem = staffCostByYear.find(s => s.year === year);

  revenueArray.push(revenueItem?.revenue || new Decimal(0));
  ebitdaArray.push(ebitdaItem?.ebitda || new Decimal(0));
  capexArray.push(capexItem ? toDecimal(capexItem.amount) : new Decimal(0));
  staffCostsArray.push(staffCostItem?.staffCost || new Decimal(0));
  
  // ✅ ADD: Validation logging for 2028
  if (year === 2028) {
    console.log('[DEBUG] Array Creation (2028):', {
      revenue: revenueArray[revenueArray.length - 1].toString(),
      ebitda: ebitdaArray[ebitdaArray.length - 1].toString(),
      staffCost: staffCostsArray[staffCostsArray.length - 1].toString(),
      capex: capexArray[capexArray.length - 1].toString(),
    });
  }
}
```

**Step 4: Verify Data Extraction in FinancialStatementsWrapper**

**File:** `components/versions/financial-statements/FinancialStatementsWrapper.tsx`

```typescript
// After projection calculation (line 233)
for (let year = 2023; year <= 2052; year++) {
  const yearData = projection.years.find((y) => y.year === year);
  if (yearData) {
    // ✅ ADD: Validation logging for 2028
    if (year === 2028) {
      console.log('[DEBUG] Year Data Extraction (2028):', {
        revenue: yearData.revenue.toString(),
        ebitda: yearData.ebitda.toString(),
        staffCost: yearData.staffCost.toString(),
      });
    }
    
    revenue.push(yearData.revenue.toNumber());
    ebitda.push(yearData.ebitda.toNumber());
    staffCosts.push(yearData.staffCost.toNumber());
    capex.push(yearData.capex.toNumber());
  } else {
    // ✅ ADD: Warning if year not found
    console.warn(`[WARNING] Year ${year} not found in projection`);
    revenue.push(0);
    ebitda.push(0);
    staffCosts.push(0);
    capex.push(0);
  }
}
```

**Step 5: Add Validation in FinancialStatements**

**File:** `components/versions/financial-statements/FinancialStatements.tsx`

```typescript
// Before calling solver (line 94)
// ✅ ADD: Validation
console.log('[DEBUG] Solver Input (2028):', {
  revenue: params.revenue[5].toString(), // Index 5 = 2028
  ebitda: params.ebitda[5].toString(),
  staffCosts: params.staffCosts[5].toString(),
  capex: params.capex[5].toString(),
  fixedAssetsOpening: params.fixedAssetsOpening.toString(),
  depreciationRate: params.depreciationRate.toString(),
});
```

**Step 6: Verify Solver Output**

**File:** `components/versions/financial-statements/FinancialStatements.tsx`

```typescript
// After solver (line 126)
if (result.success && result.data.converged) {
  // ✅ ADD: Validation
  const year2028 = result.data.projection.find(p => p.year === 2028);
  if (year2028) {
    console.log('[DEBUG] Solver Output (2028):', {
      revenue: year2028.revenue.toString(),
      ebitda: year2028.ebitda.toString(),
      staffCosts: year2028.staffCosts.toString(),
      depreciation: year2028.depreciation.toString(),
      netResult: year2028.netResult.toString(),
    });
  }
}
```

**Testing:**
- Run calculation and check console logs
- Verify EBITDA values are correct at each step
- Fix any issues found in data flow

---

### Fix 3: Depreciation Calculation Fix (2-3 hours)

**Step 1: Verify Fixed Assets Opening Calculation**

**File:** `lib/calculations/financial/projection.ts`

```typescript
// ✅ ADD: Debugging for fixedAssetsOpening (line 417)
const fixedAssetsOpening = capexItems
  .filter(item => {
    const itemYear = typeof item.year === 'number' ? item.year : parseInt(String(item.year), 10);
    return itemYear < startYear;
  })
  .reduce((sum, item) => sum.plus(toDecimal(item.amount)), new Decimal(0));

console.log('[DEBUG] Fixed Assets Opening:', {
  value: fixedAssetsOpening.toString(),
  historicalCapex: capexItems.filter(item => {
    const itemYear = typeof item.year === 'number' ? item.year : parseInt(String(item.year), 10);
    return itemYear < startYear;
  }).map(item => ({ year: item.year, amount: toDecimal(item.amount).toString() })),
});
```

**Step 2: Verify Depreciation Calculation in CircularSolver**

**File:** `lib/calculations/financial/circular-solver.ts`

```typescript
// In initializeFirstIteration (line 405)
const depreciation = previousFixedAssets.times(params.depreciationRate);

// ✅ ADD: Debugging for first few years
if (year === 2028 || year === 2029 || year === 2030) {
  console.log('[DEBUG] Depreciation Calculation:', {
    year,
    previousFixedAssets: previousFixedAssets.toString(),
    depreciationRate: params.depreciationRate.toString(),
    depreciation: depreciation.toString(),
    capex: capex.toString(),
  });
}
```

**Step 3: Verify Fixed Assets Update**

**File:** `lib/calculations/financial/circular-solver.ts`

```typescript
// After fixed assets calculation (line 478)
const fixedAssets = previousFixedAssets.plus(capex).minus(depreciation);

// ✅ ADD: Debugging
if (year === 2028 || year === 2029 || year === 2030) {
  console.log('[DEBUG] Fixed Assets Update:', {
    year,
    previousFixedAssets: previousFixedAssets.toString(),
    capex: capex.toString(),
    depreciation: depreciation.toString(),
    fixedAssets: fixedAssets.toString(),
  });
}

// ✅ VERIFY: previousFixedAssets is updated
previousFixedAssets = fixedAssets;

// ✅ ADD: Verify update
if (year === 2028 || year === 2029 || year === 2030) {
  console.log('[DEBUG] Previous Fixed Assets After Update:', {
    year,
    previousFixedAssets: previousFixedAssets.toString(),
  });
}
```

**Step 4: Verify Depreciation in Solver Result**

**File:** `components/versions/financial-statements/FinancialStatements.tsx`

```typescript
// After solver (line 126)
if (result.success && result.data.converged) {
  // ✅ ADD: Check depreciation in result
  const yearsWithCapex = result.data.projection.filter(p => {
    const yearIndex = p.year - 2023;
    return params.capex[yearIndex]?.greaterThan(0);
  });
  
  console.log('[DEBUG] Depreciation for Years with Capex:', 
    yearsWithCapex.slice(0, 5).map(p => ({
      year: p.year,
      capex: params.capex[p.year - 2023].toString(),
      depreciation: p.depreciation.toString(),
      fixedAssets: p.fixedAssets.toString(),
    }))
  );
}
```

**Step 5: Fix Data Extraction (if needed)**

**File:** `components/versions/financial-statements/FinancialStatementsWrapper.tsx`

**Issue:** Currently extracts from `projection.years`, but CircularSolver returns `projection` array directly.

**Current Code:**
```typescript
// Line 233-248: Extracts from projection.years
for (let year = 2023; year <= 2052; year++) {
  const yearData = projection.years.find((y) => y.year === year);
  // ...
}
```

**Problem:** `projection.years` might not exist, or depreciation might not be in the right format.

**Fix:**
```typescript
// ✅ FIX: Extract from CircularSolver result directly
// The solver result is stored in FinancialStatements component
// Need to pass depreciation array from FinancialStatements to FinancialStatementsWrapper
// OR extract from the solver result in FinancialStatementsWrapper

// Option 1: Pass depreciation from FinancialStatements
// (Requires prop changes)

// Option 2: Extract from projection data
// Check if projection has depreciation field
```

**Most Likely Issue:** Depreciation is calculated correctly, but `FinancialStatementsWrapper` is not extracting it from the solver result.

**Fix Strategy:**
1. Verify depreciation is in solver result
2. Update `FinancialStatementsWrapper` to extract depreciation correctly
3. Pass depreciation to `PnLStatement` component

---

## Implementation Plan

### Phase 1: Quick Fixes (1 hour)

1. **Fix Next.js 15 Route Params** (30 minutes)
   - Update 4 route handlers to await params
   - Test routes

2. **Add Debugging** (30 minutes)
   - Add console.log statements to trace data flow
   - Focus on 2028 year for debugging

### Phase 2: EBITDA Investigation (2-3 hours)

1. **Add Comprehensive Debugging**
   - Debug EBITDA calculation chain
   - Verify array creation
   - Check data extraction

2. **Fix Issues Found**
   - Fix array ordering if needed
   - Fix data extraction if needed
   - Verify calculations

### Phase 3: Depreciation Fix (2-3 hours)

1. **Verify Depreciation Calculation**
   - Check fixed assets opening
   - Verify depreciation calculation
   - Check fixed assets update

2. **Fix Data Extraction**
   - Verify depreciation in solver result
   - Fix extraction in FinancialStatementsWrapper
   - Pass to display component

### Phase 4: Testing & Validation (1 hour)

1. **Test All Fixes**
   - Test Other Revenue API (should not 404)
   - Test EBITDA calculation (should be correct)
   - Test Depreciation (should appear after capex)

2. **Remove Debugging**
   - Remove console.log statements
   - Keep error logging

---

## Risk Assessment

**Low Risk:**
- Fix 1 (Route Params) - Simple change, well-documented

**Medium Risk:**
- Fix 2 (EBITDA) - Data flow issue, might require multiple iterations
- Fix 3 (Depreciation) - Calculation logic issue, might require refactoring

**Mitigation:**
- Add comprehensive debugging first
- Fix one issue at a time
- Test after each fix
- Keep debugging until all issues resolved

---

## Success Criteria

✅ **Fix 1:**
- Other Revenue API returns 200 (not 404)
- Other Revenue data is fetched successfully

✅ **Fix 2:**
- EBITDA for 2028: ~6-7M SAR (not -3.6B)
- EBITDA %: ~8-9% (not -4818%)
- All years show reasonable EBITDA values

✅ **Fix 3:**
- Depreciation appears after first capex
- Year 2028: Depreciation = 0 (no historical capex) ✅
- Year 2029: Depreciation > 0 (after 2028 capex) ✅
- Depreciation accumulates correctly

---

## Testing Checklist

### Fix 1: Other Revenue API
- [ ] GET `/api/versions/[id]/other-revenue` returns 200
- [ ] POST `/api/versions/[id]/other-revenue` works
- [ ] No 404 errors in console
- [ ] Other Revenue data is displayed

### Fix 2: EBITDA Calculation
- [ ] EBITDA for 2028 is ~6-7M (not -3.6B)
- [ ] EBITDA % is ~8-9% (not -4818%)
- [ ] Staff costs are positive in calculation
- [ ] Revenue, staff costs, rent, opex are correct
- [ ] EBITDA formula is correct: Revenue - Staff - Rent - Opex

### Fix 3: Depreciation
- [ ] Depreciation is 0 for years before first capex ✅
- [ ] Depreciation appears after first capex
- [ ] Depreciation = Fixed Assets × 10%
- [ ] Fixed assets accumulate with capex
- [ ] Fixed assets decrease with depreciation
- [ ] Depreciation is displayed in PnL statement

---

## Estimated Timeline

- **Phase 1 (Quick Fixes):** 1 hour
- **Phase 2 (EBITDA):** 2-3 hours
- **Phase 3 (Depreciation):** 2-3 hours
- **Phase 4 (Testing):** 1 hour

**Total:** 6-8 hours

---

## Next Steps

1. **Review this proposal** - Confirm approach
2. **Start with Phase 1** - Quick fixes first
3. **Add debugging** - Understand root causes
4. **Fix issues** - One at a time
5. **Test thoroughly** - Verify all fixes
6. **Remove debugging** - Clean up code

---

**Status:** 📋 **PROPOSAL READY FOR REVIEW**  
**Priority:** P0 - Critical Issues  
**Estimated Fix Time:** 6-8 hours

