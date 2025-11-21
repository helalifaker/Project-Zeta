# Costs Analysis Tab - Implementation Analysis

**Date:** November 16, 2025  
**Feature:** Tab 3 - Costs Analysis (Rent Lens + Cost Breakdown)  
**Status:** Pre-Implementation Analysis

---

## 📋 Executive Summary

The Costs Analysis tab is a **READ-ONLY visualization tab** that displays:

1. **Rent Lens** - Rent model details, NPV, and year-by-year projections
2. **Cost Breakdown** - Pie chart and table showing all cost categories (Rent, Staff, Opex, Capex)

**✅ GOOD NEWS:** This is a **PURE UI FEATURE** with:

- ✅ **NO new database tables needed**
- ✅ **NO new Prisma models needed**
- ✅ **NO new API endpoints needed**
- ✅ **NO new migrations needed**
- ✅ All calculation logic **ALREADY EXISTS**

---

## 🎯 Feature Requirements (from PRD Section 5.6)

### A. Rent Lens (Expandable Card)

**Collapsed State:**

- Summary card showing:
  - Selected rent model name
  - Annual rent range (Year 1 vs. Year 30)
  - NPV of rent (25-year period 2028-2052)
  - Rent Load % average

**Expanded State:**

- Rent model selector (FixedEscalation, RevenueShare, PartnerModel) - **READ-ONLY** (display only)
- Model-specific parameters display (read-only)
- "Edit Rent Model" button → redirects to `curriculum` tab using `setActiveTab('curriculum')`
- NPV calculation display (using Admin discount rate)
- Mini sensitivity chart: Rent impact on EBITDA across model options (optional - Phase 3)
- Year-by-year rent projection table (scrollable, consider virtualization for 30 rows)

### B. Cost Breakdown

- Pie chart: Rent, Staff, Opex, Capex
- Year-by-year table: All cost categories
- Cost per student metrics
- Year-over-year % changes

---

## ✅ Existing Infrastructure Analysis

### 1. Database Schema - ✅ COMPLETE

**All required data already exists in:**

```typescript
// Rent data
model rent_plans {
  id         String    @id @default(uuid())
  versionId  String    @unique
  rentModel  RentModel // FIXED_ESCALATION | REVENUE_SHARE | PARTNER_MODEL
  parameters Json      // Model-specific params
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}

// Curriculum data (for staff costs)
model curriculum_plans {
  id                      String         @id @default(uuid())
  versionId               String
  curriculumType          CurriculumType // FR | IB
  capacity                Int
  tuitionBase             Decimal
  cpiFrequency            Int
  teacherRatio            Decimal?
  nonTeacherRatio         Decimal?
  teacherMonthlySalary    Decimal?
  nonTeacherMonthlySalary Decimal?
  studentsProjection      Json
}

// Opex data
model opex_sub_accounts {
  id               String   @id @default(uuid())
  versionId        String
  subAccountName   String
  percentOfRevenue Decimal?
  isFixed          Boolean
  fixedAmount      Decimal?
}

// Capex data
model capex_items {
  id          String        @id @default(uuid())
  versionId   String
  ruleId      String?       // null = manual, non-null = auto-generated
  year        Int
  category    CapexCategory
  amount      Decimal
  description String?
}

model capex_rules {
  id            String        @id @default(uuid())
  versionId     String
  category      CapexCategory
  cycleYears    Int
  baseCost      Decimal
  startingYear  Int
  inflationIndex String?
}
```

**✅ Verdict:** All data models exist and have proper `@default(uuid())` and `@updatedAt` attributes.

---

### 2. API Endpoints - ✅ COMPLETE

**Existing endpoint provides ALL data:**

```typescript
GET / api / versions / [id];
```

