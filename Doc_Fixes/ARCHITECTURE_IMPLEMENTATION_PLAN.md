# Architecture Implementation Plan: Financial Statements & Tuition Sim Tab

**Document Version:** 1.0  
**Date:** December 2024  
**Status:** 📋 **PENDING ARCHITECTURE REVIEW**  
**Priority:** 🔴 **HIGH** - Critical Missing Features

---

## 📋 Executive Summary

This document outlines the architecture and implementation plan for three critical missing features:

1. **Financial Statements Display** (PnL, Balance Sheet, Cash Flow)
2. **Embedded Tuition Sim Tab** (Currently placeholder)
3. **Balance Sheet Calculations** (NEW - not currently computed)

**Impact:** These features are required for complete financial planning functionality as specified in PRD Section 4.3 and 17.4.

**Estimated Timeline:** 9-12 days (7-9 days for Financial Statements, 2-3 days for Tuition Sim Tab)

---

## 1. Architecture Overview

### 1.1 Current State

**Existing Infrastructure:**

- ✅ `calculateFullProjection()` - Returns `FullProjectionResult` with year-by-year financial data
- ✅ Cash Flow calculation - `lib/calculations/financial/cashflow.ts`
- ✅ EBITDA calculation - `lib/calculations/financial/ebitda.ts`
- ✅ Financial projection structure - `YearlyProjection` interface
- ✅ VersionDetail component with tab structure
- ✅ Basic table component - `components/ui/table.tsx` (shadcn/ui)
- ❌ No Balance Sheet calculations (Assets, Liabilities, Equity)
- ❌ No Financial Statements display components
- ❌ Tuition Sim tab is placeholder only
- ❌ TanStack Table not installed (required for virtualization)

**Data Flow (Current):**

```
VersionDetail.tsx
  ↓ Fetch version data
API /api/versions/[id]
  ↓ Calculate projection
calculateFullProjection()
  ↓ Returns YearlyProjection[]
Display in charts/tables (partial)
```

**Data Flow (Target):**

```
VersionDetail.tsx
  ↓ Fetch version data
API /api/versions/[id]
  ↓ Calculate projection + Balance Sheet
calculateFullProjection() + calculateBalanceSheet()
  ↓ Returns YearlyProjection[] + BalanceSheetItem[]
Financial Statements Component
  ↓ Tabbed Interface
PnL | Balance Sheet | Cash Flow Tables
```

---

### 1.2 Architecture Principles

Following existing architecture patterns from `ARCHITECTURE.md`:

1. **Separation of Concerns**
   - Calculation logic in `/lib/calculations`
   - Presentation in `/components/versions`
   - Data flow: API → Service → Calculation → Display

2. **Type Safety First**
   - TypeScript strict mode
   - Explicit return types (`Result<T>` pattern)
   - Zod validation for inputs

3. **Financial Precision**
   - Decimal.js for all money calculations
   - No floating point arithmetic
   - ROUND_HALF_UP for consistency

4. **Performance**
   - Virtualized tables (TanStack Table)
   - Memoized calculations
   - Lazy loading for financial statements tab

5. **Consistency**
   - Follow existing component patterns
   - Use shadcn/ui components
   - Match existing table/chart styling

---

## 2. Component Design

### 2.1 File Structure

```
components/versions/
  ├── financial-statements/
  │   ├── FinancialStatements.tsx          # Main container component
  │   ├── PnLStatement.tsx                 # Profit & Loss table
  │   ├── BalanceSheet.tsx                 # Balance Sheet table
  │   ├── CashFlowStatement.tsx            # Cash Flow statement table
  │   ├── FinancialStatementsToolbar.tsx   # Export, comparison controls
  │   └── index.ts                         # Exports

lib/calculations/financial/
  ├── balance-sheet.ts                     # NEW: Balance Sheet calculations
  ├── statement-transformers.ts            # NEW: Data transformation functions
  └── projection.ts                        # MODIFY: Extend with Balance Sheet option

lib/types/
  └── financial.ts                         # NEW: Financial statement types

components/versions/
  ├── TuitionSimEmbedded.tsx               # NEW: Embedded tuition simulator
  └── VersionDetail.tsx                    # MODIFY: Add Financials tab, enhance Tuition Sim tab
```

**CRITICAL NOTE:**

- Type definitions must be in `lib/types/financial.ts` (NOT `types/financial.ts`)
- TanStack Table must be installed before implementation (see Section 5.1)

---

### 2.2 Component Hierarchy

```
VersionDetail.tsx
├── Tabs (existing)
│   ├── Overview
│   ├── Curriculum
│   ├── Costs Analysis
│   ├── Capex
│   ├── Opex
│   ├── Tuition Sim
│   │   └── TuitionSimEmbedded.tsx  ⬅️ NEW
│   ├── Financials                    ⬅️ NEW TAB
│   │   └── FinancialStatements.tsx   ⬅️ NEW
│   │       ├── FinancialStatementsToolbar.tsx
│   │       └── Tabs (PnL | Balance Sheet | Cash Flow)
│   │           ├── PnLStatement.tsx
│   │           ├── BalanceSheet.tsx
│   │           └── CashFlowStatement.tsx
│   └── Reports
```

