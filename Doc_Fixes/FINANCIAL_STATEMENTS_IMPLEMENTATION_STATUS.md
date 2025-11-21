# Financial Statements Implementation Status

**Date:** December 2024  
**Purpose:** Validate calculation formulas and structure before implementation  
**Status:** 🔴 **Calculations Exist (Partial), UI Missing**

---

## 📊 Executive Summary

### Current Implementation Status

| Statement               | Calculations                       | Display UI | Status          |
| ----------------------- | ---------------------------------- | ---------- | --------------- |
| **Profit & Loss (PnL)** | ✅ Partial (Revenue, EBITDA exist) | ❌ Missing | 🔴 Not Complete |
| **Balance Sheet**       | ❌ Not Calculated                  | ❌ Missing | 🔴 Not Started  |
| **Cash Flow Statement** | ✅ Complete (Operating activities) | ❌ Missing | 🟡 Ready for UI |

**Overall:** Calculations are 70% complete (PnL partial, Cash Flow complete, Balance Sheet missing). Display components are 0% complete.

---

## 1. Profit & Loss (PnL) Statement

### 📋 Structure (Year-by-Year: 2023-2052)

```
PROFIT & LOSS STATEMENT (Income Statement)
┌─────────────────────────────────────────────────┐
│ REVENUE                                         │
│ ├── Revenue (French Curriculum)                 │
│ ├── Revenue (IB Curriculum)                     │
│ ├── Other Revenue (input required)              │
│ └── Total Revenue = FR + IB + Other             │
│                                                 │
│ EXPENSES                                        │
│ ├── Staff Costs                                 │
│ │   ├── Staff Costs (FR)                        │
│ │   ├── Staff Costs (IB)                        │
│ │   └── Total Staff Costs = FR + IB             │
│ ├── Rent                                        │
│ ├── Operating Expenses (Opex)                   │
│ │   ├── Marketing (% of revenue)                │
│ │   ├── Utilities (fixed)                       │
│ │   ├── Maintenance (% of revenue)              │
│ │   └── Other sub-accounts                      │
│ ├── Capital Expenditures (Capex)                │
│ ├── Interest Expense                            │
│ └── Taxes                                       │
│                                                 │
│ PROFIT METRICS                                  │
│ ├── EBITDA = Revenue - Staff - Rent - Opex     │
│ ├── EBITDA Margin % = (EBITDA / Revenue) × 100 │
│ ├── Net Income = EBITDA - Capex - Interest - Taxes │
│ └── Net Income Margin % = (Net Income / Revenue) × 100 │
└─────────────────────────────────────────────────┘
```

### ✅ What's Implemented (Calculations)

**Location:** `lib/calculations/financial/`

#### Revenue Calculation ✅

- **File:** `lib/calculations/revenue/revenue.ts`
- **Formula:** Revenue (per curriculum) = Students × Tuition
- **Total Revenue (Current):** Revenue (FR) + Revenue (IB)
- **Status:** ✅ Complete and tested (26 tests passing)
- **Note:** "Other Revenue" is NOT currently calculated - needs to be added

**Formulas in Normal Language:**

- For each curriculum (FR and IB):
  - Revenue = Students enrolled × Tuition per student
  - Tuition grows with CPI based on frequency (1, 2, or 3 years)
- **Total Revenue (Current Implementation):** Revenue from French curriculum + Revenue from IB curriculum
- **Total Revenue (Required):** Revenue from French curriculum + Revenue from IB curriculum + Other Revenue (needs input field)

**⚠️ Missing: Other Revenue**

- Other Revenue is required but not currently calculated or input
- Need to add: Input field for "Other Revenue" per year (2023-2052)
- Formula Update: Total Revenue = Revenue (FR) + Revenue (IB) + Other Revenue

#### EBITDA Calculation ✅

- **File:** `lib/calculations/financial/ebitda.ts`
- **Formula:** EBITDA = Revenue - Staff Costs - Rent - Opex
- **Status:** ✅ Complete and tested (104 tests passing)

**Formulas in Normal Language:**

- EBITDA (Earnings Before Interest, Taxes, Depreciation, Amortization) = Total Revenue minus all operating expenses
- EBITDA Margin Percentage = (EBITDA divided by Revenue) multiplied by 100
- Operating expenses include: Staff Costs, Rent, and Operating Expenses (Opex)
- **Note:** Currently uses Revenue without "Other Revenue" - will need update once Other Revenue is added

