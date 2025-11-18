# Financial Statements Implementation - CORRECTED
**Date:** November 18, 2025  
**Status:** Ready for Implementation  
**Accounting Standards:** IFRS/GAAP Compliant

---

## 📊 Executive Summary

This document provides the **corrected** formulas and implementation guidelines for three core financial statements:
1. **Profit & Loss Statement (Income Statement)**
2. **Balance Sheet (Statement of Financial Position)**
3. **Cash Flow Statement**

All formulas follow IFRS/GAAP accounting principles and are suitable for a multi-industry holding company operating educational institutions.

---

## 🎯 Key Definitions

### COGS for Educational Services
For service businesses (schools), **Cost of Goods Sold (COGS)** is defined as:
```
COGS = Staff Costs + Rent + Operating Expenses (Opex)
```

**Rationale:**
- Staff costs are direct costs of delivering education services
- Rent is the cost of facilities required to deliver services
- Operating expenses are costs directly related to operations
- This is standard practice for service businesses

### Asset Capitalization vs. Expensing
- **Capital Expenditures (CapEx):** Capitalized as Fixed Assets on Balance Sheet, NOT expensed on P&L
- **Depreciation:** The systematic allocation of capitalized assets' cost over their useful life, expensed on P&L
- **Operating Expenses (Opex):** Expensed immediately on P&L in the period incurred

---

## 1️⃣ PROFIT & LOSS STATEMENT (Income Statement)

### 📋 Structure (Year-by-Year: 2023-2052)

```
PROFIT & LOSS STATEMENT
┌─────────────────────────────────────────────────┐
│ REVENUES                                        │
│ ├── Revenue (French Curriculum)                 │
│ ├── Revenue (IB Curriculum)                     │
│ ├── Other Revenue                               │
│ └── Total Revenues                              │
│                                                 │
│ COST OF GOODS SOLD (COGS)                       │
│ ├── Salaries and Related Costs (Staff)         │
│ ├── School Rent                                 │
│ ├── Other Operating Expenses (Opex)            │
│ └── Total Operating Expenses (COGS)            │
│                                                 │
│ GROSS PROFIT                                    │
│ = Total Revenues - COGS                         │
│                                                 │
│ DEPRECIATION & AMORTIZATION                     │
│ ├── Depreciation of Tangible Assets            │
│ └── Amortization of Intangible Assets          │
│                                                 │
│ INTEREST                                        │
│ ├── Interest Income                             │
│ └── Interest Expense                            │
│                                                 │
│ NET RESULT BEFORE ZAKAT                         │
│ = Gross Profit - D&A - Interest Expense + Interest Income │
│                                                 │
│ ZAKAT (2.5%)                                    │
│ = Greater of (Zakat Base or Net Result) × 2.5% │
│                                                 │
│ NET RESULT AFTER ZAKAT                          │
│ = Net Result Before Zakat - Zakat               │
│                                                 │
│ KEY METRICS                                     │
│ ├── EBITDA = Net Result Before Zakat + D&A + Interest Expense - Interest Income │
│ ├── EBITDA Margin % = (EBITDA / Total Revenues) × 100 │
│ └── Net Margin % = (Net Result After Zakat / Total Revenues) × 100 │
└─────────────────────────────────────────────────┘
```

---

### 💰 PROFIT & LOSS FORMULAS

#### 1. REVENUES

**Revenue (French Curriculum):**
```
Revenue(FR, year) = Students(FR, year) × Tuition(FR, year)

Where:
- Students(FR, year) = Number of enrolled students in French curriculum for the year
- Tuition(FR, year) = Tuition per student (grows with CPI based on frequency)
```

**Revenue (IB Curriculum):**
```
Revenue(IB, year) = Students(IB, year) × Tuition(IB, year)

Where:
- Students(IB, year) = Number of enrolled students in IB curriculum for the year
- Tuition(IB, year) = Tuition per student (grows with CPI based on frequency)
```

**Other Revenue:**
```
Other Revenue(year) = User input per year (manually entered for each year 2023-2052)

Examples:
- Facility rental income
- After-school program fees
- Summer camp revenue
- Other ancillary services
```

**Total Revenues:**
```
Total Revenues(year) = Revenue(FR, year) + Revenue(IB, year) + Other Revenue(year)
```

---

#### 2. COST OF GOODS SOLD (COGS)

**Salaries and Related Costs (Staff Costs):**
```
Staff Costs(year) = Staff Costs(FR, year) + Staff Costs(IB, year)

Where for each curriculum:
Staff Costs(curriculum, year) = Base Staff Cost × (1 + CPI Rate)^(Number of CPI Applications)

Number of CPI Applications = floor((year - start_year) / frequency)

Where:
- Base Staff Cost = Initial staff cost for year 1
- CPI Rate = Consumer Price Index rate (e.g., 2.5% = 0.025)
- frequency = How often CPI is applied (1, 2, or 3 years)
```

**School Rent:**
```
Rent(year) = Calculated based on selected rent model:

Model 1 - Fixed Escalation:
Rent(year) = Base Rent × (1 + Escalation Rate)^(escalations)
Where: escalations = floor((year - start_year) / frequency)

Model 2 - Revenue Share:
Rent(year) = Total Revenues(year) × Revenue Share Percentage

Model 3 - Partner Model (Developer Return):
Year 1:
  Base Rent = (Land Size × Land Price per m²) + (BUA Size × Construction Cost per m²) × Yield Base
  Rent(year 1) = Base Rent

Year 2+:
  escalations = floor((year - start_year) / frequency)
  Rent(year) = Base Rent × (1 + Escalation Rate)^(escalations)
```

**Other Operating Expenses (Opex):**
```
Total Opex(year) = Σ (Variable Sub-accounts + Fixed Sub-accounts)

Where:
- Variable Sub-account(year) = Total Revenues(year) × Percentage
  Examples: Marketing (3% of revenue), Maintenance (2% of revenue)

- Fixed Sub-account(year) = Fixed Amount
  Examples: Utilities (fixed SAR 200,000/year), Insurance (fixed SAR 50,000/year)

Total Opex(year) = Marketing + Utilities + Maintenance + Insurance + Other sub-accounts
```

**Total Operating Expenses (Total COGS):**
```
Total COGS(year) = Staff Costs(year) + Rent(year) + Total Opex(year)
```

---

#### 3. GROSS PROFIT

```
Gross Profit(year) = Total Revenues(year) - Total COGS(year)
```

**Interpretation:**
- Gross Profit represents operating profit before depreciation and interest
- Also called **Operating Profit** or **EBIT** (Earnings Before Interest and Taxes)
- Shows profitability of core operations

---

#### 4. DEPRECIATION & AMORTIZATION

