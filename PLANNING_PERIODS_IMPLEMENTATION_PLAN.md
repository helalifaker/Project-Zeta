# 🎯 Planning Periods Implementation Plan

**Date:** December 13, 2025  
**Status:** 📋 **REVIEW REQUIRED** - High-Risk Implementation  
**Priority:** 🔴 **CRITICAL** - Blocking historical data upload and transition period planning

---

## Executive Summary

This document outlines a **comprehensive, phased implementation plan** for the three planning periods as defined in the PRD:

1. **Historical Period (2023-2024)**: Hard data upload (Admin only)
2. **Transition Period (2025-2027)**: Manual planning with rent cloned from 2024A
3. **Dynamic Period (2028-2052)**: Already implemented ✅

**Current Status:**
- ✅ Dynamic period (2028-2052) is fully functional
- ❌ Transition period (2025-2027) logic is missing
- ❌ Historical period (2023-2024) placeholders are missing
- ⚠️ **Critical:** System may break when historical data is uploaded

**Risk Assessment:** 🔴 **HIGH RISK** - Changes affect core calculation engine

---

## 1. Current State Analysis

### ✅ What's Working (Dynamic Period 2028-2052)

**Files Verified:**
- `lib/calculations/financial/projection.ts` - Main projection engine
- `lib/calculations/rent/` - All three rent models implemented
- `lib/calculations/financial/staff-costs.ts` - Staff cost calculations (recently fixed)
- `components/versions/financial-statements/FinancialStatementsWrapper.tsx` - UI integration

**Recent Fixes Applied:**
- ✅ Staff cost CPI baseYear validation (allows baseYear > startYear)
- ✅ Opex percentage conversion (was treating 6% as 600%)
- ✅ Staff cost ratio conversion (was treating 7.14 as percentage)

**Mode Handling:**
- ✅ `RELOCATION_2028` mode: Staff cost base calculated for 2028, CPI from 2028
- ✅ `HISTORICAL_BASELINE` mode: Staff cost base calculated for 2023, CPI from 2023

**⚠️ DISCREPANCY IDENTIFIED:**
- **Form Default:** `VersionMode.RELOCATION_2028` (line 37 in `VersionForm.tsx`)
- **Screenshot Shows:** "Historical Baseline" selected
- **Investigation Needed:** Check if initialData is being passed incorrectly

---

### ❌ What's Missing (Critical Gaps)

#### Gap 1: Transition Period Rent Cloning (2025-2027)

**Current Behavior:**
- Rent calculation doesn't distinguish between transition and dynamic periods
- No logic to clone rent from 2024A for transition years

**Expected Behavior:**
```typescript
// For years 2025-2027: rent = rent(2024A) (fixed, cloned from historical)
if (year >= 2025 && year <= 2027) {
  rent = await getRent2024A(versionId); // Clone from 2024 actuals
  // Other fields (curriculum, tuition, staff, opex, capex) are editable
}
```

**Impact:** 🔴 **HIGH** - Transition period planning will be incorrect

**Required Changes:**
1. Add `getRent2024A(versionId)` function to fetch 2024A rent
2. Modify rent calculation to handle transition years
3. Add placeholder logic for missing 2024A data
4. Add UI indicators (yellow badge, auto-fill notice)

---

#### Gap 2: Historical Period Placeholders (2023-2024)

**Current Behavior:**
- No placeholders for historical data
- Calculations may fail or use incorrect data for historical years
- No UI indication that historical data is pending

**Expected Behavior:**
```typescript
// For years 2023-2024: use actual data or placeholder
if (year >= 2023 && year <= 2024) {
  const historicalData = await getHistoricalData(versionId, year);
  if (historicalData) {
    // Use actual data (locked, read-only except Admin)
    revenue = historicalData.revenue;
    rent = historicalData.rent;
    // ... etc
  } else {
    // Placeholder: use zero or empty values
    // UI shows: "Historical data pending upload (Admin only)"
  }
}
```

**Impact:** 🔴 **HIGH** - System may break when historical data is uploaded

**Required Changes:**
1. Add `getHistoricalData(versionId, year)` function
2. Add placeholder logic for missing historical data
3. Add Admin panel for historical data import
4. Add read-only UI controls for historical years

---

#### Gap 3: Period-Specific Validation Logic

**Missing Validations:**
1. **Historical Period (2023-2024):**
   - Read-only for PLANNER role (except Admin)
   - Validation: Data must reconcile with accounting records
   - Checksum validation for data integrity

