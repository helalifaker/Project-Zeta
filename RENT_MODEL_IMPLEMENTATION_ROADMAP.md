# Rent Model Implementation Roadmap
## Frequency Parameter & Partner Model Logic Fix

**Date:** November 16, 2025  
**Status:** ✅ **VERIFIED & READY FOR IMPLEMENTATION**  
**Assigned To:** Junior Developer  
**Estimated Time:** 14-21 hours  
**Verification Status:** ✅ Approved (98% accuracy, 100% feasibility) - See `RENT_MODEL_ROADMAP_VERIFICATION.md`

---

## 📋 Executive Summary

This document provides **EXACT, STEP-BY-STEP** instructions for implementing two critical changes:

1. **Add Frequency Parameter to Fixed Escalation Model** (UI & Validation)
2. **Fix Partner Model Calculation Logic** (Year 1 = yield, Year 2+ = escalation with frequency)

**⚠️ CRITICAL:** Follow this document **EXACTLY**. Do NOT invent or assume anything. If something is unclear, ask before proceeding.

---

## 🎯 Change #1: Add Frequency Parameter to Fixed Escalation

### Objective
Add frequency input field to Fixed Escalation rent model form and validation schema.

### Current State
- ✅ Calculation logic already supports frequency (optional, default: 1)
- ❌ Validation schema missing frequency
- ❌ UI form missing frequency input

### Required Changes

#### Step 1.1: Update Validation Schema

**File:** `lib/validation/rent.ts`  
**Line:** 10-14 (FixedEscalationParamsSchema)

**CURRENT CODE:**
```typescript
const FixedEscalationParamsSchema = z.object({
  baseRent: z.number().positive('Base rent must be positive').finite().max(100000000, 'Base rent cannot exceed 100,000,000 SAR'),
  escalationRate: z.number().min(0, 'Escalation rate cannot be negative').max(1, 'Escalation rate cannot exceed 100%'),
  startYear: z.number().int().min(2023).max(2052),
});
```

**REPLACE WITH:**
```typescript
const FixedEscalationParamsSchema = z.object({
  baseRent: z.number().positive('Base rent must be positive').finite().max(100000000, 'Base rent cannot exceed 100,000,000 SAR'),
  escalationRate: z.number().min(0, 'Escalation rate cannot be negative').max(1, 'Escalation rate cannot exceed 100%'),
  startYear: z.number().int().min(2023).max(2052),
  frequency: z.number().int().min(1, 'Frequency must be at least 1 year').max(5, 'Frequency cannot exceed 5 years').optional(),
});
```

**VERIFICATION:**
- Frequency is optional (`.optional()`)
- Range: 1-5 years
- Integer only (`.int()`)

---

#### Step 1.2: Update UI Form - Add Frequency Input

**File:** `components/versions/costs-analysis/RentPlanForm.tsx`  
**Line:** 153-202 (FixedEscalationParams function)

**CURRENT CODE:**
```typescript
function FixedEscalationParams({ parameters, onUpdate }: ModelParamsProps) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="space-y-2">
        <Label>Base Rent (SAR) *</Label>
        <Input
          type="number"
          min={0}
          step={10000}
          value={String(parameters.baseRent || 1000000)}
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            onUpdate({ baseRent: value });
          }}
          className="font-mono"
        />
      </div>
      <div className="space-y-2">
        <Label>Escalation Rate (%) *</Label>
        <Input
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={String(((parameters.escalationRate as number) || 0.04) * 100)}
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            onUpdate({ escalationRate: value / 100 });
          }}
        />
        <p className="text-xs text-muted-foreground">
          Annual rent increase percentage (e.g., 4% = 0.04)
        </p>
      </div>
      <div className="space-y-2">
        <Label>Start Year</Label>
        <Input
          type="number"
          min={2023}
          max={2052}
          step={1}
          value={String(parameters.startYear || 2028)}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10) || 2028;
            onUpdate({ startYear: value });
          }}
        />
      </div>
    </div>
  );
}
```

