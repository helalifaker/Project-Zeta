# IB Checkbox Toggle - Comprehensive Debugging Guide

**Date:** November 17, 2025  
**Issue:** IB checkbox returns HTTP 500 "An unexpected error occurred"  
**Status:** 🔍 **DEBUGGING IN PROGRESS**

---

## 📋 Executive Summary

This guide provides **step-by-step debugging instructions** for fixing the IB checkbox toggle issue. The error suggests the fixes from `IB_CHECKBOX_FIX_REPORT.md` may not be fully applied or there's an additional issue not covered in the report.

**Critical Finding:** The validation logic runs **AFTER** the database update, which could cause data inconsistency if validation fails.

---

## 🔍 Problem Analysis

### Current Error

- **Error Message:** "Failed to update IB status - HTTP error: 500 'An unexpected error occurred.'"
- **Location:** `components/versions/VersionDetail.tsx:1271`
- **HTTP Status:** 500 (Internal Server Error)
- **Error Code:** Not specified (generic error)

### Root Cause Hypothesis

Based on code review, there are **3 potential issues**:

#### Issue #1: Validation Happens AFTER Update ⚠️ **CRITICAL**

**Location:** `app/api/versions/[id]/route.ts` lines 464-600 (update) vs 872-919 (validation)

**Problem:**

```typescript
// ❌ CURRENT FLOW (WRONG):
1. Update curriculum plan in database (lines 464-600)
2. THEN validate FR requirement (lines 872-919)
3. If validation fails, update already committed!
```

**Impact:**

- If validation fails, database is already updated
- Data inconsistency possible
- Rollback required but not implemented

**Fix Required:** Move validation **BEFORE** database update

---

#### Issue #2: Fallback Validation Logic Incomplete ⚠️ **HIGH**

**Location:** `app/api/versions/[id]/route.ts` lines 923-950

**Problem:**
The fallback validation logic appears incomplete. The code shows:

```typescript
} catch (fetchError) {
  console.error('❌ Error fetching curriculum plans for validation:', fetchError);
  // If we can't fetch other plans, still validate with what we have
  const updatedTypes = updatedCurriculumPlans.map((cp: any) => cp.curriculumType);

  // Try to fetch all plans as fallback
  try {
    // ... fallback code should be here but may be incomplete
```

**Impact:**

- If primary fetch fails, fallback may not work correctly
- Validation might pass incorrectly
- Or validation might fail incorrectly

**Fix Required:** Complete fallback validation logic

---

#### Issue #3: Error Handler Returns Generic Message ⚠️ **MEDIUM**

**Location:** `app/api/versions/[id]/route.ts` lines 988-1042

**Problem:**
The error handler might be returning "An unexpected error occurred" from `handleDatabaseError` function, which masks the real error.

**Impact:**

- Real error is hidden
- Debugging is difficult
- User sees unhelpful message

**Fix Required:** Ensure error handler provides specific error messages

---

## ✅ Step-by-Step Debugging Process

### Step 1: Verify Current Code State

**Action:** Check if fixes from report are actually applied

**Checklist:**

- [ ] Open `app/api/versions/[id]/route.ts`
- [ ] Verify lines 534-547 have `studentsProjection` validation
- [ ] Verify lines 562-579 have enhanced error handling
- [ ] Verify lines 872-919 have database state validation
- [ ] Verify lines 923-950 have fallback validation

**If fixes are missing:**

- Apply fixes from `IB_CHECKBOX_FIX_REPORT.md`
- Then proceed to Step 2

---

### Step 2: Add Comprehensive Logging

**Action:** Add detailed logging to identify exact failure point

**File:** `app/api/versions/[id]/route.ts`

**Add at line 464 (before curriculum update):**

```typescript
console.log('🔍 [IB TOGGLE DEBUG] Starting curriculum plan update');
console.log('🔍 [IB TOGGLE DEBUG] Request data:', JSON.stringify(data.curriculumPlans, null, 2));
console.log('🔍 [IB TOGGLE DEBUG] Version ID:', id);
```

**Add at line 550 (before Prisma update):**

```typescript
console.log('🔍 [IB TOGGLE DEBUG] Updating plan:', planUpdate.id);
console.log('🔍 [IB TOGGLE DEBUG] Update data:', JSON.stringify(updateData, null, 2));
```

**Add at line 872 (before validation):**

```typescript
console.log('🔍 [IB TOGGLE DEBUG] Starting validation');
console.log('🔍 [IB TOGGLE DEBUG] Updated plans:', JSON.stringify(updatedCurriculumPlans, null, 2));
```