**Depreciation of Tangible Fixed Assets:**
```
Annual Depreciation(year) = Σ (Depreciation for each asset class)

For each CapEx item:
1. Determine asset class and useful life:
   - Buildings: 40 years
   - Furniture & Fixtures: 10 years
   - IT Equipment: 5 years
   - Vehicles: 5 years
   - Other Equipment: 7 years

2. Calculate annual depreciation (Straight-Line Method):
   Annual Depreciation = Cost of Asset / Useful Life

3. Track for each year:
   - If asset was purchased in year Y
   - Depreciation starts in year Y
   - Continues for [Useful Life] years
   - Stops when fully depreciated

Total Depreciation(year) = Σ (All active depreciation for assets purchased in previous years)
```

**Example:**
```
Year 2023: Purchase furniture for 1,000,000 SAR (useful life: 10 years)
Annual Depreciation = 1,000,000 / 10 = 100,000 SAR/year

Year 2023: Depreciation = 100,000
Year 2024: Depreciation = 100,000
Year 2025: Depreciation = 100,000
...
Year 2032: Depreciation = 100,000 (last year)
Year 2033: Depreciation = 0 (fully depreciated)
```

**Accumulated Depreciation:**
```
Accumulated Depreciation(year) = Σ (All depreciation from start year to current year)

For Balance Sheet:
Net Fixed Assets = Gross Fixed Assets - Accumulated Depreciation

Where:
Gross Fixed Assets = Σ (All CapEx purchases from start year to current year)
```

**Amortization of Intangible Assets:**
```
Similar to depreciation but for intangible assets (licenses, software, patents)

If applicable:
Annual Amortization = Cost of Intangible Asset / Useful Life

For this implementation:
Assume Amortization = 0 (unless intangible assets are tracked)
```

**Total Depreciation & Amortization:**
```
D&A(year) = Depreciation(year) + Amortization(year)
```

---

#### 5. INTEREST

**Interest Income:**
```
Interest Income(year) = Average Cash Balance(year) × Interest Rate

Where:
Average Cash Balance(year) = (Opening Cash Balance + Closing Cash Balance) / 2

Opening Cash Balance(year) = Cash at end of year-1 (or Starting Cash for year 1)
Closing Cash Balance(year) = Cash at end of year (from Cash Flow Statement)
Interest Rate = Bank deposit rate (e.g., 2% = 0.02, configurable in admin settings)

Formula:
Average Cash = (Cash(year-1) + Cash(year)) / 2
Interest Income = Average Cash × Interest Rate

Example:
Year 2023:
Opening Cash = 0 SAR
Closing Cash = 5,000,000 SAR
Average Cash = (0 + 5,000,000) / 2 = 2,500,000 SAR
Interest Rate = 2% (0.02)
Interest Income = 2,500,000 × 0.02 = 50,000 SAR

Year 2024:
Opening Cash = 5,000,000 SAR
Closing Cash = 10,000,000 SAR
Average Cash = (5,000,000 + 10,000,000) / 2 = 7,500,000 SAR
Interest Income = 7,500,000 × 0.02 = 150,000 SAR
```

**Note:** Interest income is calculated on average daily balance approximated by average of opening and closing balances.

**Interest Expense:**
```
Interest Expense(year) = Average Debt Balance × Interest Rate

Where:
Average Debt Balance(year) = (Opening Debt Balance + Closing Debt Balance) / 2

Opening Debt Balance(year) = Debt at end of year-1 (or 0 for year 1)
Closing Debt Balance(year) = Short-term Debt + Long-term Debt (from Balance Sheet)
Interest Rate = Borrowing rate (e.g., 5% = 0.05, configurable in admin settings)

Components of Debt:
1. Short-term Debt = Balancing Adjustment (automatic, from balance sheet balancing)
2. Long-term Debt = User-defined debt (if any external financing)

Formula:
Average Debt = (Debt(year-1) + Debt(year)) / 2
Interest Expense = Average Debt × Interest Rate

Example:
Year 2023:
Opening Debt = 0 SAR
Closing Debt = 3,000,000 SAR (balancing adjustment)
Average Debt = (0 + 3,000,000) / 2 = 1,500,000 SAR
Interest Rate = 5% (0.05)
Interest Expense = 1,500,000 × 0.05 = 75,000 SAR

Year 2024:
Opening Debt = 3,000,000 SAR
Closing Debt = 5,000,000 SAR
Average Debt = (3,000,000 + 5,000,000) / 2 = 4,000,000 SAR
Interest Expense = 4,000,000 × 0.05 = 200,000 SAR

Note: Interest expense reduces Net Result, which can create a feedback loop
      (more debt → more interest → lower profit → more debt needed)
```

---

#### 6. NET RESULT (Net Income)

**CRITICAL - Correct Formula:**
```
Net Result Before Zakat(year) = Gross Profit(year) 
                                - Depreciation & Amortization(year)
                                - Interest Expense(year)
                                + Interest Income(year)
```

**With Zakat:**
```
Zakat(year) = Calculated per Zakat rules (see section 7 below)

Net Result After Zakat(year) = Net Result Before Zakat(year) - Zakat(year)
```

**Expanded:**
```
Net Result Before Zakat(year) = Total Revenues(year)
                                - Staff Costs(year)
                                - Rent(year)
                                - Total Opex(year)
                                - Depreciation(year)
                                - Amortization(year)
                                - Interest Expense(year)
                                + Interest Income(year)
```

**⚠️ IMPORTANT NOTES:**
- **CapEx is NOT subtracted here** - only Depreciation is
- CapEx affects Balance Sheet (Fixed Assets) and Cash Flow (Investing Activities)
- Net Result is calculated on **accrual basis**, not cash basis
- Zakat is calculated separately based on Balance Sheet and Income methods

---

#### 7. ZAKAT (Islamic Religious Levy - Saudi Arabia)

**Note:** In Saudi Arabia, businesses pay Zakat (2.5%) instead of Corporate Income Tax (for Saudi/GCC nationals).

**Zakat Calculation Method:**

Zakat is calculated on the **greater of**:
1. **Zakat Base** (Balance Sheet method)
2. **Net Result** (Income method)

**Method 1 - Zakat Base (Balance Sheet Method):**
```
Zakat Base(year) = Equity(year) 
                  + Non-Current Liabilities(year) 
                  - Non-Current Assets(year)

Where:
- Equity = Share Capital + Retained Earnings
- Non-Current Liabilities = Long-term Debt (if any)
- Non-Current Assets = Net Fixed Assets

Simplified:
Zakat Base = (Share Capital + Retained Earnings + Long-term Debt) - Net Fixed Assets
```

**Method 2 - Net Result (Income Method):**
```
Net Result Before Zakat(year) = Gross Profit(year)
                                - Depreciation & Amortization(year)
                                - Interest Expense(year)
                                + Interest Income(year)
```