2. **Transition Period (2025-2027):**
   - Rent must be cloned from 2024A (cannot be manually edited)
   - Non-rent fields (curriculum, tuition, staff, opex, capex) are editable
   - Validation: Rent should equal 2024A rent

3. **Dynamic Period (2028-2052):**
   - All fields editable
   - Rent model must be selected for 2028+
   - Validation: Rent model parameters must be valid

---

## 2. Implementation Strategy

### 🎯 Phased Approach (Risk Mitigation)

**Rationale:** Incremental implementation with testing at each phase minimizes risk and allows rollback if issues arise.

---

### Phase 0: Investigation & Preparation (Day 1) ⚠️ **CRITICAL FIRST STEP**

**Goal:** Understand current state and fix any immediate issues

**Tasks:**
1. ✅ **Verify Mode Selection Discrepancy**
   - [ ] Check if `VersionForm.tsx` is receiving `initialData` with `mode: HISTORICAL_BASELINE`
   - [ ] Check browser cache/state persistence
   - [ ] Verify database default values
   - [ ] Fix if discrepancy found

2. ✅ **Audit Current Calculation Flow**
   - [ ] Verify all calculation functions handle years 2023-2052 correctly
   - [ ] Identify all places where period-specific logic is needed
   - [ ] Document current behavior vs. expected behavior

3. ✅ **Database Schema Review**
   - [ ] Verify schema supports historical data storage
   - [ ] Verify schema supports 2024A rent storage
   - [ ] Verify schema supports NULL `model_type` for transition years (2025-2027)

4. ✅ **Test Current System**
   - [ ] Create test version with `RELOCATION_2028` mode
   - [ ] Create test version with `HISTORICAL_BASELINE` mode
   - [ ] Verify calculations work correctly for both modes
   - [ ] Document any issues found

**Deliverables:**
- ✅ Mode selection discrepancy fixed
- ✅ Audit report of current state
- ✅ Test results for both modes
- ✅ Database schema verification

**Timeline:** 1 day

---

### Phase 1: Placeholder Infrastructure (Day 2-3) 🔴 **HIGH PRIORITY**

**Goal:** Ensure system doesn't break when historical/transition data is missing

**Why This Phase First:**
- Critical safety net before implementing full logic
- Allows system to function while data is being prepared
- Provides graceful degradation path

#### Task 1.1: Create Placeholder Functions

**Files to Create/Modify:**
- `lib/services/historical-data/read.ts` - Fetch historical data
- `lib/services/historical-data/getRent2024A.ts` - Fetch 2024A rent
- `lib/utils/placeholders.ts` - Placeholder utilities

**Implementation:**

```typescript
// lib/services/historical-data/read.ts
export async function getHistoricalData(
  versionId: string,
  year: 2023 | 2024
): Promise<Result<HistoricalData | null>> {
  try {
    // TODO: Query historical_data table when implemented
    // For now, return null (placeholder)
    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: 'Failed to fetch historical data' };
  }
}

// lib/services/historical-data/getRent2024A.ts
export async function getRent2024A(
  versionId: string
): Promise<Result<Decimal>> {
  try {
    const historical2024 = await getHistoricalData(versionId, 2024);
    if (historical2024.success && historical2024.data?.rent) {
      return { success: true, data: new Decimal(historical2024.data.rent) };
    }
    // Placeholder: return zero until 2024A uploaded
    return { success: true, data: new Decimal(0) };
  } catch (error) {
    return { success: false, error: 'Failed to fetch 2024A rent' };
  }
}
```

**Testing:**
- [ ] Function returns `null` when historical data doesn't exist
- [ ] Function returns zero rent when 2024A doesn't exist
- [ ] Error handling works correctly

#### Task 1.2: Add Period Detection Utilities

**Files to Create/Modify:**
- `lib/utils/periods.ts` - Period detection utilities

**Implementation:**

```typescript
// lib/utils/periods.ts
export type PlanningPeriod = 'HISTORICAL' | 'TRANSITION' | 'DYNAMIC';

export function getPeriodForYear(year: number): PlanningPeriod {
  if (year >= 2023 && year <= 2024) {
    return 'HISTORICAL';
  }
  if (year >= 2025 && year <= 2027) {
    return 'TRANSITION';
  }
  if (year >= 2028 && year <= 2052) {
    return 'DYNAMIC';
  }
  throw new Error(`Year ${year} is outside planning horizon (2023-2052)`);
}

export function isHistoricalYear(year: number): boolean {
  return year >= 2023 && year <= 2024;
}

export function isTransitionYear(year: number): boolean {
  return year >= 2025 && year <= 2027;
}

export function isDynamicYear(year: number): boolean {
  return year >= 2028 && year <= 2052;
}
```