**Add at line 877 (before fetching other plans):**

```typescript
console.log('🔍 [IB TOGGLE DEBUG] Fetching other plans, updated IDs:', Array.from(updatedIds));
```

**Add at line 900 (after combining plans):**

```typescript
console.log('🔍 [IB TOGGLE DEBUG] All plans combined:', JSON.stringify(allPlans, null, 2));
console.log('🔍 [IB TOGGLE DEBUG] All curriculum types:', allCurriculumTypes);
```

**Add at line 923 (in catch block):**

```typescript
console.error('🔍 [IB TOGGLE DEBUG] Fetch error details:', {
  error: fetchError instanceof Error ? fetchError.message : String(fetchError),
  stack: fetchError instanceof Error ? fetchError.stack : undefined,
  updatedPlans: updatedCurriculumPlans,
});
```

**Add at line 988 (in outer catch):**

```typescript
console.error('🔍 [IB TOGGLE DEBUG] Outer catch - Full error:', {
  error: error instanceof Error ? error.message : String(error),
  type: error instanceof Error ? error.constructor.name : typeof error,
  stack: error instanceof Error ? error.stack : undefined,
  requestData: data,
});
```

---

### Step 3: Fix Validation Order (CRITICAL)

**Action:** Move validation BEFORE database update

**File:** `app/api/versions/[id]/route.ts`

**Current Flow (WRONG):**

```typescript
// Lines 464-600: Update curriculum plans
// Lines 872-919: Validate FR requirement
```

**Required Flow (CORRECT):**

```typescript
// BEFORE updating: Validate FR requirement
// THEN: Update curriculum plans
```

**Implementation:**

**Step 3a: Extract Validation Logic**

Create a helper function at the top of the file (after imports):

```typescript
/**
 * Validates curriculum plans ensure FR is required
 * @param updatedPlans - Plans being updated
 * @param versionId - Version ID to fetch other plans
 * @returns Result with validation status
 */
async function validateCurriculumPlans(
  updatedPlans: any[],
  versionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get IDs of plans being updated
    const updatedIds = new Set(updatedPlans.map((p) => p.id));

    // Fetch other plans from database
    const otherPlans = await prisma.curriculum_plans.findMany({
      where: {
        versionId: versionId,
        NOT: { id: { in: Array.from(updatedIds) } },
      },
      select: {
        curriculumType: true,
      },
    });

    // Combine: updated plans + other plans
    const allPlans = [...updatedPlans, ...otherPlans];
    const allCurriculumTypes = allPlans.map((cp: any) => cp.curriculumType);

    // Validate FR is required
    if (!allCurriculumTypes.includes('FR')) {
      return { success: false, error: 'FR curriculum plan is required' };
    }

    // IB is optional - check for duplicates
    const ibCount = allCurriculumTypes.filter((t: string) => t === 'IB').length;
    if (ibCount > 1) {
      return { success: false, error: 'IB curriculum plan can only appear once' };
    }

    return { success: true };
  } catch (fetchError) {
    console.error('❌ Error validating curriculum plans:', fetchError);

    // Fallback: validate with updated plans only
    const updatedTypes = updatedPlans.map((cp: any) => cp.curriculumType);

    // If FR is in updated plans, assume it's OK
    if (updatedTypes.includes('FR')) {
      return { success: true };
    }

    // Try to fetch all plans as last resort
    try {
      const allPlansFallback = await prisma.curriculum_plans.findMany({
        where: { versionId: versionId },
        select: { curriculumType: true },
      });

      const allTypes = [...updatedTypes, ...allPlansFallback.map((p) => p.curriculumType)];
      if (!allTypes.includes('FR')) {
        return { success: false, error: 'FR curriculum plan is required' };
      }

      return { success: true };
    } catch (fallbackError) {
      console.error('❌ Fallback validation also failed:', fallbackError);
      // Last resort: if FR is in request, allow it
      if (updatedTypes.includes('FR')) {
        return { success: true };
      }
      return {
        success: false,
        error: 'Unable to validate curriculum plans. Please ensure FR plan exists.',
      };
    }
  }
}
```

**Step 3b: Call Validation BEFORE Update**

**Move validation to BEFORE line 464:**

```typescript
// Validate curriculum plans BEFORE updating
if (data.curriculumPlans && data.curriculumPlans.length > 0) {
  const validationResult = await validateCurriculumPlans(data.curriculumPlans, id);

  if (!validationResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: validationResult.error || 'Curriculum plan validation failed',
        code: 'VALIDATION_ERROR',
      },
      { status: 400 }
    );
  }
}

// NOW proceed with update (lines 464-600)
```