#### Cash Flow (Net Income) Calculation ✅

- **File:** `lib/calculations/financial/cashflow.ts`
- **Formula:** Cash Flow = EBITDA - Capex - Interest - Taxes
- **Status:** ✅ Complete and tested (part of 104 tests)

**Formulas in Normal Language:**

- Cash Flow (which equals Net Income for PnL purposes) = EBITDA minus capital expenditures minus interest expense minus taxes
- Taxes are calculated on taxable income (EBITDA minus Interest), only if positive (losses have zero tax)
- Tax Rate comes from Admin Settings (e.g., 20% = 0.20)

#### Staff Costs Calculation ✅

- **File:** `lib/calculations/financial/staff-costs.ts`
- **Formula:** Staff Cost grows with CPI based on frequency
- **Status:** ✅ Complete and tested

**Formulas in Normal Language:**

- Base Staff Cost grows annually based on Consumer Price Index (CPI)
- CPI is applied every N years (1, 2, or 3 years) based on admin settings
- Staff Cost for year = Base Staff Cost × (1 + CPI Rate) raised to the power of (number of CPI applications)
- Total Staff Costs = Staff Costs for French curriculum + Staff Costs for IB curriculum (if tracked separately, otherwise combined)

#### Opex Calculation ✅

- **File:** `lib/calculations/financial/opex.ts`
- **Formula:** Opex = Sum of all sub-accounts (variable % of revenue + fixed amounts)
- **Status:** ✅ Complete and tested

**Formulas in Normal Language:**

- Operating Expenses (Opex) = Sum of all sub-accounts
- Each sub-account can be:
  - Variable: Percentage of Revenue (e.g., Marketing = 3% of Revenue)
  - Fixed: Fixed amount regardless of revenue (e.g., Utilities = 200,000 SAR per year)
- Total Opex = Marketing + Utilities + Maintenance + Insurance + Other sub-accounts
- **Note:** Opex sub-accounts are percentage of "Total Revenue" - will automatically include Other Revenue once added

#### Rent Calculation ✅

- **File:** `lib/calculations/rent/`
- **Three Models:** FixedEscalation, RevenueShare, PartnerModel
- **Status:** ✅ Complete and tested (52 tests passing)

**Formulas in Normal Language:**

1. **Fixed Escalation Model:**
   - Rent = Base Rent × (1 + Escalation Rate) raised to the power of (number of years since start)

2. **Revenue Share Model:**
   - Rent = Total Revenue × Revenue Share Percentage
   - **Note:** This will automatically include Other Revenue once added (uses Total Revenue)

3. **Partner Model:**
   - Base Value = (Land Size × Land Price per sqm) + (Building Area × Construction Cost per sqm)
   - Yield = Base Yield × (1 + Yield Growth Rate) raised to the power of (number of growth periods)
   - Rent = Base Value × Yield

#### Capex Calculation ✅

- **File:** `lib/calculations/capex/auto-reinvestment.ts`
- **Formula:** Capex items can be manual or auto-reinvested
- **Status:** ✅ Complete

**Formulas in Normal Language:**

- Capital Expenditures (Capex) = Sum of all capex items for the year
- Items can be manually added or auto-triggered based on replacement cycles
- Auto-replacement: Cost = Base Cost × (1 + Inflation Index) raised to the power of (years since base)

#### Interest Calculation ⚠️

- **Current Status:** Placeholder (assumed zero)
- **Formula:** Interest Expense (optional, currently defaults to zero)
- **Location:** `lib/calculations/financial/cashflow.ts` (line 76: defaults to zero if not provided)

**Formulas in Normal Language:**

- Interest Expense = Interest amount for the year (currently defaults to zero)
- **Note:** Interest calculation is supported in the formula but not actively calculated. If needed, interest would need to be added as an input parameter per year.

#### Taxes Calculation ✅

- **File:** `lib/calculations/financial/cashflow.ts`
- **Formula:** Taxes = max(0, EBITDA - Interest) × Tax Rate
- **Status:** ✅ Complete

**Formulas in Normal Language:**

- Taxable Income = EBITDA minus Interest Expense
- If Taxable Income is negative (loss), taxes are zero
- If Taxable Income is positive (profit), Taxes = Taxable Income × Tax Rate
- Tax Rate comes from Admin Settings (e.g., 20% = 0.20)