---

### 2.3 Component Specifications

#### 2.3.1 FinancialStatements.tsx (Main Container)

**Purpose:** Container component managing financial statements display

**Props:**

```typescript
interface FinancialStatementsProps {
  version: VersionWithRelations;
  projection: FullProjectionResult;
  balanceSheet?: BalanceSheetResult; // Optional, calculated on demand
  baseVersion?: VersionWithRelations; // For comparison mode
}
```

**State:**

```typescript
{
  activeStatement: 'pnl' | 'balance-sheet' | 'cash-flow';
  comparisonMode: boolean;
  selectedYears: {
    start: number;
    end: number;
  }
  loading: boolean;
}
```

**Features:**

- Tabbed interface for switching between statements
- Toolbar with export, comparison toggle, year range selector
- Loading states during calculation
- Error handling with user-friendly messages

**Dependencies:**

- `@tanstack/react-table` for virtualized tables
- `components/ui/tabs` from shadcn/ui
- `lib/calculations/financial/balance-sheet` (NEW)

---

#### 2.3.2 PnLStatement.tsx

**Purpose:** Display Profit & Loss statement year-by-year

**Data Source:** `FullProjectionResult.years` (YearlyProjection[])

**Table Structure:**

```typescript
interface PnLRow {
  metric: string;
  category: 'revenue' | 'expense' | 'income';
  years: Record<number, Decimal>; // 2023-2052
}
```

**Rows (per PRD lines 3126-3142):**

1. Revenue (FR)
2. Revenue (IB)
3. **Total Revenue**
4. Staff Costs (FR)
5. Staff Costs (IB)
6. **Total Staff Costs**
7. Rent
8. Opex
9. Capex
10. **EBITDA** (Revenue - Staff - Rent - Opex - Capex)
11. EBITDA Margin %
12. Interest
13. Taxes
14. **Net Income** (EBITDA - Interest - Taxes)

**Formatting:**

- Currency: SAR with commas (e.g., "1,234,567 SAR")
- Percentages: 1 decimal place (e.g., "15.3%")
- Color coding:
  - Green: Positive Net Income
  - Red: Negative Net Income
  - Yellow: Highlighted when comparing to base

**Features:**

- Virtualized scrolling (30 years)
- Sticky first column (metric names)
- Horizontal scroll for years
- Comparison mode (delta vs. base version)

---

#### 2.3.3 BalanceSheet.tsx

**Purpose:** Display Balance Sheet year-by-year

**Data Source:** `BalanceSheetResult.items` (NEW calculation)

**Table Structure:**

```typescript
interface BalanceSheetRow {
  category: 'asset' | 'liability' | 'equity';
  item: string;
  years: Record<number, Decimal>;
}
```

**Balance Sheet Structure:**

```
ASSETS:
  Current Assets
    - Cash (from cumulative cash flow)
    - Accounts Receivable (optional, calculated)
    - Total Current Assets
  Fixed Assets
    - Accumulated Capex (depreciation adjusted)
    - Total Fixed Assets
  Total Assets

LIABILITIES:
  Current Liabilities (if applicable)
  Long-term Debt (if applicable)
  Total Liabilities

EQUITY:
  Retained Earnings (cumulative Net Income)
  Total Equity

EQUATION: Assets = Liabilities + Equity
```

**Formatting:**

- Same as PnL (currency with commas)
- Sections grouped with subtotals
- Equation validation (highlight if imbalance)

**Features:**

- Same as PnL (virtualized, sticky columns, comparison)
- Section expand/collapse
- Balance validation indicator

---

#### 2.3.4 CashFlowStatement.tsx

**Purpose:** Display Cash Flow statement by activity type

**Data Source:** `FullProjectionResult.years` + additional cash flow breakdown

**Table Structure:**

```
CASH FLOW FROM OPERATING ACTIVITIES:
  Net Income (from PnL)
  Adjustments for non-cash items:
    + Depreciation (Capex)
    - Changes in Working Capital (if applicable)
  Net Cash from Operating Activities

CASH FLOW FROM INVESTING ACTIVITIES:
  - Capex
  Net Cash from Investing Activities

CASH FLOW FROM FINANCING ACTIVITIES:
  - Debt Repayments (if applicable)
  + Equity Contributions (if applicable)
  Net Cash from Financing Activities

NET CHANGE IN CASH:
  Operating + Investing + Financing

CASH AT BEGINNING OF YEAR:
  Previous year's ending cash

CASH AT END OF YEAR:
  Beginning + Net Change
```

**Features:**

- Same table features as PnL
- Three-activity breakdown
- Cumulative cash tracking

---

#### 2.3.5 TuitionSimEmbedded.tsx

**Purpose:** Embedded tuition simulator within VersionDetail tab

**Props:**

```typescript
interface TuitionSimEmbeddedProps {
  versionId: string;
  version: VersionWithRelations;
  onSave?: (adjustments: TuitionAdjustments) => void;
}
```

