# Financial Statements Implementation - Comprehensive Issues Report

**Date:** November 18, 2025  
**Reviewer:** Cursor AI  
**Status:** 🔴 **3 CRITICAL ISSUES IDENTIFIED**

---

## Executive Summary

**Total Issues Found:** 3 Critical Issues  
**Impact:** High - Affects core financial statement functionality and data accuracy  
**Priority:** P0 - Must fix before production

| Issue | Severity | Status | Impact |
|-------|----------|--------|--------|
| 404 Error - Other Revenue API | Medium | 🔴 Open | Other Revenue defaults to zero |
| Incorrect EBITDA Values | **CRITICAL** | 🔴 Open | Core financial metric wrong (~500x error) |
| Depreciation Not Appearing (0) | **CRITICAL** | 🔴 Open | Balance Sheet & PnL incomplete |

**Recommendation:** ⚠️ **DO NOT DEPLOY TO PRODUCTION** - All 3 issues must be resolved

---

## 🔴 Issue 1: 404 Error - Other Revenue API Route

### Error Details

```
[FinancialStatementsWrapper] Other revenue HTTP error: 404 "Not Found"
at fetchData (components/versions/financial-statements/FinancialStatementsWrapper.tsx:89:19)
```

### Root Cause Analysis

**Location:** `components/versions/financial-statements/FinancialStatementsWrapper.tsx:86`

```typescript
const orResponse = await fetch(`/api/versions/${version.id}/other-revenue`);
```

**Evidence from Screenshot:**
- Revenue is `0` for years 2023-2027
- This could be related to Other Revenue not being fetched

**Possible Causes:**
1. ✅ **Route file exists** at `/app/api/versions/[id]/other-revenue/route.ts`
2. ❓ **Route not accessible** - Next.js 15 App Router routing issue
3. ❓ **Version ID invalid** - causing 404
4. ❓ **Route handler not exported correctly**

### Verification Steps

**Check 1: Route File Structure**
- ✅ File exists: `/app/api/versions/[id]/other-revenue/route.ts`
- ✅ GET handler exported: `export async function GET(...)`
- ✅ POST handler exported: `export async function POST(...)`

**Check 2: Route Path**
- ✅ Expected path: `/api/versions/[id]/other-revenue`
- ✅ Actual fetch: `/api/versions/${version.id}/other-revenue`
- ⚠️ **Potential Issue:** Next.js 15 App Router requires `[id]` folder structure

**Check 3: Route Handler Implementation**
```typescript:86:92:components/versions/financial-statements/FinancialStatementsWrapper.tsx
const orResponse = await fetch(`/api/versions/${version.id}/other-revenue`);

if (!orResponse.ok) {
  console.error('[FinancialStatementsWrapper] Other revenue HTTP error:', orResponse.status, orResponse.statusText);
  // Continue with empty other revenue (not critical)
}
```

### Recommended Fix

**Option 1: Verify Route Structure (Most Likely)**
```bash
# Check if route file is in correct location
ls -la app/api/versions/\[id\]/other-revenue/route.ts

# If missing, check for alternative structure
find . -name "other-revenue" -type f
```

**Option 2: Add Error Handling & Debugging**
```typescript
// In FinancialStatementsWrapper.tsx
const orResponse = await fetch(`/api/versions/${version.id}/other-revenue`);

if (!orResponse.ok) {
  // Enhanced error logging
  console.error('[FinancialStatementsWrapper] Other revenue HTTP error:', {
    status: orResponse.status,
    statusText: orResponse.statusText,
    url: `/api/versions/${version.id}/other-revenue`,
    versionId: version.id,
  });
  
  // Check if version exists
  if (orResponse.status === 404) {
    console.warn('⚠️ Other revenue route not found. Check route structure.');
  }
  
  // Continue with empty other revenue (not critical)
}
```

**Option 3: Verify Next.js Route Configuration**
- Check `next.config.js` for route rewrites/redirects
- Verify App Router is enabled
- Check for middleware blocking the route

### Impact