---

### ❌ What's Missing (PnL Display)

#### Display Components ❌

- **Location:** `components/versions/VersionDetail.tsx` (line 2224-2236 - placeholder only)
- **Status:** Empty placeholder card, no actual PnL table

#### Required PnL Display Structure:

**Year-by-Year Table (2023-2052, 30 years):**

| Year | Revenue (FR) | Revenue (IB) | Other Revenue | Total Revenue | Staff Costs | Rent | Opex | Capex | Interest | Taxes | EBITDA | EBITDA % | Net Income | Net Income % |
| ---- | ------------ | ------------ | ------------- | ------------- | ----------- | ---- | ---- | ----- | -------- | ----- | ------ | -------- | ---------- | ------------ |
| 2023 | 10M          | 0M           | 0M            | 10M           | 3M          | 2M   | 1M   | 0M    | 0M       | 0.8M  | 4M     | 40%      | 3.2M       | 32%          |
| 2024 | 11M          | 0M           | 0M            | 11M           | 3.2M        | 2M   | 1.1M | 0M    | 0M       | 0.94M | 4.7M   | 43%      | 3.76M      | 34%          |
| ...  | ...          | ...          | ...           | ...           | ...         | ...  | ...  | ...   | ...      | ...   | ...    | ...      | ...        | ...          |

**Notes:**

- Net Income = EBITDA - Capex - Interest - Taxes (already calculated in Cash Flow)
- All values in SAR (Saudi Riyal)
- Virtualized table for performance (30 rows)
- Export to Excel/PDF capability
- **Other Revenue:** Input field required per year (can default to zero)

---

## 2. Balance Sheet

### 📋 Structure (Year-by-Year: 2023-2052)

```
BALANCE SHEET
┌─────────────────────────────────────────────────┐
│ ASSETS                                          │
│ ├── Current Assets                              │
│ │   ├── Cash (cumulative cash flow)             │
│ │   ├── Accounts Receivable (if applicable)     │
│ │   └── Other Current Assets                    │
│ ├── Fixed Assets                                │
│ │   ├── Property, Plant & Equipment             │
│ │   │   ├── Accumulated Capex (gross)           │
│ │   │   └── Accumulated Depreciation            │
│ │   └── Net Fixed Assets                        │
│ └── Total Assets = Current + Fixed              │
│                                                 │
│ LIABILITIES                                     │
│ ├── Current Liabilities                         │
│ │   ├── Accounts Payable (if applicable)        │
│ │   └── Other Current Liabilities               │
│ ├── Long-term Debt                              │
│ │   └── Debt (if applicable)                    │
│ └── Total Liabilities = Current + Long-term     │
│                                                 │
│ EQUITY                                          │
│ ├── Retained Earnings                           │
│ │   └── Cumulative Net Income                   │
│ ├── Opening Equity (Year 1)                     │
│ └── Total Equity = Retained Earnings + Opening  │
│                                                 │
│ BALANCE CHECK                                   │
│ Total Assets = Total Liabilities + Total Equity │
└─────────────────────────────────────────────────┘
```

### ❌ What's Missing (Balance Sheet - Complete)

#### Calculations ❌

- **Status:** Balance Sheet calculations do NOT exist
- **Required:** New calculation module needed

#### Required Balance Sheet Formulas (in Normal Language):

**1. Cash (Current Assets)**

- Cash for Year 1 = Starting Cash (assumed 0 or configurable) + Cash Flow for Year 1
- Cash for Year N = Cash for Year N-1 + Cash Flow for Year N
- This is cumulative cash flow over time
- **Formula:** Cash(t) = Cash(t-1) + Cash Flow(t)
- **Note:** Cash Flow = Net Income (already calculated in cashflow.ts)

**2. Fixed Assets (Property, Plant & Equipment)**

- Gross Fixed Assets = Sum of all Capex from Year 1 to current year (accumulated Capex)
- **Formula:** Gross Fixed Assets(t) = Sum of Capex from start year to year t
- **Note:** Depreciation calculation needed (currently not implemented)
  - If depreciation implemented: Net Fixed Assets = Gross Fixed Assets - Accumulated Depreciation
  - If no depreciation: Net Fixed Assets = Gross Fixed Assets
