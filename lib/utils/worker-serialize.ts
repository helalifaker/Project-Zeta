/**
 * Web Worker Serialization Utilities
 * Convert Decimal objects to numbers for Web Worker postMessage
 * (Web Workers cannot clone Decimal objects or functions)
 */

import type { Decimal } from 'decimal.js';
import type { Prisma } from '@prisma/client';

/**
 * Convert Decimal or number to plain number for Web Worker serialization
 */
export function toWorkerNumber(
  value: Decimal | Prisma.Decimal | number | string | null | undefined
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return value;
  }

  // Handle Decimal objects (both Decimal.js and Prisma Decimal)
  if (typeof (value as any).toNumber === 'function') {
    return (value as any).toNumber();
  }

  // Fallback: convert to string then parse
  return parseFloat(String(value));
}

/**
 * Recursively serialize rent plan parameters for Web Worker
 * Converts Decimal objects and ensures all values are serializable
 * Rejects functions (including Decimal constructor)
 */
export function serializeRentPlanParametersForWorker(
  params: Record<string, unknown>
): Record<string, unknown> {
  if (!params || typeof params !== 'object') {
    return params;
  }

  const serialized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    // CRITICAL: Reject functions (including Decimal constructor)
    if (typeof value === 'function') {
      console.error(`serializeRentPlanParametersForWorker: Found function at key "${key}" - skipping`);
      continue; // Skip this property
    }

    // Check if value is a Decimal object
    if (value !== null && typeof value === 'object' && typeof (value as any).toNumber === 'function') {
      serialized[key] = (value as any).toNumber();
    } else if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
      serialized[key] = value;
    } else if (Array.isArray(value)) {
      serialized[key] = value.map(item => {
        // Reject functions in arrays
        if (typeof item === 'function') {
          console.error(`serializeRentPlanParametersForWorker: Found function in array at key "${key}" - removing`);
          return undefined;
        }
        // Convert Decimal objects in arrays
        if (typeof item === 'object' && item !== null && typeof (item as any).toNumber === 'function') {
          return (item as any).toNumber();
        }
        return item;
      }).filter(item => item !== undefined); // Remove undefined values
    } else if (typeof value === 'object' && value !== null) {
      // Recursively serialize nested objects
      serialized[key] = serializeRentPlanParametersForWorker(value as Record<string, unknown>);
    } else {
      serialized[key] = value;
    }
  }
  return serialized;
}

