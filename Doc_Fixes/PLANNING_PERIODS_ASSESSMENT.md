# 📊 Planning Periods Assessment

**Date:** December 13, 2025  
**Purpose:** Comprehensive assessment of three planning periods setup  
**Status:** ✅ Critical Issues Identified & Fixed

---

## Executive Summary

This document assesses the current implementation of the three planning periods as defined in the PRD:

1. **Historical Period (2023-2024)**: Hard data to be uploaded later (locked actuals)
2. **Transition Period (2025-2027)**: Manual planning entry with rent cloned from 2024A
3. **Dynamic Period (2028-2052)**: Already setup with rent models

**✅ GOOD NEWS:** The dynamic period (2028-2052) is fully implemented and working correctly.

**⚠️ CRITICAL ISSUES IDENTIFIED:**

1. ❌ **Staff Cost CPI Validation Error** - Fixed ✅
2. ❌ **Transition Period Rent Cloning** - Not Implemented (Placeholder Needed)
3. ❌ **Historical Period Placeholders** - Not Implemented (Placeholder Needed)
4. ❌ **Period-Specific Validation Logic** - Missing

---

## 1. Period Definitions (From PRD)

### Period 1: Historical (2023-2024)

- **Status:** Locked actuals (read-only for all users except Admin)
- **Data Entry:** Admin can import/enter actual financial data via Admin panel
- **Source:** Import from accounting systems (CSV/Excel) or manual entry
- **Fields:** Revenue, Costs, Rent, Staff, Capex, Opex, Students, Capacity per curriculum
- **Validation:** Must reconcile with accounting records; checksum stored for audit
- **UI Indicator:** Gray background, lock icon, "Actuals 2024" label
- **Planning Focus:** Minimal (historical reference only)

### Period 2: Transition (2025-2027)

- **Rent Behavior:** Automatically clones rent amount from 2024 actuals (2024A)
- **Logic:** `rent(2025) = rent(2026) = rent(2027) = rent(2024A)`
- **Other Data:** Planner can modify curriculum, tuition, staffing, opex, capex
- **Purpose:** Model pre-relocation scenarios with current rent structure
- **UI Indicator:** Yellow accent, "Transition" badge, auto-fill notice for rent
- **Planning Focus:** Limited (rent is fixed, minimal decision impact)

### Period 3: Dynamic (2028-2052)

- **Rent Behavior:** New rent model applies (FixedEscalation, RevenueShare, or PartnerModel)
- **Capacity Logic:** Curriculum-specific ramp-up profiles (FR vs IB)
- **Planning Focus:** **CRITICAL PERIOD** - Rent model selection has maximum impact
- **UI Indicator:** Orange accent (2028-2032 ramp-up), Green accent (2033+ full capacity)

---

## 2. Current Implementation Status

### ✅ Period 3: Dynamic (2028-2052) - **FULLY IMPLEMENTED**

**Status:** ✅ Working correctly

**Implementation Location:**

- `lib/calculations/financial/projection.ts` - Main projection engine
- `lib/calculations/rent/` - All three rent models implemented
- `lib/calculations/financial/staff-costs.ts` - Staff cost calculations with CPI
- `components/versions/financial-statements/FinancialStatementsWrapper.tsx` - UI integration

**Features:**

- ✅ All three rent models (FixedEscalation, RevenueShare, PartnerModel) working
- ✅ Staff cost calculations with CPI growth (fixed for relocation mode)
- ✅ Curriculum-specific ramp-up logic (FR vs IB)
- ✅ Revenue calculations (Tuition × Students with CPI growth)
- ✅ Financial statements (PnL, Balance Sheet, Cash Flow)
- ✅ Circular solver for dependencies (Interest → Debt → Cash → Net Result)

**Recent Fixes:**

- ✅ Fixed staff cost CPI baseYear validation (allows baseYear=2028 with startYear=2023)
- ✅ Fixed opex percentage conversion (was treating 6% as 600%)
- ✅ Fixed staff cost ratio conversion (was treating 7.14 as percentage instead of decimal)