- **Question for Validation:** Should we track depreciation? If yes, what method (straight-line, declining balance)?

**3. Retained Earnings (Equity)**

- Retained Earnings = Cumulative Net Income from Year 1 to current year
- **Formula:** Retained Earnings(t) = Sum of Net Income from start year to year t
- Net Income = EBITDA - Capex - Interest - Taxes (already calculated)

**4. Total Assets**

- Total Assets = Current Assets + Fixed Assets
- **Formula:** Total Assets = Cash + Net Fixed Assets + Other Assets (if any)
- **Simplified (if no other assets):** Total Assets = Cash + Net Fixed Assets

**5. Total Liabilities**

- **Current Assumption:** Liabilities = 0 (unless debt is tracked)
- If debt tracking needed: Total Liabilities = Current Liabilities + Long-term Debt
- **Question for Validation:** Should we track debt/liabilities? If yes, how should debt be input (manual per year, calculated from loans)?

**6. Total Equity**

- Total Equity = Retained Earnings + Opening Equity
- Opening Equity = Starting equity (assumed 0 or configurable for Year 1)
- **Formula:** Total Equity = Retained Earnings + Opening Equity (Year 1 starting balance)

**7. Balance Sheet Equation (Must Balance)**

- Assets = Liabilities + Equity
- **Validation:** Total Assets must equal Total Liabilities plus Total Equity
- **Formula Check:** Cash + Net Fixed Assets = Total Liabilities + Retained Earnings + Opening Equity

---

### ❌ What's Missing (Balance Sheet Display)

#### Display Components ❌

- **Status:** No Balance Sheet component exists
- **Required:** New component needed

#### Required Balance Sheet Display Structure:

**Year-by-Year Table (2023-2052, 30 years):**

| Year | Assets |              |              | Liabilities |           | Equity            |                   | Balance Check  |
| ---- | ------ | ------------ | ------------ | ----------- | --------- | ----------------- | ----------------- | -------------- | ------------ | ---------------------- |
|      | Cash   | Fixed Assets | Total Assets | Current     | Long-term | Total Liabilities | Retained Earnings | Opening Equity | Total Equity | Assets = Liab + Equity |
| 2023 | 3.2M   | 0M           | 3.2M         | 0M          | 0M        | 0M                | 3.2M              | 0M             | 3.2M         | ✅ 3.2M = 0M + 3.2M    |
| 2024 | 6.96M  | 0M           | 6.96M        | 0M          | 0M        | 0M                | 6.96M             | 0M             | 6.96M        | ✅ 6.96M = 0M + 6.96M  |
| ...  | ...    | ...          | ...          | ...         | ...       | ...               | ...               | ...            | ...          | ...                    |

---

## 3. Cash Flow Statement

### 📋 Structure (Year-by-Year: 2023-2052)

```
CASH FLOW STATEMENT
┌─────────────────────────────────────────────────┐
│ OPERATING ACTIVITIES                            │
│ ├── Net Income (EBITDA - Capex - Interest - Taxes) │
│ ├── Adjustments for non-cash items              │
│ │   └── Depreciation (if applicable)            │
│ └── Changes in working capital                  │
│ │   └── (Accounts Receivable, Accounts Payable) │
│ └── Cash from Operations                        │
│                                                 │
│ INVESTING ACTIVITIES                            │
│ ├── Capital Expenditures (Capex)                │
│ └── Cash from Investing                         │
│                                                 │
│ FINANCING ACTIVITIES                            │
│ ├── Debt Repayments                             │
│ ├── Equity Contributions                        │
│ └── Cash from Financing                         │
│                                                 │
│ NET CASH FLOW                                   │
│ Net Cash Flow = Operating + Investing + Financing │
│                                                 │
│ CASH POSITION                                   │
│ ├── Beginning Cash (Previous year ending)       │
│ ├── Net Cash Flow (Current year)                │
│ └── Ending Cash = Beginning + Net Cash Flow     │
└─────────────────────────────────────────────────┘
```

### ✅ What's Implemented (Calculations)

#### Cash Flow Calculation ✅

- **File:** `lib/calculations/financial/cashflow.ts`
- **Formula:** Cash Flow = EBITDA - Capex - Interest - Taxes
- **Status:** ✅ Complete and tested (part of 104 tests)

**Formulas in Normal Language:**