**Response includes:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Version Name",
    "curriculumPlans": [...],  // ✅ Has staff cost data
    "rentPlan": {...},         // ✅ Has rent model + params
    "opexSubAccounts": [...],  // ✅ Has opex data
    "capexItems": [...],       // ✅ Has capex data
    "capexRules": [...]        // ✅ Has capex rules
  }
}
```

**✅ Verdict:** No new API endpoints needed. All data fetched via existing GET endpoint.

---

### 3. Calculation Modules - ✅ COMPLETE

**All required calculations already exist:**

#### Rent Calculations ✅

```typescript
// lib/calculations/rent/index.ts
export function calculateRent(params: RentCalculationParams): Result<RentCalculationResult>;
export function calculateRentForYear(
  model: RentModel,
  params: unknown,
  year: number
): Result<{ rent: number }>;
export function calculateTotalRent(params: RentCalculationParams): Result<number>;

// Specific models
export function calculateFixedEscalationRent(
  params: FixedEscalationParams
): Result<FixedEscalationResult[]>;
export function calculateRevenueShareRent(params: RevenueShareParams): Result<RevenueShareResult[]>;
export function calculatePartnerModelRent(params: PartnerModelParams): Result<PartnerModelResult[]>;
```

#### Staff Cost Calculations ✅

```typescript
// lib/calculations/financial/staff-costs.ts
export function calculateStaffCosts(params: StaffCostParams): Result<StaffCostResult[]>;
export function calculateStaffCostForYear(params: StaffCostParams, year: number): Result<Decimal>;
```

#### Opex Calculations ✅

```typescript
// lib/calculations/financial/opex.ts
export function calculateOpex(params: OpexParams): Result<OpexResult[]>;
export function calculateOpexForYear(params: OpexParams, year: number): Result<Decimal>;
```

#### Capex Calculations ✅

```typescript
// lib/calculations/capex/auto-reinvestment.ts
export function calculateCapexFromRules(
  rules: CapexRule[],
  cpiRate: Decimal | number | string,
  startYear: number = 2023,
  endYear: number = 2052
): Result<CapexItem[]>;

// Usage example:
const capexResult = calculateCapexFromRules(version.capexRules, adminSettings.cpiRate, 2023, 2052);
if (capexResult.success) {
  const capexForYear = capexResult.data.filter((item) => item.year === targetYear);
}
```

#### NPV Calculations ✅

```typescript
// lib/calculations/financial/npv.ts
export function calculateNPV(params: NPVParams): Result<NPVResult>;
export function calculateNPVForYear(params: NPVParams, year: number): Result<Decimal>;
```

#### Full Projection ✅

```typescript
// lib/calculations/financial/projection.ts
export function calculateFullProjection(params: FullProjectionParams): Result<FullProjectionResult>;

// Returns:
interface YearlyProjection {
  year: number;
  revenue: Decimal;
  staffCost: Decimal;
  rent: Decimal;
  opex: Decimal;
  ebitda: Decimal;
  capex: Decimal;
  cashFlow: Decimal;
  rentLoad: Decimal; // (Rent / Revenue) × 100
}
```

**✅ Verdict:** All calculation logic exists and is tested. No new calculation modules needed.

---

### 4. State Management - ✅ COMPLETE

**Version data already loaded in VersionDetail component:**

```typescript
// components/versions/VersionDetail.tsx
const [version, setVersion] = useState<Version | null>(null);

// Version includes:
// - curriculumPlans (with staff cost data)
// - rentPlan (with model + params)
// - opexSubAccounts
// - capexItems
// - capexRules
```

**✅ Verdict:** No new state management needed. All data available in parent component.

---

## 🚀 Implementation Plan

### Phase 1: Rent Lens Component (Collapsed State)

**File:** `components/versions/costs-analysis/RentLens.tsx`

**Props:**

```typescript
interface RentLensProps {
  rentPlan: RentPlan;
  curriculumPlans: CurriculumPlan[];
  adminSettings: AdminSettings;
  startYear?: number;
  endYear?: number;
}
```

**Data Flow:**

1. Receive `rentPlan` from parent (already loaded)
2. Calculate rent projection using existing `calculateRent()` function
3. Calculate NPV using existing `calculateNPV()` function
4. Display summary metrics in collapsed card

**UI Components:**

- Card (shadcn/ui)
- Badge (for rent model name)
- Metrics display (Year 1 rent, Year 30 rent, NPV, Rent Load %)
- Expand/Collapse button

**Calculations:**

```typescript
// 1. Calculate rent for all years
const rentResult = calculateRent({
  model: rentPlan.rentModel,
  ...rentPlan.parameters,
});

