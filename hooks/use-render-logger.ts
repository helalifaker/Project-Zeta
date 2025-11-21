import { useEffect, useRef } from 'react';

/**
 * TEMPORARY DIAGNOSTIC HOOK - FOR DEBUGGING INFINITE RENDER LOOPS
 *
 * This hook tracks render counts and logs to console when a component
 * re-renders excessively (>50 times), which indicates an infinite loop.
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   useRenderLogger('MyComponent');
 *   // ... rest of component
 * }
 * ```
 *
 * TODO: REMOVE THIS HOOK AFTER DEBUGGING IS COMPLETE
 */
export function useRenderLogger(componentName: string) {
  const renderCount = useRef(0);
  const hasWarned = useRef(false);

  // Increment on every render (happens during render phase)
  renderCount.current++;

  // Log after render completes
  useEffect(() => {
    console.log(`[RENDER DIAGNOSTIC] ${componentName} - Render #${renderCount.current}`);

    if (renderCount.current > 50 && !hasWarned.current) {
      console.error(
        `[RENDER DIAGNOSTIC] ⚠️ INFINITE LOOP DETECTED in ${componentName}!`,
        `\nRender count: ${renderCount.current}`,
        `\nThis component is likely causing the "Too many re-renders" error.`
      );
      hasWarned.current = true;
    }
  });

  // Cleanup log on unmount
  useEffect(() => {
    return () => {
      console.log(
        `[RENDER DIAGNOSTIC] ${componentName} - Unmounted after ${renderCount.current} total renders`
      );
    };
  }, [componentName]);
}