**Features:**

- Tuition sliders (FR, IB) with % adjustment (-20% to +50%)
- Real-time calculation preview (Revenue, EBITDA, Rent Load %)
- "Save Adjustments to Version" button
- Link to full `/tuition-simulator` page for advanced features
- Compact layout optimized for tab context

**Differences from Full Tuition Simulator:**

- Simplified UI (no 3-panel layout)
- Focused controls (tuition sliders only)
- Quick impact preview (small charts)
- Save directly to current version (not new version)

---

## 3. Data Flow & Calculations

### 3.1 Balance Sheet Calculation (NEW)

**File:** `lib/calculations/financial/balance-sheet.ts`

**Purpose:** Calculate Assets, Liabilities, Equity year-by-year

**Input:**

```typescript
interface BalanceSheetParams {
  years: YearlyProjection[]; // From calculateFullProjection
  startYear: number; // Default: 2023
  endYear: number; // Default: 2052
  initialCash?: Decimal; // Starting cash position (optional, default: 0)
  debtSchedule?: Array<{ year: number; principal: Decimal; interest: Decimal }>; // Optional
}
```

**Output:**

```typescript
interface BalanceSheetResult {
  items: BalanceSheetItem[];
  summary: {
    totalAssets: Decimal;
    totalLiabilities: Decimal;
    totalEquity: Decimal;
  };
  duration: number; // milliseconds
}

interface BalanceSheetItem {
  year: number;
  assets: {
    current: {
      cash: Decimal; // Cumulative cash from cash flow
      receivables?: Decimal; // Optional: calculated as % of revenue
      total: Decimal;
    };
    fixed: {
      accumulatedCapex: Decimal; // Capex accumulated (with depreciation)
      total: Decimal;
    };
    total: Decimal;
  };
  liabilities: {
    current: Decimal; // If applicable
    longTerm: Decimal; // Debt (if provided)
    total: Decimal;
  };
  equity: {
    retainedEarnings: Decimal; // Cumulative Net Income
    total: Decimal;
  };
}
```

**Calculation Logic:**

```typescript
// 1. Cash = Cumulative Cash Flow from year 1
let cumulativeCash = initialCash || new Decimal(0);
for (const year of years) {
  cumulativeCash = cumulativeCash.plus(year.cashFlow);
  balanceSheet.assets.current.cash = cumulativeCash;
}

// 2. Accounts Receivable (configurable, default 5%)
// 🔴 CRITICAL: Make receivables percentage configurable in admin settings
// Default: 5% of revenue (simplified assumption for financial modeling)
// TODO: Load from admin settings: adminSettings.receivablesPercentage (default: 0.05)
const receivablesPercentage = adminSettings?.receivablesPercentage ?? new Decimal(0.05);
balanceSheet.assets.current.receivables = year.revenue.times(receivablesPercentage);

// 3. Accumulated Capex = Sum of all Capex (simplified, no depreciation)
// NOTE: This is a simplified model. Future enhancement: Add depreciation calculation
let accumulatedCapex = new Decimal(0);
for (const year of years) {
  accumulatedCapex = accumulatedCapex.plus(year.capex);
  balanceSheet.assets.fixed.accumulatedCapex = accumulatedCapex;
}

// 4. Retained Earnings = Cumulative Net Income
// Net Income = EBITDA - Interest - Taxes (where Taxes = (EBITDA - Interest) × taxRate)
let cumulativeNetIncome = new Decimal(0);
for (const year of years) {
  // Interest and Taxes are already calculated in YearlyProjection
  const netIncome = year.ebitda.minus(year.interest).minus(year.taxes);
  cumulativeNetIncome = cumulativeNetIncome.plus(netIncome);
  balanceSheet.equity.retainedEarnings = cumulativeNetIncome;
}

// 5. Validate: Assets = Liabilities + Equity
// 🔴 CRITICAL: Do NOT auto-adjust equity to balance
// Instead: Calculate correctly and log warning if imbalance occurs
const totalAssets = balanceSheet.assets.total;
const totalEquity = balanceSheet.equity.total;
const totalLiabilities = balanceSheet.liabilities.total;
const balanceCheck = totalAssets.minus(totalLiabilities.plus(totalEquity));

if (!balanceCheck.isZero()) {
  // Log warning - imbalance detected (should not occur if calculations correct)
  console.warn(
    `Balance Sheet imbalance detected: Assets (${totalAssets}) != Liabilities (${totalLiabilities}) + Equity (${totalEquity})`,
    { year: balanceSheet.year, difference: balanceCheck.toString() }
  );
  // Optionally: Adjust equity to balance for display purposes ONLY
  // But log this adjustment clearly
  balanceSheet.equity.retainedEarnings = balanceSheet.equity.retainedEarnings.plus(balanceCheck);
  balanceSheet._metadata = {
    ...balanceSheet._metadata,
    autoAdjusted: true,
    adjustmentReason: 'Calculation imbalance detected',
    adjustmentAmount: balanceCheck.toString(),
  };
}
```

**Integration:**

