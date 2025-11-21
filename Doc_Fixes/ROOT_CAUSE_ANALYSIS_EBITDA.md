# ROOT CAUSE ANALYSIS: EBITDA Incorrect Values

## Issue

EBITDA values are showing as extremely negative (~3.6B instead of expected ~6-7M):

- 2028: -3,619,470,186 (expected: ~-6M to 7M)
- 2029: -3,692,164,246 (expected: ~-6M to 7M)

## Investigation

### Code Flow Analysis

1. **Line 397-400** (`projection.ts`):

   ```typescript
   const ebitdaResult = calculateEBITDA(ebitdaParams);
   ```

   - Calculates EBITDA using: Revenue - Staff Costs - Rent - Opex
   - Returns correct EBITDA values

2. **Line 458-468** (`projection.ts`):

   ```typescript
   const ebitdaArray: Decimal[] = [];
   for (let year = 2023; year <= 2052; year++) {
     const ebitdaItem = ebitdaResult.data.find((e) => e.year === year);
     ebitdaArray.push(ebitdaItem?.ebitda || new Decimal(0));
   }
   ```

   - Passes calculated EBITDA to CircularSolver

3. **Line 473-487** (`projection.ts`):

   ```typescript
   const solver = new CircularSolver();
   const solverParams: SolverParams = {
     versionId: params.versionId,
     versionMode,
     revenue: revenueArray,
     ebitda: ebitdaArray, // ← Passing pre-calculated EBITDA
     capex: capexArray,
     // ...
   };
   solverResult = await solver.solve(solverParams);
   ```

   - CircularSolver receives EBITDA as input (it doesn't recalculate it)

4. **Line 663** (`projection.ts`):
   ```typescript
   const projection: YearlyProjection = {
     year,
     revenue: revenueItem.revenue,
     staffCost: staffCostItem.staffCost,
     rent: rentItem.rent,
     opex: opexItem.totalOpex,
     ebitda: ebitdaItem.ebitda, // ← Uses calculateEBITDA result
     // ...
   };
   ```

   - **BUG**: Uses `ebitdaItem.ebitda` from `calculateEBITDA`, NOT from CircularSolver

## Root Cause

**The CircularSolver is NOT recalculating EBITDA** - it just passes through the EBITDA values it receives as input (line 471 of `circular-solver.ts`):

```typescript
const ebitda = params.ebitda[i]; // Just using the input value
```

The CircularSolver's `YearProjection` interface includes `ebitda` field, but it's just storing the value passed in - it doesn't recalculate it.

## Why EBITDA is Wrong

The issue is NOT in the CircularSolver merge - the issue is in **calculateEBITDA** itself or in how data is being passed to it.

### Hypothesis:

Looking at the values:

- Revenue: 75,116,880
- Staff Costs: (68,666,400)
- Expected EBITDA (if rent/opex are zero): ~6.45M
- Actual EBITDA: -3,619,470,186

The actual EBITDA is ~560x too large, suggesting:

1. Rent or Opex values are being multiplied by a large factor (e.g., passed as halalas when expected as SAR)
2. Or values are being accumulated/summed incorrectly

## Next Steps

1. Add console.log to inspect calculated EBITDA values
2. Check if rent/opex values are correct in `calculateEBITDA`
3. Verify the EBITDA formula implementation
4. Check if there's a unit mismatch (SAR vs halalas)
