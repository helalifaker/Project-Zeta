# Staff Cost Base Year Fix - Root Cause Analysis & Solution

## Problem

**Error Message:**
```
[FinancialStatementsWrapper] Failed to calculate staff cost base: "Students projection not found for year 2028 in curriculum IB"
```

**Root Cause:**
The `calculateStaffCostBaseFromCurriculum` function in `lib/calculations/financial/staff-costs.ts` was too strict - it required the exact `baseYear` (2028 for RELOCATION_2028 mode, 2023 for HISTORICAL_BASELINE) to exist in the `studentsProjection` array. However, curriculum plans might have incomplete projections (e.g., missing year 2028 for IB curriculum), causing the calculation to fail.

## Solution

### Fix 1: Resilient Year Lookup (Primary Fix)

**File:** `lib/calculations/financial/staff-costs.ts`

**Changes:**
- Modified the year lookup logic to find the closest available year if the exact `baseYear` is not found
- Prefers years before `baseYear` (more conservative), then years after
- Logs a warning when using a fallback year
- Only fails if `studentsProjection` is completely empty

**Implementation:**
```typescript
// Before: Strict lookup that failed if exact year not found
const yearData = plan.studentsProjection.find((p) => p.year === baseYear);
if (!yearData) {
  return error(`Students projection not found for year ${baseYear}...`);
}

// After: Resilient lookup with fallback to closest year
let yearData = plan.studentsProjection.find((p) => p.year === baseYear);
if (!yearData) {
  // Find closest year (prefer before, then after)
  // ... fallback logic with warning
}
```

### Fix 2: Early Validation with User-Friendly Messages

**File:** `components/versions/financial-statements/FinancialStatementsWrapper.tsx`

**Changes:**
- Added validation before calling `calculateStaffCostBaseFromCurriculum`
- Checks if `baseYear` exists in `studentsProjection` for each curriculum
- Logs a warning with actionable guidance if years are missing
- Allows calculation to proceed (staff-costs function handles fallback gracefully)

**Implementation:**
```typescript
// Validate that studentsProjection includes baseYear for all curricula
const missingYears: Array<{ curriculum: string; year: number }> = [];
for (const cp of curriculumPlans) {
  const hasBaseYear = cp.studentsProjection.some((p) => p.year === baseYear);
  if (!hasBaseYear) {
    missingYears.push({ curriculum: cp.curriculumType, year: baseYear });
  }
}

if (missingYears.length > 0) {
  console.warn(
    `⚠️ [FinancialStatementsWrapper] Missing student projections: ${missingList}. ` +
    `The calculation will use the closest available year, but results may be less accurate. ` +
    `Please update enrollment projections in the Curriculum tab to include year ${baseYear}.`
  );
}
```

## Benefits

1. **Resilient to Incomplete Data**: Calculation no longer fails when exact year is missing
2. **Better User Experience**: Clear warnings guide users to fix data issues
3. **Backward Compatible**: Handles existing incomplete data gracefully
4. **Maintains Accuracy**: Uses closest available year, preferring conservative (earlier) years

## Testing Recommendations

1. **Test with missing baseYear**: Create a version with IB curriculum missing year 2028
2. **Test with empty projection**: Verify error message for completely empty projections
3. **Test with partial years**: Verify closest year selection logic
4. **Test with exact year present**: Ensure normal flow still works

## Related Files

- `lib/calculations/financial/staff-costs.ts` - Core calculation function
- `components/versions/financial-statements/FinancialStatementsWrapper.tsx` - Wrapper component with validation

## Notes

- The fix maintains backward compatibility with existing incomplete data
- Users are warned but not blocked from viewing financial statements
- The calculation uses the closest available year, which may be less accurate but prevents complete failure
- For best accuracy, users should ensure `studentsProjection` includes all required years (2023-2052)

