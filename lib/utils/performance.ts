/**
 * Performance monitoring utilities
 * Tracks operation duration in development mode
 */

const PERF_ENABLED = process.env.NODE_ENV === 'development';

export function startTimer(label: string): () => void {
  if (!PERF_ENABLED) return () => {};
  
  const start = performance.now();
  return () => {
    const duration = performance.now() - start;
    if (duration > 100) {
      console.warn(`⚠️ SLOW: ${label} took ${duration.toFixed(0)}ms`);
    } else if (duration > 50) {
      console.log(`⏱️ ${label} took ${duration.toFixed(0)}ms`);
    }
  };
}

export function measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (!PERF_ENABLED) return fn();
  
  const start = performance.now();
  return fn().then(
    (result) => {
      const duration = performance.now() - start;
      if (duration > 100) {
        console.warn(`⚠️ SLOW: ${label} took ${duration.toFixed(0)}ms`);
      }
      return result;
    },
    (error) => {
      const duration = performance.now() - start;
      console.error(`❌ ${label} failed after ${duration.toFixed(0)}ms`);
      throw error;
    }
  );
}