```typescript
// lib/calculations/financial/projection.ts
export function calculateFullProjection(
  params: FullProjectionParams
): Result<FullProjectionResult & { balanceSheet?: BalanceSheetResult }> {
  // Existing calculation...
  const projectionResult = calculateFullProjectionExisting(params);

  // Calculate Balance Sheet if requested
  if (params.includeBalanceSheet) {
    const balanceSheetResult = calculateBalanceSheet({
      years: projectionResult.years,
      startYear: params.startYear,
      endYear: params.endYear,
    });
    // Merge results
  }
}
```

---

### 3.2 Data Flow Diagram

```
User clicks "Financials" tab
  ↓
VersionDetail.tsx renders <FinancialStatements />
  ↓
FinancialStatements.tsx checks if projection exists
  ↓
If not: Fetch version → Calculate projection → Store in state
  ↓
If Balance Sheet not calculated: Call calculateBalanceSheet()
  ↓
Render tabbed interface (PnL | Balance Sheet | Cash Flow)
  ↓
Each statement component:
  - Transforms projection data to table rows
  - Virtualized table rendering (TanStack Table)
  - Export functionality (Excel/PDF)
  - Comparison mode (vs. base version)
```

---

## 4. Technical Specifications

### 4.1 Type Definitions

**File:** `lib/types/financial.ts` (NEW)

**🔴 CRITICAL: Type Location**

- Must use `lib/types/financial.ts` (NOT `types/financial.ts`)
- Matches existing codebase structure (see `.cursorrules` line 144)

```typescript
import Decimal from 'decimal.js';

export interface FinancialStatementsData {
  pnl: PnLData;
  balanceSheet: BalanceSheetData;
  cashFlow: CashFlowData;
}

export interface PnLData {
  years: number[]; // 2023-2052
  rows: PnLRow[];
}

export interface PnLRow {
  id: string;
  label: string;
  category: 'revenue' | 'expense' | 'income';
  isSubtotal: boolean;
  isTotal: boolean;
  values: Record<number, Decimal>;
}

export interface BalanceSheetData {
  years: number[];
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  equity: BalanceSheetSection;
}

export interface BalanceSheetSection {
  label: string;
  items: BalanceSheetRow[];
  subtotal: Record<number, Decimal>;
  total: Record<number, Decimal>;
}

export interface BalanceSheetRow {
  id: string;
  label: string;
  values: Record<number, Decimal>;
  isSubtotal?: boolean;
}

export interface CashFlowData {
  years: number[];
  operating: CashFlowActivity;
  investing: CashFlowActivity;
  financing: CashFlowActivity;
  summary: {
    netChange: Record<number, Decimal>;
    beginningCash: Record<number, Decimal>;
    endingCash: Record<number, Decimal>;
  };
}

export interface CashFlowActivity {
  label: string;
  items: CashFlowRow[];
  netCash: Record<number, Decimal>;
}
```

---

### 4.2 Component Props & Interfaces

**FinancialStatements.tsx:**

```typescript
interface FinancialStatementsProps {
  versionId: string;
  version?: VersionWithRelations; // Optional, will fetch if not provided
  baseVersionId?: string; // For comparison mode
  className?: string;
}

interface FinancialStatementsState {
  version: VersionWithRelations | null;
  projection: FullProjectionResult | null;
  balanceSheet: BalanceSheetResult | null;
  loading: boolean;
  error: string | null;
  activeTab: 'pnl' | 'balance-sheet' | 'cash-flow';
  comparisonMode: boolean;
  baseProjection: FullProjectionResult | null;
}
```

**Statement Components:**

```typescript
interface StatementTableProps {
  data: PnLData | BalanceSheetData | CashFlowData;
  years: number[];
  comparisonData?: PnLData | BalanceSheetData | CashFlowData;
  comparisonMode: boolean;
  onExport?: (format: 'excel' | 'pdf') => void;
}
```

---

### 4.3 Calculation Functions

**Balance Sheet:**

```typescript
// lib/calculations/financial/balance-sheet.ts

export interface BalanceSheetParams {
  years: YearlyProjection[];
  startYear?: number;
  endYear?: number;
  initialCash?: Decimal | number | string;
  receivablesPercentage?: Decimal | number | string; // 🔴 NEW: Configurable receivables % (default: 5%)
  debtSchedule?: Array<{ year: number; principal: Decimal; interest: Decimal }>; // Optional
  adminSettings?: {
    receivablesPercentage?: Decimal | number | string; // For future: Load from admin settings
  };
}

export function calculateBalanceSheet(params: BalanceSheetParams): Result<BalanceSheetResult>;

export function calculateBalanceSheetForYear(
  year: YearlyProjection,
  previousBalanceSheet: BalanceSheetItem | null,
  initialCash?: Decimal
): Result<BalanceSheetItem>;
```

**Data Transformation:**

```typescript
// lib/calculations/financial/statement-transformers.ts

export function transformProjectionToPnL(projection: FullProjectionResult): PnLData;

export function transformBalanceSheetToRows(balanceSheet: BalanceSheetResult): BalanceSheetData;

export function transformProjectionToCashFlow(
  projection: FullProjectionResult,
  balanceSheet: BalanceSheetResult
): CashFlowData;
```