**Operating Activities:**

- Net Income = EBITDA minus Capex minus Interest minus Taxes
- This equals "Cash from Operations" in a simplified model (no working capital changes)
- **Formula:** Operating Cash Flow = Net Income
- **Note:** If working capital is tracked in future, Operating Cash Flow = Net Income + Depreciation - Changes in Working Capital

**Investing Activities:**

- Cash from Investing = Negative of Capex (spending money on assets)
- **Formula:** Investing Cash Flow = -Capex (negative value represents cash outflow)
- When Capex is 0, Investing Cash Flow = 0
- When Capex is positive, Investing Cash Flow is negative (money going out)

**Financing Activities:**

- Currently assumed zero (no debt repayments or equity contributions)
- **Formula:** Financing Cash Flow = Debt Repayments + Equity Contributions - New Debt Issued
- **Current:** Financing Cash Flow = 0
- **Can be extended if needed:** Add input fields for debt repayments and equity contributions per year

**Net Cash Flow:**

- Net Cash Flow = Operating Cash Flow + Investing Cash Flow + Financing Cash Flow
- **Simplified Current Formula:** Net Cash Flow = Net Income - Capex
- **Full Formula (when financing tracked):** Net Cash Flow = Net Income - Capex + Financing Cash Flow

**Cash Position:**

- Beginning Cash = Ending Cash from previous year (or starting cash for Year 1)
- Ending Cash = Beginning Cash + Net Cash Flow
- This is cumulative (running balance)
- **Formula:**
  - Beginning Cash (Year 1) = Starting Cash (assumed 0 or configurable)
  - Beginning Cash (Year N) = Ending Cash (Year N-1)
  - Ending Cash (Year N) = Beginning Cash (Year N) + Net Cash Flow (Year N)

---

### ❌ What's Missing (Cash Flow Display)

#### Display Components ❌

- **Status:** No Cash Flow Statement component exists (chart exists but not statement table)
- **Note:** Cash Flow chart exists at `components/charts/CumulativeCashFlowChart.tsx` but it's just a chart, not a statement table

#### Required Cash Flow Statement Display Structure:

**Year-by-Year Table (2023-2052, 30 years):**

| Year | Operating Activities |             |                      | Investing Activities | Financing Activities | Net Cash Flow       | Beginning Cash | Ending Cash |
| ---- | -------------------- | ----------- | -------------------- | -------------------- | -------------------- | ------------------- | -------------- | ----------- | ----- |
|      | Net Income           | Adjustments | Cash from Operations | Capex                | Cash from Investing  | Cash from Financing |                |             |       |
| 2023 | 3.2M                 | 0M          | 3.2M                 | 0M                   | 0M                   | 0M                  | 3.2M           | 0M          | 3.2M  |
| 2024 | 3.76M                | 0M          | 3.76M                | 0M                   | 0M                   | 0M                  | 3.76M          | 3.2M        | 6.96M |
| ...  | ...                  | ...         | ...                  | ...                  | ...                  | ...                 | ...            | ...         | ...   |

**Notes:**

- Operating Cash Flow = Net Income (simplified, no working capital changes)
- Investing Cash Flow = -Capex (negative value)
- Financing Cash Flow = 0 (unless debt/equity tracked)
- Net Cash Flow = Operating + Investing + Financing
- Ending Cash = Beginning Cash + Net Cash Flow (cumulative)

---

## 📊 Complete Formula Summary (For Validation)

### PnL Statement Formulas

**Revenue:**

- Revenue (FR) = Students (FR) × Tuition (FR)
- Revenue (IB) = Students (IB) × Tuition (IB)
- **Other Revenue = Input per year (2023-2052)** ⚠️ NEW REQUIRED
- Total Revenue = Revenue (FR) + Revenue (IB) + Other Revenue

**Expenses:**

- Staff Costs = Base Staff Cost × (1 + CPI Rate)^(CPI applications)
- Rent = Based on rent model (FixedEscalation / RevenueShare / PartnerModel)
- Opex = Sum of (Revenue × Sub-account %) + Sum of (Fixed Sub-accounts)
- Capex = Sum of Capex items for the year
- Interest = Interest Expense (currently zero, can be configured)
- Taxes = max(0, EBITDA - Interest) × Tax Rate

**Profit Metrics:**