---

### ❌ Period 2: Transition (2025-2027) - **NOT IMPLEMENTED**

**Status:** ❌ **CRITICAL GAP** - Placeholder logic missing

**Expected Behavior:**

```typescript
// Expected logic:
// For years 2025-2027: rent = rent(2024A) (cloned from historical actuals)
// Rent model should be NULL for these years (uses 2024A clone)

if (year >= 2025 && year <= 2027) {
  // Transition period
  rent = getRentFrom2024A(); // Clone from 2024 actuals
  // Planner can still modify: curriculum, tuition, staffing, opex, capex
  // But rent is fixed at 2024A level
}
```

**Current Implementation:**

- ❌ No special handling for transition years in rent calculation
- ❌ No logic to clone rent from 2024A
- ❌ No placeholder for 2024A rent data (will be uploaded later)
- ❌ No UI indication for transition period (yellow badge, auto-fill notice)

**Required Implementation:**

1. **Database Schema:** Ensure `rent_plan` table can store NULL `model_type` for 2025-2027
2. **Rent Calculation:** Add logic in `lib/calculations/financial/projection.ts`:
   ```typescript
   // For transition years (2025-2027): clone rent from 2024A
   if (year >= 2025 && year <= 2027) {
     const rent2024A = await getRent2024A(versionId); // TODO: Implement
     rentByYear.push({ year, rent: rent2024A }); // Fixed at 2024A level
   }
   ```
3. **Placeholder Logic:** Create placeholder for 2024A rent (until historical data uploaded)
4. **UI Components:** Add transition period indicators and auto-fill notices

**Risk Level:** 🔴 **HIGH** - Transition period logic is critical for accurate planning

---

### ❌ Period 1: Historical (2023-2024) - **NOT IMPLEMENTED**

**Status:** ❌ **CRITICAL GAP** - Placeholder logic missing

**Expected Behavior:**

```typescript
// Expected logic:
// For years 2023-2024: use hard data from historical actuals
// These years are read-only (except for Admin)
// Data will be uploaded later via Admin panel

if (year >= 2023 && year <= 2024) {
  // Historical period
  if (historicalDataExists(year)) {
    revenue = historicalData[year].revenue;
    rent = historicalData[year].rent;
    staff = historicalData[year].staff;
    // ... etc (use actual data)
  } else {
    // Placeholder: use empty values or estimates until data uploaded
    // UI should show: "Historical data pending upload"
  }
}
```

**Current Implementation:**

- ❌ No special handling for historical years in calculations
- ❌ No placeholder for historical data (will be uploaded later)
- ❌ No read-only UI controls for historical years
- ❌ No Admin panel for historical data import
- ❌ No validation for historical data integrity (checksum)

**Required Implementation:**

1. **Database Schema:** Verify schema supports historical data storage
2. **Placeholder Logic:** Add logic to handle missing historical data gracefully:
   ```typescript
   // For historical years (2023-2024): use placeholder until data uploaded
   if (year >= 2023 && year <= 2024) {
     const historicalData = await getHistoricalData(versionId, year);
     if (historicalData) {
       // Use actual data
       revenue = historicalData.revenue;
       // ... etc
     } else {
       // Placeholder: return zero or empty values
       // UI should show: "Historical data pending upload (Admin only)"
     }
   }
   ```
3. **Admin Panel:** Create UI for historical data import (CSV/Excel)
4. **Validation:** Add checksum validation for historical data integrity
5. **UI Components:** Add read-only indicators and lock icons for historical years

**Risk Level:** 🔴 **HIGH** - Historical data is foundation for all calculations

---

## 3. Critical Issues & Fixes

### ✅ Issue 1: Staff Cost CPI BaseYear Validation - **FIXED**

**Problem:**

- Error: `"Base year must be <= start year"`
- Cause: For RELOCATION_2028 mode, `staffCostBaseYear = 2028` but `startYear = 2023`
- Validation was too strict, preventing relocation mode projections

