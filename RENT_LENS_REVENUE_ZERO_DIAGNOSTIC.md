# Rent Lens Revenue Zero Issue - Diagnostic Guide

**Date:** November 17, 2025  
**Issue:** Revenue showing as 0 in Rent Model view, Rent Load % also showing 0.00%  
**Status:** 🔍 **INVESTIGATION REQUIRED**

---

## 📋 Symptom Summary

In the Rent Model view (`RentLens` component), the year-by-year projection table shows:
- **Revenue (SAR):** 0 for all years
- **Rent Load (%):** 0.00% for all years
- **Rent (SAR):** ✅ Correctly displayed (e.g., 18,960,000 SAR for 2028)

---

## 🔍 Root Cause Analysis

### Revenue Calculation Flow

The revenue in `RentLens` is calculated in this order:

1. **Input Data:**
   - `curriculumPlans` (from version)
   - `adminSettings` (CPI rate, discount rate, tax rate)
   - `startYear` and `endYear` (default: 2023-2052)

2. **Calculation Steps:**
   ```
   For each curriculum plan:
   ├─ Calculate tuition growth (using CPI rate and frequency)
   ├─ Get students projection (from curriculum plan)
   ├─ Calculate revenue = tuition × students (per year)
   └─ Aggregate revenue across all curricula
   ```

3. **Output:**
   - `revenueProjection`: Array of `{ year: number; revenue: Decimal }`
   - Used to calculate rent load: `(rent / revenue) × 100`

### Possible Causes

#### Cause #1: Students Projection is All Zeros ⚠️ **MOST LIKELY**

**Symptom:**
- Revenue = 0 for all years
- Rent Load = 0.00% for all years

**Root Cause:**
- `curriculumPlans[].studentsProjection` contains all zeros
- Or students projection is missing/empty

**How to Verify:**
1. Open browser console (F12)
2. Check for warnings: `"RentLens: No students projection data for curriculum..."`
3. Inspect `version.curriculumPlans[].studentsProjection` in React DevTools
4. Verify students projection has non-zero values

**Fix:**
- Update students projection in Curriculum tab
- Ensure at least some years have students > 0

---

#### Cause #2: Admin Settings Missing or Invalid

**Symptom:**
- Revenue = 0 for all years
- Console warnings about admin settings

**Root Cause:**
- `adminSettings` is `null`
- Or `adminSettings.cpiRate` is 0 or invalid

**How to Verify:**
1. Check console for: `"RentLens: Admin settings not available for revenue calculation"`
2. Verify `adminSettings` is not null in React DevTools
3. Check `/api/admin/settings` endpoint returns valid data

**Fix:**
- Ensure admin settings are configured
- Default values should be: `cpiRate: 0.03, discountRate: 0.08, taxRate: 0.15`

---

#### Cause #3: Curriculum Plans Missing or Empty

**Symptom:**
- Revenue = 0 for all years
- Console warnings about curriculum plans

**Root Cause:**
- `curriculumPlans` is empty array `[]`
- Or curriculum plans don't have required fields

**How to Verify:**
1. Check console for: `"RentLens: No curriculum plans available for revenue calculation"`
2. Verify `version.curriculumPlans` has at least one plan (FR required)
3. Check each plan has: `tuitionBase`, `cpiFrequency`, `studentsProjection`

**Fix:**
- Ensure version has at least FR curriculum plan
- Verify curriculum plan data is complete

---

#### Cause #4: Tuition Calculation Failing

**Symptom:**
- Revenue = 0 for all years
- Console errors about tuition calculation

**Root Cause:**
- `calculateTuitionGrowth()` is failing
- Or tuition base is 0 or invalid

**How to Verify:**
1. Check console for: `"RentLens: Failed to calculate tuition growth for curriculum..."`
2. Verify `curriculumPlans[].tuitionBase` is > 0
3. Check `curriculumPlans[].cpiFrequency` is 1, 2, or 3

**Fix:**
- Ensure tuition base is positive
- Verify CPI frequency is valid (1, 2, or 3)

---

#### Cause #5: Revenue Calculation Failing

**Symptom:**
- Revenue = 0 for all years
- Console errors about revenue calculation

**Root Cause:**
- `calculateRevenue()` is failing
- Or year mismatch between tuition and students data

**How to Verify:**
1. Check console for: `"RentLens: Failed to calculate revenue for curriculum..."`
2. Check for warnings: `"RentLens: Students data missing for years..."`
3. Verify tuition and students projections have matching years

**Fix:**
- Ensure students projection covers all years (2023-2052)
- Verify no year mismatches between tuition and students

---

## 🔧 Diagnostic Steps

### Step 1: Check Browser Console

Open browser console (F12) and look for:

**Expected Warnings (if issue exists):**
```
⚠️ RentLens: No curriculum plans available for revenue calculation
⚠️ RentLens: Admin settings not available for revenue calculation
⚠️ RentLens: No students projection data for curriculum FR
⚠️ RentLens: Failed to calculate tuition growth for curriculum FR
⚠️ RentLens: Failed to calculate revenue for curriculum FR
⚠️ RentLens: Revenue projection is empty - no revenue data calculated
```

**Action:** Note any warnings/errors and their context.

