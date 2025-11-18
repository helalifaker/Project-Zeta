# Change Tax Rate to Zakat Rate - Implementation Guide

**Date:** November 18, 2025  
**Purpose:** Update Admin Settings to reflect Saudi Arabian Zakat (2.5%) instead of generic Tax Rate

---

## 🎯 Changes Required

### Summary
Replace "Tax Rate" field with "Zakat Rate" in the Admin Settings page, update to 2.5% (Saudi law), and adjust all related code references.

---

## 📋 Step-by-Step Implementation

### Step 1: Update Admin Settings UI

**File:** The settings page component (likely `app/settings/page.tsx` or similar)

**Current Code to Find:**
```tsx
// Tax Rate (%)
<Label>Tax Rate (%)</Label>
<Input
  type="number"
  value={settings.taxRate}
  onChange={(e) => handleChange('taxRate', parseFloat(e.target.value))}
/>
<p className="text-sm text-muted-foreground">
  Default tax rate (e.g., 0.15 for 15%)
</p>
```

**Replace With:**
```tsx
// Zakat Rate (%)
<Label>Zakat Rate (%)</Label>
<Input
  type="number"
  value={settings.zakatRate || 0.025}
  onChange={(e) => handleChange('zakatRate', parseFloat(e.target.value))}
  disabled // Optional: disable if rate is fixed by law
  className="bg-muted" // Gray out if disabled
/>
<p className="text-sm text-muted-foreground">
  Zakat rate for Saudi Arabia (fixed at 2.5% by law)
</p>
```

**Alternative (if you want it editable for flexibility):**
```tsx
// Zakat Rate (%)
<Label>Zakat Rate (%)</Label>
<Input
  type="number"
  step="0.001"
  min="0"
  max="0.1"
  value={settings.zakatRate || 0.025}
  onChange={(e) => handleChange('zakatRate', parseFloat(e.target.value))}
/>
<p className="text-sm text-muted-foreground">
  Zakat rate (default 2.5% per Saudi Arabian law)
</p>
```

---

### Step 2: Update Database Schema

**Option A: Rename Column (Recommended)**

```sql
-- Rename taxRate to zakatRate in admin_settings table
UPDATE admin_settings 
SET setting_key = 'zakatRate' 
WHERE setting_key = 'taxRate';

-- Update the value to 2.5% (0.025)
UPDATE admin_settings 
SET setting_value = '0.025'::jsonb 
WHERE setting_key = 'zakatRate';
```

**Option B: Add New Column, Keep Old (Safer Migration)**

```sql
-- Add zakatRate setting
INSERT INTO admin_settings (id, setting_key, setting_value, updated_at)
VALUES (
  gen_random_uuid(),
  'zakatRate',
  '0.025'::jsonb,
  NOW()
)
ON CONFLICT (setting_key) DO UPDATE 
SET setting_value = '0.025'::jsonb;

-- Optional: Mark taxRate as deprecated but keep for backward compatibility
UPDATE admin_settings 
SET setting_value = '0.025'::jsonb 
WHERE setting_key = 'taxRate';
```

---

### Step 3: Update TypeScript Interfaces

**File:** Type definitions (likely `types/settings.ts` or similar)

**Current:**
```typescript
interface AdminSettings {
  cpiRate: number;
  discountRate: number;
  taxRate: number; // ❌ Old
  currency: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
}
```

**Update To:**
```typescript
interface AdminSettings {
  cpiRate: number;
  discountRate: number;
  zakatRate: number; // ✅ New - Saudi Arabian Zakat rate (default 2.5%)
  currency: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  
  // Optional: keep taxRate for backward compatibility
  taxRate?: number; // @deprecated - Use zakatRate instead
}
```

---

### Step 4: Update API Endpoints

**File:** Admin settings API route (likely `app/api/admin/settings/route.ts`)

**Find and Update GET Response:**
```typescript
// Current
return NextResponse.json({
  success: true,
  data: {
    cpiRate: settings.cpiRate,
    discountRate: settings.discountRate,
    taxRate: settings.taxRate, // ❌ Old
    // ...
  }
});

// Update To
return NextResponse.json({
  success: true,
  data: {
    cpiRate: settings.cpiRate,
    discountRate: settings.discountRate,
    zakatRate: settings.zakatRate || 0.025, // ✅ New with default
    // ...
  }
});
```

