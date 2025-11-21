# Rent Model Changes - Impact Analysis Report

**Date:** November 16, 2025  
**Requested By:** User  
**Status:** ⚠️ **REQUIRES CONFIRMATION BEFORE IMPLEMENTATION**

---

## 📋 Executive Summary

Two critical changes are requested for rent model calculations:

1. **Missing Component #1**: Escalation rate with frequency parameter
   - **Issue**: Frequency parameter exists in calculation logic but missing from UI forms and validation
   - **Impact**: 🟡 **MODERATE** - UI/Validation updates needed

2. **Missing Component #2**: Partner Model calculation logic change
   - **Issue**: Partner Model currently uses yield growth for all years, but should use escalation after year 1
   - **Impact**: 🔴 **CRITICAL** - Major business logic change affecting calculations, data, and existing versions

---

## 🔍 Issue #1: Escalation Rate with Frequency

### Current State

**Calculation Logic:** ✅ **EXISTS**

- `FixedEscalationParams` includes `frequency?: number` (optional, default: 1)
- `calculateFixedEscalationRent()` supports frequency parameter
- Logic: `escalations = floor((year - startYear) / frequency)`
- Works correctly for values 1, 2, 3, 4, or 5

**Validation Schema:** ❌ **MISSING**

- `FixedEscalationParamsSchema` in `lib/validation/rent.ts` does NOT include `frequency`
- Only validates: `baseRent`, `escalationRate`, `startYear`

**UI Form:** ❌ **MISSING**

- `RentPlanForm.tsx` Fixed Escalation form does NOT show frequency input
- Only shows: Base Rent, Escalation Rate (%), Start Year

**Database:** ✅ **OK**

- Parameters stored as JSON, so frequency can be added without migration

### Required Changes

1. **Update Validation Schema** (`lib/validation/rent.ts`)

   ```typescript
   const FixedEscalationParamsSchema = z.object({
     baseRent: z.number().positive()...,
     escalationRate: z.number().min(0).max(1)...,
     startYear: z.number().int().min(2023).max(2052),
     frequency: z.number().int().min(1).max(5).optional(), // ADD THIS
   });
   ```

2. **Update UI Form** (`components/versions/costs-analysis/RentPlanForm.tsx`)
   - Add frequency input field (dropdown: 1, 2, 3, 4, 5 years)
   - Default to 1 if not provided

3. **Update Parameter Display** (`components/versions/costs-analysis/RentLens.tsx`)
   - Show frequency in parameters display if provided

### Impact Assessment

| Aspect                | Impact      | Notes                                |
| --------------------- | ----------- | ------------------------------------ |
| **Calculation Logic** | ✅ None     | Already supports frequency           |
| **Existing Data**     | ✅ None     | Frequency is optional, defaults to 1 |
| **UI Changes**        | 🟡 Moderate | Add 1 input field to form            |
| **Validation**        | 🟡 Moderate | Update Zod schema                    |
| **Tests**             | 🟡 Moderate | Update/add tests for frequency       |
| **Documentation**     | 🟢 Low      | Update PRD if needed                 |

**Risk Level:** 🟢 **LOW** - Additive change, backward compatible

---

## 🔍 Issue #2: Partner Model Calculation Logic Change

### Current State

**Current Implementation:**

```typescript
// Year 1: baseRent = (land + construction) × yieldBase ✅ CORRECT
// Year 2+: rent = baseRent × (1 + growthRate)^escalations ❌ WRONG
//          Where growthRate is optional yield growth
```

**Current Parameters:**

- `yieldBase`: Used for ALL years (multiplies base value)
- `growthRate`: Optional, grows yield over time
- `frequency`: Optional, applies growth every N years

**Current Formula:**

```typescript
// For all years:
baseRent = (land + construction) × yieldBase
// If growthRate > 0:
rent(year) = baseRent × (1 + growthRate)^escalations
```

### Requested Change

**New Implementation:**

```typescript
// Year 1: rent = (land + construction) × yieldBase ✅ (unchanged)
// Year 2+: rent = baseRent × (1 + escalationRate)^escalations ✅ (NEW)
//          Where escalationRate is REQUIRED, frequency applies escalation
```

**New Parameters Required:**

- `yieldBase`: Used ONLY for year 1 calculation
- `escalationRate`: REQUIRED for years 2+ (replaces `growthRate`)
- `frequency`: REQUIRED for escalation frequency (1, 2, 3, 4, or 5 years)