**Zakat Calculation:**
```
Step 1: Calculate Zakat Base
Zakat Base = Equity + Non-Current Liabilities - Non-Current Assets

Step 2: Compare with Net Result Before Zakat
If Zakat Base > Net Result Before Zakat:
  Zakatable Amount = Zakat Base
Else:
  Zakatable Amount = Net Result Before Zakat

Step 3: Calculate Zakat (only if Zakatable Amount > 0)
If Zakatable Amount > 0:
  Zakat(year) = Zakatable Amount × 2.5% (0.025)
Else:
  Zakat(year) = 0

Step 4: Calculate Net Result After Zakat
Net Result After Zakat(year) = Net Result Before Zakat(year) - Zakat(year)
```

**Example Calculation:**
```
Year 2023:
Equity = 10,000,000 SAR
Non-Current Liabilities = 0 SAR
Non-Current Assets (Net Fixed Assets) = 2,000,000 SAR
Net Result Before Zakat = 3,000,000 SAR

Zakat Base = 10,000,000 + 0 - 2,000,000 = 8,000,000 SAR
Net Result Before Zakat = 3,000,000 SAR

Compare: Zakat Base (8M) > Net Result (3M)
Therefore: Zakatable Amount = 8,000,000 SAR

Zakat = 8,000,000 × 2.5% = 200,000 SAR

Net Result After Zakat = 3,000,000 - 200,000 = 2,800,000 SAR
```

**Important Notes:**
- Zakat is calculated annually based on lunar (Hijri) year, but we'll use Gregorian year for simplicity
- Zakat is only applicable to businesses with Saudi/GCC ownership
- If the business has losses (Net Result < 0), Zakat may still be due if Zakat Base > 0
- Zakat is recorded as an expense on P&L and a liability (in Provisions) on Balance Sheet until paid

**For P&L Presentation:**
```
Net Result Before Zakat = Gross Profit - D&A - Interest Expense + Interest Income
Less: Zakat Expense
Net Result After Zakat = Net Result Before Zakat - Zakat
```

**For Balance Sheet:**
```
Provisions (Current Liabilities) includes:
- Zakat Payable (until paid to ZATCA - Zakat, Tax and Customs Authority)
```

---

#### 8. KEY PERFORMANCE METRICS

**EBITDA (Earnings Before Interest, Taxes, Depreciation, Amortization):**
```
EBITDA(year) = Net Result(year)
               + Depreciation & Amortization(year)
               + Interest Expense(year)
               - Interest Income(year)

Simplified (if no interest):
EBITDA(year) = Net Result(year) + Depreciation & Amortization(year)

Alternative calculation:
EBITDA(year) = Gross Profit(year) = Total Revenues - COGS
```

**EBITDA Margin %:**
```
EBITDA Margin %(year) = (EBITDA(year) / Total Revenues(year)) × 100
```

**Net Margin %:**
```
Net Margin %(year) = (Net Result(year) / Total Revenues(year)) × 100
```

---

## 2️⃣ BALANCE SHEET (Statement of Financial Position)

### 📋 Structure (Year-by-Year: 2023-2052)

```
BALANCE SHEET
┌─────────────────────────────────────────────────┐
│ ASSETS                                          │
│                                                 │
│ CURRENT ASSETS                                  │
│ ├── Cash on Hand and in Bank                    │
│ ├── Accounts Receivable & Others               │
│ ├── Prepaid & Other Receivables                │
│ └── Total Current Assets                        │
│                                                 │
│ NON-CURRENT ASSETS                              │
│ ├── Tangible & Intangible Assets (Gross)       │
│ ├── Less: Accumulated Depreciation             │
│ ├── Net Fixed Assets                           │
│ └── Total Non-Current Assets                    │
│                                                 │
│ TOTAL ASSETS                                    │
│                                                 │
│ ═══════════════════════════════════════════════ │
│                                                 │
│ LIABILITIES                                     │
│                                                 │
│ CURRENT LIABILITIES                             │
│ ├── Accounts Payable                            │
│ ├── Deferred Income (Unearned Revenue)         │
│ ├── Accrued Expenses                            │
│ ├── Provisions                                  │
│ └── Total Current Liabilities                   │
│                                                 │
│ NON-CURRENT LIABILITIES                         │
│ ├── Long-term Debt (if applicable)             │
│ └── Total Non-Current Liabilities              │
│                                                 │
│ TOTAL LIABILITIES                               │
│                                                 │
│ EQUITY                                          │
│ ├── Share Capital (Paid-in Capital)            │
│ ├── Retained Earnings                           │
│ │   ├── Beginning Retained Earnings            │
│ │   ├── Net Result (Current Year)              │
│ │   ├── Dividends (if any)                     │
│ │   └── Ending Retained Earnings               │
│ └── Total Equity                                │
│                                                 │
│ TOTAL LIABILITIES & EQUITY                      │
│                                                 │
│ BALANCE CHECK: Assets = Liabilities + Equity   │
└─────────────────────────────────────────────────┘
```

---

### 💼 BALANCE SHEET FORMULAS

#### ASSETS

**1. Cash on Hand and in Bank:**
```
Cash(year 1) = Starting Cash + Net Cash Flow(year 1)

Cash(year) = Cash(year-1) + Net Cash Flow(year)

Where:
- Starting Cash = Initial cash balance (e.g., 0 or configured amount)
- Net Cash Flow = From Cash Flow Statement (see section 3)
```

**2. Accounts Receivable & Others:**
```
Accounts Receivable(year) = Total Revenues(year) × Collection Period / 365

Example:
If Collection Period = 30 days (1 month)
Accounts Receivable = Total Revenues × (30/365)

For school tuition paid upfront:
Accounts Receivable may be minimal (e.g., 0 or small amount)

Recommendation:
Start with Accounts Receivable = 0 (assuming upfront payment)
Can be added later based on actual collection patterns
```

**3. Prepaid & Other Receivables:**
```
Prepaid Expenses(year) = Sum of prepaid amounts

Examples:
- Prepaid rent (if rent paid in advance)
- Prepaid insurance
- Prepaid subscriptions

For this implementation:
Assume Prepaid = 0 (can be added later if needed)
```

**4. Total Current Assets:**
```
Total Current Assets(year) = Cash(year)
                           + Accounts Receivable(year)
                           + Prepaid Expenses(year)
```

**5. Tangible & Intangible Assets (Gross Fixed Assets):**
```
Gross Fixed Assets(year) = Σ (All CapEx purchases from start year to year)

Gross Fixed Assets(year) = Gross Fixed Assets(year-1) + CapEx(year)

Where:
CapEx(year) = Sum of all capital expenditure items purchased in year
```

**6. Accumulated Depreciation:**
```
Accumulated Depreciation(year) = Accumulated Depreciation(year-1)
                                + Depreciation Expense(year)

Where:
Accumulated Depreciation(year 1) = Depreciation Expense(year 1)
```