- EBITDA = Total Revenue - Staff Costs - Rent - Opex
- EBITDA Margin % = (EBITDA / Total Revenue) × 100
- Net Income = EBITDA - Capex - Interest - Taxes
- Net Income Margin % = (Net Income / Total Revenue) × 100

### Balance Sheet Formulas (NEW - Need Validation)

**Assets:**

- Cash (Year 1) = Starting Cash + Net Cash Flow (Year 1)
- Cash (Year N) = Cash (Year N-1) + Net Cash Flow (Year N)
- Gross Fixed Assets = Sum of all Capex from start year to current year
- Depreciation = ? (Need to confirm if depreciation is tracked)
- Net Fixed Assets = Gross Fixed Assets - Accumulated Depreciation (if applicable, else = Gross Fixed Assets)
- Total Assets = Cash + Net Fixed Assets + Other Assets (if any)

**Liabilities:**

- Current Liabilities = Accounts Payable + Other Current Liabilities (currently 0)
- Long-term Debt = Debt amount (currently 0)
- Total Liabilities = Current Liabilities + Long-term Debt

**Equity:**

- Retained Earnings = Sum of Net Income from start year to current year
- Opening Equity = Starting equity for Year 1 (assumed 0 or configurable)
- Total Equity = Retained Earnings + Opening Equity

**Balance Check:**

- Total Assets = Total Liabilities + Total Equity (must always balance)

### Cash Flow Statement Formulas

**Operating Activities:**

- Net Income = EBITDA - Capex - Interest - Taxes
- Adjustments = Depreciation (if applicable, currently 0)
- Cash from Operations = Net Income + Adjustments (simplified: = Net Income)

**Investing Activities:**

- Capex = Sum of Capex items for the year
- Cash from Investing = -Capex (negative value = cash outflow)

**Financing Activities:**

- Debt Repayments = Amount repaid (currently 0)
- Equity Contributions = Amount contributed (currently 0)
- Cash from Financing = Debt Repayments + Equity Contributions (currently 0)

**Net Cash Flow:**

- Net Cash Flow = Cash from Operations + Cash from Investing + Cash from Financing
- Simplified: Net Cash Flow = Net Income - Capex

**Cash Position:**

- Beginning Cash (Year 1) = Starting Cash (assumed 0 or configurable)
- Beginning Cash (Year N) = Ending Cash (Year N-1)
- Ending Cash = Beginning Cash + Net Cash Flow

---

## ❓ Questions for Validation

### Critical Questions (Must Answer Before Implementation)

1. **Other Revenue:**
   - ✅ Confirmed: Other Revenue is required in PnL structure
   - Question: Should Other Revenue be an input field per year (2023-2052), or calculated from a formula?
   - Recommendation: Input field per year (flexible, can default to zero)

2. **Depreciation (Balance Sheet):**
   - Should we track depreciation of Capex/Fixed Assets?
   - If yes, what depreciation method? (Straight-line, Declining balance, etc.)
   - If yes, what is the useful life of assets? (e.g., 20 years for buildings, 5 years for equipment)
   - Recommendation: Start without depreciation (Fixed Assets = Accumulated Capex), add later if needed

3. **Starting Balances (Balance Sheet):**
   - What should be the starting Cash for Year 1? (Recommendation: 0 or configurable)
   - What should be the Opening Equity for Year 1? (Recommendation: 0 or configurable)

4. **Debt/Liabilities Tracking:**
   - Should we track debt and debt repayments?
   - If yes, should interest be calculated automatically based on debt? (Currently interest defaults to zero)
   - Recommendation: Start without debt tracking (Liabilities = 0), add later if needed

5. **Working Capital (Cash Flow Statement):**
   - Should we track Accounts Receivable, Accounts Payable, Inventory?
   - Recommendation: Start simplified (Operating Cash Flow = Net Income), add working capital tracking later if needed

6. **Financing Activities:**
   - Should we track equity contributions or debt issuances?
   - Recommendation: Start without financing tracking (Financing Cash Flow = 0), add later if needed

---

## 📁 Files Status

### ✅ Existing Calculation Files