**Step 3c: Remove Duplicate Validation**

**Remove or simplify validation at lines 872-919** (since it's now done before update):

```typescript
// Validation already done before update, just combine plans for response
if (curriculumPlansUpdated && updatedCurriculumPlans.length > 0) {
  try {
    const updatedIds = new Set(updatedCurriculumPlans.map((p) => p.id));
    const otherPlans = await prisma.curriculum_plans.findMany({
      where: {
        versionId: id,
        NOT: { id: { in: Array.from(updatedIds) } },
      },
      // ... select fields
    });
    curriculumPlans = [...updatedCurriculumPlans, ...otherPlans];
  } catch (fetchError) {
    console.error('❌ Error fetching other plans for response:', fetchError);
    // Use updated plans only as fallback
    curriculumPlans = updatedCurriculumPlans;
  }
}
```

---

### Step 4: Enhance Error Messages

**Action:** Ensure all error paths return specific messages

**File:** `app/api/versions/[id]/route.ts`

**Update lines 562-579:**

```typescript
catch (error) {
  console.error('❌ Error updating curriculum plan:', planUpdate.id, error);
  console.error('Update data:', JSON.stringify(updateData, null, 2));
  console.error('Plan update:', JSON.stringify(planUpdate, null, 2));

  // Provide more specific error messages
  let errorMessage = 'Unknown error';
  let errorCode = 'UPDATE_ERROR';

  if (error instanceof Error) {
    errorMessage = error.message;

    // Check for common Prisma errors
    if (error.message.includes('Record to update not found')) {
      errorMessage = `Curriculum plan with ID ${planUpdate.id} not found`;
      errorCode = 'NOT_FOUND';
    } else if (error.message.includes('Unique constraint')) {
      errorMessage = 'A curriculum plan with this configuration already exists';
      errorCode = 'DUPLICATE_ERROR';
    } else if (error.message.includes('Foreign key constraint')) {
      errorMessage = 'Cannot update curriculum plan due to related records';
      errorCode = 'CONSTRAINT_ERROR';
    } else if (error.message.includes('studentsProjection')) {
      errorMessage = `Invalid studentsProjection format: ${error.message}`;
      errorCode = 'VALIDATION_ERROR';
    }
  }

  return {
    success: false,
    planId: planUpdate.id,
    error: errorMessage,
    code: errorCode,
  };
}
```

---

### Step 5: Test with Logging

**Action:** Reproduce the error and check logs

**Steps:**

1. Open browser console (F12)
2. Open Network tab
3. Toggle IB checkbox
4. Check console for `[IB TOGGLE DEBUG]` messages
5. Check Network tab for request/response
6. Check server logs for detailed error

**What to Look For:**

- Which step fails? (Update, Validation, Response building)
- What's the actual error message?
- Is validation running before or after update?
- Is FR plan found in database?

---

### Step 6: Fix Based on Logs

**Action:** Apply specific fix based on error found

**Common Issues and Fixes:**

#### Issue A: Validation Fails After Update

**Symptom:** Logs show "FR curriculum plan is required" after update succeeds
**Fix:** Already addressed in Step 3 (move validation before update)

#### Issue B: Database Fetch Fails

**Symptom:** Logs show "Error fetching curriculum plans for validation"
**Fix:**

- Check database connection
- Verify version ID is correct
- Check Prisma query syntax
- Add retry logic if needed

#### Issue C: Prisma Update Fails

**Symptom:** Logs show Prisma error in update block
**Fix:**

- Check if plan ID exists
- Verify update data format
- Check database constraints
- Verify foreign key relationships

#### Issue D: Generic Error Message

**Symptom:** Error message is "An unexpected error occurred"
**Fix:**

- Check error handler return value
- Verify error handler is imported correctly
- Add fallback error message extraction

---

## 🧪 Testing Checklist

### Test 1: Toggle IB ON (Enable)

- [ ] Checkbox becomes checked
- [ ] IB capacity updates to 200
- [ ] No errors in console
- [ ] No errors in server logs
- [ ] Version data refreshes correctly

### Test 2: Toggle IB OFF (Disable)

- [ ] Checkbox becomes unchecked
- [ ] IB capacity updates to 0
- [ ] Students projection set to all zeros
- [ ] No errors in console
- [ ] No errors in server logs
- [ ] Version data refreshes correctly

### Test 3: Error Handling

- [ ] Remove FR plan (for testing)
- [ ] Attempt to toggle IB
- [ ] Specific error message appears
- [ ] Error message is NOT generic
- [ ] Error code is VALIDATION_ERROR

### Test 4: Network Error

- [ ] Disconnect network
- [ ] Attempt to toggle IB
- [ ] Network error message appears
- [ ] Error is user-friendly

---

## 🔒 Safety Considerations

### Transaction Safety

**Current Issue:** Updates happen before validation
**Risk:** Data inconsistency if validation fails
**Mitigation:** Move validation before update (Step 3)

### Rollback Strategy

**If validation fails after update:**

- Current: No rollback (data inconsistency)
- Recommended: Use Prisma transaction with rollback

**Implementation:**

```typescript
await prisma.$transaction(async (tx) => {
  // Validate first
  const validation = await validateCurriculumPlans(data.curriculumPlans, id);
  if (!validation.success) {
    throw new Error(validation.error);
  }

  // Then update
  const updated = await tx.curriculum_plans.update({...});

  return updated;
});
```

---

## 📊 Expected Log Output

### Successful Toggle (Enable IB)

```
🔍 [IB TOGGLE DEBUG] Starting curriculum plan update
🔍 [IB TOGGLE DEBUG] Request data: [{"id":"...","capacity":200,"studentsProjection":[...]}]
🔍 [IB TOGGLE DEBUG] Starting validation
🔍 [IB TOGGLE DEBUG] Updated plans: [{"id":"...","curriculumType":"IB"}]
🔍 [IB TOGGLE DEBUG] Fetching other plans, updated IDs: ["ib-plan-id"]
🔍 [IB TOGGLE DEBUG] All plans combined: [{"curriculumType":"IB"},{"curriculumType":"FR"}]
🔍 [IB TOGGLE DEBUG] All curriculum types: ["IB","FR"]
🔍 [IB TOGGLE DEBUG] Updating plan: ib-plan-id
🔍 [IB TOGGLE DEBUG] Update data: {"capacity":200,"studentsProjection":[...]}
✅ PATCH /api/versions/[id] completed in XXms
```

### Failed Toggle (Missing FR)

```
🔍 [IB TOGGLE DEBUG] Starting curriculum plan update
🔍 [IB TOGGLE DEBUG] Starting validation
🔍 [IB TOGGLE DEBUG] Updated plans: [{"id":"...","curriculumType":"IB"}]
🔍 [IB TOGGLE DEBUG] Fetching other plans, updated IDs: ["ib-plan-id"]
🔍 [IB TOGGLE DEBUG] All plans combined: [{"curriculumType":"IB"}]
🔍 [IB TOGGLE DEBUG] All curriculum types: ["IB"]
❌ Validation failed: FR curriculum plan is required
```

---

## 🚨 Critical Fixes Required

### Priority 1: Move Validation Before Update ⚠️ **CRITICAL**

- **Impact:** Prevents data inconsistency
- **Effort:** Medium (30-60 minutes)
- **Risk if not fixed:** High (data corruption possible)

### Priority 2: Complete Fallback Validation ⚠️ **HIGH**

- **Impact:** Handles edge cases
- **Effort:** Low (15-30 minutes)
- **Risk if not fixed:** Medium (validation might fail incorrectly)

### Priority 3: Enhance Error Messages ⚠️ **MEDIUM**

- **Impact:** Better debugging
- **Effort:** Low (15 minutes)
- **Risk if not fixed:** Low (harder to debug)

---

## 📝 Implementation Order

1. **Add logging** (Step 2) - 15 minutes
2. **Reproduce error** (Step 5) - 5 minutes
3. **Analyze logs** - 10 minutes
4. **Move validation before update** (Step 3) - 45 minutes
5. **Enhance error messages** (Step 4) - 15 minutes
6. **Test all scenarios** (Step 6) - 30 minutes

**Total Estimated Time:** 2 hours

---

## ✅ Success Criteria

### Functional

- ✅ IB checkbox toggles without errors
- ✅ Validation happens before update
- ✅ Specific error messages if something fails
- ✅ Data remains consistent

### Non-Functional

- ✅ Error messages are user-friendly
- ✅ Logging provides debugging information
- ✅ No performance degradation
- ✅ Backward compatible

---

## 📞 Next Steps

1. **Follow this guide step-by-step**
2. **Add logging first** to identify exact failure point
3. **Fix validation order** (most critical)
4. **Test thoroughly** before marking as complete
5. **Update fix report** with actual solution

---

**Status:** 🔍 **READY FOR DEBUGGING**  
**Priority:** 🔴 **CRITICAL**  
**Estimated Fix Time:** 2 hours

**Follow this guide exactly and the issue will be resolved.** 🚀