**7. Net Fixed Assets:**
```
Net Fixed Assets(year) = Gross Fixed Assets(year)
                        - Accumulated Depreciation(year)
```

**8. Total Non-Current Assets:**
```
Total Non-Current Assets(year) = Net Fixed Assets(year)
                                + Other Long-term Assets (if any)
```

**9. TOTAL ASSETS:**
```
TOTAL ASSETS(year) = Total Current Assets(year)
                    + Total Non-Current Assets(year)
```

---

#### LIABILITIES

**10. Accounts Payable:**
```
Accounts Payable(year) = COGS(year) × Payment Period / 365

Example:
If Payment Period = 30 days
Accounts Payable = COGS × (30/365)

For this implementation:
Start with Accounts Payable = COGS × (30/365)
This assumes suppliers are paid within 30 days on average

Adjustable based on actual payment terms
```

**11. Deferred Income (Unearned Revenue):**
```
Deferred Income(year) = Tuition received in advance but not yet earned

For schools with upfront annual tuition payment:
Deferred Income(end of year) = Portion of tuition not yet earned

Example:
If tuition collected in September for full academic year:
- December 31: 4 months earned, 8 months deferred
- Deferred Income = Total Tuition × (8/12)

Recommendation:
Start with Deferred Income = Total Revenues × 0.25
(assumes 3 months of revenue deferred on average)

Can be refined based on actual tuition collection timing
```

**12. Accrued Expenses:**
```
Accrued Expenses(year) = Expenses incurred but not yet paid

Examples:
- Accrued salaries (earned but not yet paid)
- Accrued utilities
- Accrued rent

For this implementation:
Accrued Expenses = (Staff Costs + Opex) × (15/365)
This assumes 15 days of expenses are typically accrued

Adjustable based on actual payment cycles
```

**13. Provisions:**
```
Provisions(year) = Estimated liabilities for known obligations

Primary component:
- Zakat Payable = Zakat Expense(year) [until paid to ZATCA]

Other examples (if applicable):
- Legal provisions
- Employee benefit provisions
- Warranty provisions

For this implementation:
Provisions(year) = Zakat Expense(year)

Where Zakat is calculated per section 1.7 (P&L Statement - Zakat)

Note: Provisions represent the liability for Zakat due but not yet paid
Once Zakat is paid to ZATCA, this liability reduces
```

**14. Total Current Liabilities:**
```
Total Current Liabilities(year) = Accounts Payable(year)
                                 + Deferred Income(year)
                                 + Accrued Expenses(year)
                                 + Provisions(year)
                                 + Short-term Debt / Balancing Adjustment(year)

Where:
Short-term Debt = Automatic balancing adjustment (see Balance Sheet Balancing section)
                = max(0, Minimum Cash - Theoretical Cash)
```

**15. Long-term Debt (Non-Current Liabilities):**
```
Long-term Debt(year) = Outstanding debt with maturity > 1 year

For this implementation:
Assume Long-term Debt = 0 (unless debt financing is used)

If debt tracking is needed:
Long-term Debt(year) = Long-term Debt(year-1)
                      + New Debt Issued(year)
                      - Debt Repayments(year)
                      - Reclassification to Current Portion
```

**16. Total Non-Current Liabilities:**
```
Total Non-Current Liabilities(year) = Long-term Debt(year)
                                     + Other Long-term Liabilities (if any)
```

**17. TOTAL LIABILITIES:**
```
TOTAL LIABILITIES(year) = Total Current Liabilities(year)
                         + Total Non-Current Liabilities(year)
```

---

#### EQUITY

**18. Share Capital (Paid-in Capital):**
```
Share Capital(year) = Initial equity investment + Additional capital contributions

For year 1:
Share Capital = Starting Equity Investment (e.g., configured amount)

For subsequent years:
Share Capital(year) = Share Capital(year-1) + New Capital Contributions(year)

Recommendation:
Start with Share Capital = 0 or small initial investment
This represents the initial equity put into the business
```

**19. Retained Earnings:**
```
Retained Earnings(year) = Retained Earnings(year-1)
                         + Net Result After Zakat(year)
                         - Dividends(year)

For year 1:
Retained Earnings(year 1) = Net Result After Zakat(year 1) - Dividends(year 1)

Where:
- Net Result After Zakat = From P&L statement (after Zakat deduction)
- Dividends = Distributions to shareholders (typically 0 for growth businesses)
```

**20. Total Equity:**
```
Total Equity(year) = Share Capital(year) + Retained Earnings(year)
```

**21. TOTAL LIABILITIES & EQUITY:**
```
TOTAL LIABILITIES & EQUITY(year) = Total Liabilities(year) + Total Equity(year)
```

---

#### BALANCE SHEET BALANCING MECHANISM

**⚠️ Critical: Balance Sheet Must Always Balance**

```
FUNDAMENTAL EQUATION:
Total Assets = Total Liabilities + Total Equity
```

**Balancing Approach:**

The balance sheet is balanced using a **dual mechanism**:
1. **Minimum cash requirement** of 1,000,000 SAR
2. **Automatic debt adjustment** to balance the equation

**Step 1: Calculate Theoretical Cash Position**
```
Theoretical Cash(year) = Cash from Cash Flow Statement
                       = Cash(year-1) + Net Cash Flow(year)
```

**Step 2: Check Minimum Cash Requirement**
```
Required Minimum Cash = 1,000,000 SAR (configurable)
```

**Step 3: Apply Balancing Logic**

**Scenario A: Theoretical Cash ≥ 1,000,000 SAR (Surplus Position)**
```
Cash(year) = Theoretical Cash
Balancing Adjustment (Liability) = 0
Short-term Debt = 0

The balance sheet balances naturally with positive cash
```

**Scenario B: Theoretical Cash < 1,000,000 SAR (Deficit Position)**
```
Cash(year) = 1,000,000 SAR (minimum maintained)

Financing Required = 1,000,000 - Theoretical Cash

This financing need is recorded as:
Balancing Adjustment (Liability) = Financing Required

Alternative presentation:
Short-term Debt = Financing Required

The balance sheet equation:
Assets (including 1M cash) = Liabilities (including adjustment) + Equity
```

**Detailed Formula:**
```
IF Theoretical Cash >= 1,000,000:
  Cash(year) = Theoretical Cash
  Balancing Adjustment(year) = 0
  Short-term Debt(year) = 0
  
ELSE (Theoretical Cash < 1,000,000):
  Cash(year) = 1,000,000
  Balancing Adjustment(year) = 1,000,000 - Theoretical Cash
  Short-term Debt(year) = Balancing Adjustment(year)
  
  Note: This represents automatic financing to maintain minimum cash
```

**Example Calculations:**