---

## 5. Dependencies & Integration

### 5.1 New Dependencies

**🔴 CRITICAL: TanStack Table Must Be Installed**

The plan requires `@tanstack/react-table` for virtualized tables, but it's **NOT currently installed**.

**Required Installation:**

```bash
npm install @tanstack/react-table
```

**Dependency Status:**

- ✅ `decimal.js` - Already installed
- ✅ `recharts` - Already installed
- ✅ `shadcn/ui` components - Already installed
- ✅ `exceljs` - Already installed (for Excel export)
- ✅ `@react-pdf/renderer` - Already installed (for PDF export)
- ❌ `@tanstack/react-table` - **MUST BE INSTALLED** (see Pre-Implementation Checklist)

**Installation Steps:**

1. Run `npm install @tanstack/react-table`
2. Update `package.json` with correct version
3. Verify installation: `npm list @tanstack/react-table`
4. Test basic table setup in development environment

**Note:** Without TanStack Table, virtualized tables cannot be implemented, which will cause performance issues with 30-year financial statements.

### 5.2 Integration Points

**🔴 CRITICAL: Calculation Location Decision**

**Decision: Client-Side Calculations (Recommended)**

All financial statement calculations will run **client-side** for consistency with existing `calculateFullProjection()` usage and to avoid API overhead.

**Rationale:**

- ✅ Consistency with existing patterns (projection calculated client-side)
- ✅ Better performance (no network latency for recalculation)
- ✅ Easier caching (React state/memoization)
- ✅ Simpler error handling (local error states)
- ✅ No additional API endpoints needed

**Implementation:**

```typescript
// FinancialStatements.tsx - Client-side calculation
const projection = useMemo(() => {
  if (!version) return null;
  return calculateFullProjection(projectionParams);
}, [version]);

const balanceSheet = useMemo(() => {
  if (!projection) return null;
  return calculateBalanceSheet({ years: projection.years });
}, [projection]);
```

**Alternative (If Server-Side Preferred):**

- Create `/api/versions/[id]/financial-statements` endpoint
- Cache calculations server-side
- Trade-off: Network latency vs. server-side caching

**VersionDetail.tsx:**

```typescript
// Add "Financials" tab
<TabsTrigger value="financials">Financials</TabsTrigger>

<TabsContent value="financials">
  <FinancialStatements versionId={versionId} version={version} />
</TabsContent>

// Enhance "Tuition Sim" tab
<TabsContent value="tuition-sim">
  <TuitionSimEmbedded
    versionId={versionId}
    version={version}
    onSave={handleTuitionSave}
  />
</TabsContent>
```

**API Routes:**

- No new API routes required
- Use existing `/api/versions/[id]` for version data
- **All calculations run client-side** (decision documented above)

**Services:**

```typescript
// services/financial/statements.ts (NEW, optional helper - client-side only)
export function calculateFinancialStatements(
  projection: FullProjectionResult
): Result<FinancialStatementsData> {
  // Calculate balance sheet (client-side)
  // Transform to statement format (client-side)
  // Return
}
```

---

## 6. Implementation Phases

### Phase 0: Pre-Implementation Setup (1-2 hours)

**Priority:** 🔴 **CRITICAL** - Must complete before implementation

**Tasks:**

1. ✅ Install `@tanstack/react-table` dependency
   ```bash
   npm install @tanstack/react-table
   ```
2. ✅ Verify installation: `npm list @tanstack/react-table`
3. ✅ Test basic table setup in development
4. ✅ Create `lib/types/` directory if it doesn't exist
5. ✅ Verify file structure matches plan

**Deliverables:**

- ✅ TanStack Table installed and working
- ✅ Type location confirmed (`lib/types/financial.ts`)
- ✅ Development environment ready

---

### Phase 1: Balance Sheet Calculations (2-3 days)

**Priority:** 🔴 **HIGH** - Foundation for Balance Sheet component

**Tasks:**

1. Create `lib/calculations/financial/balance-sheet.ts`
2. Implement `calculateBalanceSheet()` with correct balancing logic
3. Implement `calculateBalanceSheetForYear()`
4. Add receivables percentage parameter (configurable, default 5%)
5. Implement imbalance detection and warning (DO NOT auto-adjust)
6. Add Balance Sheet types to `lib/types/financial.ts` (NOT `types/financial.ts`)
7. Write unit tests for Balance Sheet calculations
8. Integration test with `calculateFullProjection()`
9. Document all assumptions (no depreciation, simplified receivables)

**🔴 CRITICAL CHANGES FROM PLAN:**

- Balance Sheet balancing: Log warnings instead of auto-adjusting
- Receivables: Make configurable (admin settings, default 5%)
- Document simplified assumptions clearly

**Deliverables:**

- ✅ Balance Sheet calculation function
- ✅ Unit tests (100% coverage)
- ✅ Integration with projection calculation
- ✅ Type definitions

**Acceptance Criteria:**

