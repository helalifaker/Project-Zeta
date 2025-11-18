# Missing Features Report - Comprehensive Status

**Date:** December 2024  
**Status:** 🔴 **CRITICAL MISSING FEATURES IDENTIFIED**  
**Priority:** 🔴 **HIGH** - Required for financial planning application

---

## 🚨 CRITICAL MISSING FEATURES

### 1. ❌ Financial Statements (PnL, Balance Sheet, Cash Flow) - **NOT IMPLEMENTED**

**Location:** `components/versions/VersionDetail.tsx`  
**Status:** ❌ **COMPLETELY MISSING**

**PRD Requirement (Section 4.3, Tab 1: Overview):**
According to PRD.md, financial statements should include:
- **Profit & Loss (PnL) Statement**: Year-by-year income statement
- **Balance Sheet**: Assets, Liabilities, Equity per year
- **Cash Flow Statement**: Operating, Investing, Financing activities

**Current State:**
- ❌ No "Financials" tab content implemented (only skeleton placeholder at line 1111)
- ❌ No PnL component exists
- ❌ No Balance Sheet component exists
- ❌ No Cash Flow statement component exists (calculation exists, but no display)

**Expected Location:**
- Should be in `VersionDetail.tsx` as a new tab or within existing tabs
- PRD mentions "Financial Summary" table (lines 3126-3147) which should include PnL data

**Required Implementation:**
```typescript
// components/versions/VersionDetail.tsx
<TabsContent value="financials" className="space-y-4">
  <FinancialStatements
    version={version}
    projection={projection}
  />
</TabsContent>

// components/versions/financial-statements/FinancialStatements.tsx
// Should include:
// - PnL Statement (Revenue - Expenses = Net Income)
// - Balance Sheet (Assets = Liabilities + Equity)
// - Cash Flow Statement (Operating, Investing, Financing)
```

**PRD Reference:**
- Line 3126-3147: `table_1_financial_summary` should include PnL structure
- Line 987: "Cash flow projection" mentioned in Overview tab
- Line 1176: Cash Flow calculation: `EBITDA - capex - interest - taxes`

---

### 2. ❌ Tuition Sim Tab - **NOT FULLY IMPLEMENTED**

**Location:** `components/versions/VersionDetail.tsx` (Line 2645-2663)  
**Status:** ❌ **PLACEHOLDER ONLY** - Redirects to separate page

**Current Implementation:**
```typescript
// Line 2645-2663: Just a placeholder button
<TabsContent value="tuition-sim" className="space-y-4">
  <Card>
    <CardHeader>
      <CardTitle>Tuition Simulation</CardTitle>
      <CardDescription>Adjust base tuition and see financial impact</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground mb-4">
        Tuition simulation tools will be available here...
      </p>
      <Button onClick={() => router.push(`/tuition-simulator?versionId=${versionId}`)}>
        Open Tuition Simulator
      </Button>
    </CardContent>
  </Card>
</TabsContent>
```

**PRD Requirement (Section 4.3, Tab 6: Tuition Sim):**
According to PRD.md (lines 1112-1122), the Tuition Sim tab should include:
- ✅ Rent-driven tuition adjustment tool
- ✅ Per-curriculum tuition sliders (FR, IB)
- ✅ Target EBITDA input
- ✅ Real-time impact calculations
- ✅ Tuition vs. Rent Load % curve
- ✅ "Save Adjustments to Version" button

**What Exists:**
- ✅ Separate Tuition Simulator page (`/tuition-simulator`) exists and is functional
- ❌ Embedded Tuition Sim tab in VersionDetail is NOT implemented (just redirect button)

**Required Implementation:**
The tab should embed the tuition simulator functionality directly in VersionDetail, not redirect:
```typescript
<TabsContent value="tuition-sim" className="space-y-4">
  <TuitionSimulatorEmbedded
    versionId={versionId}
    version={version}
  />
</TabsContent>
```

---

## 📊 Feature Implementation Status