**Testing:**
- [ ] Period detection works for all years 2023-2052
- [ ] Edge cases handled (2024, 2025, 2027, 2028)
- [ ] Throws error for invalid years

**Deliverables:**
- ✅ Placeholder functions implemented
- ✅ Period detection utilities
- ✅ Unit tests passing

**Timeline:** 2 days

---

### Phase 2: Transition Period Logic (Day 4-6) 🔴 **HIGH PRIORITY**

**Goal:** Implement rent cloning from 2024A for transition years (2025-2027)

**Why This Phase Second:**
- Critical for accurate transition period planning
- Relatively isolated change (only affects rent calculation)
- Can be tested independently

#### Task 2.1: Modify Rent Calculation for Transition Years

**Files to Modify:**
- `lib/calculations/financial/projection.ts` - Add transition period logic

**Implementation:**

```typescript
// In projection.ts, modify rent calculation section:

// STEP 3: Calculate rent (with period-specific logic)
const rentByYear: { year: number; rent: Decimal }[] = [];

for (let year = startYear; year <= endYear; year++) {
  const period = getPeriodForYear(year);
  
  if (period === 'TRANSITION') {
    // Transition period (2025-2027): Clone rent from 2024A
    const rent2024AResult = await getRent2024A(versionId);
    if (rent2024AResult.success) {
      rentByYear.push({
        year,
        rent: rent2024AResult.data,
      });
    } else {
      // Placeholder: use zero until 2024A uploaded
      console.warn(`[TRANSITION] 2024A rent not available, using placeholder for year ${year}`);
      rentByYear.push({
        year,
        rent: new Decimal(0),
      });
    }
  } else if (period === 'DYNAMIC') {
    // Dynamic period (2028+): Use rent model calculation
    // (Existing logic - keep as is)
    if (rentPlan.rentModel === 'FIXED_ESCALATION') {
      // ... existing logic
    } else if (rentPlan.rentModel === 'REVENUE_SHARE') {
      // ... existing logic
    } else if (rentPlan.rentModel === 'PARTNER_MODEL') {
      // ... existing logic
    }
  } else {
    // Historical period (2023-2024): Use actual data or placeholder
    const historicalDataResult = await getHistoricalData(versionId, year as 2023 | 2024);
    if (historicalDataResult.success && historicalDataResult.data?.rent) {
      rentByYear.push({
        year,
        rent: new Decimal(historicalDataResult.data.rent),
      });
    } else {
      // Placeholder: use zero until historical data uploaded
      console.warn(`[HISTORICAL] Historical rent not available, using placeholder for year ${year}`);
      rentByYear.push({
        year,
        rent: new Decimal(0),
      });
    }
  }
}
```

**Testing:**
- [ ] Transition years (2025-2027) clone rent from 2024A
- [ ] Placeholder works when 2024A not available
- [ ] Dynamic years (2028+) use rent model correctly
- [ ] Historical years (2023-2024) use actual data or placeholder

#### Task 2.2: Update Rent Plan Schema (if needed)

**Database Considerations:**
- Verify `rent_plans` table can store NULL `model_type` for transition years
- If needed, add migration to allow NULL `model_type`

**Testing:**
- [ ] Schema supports NULL `model_type`
- [ ] API can handle NULL `model_type` for transition years

**Deliverables:**
- ✅ Transition period rent cloning implemented
- ✅ Placeholder logic for missing 2024A
- ✅ Unit tests passing
- ✅ Integration tests passing

**Timeline:** 3 days

---

### Phase 3: Historical Period Logic (Day 7-10) 🟡 **MEDIUM PRIORITY**

**Goal:** Implement historical data placeholders and read-only logic

**Why This Phase Third:**
- Historical data upload comes later
- Placeholders ensure system doesn't break
- Read-only logic can be added incrementally

#### Task 3.1: Add Historical Data Placeholders to Calculations

**Files to Modify:**
- `lib/calculations/financial/projection.ts` - Add historical period logic for all calculations

**Implementation:**