// 2. Calculate NPV (2028-2052)
const npvResult = calculateNPV({
  cashFlows: rentResult.data.map((r) => r.rent),
  discountRate: adminSettings.discountRate,
  startYear: 2028,
});

// 3. Calculate average rent load
const avgRentLoad =
  rentResult.data.reduce((sum, r) => sum + r.rentLoad, 0) / rentResult.data.length;
```

**✅ No API calls needed** - all data passed as props.

---

### Phase 2: Rent Lens Component (Expanded State)

**Additional UI:**

- Year-by-year table (scrollable)
- Rent model details display (read-only)
- "Edit Rent Model" button → redirects to `curriculum` tab (where rent plan editing occurs)
  - Uses `setActiveTab('curriculum')` to switch tabs
  - Rent plan editing is in the Curriculum tab, not a separate Rent tab
- Mini sensitivity chart (optional - can be Phase 3)

**Table Columns:**

- Year
- Rent (SAR)
- Revenue (SAR)
- Rent Load (%)
- YoY Change (%)

**✅ No API calls needed** - all calculations client-side.

---

### Phase 3: Cost Breakdown Component

**File:** `components/versions/costs-analysis/CostBreakdown.tsx`

**Props:**

```typescript
interface CostBreakdownProps {
  version: Version;
  adminSettings: AdminSettings;
  startYear?: number;
  endYear?: number;
}
```

**Data Flow:**

1. Calculate full financial projection using `calculateFullProjection()`
2. Extract cost data for each year:
   - Rent
   - Staff Costs
   - Opex
   - Capex
3. Display pie chart (Recharts)
4. Display year-by-year table

**Calculations:**

```typescript
// 1. Calculate staff cost base from curriculum plans
const staffCostBaseResult = calculateStaffCostBaseFromCurriculum(
  version.curriculumPlans,
  2028 // Base year for relocation
);

if (!staffCostBaseResult.success) {
  // Handle error - show message to user
  console.error('Failed to calculate staff cost base:', staffCostBaseResult.error);
  return;
}

// 2. Build projection params from version data
const projectionParams: FullProjectionParams = {
  curriculumPlans: version.curriculumPlans,
  rentPlan: version.rentPlan,
  staffCostBase: staffCostBaseResult.data,
  capexItems: version.capexItems,
  opexSubAccounts: version.opexSubAccounts,
  adminSettings: adminSettings,
  startYear: 2023,
  endYear: 2052,
};

// 3. Calculate full projection
const projection = calculateFullProjection(projectionParams);

if (!projection.success) {
  // Handle error
  console.error('Failed to calculate projection:', projection.error);
  return;
}