**REPLACE WITH:**
```typescript
function FixedEscalationParams({ parameters, onUpdate }: ModelParamsProps) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="space-y-2">
        <Label>Base Rent (SAR) *</Label>
        <Input
          type="number"
          min={0}
          step={10000}
          value={String(parameters.baseRent || 1000000)}
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            onUpdate({ baseRent: value });
          }}
          className="font-mono"
        />
      </div>
      <div className="space-y-2">
        <Label>Escalation Rate (%) *</Label>
        <Input
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={String(((parameters.escalationRate as number) || 0.04) * 100)}
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            onUpdate({ escalationRate: value / 100 });
          }}
        />
        <p className="text-xs text-muted-foreground">
          Annual rent increase percentage (e.g., 4% = 0.04)
        </p>
      </div>
      <div className="space-y-2">
        <Label>Frequency (Years)</Label>
        <Select
          value={String(parameters.frequency || 1)}
          onValueChange={(value) => {
            const freq = parseInt(value, 10) || 1;
            onUpdate({ frequency: freq });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Every 1 year</SelectItem>
            <SelectItem value="2">Every 2 years</SelectItem>
            <SelectItem value="3">Every 3 years</SelectItem>
            <SelectItem value="4">Every 4 years</SelectItem>
            <SelectItem value="5">Every 5 years</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Apply escalation every N years (default: 1 year)
        </p>
      </div>
      <div className="space-y-2">
        <Label>Start Year</Label>
        <Input
          type="number"
          min={2023}
          max={2052}
          step={1}
          value={String(parameters.startYear || 2028)}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10) || 2028;
            onUpdate({ startYear: value });
          }}
        />
      </div>
    </div>
  );
}
```

**VERIFICATION:**
- Added frequency Select dropdown after Escalation Rate
- Options: 1, 2, 3, 4, 5 years
- Default value: 1
- Uses Select component (not Input)

---

#### Step 1.3: Update Default Parameters in Form

**File:** `components/versions/costs-analysis/RentPlanForm.tsx`  
**Line:** 71-74 (handleModelChange function, FIXED_ESCALATION defaults)

**CURRENT CODE:**
```typescript
if (newModel === 'FIXED_ESCALATION') {
  defaults.baseRent = (params.baseRent as number) || 1000000;
  defaults.escalationRate = (params.escalationRate as number) || 0.04;
  defaults.startYear = (params.startYear as number) || 2028;
}
```

**REPLACE WITH:**
```typescript
if (newModel === 'FIXED_ESCALATION') {
  defaults.baseRent = (params.baseRent as number) || 1000000;
  defaults.escalationRate = (params.escalationRate as number) || 0.04;
  defaults.frequency = (params.frequency as number) || 1;
  defaults.startYear = (params.startYear as number) || 2028;
}
```

**VERIFICATION:**
- Added `defaults.frequency = 1` to default parameters

---

#### Step 1.4: Update Parameter Display in RentLens

**File:** `components/versions/costs-analysis/RentLens.tsx`  
**Line:** ~150-180 (RentParametersDisplay function, FIXED_ESCALATION section)

**FIND THIS CODE:**
```typescript
if (rentModel === 'FIXED_ESCALATION') {
  const baseRent = parameters.baseRent as number;
  const escalationRate = parameters.escalationRate as number;
  const startYear = parameters.startYear as number | undefined;
  const frequency = parameters.frequency as number | undefined;

  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <span className="text-muted-foreground">Base Rent:</span>{' '}
        <span className="font-medium">{formatSAR(baseRent || 0)}</span>
      </div>
      <div>
        <span className="text-muted-foreground">Escalation Rate:</span>{' '}
        <span className="font-medium">{formatPercent((escalationRate || 0) * 100)}</span>
      </div>
      {startYear && (
        <div>
          <span className="text-muted-foreground">Start Year:</span>{' '}
          <span className="font-medium">{startYear}</span>
        </div>
      )}
      {frequency && (
        <div>
          <span className="text-muted-foreground">Frequency:</span>{' '}
          <span className="font-medium">{frequency} year{frequency !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}
```

**VERIFICATION:**
- Code already shows frequency if present
- ✅ **NO CHANGES NEEDED** - This is already correct

---

## 🎯 Change #2: Fix Partner Model Calculation Logic

### Objective
Change Partner Model calculation so:
- **Year 1**: Uses yield-based calculation (unchanged)
- **Year 2+**: Uses escalation rate with frequency (like Fixed Escalation)

### Current State (INCORRECT)
- Year 1: ✅ Correct (yield-based)
- Year 2+: ❌ Uses yield growth (incorrect)

### Required Logic

**Year 1 Calculation:**
```
baseRent = (landSize × landPricePerSqm + buaSize × constructionCostPerSqm) × yieldBase
rent(year1) = baseRent
```

**Year 2+ Calculation:**
```
escalations = floor((year - startYear) / frequency)
rent(year) = baseRent × (1 + growthRate)^escalations
```