**New Formula:**

```typescript
// Year 1:
baseRent = (land + construction) × yieldBase
rent(year1) = baseRent

// Year 2+:
escalations = floor((year - startYear) / frequency)
rent(year) = baseRent × (1 + escalationRate)^escalations
```

### Example Calculation

**Current (WRONG):**

```
Land: 10,000 m² @ 5K = 50M
BUA: 8,000 m² @ 3K = 24M
Total: 74M
Yield: 4.5%
Growth Rate: 0.5% (optional)
Frequency: 2 years

Year 2028: 74M × 0.045 = 3.33M ✅
Year 2029: 74M × 0.045 = 3.33M (no growth yet) ❌
Year 2030: 74M × 0.045 × 1.005 = 3.346M (yield grows) ❌
```

**Requested (CORRECT):**

```
Land: 10,000 m² @ 5K = 50M
BUA: 8,000 m² @ 3K = 24M
Total: 74M
Yield: 4.5% (year 1 only)
Escalation Rate: 4% (years 2+)
Frequency: 2 years

Year 2028: 74M × 0.045 = 3.33M ✅
Year 2029: 3.33M × (1.04)^0 = 3.33M (no escalation yet) ✅
Year 2030: 3.33M × (1.04)^1 = 3.463M (first escalation) ✅
Year 2031: 3.33M × (1.04)^1 = 3.463M (same as 2030) ✅
Year 2032: 3.33M × (1.04)^2 = 3.601M (second escalation) ✅
```

### Required Changes

#### 1. Update Partner Model Calculation Logic

**File:** `lib/calculations/rent/partner-model.ts`

**Current Code (Lines 168-182):**

```typescript
for (let year = startYear; year <= endYear; year++) {
  let rent = baseRent;

  // Apply escalation if growth rate > 0
  if (growth.greaterThan(0)) {
    const yearsFromStart = year - startYear;
    const escalations = Math.floor(yearsFromStart / freq);

    if (escalations > 0) {
      const growthFactor = new Decimal(1).plus(growth).pow(escalations);
      rent = baseRent.times(growthFactor);
    }
  }

  results.push({ year, landValue, constructionCost: constructionValue, totalValue, rent });
}
```

**New Code:**

```typescript
for (let year = startYear; year <= endYear; year++) {
  let rent = baseRent;

  // Year 1: Use base rent (calculated from yield)
  // Year 2+: Apply escalation rate with frequency
  const yearsFromStart = year - startYear;
  if (yearsFromStart > 0) {
    // Calculate escalations based on frequency
    const escalations = Math.floor(yearsFromStart / freq);

    // Apply escalation: rent = baseRent × (1 + escalationRate)^escalations
    if (escalations > 0) {
      const escalationFactor = Decimal.add(1, escalationRate).pow(escalations);
      rent = baseRent.times(escalationFactor);
    }
  }

  results.push({ year, landValue, constructionCost: constructionValue, totalValue, rent });
}
```

**Key Changes:**

- Remove `growthRate` parameter (or make it optional for backward compatibility)
- Add `escalationRate` as REQUIRED parameter
- Apply escalation starting from year 2 (not year 1)
- Use same escalation logic as Fixed Escalation model

#### 2. Update Partner Model Interface

**File:** `lib/calculations/rent/partner-model.ts`

**Current Interface:**

```typescript
export interface PartnerModelParams {
  landSize: Decimal | number | string;
  landPricePerSqm: Decimal | number | string;
  buaSize: Decimal | number | string;
  constructionCostPerSqm: Decimal | number | string;
  yieldBase: Decimal | number | string;
  growthRate?: Decimal | number | string; // ❌ REMOVE or deprecate
  frequency?: number; // ✅ KEEP but make required
  startYear: number;
  endYear: number;
}
```

**New Interface:**

```typescript
export interface PartnerModelParams {
  landSize: Decimal | number | string;
  landPricePerSqm: Decimal | number | string;
  buaSize: Decimal | number | string;
  constructionCostPerSqm: Decimal | number | string;
  yieldBase: Decimal | number | string; // Year 1 only
  escalationRate: Decimal | number | string; // ✅ NEW: Required for years 2+
  frequency: number; // ✅ REQUIRED (1, 2, 3, 4, or 5)
  startYear: number;
  endYear: number;
}
```

#### 3. Update Validation Schema