**Update PATCH/POST Validation:**
```typescript
// Current validation
if (body.taxRate !== undefined) {
  if (typeof body.taxRate !== 'number' || body.taxRate < 0 || body.taxRate > 1) {
    return NextResponse.json(
      { error: 'Invalid tax rate (must be between 0 and 1)' },
      { status: 400 }
    );
  }
}

// Update To
if (body.zakatRate !== undefined) {
  if (typeof body.zakatRate !== 'number' || body.zakatRate < 0 || body.zakatRate > 0.1) {
    return NextResponse.json(
      { error: 'Invalid zakat rate (must be between 0 and 10%)' },
      { status: 400 }
    );
  }
  
  // Optional: Warning if not 2.5%
  if (body.zakatRate !== 0.025) {
    console.warn('Zakat rate set to non-standard value:', body.zakatRate);
  }
}
```

---

### Step 5: Update Financial Calculations

**Files to Update:** All files that currently use `taxRate`

**Search for:**
```bash
grep -r "taxRate" /mnt/project --include="*.ts" --include="*.tsx"
```

**Common Patterns to Update:**

**Pattern 1: Tax Calculation**
```typescript
// Current (wrong for Saudi Arabia)
const taxExpense = taxableIncome * adminSettings.taxRate;

// Update To (Zakat calculation)
const zakatExpense = zakatableAmount * adminSettings.zakatRate;
```

**Pattern 2: In Financial Projection Functions**
```typescript
// Current
interface ProjectionParams {
  // ...
  taxRate: number;
}

// Update To
interface ProjectionParams {
  // ...
  zakatRate: number;
}

// Update function calls
calculateFinancialProjection({
  // ...
  zakatRate: adminSettings.zakatRate || 0.025
});
```

---

### Step 6: Update Documentation

**Files to Update:**
- `PRD.md` - Change references from "tax" to "zakat"
- `API.md` - Update API documentation
- `SCHEMA.md` - Update schema documentation
- Any README or user guides

**Example Change in PRD.md:**
```markdown
# Current
- **Tax Rate**: Default tax rate (e.g., 0.15 for 15%)

# Update To
- **Zakat Rate**: Saudi Arabian Zakat rate (fixed at 2.5% by law)
  - Used for calculating annual Zakat expense
  - Zakat Base = Equity + Non-Current Liabilities - Non-Current Assets
  - Zakat = max(Zakat Base, Net Result Before Zakat) × 2.5%
```

---

## 🧪 Testing Checklist

After making changes, verify:

### UI Testing
- [ ] Admin Settings page displays "Zakat Rate (%)" instead of "Tax Rate (%)"
- [ ] Default value shows 0.025 (2.5%)
- [ ] Help text mentions Saudi Arabian law
- [ ] Field is disabled/grayed out (if you chose that approach)
- [ ] Save button works and persists the value

### API Testing
```bash
# Test GET endpoint
curl http://localhost:3000/api/admin/settings | jq .data.zakatRate

# Test PATCH endpoint
curl -X PATCH http://localhost:3000/api/admin/settings \
  -H "Content-Type: application/json" \
  -d '{"zakatRate": 0.025}'
```

### Database Testing
```sql
-- Verify zakatRate exists
SELECT setting_key, setting_value 
FROM admin_settings 
WHERE setting_key = 'zakatRate';

-- Should return: zakatRate | 0.025
```

### Calculation Testing
- [ ] Financial projections use zakatRate correctly
- [ ] Zakat calculation follows the formula:
  - Zakat Base = Equity + Non-Current Liabilities - Non-Current Assets
  - If Zakat Base > Net Result: Use Zakat Base
  - Else: Use Net Result
  - Zakat = Zakatable Amount × 2.5%
- [ ] P&L shows "Zakat" line instead of "Tax"
- [ ] Balance Sheet provisions include Zakat payable

---

## 📊 Visual Changes

### Before (Current):
```
┌─────────────────────────────────────┐
│ Tax Rate (%)                        │
│ ┌─────────────────────────────────┐ │
│ │ 0.15                            │ │
│ └─────────────────────────────────┘ │
│ Default tax rate (e.g., 0.15 for 15%)│
└─────────────────────────────────────┘
```

### After (Updated):
```
┌─────────────────────────────────────┐
│ Zakat Rate (%)                      │
│ ┌─────────────────────────────────┐ │
│ │ 0.025                  [FIXED]  │ │
│ └─────────────────────────────────┘ │
│ Zakat rate for Saudi Arabia        │
│ (fixed at 2.5% by law)              │
└─────────────────────────────────────┘
```