**Example:**
- Start Year: 2028
- Frequency: 2 years
- Growth Rate: 4% (0.04)

```
Year 2028: baseRent × (1.04)^0 = baseRent (no escalation)
Year 2029: baseRent × (1.04)^0 = baseRent (no escalation yet)
Year 2030: baseRent × (1.04)^1 = baseRent × 1.04 (first escalation)
Year 2031: baseRent × (1.04)^1 = baseRent × 1.04 (same as 2030)
Year 2032: baseRent × (1.04)^2 = baseRent × 1.0816 (second escalation)
```

---

### Required Changes

#### Step 2.1: Update Partner Model Calculation Logic

**File:** `lib/calculations/rent/partner-model.ts`  
**Line:** 168-191 (calculatePartnerModelRent function, year loop)

**CURRENT CODE:**
```typescript
for (let year = startYear; year <= endYear; year++) {
  let rent = baseRent;

  // Apply escalation if growth rate > 0
  if (growth.greaterThan(0)) {
    // Calculate number of escalations: floor((year - startYear) / frequency)
    const yearsFromStart = year - startYear;
    const escalations = Math.floor(yearsFromStart / freq);
    
    // Apply compound growth: rent = baseRent × (1 + growthRate)^escalations
    if (escalations > 0) {
      const growthFactor = new Decimal(1).plus(growth).pow(escalations);
      rent = baseRent.times(growthFactor);
    }
  }

  results.push({
    year,
    landValue,
    constructionCost: constructionValue,
    totalValue,
    rent,
  });
}
```

**REPLACE WITH:**
```typescript
for (let year = startYear; year <= endYear; year++) {
  let rent = baseRent;

  // Year 1: Use base rent (calculated from yield) - no escalation
  // Year 2+: Apply escalation rate with frequency
  const yearsFromStart = year - startYear;
  
  // Only apply escalation for years 2+ (yearsFromStart > 0)
  // AND only if growth rate is set (growthRate > 0)
  if (yearsFromStart > 0 && growth.greaterThan(0)) {
    // Calculate number of escalations based on frequency
    // Example: frequency=2, yearsFromStart=3 → escalations = floor(3/2) = 1
    const escalations = Math.floor(yearsFromStart / freq);
    
    // Apply escalation only if escalations > 0
    // This ensures Year 1 (yearsFromStart=0, escalations=0) uses base rent
    // And Year 2 with frequency=2 (yearsFromStart=1, escalations=0) also uses base rent
    if (escalations > 0) {
      const escalationFactor = Decimal.add(1, growth).pow(escalations);
      rent = baseRent.times(escalationFactor);
    }
  }

  results.push({
    year,
    landValue,
    constructionCost: constructionValue,
    totalValue,
    rent,
  });
}
```

**VERIFICATION:**
- Year 1 (yearsFromStart === 0, escalations === 0): rent = baseRent (no escalation) ✅
- Year 2 with frequency=2 (yearsFromStart=1, escalations=0): rent = baseRent (no escalation yet) ✅
- Year 3 with frequency=2 (yearsFromStart=2, escalations=1): rent = baseRent × (1 + growthRate) ✅
- Escalation calculation: `floor(yearsFromStart / frequency)` ✅
- Formula: `baseRent × (1 + growthRate)^escalations` ✅
- **CRITICAL:** Both `yearsFromStart > 0` AND `escalations > 0` checks are needed

---

#### Step 2.2: Update calculateRentForYear for Partner Model

**File:** `lib/calculations/rent/index.ts`  
**Line:** 115-128 (calculateRentForYear function, PARTNER_MODEL case)

**CURRENT CODE:**
```typescript
case 'PARTNER_MODEL': {
  const p = params as PartnerModelParams;
  const result = calculatePartnerModelBaseRent(
    p.landSize,
    p.landPricePerSqm,
    p.buaSize,
    p.constructionCostPerSqm,
    p.yieldBase
  );
  if (!result.success) {
    return result;
  }
  return { success: true, data: { rent: result.data.toNumber() } };
}
```