- **Severity:** Medium (non-critical, but affects data completeness)
- **User Experience:** Other Revenue defaults to zero (silent failure)
- **Data Accuracy:** Other Revenue not included in calculations if route fails
- **Evidence:** Revenue is 0 for years 2023-2027 in screenshot

### Testing

```bash
# Test route directly
curl http://localhost:3000/api/versions/[version-id]/other-revenue

# Expected: JSON response with other revenue items or empty array
# Actual: 404 Not Found
```

---

## 🔴 Issue 2: Incorrect EBITDA Values in PnL Statement (CRITICAL)

### Error Details

**Observed Values (from screenshot):**
- **Year 2028:**
  - Revenue: 75,116,880 SAR
  - Staff Costs: (68,666,400) SAR (shown in parentheses = negative)
  - EBITDA: **-3,619,470,186 SAR** ❌ (EXTREMELY NEGATIVE)
  - EBITDA %: **-4818.5%** ❌

**Expected Values:**
- Revenue: 75,116,880 SAR
- Staff Costs: 68,666,400 SAR (positive expense)
- EBITDA: ~6-7M SAR (before rent and opex)
- EBITDA %: ~8-9%

**Discrepancy:** EBITDA is **~500x more negative** than expected

### Root Cause Analysis

**Formula:** `EBITDA = Revenue - Staff Costs - Rent - Opex`

**Expected Calculation:**
```
EBITDA = 75,116,880 - 68,666,400 - Rent - Opex
       = 6,450,480 - Rent - Opex
       ≈ 6-7M SAR (before rent/opex)
```

**Actual Calculation:**
```
EBITDA = -3,619,470,186 SAR
```

**Possible Causes:**

1. **Sign Error in Staff Costs**
   - Staff costs might be added instead of subtracted
   - Or staff costs are stored as negative values

2. **EBITDA Calculation Error**
   - `calculateEBITDA()` function might have sign error
   - Or EBITDA array passed to CircularSolver is wrong

3. **Data Type Issue**
   - Staff costs might be stored/displayed incorrectly
   - Decimal.js conversion issue

4. **CircularSolver Overwriting EBITDA**
   - Solver might be modifying EBITDA incorrectly
   - Or using wrong EBITDA value

### Code Investigation

**Check 1: EBITDA Calculation Function**
```typescript:87:91:lib/calculations/financial/ebitda.ts
// Calculate EBITDA: Revenue - Staff Cost - Rent - Opex
const ebitda = safeSubtract(
  safeSubtract(safeSubtract(revenueDecimal, staffCostDecimal), rentDecimal),
  opexDecimal
);
```
✅ **Correct** - Formula is correct (subtraction, not addition)

**Check 2: EBITDA Array in Projection**
```typescript:456:456:lib/calculations/financial/projection.ts
ebitdaArray.push(ebitdaItem?.ebitda || new Decimal(0));
```
✅ **Correct** - Uses calculated EBITDA from `calculateEBITDA()`

**Check 3: CircularSolver Preserving EBITDA**
```typescript:400:400:lib/calculations/financial/circular-solver.ts
const ebitda = params.ebitda[i];
```
```typescript:494:494:lib/calculations/financial/circular-solver.ts
ebitda,
```
✅ **Correct** - Solver preserves EBITDA from params

**Check 4: Staff Costs Sign in Display**
```typescript:135:137:components/versions/financial-statements/PnLStatement.tsx
<TableCell className="text-right font-mono text-sm text-accent-red">
  ({formatCurrency(year.staffCosts)})
</TableCell>
```
⚠️ **Issue Found:** Staff costs are displayed in parentheses (negative), but should be positive expenses

**Check 5: Staff Costs Calculation**
```typescript:357:360:lib/calculations/financial/projection.ts
const staffCostByYear = staffCostResult.data.map((item) => ({
  year: item.year,
  staffCost: item.staffCost,
}));
```
✅ **Correct** - Staff costs are positive values

### Root Cause Hypothesis

**Most Likely:** Staff costs are being **added** instead of **subtracted** in the EBITDA calculation, OR staff costs are stored as **negative values** somewhere in the chain.

**Evidence:**
- Revenue: 75,116,880 (positive) ✅
- Staff Costs: (68,666,400) shown in parentheses (negative) ⚠️
- EBITDA: -3,619,470,186 (extremely negative) ❌