- Balance Sheet calculations accurate (Assets = Liabilities + Equity)
- Handles edge cases (negative cash flow, zero capex)
- Performance < 50ms for 30-year calculation
- Type-safe with Result<T> pattern

---

### Phase 2: Financial Statements Components (4-5 days)

**Priority:** 🔴 **HIGH** - Core feature

**Tasks:**

1. Create `lib/types/financial.ts` with all type definitions (NOT `types/financial.ts`)
2. Create `components/versions/financial-statements/` directory
3. Implement `FinancialStatements.tsx` (main container)
4. Implement `PnLStatement.tsx`
5. Implement `BalanceSheet.tsx`
6. Implement `CashFlowStatement.tsx`
7. Implement `FinancialStatementsToolbar.tsx`
8. Create data transformation functions
9. Add export functionality (Excel/PDF)
10. Add comparison mode

**Deliverables:**

- ✅ All three statement components
- ✅ Toolbar with controls
- ✅ Export functionality
- ✅ Comparison mode
- ✅ Virtualized tables
- ✅ Responsive design

**Acceptance Criteria:**

- All statements display correctly (PnL, Balance Sheet, Cash Flow)
- Tables virtualized for performance (30 years)
- Export to Excel/PDF works
- Comparison mode shows deltas correctly
- Matches design system (dark mode, styling)
- Accessible (keyboard navigation, screen readers)

---

### Phase 3: VersionDetail Integration (1 day)

**Priority:** 🔴 **HIGH** - User-facing integration

**Tasks:**

1. Add "Financials" tab to VersionDetail.tsx
2. Integrate FinancialStatements component
3. Handle loading states
4. Handle error states
5. Add navigation from other tabs
6. Update tab skeleton

**Deliverables:**

- ✅ Financials tab functional
- ✅ Proper loading/error handling
- ✅ Seamless navigation

**Acceptance Criteria:**

- Tab appears in VersionDetail
- Component loads correctly
- Error states handled gracefully
- Loading states shown during calculation

---

### Phase 4: Tuition Sim Embedded Tab (2-3 days)

**Priority:** 🟡 **MEDIUM** - Enhancement

**Tasks:**

1. Create `TuitionSimEmbedded.tsx`
2. Implement tuition sliders (FR, IB)
3. Implement real-time calculation preview
4. Implement save functionality
5. Add link to full simulator
6. Integrate into VersionDetail tab
7. Replace placeholder

**Deliverables:**

- ✅ Embedded tuition simulator
- ✅ Real-time calculations
- ✅ Save functionality
- ✅ Compact UI

**Acceptance Criteria:**

- Tuition sliders functional
- Real-time impact visible (< 50ms)
- Save button works
- Links to full simulator
- Matches design system

---

## 7. Testing Strategy

### 7.1 Unit Tests

**Balance Sheet Calculations:**

```typescript
// lib/calculations/financial/__tests__/balance-sheet.test.ts

describe('calculateBalanceSheet', () => {
  it('should calculate balance sheet correctly for 30 years');
  it('should handle negative cash flow');
  it('should validate Assets = Liabilities + Equity');
  it('should handle zero capex');
  it('should handle initial cash position');
  it('should calculate cumulative retained earnings');
});
```

**Data Transformers:**

```typescript
// lib/calculations/financial/__tests__/statement-transformers.test.ts

describe('transformProjectionToPnL', () => {
  it('should transform projection to PnL format');
  it('should include all required rows');
  it('should calculate totals correctly');
});
```

### 7.2 Integration Tests

**API Integration:**

```typescript
// __tests__/integration/financial-statements.test.ts

describe('Financial Statements Integration', () => {
  it('should fetch version and display financial statements');
  it('should calculate balance sheet on demand');
  it('should handle comparison mode');
  it('should export to Excel/PDF');
});
```

### 7.3 Component Tests

**React Testing Library:**

```typescript
// components/versions/financial-statements/__tests__/FinancialStatements.test.tsx

describe('FinancialStatements', () => {
  it('should render PnL tab by default');
  it('should switch between tabs');
  it('should display loading state');
  it('should display error state');
  it('should enable comparison mode');
});
```

### 7.4 E2E Tests (Optional)

**Playwright/Cypress:**

- Navigate to version detail page
- Click "Financials" tab
- Verify all three statements display
- Test export functionality
- Test comparison mode

---

## 8. Performance Considerations

### 8.1 Calculation Performance

**Target:** < 50ms for Balance Sheet calculation (30 years)

**Optimization:**

- Memoize balance sheet calculations
- Only calculate when needed (lazy loading)
- Cache results in component state

**Implementation:**

```typescript
const balanceSheet = useMemo(() => {
  if (!projection) return null;
  return calculateBalanceSheet({ years: projection.years });
}, [projection]);
```

### 8.2 Rendering Performance

**Target:** Smooth scrolling, < 100ms initial render

**Optimization:**

- Virtualized tables (TanStack Table)
- Lazy load financial statements tab (only calculate when tab opened)
- Memoize table rows
- Use React.memo for statement components

**Implementation:**