**REPLACE WITH:**
```typescript
case 'PARTNER_MODEL': {
  const p = params as PartnerModelParams;
  // Calculate base rent (year 1)
  const baseResult = calculatePartnerModelBaseRent(
    p.landSize,
    p.landPricePerSqm,
    p.buaSize,
    p.constructionCostPerSqm,
    p.yieldBase
  );
  if (!baseResult.success) {
    return baseResult;
  }
  
  // Apply escalation for years 2+
  const yearsFromStart = year - p.startYear;
  if (yearsFromStart > 0) {
    const freq = p.frequency ?? 1;
    const growthRate = p.growthRate ?? 0;
    
    if (growthRate > 0) {
      const escalations = Math.floor(yearsFromStart / freq);
      if (escalations > 0) {
        const escalationFactor = Decimal.add(1, toDecimal(growthRate)).pow(escalations);
        const escalatedRent = baseResult.data.times(escalationFactor);
        return { success: true, data: { rent: escalatedRent.toNumber() } };
      }
    }
  }
  
  return { success: true, data: { rent: baseResult.data.toNumber() } };
}
```

**IMPORT CHECK:**
**File:** `lib/calculations/rent/index.ts`  
**Line:** 1-35 (imports section)

**CHECK IF toDecimal IS ALREADY IMPORTED:**
- Open the file and check the imports section
- If `toDecimal` is already imported from `../decimal-helpers` or `@/lib/calculations/decimal-helpers`, then **DO NOT ADD** the import again
- If `toDecimal` is NOT imported, then **ADD THIS IMPORT:**
  ```typescript
  import { toDecimal } from '../decimal-helpers';
  ```
- **VERIFY THE IMPORT PATH:** Check other files in `lib/calculations/rent/` to see the correct import path pattern

**VERIFICATION:**
- Year 1: Returns base rent
- Year 2+: Applies escalation if growthRate > 0
- Uses frequency parameter
- Import path matches existing pattern in the file

---

#### Step 2.3: Update Validation Schema - Make Frequency Required for Partner Model

**File:** `lib/validation/rent.ts`  
**Line:** 22-28 (PartnerModelParamsSchema)

**CURRENT CODE:**
```typescript
const PartnerModelParamsSchema = z.object({
  landSize: z.number().positive('Land size must be positive').finite().max(1000000, 'Land size cannot exceed 1,000,000 sqm'),
  landPricePerSqm: z.number().positive('Land price must be positive').finite().max(100000, 'Land price cannot exceed 100,000 SAR per sqm'),
  buaSize: z.number().positive('BUA size must be positive').finite().max(1000000, 'BUA size cannot exceed 1,000,000 sqm'),
  constructionCostPerSqm: z.number().positive('Construction cost must be positive').finite().max(100000, 'Construction cost cannot exceed 100,000 SAR per sqm'),
  yieldBase: z.number().min(0, 'Yield cannot be negative').max(1, 'Yield cannot exceed 100%'),
});
```

**REPLACE WITH:**
```typescript
const PartnerModelParamsSchema = z.object({
  landSize: z.number().positive('Land size must be positive').finite().max(1000000, 'Land size cannot exceed 1,000,000 sqm'),
  landPricePerSqm: z.number().positive('Land price must be positive').finite().max(100000, 'Land price cannot exceed 100,000 SAR per sqm'),
  buaSize: z.number().positive('BUA size must be positive').finite().max(1000000, 'BUA size cannot exceed 1,000,000 sqm'),
  constructionCostPerSqm: z.number().positive('Construction cost must be positive').finite().max(100000, 'Construction cost cannot exceed 100,000 SAR per sqm'),
  yieldBase: z.number().min(0, 'Yield cannot be negative').max(1, 'Yield cannot exceed 100%'),
  growthRate: z.number().min(0, 'Growth rate cannot be negative').max(1, 'Growth rate cannot exceed 100%').optional(),
  frequency: z.number().int().min(1, 'Frequency must be at least 1 year').max(5, 'Frequency cannot exceed 5 years'),
});
```

**VERIFICATION:**
- Added `growthRate` as optional (for years 2+ escalation)
- Added `frequency` as **REQUIRED** (not optional)
- Range: 1-5 years
- Integer only

---

#### Step 2.4: Update UI Form - Add Growth Rate and Frequency to Partner Model

**File:** `components/versions/costs-analysis/RentPlanForm.tsx`  
**Line:** 229-309 (PartnerModelParams function)