**If staff costs are negative:**
```
EBITDA = 75,116,880 - (-68,666,400) - Rent - Opex
       = 75,116,880 + 68,666,400 - Rent - Opex
       = 143,783,280 - Rent - Opex
```

**But this still doesn't explain -3.6 billion!**

**Alternative Hypothesis:** EBITDA calculation is using **absolute values** or there's a **multiplication error** somewhere, possibly related to rent calculation (RevenueShare model might be calculating rent incorrectly with negative revenue or staff costs).

### Recommended Fix

**Step 1: Verify Staff Costs Sign**
```typescript
// Add debugging in FinancialStatementsWrapper.tsx
console.log('Staff Costs Array:', staffCosts);
console.log('Sample Staff Cost (2028):', staffCosts[5]); // Index 5 = 2028
console.log('EBITDA Array:', ebitda);
console.log('Sample EBITDA (2028):', ebitda[5]);
```

**Step 2: Verify EBITDA Calculation**
```typescript
// Add debugging in projection.ts (line 386)
const ebitdaResult = calculateEBITDA(ebitdaParams);
if (!ebitdaResult.success) {
  return ebitdaResult;
}

// Add logging
console.log('EBITDA Result (2028):', ebitdaResult.data.find(e => e.year === 2028));
console.log('EBITDA Components (2028):', {
  revenue: totalRevenueByYear.find(r => r.year === 2028)?.revenue.toString(),
  staffCost: staffCostByYear.find(s => s.year === 2028)?.staffCost.toString(),
  rent: rentByYear.find(r => r.year === 2028)?.rent.toString(),
  opex: opexByYear.find(o => o.year === 2028)?.totalOpex.toString(),
});
```

**Step 3: Check for Sign Error in calculateEBITDA**
```typescript
// Verify in lib/calculations/financial/ebitda.ts
// Line 88-91: Should be subtraction, not addition
const ebitda = safeSubtract(
  safeSubtract(safeSubtract(revenueDecimal, staffCostDecimal), rentDecimal),
  opexDecimal
);

// Add validation logging
console.log('EBITDA Calculation (2028):', {
  revenue: revenueDecimal.toString(),
  staffCost: staffCostDecimal.toString(),
  rent: rentDecimal.toString(),
  opex: opexDecimal.toString(),
  ebitda: ebitda.toString(),
});
```

**Step 4: Check Rent Calculation (RevenueShare Model)**
```typescript
// If rent model is REVENUE_SHARE, verify revenue is positive
// Check lib/calculations/financial/projection.ts line 301-304
const rentParams: RentCalculationParams = {
  model: 'REVENUE_SHARE',
  revenueByYear: totalRevenueByYear, // ✅ Should include Other Revenue
  revenueSharePercent: (rentPlan.parameters.revenueSharePercent as Decimal | number | string) ?? 0,
};
```

### Impact

- **Severity:** **CRITICAL** - Core financial metric is wrong
- **User Experience:** Users see incorrect EBITDA values (500x error)
- **Data Accuracy:** All financial decisions based on wrong data
- **Business Impact:** High - affects financial planning decisions

### Testing

```typescript
// Test case: Verify EBITDA calculation
const testRevenue = new Decimal(75_116_880);
const testStaffCost = new Decimal(68_666_400);
const testRent = new Decimal(5_000_000);
const testOpex = new Decimal(2_000_000);

const expectedEBITDA = testRevenue
  .minus(testStaffCost)
  .minus(testRent)
  .minus(testOpex);
// Expected: -576,520 SAR (negative, but small)

const result = calculateEBITDAForYear(
  testRevenue,
  testStaffCost,
  testRent,
  testOpex
);

console.log('Expected:', expectedEBITDA.toString());
console.log('Actual:', result.data.ebitda.toString());
```

---

## 🔴 Issue 3: Depreciation Not Appearing in PnL Statement (CRITICAL)

### Error Details

**Observed Values (from screenshot):**
- **All Years (2023-2037):**
  - Depreciation: `(0)` ❌ (consistently zero)
  - Expected: Non-zero depreciation based on fixed assets