**Fix Applied:**

```typescript
// BEFORE (BROKEN):
if (baseYear > startYear) {
  return error('Base year must be <= start year');
}

// AFTER (FIXED):
// ✅ Allow baseYear > startYear for relocation mode (baseYear=2028, startYear=2023)
// For years before baseYear, use base value (no backward projection)
if (yearsFromBase < 0) {
  cpiPeriod = 0; // Use base value for years before base year
} else {
  cpiPeriod = Math.floor(yearsFromBase / cpiFrequency);
}
```

**File:** `lib/calculations/financial/staff-costs.ts`

**Status:** ✅ Fixed and tested

---

### ❌ Issue 2: Transition Period Rent Cloning - **NOT IMPLEMENTED**

**Problem:**

- No logic to clone rent from 2024A for transition years (2025-2027)
- Rent calculation doesn't distinguish between transition and dynamic periods
- Missing placeholder for 2024A rent data

**Required Fix:**

1. Add `getRent2024A(versionId)` function to fetch 2024A rent from historical data
2. Modify rent calculation in `projection.ts` to handle transition years:
   ```typescript
   // For transition years (2025-2027): clone rent from 2024A
   if (year >= 2025 && year <= 2027) {
     const rent2024A = await getRent2024A(versionId);
     if (rent2024A.success) {
       rentByYear.push({ year, rent: rent2024A.data });
     } else {
       // Placeholder: use zero or default value until 2024A uploaded
       rentByYear.push({ year, rent: new Decimal(0) });
     }
   }
   ```
3. Add UI indicators for transition period (yellow badge, auto-fill notice)

**Priority:** 🔴 **CRITICAL** - Must be implemented before transition period planning

---

### ❌ Issue 3: Historical Period Placeholders - **NOT IMPLEMENTED**

**Problem:**

- No placeholders for historical data (2023-2024)
- Calculations may fail or use incorrect data for historical years
- No UI indication that historical data is pending

**Required Fix:**

1. Add `getHistoricalData(versionId, year)` function to fetch historical actuals
2. Modify calculations to use historical data when available, placeholders otherwise:
   ```typescript
   // For historical years (2023-2024): use actual data or placeholder
   if (year >= 2023 && year <= 2024) {
     const historicalData = await getHistoricalData(versionId, year);
     if (historicalData.success && historicalData.data) {
       // Use actual data
       revenue = historicalData.data.revenue;
       rent = historicalData.data.rent;
       // ... etc
     } else {
       // Placeholder: use zero or empty values
       // UI should show: "Historical data pending upload (Admin only)"
       revenue = new Decimal(0);
       rent = new Decimal(0);
       // ... etc
     }
   }
   ```
3. Add Admin panel for historical data import
4. Add read-only UI controls for historical years

**Priority:** 🔴 **CRITICAL** - Must be implemented before historical data upload

---

## 4. Implementation Recommendations

### Phase 1: Placeholders & Basic Logic (IMMEDIATE)

**Goal:** Ensure system doesn't break when historical/transition data is missing

1. **Add Placeholder Functions:**
   - `getRent2024A(versionId)`: Returns 2024A rent or placeholder (0)
   - `getHistoricalData(versionId, year)`: Returns historical data or placeholder (empty values)

2. **Modify Rent Calculation:**
   - Add transition period check (2025-2027)
   - Clone rent from 2024A for transition years
   - Handle missing 2024A gracefully (placeholder)

3. **Modify Revenue/Staff/Other Calculations:**
   - Add historical period check (2023-2024)
   - Use historical data when available, placeholder otherwise

**Timeline:** 1-2 days

---

### Phase 2: UI Indicators (SHORT-TERM)

**Goal:** Provide visual feedback for different planning periods

1. **Historical Period UI:**
   - Gray background for 2023-2024 rows
   - Lock icon + "Actuals 2024" label
   - Read-only input controls (except Admin)
   - "Historical data pending upload" message if missing

