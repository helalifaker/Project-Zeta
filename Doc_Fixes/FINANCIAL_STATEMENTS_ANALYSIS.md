# Financial Statements Implementation Status - Critical Analysis

**Date:** December 2024  
**Purpose:** Identify inconsistencies, contradictions, and clarify actual implementation vs. documented status  
**Status:** ⚠️ **Multiple Inconsistencies Found - Requires Clarification**

---

## 🔴 CRITICAL INCONSISTENCIES FOUND

### 1. **EBITDA Formula - CONFLICTING DEFINITIONS**

**Inconsistency:** The document and code have different formulas for EBITDA.

**Document Says:**

- Line 52: `EBITDA = Revenue - Staff - Rent - Opex` ✅ (matches code)
- Line 84: `EBITDA = Revenue - Staff Costs - Rent - Opex` ✅ (matches code)
- BUT Line 142 in MISSING_FEATURES_REPORT.md: `EBITDA (Revenue - Staff - Rent - Opex - Capex)` ❌ **WRONG - contradicts code**

**Actual Code Implementation:**

- File: `lib/calculations/financial/ebitda.ts` (line 5, 88-90)
- Formula: `EBITDA = Revenue - Staff Cost - Rent - Opex` ✅
- **Capex is NOT included in EBITDA** (correct - Capex is excluded from EBITDA by definition)

**PRD Says:**

- Line 1612: `EBITDA = Revenue - Staff_Costs - Rent - Opex - Other_Costs`
- **Note:** PRD mentions "Other_Costs" but this is NOT implemented in code
- PRD does NOT include Capex in EBITDA ✅ (correct)

**Verdict:**

- ✅ **Correct:** EBITDA = Revenue - Staff - Rent - Opex (Capex excluded)
- ❌ **Incorrect:** Document references MISSING_FEATURES_REPORT.md which incorrectly says EBITDA includes Capex
- ⚠️ **Unclear:** PRD mentions "Other_Costs" but code doesn't have this - what is "Other_Costs"?

---

### 2. **Net Income vs Cash Flow - TERMINOLOGY CONFUSION**

**Critical Issue:** The document conflates "Net Income" and "Cash Flow" - these are DIFFERENT accounting concepts.

**Document Says:**

- Line 54: `Net Income = EBITDA - Capex - Interest - Taxes` ❌ **WRONG - This is NOT standard accounting**
- Line 99: "Cash Flow (which equals Net Income for PnL purposes)" ❌ **INCORRECT STATEMENT**
- Line 194: "Net Income = EBITDA - Capex - Interest - Taxes (already calculated in Cash Flow)" ❌ **WRONG**
- Line 433: `Net Income = EBITDA - Capex - Interest - Taxes` ❌ **WRONG**

**Actual Code Implementation:**

- File: `lib/calculations/financial/cashflow.ts` (line 5, 100-103)
- Formula: `Cash Flow = EBITDA - Capex - Interest - Taxes` ✅
- **Note:** The code calls this "Cash Flow" NOT "Net Income"

**Standard Accounting:**

- **Net Income (PnL):** `Net Income = EBITDA - Interest - Taxes - Depreciation - Amortization`
- **Cash Flow (Statement):** `Operating Cash Flow = Net Income + Depreciation - Changes in Working Capital`
- **Investing Cash Flow:** `-Capex`
- **Net Cash Flow:** `Operating + Investing + Financing`

**PRD Says:**

- Line 1613: `Cash Flow = EBITDA - Capex - Interest - Taxes` ✅ (matches code)
- PRD does NOT mention "Net Income" separately

**Verdict:**

- ✅ **Code is correct:** `Cash Flow = EBITDA - Capex - Interest - Taxes`
- ❌ **Document is WRONG:** Calling this "Net Income" is incorrect accounting terminology
- ⚠️ **Clarification Needed:**
  - For PnL Statement, should we use "Net Income" = EBITDA - Interest - Taxes (excluding Capex)?
  - Or should PnL show "Cash Flow" = EBITDA - Capex - Interest - Taxes (as currently calculated)?
  - Standard accounting: Capex goes in Cash Flow Statement (Investing Activities), NOT in PnL expenses

