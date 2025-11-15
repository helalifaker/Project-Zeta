/**
 * Financial Engine Web Worker
 * Runs heavy financial calculations in a background thread to avoid blocking UI
 *
 * @example
 * const worker = new Worker(
 *   new URL('@/workers/financial-engine.worker.ts', import.meta.url)
 * );
 *
 * worker.postMessage({
 *   type: 'FULL_PROJECTION',
 *   params: { ... }
 * });
 *
 * worker.onmessage = (event) => {
 *   const { success, data, duration } = event.data;
 *   // Handle result
 * };
 */

/// <reference lib="webworker" />

import type { CalculationRequest, CalculationResponse } from './types';
import { calculateFullProjection } from '@/lib/calculations/financial/projection';

/**
 * Recursively serialize projection result for Web Worker postMessage
 * Converts all Decimal objects to numbers to avoid DataCloneError
 */
function serializeProjectionResult(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  // Convert Decimal to number
  if (typeof data === 'object' && typeof (data as any).toNumber === 'function') {
    return (data as any).toNumber();
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => serializeProjectionResult(item));
  }
  
  // Handle objects (recursively serialize all properties)
  if (typeof data === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeProjectionResult(value);
    }
    return serialized;
  }
  
  // Primitives pass through
  return data;
}

self.onmessage = (event: MessageEvent<CalculationRequest>) => {
  const startTime = performance.now();

  try {
    if (event.data.type === 'FULL_PROJECTION') {
      const result = calculateFullProjection(event.data.params);
      const duration = performance.now() - startTime;

      if (duration > 50) {
        console.warn(`⚠️ Calculation exceeded 50ms: ${duration.toFixed(2)}ms`);
      }

      if (!result.success) {
        const response: CalculationResponse = {
          success: false,
          error: result.error,
          duration,
        };
        self.postMessage(response);
        return;
      }

      // Serialize result data to convert Decimal objects to numbers
      // This prevents DataCloneError when sending back to main thread
      const serializedData = serializeProjectionResult(result.data);

      const response: CalculationResponse = {
        success: true,
        data: serializedData,
        duration,
      };

      self.postMessage(response);
    } else {
      self.postMessage({
        success: false,
        error: `Unknown calculation type: ${event.data.type}`,
        duration: performance.now() - startTime,
      });
    }
  } catch (error) {
    const response: CalculationResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: performance.now() - startTime,
    };

    self.postMessage(response);
  }
};

// Export empty object for TypeScript module system
export {};