---

### Step 2: Inspect Version Data

In React DevTools or browser console:

```javascript
// Check version data
console.log('Version:', version);
console.log('Curriculum Plans:', version.curriculumPlans);
console.log('Admin Settings:', adminSettings);

// Check students projection
version.curriculumPlans.forEach((plan, idx) => {
  console.log(`Plan ${idx} (${plan.curriculumType}):`, {
    tuitionBase: plan.tuitionBase,
    cpiFrequency: plan.cpiFrequency,
    studentsProjection: plan.studentsProjection,
    studentsCount: Array.isArray(plan.studentsProjection) 
      ? plan.studentsProjection.filter(s => s.students > 0).length 
      : 0,
  });
});
```

**Expected Output:**
- At least one curriculum plan (FR required)
- `tuitionBase` > 0
- `studentsProjection` is array with non-zero values for some years
- `adminSettings` is not null

---

### Step 3: Check Revenue Projection Calculation

Add temporary logging to `RentLens.tsx` (line 289):

```typescript
const revenueProjection = useMemo(() => {
  console.log('🔍 [RENTLENS DEBUG] Starting revenue calculation...');
  console.log('🔍 [RENTLENS DEBUG] Curriculum Plans:', curriculumPlans);
  console.log('🔍 [RENTLENS DEBUG] Admin Settings:', adminSettings);
  
  // ... existing code ...
  
  console.log('🔍 [RENTLENS DEBUG] Revenue Projection Result:', result);
  return result;
}, [curriculumPlans, adminSettings, startYear, endYear]);
```

**Action:** Check console output to see where calculation fails.

---

### Step 4: Verify Students Projection Data

Check if students projection has actual values:

```javascript
// In browser console
const version = /* get from React DevTools */;
const frPlan = version.curriculumPlans.find(cp => cp.curriculumType === 'FR');
const students = frPlan?.studentsProjection || [];

console.log('Students Projection:', students);
console.log('Non-zero years:', students.filter(s => s.students > 0));
console.log('Total students (2028):', students.find(s => s.year === 2028)?.students || 0);
```

**Expected:**
- At least some years (especially 2028+) have students > 0
- If all zeros, that's the root cause

---

## ✅ Quick Fixes

### Fix #1: Update Students Projection

If students projection is all zeros:

1. Go to **Curriculum** tab in Version Detail
2. Edit FR curriculum plan
3. Set students enrollment for years 2028+
4. Save changes
5. Return to **Costs Analysis** tab
6. Revenue should now appear

---

### Fix #2: Verify Admin Settings

If admin settings are missing:

1. Check `/api/admin/settings` endpoint
2. Verify user has ADMIN role (or defaults are used)
3. Check `VersionDetail.tsx` line 167-202 for admin settings fetch
4. Defaults should be: `cpiRate: 0.03, discountRate: 0.08, taxRate: 0.15`

---

### Fix #3: Check Curriculum Plan Data

If curriculum plans are missing:

1. Verify version has at least FR curriculum plan
2. Check `tuitionBase` > 0
3. Check `cpiFrequency` is 1, 2, or 3
4. Check `studentsProjection` is array with 30 years (2023-2052)

---

## 📊 Expected Behavior

### Correct Output Example

**Year-by-Year Table:**
```
Year | Rent (SAR)      | Revenue (SAR)   | Rent Load (%) | YoY Change (%)
-----|-----------------|-----------------|---------------|---------------
2028 | 18,960,000      | 15,000,000      | 126.40%       | —
2029 | 18,960,000      | 18,000,000      | 105.33%       | 0.00%
2030 | 19,633,600      | 21,000,000      | 93.49%        | 3.50%
```

**Summary Metrics:**
- Year 1 Rent (2028): SAR 18,960,000 ✅
- Year 30 Rent (2052): SAR 28,649,862 ✅
- NPV (2028-2052): SAR 232,792,422 ✅
- Avg Rent Load %: **Should be > 0%** (e.g., 95.50%) ❌ Currently showing 0.00%

---

## 🎯 Most Likely Root Cause

Based on the code analysis, **Cause #1 (Students Projection All Zeros)** is the most likely issue:

1. ✅ Rent is displaying correctly (calculation works)
2. ❌ Revenue is 0 (students projection likely all zeros)
3. ❌ Rent Load is 0.00% (because revenue is 0)

**Evidence:**
- The screenshot shows revenue as 0 for all years
- Rent Load is 0.00% (division by zero or revenue = 0)
- Rent values are correct (rent calculation doesn't depend on revenue for Partner Model)

---

## 🔍 Next Steps

1. **Check Students Projection:**
   - Open Version Detail → Curriculum tab
   - Verify students enrollment is set for years 2028+
   - If all zeros, update students projection

2. **Check Browser Console:**
   - Look for warnings/errors from RentLens
   - Note any missing data warnings

3. **Verify Data:**
   - Check `version.curriculumPlans[].studentsProjection` in React DevTools
   - Verify at least some years have students > 0

4. **Test Fix:**
   - Update students projection
   - Refresh Costs Analysis tab
   - Revenue should now appear

---

**Status:** 🔍 **AWAITING USER VERIFICATION**

Please check the students projection data and report back what you find.

