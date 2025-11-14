/**
 * Web Worker Communication Types
 * Types for messages between main thread and financial engine worker
 */

import type {
  FullProjectionParams,
  FullProjectionResult,
} from '@/lib/calculations/financial/projection';

export interface CalculationRequest {
  type: 'FULL_PROJECTION';
  params: FullProjectionParams;
}

export interface CalculationResponse {
  success: boolean;
  data?: FullProjectionResult;
  error?: string;
  duration: number;
}