**CURRENT CODE:**
```typescript
function PartnerModelParams({ parameters, onUpdate }: ModelParamsProps) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Land Size (m²) *</Label>
          <Input
            type="number"
            min={0}
            step={100}
            value={String(parameters.landSize || 10000)}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              onUpdate({ landSize: value });
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Land Price per m² (SAR) *</Label>
          <Input
            type="number"
            min={0}
            step={100}
            value={String(parameters.landPricePerSqm || 5000)}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              onUpdate({ landPricePerSqm: value });
            }}
            className="font-mono"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>BUA Size (m²) *</Label>
          <Input
            type="number"
            min={0}
            step={100}
            value={String(parameters.buaSize || 8000)}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              onUpdate({ buaSize: value });
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Construction Cost per m² (SAR) *</Label>
          <Input
            type="number"
            min={0}
            step={100}
            value={String(parameters.constructionCostPerSqm || 3000)}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              onUpdate({ constructionCostPerSqm: value });
            }}
            className="font-mono"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Yield Base (%) *</Label>
        <Input
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={String(((parameters.yieldBase as number) || 0.045) * 100)}
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            onUpdate({ yieldBase: value / 100 });
          }}
        />
        <p className="text-xs text-muted-foreground">
          Annual yield percentage (e.g., 4.5% = 0.045)
        </p>
      </div>
    </div>
  );
}
```

**REPLACE WITH:**
```typescript
function PartnerModelParams({ parameters, onUpdate }: ModelParamsProps) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Land Size (m²) *</Label>
          <Input
            type="number"
            min={0}
            step={100}
            value={String(parameters.landSize || 10000)}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              onUpdate({ landSize: value });
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Land Price per m² (SAR) *</Label>
          <Input
            type="number"
            min={0}
            step={100}
            value={String(parameters.landPricePerSqm || 5000)}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              onUpdate({ landPricePerSqm: value });
            }}
            className="font-mono"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>BUA Size (m²) *</Label>
          <Input
            type="number"
            min={0}
            step={100}
            value={String(parameters.buaSize || 8000)}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              onUpdate({ buaSize: value });
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Construction Cost per m² (SAR) *</Label>
          <Input
            type="number"
            min={0}
            step={100}
            value={String(parameters.constructionCostPerSqm || 3000)}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              onUpdate({ constructionCostPerSqm: value });
            }}
            className="font-mono"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Yield Base (%) *</Label>
        <Input
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={String(((parameters.yieldBase as number) || 0.045) * 100)}
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            onUpdate({ yieldBase: value / 100 });
          }}
        />
        <p className="text-xs text-muted-foreground">
          Annual yield percentage for Year 1 only (e.g., 4.5% = 0.045)
        </p>
      </div>
      <div className="space-y-2">
        <Label>Growth Rate (%)</Label>
        <Input
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={String(((parameters.growthRate as number) || 0) * 100)}
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            onUpdate({ growthRate: value / 100 });
          }}
        />
        <p className="text-xs text-muted-foreground">
          Escalation rate for years 2+ (e.g., 4% = 0.04). Leave 0 for no escalation.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Frequency (Years) *</Label>
        <Select
          value={String(parameters.frequency || 1)}
          onValueChange={(value) => {
            const freq = parseInt(value, 10) || 1;
            onUpdate({ frequency: freq });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Every 1 year</SelectItem>
            <SelectItem value="2">Every 2 years</SelectItem>
            <SelectItem value="3">Every 3 years</SelectItem>
            <SelectItem value="4">Every 4 years</SelectItem>
            <SelectItem value="5">Every 5 years</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Apply growth rate escalation every N years (required)
        </p>
      </div>
    </div>
  );
}
```

**VERIFICATION:**
- Added Growth Rate input (optional, for years 2+)
- Added Frequency Select dropdown (required)
- Updated Yield Base help text: "Year 1 only"
- Growth Rate help text: "Escalation rate for years 2+"

---

#### Step 2.5: Update Default Parameters in Form

**File:** `components/versions/costs-analysis/RentPlanForm.tsx`  
**Line:** 77-83 (handleModelChange function, PARTNER_MODEL defaults)

**CURRENT CODE:**
```typescript
} else if (newModel === 'PARTNER_MODEL') {
  defaults.landSize = (params.landSize as number) || 10000;
  defaults.landPricePerSqm = (params.landPricePerSqm as number) || 5000;
  defaults.buaSize = (params.buaSize as number) || 8000;
  defaults.constructionCostPerSqm = (params.constructionCostPerSqm as number) || 3000;
  defaults.yieldBase = (params.yieldBase as number) || 0.045;
}
```

**REPLACE WITH:**
```typescript
} else if (newModel === 'PARTNER_MODEL') {
  defaults.landSize = (params.landSize as number) || 10000;
  defaults.landPricePerSqm = (params.landPricePerSqm as number) || 5000;
  defaults.buaSize = (params.buaSize as number) || 8000;
  defaults.constructionCostPerSqm = (params.constructionCostPerSqm as number) || 3000;
  defaults.yieldBase = (params.yieldBase as number) || 0.045;
  defaults.growthRate = (params.growthRate as number) || 0.04;
  defaults.frequency = (params.frequency as number) || 2;
}
```