| Feature | PRD Section | Status | Priority | Location |
|---------|-------------|--------|----------|----------|
| **PnL Statement** | 4.3 Overview, 17.4 Tables | ❌ Missing | 🔴 High | VersionDetail.tsx |
| **Balance Sheet** | 17.4 Tables | ❌ Missing | 🔴 High | VersionDetail.tsx |
| **Cash Flow Statement** | 4.3 Overview, 17.4 Tables | ❌ Missing | 🔴 High | VersionDetail.tsx |
| **Tuition Sim Tab** | 4.3 Tab 6 | ❌ Placeholder | 🟡 Medium | VersionDetail.tsx |
| Tuition Simulator Page | 4.4 | ✅ Implemented | - | `/tuition-simulator` |
| Cash Flow Calculation | 1.3 | ✅ Implemented | - | `lib/calculations/financial/cashflow.ts` |

---

## 🔍 Detailed Analysis

### Financial Statements Structure (From PRD)

**PnL Statement Should Include:**
```yaml
Profit & Loss Statement:
  Revenue:
    - Revenue (FR)
    - Revenue (IB)
    - Total Revenue
  Expenses:
    - Staff Costs (FR)
    - Staff Costs (IB)
    - Total Staff Costs
    - Rent
    - Opex
    - Capex
    - Interest
    - Taxes
  Net Income:
    - EBITDA (Revenue - Staff - Rent - Opex - Capex)
    - Net Income (EBITDA - Interest - Taxes)
```

**Balance Sheet Should Include:**
```yaml
Balance Sheet:
  Assets:
    - Current Assets (Cash, Receivables)
    - Fixed Assets (Capex accumulated)
    - Total Assets
  Liabilities:
    - Current Liabilities
    - Long-term Debt
    - Total Liabilities
  Equity:
    - Retained Earnings (Cumulative Net Income)
    - Total Equity
  Equation: Assets = Liabilities + Equity
```

**Cash Flow Statement Should Include:**
```yaml
Cash Flow Statement:
  Operating Activities:
    - Net Income
    - Adjustments for non-cash items
    - Changes in working capital
  Investing Activities:
    - Capex
  Financing Activities:
    - Debt repayments
    - Equity contributions
  Net Cash Flow:
    - Operating + Investing + Financing
    - Beginning Cash
    - Ending Cash
```

**Source:** PRD.md lines 3126-3147 (table_1_financial_summary)

---

## ✅ What's Already Implemented

### Calculation Functions (Complete)
1. ✅ **Cash Flow Calculation** - `lib/calculations/financial/cashflow.ts`
   - Formula: `cash_flow(t) = EBITDA(t) - capex(t) - interest(t) - taxes(t)`
   - Returns year-by-year cash flow

2. ✅ **EBITDA Calculation** - `lib/calculations/financial/ebitda.ts`
   - Formula: `EBITDA(t) = revenue(t) - staff_cost(t) - rent(t) - opex(t)`

3. ✅ **Financial Projection** - `lib/calculations/financial/projection.ts`
   - Calculates all financial metrics including revenue, costs, EBITDA, cash flow

### Display Components (Missing)
- ❌ No PnL component
- ❌ No Balance Sheet component  
- ❌ No Cash Flow statement component
- ✅ Cash Flow chart exists (`components/charts/CumulativeCashFlowChart.tsx`)

---

## 📝 Implementation Requirements

### 1. Financial Statements Component

**Create:** `components/versions/financial-statements/FinancialStatements.tsx`

**Required Features:**
```typescript
interface FinancialStatementsProps {
  version: VersionWithRelations;
  projection: FinancialProjection; // From calculateFullProjection
}

// Should display:
// 1. Tabbed interface: PnL | Balance Sheet | Cash Flow
// 2. Year-by-year tables (2023-2052, virtualized)
// 3. Export to Excel/PDF
// 4. Comparison mode (vs. base version)
```

**Components Needed:**
- `PnLStatement.tsx` - Profit & Loss table
- `BalanceSheet.tsx` - Balance Sheet table
- `CashFlowStatement.tsx` - Cash Flow statement table

**Data Source:**
- Use existing `calculateFullProjection` function
- Extend projection to include Balance Sheet items (Assets, Liabilities, Equity)

---

### 2. Balance Sheet Calculations (NEW)

**Current State:** ❌ **NOT CALCULATED**

**Required:**
- Assets calculation (Cash from cumulative cash flow, Capex accumulated depreciation)
- Liabilities calculation (Debt, if applicable)
- Equity calculation (Retained Earnings = Cumulative Net Income)