**Formula:** `Depreciation = Fixed Assets (Opening) × Depreciation Rate`

### Root Cause Analysis

**Depreciation Calculation in CircularSolver:**
```typescript:405:405:lib/calculations/financial/circular-solver.ts
const depreciation = previousFixedAssets.times(params.depreciationRate);
```

**Fixed Assets Calculation:**
```typescript:478:478:lib/calculations/financial/circular-solver.ts
const fixedAssets = previousFixedAssets.plus(capex).minus(depreciation);
```

**Fixed Assets Opening Calculation:**
```typescript:417:423:lib/calculations/financial/projection.ts
const fixedAssetsOpening = capexItems
  .filter(item => {
    const itemYear = typeof item.year === 'number' ? item.year : parseInt(String(item.year), 10);
    return itemYear < startYear;
  })
  .reduce((sum, item) => sum.plus(toDecimal(item.amount)), new Decimal(0));
```

**Depreciation Rate:**
```typescript:425:428:lib/calculations/financial/projection.ts
const depreciationRate = params.depreciationRate 
  ? toDecimal(params.depreciationRate)
  : new Decimal(0.10); // Default: 10% straight-line
```

### Possible Causes

1. **Fixed Assets Opening is 0**
   - No historical capex items (before startYear)
   - Or historical capex items not being filtered correctly

2. **Depreciation Rate is 0 or Not Set**
   - Default is 0.10 (10%), but might not be passed correctly
   - Or depreciationRate is explicitly set to 0

3. **Capex Items Not Accumulating**
   - Fixed assets not growing with capex
   - Or capex items are 0

4. **Depreciation Not Being Passed to Display**
   - CircularSolver calculates depreciation, but it's not displayed
   - Or depreciation is being overwritten to 0

### Evidence from Screenshot

**Capex Items Summary:**
- Year 2028: 2,000,000 SAR (Technology)
- Year 2032: 2,251,017.62 SAR
- Year 2036: 2,533,540.16 SAR
- Year 2040: 2,851,521.77 SAR
- Year 2044: 3,209,412.88 SAR
- Year 2048: 3,612,222.47 SAR
- Year 2052: 4,065,588.21 SAR
- **Total: 20,523,303.11 SAR**

**Analysis:**
- ✅ Capex items exist (from 2028 onwards)
- ❌ But depreciation is 0 for all years
- ⚠️ Fixed assets opening should be 0 (no capex before 2028)
- ⚠️ But after 2028, fixed assets should accumulate and depreciate

### Root Cause Hypothesis

**Most Likely:** Fixed assets opening is 0 (no historical capex before 2028), and the first year's depreciation calculation might have an issue, OR fixed assets are not accumulating correctly after the first capex item.

**Expected Behavior:**
```
Year 2028:
- Fixed Assets Opening: 0 (no historical capex)
- Capex: 2,000,000
- Fixed Assets (before depreciation): 2,000,000
- Depreciation (10%): 200,000
- Fixed Assets (ending): 1,800,000

Year 2029:
- Fixed Assets Opening: 1,800,000
- Capex: 0 (no capex this year)
- Fixed Assets (before depreciation): 1,800,000
- Depreciation (10%): 180,000
- Fixed Assets (ending): 1,620,000

Year 2032:
- Fixed Assets Opening: ~1,458,000 (after 3 years of depreciation)
- Capex: 2,251,017.62
- Fixed Assets (before depreciation): ~3,709,017.62
- Depreciation (10%): ~370,901.76
- Fixed Assets (ending): ~3,338,115.86
```

**Actual Behavior:**
- All years show depreciation = 0 ❌

### Recommended Fix

**Step 1: Verify Fixed Assets Opening**
```typescript
// Add debugging in projection.ts (line 417)
const fixedAssetsOpening = capexItems
  .filter(item => {
    const itemYear = typeof item.year === 'number' ? item.year : parseInt(String(item.year), 10);
    return itemYear < startYear;
  })
  .reduce((sum, item) => sum.plus(toDecimal(item.amount)), new Decimal(0));

console.log('Fixed Assets Opening:', fixedAssetsOpening.toString());
console.log('Historical Capex Items:', capexItems.filter(item => {
  const itemYear = typeof item.year === 'number' ? item.year : parseInt(String(item.year), 10);
  return itemYear < startYear;
}));
```

