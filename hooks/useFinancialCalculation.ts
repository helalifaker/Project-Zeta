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
  cancel: () => void;
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
  const requestIdRef = useRef<number>(0);
  const pendingRequestRef = useRef<FullProjectionParams | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('@/workers/financial-engine.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (event: MessageEvent<CalculationResponse>) => {
      setLoading(false);

      if (event.data.success) {
        setProjection(event.data.data || null);
        setError(null);
      } else {
        setError(event.data.error || 'Calculation failed');
        setProjection(null);
      }
      pendingRequestRef.current = null;
    };

    workerRef.current.onerror = (err) => {
      console.error('Worker error:', err.message);
      setLoading(false);
      setError(err.message || 'Worker error');
      setProjection(null);
      pendingRequestRef.current = null;
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const calculate = useCallback((params: FullProjectionParams) => {
    if (!workerRef.current) {
      setError('Worker not initialized');
      return;
    }

    requestIdRef.current += 1;
    pendingRequestRef.current = params;

    setLoading(true);
    setError(null);

    // Basic validation
    if (!params || typeof params !== 'object') {
      setError('Invalid calculation parameters');
      setLoading(false);
      return;
    }

    if (!params.curriculumPlans || !Array.isArray(params.curriculumPlans)) {
      setError('Curriculum plans must be an array');
      setLoading(false);
      return;
    }

    try {
      // Single-pass serialization using JSON.stringify replacer
      // This converts all Decimal objects to numbers and removes functions
      const jsonString = JSON.stringify(params, (key, value) => {
        // Skip null/undefined
        if (value === null || value === undefined) {
          return value;
        }
        
        // Remove functions (including Decimal constructor)
        if (typeof value === 'function') {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Removed function "${key}" from serialization`);
          }
          return undefined;
        }
        
        // Convert Decimal objects to numbers
        if (typeof value === 'object' && value !== null && typeof (value as any).toNumber === 'function') {
          try {
            const num = (value as any).toNumber();
            return isNaN(num) || !isFinite(num) ? 0 : num;
          } catch {
            return 0;
          }
        }
        
        return value;
      });
      
      const serializedParams = JSON.parse(jsonString) as typeof params;
      
      // Validate critical fields remain intact
      if (!serializedParams.curriculumPlans || !Array.isArray(serializedParams.curriculumPlans)) {
        throw new Error('Serialization corrupted curriculumPlans');
      }

      const request: CalculationRequest = {
        type: 'FULL_PROJECTION',
        params: serializedParams,
      };

      workerRef.current.postMessage(request);
      setError(null);
    } catch (error) {
      console.error('Serialization error:', error);
      setError(`Failed to serialize parameters: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLoading(false);
      pendingRequestRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    requestIdRef.current += 1;
    pendingRequestRef.current = null;
    setLoading(false);
  }, []);

  return {
    projection,
    loading,
    error,
    calculate,
    cancel,
  };
}