**VERIFICATION:**
- Added `defaults.growthRate = 0.04` (4% default)
- Added `defaults.frequency = 2` (every 2 years default)

---

#### Step 2.6: Update Parameter Display Labels in RentLens

**File:** `components/versions/costs-analysis/RentLens.tsx`  
**Line:** ~180-220 (RentParametersDisplay function, PARTNER_MODEL section)

**IMPORTANT:** Only update the **LABELS** (text content), keep the existing structure unchanged.

**FIND THIS CODE:**
```typescript
      <div>
        <span className="text-muted-foreground">Yield Base:</span>{' '}
        <span className="font-medium">{formatPercent((yieldBase || 0) * 100)}</span>
      </div>
      {growthRate !== undefined && (
        <div>
          <span className="text-muted-foreground">Growth Rate:</span>{' '}
          <span className="font-medium">{formatPercent(growthRate * 100)}</span>
        </div>
      )}
      {frequency && (
        <div>
          <span className="text-muted-foreground">Growth Frequency:</span>{' '}
          <span className="font-medium">{frequency} year{frequency !== 1 ? 's' : ''}</span>
        </div>
      )}
```

**REPLACE ONLY THE LABELS (3 changes):**

1. **Change "Yield Base:" to "Yield Base (Year 1):"**
   ```typescript
   <span className="text-muted-foreground">Yield Base (Year 1):</span>
   ```

2. **Change "Growth Rate:" to "Growth Rate (Years 2+):" and add condition `&& growthRate > 0`**
   ```typescript
   {growthRate !== undefined && growthRate > 0 && (
     <div>
       <span className="text-muted-foreground">Growth Rate (Years 2+):</span>{' '}
       <span className="font-medium">{formatPercent(growthRate * 100)}</span>
     </div>
   )}
   ```

3. **Change "Growth Frequency:" to "Frequency:"**
   ```typescript
   <span className="text-muted-foreground">Frequency:</span>
   ```

**VERIFICATION:**
- ✅ Only labels updated (3 text changes)
- ✅ Structure remains unchanged
- ✅ Yield Base label: "Yield Base (Year 1)"
- ✅ Growth Rate label: "Growth Rate (Years 2+)" and only shows if > 0
- ✅ Frequency label: "Frequency" (removed "Growth" prefix)

---

## 📊 Data Migration Script

### Objective
Update existing Partner Model versions to include `frequency` parameter (default: 2 years).

### Migration Script

**File:** `prisma/migrations/[timestamp]_add_frequency_to_partner_model.sql`

**CREATE THIS FILE:**
```sql
-- Migration: Add frequency parameter to Partner Model rent plans
-- Date: [Current Date]
-- Description: Adds default frequency=2 to existing Partner Model versions

-- Step 1: Add frequency to Partner Model versions that don't have it
UPDATE rent_plans
SET parameters = jsonb_set(
  parameters,
  '{frequency}',
  '2',
  true
)
WHERE rent_model = 'PARTNER_MODEL'
  AND (parameters->>'frequency') IS NULL;

-- Step 2: Ensure growthRate exists (set default 0.04 if missing)
UPDATE rent_plans
SET parameters = jsonb_set(
  parameters,
  '{growthRate}',
  '0.04',
  true
)
WHERE rent_model = 'PARTNER_MODEL'
  AND (parameters->>'growthRate') IS NULL;

-- Verification query (run this to check results)
-- SELECT 
--   id,
--   rent_model,
--   parameters->>'frequency' as frequency,
--   parameters->>'growthRate' as growthRate
-- FROM rent_plans
-- WHERE rent_model = 'PARTNER_MODEL';
```

**VERIFICATION:**
- Sets frequency = 2 for existing Partner Model versions
- Sets growthRate = 0.04 if missing
- Only updates versions that don't have these parameters

---

## 🧪 Testing Requirements

### Test Cases Required

#### Test 1: Fixed Escalation with Frequency

**File:** `lib/calculations/rent/__tests__/fixed-escalation.test.ts`

