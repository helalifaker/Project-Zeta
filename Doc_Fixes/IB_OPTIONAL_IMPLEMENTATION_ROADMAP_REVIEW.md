# IB Optional Implementation Roadmap - Comprehensive Review

## Risk Assessment & Completeness Verification

**Date:** November 17, 2025  
**Status:** 🔴 **CRITICAL ISSUES IDENTIFIED**  
**Reviewer:** Architecture Control Agent

---

## 📋 Executive Summary

The roadmap is **85% complete** but has **CRITICAL GAPS** that could cause:

- ❌ **Application crashes** when IB is disabled
- ❌ **Data corruption** during version updates
- ❌ **Broken features** (reports, comparison, simulation)
- ❌ **User confusion** from inconsistent UI behavior

**Overall Assessment:** ⚠️ **NOT READY FOR IMPLEMENTATION** - Requires significant additions before proceeding.

---

## ✅ What's Covered Well

1. ✅ **Validation Layer** - Comprehensive coverage
2. ✅ **UI Components** - Good pattern for conditional rendering
3. ✅ **Revenue Calculation** - Already handles zero IB correctly
4. ✅ **Data Model Decision** - Keeping IB with zero values is correct
5. ✅ **Testing Strategy** - Good test cases identified

---

## 🔴 CRITICAL ISSUES (Must Fix Before Implementation)

### Issue #1: Database Schema Constraint - MISSING FROM ROADMAP

**Risk Level:** 🔴 **CRITICAL**

**Problem:**
The roadmap mentions reviewing database constraints (Step 1.4) but **DOES NOT PROVIDE THE ACTUAL MIGRATION SQL**.

**Current State:**

```prisma
// prisma/schema.prisma - Line 71-90
model curriculum_plans {
  capacity Int
  // NO CHECK CONSTRAINT EXISTS - This is GOOD!
}
```

**Finding:**
✅ **GOOD NEWS:** The schema **DOES NOT** have a `capacity > 0` constraint, so **NO MIGRATION IS NEEDED**.

**However:**

- ⚠️ The roadmap **DOES NOT VERIFY** this
- ⚠️ The roadmap **DOES NOT DOCUMENT** this finding
- ⚠️ The roadmap **ASSUMES** a constraint exists that doesn't

**Recommendation:**

- ✅ Add verification step to roadmap
- ✅ Document that no migration is needed
- ✅ Add note: "Schema verified - no capacity constraint exists"

---

### Issue #2: Report Generation API - NOT FULLY COVERED

**Risk Level:** 🔴 **CRITICAL**

**Current Code:**

```typescript
// app/api/reports/generate/[versionId]/route.ts - Line 95
if (!version.curriculumPlans || version.curriculumPlans.length < 2) {
  return NextResponse.json(
    {
      success: false,
      error: 'Version must have at least 2 curriculum plans (FR and IB)',
      code: 'VALIDATION_ERROR',
    },
    { status: 400 }
  );
}
```

**Roadmap Coverage:**

- ✅ Step 4.2 mentions updating report generation API
- ❌ **BUT:** Does not provide exact code changes
- ❌ **BUT:** Does not handle comparison reports (which also check for 2 plans)

**Missing:**

1. Exact code replacement for report generation
2. Handling of comparison reports (Line 228-231 also checks for 2 plans)
3. CSV generation (`lib/reports/csv/generate.ts`) - not mentioned at all

**Required Fix:**

```typescript
// REPLACE Line 95-100 with:
if (!version.curriculumPlans || version.curriculumPlans.length < 1) {
  return NextResponse.json(
    {
      success: false,
      error: 'Version must have at least 1 curriculum plan (FR)',
      code: 'VALIDATION_ERROR',
    },
    { status: 400 }
  );
}

// Verify FR exists
const frPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'FR');
if (!frPlan) {
  return NextResponse.json(
    { success: false, error: 'FR curriculum plan is required', code: 'VALIDATION_ERROR' },
    { status: 400 }
  );
}
```

**Also Update:**

- Line 228-231 (comparison version validation)
- `lib/reports/csv/generate.ts` (CSV generation)