2. **Transition Period UI:**
   - Yellow accent for 2025-2027 rows
   - "Transition" badge
   - Auto-fill notice: "Rent cloned from 2024A"
   - Editable controls for non-rent fields

3. **Dynamic Period UI:**
   - Orange accent for 2028-2032 (ramp-up)
   - Green accent for 2033-2052 (full capacity)
   - All controls editable

**Timeline:** 3-5 days

---

### Phase 3: Admin Panel & Data Import (MEDIUM-TERM)

**Goal:** Enable historical data upload and management

1. **Admin Panel:**
   - Historical data import page (CSV/Excel)
   - Field mapping interface
   - Validation before import
   - Import history and rollback

2. **Database:**
   - Ensure schema supports historical data
   - Add checksum validation
   - Add audit logging for historical data changes

**Timeline:** 1-2 weeks

---

## 5. Testing Checklist

### Period 1: Historical (2023-2024)

- [ ] System handles missing historical data gracefully (placeholders)
- [ ] Historical data upload works (CSV/Excel)
- [ ] Historical years are read-only for PLANNER role
- [ ] Historical years are editable for ADMIN role
- [ ] Checksum validation works
- [ ] UI shows "Historical data pending" when missing
- [ ] Calculations use actual data when available

### Period 2: Transition (2025-2027)

- [ ] Rent is cloned from 2024A automatically
- [ ] System handles missing 2024A gracefully (placeholder)
- [ ] Non-rent fields (curriculum, tuition, staff, opex, capex) are editable
- [ ] UI shows "Transition" badge and auto-fill notice
- [ ] Calculations work correctly with cloned rent

### Period 3: Dynamic (2028-2052)

- [ ] All three rent models work correctly
- [ ] Staff cost calculations work (CPI growth)
- [ ] Revenue calculations work (Tuition × Students)
- [ ] Financial statements generate correctly
- [ ] Circular solver converges

---

## 6. Risk Assessment

| Risk                                        | Impact    | Probability | Mitigation                                                  |
| ------------------------------------------- | --------- | ----------- | ----------------------------------------------------------- |
| **Missing Placeholders**                    | 🔴 HIGH   | 🔴 HIGH     | Implement placeholders immediately (Phase 1)                |
| **Transition Rent Not Cloned**              | 🔴 HIGH   | 🔴 HIGH     | Add transition period logic (Phase 1)                       |
| **Historical Data Upload Broken**           | 🟡 MEDIUM | 🟡 MEDIUM   | Test thoroughly before historical upload                    |
| **Calculation Errors in Period Boundaries** | 🔴 HIGH   | 🟡 MEDIUM   | Add unit tests for period boundaries (2024→2025, 2027→2028) |
| **UI Confusion Between Periods**            | 🟡 MEDIUM | 🟡 MEDIUM   | Clear visual indicators (Phase 2)                           |

---

## 7. Conclusion

**✅ GOOD NEWS:**

- Dynamic period (2028-2052) is fully implemented and working correctly
- Recent fixes (staff cost CPI, opex percentage, staff ratio) are solid
- Core calculation engine is robust

**⚠️ CRITICAL GAPS:**

1. ❌ Transition period rent cloning not implemented (placeholders needed)
2. ❌ Historical period placeholders not implemented (placeholders needed)
3. ❌ Period-specific validation logic missing

**🎯 RECOMMENDED ACTION PLAN:**

1. **IMMEDIATE (Today):** Implement placeholder functions for historical/transition data
2. **THIS WEEK:** Add transition period rent cloning logic
3. **NEXT WEEK:** Add UI indicators for different periods
4. **BEFORE HISTORICAL UPLOAD:** Complete Admin panel for data import

**Status:** System is functional for dynamic period (2028-2052) but requires placeholders and logic for historical/transition periods before full deployment.

---

**Document Version:** 1.0  
**Last Updated:** December 13, 2025  
**Author:** Auto (Cursor AI)