```
lib/calculations/
├── financial/
│   ├── ebitda.ts ✅ (Complete)
│   ├── cashflow.ts ✅ (Complete - Net Income calculated)
│   ├── projection.ts ✅ (Complete - Orchestrates all calculations)
│   ├── staff-costs.ts ✅ (Complete)
│   └── opex.ts ✅ (Complete)
├── revenue/
│   ├── revenue.ts ✅ (Complete - but missing Other Revenue)
│   └── tuition-growth.ts ✅ (Complete)
├── rent/
│   ├── fixed-escalation.ts ✅ (Complete)
│   ├── revenue-share.ts ✅ (Complete)
│   └── partner-model.ts ✅ (Complete)
└── capex/
    └── auto-reinvestment.ts ✅ (Complete)
```

### ❌ Missing Files (Need to Create)

```
lib/calculations/financial/
└── balance-sheet.ts ❌ (NEW - Need to create)

components/versions/financial-statements/
├── FinancialStatements.tsx ❌ (NEW - Main component)
├── PnLStatement.tsx ❌ (NEW - PnL table)
├── BalanceSheet.tsx ❌ (NEW - Balance Sheet table)
├── CashFlowStatement.tsx ❌ (NEW - Cash Flow table)
└── index.ts ❌ (NEW - Exports)
```

### 🔧 Files to Modify

```
components/versions/
└── VersionDetail.tsx (Line 2224-2236)
    └── Replace placeholder with FinancialStatements component

lib/calculations/financial/
├── projection.ts
│   └── Add Other Revenue support
└── revenue/
    └── revenue.ts
        └── Add Other Revenue to Total Revenue calculation

lib/calculations/financial/
└── cashflow.ts
    └── May need extension for Cash Flow Statement breakdown (Operating/Investing/Financing)
```

---

## ✅ Implementation Readiness

### Ready to Implement (After Adding Other Revenue)

1. **PnL Statement Display** ✅
   - All data available from `calculateFullProjection()` (after adding Other Revenue)
   - Just need to create display component
   - **Action Required:** Add Other Revenue input/support first
   - **Estimated Time:** 2-3 days

2. **Cash Flow Statement Display** ✅
   - Net Income already calculated
   - Just need to format as statement (Operating/Investing/Financing)
   - **Estimated Time:** 2 days

### Needs Calculation Implementation First

1. **Balance Sheet Display** ❌
   - Balance Sheet calculations do NOT exist
   - Need to create `balance-sheet.ts` calculation module first
   - **Estimated Time:** 3-4 days (1-2 days for calculations + 2 days for display)

2. **Other Revenue Support** ⚠️
   - Other Revenue is required but not currently calculated
   - Need to add input field and update Total Revenue formula
   - **Estimated Time:** 1 day

---

## 🎯 Next Steps for Validation

1. **Review Formulas Above** ✅
   - Validate all formulas match your business requirements
   - Confirm "Other Revenue" approach (input field per year)

2. **Answer Questions Above** ❌
   - Depreciation: Yes/No? Method? Useful life?
   - Starting balances: Cash Year 1? Opening Equity Year 1?
   - Debt tracking: Yes/No? How to input?
   - Working capital: Yes/No?
   - Financing activities: Yes/No?

3. **After Validation:**
   - Implement Other Revenue support (1 day)
   - Implement Balance Sheet calculations (if formulas approved) (2 days)
   - Create display components for all 3 statements (5 days)
   - Integrate into VersionDetail tab (1 day)

**Total Estimated Time:** 9 days (once formulas are validated and questions answered)

---

## 📝 Notes for Implementation

### Assumptions Made (Need Validation)

1. **Starting Cash:** Assumed zero for Year 1 (can be made configurable)
2. **Starting Equity:** Assumed zero for Year 1 (can be made configurable)
3. **Depreciation:** Not currently tracked (Fixed Assets = Accumulated Capex) - Need confirmation
4. **Working Capital:** Not tracked (Operating Cash Flow = Net Income) - Need confirmation
5. **Debt/Liabilities:** Not tracked (assumed zero) - Need confirmation
6. **Interest:** Supported but defaults to zero (can be added as input) - Need confirmation if should calculate from debt
7. **Financing Activities:** Not tracked (assumed zero) - Need confirmation
8. **Other Revenue:** ⚠️ REQUIRED but not implemented - Need to add input field per year

---

**Document Status:** Ready for Review  
**Next Action:** Validate formulas, confirm Other Revenue approach, and answer questions before implementation  
**Estimated Implementation Time:** 9 days (once validated)