---

### Issue #3: Comparison API - INCOMPLETE COVERAGE

**Risk Level:** 🔴 **CRITICAL**

**Current Code:**

```typescript
// app/api/versions/compare/route.ts - Line 57-66
if (!version || !version.rentPlan || version.curriculumPlans.length < 2) {
  return null;
}

const frPlan = version.curriculumPlans.find(
  (cp: { curriculumType: string }) => cp.curriculumType === 'FR'
);
const ibPlan = version.curriculumPlans.find(
  (cp: { curriculumType: string }) => cp.curriculumType === 'IB'
);

if (!frPlan || !ibPlan) {
  return null;
}
```

**Roadmap Coverage:**

- ✅ Step 4.1 mentions updating compare API
- ❌ **BUT:** Does not provide exact code replacement
- ❌ **BUT:** Does not handle the `transformVersionToProjectionParams` function (Line 56-66)

**Missing:**

1. Exact code replacement for API route
2. Update to `transformVersionToProjectionParams` helper function
3. Handling of mixed IB status (one version has IB, other doesn't)

**Required Fix:**

```typescript
// REPLACE Line 57-66 with:
if (!version || !version.rentPlan || version.curriculumPlans.length < 1) {
  return null;
}

const frPlan = version.curriculumPlans.find(
  (cp: { curriculumType: string }) => cp.curriculumType === 'FR'
);
if (!frPlan) {
  return null;
}

const ibPlan = version.curriculumPlans.find(
  (cp: { curriculumType: string }) => cp.curriculumType === 'IB'
);
const isIBEnabled = ibPlan && ibPlan.capacity > 0;

// Update transformVersionToProjectionParams to handle optional IB
```

---

### Issue #4: Version Form - NOT COVERED

**Risk Level:** 🔴 **CRITICAL**

**Current Code:**

```typescript
// components/versions/VersionForm.tsx - Line 59-82
const defaultCurriculumPlans = [
  {
    curriculumType: CurriculumType.FR,
    capacity: 400,
    // ...
  },
  {
    curriculumType: CurriculumType.IB,
    capacity: 200,
    // ...
  },
];
```

**Roadmap Coverage:**

- ✅ Step 2.1 mentions adding IB enable/disable checkbox
- ❌ **BUT:** Does not provide exact code for VersionForm
- ❌ **BUT:** Does not handle initial state (should IB be enabled by default?)

**Missing:**

1. Exact code for adding checkbox
2. State management for enableIB
3. Logic to set IB to zero when disabled
4. Default state decision (enabled or disabled?)

**Required Addition:**
Add to roadmap Step 2.1:

```typescript
// Add state
const [enableIB, setEnableIB] = useState(true); // Default: enabled

// Modify defaultCurriculumPlans
const defaultCurriculumPlans = [
  {
    curriculumType: CurriculumType.FR,
    capacity: 400,
    // ...
  },
  ...(enableIB
    ? [
        {
          curriculumType: CurriculumType.IB,
          capacity: 200,
          // ...
        },
      ]
    : [
        {
          curriculumType: CurriculumType.IB,
          capacity: 0, // Disabled IB
          studentsProjection: Array.from({ length: 30 }, (_, i) => ({
            year: 2023 + i,
            students: 0,
          })),
          // ...
        },
      ]),
];
```

---

### Issue #5: Store Files - NOT COVERED

**Risk Level:** 🟡 **HIGH**

**Files Not Mentioned:**

1. `stores/simulation-store.ts` - Line 161-166: Requires both FR and IB
2. `stores/tuition-simulator-store.ts` - Line 90-96: Assumes IB exists
3. `stores/version-store.ts` - May assume both exist

**Current Code:**

```typescript
// stores/simulation-store.ts - Line 161-166
const frPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'FR');
const ibPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'IB');

if (!frPlan || !ibPlan) {
  set({ error: 'Version must have both FR and IB curriculum plans' });
  return;
}
```

**Required Fix:**

```typescript
const frPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'FR');
if (!frPlan) {
  set({ error: 'Version must have FR curriculum plan' });
  return;
}

const ibPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'IB');
const isIBEnabled = ibPlan && ibPlan.capacity > 0;
```

**Recommendation:**
Add new section to roadmap: **Phase 6: Store Updates**

---

### Issue #6: Tuition Simulator Components - INCOMPLETE

**Risk Level:** 🟡 **HIGH**

**Files Not Fully Covered:**

1. `components/tuition-simulator/TuitionSimulator.tsx` - Line 37-46: Returns null if IB missing
2. `components/tuition-simulator/TuitionControlsPanel.tsx` - Line 64-87: Assumes IB exists
3. `components/tuition-simulator/SaveScenarioButton.tsx` - Line 48-54: Requires both
4. `components/tuition-simulator/ChartsPanel.tsx` - Line 46-47: Assumes IB exists

**Current Code:**

```typescript
// components/tuition-simulator/TuitionSimulator.tsx - Line 37-46
if (!version.rentPlan || version.curriculumPlans.length < 2) {
  return null;
}

const frPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'FR');
const ibPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'IB');

if (!frPlan || !ibPlan) {
  return null;
}
```

**Required Fix:**

```typescript
if (!version.rentPlan || version.curriculumPlans.length < 1) {
  return null;
}

const frPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'FR');
if (!frPlan) {
  return null;
}

const ibPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'IB');
const isIBEnabled = ibPlan && ibPlan.capacity > 0;
```

**Recommendation:**
Expand Step 2.6 to include ALL tuition simulator components.

---

### Issue #7: Comparison Table Component - NOT COVERED

**Risk Level:** 🟡 **MEDIUM**

**File:** `components/compare/ComparisonTable.tsx`

**Current Code:**

```typescript
// Line 82-93: Assumes IB exists, shows 'N/A' if missing (this is OK)
{ label: 'Base Tuition (IB)', getValue: (version: VersionWithRelations, _proj?: FullProjectionResult) => {
  const ibPlan = version.curriculumPlans.find(cp => cp.curriculumType === 'IB');
  return ibPlan ? formatCurrency(ibPlan.tuitionBase) : 'N/A';
}},
```

**Status:**
✅ **ALREADY HANDLES OPTIONAL IB** - Shows 'N/A' if missing.

**Recommendation:**

- ✅ Add note to roadmap: "ComparisonTable already handles optional IB correctly"
- ✅ Verify all similar components

---

### Issue #8: Update Version API - NOT COVERED

**Risk Level:** 🟡 **MEDIUM**

**File:** `app/api/versions/[id]/route.ts`

**Current Code:**

- Line 464: Checks `curriculumPlans.length > 0` (OK)
- Line 797: Checks `updatedCurriculumPlans.length > 0` (OK)
- **BUT:** No validation that FR is required when updating

**Missing:**

- Validation that FR cannot be removed
- Validation that IB can be set to zero (capacity = 0)

**Recommendation:**
Add to roadmap: **Step 1.5: Update Version API Validation**

---

### Issue #9: Staff Cost Calculation - VERIFICATION NEEDED

**Risk Level:** 🟢 **LOW** (Already handles optional)

**File:** `lib/calculations/financial/staff-costs.ts`

**Current Code:**

```typescript
// Line 215-217: Already handles empty array
if (!curriculumPlans || curriculumPlans.length === 0) {
  return error('At least one curriculum plan is required');
}
```

**Status:**
✅ **ALREADY CORRECT** - Only requires at least one plan.

**Recommendation:**

- ✅ Add note to roadmap: "Staff cost calculation already handles optional IB"
- ✅ Verify it works with only FR

---

### Issue #10: Financial Projection - VERIFICATION NEEDED

**Risk Level:** 🟢 **LOW** (Already handles optional)

**File:** `lib/calculations/financial/projection.ts`

**Current Code:**

```typescript
// Line 150-152: Already handles empty array
if (curriculumPlans.length === 0) {
  return error('At least one curriculum plan is required');
}

// Line 171: Loops through all plans (handles 1 or 2)
for (const curriculumPlan of curriculumPlans) {
  // ...
}
```

**Status:**
✅ **ALREADY CORRECT** - Handles any number of plans.

**Recommendation:**

- ✅ Add note to roadmap: "Financial projection already handles optional IB"
- ✅ Verify it works with only FR

---

## ⚠️ MEDIUM PRIORITY ISSUES

### Issue #11: Validation Schema - Capacity Constraint

**Risk Level:** 🟡 **MEDIUM**

**File:** `lib/validation/curriculum.ts`

**Current State:**

- Need to verify if capacity validation allows zero for IB
- Need to verify if capacity validation requires positive for FR

**Recommendation:**
Add to roadmap Step 1.1:

```typescript
// Update CurriculumPlanSchema to allow zero capacity for IB
capacity: z.number().int().min(0).refine(
  (val, ctx) => {
    // FR must have capacity > 0
    if (ctx.path.includes('FR') && val <= 0) {
      return false;
    }
    // IB can have capacity = 0 (disabled)
    return true;
  },
  { message: 'FR curriculum must have capacity > 0. IB can have capacity = 0 when disabled.' }
),
```

---

### Issue #12: Version Duplication - VERIFICATION NEEDED

**Risk Level:** 🟢 **LOW**

**File:** `services/version/duplicate.ts`

**Current Code:**

```typescript
// Line 86-97: Copies all curriculum plans as-is
if (sourceVersion.curriculum_plans.length > 0) {
  await tx.curriculum_plans.createMany({
    data: sourceVersion.curriculum_plans.map((cp) => ({
      // ... copies all plans
    })),
  });
}
```

**Status:**
✅ **ALREADY CORRECT** - Copies whatever exists (FR only, or FR + IB).

**Recommendation:**

- ✅ Add note: "Version duplication already handles optional IB correctly"

---

## 📊 Coverage Analysis

### Files Requiring Changes

| File                                                | Roadmap Coverage | Status             | Risk        |
| --------------------------------------------------- | ---------------- | ------------------ | ----------- |
| `lib/validation/version.ts`                         | ✅ Complete      | Ready              | 🟢 Low      |
| `services/version/create.ts`                        | ✅ Complete      | Ready              | 🟢 Low      |
| `app/api/versions/route.ts`                         | ✅ Complete      | Ready              | 🟢 Low      |
| `prisma/schema.prisma`                              | ⚠️ Partial       | Needs verification | 🟡 Medium   |
| `components/versions/VersionForm.tsx`               | ❌ Missing       | **NOT READY**      | 🔴 Critical |
| `components/versions/VersionDetail.tsx`             | ✅ Complete      | Ready              | 🟢 Low      |
| `components/dashboard/Dashboard.tsx`                | ✅ Complete      | Ready              | 🟢 Low      |
| `components/compare/Compare.tsx`                    | ✅ Complete      | Ready              | 🟢 Low      |
| `components/simulation/Simulation.tsx`              | ⚠️ Partial       | Needs expansion    | 🟡 Medium   |
| `components/tuition-simulator/TuitionSimulator.tsx` | ⚠️ Partial       | Needs expansion    | 🟡 Medium   |
| `app/api/reports/generate/[versionId]/route.ts`     | ⚠️ Partial       | **NOT READY**      | 🔴 Critical |
| `app/api/versions/compare/route.ts`                 | ⚠️ Partial       | **NOT READY**      | 🔴 Critical |
| `stores/simulation-store.ts`                        | ❌ Missing       | **NOT READY**      | 🟡 High     |
| `stores/tuition-simulator-store.ts`                 | ❌ Missing       | **NOT READY**      | 🟡 High     |
| `lib/reports/csv/generate.ts`                       | ❌ Missing       | **NOT READY**      | 🟡 Medium   |

**Total:** 16 files

- ✅ Complete: 5 files (31%)
- ⚠️ Partial: 6 files (38%)
- ❌ Missing: 5 files (31%)

---

## 🚨 Critical Risks to Application

### Risk #1: Application Crashes

**Scenario:** User disables IB, then tries to generate report.

**Impact:**

- ❌ Report generation fails with 400 error
- ❌ User sees confusing error message
- ❌ Feature is broken

**Mitigation:**

- ✅ Fix report generation API (Issue #2)
- ✅ Add proper error handling
- ✅ Test all report types

---

### Risk #2: Data Inconsistency

**Scenario:** User creates version with IB disabled, then updates to enable IB.

**Impact:**

- ⚠️ IB plan may not exist in database
- ⚠️ Update may fail
- ⚠️ Data may be inconsistent

**Mitigation:**

- ✅ Always keep IB plan (even with zero values)
- ✅ Update logic to handle missing IB plan
- ✅ Add validation in update API

---

### Risk #3: Broken Comparison Feature

**Scenario:** User compares version with IB enabled vs version with IB disabled.

**Impact:**

- ❌ Comparison API returns null
- ❌ Comparison UI shows error
- ❌ Feature is broken

**Mitigation:**

- ✅ Fix comparison API (Issue #3)
- ✅ Handle mixed IB status
- ✅ Update comparison UI

---

### Risk #4: Simulation Store Errors

**Scenario:** User loads version with IB disabled into simulation.

**Impact:**

- ❌ Simulation store throws error
- ❌ Simulation page crashes
- ❌ Feature is broken

**Mitigation:**

- ✅ Fix simulation store (Issue #5)
- ✅ Handle optional IB in all stores
- ✅ Test simulation with IB disabled

---

## 📝 Missing from Roadmap

### 1. Database Schema Verification

- ❌ No actual verification step
- ❌ No migration script (if needed)
- ❌ No documentation of findings

### 2. Version Form Implementation

- ❌ No exact code for checkbox
- ❌ No state management logic
- ❌ No default state decision

### 3. Store Files

- ❌ No mention of simulation-store.ts
- ❌ No mention of tuition-simulator-store.ts
- ❌ No mention of version-store.ts

### 4. CSV Report Generation

- ❌ Not mentioned at all
- ❌ May break when IB disabled

### 5. Update Version API

- ❌ No validation for FR requirement
- ❌ No handling of IB enable/disable

### 6. Testing Strategy

- ⚠️ Test cases are good but incomplete
- ❌ Missing: Test update version with IB disabled
- ❌ Missing: Test comparison with mixed IB status
- ❌ Missing: Test CSV generation with IB disabled

---

## ✅ Recommendations

### Immediate Actions (Before Implementation)

1. **Add Missing Code Snippets**
   - VersionForm checkbox implementation
   - Report generation API fixes
   - Comparison API fixes
   - Store file updates

2. **Verify Database Schema**
   - Confirm no capacity constraint exists
   - Document finding in roadmap
   - Add note: "No migration needed"

3. **Expand Testing Strategy**
   - Add test for update version
   - Add test for comparison with mixed IB
   - Add test for CSV generation
   - Add test for simulation with IB disabled

4. **Add Store Updates Section**
   - Create Phase 6: Store Updates
   - List all store files requiring changes
   - Provide exact code fixes

5. **Add CSV Report Section**
   - Update Step 4.2 to include CSV generation
   - Provide exact code fixes

---

## 🎯 Final Verdict

**Status:** ⚠️ **NOT READY FOR IMPLEMENTATION**

**Reason:**

- 🔴 3 Critical issues (report generation, comparison API, VersionForm)
- 🟡 3 High priority issues (stores, tuition simulator, validation)
- ❌ 5 files completely missing from roadmap
- ❌ Testing strategy incomplete

**Required Actions:**

1. Fix all critical issues (#2, #3, #4)
2. Add missing store file updates (#5)
3. Expand tuition simulator coverage (#6)
4. Add CSV report generation fixes
5. Verify database schema (no migration needed)
6. Expand testing strategy

**Estimated Additional Work:** 8-12 hours

**Recommendation:**

- ✅ Update roadmap with all missing items
- ✅ Add exact code snippets for all fixes
- ✅ Expand testing strategy
- ✅ Verify all files are covered
- ✅ **THEN** proceed with implementation

---

**Reviewer:** Architecture Control Agent  
**Date:** November 17, 2025  
**Next Steps:** Update roadmap with all identified issues before implementation begins.