**ADD THIS TEST:**
```typescript
it('should apply escalation every 2 years with frequency = 2', () => {
  const params: FixedEscalationParams = {
    baseRent: 1_000_000,
    escalationRate: 0.04, // 4%
    frequency: 2, // Every 2 years
    startYear: 2028,
    endYear: 2033,
  };

  const result = calculateFixedEscalationRent(params);

  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data).toHaveLength(6); // 2028-2033 = 6 years
    
    // 2028-2029: Base rent (no escalation yet)
    expect(result.data[0]?.rent.toNumber()).toBeCloseTo(1_000_000, 0);
    expect(result.data[1]?.rent.toNumber()).toBeCloseTo(1_000_000, 0);
    
    // 2030-2031: First escalation (4% increase)
    expect(result.data[2]?.rent.toNumber()).toBeCloseTo(1_040_000, 0);
    expect(result.data[3]?.rent.toNumber()).toBeCloseTo(1_040_000, 0);
    
    // 2032-2033: Second escalation (4% × 2 = 8.16% total)
    expect(result.data[4]?.rent.toNumber()).toBeCloseTo(1_081_600, 0);
    expect(result.data[5]?.rent.toNumber()).toBeCloseTo(1_081_600, 0);
  }
});
```

---

#### Test 2: Partner Model Year 1 (Yield Only)

**File:** `lib/calculations/rent/__tests__/partner-model.test.ts`

**ADD THIS TEST:**
```typescript
it('should calculate year 1 rent using yield only (no escalation)', () => {
  const params: PartnerModelParams = {
    landSize: 10_000,
    landPricePerSqm: 5_000,
    buaSize: 8_000,
    constructionCostPerSqm: 3_000,
    yieldBase: 0.045, // 4.5%
    growthRate: 0.04, // 4% (should not apply to year 1)
    frequency: 2,
    startYear: 2028,
    endYear: 2028, // Only year 1
  };

  const result = calculatePartnerModelRent(params);

  expect(result.success).toBe(true);
  if (result.success) {
    // Year 1: (10,000 × 5,000 + 8,000 × 3,000) × 0.045 = 3,330,000
    const expectedRent = (10_000 * 5_000 + 8_000 * 3_000) * 0.045;
    expect(result.data[0]?.rent.toNumber()).toBeCloseTo(expectedRent, 0);
  }
});
```

---

#### Test 3: Partner Model Year 2+ (Escalation)

**File:** `lib/calculations/rent/__tests__/partner-model.test.ts`

**ADD THIS TEST:**
```typescript
it('should apply escalation to years 2+ based on frequency', () => {
  const params: PartnerModelParams = {
    landSize: 10_000,
    landPricePerSqm: 5_000,
    buaSize: 8_000,
    constructionCostPerSqm: 3_000,
    yieldBase: 0.045, // 4.5%
    growthRate: 0.04, // 4% escalation
    frequency: 2, // Every 2 years
    startYear: 2028,
    endYear: 2032,
  };

  const result = calculatePartnerModelRent(params);

  expect(result.success).toBe(true);
  if (result.success) {
    const baseRent = (10_000 * 5_000 + 8_000 * 3_000) * 0.045; // 3,330,000
    
    // Year 2028: baseRent (no escalation)
    expect(result.data[0]?.rent.toNumber()).toBeCloseTo(baseRent, 0);
    
    // Year 2029: baseRent (no escalation yet, frequency=2)
    expect(result.data[1]?.rent.toNumber()).toBeCloseTo(baseRent, 0);
    
    // Year 2030: baseRent × 1.04 (first escalation)
    expect(result.data[2]?.rent.toNumber()).toBeCloseTo(baseRent * 1.04, 0);
    
    // Year 2031: baseRent × 1.04 (same as 2030)
    expect(result.data[3]?.rent.toNumber()).toBeCloseTo(baseRent * 1.04, 0);
    
    // Year 2032: baseRent × 1.04^2 (second escalation)
    expect(result.data[4]?.rent.toNumber()).toBeCloseTo(baseRent * 1.0816, 0);
  }
});
```

---

#### Test 4: Partner Model with Zero Growth Rate

**File:** `lib/calculations/rent/__tests__/partner-model.test.ts`

**ADD THIS TEST:**
```typescript
it('should keep rent constant if growthRate is 0', () => {
  const params: PartnerModelParams = {
    landSize: 10_000,
    landPricePerSqm: 5_000,
    buaSize: 8_000,
    constructionCostPerSqm: 3_000,
    yieldBase: 0.045,
    growthRate: 0, // No escalation
    frequency: 2,
    startYear: 2028,
    endYear: 2032,
  };

  const result = calculatePartnerModelRent(params);

  expect(result.success).toBe(true);
  if (result.success) {
    const baseRent = (10_000 * 5_000 + 8_000 * 3_000) * 0.045;
    
    // All years should have same rent (no escalation)
    result.data.forEach((year) => {
      expect(year.rent.toNumber()).toBeCloseTo(baseRent, 0);
    });
  }
});
```