// 4. Extract cost data
const costData = projection.data.years.map((year) => ({
  year: year.year,
  rent: year.rent.toNumber(),
  staffCost: year.staffCost.toNumber(),
  opex: year.opex.toNumber(),
  capex: year.capex.toNumber(),
  total: year.rent.plus(year.staffCost).plus(year.opex).plus(year.capex).toNumber(),
}));
```

**UI Components:**

- Pie Chart (Recharts `<PieChart>`)
- Data Table (shadcn/ui `<Table>`)
- Metrics cards (Total costs, Cost per student, etc.)

**✅ No API calls needed** - all calculations client-side.

---

## 📊 Data Dependencies

### Required Data (All Available)

1. **Rent Plan** ✅
   - Source: `version.rentPlan`
   - Fields: `rentModel`, `parameters`

2. **Curriculum Plans** ✅
   - Source: `version.curriculumPlans`
   - Fields: `tuitionBase`, `studentsProjection`, `teacherRatio`, `nonTeacherRatio`, `teacherMonthlySalary`, `nonTeacherMonthlySalary`

3. **Opex Sub Accounts** ✅
   - Source: `version.opexSubAccounts`
   - Fields: `subAccountName`, `percentOfRevenue`, `isFixed`, `fixedAmount`

4. **Capex Items** ✅
   - Source: `version.capexItems`
   - Fields: `year`, `amount`, `category`

5. **Capex Rules** ✅
   - Source: `version.capexRules`
   - Fields: `category`, `cycleYears`, `baseCost`, `startingYear`, `inflationIndex`

6. **Admin Settings** ✅
   - Source: Fetched separately (already implemented)
   - Fields: `cpiRate`, `discountRate`, `taxRate`

---

## ⚠️ Potential Issues & Mitigations

### Issue 1: Performance - Large Calculations

**Risk:** Calculating 30-year projection on every render could be slow.

**Mitigation:**

- ✅ Use `useMemo()` to cache calculation results
- ✅ Only recalculate when version data changes
- ✅ Target: <50ms calculation time (already achieved in existing code)

```typescript
const projection = useMemo(() => {
  if (!version || !adminSettings) return null;
  return calculateFullProjection({ ...params });
}, [version, adminSettings]);
```

### Issue 4: Table Virtualization for 30-Year Data

**Risk:** Rendering 30 rows in a table could impact performance, especially with complex cells.

**Mitigation:**

- ✅ Consider using virtualization library for large tables
- ✅ Recommended: `@tanstack/react-virtual` (lightweight, React 18 compatible)
- ✅ Alternative: Native scrolling with pagination (show 10 years at a time)
- ✅ For MVP: Start with native scrolling, add virtualization if needed

**Virtualization Library (Optional):**

```bash
npm install @tanstack/react-virtual
```

**Usage Example:**

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: projection.data.years.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50, // Row height
});
```

### Issue 2: Missing Admin Settings

**Risk:** Admin settings might not be loaded.

**Mitigation:**

- ✅ Fetch admin settings in parent component
- ✅ Show loading state while fetching
- ✅ Show error state if fetch fails

```typescript
const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchSettings() {
    const response = await fetch('/api/admin/settings');
    const data = await response.json();
    if (data.success) {
      setAdminSettings(data.data);
    }
    setLoading(false);
  }
  fetchSettings();
}, []);
```

### Issue 3: Decimal Serialization

**Risk:** Decimal objects might not serialize correctly for charts.

**Mitigation:**

- ✅ Convert Decimal to number for chart data
- ✅ Use `toNumber()` method
- ✅ Format numbers for display

```typescript
const chartData = projection.data.years.map((year) => ({
  year: year.year,
  rent: year.rent.toNumber(),
  staffCost: year.staffCost.toNumber(),
  opex: year.opex.toNumber(),
  capex: year.capex.toNumber(),
}));
```

---

## 🧪 Testing Strategy

### Unit Tests (Calculation Logic)

✅ **Already exist** - all calculation modules have tests:

- `lib/calculations/rent/__tests__/`
- `lib/calculations/financial/__tests__/`
- `lib/calculations/capex/__tests__/`

### Component Tests (UI)

**New tests needed:**

- `RentLens.test.tsx` - collapsed/expanded states
- `CostBreakdown.test.tsx` - pie chart, table rendering

### Integration Tests

**Test scenarios:**

1. Load version → display rent lens → verify calculations
2. Load version → display cost breakdown → verify totals
3. Expand rent lens → verify year-by-year table
4. Change version → verify recalculation

---

## 📦 Dependencies

### Existing Dependencies (Already Installed)

- ✅ `decimal.js` - Financial calculations
- ✅ `recharts` - Charts
- ✅ `@radix-ui/*` - UI components (via shadcn/ui)
- ✅ `lucide-react` - Icons

### New Dependencies

- ❌ **NONE** - All dependencies already installed

---

## 🎨 UI Components Needed

### From shadcn/ui (Already Available)