**Implementation Needed:**
```typescript
// lib/calculations/financial/balance-sheet.ts
interface BalanceSheetItem {
  year: number;
  assets: {
    current: Decimal; // Cash, Receivables
    fixed: Decimal; // Accumulated Capex (depreciation)
    total: Decimal;
  };
  liabilities: {
    current: Decimal;
    longTerm: Decimal; // Debt
    total: Decimal;
  };
  equity: {
    retainedEarnings: Decimal; // Cumulative Net Income
    total: Decimal;
  };
}
```

---

### 3. Tuition Sim Tab Enhancement

**Current:** Placeholder button redirects to `/tuition-simulator`

**Required:** Embedded tuition simulator component in VersionDetail tab

**Implementation Options:**
- Option A: Embed `TuitionSimulator` component directly in tab
- Option B: Create simplified embedded version for tab context
- Option C: Keep redirect but add preview/quick controls in tab

**Recommendation:** Option B - Create `TuitionSimEmbedded.tsx` with core controls (tuition sliders, impact preview) that links to full simulator for advanced features.

---

## 🎯 Priority Implementation Order

### Phase 1: Critical Financial Statements (HIGH PRIORITY)
1. **PnL Statement Component** (2-3 days)
   - Create component structure
   - Use existing projection data
   - Year-by-year table display
   - Export functionality

2. **Cash Flow Statement Component** (2 days)
   - Extend existing cash flow calculation
   - Operating/Investing/Financing breakdown
   - Year-by-year table display

3. **Balance Sheet Component** (3-4 days)
   - Implement Balance Sheet calculations (NEW)
   - Assets, Liabilities, Equity tracking
   - Year-by-year table display

### Phase 2: Tuition Sim Tab Enhancement (MEDIUM PRIORITY)
4. **Embedded Tuition Sim** (2-3 days)
   - Create embedded component
   - Add to VersionDetail tab
   - Sync with existing `/tuition-simulator` page

---

## 📋 Files to Create/Modify

### New Files Required:
```
components/versions/financial-statements/
  ├── FinancialStatements.tsx (Main component)
  ├── PnLStatement.tsx
  ├── BalanceSheet.tsx
  ├── CashFlowStatement.tsx
  └── index.ts

lib/calculations/financial/
  └── balance-sheet.ts (NEW calculations)

components/versions/
  └── TuitionSimEmbedded.tsx (NEW for tab)
```

### Files to Modify:
```
components/versions/VersionDetail.tsx
  - Add "Financials" tab content (currently missing)
  - Replace Tuition Sim placeholder with embedded component

lib/calculations/financial/projection.ts
  - Extend to include Balance Sheet calculations
```

---

## 🔗 PRD References

1. **Financial Statements:** PRD.md lines 3126-3147 (table_1_financial_summary)
2. **Tuition Sim Tab:** PRD.md lines 1112-1122 (Tab 6: Tuition Sim)
3. **Cash Flow:** PRD.md line 1176, 1613 (Cash Flow calculation)
4. **PnL Structure:** PRD.md lines 3126-3142 (Financial Summary table rows)

---

## ✅ Verification Checklist

### Financial Statements
- [ ] PnL Statement displays Revenue, Expenses, Net Income year-by-year
- [ ] Balance Sheet displays Assets, Liabilities, Equity per year
- [ ] Cash Flow Statement shows Operating/Investing/Financing activities
- [ ] All statements are year-by-year (2023-2052)
- [ ] Tables are virtualized for performance
- [ ] Export to Excel/PDF works
- [ ] Comparison mode (vs. base version) works

### Tuition Sim Tab
- [ ] Tuition sliders embedded in tab (not just redirect)
- [ ] Real-time impact calculations visible
- [ ] Save adjustments button functional
- [ ] Links to full simulator for advanced features

---

## 🚨 Impact Assessment

**User Impact:**
- 🔴 **HIGH** - Financial statements are critical for financial planning
- Without PnL/BS/Cash Flow statements, users cannot:
  - Analyze profitability trends
  - Assess balance sheet health
  - Track cash position over time
  - Generate complete financial reports

**Business Impact:**
- Financial planning application incomplete without financial statements
- Board presentations require PnL and Balance Sheet
- Regulatory reporting may require financial statements

**Technical Debt:**
- Calculations exist but not displayed
- Missing Balance Sheet calculations entirely
- Tuition Sim tab is incomplete placeholder

---

**Status:** 🔴 **CRITICAL FEATURES MISSING**  
**Next Action:** Implement Financial Statements components immediately  
**Estimated Time:** 7-9 days for complete implementation