**File:** `lib/validation/rent.ts`

**Current Schema:**

```typescript
const PartnerModelParamsSchema = z.object({
  landSize: z.number().positive()...,
  landPricePerSqm: z.number().positive()...,
  buaSize: z.number().positive()...,
  constructionCostPerSqm: z.number().positive()...,
  yieldBase: z.number().min(0).max(1)...,
  // ❌ Missing: escalationRate, frequency
});
```

**New Schema:**

```typescript
const PartnerModelParamsSchema = z.object({
  landSize: z.number().positive()...,
  landPricePerSqm: z.number().positive()...,
  buaSize: z.number().positive()...,
  constructionCostPerSqm: z.number().positive()...,
  yieldBase: z.number().min(0).max(1)..., // Year 1 only
  escalationRate: z.number().min(0).max(1)..., // ✅ NEW: Required
  frequency: z.number().int().min(1).max(5), // ✅ NEW: Required
  startYear: z.number().int().min(2023).max(2052).optional(), // Optional
});
```

#### 4. Update UI Form

**File:** `components/versions/costs-analysis/RentPlanForm.tsx`

**Current Form (Partner Model):**

- Land Size
- Land Price per m²
- BUA Size
- Construction Cost per m²
- Yield Base (%)

**New Form (Partner Model):**

- Land Size
- Land Price per m²
- BUA Size
- Construction Cost per m²
- Yield Base (%) - **Label: "Yield Base (Year 1 Only)"**
- **Escalation Rate (%)** - ✅ NEW: Required field
- **Frequency** - ✅ NEW: Required dropdown (1, 2, 3, 4, 5 years)

#### 5. Update Parameter Display

**File:** `components/versions/costs-analysis/RentLens.tsx`

**Current Display:**

- Shows all parameters as JSON or formatted fields
- Missing escalation rate and frequency

**New Display:**

- Show yield base with note "(Year 1 only)"
- Show escalation rate with note "(Years 2+)"
- Show frequency

#### 6. Update `calculateRentForYear` Function

**File:** `lib/calculations/rent/index.ts` (Line 115-128)

**Current Code:**

```typescript
case 'PARTNER_MODEL': {
  const p = params as PartnerModelParams;
  const result = calculatePartnerModelBaseRent(...); // ❌ Always returns year 1 rent
  return { success: true, data: { rent: result.data.toNumber() } };
}
```

**New Code:**

```typescript
case 'PARTNER_MODEL': {
  const p = params as PartnerModelParams;
  // Calculate base rent (year 1)
  const baseResult = calculatePartnerModelBaseRent(...);
  if (!baseResult.success) return baseResult;

  // Apply escalation for years 2+
  const yearsFromStart = year - p.startYear;
  if (yearsFromStart > 0) {
    const escalations = Math.floor(yearsFromStart / (p.frequency ?? 1));
    if (escalations > 0) {
      const escalationFactor = Decimal.add(1, toDecimal(p.escalationRate)).pow(escalations);
      const escalatedRent = baseResult.data.times(escalationFactor);
      return { success: true, data: { rent: escalatedRent.toNumber() } };
    }
  }

  return { success: true, data: { rent: baseResult.data.toNumber() } };
}
```

### Impact Assessment

| Aspect                     | Impact          | Notes                                                   |
| -------------------------- | --------------- | ------------------------------------------------------- |
| **Calculation Logic**      | 🔴 **CRITICAL** | Complete rewrite of Partner Model calculation           |
| **Existing Data**          | 🔴 **CRITICAL** | All existing Partner Model versions need migration      |
| **Data Migration**         | 🔴 **REQUIRED** | Convert `growthRate` → `escalationRate` or set defaults |
| **UI Changes**             | 🟡 **MODERATE** | Add 2 new required fields, update labels                |
| **Validation**             | 🟡 **MODERATE** | Update schema, make fields required                     |
| **Tests**                  | 🔴 **CRITICAL** | All Partner Model tests need update                     |
| **API Compatibility**      | 🔴 **BREAKING** | Existing API calls will fail without new parameters     |
| **Documentation**          | 🟡 **MODERATE** | Update PRD, API docs, user guides                       |
| **Backward Compatibility** | 🔴 **NONE**     | Cannot support old format without migration             |

**Risk Level:** 🔴 **HIGH** - Breaking change, requires data migration

---

## 📊 Detailed Impact Analysis