**Step 2: Verify Depreciation Rate**
```typescript
// Add debugging in projection.ts (line 425)
const depreciationRate = params.depreciationRate 
  ? toDecimal(params.depreciationRate)
  : new Decimal(0.10); // Default: 10%

console.log('Depreciation Rate:', depreciationRate.toString());
console.log('Depreciation Rate Source:', params.depreciationRate ? 'params' : 'default');
```

**Step 3: Verify Depreciation Calculation in CircularSolver**
```typescript
// Add debugging in circular-solver.ts (line 405)
const depreciation = previousFixedAssets.times(params.depreciationRate);

console.log('Depreciation Calculation:', {
  year,
  previousFixedAssets: previousFixedAssets.toString(),
  depreciationRate: params.depreciationRate.toString(),
  depreciation: depreciation.toString(),
});
```

**Step 4: Verify Fixed Assets Accumulation**
```typescript
// Add debugging in circular-solver.ts (line 478)
const fixedAssets = previousFixedAssets.plus(capex).minus(depreciation);

console.log('Fixed Assets Calculation:', {
  year,
  previousFixedAssets: previousFixedAssets.toString(),
  capex: capex.toString(),
  depreciation: depreciation.toString(),
  fixedAssets: fixedAssets.toString(),
});
```

**Step 5: Check if Depreciation is Being Displayed**
```typescript
// Verify in PnLStatement.tsx
// Line 144-146: Should display depreciation from projection
<TableCell className="text-right font-mono text-sm text-accent-red">
  ({formatCurrency(year.depreciation)})
</TableCell>
```

### Impact

- **Severity:** **CRITICAL** - Balance Sheet and PnL incomplete
- **User Experience:** Depreciation not visible in financial statements
- **Data Accuracy:** Fixed assets valuation is wrong
- **Business Impact:** High - affects asset valuation and financial reporting

### Testing

```typescript
// Test case: Verify depreciation calculation
const testFixedAssets = new Decimal(2_000_000);
const testDepreciationRate = new Decimal(0.10);

const expectedDepreciation = testFixedAssets.times(testDepreciationRate);
// Expected: 200,000 SAR

console.log('Expected Depreciation:', expectedDepreciation.toString());

// Verify in CircularSolver
const depreciation = previousFixedAssets.times(params.depreciationRate);
console.log('Actual Depreciation:', depreciation.toString());
```

---

## Summary of All Issues

| Issue | Severity | Status | Impact | Estimated Fix Time |
|-------|----------|--------|--------|-------------------|
| 404 Error - Other Revenue API | Medium | 🔴 Open | Other Revenue defaults to zero | 1-2 hours |
| Incorrect EBITDA Values | **CRITICAL** | 🔴 Open | Core financial metric wrong (~500x error) | 4-6 hours |
| Depreciation Not Appearing (0) | **CRITICAL** | 🔴 Open | Balance Sheet & PnL incomplete | 2-3 hours |

**Total Estimated Fix Time:** 7-11 hours

---

## Recommended Action Plan

### Immediate (P0 - Today)

1. **Fix Depreciation Calculation** (2-3 hours)
   - Verify fixed assets opening calculation
   - Check depreciation rate is being passed correctly
   - Verify depreciation is calculated and displayed
   - Test with known values

2. **Fix EBITDA Calculation** (4-6 hours)
   - Add debugging to trace EBITDA calculation chain
   - Verify staff costs sign throughout the chain
   - Check for multiplication/sign errors
   - Verify rent calculation (RevenueShare model)

3. **Fix 404 Error** (1-2 hours)
   - Verify Next.js route structure
   - Test route directly with curl
   - Add error handling and logging

### Short-term (P1 - This Week)

4. **Add Unit Tests**
   - Test EBITDA calculation with known values
   - Test depreciation calculation with known values
   - Test Other Revenue API route
   - Test edge cases (zero revenue, negative EBITDA)