---

## 🔄 Migration Script

If you need to migrate existing versions/data:

```sql
-- Migration Script: Tax Rate → Zakat Rate
-- Run this in Supabase SQL Editor or via migration file

BEGIN;

-- 1. Rename setting in admin_settings
UPDATE admin_settings 
SET setting_key = 'zakatRate',
    setting_value = '0.025'::jsonb,
    updated_at = NOW()
WHERE setting_key = 'taxRate';

-- 2. If taxRate was stored in versions table (unlikely), update there too
-- ALTER TABLE versions ... (if applicable)

-- 3. Verify the change
SELECT setting_key, setting_value 
FROM admin_settings 
WHERE setting_key IN ('taxRate', 'zakatRate');

-- Expected: Only 'zakatRate' with value 0.025

COMMIT;
```

---

## 📝 Quick Reference: Zakat Calculation

For your reference when implementing financial statements:

```typescript
/**
 * Calculate Zakat expense for Saudi Arabian companies
 * 
 * Method: Greater of Zakat Base or Net Result Before Zakat
 * Rate: 2.5% (fixed by Saudi law)
 */
function calculateZakat(
  equity: number,
  nonCurrentLiabilities: number,
  nonCurrentAssets: number,
  netResultBeforeZakat: number,
  zakatRate: number = 0.025
): number {
  // Step 1: Calculate Zakat Base (Balance Sheet method)
  const zakatBase = equity + nonCurrentLiabilities - nonCurrentAssets;
  
  // Step 2: Determine zakatable amount (greater of two methods)
  const zakatableAmount = Math.max(zakatBase, netResultBeforeZakat);
  
  // Step 3: Calculate Zakat (only if positive)
  const zakat = zakatableAmount > 0 ? zakatableAmount * zakatRate : 0;
  
  return zakat;
}

// Example usage:
const zakat = calculateZakat(
  10_000_000,  // equity
  0,           // non-current liabilities
  2_000_000,   // non-current assets (net fixed assets)
  3_000_000,   // net result before zakat
  0.025        // 2.5%
);

// Result: 
// Zakat Base = 10M + 0 - 2M = 8M
// Net Result = 3M
// Zakatable Amount = max(8M, 3M) = 8M
// Zakat = 8M × 2.5% = 200,000 SAR
```

---

## ✅ Completion Checklist

Before marking this task complete:

- [ ] UI updated: "Tax Rate" → "Zakat Rate"
- [ ] Default value: 0.025 (2.5%)
- [ ] Help text mentions Saudi Arabian law
- [ ] Database updated: taxRate → zakatRate
- [ ] TypeScript interfaces updated
- [ ] API endpoints updated (GET/PATCH)
- [ ] All calculation functions updated
- [ ] Documentation updated (PRD, API docs, etc.)
- [ ] Tests pass (UI, API, calculations)
- [ ] Visual regression check (screenshot matches expected)
- [ ] Migration script run (if needed)
- [ ] Zakat calculation verified with example data

---

## 🚀 Additional Enhancements (Optional)

### Add Zakat Toggle (Enable/Disable)

```tsx
<div className="flex items-center space-x-2">
  <Switch
    checked={settings.zakatEnabled ?? true}
    onCheckedChange={(checked) => handleChange('zakatEnabled', checked)}
  />
  <Label>Enable Zakat Calculation</Label>
</div>
<p className="text-sm text-muted-foreground">
  Toggle Zakat calculation on/off for all versions
</p>
```

### Add Zakat Explanation Section

```tsx
<div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-md">
  <h4 className="font-semibold text-sm mb-2">About Zakat</h4>
  <p className="text-sm text-muted-foreground">
    Zakat is an Islamic religious levy calculated at 2.5% annually.
    In Saudi Arabia, it applies to businesses owned by Saudi/GCC nationals.
    <br /><br />
    <strong>Calculation Method:</strong>
    <br />
    Zakat Base = Equity + Non-Current Liabilities - Non-Current Assets
    <br />
    Zakat = max(Zakat Base, Net Result) × 2.5%
  </p>
</div>
```

---

**Status:** Ready to Implement  
**Estimated Time:** 1-2 hours  
**Priority:** High (needed for accurate Saudi financial statements)
