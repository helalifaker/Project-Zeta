/**
 * useFinancialCalculation Hook
 * React hook for using the financial engine Web Worker
 * Manages worker lifecycle and provides loading state
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type {
  FullProjectionParams,
  FullProjectionResult,
} from '@/lib/calculations/financial/projection';
import type {
  CalculationRequest,
  CalculationResponse,
} from '@/workers/types';

export interface UseFinancialCalculationResult {
  projection: FullProjectionResult | null;
  loading: boolean;
  error: string | null;
  calculate: (params: FullProjectionParams) => void;
}

/**
 * React hook for calculating financial projections using Web Worker
 *
 * @returns Object containing projection result, loading state, error, and calculate function
 *
 * @example
 * const { projection, loading, error, calculate } = useFinancialCalculation();
 *
 * useEffect(() => {
 *   calculate({
 *     curriculumPlans: [frPlan, ibPlan],
 *     rentPlan: { rentModel: 'PARTNER_MODEL', parameters: {...} },
 *     staffCostBase: 15_000_000,
 *     staffCostCpiFrequency: 2,
 *     capexItems: [],
 *     opexSubAccounts: [],
 *     adminSettings: { cpiRate: 0.03, discountRate: 0.08, taxRate: 0.20 }
 *   });
 * }, [calculate]);
 */
export function useFinancialCalculation(): UseFinancialCalculationResult {
  const [projection, setProjection] = useState<FullProjectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Initialize worker on mount
  useEffect(() => {
    // Create worker instance
    workerRef.current = new Worker(
      new URL('@/workers/financial-engine.worker.ts', import.meta.url),
      { type: 'module' }
    );

    // Handle messages from worker
    workerRef.current.onmessage = (event: MessageEvent<CalculationResponse>) => {
      setLoading(false);

      if (event.data.success) {
        setProjection(event.data.data || null);
        setError(null);
      } else {
        setError(event.data.error || 'Calculation failed');
        setProjection(null);
      }
    };

    // Handle errors from worker
    workerRef.current.onerror = (err) => {
      setLoading(false);
      setError(err.message || 'Worker error');
      setProjection(null);
    };

    // Cleanup: terminate worker on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Calculate function
  const calculate = useCallback((params: FullProjectionParams) => {
    if (!workerRef.current) {
      setError('Worker not initialized');
      return;
    }

    setLoading(true);
    setError(null);

    const request: CalculationRequest = {
      type: 'FULL_PROJECTION',
      params,
    };

    workerRef.current.postMessage(request);
  }, []);

  return {
    projection,
    loading,
    error,
    calculate,
  };
}