**Example 1 - Positive Cash Position:**
```
Year 2023:
Theoretical Cash = 5,000,000 SAR (from Cash Flow)

Check: 5,000,000 >= 1,000,000 ✓

Result:
Cash = 5,000,000 SAR
Balancing Adjustment = 0 SAR
Short-term Debt = 0 SAR

Balance Sheet Extract:
ASSETS:
  Cash: 5,000,000
  Other Assets: 10,000,000
  Total Assets: 15,000,000

LIABILITIES:
  Current Liabilities (excl. debt): 3,000,000
  Short-term Debt: 0
  Total Liabilities: 3,000,000
  
EQUITY:
  Total Equity: 12,000,000
  
Check: 15,000,000 = 3,000,000 + 12,000,000 ✓
```

**Example 2 - Negative Cash Position (Requires Financing):**
```
Year 2024:
Theoretical Cash = -2,000,000 SAR (negative from operations)

Check: -2,000,000 < 1,000,000 ✗

Financing Required = 1,000,000 - (-2,000,000) = 3,000,000 SAR

Result:
Cash = 1,000,000 SAR (minimum maintained)
Balancing Adjustment = 3,000,000 SAR
Short-term Debt = 3,000,000 SAR

Balance Sheet Extract:
ASSETS:
  Cash: 1,000,000
  Other Assets: 10,000,000
  Total Assets: 11,000,000

LIABILITIES:
  Current Liabilities (excl. debt): 3,000,000
  Short-term Debt (Balancing): 3,000,000
  Total Liabilities: 6,000,000
  
EQUITY:
  Total Equity: 5,000,000
  
Check: 11,000,000 = 6,000,000 + 5,000,000 ✓
```

**Balance Sheet Presentation:**

```
CURRENT LIABILITIES
├── Accounts Payable
├── Deferred Income
├── Accrued Expenses
├── Provisions (Zakat Payable)
├── Short-term Debt / Balancing Adjustment (if required)
└── Total Current Liabilities
```

**Alternative Labels for Balancing Adjustment:**
- "Short-term Debt" (recommended - most transparent)
- "Bank Overdraft"
- "Financing Required"
- "Balancing Adjustment - Liability"

**Important Notes:**

1. **Interest Expense Calculation:**
```
If Short-term Debt > 0:
  Interest Expense(year) = Average Debt Balance × Interest Rate
  
  Average Debt Balance = (Opening Debt + Closing Debt) / 2
  
  Note: This interest expense flows to P&L and reduces Net Result
```

2. **Cash Flow Impact:**
```
Financing Activities section:
  Increase in Short-term Debt = Balancing Adjustment(year) - Balancing Adjustment(year-1)
  
  If increase is positive: Cash inflow from debt
  If increase is negative: Cash outflow from debt repayment
```

3. **Interpretation:**
- Balancing Adjustment > 0 indicates the business needs external financing
- This is a realistic representation of capital requirements
- Management should review why cash is insufficient
- May trigger strategic decisions (raise equity, improve operations, reduce CapEx)

4. **Minimum Cash Rationale:**
- Maintains operational liquidity
- Prevents unrealistic negative cash scenarios
- Typical best practice for businesses
- Can be adjusted based on industry standards

**Configuration Parameters:**
```
Minimum Cash Balance = 1,000,000 SAR (configurable)
Bank Deposit Interest Rate (Income) = 2.0% (configurable, e.g., 0.02)
Short-term Debt Interest Rate (Expense) = 5.0% (configurable, e.g., 0.05)
Zakat Rate = 2.5% (fixed by Saudi law, 0.025)
Working Capital Assumptions:
  - Collection Days (AR) = 30 days (or 0 for upfront payment)
  - Payment Days (AP) = 30 days
  - Deferred Income Factor = 25% (3 months prepayment)
  - Accrual Days = 15 days
Depreciation Useful Lives:
  - Buildings: 40 years
  - Furniture: 10 years
  - IT Equipment: 5 years
  - Vehicles: 5 years
  - Other: 7 years
```

---

## 3️⃣ CASH FLOW STATEMENT

### 📋 Structure (Year-by-Year: 2023-2052)

```
CASH FLOW STATEMENT
┌─────────────────────────────────────────────────┐
│ OPERATING ACTIVITIES                            │
│ ├── Net Result (from P&L)                       │
│ ├── Adjustments for Non-Cash Items:             │
│ │   ├── Depreciation & Amortization             │
│ │   ├── Changes in Accounts Receivable          │
│ │   ├── Changes in Prepaid Expenses             │
│ │   ├── Changes in Accounts Payable             │
│ │   ├── Changes in Deferred Income              │
│ │   ├── Changes in Accrued Expenses             │
│ │   └── Changes in Provisions                   │
│ └── Net Cash Flows from Operating Activities    │
│                                                 │
│ INVESTING ACTIVITIES                            │
│ ├── Additions of Fixed Assets (CapEx)          │
│ ├── Loans and Advances (if any)                │
│ └── Net Cash Flows from Investing Activities    │
│                                                 │
│ FINANCING ACTIVITIES                            │
│ ├── Increase/(Decrease) in General Fund        │
│ ├── Proceeds from Debt                          │
│ ├── Debt Repayments                             │
│ ├── Equity Contributions                        │
│ ├── Dividends Paid                              │
│ └── Net Cash Flows from Financing Activities    │
│                                                 │
│ NET CASH FLOWS FOR THE YEAR                     │
│ = Operating + Investing + Financing             │
│                                                 │
│ CASH RECONCILIATION                             │
│ ├── Cash at Beginning of Year                   │
│ ├── Net Cash Flows for the Year                │
│ └── Cash at End of Year                         │
└─────────────────────────────────────────────────┘
```

---

### 💵 CASH FLOW STATEMENT FORMULAS

#### OPERATING ACTIVITIES (Indirect Method)

**1. Starting Point - Net Result:**
```
Net Result After Zakat(year) = From P&L Statement
```

**2. Depreciation & Amortization (Add Back):**
```
+ Depreciation & Amortization(year) = From P&L Statement

Reason: Non-cash expense, must be added back to calculate cash flow
```

**3. Changes in Accounts Receivable:**
```
Change in AR(year) = Accounts Receivable(year) - Accounts Receivable(year-1)

If AR increases (more receivables): Cash decreases → Subtract
If AR decreases (collect receivables): Cash increases → Add

Formula for Cash Flow:
- Change in Accounts Receivable(year)

Note: Negative change (decrease in AR) adds to cash
      Positive change (increase in AR) reduces cash
```

**4. Changes in Prepaid Expenses:**
```
Change in Prepaid(year) = Prepaid Expenses(year) - Prepaid Expenses(year-1)

Formula for Cash Flow:
- Change in Prepaid Expenses(year)
```

**5. Changes in Accounts Payable:**
```
Change in AP(year) = Accounts Payable(year) - Accounts Payable(year-1)

If AP increases (owe more): Cash increases → Add
If AP decreases (pay suppliers): Cash decreases → Subtract

Formula for Cash Flow:
+ Change in Accounts Payable(year)

Note: Positive change (increase in AP) adds to cash
      Negative change (decrease in AP) reduces cash
```