---

### 3. **Capex in PnL Statement - CONCEPTUAL ERROR**

**Critical Issue:** The document shows Capex as an EXPENSE in PnL Statement, which is **incorrect accounting**.

**Document Shows:**

- Line 47 (PnL Structure): `├── Capital Expenditures (Capex)` ❌ **WRONG PLACEMENT**
- Line 187 (PnL Table): Includes "Capex" as a column ❌ **INCORRECT**
- Line 425 (Formula Summary): Lists Capex as an expense ❌ **INCORRECT**

**Standard Accounting:**

- **PnL Statement:** Capex is NOT an expense - Depreciation/Amortization would be the expense
- **Cash Flow Statement:** Capex goes in "Investing Activities" (cash outflow)
- **Balance Sheet:** Capex increases Fixed Assets (investing in assets, not an expense)

**Actual Code:**

- Code correctly calculates: `Cash Flow = EBITDA - Capex - Interest - Taxes`
- Capex is treated as a cash outflow (correct for Cash Flow Statement)
- But code doesn't separate PnL from Cash Flow - it just calculates "Cash Flow"

**Verdict:**

- ❌ **Document is WRONG:** Capex should NOT be shown as an expense in PnL Statement
- ✅ **Code is partially correct:** Treats Capex as cash outflow (correct for Cash Flow Statement)
- ⚠️ **Clarification Needed:**
  - For PnL Statement: Show Net Income = EBITDA - Interest - Taxes (no Capex)
  - For Cash Flow Statement: Show Investing Cash Flow = -Capex
  - This requires separating PnL calculations from Cash Flow calculations

---

### 4. **Other Revenue - MISSING BUT REQUIRED**

**Issue:** Document correctly identifies that "Other Revenue" is required but not implemented.

**Document Says:**

- Line 33: `├── Other Revenue (input required)` ✅ (correctly identified)
- Line 68: "Other Revenue" is NOT currently calculated ✅ (accurate)
- Line 419: `Other Revenue = Input per year (2023-2052)` ⚠️ NEW REQUIRED ✅ (correct)

**Actual Code:**

- File: `lib/calculations/revenue/revenue.ts`
- Total Revenue = Revenue (FR) + Revenue (IB) only ✅ (confirmed)
- No "Other Revenue" parameter exists ❌

**PRD Says:**

- Line 1597-1598: Only shows `Revenue (per curriculum)` and `Total Revenue = Revenue(FR) + Revenue(IB)`
- **PRD does NOT mention "Other Revenue"** ⚠️
- **Question:** Is "Other Revenue" actually required, or is this an assumption?

**Verdict:**

- ✅ **Document correctly identifies:** Other Revenue is missing from code
- ⚠️ **Clarification Needed:**
  - Is "Other Revenue" actually required per PRD, or is this a new requirement?
  - If required, should it be an input field per year, or calculated from something?

---

### 5. **Staff Costs - Per Curriculum vs Combined**

**Inconsistency:** Document implies Staff Costs are calculated per curriculum, but code uses a single combined calculation.

**Document Says:**

- Line 38-40: Shows "Staff Costs (FR)" and "Staff Costs (IB)" separately in PnL structure
- Line 112: "Total Staff Costs = Staff Costs for French curriculum + Staff Costs for IB curriculum (if tracked separately, otherwise combined)"
- Line 187 (PnL Table): Shows single "Staff Costs" column (not separated by curriculum)

**Actual Code:**

- File: `lib/calculations/financial/staff-costs.ts`
- Takes single `baseStaffCost` parameter (combined, not per curriculum)
- File: `lib/calculations/financial/projection.ts` (line 298-315)
- Calculates single `staffCostByYear` array (combined for both curricula)
- No per-curriculum breakdown in staff costs

**PRD Says:**