- ✅ `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- ✅ `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`
- ✅ `Badge`
- ✅ `Button`
- ✅ `Collapsible` (for expand/collapse)

### From Recharts (Already Available)

- ✅ `PieChart`, `Pie`, `Cell`, `Tooltip`, `Legend`
- ✅ `LineChart`, `Line`, `XAxis`, `YAxis` (for sensitivity chart)

### Custom Components (To Create)

- `RentLens.tsx` - Rent model display
- `CostBreakdown.tsx` - Cost analysis display
- `CostPieChart.tsx` - Pie chart wrapper
- `CostTable.tsx` - Year-by-year cost table

---

## 📝 Implementation Checklist

### Pre-Implementation ✅

- [x] Verify all database models exist
- [x] Verify all API endpoints exist
- [x] Verify all calculation modules exist
- [x] Verify all dependencies installed
- [x] Verify Prisma schema has proper defaults
- [x] Document data flow
- [x] Document component structure

### Implementation (Phase 1) - Rent Lens

- [ ] Create `RentLens.tsx` component
- [ ] Implement collapsed state UI
- [ ] Implement rent calculation integration
- [ ] Implement NPV calculation
- [ ] Add loading/error states
- [ ] Add expand/collapse functionality
- [ ] Test with different rent models

### Implementation (Phase 2) - Rent Lens Expanded

- [ ] Implement expanded state UI
- [ ] Add year-by-year table
- [ ] Add "Edit Rent Model" button (redirects to `curriculum` tab using `setActiveTab('curriculum')`)
- [ ] Add rent model details display (read-only)
- [ ] Test table scrolling (consider virtualization if performance issues)
- [ ] Test with 30-year data

### Implementation (Phase 3) - Cost Breakdown

- [ ] Create `CostBreakdown.tsx` component
- [ ] Implement pie chart
- [ ] Implement cost table
- [ ] Add cost per student metrics
- [ ] Add YoY change calculations
- [ ] Test with different cost structures

### Integration

- [ ] Add tab to `VersionDetail.tsx`
- [ ] Pass version data as props
- [ ] Fetch admin settings
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test tab switching

### Testing

- [ ] Unit tests for new components
- [ ] Integration tests for data flow
- [ ] Visual regression tests
- [ ] Performance tests (<50ms target)

---

## ✅ Final Verdict

**Implementation Complexity:** 🟡 MODERATE (updated from LOW)

**Risk Level:** 🟢 LOW (after critical fixes)

**Estimated Time:** 10-15 hours (updated from 4-6 hours)

**Blockers:** ✅ **NONE** (all critical issues fixed)

**Critical Fixes Applied:**

1. ✅ **FIXED:** Added `capexRules` to GET `/api/versions/[id]` endpoint
2. ✅ **FIXED:** Created `calculateStaffCostBaseFromCurriculum()` helper function
3. ✅ **FIXED:** Updated code examples with correct function names

**Why This Is Safe:**

1. ✅ No database changes needed
2. ✅ API endpoint updated to include `capexRules` (critical fix applied)
3. ✅ No Prisma schema changes needed
4. ✅ All calculation logic exists and tested
5. ✅ Staff cost base calculation helper created (critical fix applied)
6. ✅ All data available via existing endpoints
7. ✅ Pure UI/presentation layer
8. ✅ No risk of data corruption
9. ✅ No risk of breaking existing features

**Recommendation:** ✅ **PROCEED WITH IMPLEMENTATION**

This is a **pure visualization feature** with minimal risk. All critical issues identified in the review have been fixed:

- ✅ GET endpoint now returns `capexRules`
- ✅ Staff cost base calculation helper function created
- ✅ Code examples corrected

All the hard work (calculations, data models, API) is complete. We just need to create the UI components to display the data.

---

## 🚦 Next Steps

1. **Confirm Approach** - Get user approval on this analysis
2. **Create Components** - Build `RentLens.tsx` and `CostBreakdown.tsx`
3. **Integrate** - Add tab to `VersionDetail.tsx`
4. **Test** - Verify calculations and UI
5. **Polish** - Add animations, loading states, error handling

**Ready to proceed when you are!** 🚀
