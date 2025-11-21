# Historical Data - Complete Financial Statements

## Current Issue

The current `historical_actuals` table only has 5 fields:

- Revenue
- Staff Cost
- Rent
- Opex
- Capex

But you need to upload complete financial statements:

1. **P&L (Profit & Loss)**
2. **Balance Sheet**
3. **Cash Flow Statement**

## Proposed Solution

Let me understand what fields you need. Here are the typical fields:

### P&L (Income Statement)

- Revenue (already have)
- Cost of Revenue / COGS
- Gross Profit
- Operating Expenses:
  - Staff Costs (already have)
  - Rent (already have)
  - Marketing
  - Utilities
  - Other Opex (already have as "opex")
- EBITDA
- Depreciation & Amortization
- EBIT
- Interest Expense
- Interest Income
- EBT (Earnings Before Tax)
- Tax / Zakat
- Net Income

### Balance Sheet

- **Assets:**
  - Current Assets:
    - Cash & Cash Equivalents
    - Accounts Receivable
    - Inventory
    - Prepaid Expenses
    - Other Current Assets
  - Non-Current Assets:
    - Property, Plant & Equipment (PP&E)
    - Accumulated Depreciation
    - Intangible Assets
    - Other Non-Current Assets
- **Liabilities:**
  - Current Liabilities:
    - Accounts Payable
    - Short-term Debt
    - Accrued Expenses
    - Deferred Revenue
    - Other Current Liabilities
  - Non-Current Liabilities:
    - Long-term Debt
    - Other Non-Current Liabilities
- **Equity:**
  - Share Capital
  - Retained Earnings
  - Other Equity

### Cash Flow Statement

- Operating Activities:
  - Net Income
  - Depreciation & Amortization
  - Changes in Working Capital
  - Other Operating Cash Flow
- Investing Activities:
  - Capex (already have)
  - Asset Purchases
  - Asset Sales
  - Other Investing Cash Flow
- Financing Activities:
  - Debt Proceeds
  - Debt Repayment
  - Equity Raised
  - Dividends Paid
  - Other Financing Cash Flow
- Net Cash Flow
- Beginning Cash
- Ending Cash

---

## Questions for You

Before I update the schema, please tell me:

### Option 1: Which specific fields do you need?

Please list exactly which fields you want to upload. I'll create the schema accordingly.

### Option 2: Do you have a template Excel file?

If you have an Excel file with the actual structure you use, you can:

1. Share the column headers with me
2. Or paste the first few rows here
3. Or tell me the exact format

### Option 3: Standard Financial Statements

Should I just add ALL the standard fields from P&L, Balance Sheet, and Cash Flow? (This will be a lot of fields - around 40-50 fields)

---

## My Recommendation

**Keep it simple - add only what you actually track:**

I suggest we add the most common/essential fields only:

### Minimal Essential Fields (12 total):

**P&L:**

- Revenue ✅ (already have)
- Staff Cost ✅ (already have)
- Rent ✅ (already have)
- Opex ✅ (already have)
- Depreciation (NEW)
- Interest Expense (NEW)
- Zakat (NEW)
- Net Income (NEW)

**Balance Sheet:**

- Cash (NEW)
- Total Assets (NEW)
- Total Liabilities (NEW)
- Equity (NEW)

**Cash Flow:**

- Capex ✅ (already have)
- Operating Cash Flow (can calculate)
- Investing Cash Flow (can calculate)
- Financing Cash Flow (can calculate)

This would mean adding about 8 new fields to the current 5.

---

## Next Steps

Please tell me:

1. **What fields exactly do you need?** (list them)
2. **Do you have an Excel template** I should match?
3. **Or should I use the minimal essential fields** (12 total) above?

Once you tell me, I'll:

1. Update the `historical_actuals` schema
2. Update the migration
3. Update the UI form
4. Update the Excel import script
5. Update all the calculation logic

Let me know which approach you prefer!