### 1. Data Migration Requirements

**Existing Partner Model Versions:**

- All versions with `rentModel = 'PARTNER_MODEL'` need parameter updates
- Current parameters may have:
  - `yieldBase` ✅ (keep)
  - `growthRate` ❌ (remove or convert)
  - `frequency` ❓ (may or may not exist)

**Migration Strategy:**

```sql
-- Option 1: Convert growthRate to escalationRate
UPDATE rent_plans
SET parameters = jsonb_set(
  parameters,
  '{escalationRate}',
  to_jsonb((parameters->>'growthRate')::numeric),
  true
)
WHERE rent_model = 'PARTNER_MODEL'
  AND parameters ? 'growthRate'
  AND (parameters->>'growthRate')::numeric > 0;

-- Option 2: Set default escalation rate if missing
UPDATE rent_plans
SET parameters = jsonb_set(
  jsonb_set(
    parameters,
    '{escalationRate}',
    '0.04', -- Default 4%
    true
  ),
  '{frequency}',
  '2', -- Default every 2 years
  true
)
WHERE rent_model = 'PARTNER_MODEL'
  AND NOT (parameters ? 'escalationRate');

-- Remove growthRate if exists
UPDATE rent_plans
SET parameters = parameters - 'growthRate'
WHERE rent_model = 'PARTNER_MODEL'
  AND parameters ? 'growthRate';
```

**Migration Script Required:** ✅ **YES**

### 2. Calculation Accuracy Impact

**Before (Current - INCORRECT):**

- Year 1: Correct (yield-based)
- Year 2+: Uses yield growth (incorrect business logic)

**After (Requested - CORRECT):**

- Year 1: Correct (yield-based)
- Year 2+: Uses escalation rate (correct business logic)

**Financial Impact:**

- **NPV Calculations**: Will change significantly for Partner Model
- **Rent Load %**: Will change for years 2+
- **EBITDA Projections**: Will change for all years 2+
- **Cash Flow**: Will change for all years 2+
- **All existing reports**: Will show different numbers

**Example Impact:**

```
Current (30-year projection with 0.5% yield growth):
- Year 1: 3.33M
- Year 30: ~3.8M (gradual yield growth)

New (30-year projection with 4% escalation, 2-year frequency):
- Year 1: 3.33M
- Year 30: ~6.5M (compound escalation)

Difference: ~70% higher rent in year 30
```

### 3. Test Impact

**Files Requiring Updates:**

- `lib/calculations/rent/__tests__/partner-model.test.ts` - **ALL tests need rewrite**
- `lib/calculations/rent/__tests__/index.test.ts` - Update Partner Model tests
- Integration tests for rent calculations
- E2E tests for version creation/editing

**New Test Cases Needed:**

- Year 1 calculation (yield-based)
- Year 2+ calculation (escalation-based)
- Frequency parameter (1, 2, 3, 4, 5 years)
- Edge cases (frequency = 1, frequency = 5)
- Validation (missing escalationRate, missing frequency)

### 4. API Impact

**Breaking Changes:**

- `POST /api/versions` - Partner Model requires `escalationRate` and `frequency`
- `PATCH /api/versions/[id]` - Partner Model requires `escalationRate` and `frequency`
- All existing API calls with Partner Model will fail validation

**Backward Compatibility:**

- ❌ **NOT POSSIBLE** without migration
- Must migrate all existing Partner Model versions before deployment

### 5. UI/UX Impact

**Form Changes:**

- Add 2 new required fields to Partner Model form
- Update field labels and help text
- Add validation messages

**Display Changes:**

- Update parameter display to show escalation rate and frequency
- Add explanatory text about year 1 vs. years 2+

**User Education:**

- Users need to understand the change
- Existing versions will need to be updated
- May need user notification/announcement

---

## ✅ Confirmation Checklist

Before proceeding with implementation, please confirm:

### Issue #1: Escalation Rate with Frequency

- [ ] ✅ **CONFIRMED**: Add frequency parameter to Fixed Escalation UI form
- [ ] ✅ **CONFIRMED**: Update validation schema to include frequency
- [ ] ✅ **CONFIRMED**: Display frequency in parameter display

### Issue #2: Partner Model Calculation Logic