- Line 1601: `Staff Costs (per curriculum) = (Students × teacher_ratio × teacher_salary_with_CPI) + (Students × non_teacher_ratio × non_teacher_salary_with_CPI)`
- Line 1602: `Total Staff Costs = Staff_Costs(FR) + Staff_Costs(IB)`
- **PRD expects per-curriculum Staff Costs calculation** ⚠️

**Verdict:**

- ❌ **Code does NOT match PRD:** Code uses single combined staff cost, PRD expects per-curriculum
- ⚠️ **Document is ambiguous:** Says "if tracked separately, otherwise combined" - which is it?
- ❌ **Document structure shows:** Staff Costs (FR) and Staff Costs (IB) separately in PnL, but table shows combined
- **Clarification Needed:**
  - Should Staff Costs be calculated per curriculum (as PRD suggests)?
  - Or is combined staff cost acceptable?
  - If per-curriculum, what inputs are needed (teacher ratios per curriculum, salaries per curriculum)?

---

### 6. **Cash Flow Statement - Net Income vs Cash Flow**

**Inconsistency:** Document mixes "Net Income" and "Cash Flow" inconsistently.

**Document Says:**

- Line 353: "Net Income = EBITDA minus Capex minus Interest minus Taxes"
- Line 355: "Operating Cash Flow = Net Income"
- Line 372: "Net Cash Flow = Net Income - Capex"
- Line 462: "Net Income = EBITDA - Capex - Interest - Taxes"
- Line 464: "Cash from Operations = Net Income + Adjustments (simplified: = Net Income)"

**Actual Code:**

- File: `lib/calculations/financial/cashflow.ts`
- Calculates `cashFlow = EBITDA - Capex - Interest - Taxes`
- No separate "Net Income" calculation
- No breakdown into Operating/Investing/Financing (just total Cash Flow)

**Verdict:**

- ⚠️ **Document is confusing:** Uses "Net Income" and "Cash Flow" interchangeably, but they're different
- ✅ **Code is simplified:** Calculates total Cash Flow only (not broken down by activities)
- **Clarification Needed:**
  - For Cash Flow Statement: Should we break down into Operating/Investing/Financing activities?
  - If yes, Operating Cash Flow = Net Income (EBITDA - Interest - Taxes, no Capex)
  - Investing Cash Flow = -Capex
  - Financing Cash Flow = 0 (unless tracked)
  - Net Cash Flow = Operating + Investing + Financing

---

### 7. **Balance Sheet - Cash Calculation Ambiguity**

**Inconsistency:** Document says "Cash Flow = Net Income" for Balance Sheet calculations, but this is circular.

**Document Says:**

- Line 249-253 (Balance Sheet): "Cash for Year N = Cash for Year N-1 + Cash Flow for Year N"
- Line 253: "Note: Cash Flow = Net Income (already calculated in cashflow.ts)"
- Line 439-440: "Cash (Year N) = Cash (Year N-1) + Net Cash Flow (Year N)"

**Problem:**

- Document says "Cash Flow = Net Income" but code calculates "Cash Flow = EBITDA - Capex - Interest - Taxes"
- For Balance Sheet, we need cumulative cash, but which value to use?

**Actual Code:**

- File: `lib/calculations/financial/cashflow.ts`
- Calculates `cashFlow = EBITDA - Capex - Interest - Taxes`
- This is total cash flow (not broken down by activities)
- No cumulative cash calculation exists

**Verdict:**

- ⚠️ **Document is ambiguous:** Says Cash Flow = Net Income, but code calculates differently
- ❌ **Missing:** Cumulative cash calculation doesn't exist (needed for Balance Sheet)
- **Clarification Needed:**
  - For Balance Sheet Cash: Should it be cumulative of "Cash Flow" (EBITDA - Capex - Interest - Taxes)?
  - Or should it be cumulative of "Net Income" (EBITDA - Interest - Taxes, no Capex)?
  - Standard accounting: Balance Sheet Cash = cumulative operating cash flow (excludes Capex from PnL perspective)

---

### 8. **Cash Flow Statement Table - Double Counting Capex**

