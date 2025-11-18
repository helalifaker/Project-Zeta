# IB Checkbox - FR Curriculum Disappearing Fix

**Date:** November 17, 2025  
**Issue:** When unchecking IB checkbox, FR curriculum disappears from UI  
**Status:** ✅ **FIXED**

---

## 🔴 Problem

**Symptom:**
- User unchecks IB checkbox
- IB plan is disabled (capacity = 0) ✅
- **FR curriculum disappears from UI** ❌

**Root Cause:**
Frontend was **replacing** the entire `curriculumPlans` array instead of **merging** with existing plans.

---

## 🔍 Root Cause Analysis

### The Issue

**File:** `components/versions/VersionDetail.tsx` Line 1315

**Before (WRONG):**
```typescript
setVersion((prevVersion) => ({
  ...prevVersion,
  curriculumPlans: result.data.curriculumPlans, // ❌ REPLACES entire array
}));
```

**What Happens:**
1. Frontend has: `[FR plan, IB plan]` (2 plans)
2. API returns: `[IB plan]` (only updated IB plan - for performance)
3. Frontend replaces: `curriculumPlans = [IB plan]` ❌
4. **Result:** FR plan disappears!

**Why This Happened:**
- Performance optimization (Fix #2.3) made API return only updated plans
- Frontend merge logic wasn't updated to handle partial updates
- Frontend assumed API always returns complete data

---

## ✅ Fix Applied

**File:** `components/versions/VersionDetail.tsx` Lines 1305-1320

**After (CORRECT):**
```typescript
setVersion((prevVersion) => {
  if (!prevVersion) return prevVersion;
  
  // Get updated plan IDs from response
  const updatedPlanIds = new Set(result.data.curriculumPlans.map((p: any) => p.id));
  
  // Keep existing plans that weren't updated (e.g., FR plan)
  const existingPlansNotUpdated = (prevVersion.curriculumPlans || []).filter(
    (p) => !updatedPlanIds.has(p.id)
  );
  
  // Merge: existing plans (not updated) + updated plans from response
  const mergedPlans = [...existingPlansNotUpdated, ...result.data.curriculumPlans];
  
  return {
    ...prevVersion,
    curriculumPlans: mergedPlans, // ✅ MERGED array
  };
});
```

**How It Works:**
1. Frontend has: `[FR plan, IB plan]` (2 plans)
2. API returns: `[IB plan]` (only updated IB plan)
3. Frontend identifies: Updated plan IDs = `[IB plan id]`
4. Frontend keeps: Existing plans NOT in updated list = `[FR plan]`
5. Frontend merges: `[FR plan] + [IB plan]` = `[FR plan, IB plan]` ✅
6. **Result:** Both plans remain visible!

---

## 📊 Impact

### Before Fix
- ❌ FR curriculum disappears when unchecking IB
- ❌ User loses visibility of FR plan
- ❌ UI shows incomplete data

### After Fix
- ✅ FR curriculum remains visible
- ✅ IB plan updates correctly
- ✅ Both plans shown in UI
- ✅ No data loss

---

## 🔍 Why This Wasn't Caught Earlier

### Original Assumption
- **Assumed:** API always returns complete `curriculumPlans` array
- **Reality:** Performance optimization changed API to return only updated plans
- **Gap:** Frontend merge logic wasn't updated to match new API behavior

### Testing Gap
- **Missing:** Test for partial update scenarios
- **Missing:** Test for state merging logic
- **Missing:** Visual regression testing

---

## ✅ Validation

### Test Cases

1. **Uncheck IB (Disable):**
   - ✅ IB plan capacity = 0
   - ✅ FR plan remains visible
   - ✅ Both plans in UI

2. **Check IB (Enable):**
   - ✅ IB plan capacity = 200
   - ✅ FR plan remains visible
   - ✅ Both plans in UI

3. **Multiple Toggles:**
   - ✅ Toggle IB on/off multiple times
   - ✅ FR plan always remains visible
   - ✅ No data loss

---

## 📝 Files Modified

1. **`components/versions/VersionDetail.tsx`**
   - Lines 1305-1320: Changed from array replacement to array merge
   - Added logic to keep existing plans not in response
   - Added merge logic to combine existing + updated plans

---

## 🎯 Lesson Learned

**Key Takeaway:**
When optimizing API to return partial data, **always update frontend merge logic** to handle partial updates correctly.

**Best Practice:**
- ✅ **Merge, don't replace** when handling partial updates
- ✅ **Test partial update scenarios** after performance optimizations
- ✅ **Document API behavior changes** when optimizing

---

**Status:** ✅ **FIXED - FR CURRICULUM NOW REMAINS VISIBLE**

