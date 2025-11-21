# Infinite Render Loop - Diagnostic Report

**Date**: 2025-11-20
**Status**: CRITICAL ISSUES IDENTIFIED
**Affected Components**: 2 Priority 1 components with high-risk patterns

---

## Executive Summary

Through systematic code analysis of Priority 1 components, I have identified **2 CRITICAL anti-patterns** that are likely causing the "Too many re-renders" error. Both involve improper useEffect dependency management leading to infinite loops.

---

## Critical Issue #1: Settings Component

**File**: `/Users/fakerhelali/Desktop/Project Zeta/components/settings/Settings.tsx`
**Lines**: 51-85
**Severity**: HIGH

### Anti-Pattern Detected

```tsx
useEffect(() => {
  if (isInitialized) return;

  const storeState = useSettingsStore.getState();
  const tabsToMark: string[] = [];

  if (initialSettings && !storeState.settings) {
    useSettingsStore.setState({ settings: initialSettings });
    tabsToMark.push('settings');
  }
  // ... more setState calls ...

  if (tabsToMark.length > 0) {
    setLoadedTabs((prev) => [...prev, ...tabsToMark.filter((t) => !prev.includes(t))]);
  }

  setIsInitialized(true);
}, [
  isInitialized,
  initialSettings,
  initialUsers,
  initialAuditLogs,
  initialSystemHealth,
  initialUsersTotal,
  initialAuditLogsTotal,
]);
```

### Why This Causes Infinite Loop

1. **`isInitialized` in dependency array**: The effect depends on `isInitialized`, which the effect itself sets to `true`
2. **Flow**:
   - Component renders → `isInitialized = false`
   - Effect runs → Sets `isInitialized = true`
   - State changes → Component re-renders
   - Effect checks dependencies → `isInitialized` changed from `false` to `true`
   - Effect runs again (even though early return prevents execution, React still marks it as changed)
   - This can cause issues in React Strict Mode or if props change slightly

### Root Cause

**Anti-Pattern Type**: #4 - Effect with wrong dependencies
**Specific Issue**: State variable that is SET by the effect is ALSO in the dependency array

### Recommended Fix

Remove `isInitialized` from the dependency array. Use a ref instead:

```tsx
const initializedRef = useRef(false);

useEffect(() => {
  if (initializedRef.current) return;
  initializedRef.current = true;

  // ... rest of logic ...
}, [
  initialSettings,
  initialUsers,
  initialAuditLogs,
  initialSystemHealth,
  initialUsersTotal,
  initialAuditLogsTotal,
]);
```

**Why this works**: Refs don't trigger re-renders when changed, breaking the dependency cycle.

---

## Critical Issue #2: FinancialStatementsWrapper Component

**File**: `/Users/fakerhelali/Desktop/Project Zeta/components/versions/financial-statements/FinancialStatementsWrapper.tsx`
**Lines**: 169-353
**Severity**: CRITICAL

### Anti-Pattern Detected

```tsx
// Effect #1 (lines 68-154): Fetches data and sets historicalActuals
useEffect(() => {
  async function fetchData() {
    // ... fetch logic ...
    setHistoricalActuals(historicalArray); // Sets state
  }
  fetchData();
}, [version.id]);

// Effect #2 (lines 169-353): Depends on historicalActuals
useEffect(() => {
  async function calculateProjection() {
    // ... calculation logic ...
    setProjectionData({ ... }); // Sets state
  }
  calculateProjection();
}, [version, adminSettings, otherRevenue, historicalActuals]); // ⚠️ Depends on historicalActuals
```

### Why This Causes Infinite Loop

1. **Cascading Effect Chain**:
   - Effect #1 runs → Sets `historicalActuals`
   - `historicalActuals` changes → Effect #2 runs
   - Effect #2 calls `setProjectionData` → State changes → Re-render
   - On re-render, if `version`, `adminSettings`, or `otherRevenue` are **new object references** (common in React), Effect #2 runs AGAIN
   - This creates an infinite loop if props are not properly memoized

2. **Object Reference Instability**:
   - `version` is likely a new object on each render (from props)
   - `adminSettings` is also likely a new object
   - Even if values are the same, `{}  !== {}` in JavaScript
   - This causes Effect #2 to run on EVERY render

### Root Cause

**Anti-Pattern Type**: #4 - Effect with wrong dependencies + Object reference instability
**Specific Issues**:

- Cascading effects (one effect triggers another via shared state)
- Non-primitive dependencies without memoization (`version`, `adminSettings`, `otherRevenue`, `historicalActuals` are all objects)
- Heavy async calculation (calculateFullProjection) running on every render

### Recommended Fix

**Option 1**: Use `useMemo` to stabilize object references:

