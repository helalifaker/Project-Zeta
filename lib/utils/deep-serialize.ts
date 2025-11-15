/**
 * Deep Serialization Utilities
 * Recursively serialize objects to ensure they can be cloned for Web Workers
 */

/**
 * Deep serialize an object, converting all Decimal objects and ensuring all values are serializable
 * This is a safety check before sending data to Web Workers
 */
export function deepSerializeForWorker<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays FIRST (before checking for other object types)
  // This is critical because arrays are objects in JavaScript
  if (Array.isArray(obj)) {
    // Ensure we return an array, not an object
    const serialized = obj.map(item => deepSerializeForWorker(item));
    // Double-check it's still an array after serialization
    if (!Array.isArray(serialized)) {
      console.error('Array serialization failed - result is not an array:', {
        original: obj,
        serialized,
        type: typeof serialized,
      });
      // Force return as array
      return serialized as T;
    }
    return serialized as T;
  }

  // Handle Date objects (convert to ISO string)
  if (obj instanceof Date) {
    return obj.toISOString() as T;
  }

  // Handle plain objects (but not arrays, which we already handled above)
  if (typeof obj === 'object' && obj !== null) {
    // Check for Decimal objects BEFORE processing as plain object
    // Check for Decimal.js Decimal or Prisma Decimal (has toNumber method)
    if (typeof (obj as any).toNumber === 'function') {
      return (obj as any).toNumber() as T;
    }
    // Check for Prisma Decimal (has toString and valueOf, might not have toNumber)
    if (typeof (obj as any).toString === 'function' && typeof (obj as any).valueOf === 'function') {
      // Try toNumber first, fallback to parseFloat
      try {
        if (typeof (obj as any).toNumber === 'function') {
          return (obj as any).toNumber() as T;
        }
        return parseFloat(String(obj)) as T;
      } catch {
        return parseFloat(String(obj)) as T;
      }
    }

    // Process as plain object - iterate over entries and serialize each value
    const serialized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Recursively serialize each value (arrays will be handled correctly)
      const serializedValue = deepSerializeForWorker(value);
      
      // Debug: Log if we're serializing curriculumPlans
      if (key === 'curriculumPlans' && process.env.NODE_ENV === 'development') {
        console.log('Serializing curriculumPlans:', {
          original: value,
          originalIsArray: Array.isArray(value),
          serialized: serializedValue,
          serializedIsArray: Array.isArray(serializedValue),
          serializedType: typeof serializedValue,
        });
      }
      
      serialized[key] = serializedValue;
    }
    return serialized as T;
  }

  // Primitive values (string, number, boolean, etc.) are already serializable
  return obj;
}

/**
 * Validate that an object can be cloned (for Web Worker postMessage)
 * Throws an error if the object contains non-serializable values
 */
export function validateSerializable(obj: unknown): void {
  try {
    // Try to clone the object using structuredClone (if available) or JSON
    if (typeof structuredClone !== 'undefined') {
      structuredClone(obj);
    } else {
      // Fallback: use JSON serialization
      JSON.parse(JSON.stringify(obj));
    }
  } catch (error) {
    console.error('Object is not serializable:', obj);
    throw new Error(`Object contains non-serializable values: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