**Critical Error:** The document's Cash Flow Statement table structure has a logical error.

**Document Shows:**

- Line 396-401 (Cash Flow Table):
  - Operating Activities: Net Income (which includes EBITDA - Capex - Interest - Taxes)
  - Investing Activities: Capex
  - Net Cash Flow = Operating + Investing

**Problem:**

- If Operating = Net Income = EBITDA - Capex - Interest - Taxes
- And Investing = -Capex
- Then Net Cash Flow = (EBITDA - Capex - Interest - Taxes) + (-Capex) = EBITDA - 2×Capex - Interest - Taxes
- **This double-counts Capex** ❌

**Correct Structure Should Be:**

- Operating Cash Flow = EBITDA - Interest - Taxes (NO Capex here)
- Investing Cash Flow = -Capex
- Net Cash Flow = Operating + Investing = EBITDA - Interest - Taxes - Capex

**Verdict:**

- ❌ **Document has logical error:** Cash Flow Statement structure double-counts Capex
- **Clarification Needed:**
  - Should Operating Cash Flow = Net Income = EBITDA - Interest - Taxes (no Capex)?
  - Or should Operating Cash Flow = Cash Flow = EBITDA - Capex - Interest - Taxes (as code currently calculates)?

---

## 📊 FORMULA VALIDATION SUMMARY

### ✅ Formulas That Are CORRECT (Match Code)

1. **Revenue:** ✅
   - Revenue (FR) = Students (FR) × Tuition (FR)
   - Revenue (IB) = Students (IB) × Tuition (IB)
   - Total Revenue = Revenue (FR) + Revenue (IB) (no Other Revenue yet)

2. **EBITDA:** ✅
   - EBITDA = Revenue - Staff Costs - Rent - Opex
   - Capex is correctly excluded from EBITDA

3. **Cash Flow (as currently calculated):** ✅
   - Cash Flow = EBITDA - Capex - Interest - Taxes
   - This matches code implementation

### ⚠️ Formulas That Are INCONSISTENT or UNCLEAR

1. **Net Income:** ❌ **UNCLEAR**
   - Document says: Net Income = EBITDA - Capex - Interest - Taxes
   - Standard accounting: Net Income = EBITDA - Interest - Taxes - Depreciation
   - **Code doesn't calculate "Net Income" separately** - only "Cash Flow"
   - **Decision needed:** Should Net Income exclude Capex (standard accounting)?

2. **Staff Costs Per Curriculum:** ❌ **MISMATCH WITH PRD**
   - Document shows: Staff Costs (FR) and Staff Costs (IB) separately
   - Code calculates: Single combined Staff Cost (not per curriculum)
   - PRD expects: Per-curriculum calculation
   - **Decision needed:** Should Staff Costs be calculated per curriculum?

3. **Cash Flow Statement Breakdown:** ❌ **DOUBLE-COUNTING ERROR**
   - Document structure: Operating = Net Income (includes Capex) + Investing = -Capex = double-counts
   - **Decision needed:** Should Operating exclude Capex?

4. **Balance Sheet Cash:** ⚠️ **AMBIGUOUS**
   - Document says: Cash = cumulative Cash Flow (EBITDA - Capex - Interest - Taxes)
   - Standard accounting: Cash = cumulative operating cash flow (EBITDA - Interest - Taxes, no Capex in PnL)
   - **Decision needed:** Which formula for Balance Sheet Cash?

---

## 🎯 KEY QUESTIONS TO RESOLVE

### Question 1: Net Income vs Cash Flow Terminology

**Current Situation:**

- Code calculates: `Cash Flow = EBITDA - Capex - Interest - Taxes`
- Document calls this "Net Income" (incorrect terminology)

**Standard Accounting:**

- Net Income (PnL) = EBITDA - Interest - Taxes - Depreciation
- Operating Cash Flow = Net Income + Depreciation - Working Capital Changes
- Investing Cash Flow = -Capex
- Net Cash Flow = Operating + Investing + Financing

**Options:**