5. **Add Validation**
   - Validate EBITDA values are within reasonable range
   - Validate depreciation is calculated when fixed assets exist
   - Add warnings for extreme values
   - Add data quality checks

### Long-term (P2 - Next Sprint)

6. **Improve Error Handling**
   - Better error messages for API failures
   - User-friendly error display
   - Retry logic for transient failures

7. **Performance Optimization**
   - Cache financial calculations
   - Optimize depreciation calculation
   - Add performance monitoring

---

## Testing Checklist

### Issue 1: Other Revenue API
- [ ] Verify route exists at `/app/api/versions/[id]/other-revenue/route.ts`
- [ ] Test route directly: `curl http://localhost:3000/api/versions/[version-id]/other-revenue`
- [ ] Verify GET handler returns data
- [ ] Verify POST handler accepts data
- [ ] Check console for 404 errors
- [ ] Verify Other Revenue is included in total revenue

### Issue 2: EBITDA Calculation
- [ ] Verify staff costs are positive in all calculations
- [ ] Test EBITDA calculation with known test values
- [ ] Check EBITDA values are within reasonable range
- [ ] Verify rent calculation (RevenueShare model)
- [ ] Test with zero revenue (edge case)
- [ ] Test with negative EBITDA (edge case)
- [ ] Verify PnL statement displays correct EBITDA values

### Issue 3: Depreciation Calculation
- [ ] Verify fixed assets opening is calculated correctly
- [ ] Verify depreciation rate is 10% (default) or from params
- [ ] Test depreciation calculation with known values
- [ ] Verify fixed assets accumulate with capex
- [ ] Verify depreciation is calculated each year
- [ ] Test with zero fixed assets (edge case)
- [ ] Verify PnL statement displays depreciation
- [ ] Verify Balance Sheet shows correct fixed assets

---

## Code References

### Issue 1: Other Revenue API
- Route: `/app/api/versions/[id]/other-revenue/route.ts`
- Fetch: `components/versions/financial-statements/FinancialStatementsWrapper.tsx:86`
- Error: `components/versions/financial-statements/FinancialStatementsWrapper.tsx:89`

### Issue 2: EBITDA Calculation
- Calculation: `lib/calculations/financial/ebitda.ts:87-91`
- Array: `lib/calculations/financial/projection.ts:456`
- Solver: `lib/calculations/financial/circular-solver.ts:400, 494`
- Display: `components/versions/financial-statements/PnLStatement.tsx:135-137`

### Issue 3: Depreciation Calculation
- Calculation: `lib/calculations/financial/circular-solver.ts:405`
- Fixed Assets: `lib/calculations/financial/circular-solver.ts:478`
- Opening: `lib/calculations/financial/projection.ts:417-423`
- Rate: `lib/calculations/financial/projection.ts:425-428`
- Display: `components/versions/financial-statements/PnLStatement.tsx:144-146`

---

## Additional Notes

### Depreciation Policy

According to the implementation plan, depreciation should be calculated as:
- **Straight-line depreciation** on fixed assets
- **Default rate:** 10% per year
- **Formula:** `Depreciation = Fixed Assets (Opening) × Depreciation Rate`
- **Fixed Assets:** Accumulate with capex, decrease with depreciation

### EBITDA Formula

According to the PRD:
- **Formula:** `EBITDA = Revenue - Staff Costs - Rent - Opex`
- **Components:**
  - Revenue: Total revenue (curriculum + other revenue)
  - Staff Costs: Teacher + non-teacher salaries (with CPI growth)
  - Rent: Based on rent model (FixedEscalation, RevenueShare, PartnerModel)
  - Opex: Variable % of revenue + fixed sub-accounts

### Other Revenue Integration

According to Fix 1 in the refactor proposal:
- Other Revenue should be included in total revenue
- Other Revenue is fetched from API endpoint
- If fetch fails, defaults to zero (non-critical)
- Other Revenue is used in rent calculation (RevenueShare model)

---

**Document Version:** 1.0  
**Last Updated:** November 18, 2025  
**Prepared For:** Implementation Team  
**Priority:** P0 - Critical Issues