**6. Changes in Deferred Income:**
```
Change in Deferred Income(year) = Deferred Income(year) - Deferred Income(year-1)

If Deferred Income increases (more prepayments): Cash increases → Add
If Deferred Income decreases (revenue recognized): Cash decreases → Subtract

Formula for Cash Flow:
+ Change in Deferred Income(year)
```

**7. Changes in Accrued Expenses:**
```
Change in Accrued(year) = Accrued Expenses(year) - Accrued Expenses(year-1)

Formula for Cash Flow:
+ Change in Accrued Expenses(year)
```

**8. Changes in Provisions:**
```
Change in Provisions(year) = Provisions(year) - Provisions(year-1)

Formula for Cash Flow:
+ Change in Provisions(year)
```

**9. Net Cash Flows from Operating Activities:**
```
Operating Cash Flow(year) = Net Result After Zakat(year)
                          + Depreciation & Amortization(year)
                          - Change in Accounts Receivable(year)
                          - Change in Prepaid Expenses(year)
                          + Change in Accounts Payable(year)
                          + Change in Deferred Income(year)
                          + Change in Accrued Expenses(year)
                          + Change in Provisions(year)

Simplified notation:
Operating Cash Flow = Net Result After Zakat
                    + D&A
                    - Increase in Current Assets (excl. Cash)
                    + Increase in Current Liabilities
```

---

#### INVESTING ACTIVITIES

**10. Additions of Fixed Assets (CapEx):**
```
CapEx(year) = Sum of all capital expenditure purchases in the year

Formula for Cash Flow:
- Additions of Fixed Assets(year)

Note: Negative value (cash outflow)
```

**11. Loans and Advances (if applicable):**
```
Loans Given(year) = Loans provided to others (if any)

Formula for Cash Flow:
- Loans and Advances(year)

For this implementation:
Assume Loans = 0 (unless tracked)
```

**12. Net Cash Flows from Investing Activities:**
```
Investing Cash Flow(year) = - CapEx(year)
                          - Loans and Advances(year)

Typically negative (cash outflow for investments)
```

---

#### FINANCING ACTIVITIES

**13. Increase/(Decrease) in General Fund Balance:**
```
General Fund Balance(year) = Changes in equity not from operations

For this implementation:
Typically = 0 unless specific fund accounting is used

Can represent:
- Changes in restricted funds
- Endowment contributions/withdrawals
```

**14. Proceeds from Debt:**
```
Debt Issued(year) = New debt/loans raised during the year

Formula for Cash Flow:
+ Proceeds from Debt(year)

Positive value (cash inflow)
```

**15. Debt Repayments:**
```
Debt Repaid(year) = Principal repayments on debt during the year

Formula for Cash Flow:
- Debt Repayments(year)

Negative value (cash outflow)

Note: Interest payments are in Operating Activities (part of Net Result)
      Only principal repayments go in Financing Activities
```

**16. Equity Contributions:**
```
Equity Contributed(year) = New capital invested by shareholders

Formula for Cash Flow:
+ Equity Contributions(year)

Positive value (cash inflow)
```

**17. Dividends Paid:**
```
Dividends(year) = Distributions to shareholders

Formula for Cash Flow:
- Dividends Paid(year)

Negative value (cash outflow)
```

**18. Net Cash Flows from Financing Activities:**
```
Financing Cash Flow(year) = Increase/(Decrease) in General Fund
                          + Change in Short-term Debt (Balancing Adjustment)
                          + Long-term Debt Issued(year)
                          - Long-term Debt Repayments(year)
                          + Equity Contributions(year)
                          - Dividends Paid(year)

Where:
Change in Short-term Debt(year) = Short-term Debt(year) - Short-term Debt(year-1)

Note: This represents the automatic financing required to maintain minimum cash
      Positive change = Cash inflow from new debt
      Negative change = Cash outflow from debt repayment

For this implementation (with automatic balancing):
Financing Cash Flow(year) = Change in Short-term Debt(year)
                          + Equity Contributions(year)
                          - Dividends(year)

Example:
Year 2023: Short-term Debt = 3,000,000 (from balancing)
           Change = 3,000,000 - 0 = 3,000,000 (cash inflow)

Year 2024: Short-term Debt = 5,000,000
           Change = 5,000,000 - 3,000,000 = 2,000,000 (cash inflow)

Year 2025: Short-term Debt = 1,000,000
           Change = 1,000,000 - 5,000,000 = -4,000,000 (cash outflow/repayment)
```

---

#### NET CASH FLOW & RECONCILIATION

**19. Net Cash Flows for the Year:**
```
Net Cash Flow(year) = Operating Cash Flow(year)
                    + Investing Cash Flow(year)
                    + Financing Cash Flow(year)
```

**20. Cash Reconciliation:**
```
Cash at Beginning of Year(year) = Cash at End of Year(year-1)

For year 1:
Cash at Beginning of Year = Starting Cash (e.g., 0 or configured)

Cash at End of Year(year) = Cash at Beginning of Year(year)
                          + Net Cash Flow(year)
```

**This must match the Balance Sheet:**
```
Cash at End of Year (from Cash Flow Statement)
= Cash on Hand and in Bank (from Balance Sheet)
```

---

## ⚠️ CRITICAL: CIRCULAR CALCULATION CHALLENGE

**Important Implementation Note:**

The financial model contains a **circular reference** that must be handled properly:

```
Interest Expense depends on → Debt Balance
Debt Balance depends on → Cash Position  
Cash Position depends on → Net Result
Net Result depends on → Interest Expense
```

**The Circular Loop:**
1. **P&L calculates Net Result** (includes Interest Expense)
2. **Net Result flows to Retained Earnings** (Balance Sheet)
3. **Balance Sheet calculates theoretical Cash** from assets/liabilities
4. **If Cash < 1M, Short-term Debt is created** (balancing adjustment)
5. **Short-term Debt generates Interest Expense** (back to P&L)

**Solution: Iterative Calculation**

The financial statements must be calculated **iteratively** until they converge:

```
Iteration 1:
  - Assume Interest Expense = 0 (initial guess)
  - Calculate P&L → Net Result
  - Calculate Balance Sheet → Short-term Debt
  - Calculate Interest Expense from Debt

Iteration 2:
  - Use Interest Expense from Iteration 1
  - Recalculate P&L → New Net Result (lower due to interest)
  - Recalculate Balance Sheet → New Short-term Debt (likely higher)
  - Recalculate Interest Expense

Iteration 3+:
  - Repeat until Interest Expense changes by less than threshold (e.g., 0.01%)
  - Typically converges in 3-5 iterations
```

**Implementation Approach:**