- **Option A:** Keep current code, but rename "Cash Flow" to "Net Cash Flow" for clarity
- **Option B:** Separate calculations:
  - Net Income (PnL) = EBITDA - Interest - Taxes
  - Operating Cash Flow (Statement) = Net Income
  - Investing Cash Flow (Statement) = -Capex
  - Net Cash Flow = Operating + Investing

**Recommendation:** Option B (aligns with standard accounting, separates PnL from Cash Flow Statement)

---

### Question 2: Capex in PnL Statement

**Current Situation:**

- Document shows Capex as an expense in PnL ❌ (incorrect)
- Code treats Capex as cash outflow ✅ (correct for Cash Flow Statement)

**Standard Accounting:**

- Capex is NOT an expense in PnL
- Depreciation (from Capex) would be the PnL expense
- Capex goes in Cash Flow Statement (Investing Activities)

**Options:**

- **Option A:** Remove Capex from PnL Statement, add Depreciation instead (if tracked)
- **Option B:** Show Capex in PnL anyway (non-standard, but matches current calculation)
- **Option C:** Don't track depreciation, show no Capex in PnL (simplified model)

**Recommendation:** Option C for MVP (no depreciation tracking), Option A for full accounting compliance

---

### Question 3: Staff Costs - Per Curriculum or Combined?

**Current Situation:**

- Code: Single combined Staff Cost calculation
- PRD: Expects per-curriculum Staff Cost calculation
- Document: Shows both separated and combined (inconsistent)

**Options:**

- **Option A:** Keep combined Staff Cost (simpler, matches current code)
- **Option B:** Implement per-curriculum Staff Cost (matches PRD, more granular)

**Recommendation:** Option B (matches PRD expectations, allows better analysis per curriculum)

---

### Question 4: Other Revenue - Required or Optional?

**Current Situation:**

- Code: Does NOT support Other Revenue
- Document: Shows Other Revenue as required
- PRD: Does NOT mention Other Revenue

**Options:**

- **Option A:** Add Other Revenue as input field per year (as document suggests)
- **Option B:** Omit Other Revenue (match current PRD, simpler)

**Recommendation:** Option A (if Other Revenue is actually needed for business), Option B (if PRD is authoritative)

---

### Question 5: Cash Flow Statement Breakdown

**Current Situation:**

- Code: Calculates total Cash Flow only (no breakdown)
- Document: Shows Operating/Investing/Financing breakdown (but with double-counting error)

**Options:**

- **Option A:** Keep total Cash Flow only (simpler, matches code)
- **Option B:** Add Operating/Investing/Financing breakdown:
  - Operating = Net Income = EBITDA - Interest - Taxes
  - Investing = -Capex
  - Financing = 0
  - Net = Operating + Investing + Financing

**Recommendation:** Option B (proper Cash Flow Statement structure, fixes double-counting)

---

## 📋 CORRECTED STRUCTURES (For Validation)

### Profit & Loss Statement (Corrected)

```
PROFIT & LOSS STATEMENT (Income Statement)
┌─────────────────────────────────────────────────┐
│ REVENUE                                         │
│ ├── Revenue (French Curriculum)                 │
│ ├── Revenue (IB Curriculum)                     │
│ ├── Other Revenue (input per year) [IF NEEDED] │
│ └── Total Revenue = FR + IB + Other             │
│                                                 │
│ EXPENSES                                        │
│ ├── Staff Costs                                 │
│ │   ├── Staff Costs (FR) [IF PER-CURRICULUM]   │
│ │   ├── Staff Costs (IB) [IF PER-CURRICULUM]   │
│ │   └── Total Staff Costs                       │
│ ├── Rent                                        │
│ ├── Operating Expenses (Opex)                   │
│ ├── Interest Expense                            │
│ ├── Depreciation [IF TRACKED]                   │
│ └── Taxes                                       │
│                                                 │
│ PROFIT METRICS                                  │
│ ├── EBITDA = Revenue - Staff - Rent - Opex     │
│ ├── EBITDA Margin % = (EBITDA / Revenue) × 100 │
│ ├── Net Income = EBITDA - Interest - Taxes - Depreciation │
│ └── Net Income Margin % = (Net Income / Revenue) × 100 │
│                                                 │
│ NOTE: Capex does NOT appear in PnL             │
│       (Capex goes in Cash Flow Statement)      │
└─────────────────────────────────────────────────┘
```