---

#### Test 5: Validation - Frequency Required for Partner Model

**File:** `lib/validation/__tests__/rent.test.ts` (create if doesn't exist)

**ADD THIS TEST:**
```typescript
import { RentPlanBaseSchema } from '@/lib/validation/rent';

it('should require frequency for Partner Model', () => {
  const invalidParams = {
    rentModel: 'PARTNER_MODEL',
    parameters: {
      landSize: 10000,
      landPricePerSqm: 5000,
      buaSize: 8000,
      constructionCostPerSqm: 3000,
      yieldBase: 0.045,
      // frequency missing - should fail
    },
  };

  const result = RentPlanBaseSchema.safeParse(invalidParams);
  expect(result.success).toBe(false);
});
```

---

## ✅ Implementation Checklist

### Phase 1: Fixed Escalation Frequency
- [ ] Step 1.1: Update validation schema (`lib/validation/rent.ts`)
- [ ] Step 1.2: Update UI form (`components/versions/costs-analysis/RentPlanForm.tsx`)
- [ ] Step 1.3: Update default parameters
- [ ] Step 1.4: Verify parameter display (already correct)
- [ ] Test: Fixed Escalation with frequency = 2

### Phase 2: Partner Model Logic Fix
- [ ] Step 2.1: Update calculation logic (`lib/calculations/rent/partner-model.ts`)
- [ ] Step 2.2: Update `calculateRentForYear` (`lib/calculations/rent/index.ts`)
- [ ] Step 2.3: Update validation schema (`lib/validation/rent.ts`)
- [ ] Step 2.4: Update UI form (`components/versions/costs-analysis/RentPlanForm.tsx`)
- [ ] Step 2.5: Update default parameters
- [ ] Step 2.6: Update parameter display (`components/versions/costs-analysis/RentLens.tsx`)
- [ ] Test: Partner Model year 1 (yield only)
- [ ] Test: Partner Model year 2+ (escalation)
- [ ] Test: Partner Model with zero growth rate
- [ ] Test: Validation - frequency required

### Phase 3: Data Migration
- [ ] Create migration script (`prisma/migrations/[timestamp]_add_frequency_to_partner_model.sql`)
- [ ] Test migration on staging database
- [ ] Verify existing Partner Model versions have frequency parameter

### Phase 4: Final Verification
- [ ] Run `npm run type-check` (must pass)
- [ ] Run `npm run lint` (must pass)
- [ ] Run `npm run test` (all tests must pass)
- [ ] Manual test: Create new Fixed Escalation version with frequency
- [ ] Manual test: Create new Partner Model version with growth rate and frequency
- [ ] Manual test: Edit existing Partner Model version
- [ ] Verify calculations in Costs Analysis tab

---

## 🚨 Critical Notes

1. **DO NOT** change parameter names:
   - Keep `growthRate` (not `escalationRate`) for Partner Model
   - Keep `escalationRate` for Fixed Escalation

2. **DO NOT** make frequency optional for Partner Model:
   - It is **REQUIRED** in validation schema
   - Default to 2 in UI form

3. **DO NOT** change calculation logic for Year 1:
   - Year 1 always uses yield-based calculation
   - Only Year 2+ uses escalation
   - **CRITICAL:** Both `yearsFromStart > 0` AND `escalations > 0` checks are needed

4. **DO NOT** skip data migration:
   - Existing Partner Model versions need frequency parameter
   - Migration script is required

5. **DO NOT** modify existing test files unnecessarily:
   - Only add new tests
   - Do not delete existing tests

6. **VERIFY IMPORT PATHS:**
   - Check if `toDecimal` is already imported before adding it
   - Use the same import path pattern as other files in the directory

7. **UPDATE LABELS ONLY:**
   - In Step 2.6, only update the text labels, not the entire structure
   - Keep existing code structure intact

---

## 📝 Questions?

If anything is unclear or you encounter issues:

1. **STOP** implementation
2. **ASK** for clarification
3. **DO NOT** invent solutions

---

**Status:** ✅ **READY FOR IMPLEMENTATION**  
**Priority:** 🔴 **HIGH**  
**Estimated Time:** 14-21 hours

---

**Good luck! Follow this document exactly and you'll succeed.** 🚀