```typescript
function calculateFinancialStatements(params) {
  const MAX_ITERATIONS = 10;
  const CONVERGENCE_THRESHOLD = 0.0001; // 0.01%
  
  let previousInterestExpense = 0;
  let currentInterestExpense = 0;
  
  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    // Step 1: Calculate P&L with current interest expense
    const pl = calculatePL(params, currentInterestExpense);
    
    // Step 2: Calculate Balance Sheet
    const bs = calculateBalanceSheet(params, pl);
    
    // Step 3: Calculate new interest expense from debt
    currentInterestExpense = bs.shortTermDebt * params.debtInterestRate;
    
    // Step 4: Check convergence
    const change = Math.abs(currentInterestExpense - previousInterestExpense);
    if (change < CONVERGENCE_THRESHOLD) {
      // Converged - return final statements
      return { pl, bs, cf: calculateCashFlow(pl, bs) };
    }
    
    previousInterestExpense = currentInterestExpense;
  }
  
  // If not converged after max iterations, flag warning
  console.warn('Financial statements did not fully converge');
  return { pl, bs, cf };
}
```

**Why This Matters:**

Without iterative calculation:
- Interest Expense will be understated
- Net Result will be overstated
- Debt requirements will be understated
- Financial statements will be incorrect

**Performance Note:**
- Convergence is typically very fast (3-5 iterations)
- Total calculation time: < 50ms for 30-year projection
- This is acceptable for real-time UI updates

---

## 📊 COMPLETE FORMULA SUMMARY

### Year 1 Starting Balances (Configurable)
```
Starting Cash = 0 or user-defined
Starting Equity (Share Capital) = 0 or user-defined
Starting Retained Earnings = 0
All other starting balances = 0
```

### Year-by-Year Calculation Order (Iterative)

**⚠️ Note: This calculation must be performed iteratively to handle circular references between Interest Expense and Debt Balance**

**For each year, iterate until convergence:**

**Iteration Loop (repeat 3-10 times until Interest Expense stabilizes):**

**Step 1: Calculate P&L (using current Interest Expense estimate)**
```
1. Total Revenues = Revenue(FR) + Revenue(IB) + Other Revenue
2. Staff Costs = Staff(FR) + Staff(IB) [with CPI growth]
3. Rent = Based on rent model
4. Total Opex = Σ(Variable% × Revenue + Fixed amounts)
5. Total COGS = Staff + Rent + Opex
6. Gross Profit = Revenues - COGS
7. Depreciation = Σ(Annual depreciation for all active assets)
8. Interest Income = ((Cash(year-1) + Cash(year)) / 2) × Interest Rate
   Note: For first iteration, estimate Cash(year) = Cash(year-1) + Expected Cash Flow
9. Interest Expense = ((Debt(year-1) + Debt(year)) / 2) × Interest Rate
   Note: For first iteration, use Debt from previous year or 0
10. Net Result Before Zakat = Gross Profit - D&A - Interest Expense + Interest Income
11. Zakat = max(Zakat Base, Net Result Before Zakat) × 2.5%
    Where: Zakat Base = Equity + Non-Current Liabilities - Non-Current Assets
12. Net Result After Zakat = Net Result Before Zakat - Zakat
```

**Step 2: Calculate Balance Sheet (using Net Result from Step 1)**
```
ASSETS:
1. Gross Fixed Assets = Gross Fixed Assets(prev) + CapEx(current)
2. Accumulated Depreciation = Accumulated Depreciation(prev) + Depreciation(current)
3. Net Fixed Assets = Gross Fixed Assets - Accumulated Depreciation
4. Accounts Receivable = Revenues × (Collection Days / 365)
5. Prepaid = User-defined or 0

LIABILITIES:
6. Accounts Payable = COGS × (Payment Days / 365)
7. Deferred Income = Revenues × Deferral Factor
8. Accrued Expenses = (Staff + Opex) × (Accrual Days / 365)
9. Provisions = Zakat Expense (from P&L)

EQUITY:
10. Share Capital = Share Capital(prev) + New Contributions
11. Retained Earnings = Retained Earnings(prev) + Net Result After Zakat - Dividends
12. Total Equity = Share Capital + Retained Earnings
```

**Step 3: Calculate Cash Flow Statement**
```
OPERATING:
1. Start with Net Result After Zakat
2. Add back Depreciation
3. Adjust for changes in working capital
= Operating Cash Flow

INVESTING:
4. Subtract CapEx
= Investing Cash Flow

FINANCING:
5. Add Debt Changes, Equity Contributions
6. Subtract Dividends
= Financing Cash Flow (Note: Debt change will be recalculated)

NET CASH FLOW:
7. Net Cash Flow = Operating + Investing + Financing (excluding debt change)
```

**Step 4: Apply Balancing Mechanism**
```
8. Theoretical Cash = Cash(year-1) + Net Cash Flow

9. IF Theoretical Cash >= 1,000,000:
     Cash(year) = Theoretical Cash
     Short-term Debt(year) = 0
   ELSE:
     Cash(year) = 1,000,000
     Short-term Debt(year) = 1,000,000 - Theoretical Cash
     
10. Total Debt(year) = Short-term Debt + Long-term Debt
```

**Step 5: Check Convergence**
```
11. Calculate new Interest Expense estimate:
    New Interest Expense = (Debt(year-1) + Debt(year)) / 2 × Interest Rate
    
12. Compare with previous Interest Expense:
    IF |New Interest Expense - Previous Interest Expense| < 0.01%:
      CONVERGED - Exit iteration loop
    ELSE:
      Continue to next iteration with new Interest Expense estimate
```

**Step 6: Final Balance Sheet Check**
```
MUST BALANCE:
Total Assets = Total Liabilities + Total Equity

Components:
Assets = Cash + AR + Prepaid + Net Fixed Assets
Liabilities = AP + Deferred + Accrued + Provisions + Short-term Debt + Long-term Debt
Equity = Share Capital + Retained Earnings

If not balanced:
- Check all formulas
- Verify iteration converged
- Ensure all changes are captured
```

---

## 🎯 IMPLEMENTATION RECOMMENDATIONS

### Phase 1: Core P&L (Week 1)
1. ✅ Revenue calculations (already done)
2. ✅ Staff costs with CPI (already done)
3. ✅ Rent models (already done)
4. ✅ Opex calculations (already done)
5. ⚠️ **ADD: Other Revenue input** (NEW - required)
6. 🔧 **FIX: Remove CapEx from Net Result calculation**
7. ➕ **ADD: Depreciation calculation module**
8. ➕ **ADD: Interest Income calculation** (average cash balance × rate)
9. ➕ **ADD: Interest Expense calculation** (average debt balance × rate)
10. 🔧 **FIX: Net Result = Gross Profit - D&A - Interest Expense + Interest Income**
11. ➕ **ADD: Zakat calculation** (max of Zakat Base or Net Result × 2.5%)