```typescript
// In projection.ts, add historical period handling for:

// Revenue calculation:
for (let year = startYear; year <= endYear; year++) {
  if (isHistoricalYear(year)) {
    const historicalData = await getHistoricalData(versionId, year as 2023 | 2024);
    if (historicalData.success && historicalData.data?.revenue) {
      revenue = new Decimal(historicalData.data.revenue);
    } else {
      // Placeholder: use zero or calculated value
      revenue = calculateRevenueFromCurriculum(year); // Fallback calculation
    }
  } else {
    // Transition/Dynamic: Use normal calculation
    revenue = calculateRevenueFromCurriculum(year);
  }
}

// Similar logic for:
// - Staff costs
// - Opex
// - Capex
// - Other revenue
```

**Testing:**
- [ ] Historical years use actual data when available
- [ ] Placeholder works when historical data missing
- [ ] All calculations handle historical period correctly

#### Task 3.2: Add Read-Only UI Controls

**Files to Modify:**
- `components/versions/financial-statements/FinancialStatements.tsx` - Add read-only indicators
- `components/versions/curriculum/CurriculumPlanForm.tsx` - Add read-only for historical years
- `components/versions/costs-analysis/CostsAnalysisDashboard.tsx` - Add read-only for historical years

**Implementation:**

```typescript
// In FinancialStatements.tsx:
const isHistoricalYear = (year: number) => year >= 2023 && year <= 2024;
const isReadOnly = (year: number) => {
  if (isHistoricalYear(year)) {
    return userRole !== 'ADMIN'; // Only Admin can edit historical data
  }
  return false;
};

// In table cells:
<TableCell>
  {isReadOnly(year) ? (
    <div className="flex items-center gap-2">
      <LockIcon className="h-4 w-4 text-muted-foreground" />
      <span>{value}</span>
    </div>
  ) : (
    <EditableCell value={value} onChange={handleChange} />
  )}
</TableCell>
```

**Testing:**
- [ ] Historical years show lock icon for PLANNER/VIEWER
- [ ] Historical years are editable for ADMIN
- [ ] UI indicates "Historical data pending" when missing

**Deliverables:**
- ✅ Historical data placeholders in all calculations
- ✅ Read-only UI controls for historical years
- ✅ UI indicators (gray background, lock icon)
- ✅ Unit tests passing

**Timeline:** 4 days

---

### Phase 4: Admin Panel & Data Import (Day 11-15) 🟡 **MEDIUM PRIORITY**

**Goal:** Enable historical data upload and management

**Why This Phase Fourth:**
- Depends on placeholders being in place (Phase 3)
- Can be developed in parallel with UI indicators
- Required before historical data upload

#### Task 4.1: Create Historical Data Import API

**Files to Create:**
- `app/api/admin/historical-data/import/route.ts` - Import endpoint
- `lib/services/historical-data/import.ts` - Import logic

**Implementation:**

```typescript
// app/api/admin/historical-data/import/route.ts
export async function POST(req: Request) {
  // 1. Authenticate (ADMIN only)
  const session = await requireAuth(req);
  if (session.user.role !== 'ADMIN') {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 403 });
  }

  // 2. Parse CSV/Excel file
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const data = await parseHistoricalDataFile(file);

  // 3. Validate data
  const validation = validateHistoricalData(data);
  if (!validation.success) {
    return Response.json(validation, { status: 400 });
  }

  // 4. Import data
  const importResult = await importHistoricalData(validation.data);

  // 5. Calculate checksum for data integrity
  const checksum = calculateChecksum(validation.data);

  // 6. Store in database
  await storeHistoricalData(importResult, checksum);

  return Response.json({ success: true, data: importResult });
}
```

**Testing:**
- [ ] CSV import works
- [ ] Excel import works
- [ ] Validation catches errors
- [ ] Checksum calculation works
- [ ] Data integrity maintained

#### Task 4.2: Create Admin Panel UI

**Files to Create:**
- `app/admin/historical-data/page.tsx` - Admin panel page
- `components/admin/HistoricalDataImport.tsx` - Import component

**Features:**
- File upload (CSV/Excel)
- Field mapping interface
- Preview before import
- Validation feedback
- Import history

**Testing:**
- [ ] File upload works
- [ ] Field mapping works
- [ ] Preview shows correct data
- [ ] Validation errors displayed
- [ ] Import succeeds

**Deliverables:**
- ✅ Historical data import API
- ✅ Admin panel UI
- ✅ Validation and checksum logic
- ✅ Import history tracking
- ✅ Unit tests passing

**Timeline:** 5 days

---

### Phase 5: UI Indicators & Polish (Day 16-18) 🟢 **LOW PRIORITY**