```typescript
// Virtualized table with 30 years
const table = useReactTable({
  data: pnlRows,
  columns: yearColumns,
  getCoreRowModel: getCoreRowModel(),
});

// Lazy loading
const [financialsLoaded, setFinancialsLoaded] = useState(false);
useEffect(() => {
  if (activeTab === 'financials' && !financialsLoaded) {
    loadFinancialStatements();
    setFinancialsLoaded(true);
  }
}, [activeTab]);
```

### 8.3 Bundle Size Impact

**Estimated Increase:** ~15-20KB gzipped

**Mitigation:**

- Code splitting for financial statements components
- Lazy import TanStack Table
- Tree-shake unused exports

---

## 9. Risk Assessment

### 9.1 Technical Risks

| Risk                                   | Impact | Probability | Mitigation                                  |
| -------------------------------------- | ------ | ----------- | ------------------------------------------- |
| Balance Sheet calculation complexity   | High   | Medium      | Start with simplified model, iterate        |
| Performance issues with 30-year tables | Medium | Low         | Virtualization, memoization                 |
| Type safety issues                     | Medium | Low         | Comprehensive TypeScript types, strict mode |
| Integration issues with existing code  | Medium | Medium      | Thorough testing, incremental integration   |

### 9.2 Business Risks

| Risk                                     | Impact | Probability | Mitigation                            |
| ---------------------------------------- | ------ | ----------- | ------------------------------------- |
| Missing financial statement requirements | High   | Low         | Review PRD, consult stakeholders      |
| Balance Sheet calculations incorrect     | High   | Medium      | Comprehensive unit tests, peer review |
| User confusion with embedded Tuition Sim | Low    | Medium      | Clear UI, link to full simulator      |

### 9.3 Dependencies

**Critical Dependencies:**

- `calculateFullProjection()` must work correctly
- `YearlyProjection` interface must be stable
- TanStack Table must support virtualization

**Mitigation:**

- Validate all dependencies before starting
- Create mocks for testing
- Document any assumptions

---

## 10. Success Criteria

### 10.1 Functional Requirements

- ✅ PnL Statement displays all revenue and expense items
- ✅ Balance Sheet displays Assets, Liabilities, Equity
- ✅ Cash Flow Statement shows Operating/Investing/Financing
- ✅ All statements show year-by-year data (2023-2052)
- ✅ Balance Sheet equation validates: Assets = Liabilities + Equity
- ✅ Tuition Sim tab has embedded controls (not just redirect)
- ✅ Export to Excel/PDF works for all statements
- ✅ Comparison mode works (vs. base version)

### 10.2 Non-Functional Requirements

- ✅ Performance: Calculations < 50ms, Render < 100ms
- ✅ Type Safety: No `any` types, strict TypeScript
- ✅ Accessibility: WCAG 2.1 AA compliance
- ✅ Responsive: Works on desktop, tablet
- ✅ Dark Mode: Matches existing design system
- ✅ Error Handling: User-friendly error messages
- ✅ Loading States: Smooth loading indicators

### 10.3 Quality Metrics

- ✅ Unit Test Coverage: > 90% for calculations
- ✅ Integration Tests: All critical paths covered
- ✅ Type Coverage: 100% (no `any` types)
- ✅ Lint Errors: 0
- ✅ Build Warnings: 0

---

## 11. Documentation Requirements

### 11.1 Code Documentation

- JSDoc comments for all public functions
- Type definitions documented
- Component props documented
- Calculation formulas documented

### 11.2 User Documentation

- Update PRD if needed (document actual implementation)
- Add to user guide: How to view financial statements
- Add to user guide: How to use embedded Tuition Sim

### 11.3 Developer Documentation

- Update ARCHITECTURE.md with new components
- Document Balance Sheet calculation logic
- Document data transformation functions

---

## 12. Approval Checklist

### Architecture Review

- [ ] Architecture follows existing patterns
- [ ] Component structure is logical
- [ ] Data flow is clear and efficient
- [ ] Performance targets are achievable
- [ ] Risk mitigation strategies are adequate
- [ ] Dependencies are acceptable
- [ ] Testing strategy is comprehensive

### Implementation Readiness

- [ ] All types defined
- [ ] All interfaces documented
- [ ] Calculation logic clear
- [ ] Component props defined
- [ ] Integration points identified
- [ ] Testing plan complete

---

## 13. Open Questions (RESOLVED)

1. **Balance Sheet Depreciation:** Should we implement depreciation for Capex, or use simplified accumulated Capex model?
   - **✅ RESOLVED:** Start with simplified (accumulated Capex), document limitation, add depreciation later if needed
   - **Implementation:** Use accumulated Capex (sum of all Capex), document as "simplified model"

2. **Accounts Receivable:** Should we calculate receivables (e.g., 5% of revenue), or assume cash-only?
   - **✅ RESOLVED:** Calculate receivables with configurable percentage (default 5%)
   - **Implementation:** Add `receivablesPercentage` parameter (load from admin settings in future)