- [ ] ⚠️ **REQUIRES CONFIRMATION**: Partner Model should use escalation rate (not yield growth) for years 2+
- [ ] ⚠️ **REQUIRES CONFIRMATION**: Escalation rate is REQUIRED (not optional) for Partner Model
- [ ] ⚠️ **REQUIRES CONFIRMATION**: Frequency is REQUIRED (not optional) for Partner Model
- [ ] ⚠️ **REQUIRES CONFIRMATION**: Remove `growthRate` parameter (or deprecate)
- [ ] ⚠️ **REQUIRES CONFIRMATION**: Year 1 uses yield, Year 2+ uses escalation
- [ ] ⚠️ **REQUIRES CONFIRMATION**: Data migration strategy is acceptable

### Business Logic Confirmation

**Please confirm the following calculation logic:**

**Partner Model - Year 1:**

```
baseRent = (landSize × landPricePerSqm + buaSize × constructionCostPerSqm) × yieldBase
rent(year1) = baseRent
```

✅ **Is this correct?**

**Partner Model - Year 2+:**

```
escalations = floor((year - startYear) / frequency)
rent(year) = baseRent × (1 + escalationRate)^escalations
```

✅ **Is this correct?**

**Example:**

- Start Year: 2028
- Frequency: 2 years
- Escalation Rate: 4%

```
Year 2028: baseRent × (1.04)^0 = baseRent (no escalation)
Year 2029: baseRent × (1.04)^0 = baseRent (no escalation yet)
Year 2030: baseRent × (1.04)^1 = baseRent × 1.04 (first escalation)
Year 2031: baseRent × (1.04)^1 = baseRent × 1.04 (same as 2030)
Year 2032: baseRent × (1.04)^2 = baseRent × 1.0816 (second escalation)
```

✅ **Is this correct?**

---

## 🚨 Risk Assessment

### High-Risk Areas

1. **Data Migration**
   - **Risk**: Existing Partner Model versions may have invalid data
   - **Mitigation**: Create comprehensive migration script with rollback
   - **Testing**: Test migration on staging with production data copy

2. **Calculation Accuracy**
   - **Risk**: All financial projections will change
   - **Mitigation**:
     - Compare old vs. new calculations for sample versions
     - Document calculation changes
     - Notify users of changes

3. **API Breaking Changes**
   - **Risk**: Existing API integrations will break
   - **Mitigation**:
     - Version API if possible
     - Provide migration guide
     - Update API documentation

4. **User Confusion**
   - **Risk**: Users may not understand the change
   - **Mitigation**:
     - Add clear UI labels ("Year 1 Only" for yield)
     - Update user documentation
     - Provide migration guide

---

## 📝 Implementation Plan (After Confirmation)

### Phase 1: Issue #1 - Frequency Parameter (Low Risk)

1. Update validation schema
2. Update UI form
3. Update parameter display
4. Update tests
5. **Estimated Time:** 2-3 hours

### Phase 2: Issue #2 - Partner Model Logic (High Risk)

1. Update calculation logic
2. Update interface and types
3. Update validation schema
4. Create data migration script
5. Update UI form
6. Update parameter display
7. Update all tests
8. Test migration on staging
9. **Estimated Time:** 8-12 hours

### Phase 3: Testing & Validation

1. Unit tests for new logic
2. Integration tests
3. Migration testing
4. User acceptance testing
5. **Estimated Time:** 4-6 hours

**Total Estimated Time:** 14-21 hours

---

## ✅ Next Steps

1. **User Confirmation Required:**
   - [ ] Confirm Issue #1 understanding
   - [ ] Confirm Issue #2 understanding (especially calculation logic)
   - [ ] Confirm data migration strategy
   - [ ] Confirm breaking change is acceptable

2. **After Confirmation:**
   - [ ] Implement Issue #1 (Frequency parameter)
   - [ ] Implement Issue #2 (Partner Model logic change)
   - [ ] Create data migration script
   - [ ] Update all tests
   - [ ] Update documentation

---

## 📚 References

- **PRD Section 5.6**: Rent model specifications
- **Current Implementation**: `lib/calculations/rent/partner-model.ts`
- **Validation**: `lib/validation/rent.ts`
- **UI Form**: `components/versions/costs-analysis/RentPlanForm.tsx`

---

**Status:** ⚠️ **AWAITING CONFIRMATION**  
**Priority:** 🔴 **HIGH** (Issue #2 is critical business logic change)  
**Risk:** 🔴 **HIGH** (Breaking change, requires data migration)

---

**Please confirm your understanding and approval before I proceed with implementation.**