**Formulas:**

- Net Income = EBITDA - Interest - Taxes - Depreciation (if tracked)
- If no depreciation: Net Income = EBITDA - Interest - Taxes
- **Capex is NOT in PnL** (it's a cash outflow, not an expense)

---

### Cash Flow Statement (Corrected - No Double-Counting)

```
CASH FLOW STATEMENT
┌─────────────────────────────────────────────────┐
│ OPERATING ACTIVITIES                            │
│ ├── Net Income (from PnL)                       │
│ │   └── Net Income = EBITDA - Interest - Taxes  │
│ ├── Adjustments                                 │
│ │   └── Depreciation [IF TRACKED]               │
│ └── Cash from Operations                        │
│     └── = Net Income + Depreciation             │
│                                                 │
│ INVESTING ACTIVITIES                            │
│ ├── Capital Expenditures (Capex)                │
│ └── Cash from Investing = -Capex                │
│                                                 │
│ FINANCING ACTIVITIES                            │
│ ├── Debt Repayments                             │
│ ├── Equity Contributions                        │
│ └── Cash from Financing [IF TRACKED]            │
│                                                 │
│ NET CASH FLOW                                   │
│ Net Cash Flow = Operating + Investing + Financing │
│                                                 │
│ CASH POSITION                                   │
│ ├── Beginning Cash                              │
│ ├── Net Cash Flow                               │
│ └── Ending Cash = Beginning + Net Cash Flow     │
└─────────────────────────────────────────────────┘
```

**Formulas:**

- Operating Cash Flow = Net Income + Depreciation (if tracked, else = Net Income)
- Net Income = EBITDA - Interest - Taxes (NO Capex here)
- Investing Cash Flow = -Capex
- Net Cash Flow = Operating + Investing + Financing
- **No double-counting:** Capex only appears once (in Investing Activities)

---

### Balance Sheet (Needs Clarification)

```
BALANCE SHEET
┌─────────────────────────────────────────────────┐
│ ASSETS                                          │
│ ├── Current Assets                              │
│ │   ├── Cash (cumulative operating cash flow)   │
│ │   └── OR Cash (cumulative net cash flow)?     │
│ ├── Fixed Assets                                │
│ │   ├── Gross Fixed Assets = Accumulated Capex  │
│ │   └── Net Fixed Assets = Gross - Depreciation │
│ └── Total Assets                                │
│                                                 │
│ LIABILITIES                                     │
│ └── Total Liabilities [IF TRACKED]              │
│                                                 │
│ EQUITY                                          │
│ ├── Retained Earnings = Cumulative Net Income   │
│ └── Total Equity                                │
│                                                 │
│ BALANCE CHECK: Assets = Liabilities + Equity    │
└─────────────────────────────────────────────────┘
```

**Question:**

- Should Balance Sheet Cash = Cumulative Operating Cash Flow (excludes Capex)?
- Or = Cumulative Net Cash Flow (includes Capex as outflow)?
- Standard accounting: Cash = cumulative operating cash flow + investing + financing activities

---

## 🚨 CRITICAL DECISIONS NEEDED

### Decision 1: Net Income Calculation ⚠️ **HIGH PRIORITY**

**Question:** What should "Net Income" be in PnL Statement?

**Current Code:** Doesn't calculate Net Income separately - only "Cash Flow"

**Options:**

- **A:** Net Income = EBITDA - Interest - Taxes (standard, no Capex)
- **B:** Net Income = EBITDA - Capex - Interest - Taxes (non-standard, matches current Cash Flow)

**Impact:** Affects PnL Statement structure, Balance Sheet Retained Earnings, and Cash Flow Statement Operating Activities

---

### Decision 2: Staff Costs Structure ⚠️ **MEDIUM PRIORITY**

**Question:** Should Staff Costs be calculated per curriculum or combined?

**Current Code:** Combined (single baseStaffCost)

**PRD Expectation:** Per curriculum (separate teacher ratios, salaries per curriculum)

**Impact:** Affects PnL Statement detail level, analysis granularity

---

### Decision 3: Other Revenue ⚠️ **MEDIUM PRIORITY**

**Question:** Is Other Revenue actually required?

**Current Code:** Not supported
**PRD:** Doesn't mention it
**Document:** Shows as required

**Impact:** Affects Revenue calculation, Total Revenue formula, UI inputs needed

---

### Decision 4: Cash Flow Statement Structure ⚠️ **HIGH PRIORITY**

**Question:** Should Cash Flow Statement have Operating/Investing/Financing breakdown?

**Current Code:** Only total Cash Flow calculated

**Options:**

- **A:** Keep total only (simpler, matches code)
- **B:** Add breakdown (standard accounting, fixes double-counting error)

**Impact:** Affects Cash Flow Statement display, Balance Sheet Cash calculation

---

### Decision 5: Depreciation Tracking ⚠️ **LOW PRIORITY (For MVP)**

**Question:** Should we track depreciation for Balance Sheet Fixed Assets?

**Current Code:** No depreciation tracking

**Impact:** Affects Balance Sheet Fixed Assets calculation, PnL depreciation expense, Cash Flow Statement adjustments

---

## 📊 MY POINT OF VIEW

### Overall Assessment

**The document has several critical inconsistencies that need resolution before implementation:**

1. **Terminology Confusion:** Mixing "Net Income" and "Cash Flow" causes confusion
2. **Accounting Concepts:** Capex incorrectly placed in PnL Statement
3. **Formula Errors:** Cash Flow Statement structure double-counts Capex
4. **PRD Mismatch:** Staff Costs implementation doesn't match PRD expectations
5. **Missing Clarifications:** Several assumptions need validation (Other Revenue, depreciation, debt tracking)

### Recommendation

**Before implementing Financial Statements, resolve:**

1. **Immediate (Critical):**
   - Clarify Net Income vs Cash Flow terminology
   - Fix Cash Flow Statement structure (remove double-counting)
   - Decide: Should PnL show Net Income = EBITDA - Interest - Taxes (no Capex)?
   - Decide: Should Cash Flow Statement have Operating/Investing/Financing breakdown?

2. **Important (Medium Priority):**
   - Confirm: Is Other Revenue required? (PRD doesn't mention it)
   - Decide: Should Staff Costs be per-curriculum? (PRD expects it)
   - Clarify: Balance Sheet Cash = cumulative operating cash flow or net cash flow?

3. **Future (Low Priority):**
   - Depreciation tracking (can be added later)
   - Debt/liabilities tracking (can be added later)
   - Working capital tracking (can be added later)

### Standard Accounting Approach (Recommended)

**For proper financial statements:**

1. **PnL Statement:**
   - Net Income = EBITDA - Interest - Taxes - Depreciation
   - Capex does NOT appear (it's not an expense)

2. **Cash Flow Statement:**
   - Operating = Net Income + Depreciation - Working Capital Changes
   - Investing = -Capex
   - Financing = Debt/Equity activities
   - Net Cash Flow = Operating + Investing + Financing

3. **Balance Sheet:**
   - Cash = Cumulative operating cash flow (can add investing + financing)
   - Fixed Assets = Accumulated Capex - Accumulated Depreciation
   - Retained Earnings = Cumulative Net Income

**This requires code changes:**

- Separate Net Income calculation (EBITDA - Interest - Taxes, no Capex)
- Break down Cash Flow into Operating/Investing/Financing
- Update Balance Sheet calculations to use correct formulas

---

**Document Status:** ⚠️ **Needs Revision** - Multiple inconsistencies identified  
**Next Action:** Resolve critical decisions above before rewriting document  
**Estimated Fix Time:** 2-3 hours to revise document after decisions are made
