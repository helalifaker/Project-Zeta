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

      const response: CalculationResponse = {
        success: true,
        data: result.data,
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