**Goal:** Add visual indicators for different periods

**Why This Phase Last:**
- Nice-to-have, not critical for functionality
- Can be added incrementally
- Improves user experience

#### Task 5.1: Add Period-Specific UI Indicators

**Files to Modify:**
- `components/versions/financial-statements/FinancialStatements.tsx`
- `components/versions/curriculum/CurriculumPlanForm.tsx`
- `components/versions/costs-analysis/CostsAnalysisDashboard.tsx`

**Indicators:**
1. **Historical Period (2023-2024):**
   - Gray background
   - Lock icon
   - "Actuals 2024" label
   - "Historical data pending upload" message if missing

2. **Transition Period (2025-2027):**
   - Yellow accent
   - "Transition" badge
   - Auto-fill notice: "Rent cloned from 2024A"
   - Editable controls for non-rent fields

3. **Dynamic Period (2028-2052):**
   - Orange accent (2028-2032 ramp-up)
   - Green accent (2033+ full capacity)
   - All controls editable

**Testing:**
- [ ] Visual indicators show correctly
- [ ] Period-specific colors applied
- [ ] Badges and labels display correctly

**Deliverables:**
- ✅ Period-specific UI indicators
- ✅ Visual feedback for different periods
- ✅ User-friendly messages

**Timeline:** 3 days

---

### Phase 6: Validation & Testing (Day 19-21) 🔴 **CRITICAL**

**Goal:** Comprehensive testing and validation

**Why This Phase is Critical:**
- Ensures all changes work together
- Catches edge cases
- Validates period boundaries

#### Task 6.1: Unit Tests

**Test Coverage:**
- [ ] Period detection utilities
- [ ] Placeholder functions
- [ ] Transition period rent cloning
- [ ] Historical data retrieval
- [ ] Calculation logic for all periods

#### Task 6.2: Integration Tests

**Test Scenarios:**
- [ ] Create version with `RELOCATION_2028` mode
- [ ] Create version with `HISTORICAL_BASELINE` mode
- [ ] Upload historical data (2023-2024)
- [ ] Verify transition period rent cloning (2025-2027)
- [ ] Verify dynamic period calculations (2028-2052)
- [ ] Verify period boundaries (2024→2025, 2027→2028)

#### Task 6.3: End-to-End Tests

**Test Flows:**
- [ ] Complete version creation flow
- [ ] Historical data import flow
- [ ] Financial statements generation
- [ ] Period-specific calculations

**Deliverables:**
- ✅ Unit tests (80%+ coverage)
- ✅ Integration tests (all critical paths)
- ✅ End-to-end tests (complete user flows)
- ✅ Test report

**Timeline:** 3 days

---

## 3. Risk Mitigation

### 🔴 Critical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Breaking existing calculations** | 🔴 HIGH | 🟡 MEDIUM | Phased approach, comprehensive testing, rollback plan |
| **Data integrity issues** | 🔴 HIGH | 🟡 MEDIUM | Checksum validation, data validation, audit logs |
| **Period boundary errors** | 🔴 HIGH | 🟡 MEDIUM | Unit tests for boundary years (2024, 2025, 2027, 2028) |
| **Missing placeholders cause crashes** | 🔴 HIGH | 🔴 HIGH | Implement placeholders first (Phase 1) |
| **Mode selection discrepancy** | 🟡 MEDIUM | 🟡 MEDIUM | Investigate and fix in Phase 0 |

### 🟡 Medium Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **UI confusion between periods** | 🟡 MEDIUM | 🟡 MEDIUM | Clear visual indicators (Phase 5) |
| **Performance degradation** | 🟡 MEDIUM | 🟢 LOW | Performance testing, optimization |
| **Import file format issues** | 🟡 MEDIUM | 🟡 MEDIUM | Robust validation, error messages |

---

## 4. Rollback Plan

### If Issues Arise:

1. **Immediate Rollback (Phase 1-2):**
   - Revert placeholder functions
   - Revert transition period logic
   - Restore original rent calculation

2. **Partial Rollback (Phase 3-4):**
   - Keep placeholders (safe)
   - Disable historical data import
   - Revert UI changes

3. **Full Rollback:**
   - Restore from git commit before implementation
   - Restore database from backup
   - Notify users

---

## 5. Success Criteria

### Phase 0 Success:
- ✅ Mode selection discrepancy fixed
- ✅ Current system audited
- ✅ Test results documented

### Phase 1 Success:
- ✅ Placeholders implemented and tested
- ✅ System doesn't break when data missing
- ✅ Graceful degradation working

