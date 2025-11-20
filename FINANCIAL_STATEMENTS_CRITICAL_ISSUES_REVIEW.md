# Financial Statements - Critical Issues Review

**Date:** November 18, 2025  
**Reviewer:** Cursor AI  
**Status:** 🔴 **CRITICAL ISSUES FOUND**

---

## Executive Summary

**Issues Identified:** 2 Critical Issues  
**Impact:** High - Affects core functionality and data accuracy  
**Priority:** P0 - Must fix before production

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

**Possible Causes:**
1. ✅ **Route file exists** at `/app/api/versions/[id]/other-revenue/route.ts`
2. ❓ **Route not accessible** - Next.js routing issue
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

### Testing

```bash
# Test route directly
curl http://localhost:3000/api/versions/[version-id]/other-revenue

# Expected: JSON response with other revenue items or empty array
# Actual: 404 Not Found
```

---

## 🔴 Issue 2: Incorrect EBITDA Values in PnL Statement

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

**Alternative Hypothesis:** EBITDA calculation is using **absolute values** or there's a **multiplication error** somewhere.

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

**Step 4: Check Staff Costs Source**
```typescript
// Verify staff costs are positive in calculateStaffCosts
// Check lib/calculations/financial/staff-costs.ts
```

### Impact

- **Severity:** **CRITICAL** - Core financial metric is wrong
- **User Experience:** Users see incorrect EBITDA values
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

## Summary of Issues

| Issue | Severity | Status | Impact |
|-------|----------|--------|--------|
| 404 Error - Other Revenue API | Medium | 🔴 Open | Other Revenue defaults to zero |
| Incorrect EBITDA Values | **CRITICAL** | 🔴 Open | Core financial metric wrong |

---

## Recommended Actions

### Immediate (P0)

1. **Fix EBITDA Calculation**
   - Add debugging to trace EBITDA calculation
   - Verify staff costs sign throughout the chain
   - Check for multiplication/sign errors in `calculateEBITDA()`

2. **Fix 404 Error**
   - Verify Next.js route structure
   - Test route directly with curl
   - Add error handling and logging

### Short-term (P1)

3. **Add Unit Tests**
   - Test EBITDA calculation with known values
   - Test Other Revenue API route
   - Test edge cases (zero revenue, negative EBITDA)

4. **Add Validation**
   - Validate EBITDA values are within reasonable range
   - Add warnings for extreme values
   - Add data quality checks

### Long-term (P2)

5. **Improve Error Handling**
   - Better error messages for API failures
   - User-friendly error display
   - Retry logic for transient failures

---

## Testing Checklist

- [ ] Verify Other Revenue API route is accessible
- [ ] Test EBITDA calculation with known test values
- [ ] Verify staff costs are positive in all calculations
- [ ] Check EBITDA values are within reasonable range
- [ ] Test with zero revenue (edge case)
- [ ] Test with negative EBITDA (edge case)
- [ ] Verify PnL statement displays correct values
- [ ] Check console for errors/warnings

---

**Next Steps:**
1. Investigate EBITDA calculation with debugging
2. Fix 404 error for Other Revenue API
3. Add unit tests for both issues
4. Update this document with resolution