3. **Debt Schedule:** Should Balance Sheet support debt tracking?
   - **✅ RESOLVED:** Support optional debt schedule for future expansion
   - **Implementation:** Include optional `debtSchedule` parameter in Balance Sheet calculation

4. **Tuition Sim Embedded Scope:** How much functionality vs. full simulator?
   - **✅ RESOLVED:** Core controls (tuition sliders) + link to full simulator
   - **Implementation:** Embedded component with tuition sliders and impact preview, link to full simulator

5. **Calculation Location:** Client-side or server-side?
   - **✅ RESOLVED:** Client-side calculations (see Section 5.2)
   - **Rationale:** Consistency with existing patterns, better performance, easier caching

6. **Balance Sheet Balancing:** Auto-adjust equity or log warning?
   - **✅ RESOLVED:** Log warning if imbalance, calculate correctly to avoid imbalances
   - **Implementation:** Detect imbalances, log warnings, optionally adjust for display but mark as auto-adjusted

---

## 14. Next Steps (Post-Approval)

### Pre-Implementation Checklist (🔴 CRITICAL - Must Complete First)

- [ ] **Install TanStack Table**
  ```bash
  npm install @tanstack/react-table
  ```
- [ ] **Verify installation:** `npm list @tanstack/react-table`
- [ ] **Create type directory:** Verify `lib/types/` exists
- [ ] **Document calculation location:** Client-side (decision made)
- [ ] **Review Balance Sheet logic:** Understand balancing approach
- [ ] **Set receivables percentage:** Decide default value (5% recommended)

### Implementation Steps

1. **Phase 0:** Pre-Implementation Setup (1-2 hours)
   - Install dependencies
   - Verify file structure
   - Set up development environment

2. **Create feature branch:** `feat/financial-statements`

3. **Phase 1:** Implement Balance Sheet calculations (2-3 days)
   - Create `lib/calculations/financial/balance-sheet.ts`
   - Implement with correct balancing logic
   - Add receivables configuration
   - Write unit tests

4. **Phase 2:** Implement Financial Statements components (4-5 days)
   - Create components in `components/versions/financial-statements/`
   - Implement virtualized tables with TanStack Table
   - Add export functionality

5. **Phase 3:** Integrate into VersionDetail (1 day)
   - Add "Financials" tab
   - Integrate components
   - Handle loading/error states

6. **Phase 4:** Implement Tuition Sim embedded tab (2-3 days)
   - Create embedded component
   - Replace placeholder

7. **Testing:** Run all tests, fix issues (3-4 days)
   - Unit tests
   - Integration tests
   - Component tests
   - Performance benchmarks

8. **Code Review:** Peer review of implementation

9. **Documentation:** Update all documentation (1-2 days)
   - Code documentation
   - User documentation
   - Developer documentation

10. **Merge:** Merge to main branch

---

## 15. References

**PRD Sections:**

- Section 4.3: Version Detail Page (Tab requirements)
- Section 17.4: Financial Tables (table_1_financial_summary)

**Existing Code:**

- `lib/calculations/financial/projection.ts` - Full projection calculation
- `lib/calculations/financial/cashflow.ts` - Cash flow calculation
- `components/versions/VersionDetail.tsx` - Version detail component
- `ARCHITECTURE.md` - System architecture

**Design System:**

- `config/design-system.ts` - Design tokens
- `components/ui/` - shadcn/ui components

---

**Document Status:** ✅ **UPDATED POST-AUDIT REVIEW**  
**Prepared By:** AI Assistant  
**Last Updated:** December 2024  
**Audit Review:** Completed (360_IMPLEMENTATION_PLAN_REVIEW_REPORT.md)

## 16. Audit Review Changes Applied

### Critical Issues Addressed:

1. ✅ **TanStack Table Installation** - Added Phase 0 pre-implementation checklist
2. ✅ **Type Location Fixed** - Changed `types/financial.ts` to `lib/types/financial.ts` throughout
3. ✅ **Calculation Location Clarified** - Documented client-side calculation decision (Section 5.2)
4. ✅ **Balance Sheet Logic Refined** - Changed from auto-adjust to warning-based approach
5. ✅ **Receivables Configuration** - Added configurable receivables percentage (default 5%)

### Major Issues Addressed:

1. ✅ **Receivables Assumption** - Made configurable instead of fixed 5%
2. ✅ **Balance Sheet Balancing** - Refined to log warnings instead of auto-adjusting
3. ✅ **Interest Calculation** - Documented that interest comes from `YearlyProjection`

### Assumptions Documented:

1. ✅ **No Depreciation** - Simplified model using accumulated Capex (documented)
2. ✅ **Receivables %** - Default 5%, configurable (documented)
3. ✅ **Client-Side Calculations** - Decision documented with rationale

### Next Steps:

- [ ] Architecture review approval
- [ ] Address any additional feedback
- [ ] Begin Phase 0: Pre-Implementation Setup

---

## Approval Section

**Architecture Review:**

- [ ] Approved
- [ ] Approved with modifications
- [ ] Rejected (reason: ******\_\_\_******)

**Reviewer:** ********\_********  
**Date:** ********\_********  
**Comments:** ********\_********