```tsx
const versionId = version.id; // Extract primitive
const adminSettingsMemo = useMemo(
  () => adminSettings,
  [adminSettings.cpiRate, adminSettings.discountRate, adminSettings.zakatRate]
);

useEffect(() => {
  // ... calculation logic ...
}, [versionId, adminSettingsMemo, otherRevenue, historicalActuals]);
```

**Option 2** (RECOMMENDED): Merge the two effects into one and use refs for intermediate state:

```tsx
useEffect(() => {
  let mounted = true;

  async function fetchAndCalculate() {
    // Fetch data
    const historicalData = await fetchHistoricalData();
    if (!mounted) return;

    // Calculate projection using fetched data (no intermediate state)
    const projection = await calculateProjection(historicalData);
    if (!mounted) return;

    setProjectionData(projection);
  }

  fetchAndCalculate();

  return () => {
    mounted = false;
  };
}, [version.id]); // Only depend on primitive versionId
```

**Why this works**:

- Eliminates cascading effects
- Reduces number of re-renders
- Only runs when version actually changes (by ID, not object reference)
- Uses cleanup function to prevent setState on unmounted component

---

## Additional Issues Found (Lower Priority)

### VersionDetail.tsx - Lines 87-135

**Issue**: Similar pattern to Settings.tsx with `settingsFetchedRef.current` check, but handled correctly (not in dependencies).

**Status**: ✅ No fix needed

### FinancialStatements.tsx - Lines 76-92

**Issue**: Fetches historical data on every `props.versionId` change.

**Status**: ✅ Acceptable pattern (only depends on primitive `versionId`)

---

## Testing Strategy

### Phase 1: Add Diagnostic Logging

**Status**: ✅ COMPLETE

Added `useRenderLogger` hook to:

- `components/settings/Settings.tsx`
- `components/versions/VersionDetail.tsx`
- `components/versions/financial-statements/FinancialStatements.tsx`
- `components/versions/financial-statements/FinancialStatementsWrapper.tsx`

### Phase 2: Run Dev Server and Reproduce

**Next Steps**:

1. Start dev server: `npm run dev`
2. Navigate to `/settings` page
3. Check browser console for render counts
4. Expected: Settings component will show >50 renders
5. Navigate to any version detail page (e.g., `/versions/[id]`)
6. Switch to "Financials" tab
7. Expected: FinancialStatementsWrapper will show >50 renders

### Phase 3: Apply Fixes

**Priority Order**:

1. Fix FinancialStatementsWrapper (CRITICAL - affects version pages)
2. Fix Settings component (HIGH - affects /settings page)
3. Test both pages after each fix
4. Verify render counts < 10

### Phase 4: Regression Tests

After fixes are applied, create tests:

```tsx
// __tests__/settings.test.tsx
describe('Settings Component', () => {
  it('should not re-render more than 5 times on mount', () => {
    let renderCount = 0;
    const TestWrapper = () => {
      renderCount++;
      return <Settings />;
    };

    render(<TestWrapper />);

    // Wait for effects to settle
    await waitFor(() => expect(renderCount).toBeLessThan(6));
  });
});
```

---

## Recommendation

**IMMEDIATE ACTION REQUIRED**:

1. Apply fix to `FinancialStatementsWrapper.tsx` (Option 2 - Merge effects)
2. Apply fix to `Settings.tsx` (Use ref instead of isInitialized state)
3. Test on dev server
4. If successful, remove diagnostic logging
5. Create regression tests

**ESTIMATED FIX TIME**: 30-45 minutes
**RISK**: Medium (affects version pages and settings, but fixes are straightforward)

---

## Appendix: All 4 Anti-Patterns

For reference, here are the anti-patterns we were looking for:

### Anti-Pattern #1: setState in render body

```tsx
// ❌ BAD
function Component() {
  const [x, setX] = useState(0);
  setX(1); // Called during render = infinite loop
  return <div>{x}</div>;
}
```

**Status**: ❌ NOT FOUND in Priority 1 components

### Anti-Pattern #2: useEffect without dependencies

```tsx
// ❌ BAD
useEffect(() => {
  setState(...); // Runs on every render
}); // Missing dependency array
```

**Status**: ❌ NOT FOUND in Priority 1 components

### Anti-Pattern #3: Conditional setState in render

```tsx
// ❌ BAD
if (props.value !== state) {
  setState(props.value); // Triggers re-render, checks again, loops
}
```

**Status**: ❌ NOT FOUND in Priority 1 components

### Anti-Pattern #4: Effect with wrong dependencies

```tsx
// ❌ BAD
useEffect(() => {
  setState(count + 1);
}, [count]); // count changes → effect runs → count changes → loop
```

**Status**: ✅ FOUND in 2 components (Settings.tsx, FinancialStatementsWrapper.tsx)

---

**Report Generated**: 2025-11-20
**Next Step**: Apply fixes and verify with diagnostic logging