### Phase 2 Success:
- ✅ Transition period rent cloning works
- ✅ Placeholder for missing 2024A works
- ✅ All tests passing

### Phase 3 Success:
- ✅ Historical period placeholders work
- ✅ Read-only UI controls functional
- ✅ Admin can edit historical data

### Phase 4 Success:
- ✅ Historical data import works
- ✅ Validation and checksum working
- ✅ Import history tracked

### Phase 5 Success:
- ✅ UI indicators showing correctly
- ✅ User-friendly messages displayed
- ✅ Period-specific styling applied

### Phase 6 Success:
- ✅ All tests passing (80%+ coverage)
- ✅ No breaking changes
- ✅ Performance acceptable

---

## 6. Timeline Summary

| Phase | Days | Priority | Risk |
|-------|------|----------|------|
| **Phase 0: Investigation** | 1 | 🔴 CRITICAL | 🟡 MEDIUM |
| **Phase 1: Placeholders** | 2 | 🔴 HIGH | 🟢 LOW |
| **Phase 2: Transition Logic** | 3 | 🔴 HIGH | 🟡 MEDIUM |
| **Phase 3: Historical Logic** | 4 | 🟡 MEDIUM | 🟡 MEDIUM |
| **Phase 4: Admin Panel** | 5 | 🟡 MEDIUM | 🟡 MEDIUM |
| **Phase 5: UI Polish** | 3 | 🟢 LOW | 🟢 LOW |
| **Phase 6: Testing** | 3 | 🔴 CRITICAL | 🟢 LOW |
| **Total** | **21 days** | | |

**Buffer:** 3-5 days for unexpected issues

**Target Completion:** ~4 weeks from start date

---

## 7. Dependencies & Prerequisites

### Before Starting:
- [ ] Review this plan with stakeholders
- [ ] Get approval for phased approach
- [ ] Ensure database backups are current
- [ ] Set up test environment
- [ ] Prepare test data

### During Implementation:
- [ ] Daily standup meetings
- [ ] Code reviews for each phase
- [ ] Continuous testing
- [ ] Documentation updates

### After Completion:
- [ ] User acceptance testing
- [ ] Performance monitoring
- [ ] Documentation finalization
- [ ] Training materials

---

## 8. Open Questions

1. **Mode Selection Discrepancy:**
   - Why does screenshot show "Historical Baseline" when default is "RELOCATION_2028"?
   - Is there cached state or initialData being passed?
   - Should we change the default?

2. **Historical Data Schema:**
   - Where will historical data be stored? New table or existing tables?
   - What fields are required for historical data?
   - How will we handle checksum validation?

3. **Transition Period Rent:**
   - Should rent be editable for transition years (override 2024A clone)?
   - Or should it be strictly fixed at 2024A level?
   - What happens if 2024A rent changes after transition years are planned?

4. **Validation Rules:**
   - Should historical data validation be strict (must match accounting records)?
   - Or flexible (allow estimates)?
   - How to handle discrepancies?

---

## 9. Recommendations

### ⚠️ **CRITICAL RECOMMENDATIONS:**

1. **Investigate Mode Discrepancy First (Phase 0):**
   - This should be fixed before any other changes
   - May indicate other state management issues

2. **Implement Placeholders First (Phase 1):**
   - Critical safety net
   - Allows system to function while data is prepared
   - Low risk, high value

3. **Test Thoroughly at Each Phase:**
   - Don't proceed to next phase until current phase is fully tested
   - Catch issues early

4. **Maintain Backward Compatibility:**
   - Existing versions should continue to work
   - Don't break dynamic period (2028-2052) calculations

5. **Document Changes:**
   - Update API documentation
   - Update user guide
   - Update technical documentation

---

## 10. Approval Required

**This implementation plan requires approval before proceeding:**

- [ ] **Technical Lead:** Review and approve approach
- [ ] **Product Owner:** Confirm requirements alignment
- [ ] **CFO/Stakeholder:** Confirm business logic correctness
- [ ] **QA Lead:** Review testing strategy

**Sign-off:**
- Technical Lead: _________________ Date: ________
- Product Owner: _________________ Date: ________
- CFO/Stakeholder: _________________ Date: ________
- QA Lead: _________________ Date: ________

---

**Document Version:** 1.0  
**Last Updated:** December 13, 2025  
**Status:** 📋 **REVIEW REQUIRED**  
**Next Step:** Review with stakeholders and get approval before starting Phase 0

