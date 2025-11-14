/**
 * Result type for error handling
 * Use this instead of throwing errors in business logic
 */
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

/**
 * Helper to create success result
 */
export function success<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Helper to create error result
 */
export function error<T>(errorMessage: string, code?: string): Result<T> {
  if (code) {
    return { success: false, error: errorMessage, code };
  }
  return { success: false, error: errorMessage };
}