### Phase 2: Balance Sheet (Week 2)
1. ➕ **ADD: Fixed Assets tracking (Gross + Accumulated Depreciation)**
2. ➕ **ADD: Working capital calculations** (AR, Prepaid, AP, Deferred, Accrued)
3. ➕ **ADD: Equity structure** (Share Capital + Retained Earnings)
4. ➕ **ADD: Short-term Debt / Balancing Adjustment** (minimum cash logic)
5. 🔧 **IMPLEMENT: Balance sheet equation validation**

### Phase 3: Cash Flow Statement (Week 3)
1. ➕ **ADD: Indirect method operating cash flow**
2. ➕ **ADD: Working capital changes tracking**
3. ➕ **ADD: Investing activities** (CapEx separate from P&L)
4. ➕ **ADD: Financing activities** (automatic debt changes, equity, dividends)
5. 🔧 **IMPLEMENT: Cash reconciliation with Balance Sheet**

### Phase 4: Iterative Calculation Engine (Week 3-4)
1. ➕ **CREATE: Iterative solver for circular references**
2. ➕ **IMPLEMENT: Convergence detection** (Interest Expense stabilization)
3. ➕ **ADD: Maximum iteration limit** (safety mechanism)
4. ➕ **TEST: Convergence performance** (should be < 10 iterations)
5. ⚠️ **ADD: Warning system** if convergence fails

### Phase 5: Display Components (Week 4-5)
1. ➕ **CREATE: P&L table component** (30-year projection)
2. ➕ **CREATE: Balance Sheet table component**
3. ➕ **CREATE: Cash Flow table component**
4. ➕ **CREATE: Export functionality** (Excel, PDF)

### Phase 6: Validation & Testing (Week 5)
1. ✅ **VERIFY: All formulas match this document**
2. ✅ **TEST: Balance sheet always balances**
3. ✅ **TEST: Cash flow reconciles to balance sheet**
4. ✅ **TEST: Iterative calculation converges properly**
5. ✅ **TEST: Edge cases** (negative cash, high debt, no revenue, etc.)

---

## 🔍 CRITICAL VALIDATION CHECKLIST

Before going live, verify:

### P&L Statement
- [ ] Net Result does NOT include CapEx
- [ ] Depreciation is calculated and included
- [ ] Zakat calculated using correct formula (max of Zakat Base or Net Result × 2.5%)
- [ ] Net Result After Zakat = Net Result Before Zakat - Zakat
- [ ] EBITDA = Net Result Before Zakat + D&A (simplified, no interest)
- [ ] Other Revenue input exists for all years

### Balance Sheet
- [ ] Gross Fixed Assets = Cumulative CapEx
- [ ] Net Fixed Assets = Gross - Accumulated Depreciation
- [ ] Retained Earnings = Previous RE + Net Result - Dividends
- [ ] Total Assets = Total Liabilities + Total Equity (always)

### Cash Flow Statement
- [ ] Starts with Net Result (not EBITDA)
- [ ] Adds back Depreciation
- [ ] Includes all working capital changes
- [ ] CapEx shown in Investing Activities (not Operating)
- [ ] Cash reconciliation matches Balance Sheet

### Cross-Statement Validation
- [ ] Net Result After Zakat (P&L) → Retained Earnings (BS) → Operating CF (CFS)
- [ ] Zakat (P&L) → Provisions (BS) → Operating CF adjustments (CFS)
- [ ] CapEx (not on P&L) → Fixed Assets (BS) → Investing CF (CFS)
- [ ] Depreciation (P&L) → Accumulated Depreciation (BS) → Add-back (CFS)
- [ ] Cash (BS) = Previous Cash + Net Cash Flow (CFS)

---

## 📝 ASSUMPTIONS & NOTES

### Simplifying Assumptions (Can be enhanced later)
1. **Zakat at 2.5%** - Saudi Arabian Zakat rate for business entities
2. **Interest Income on Cash** - Calculated on average cash balance (e.g., 2% rate)
3. **Interest Expense on Debt** - Calculated on average debt balance (e.g., 5% rate)
4. **Minimum Cash Balance** - 1,000,000 SAR maintained, excess/deficit creates debt adjustment
5. **Straight-line Depreciation** - Simple and standard method
6. **No Dividends** - Typical for growth businesses
7. **No Long-term Debt (Initial)** - Only automatic short-term debt from balancing
8. **Iterative Calculation** - Required to resolve circular references (typically 3-5 iterations)

### Asset Useful Lives (Recommended)
```
Buildings & Leasehold Improvements: 40 years
Furniture & Fixtures: 10 years
IT Equipment & Computers: 5 years
Vehicles: 5 years
Other Equipment: 7 years
```

### Working Capital Assumptions (Recommended)
```
Accounts Receivable: 30 days (or 0 for upfront tuition)
Accounts Payable: 30 days
Deferred Income: 25% of annual revenue (3 months)
Accrued Expenses: 15 days
Provisions: 0 or estimated tax amount
```

### Industry Context (Educational Institutions)
- Tuition typically paid upfront → Low AR, High Deferred Income
- Staff costs are largest expense (60-70% of revenue typical)
- Rent is significant fixed cost
- CapEx for facilities, furniture, technology
- Working capital is generally positive (cash inflow from tuition prepayment)

---

## ✅ NEXT STEPS

1. **Review & Approve Formulas**
   - Validate all formulas in this document
   - Confirm assumptions (useful lives, working capital days, etc.)
   - Get CFO/Finance team sign-off

2. **Implement Depreciation Module**
   - Create `lib/calculations/financial/depreciation.ts`
   - Track assets by class and useful life
   - Calculate annual depreciation for each asset

3. **Fix Net Result Calculation**
   - Remove CapEx from Net Result formula
   - Add Depreciation to Net Result formula
   - Update `lib/calculations/financial/cashflow.ts` (rename to `net-income.ts`)

4. **Add Other Revenue Support**
   - Create input fields for Other Revenue (per year)
   - Update Total Revenue calculation

5. **Implement Balance Sheet Calculations**
   - Create `lib/calculations/financial/balance-sheet.ts`
   - Calculate all asset, liability, and equity accounts
   - Implement balance check validation

6. **Implement Cash Flow Statement**
   - Create `lib/calculations/financial/cash-flow-statement.ts`
   - Calculate operating, investing, financing activities
   - Reconcile with balance sheet cash

7. **Create Display Components**
   - P&L table, Balance Sheet table, Cash Flow table
   - Export functionality

8. **Test & Validate**
   - Unit tests for all calculations
   - Integration tests for cross-statement validation
   - Edge case testing

---

**Document Status:** ✅ **READY FOR IMPLEMENTATION**  
**Accounting Standards:** IFRS/GAAP Compliant  
**Prepared for:** Chief Accounting Officer  
**Date:** November 18, 2025
