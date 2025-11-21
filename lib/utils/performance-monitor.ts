/**
 * Performance Monitoring Utilities
 *
 * Provides tools for tracking and logging slow operations across the application
 */

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Performance thresholds (in milliseconds)
 */
export const PERFORMANCE_THRESHOLDS = {
  WARNING: 500,  // Log warning for operations > 500ms
  ERROR: 1000,   // Log error for operations > 1000ms
} as const;

/**
 * Log performance metrics with automatic threshold-based severity
 *
 * @param operation - Name of the operation being measured
 * @param duration - Duration in milliseconds
 * @param metadata - Optional additional context
 *
 * @example
 * const start = performance.now();
 * await someOperation();
 * logPerformance('someOperation', performance.now() - start, { recordCount: 100 });
 */
export function logPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, unknown>
): void {
  const metrics: PerformanceMetrics = {
    operation,
    duration,
    metadata,
    timestamp: new Date(),
  };

  // Format metadata for logging
  const metadataStr = metadata
    ? ` | ${Object.entries(metadata)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ')}`
    : '';

  if (duration > PERFORMANCE_THRESHOLDS.ERROR) {
    console.error(
      `🔴 SLOW OPERATION: ${operation} took ${duration.toFixed(0)}ms (>1000ms threshold)${metadataStr}`
    );
  } else if (duration > PERFORMANCE_THRESHOLDS.WARNING) {
    console.warn(
      `🟡 Performance Warning: ${operation} took ${duration.toFixed(0)}ms (>500ms threshold)${metadataStr}`
    );
  } else {
    // Only log successful fast operations in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `✅ ${operation} completed in ${duration.toFixed(0)}ms${metadataStr}`
      );
    }
  }
}

/**
 * Create a performance timer that automatically logs when disposed
 *
 * @param operation - Name of the operation being measured
 * @param metadata - Optional additional context
 * @returns Object with stop() method to end measurement
 *
 * @example
 * const timer = startPerformanceTimer('database query', { table: 'versions' });
 * await prisma.versions.findMany();
 * timer.stop(); // Automatically logs performance
 */
export function startPerformanceTimer(
  operation: string,
  metadata?: Record<string, unknown>
): { stop: () => number } {
  const start = performance.now();

  return {
    stop: () => {
      const duration = performance.now() - start;
      logPerformance(operation, duration, metadata);
      return duration;
    },
  };
}

/**
 * Decorator/wrapper for async functions to automatically measure performance
 *
 * @param operation - Name of the operation
 * @param fn - Async function to measure
 * @param metadata - Optional metadata factory (can use function args)
 * @returns Wrapped function that logs performance
 *
 * @example
 * const fetchVersions = measureAsync(
 *   'fetchVersions',
 *   async (userId: string) => prisma.versions.findMany({ where: { createdBy: userId } }),
 *   (userId) => ({ userId })
 * );
 *
 * await fetchVersions('user-123'); // Automatically logs performance
 */
export function measureAsync<T extends (...args: any[]) => Promise<any>>(
  operation: string,
  fn: T,
  metadataFactory?: (...args: Parameters<T>) => Record<string, unknown>
): T {
  return (async (...args: Parameters<T>) => {
    const start = performance.now();
    try {
      const result = await fn(...args);
      const duration = performance.now() - start;
      const metadata = metadataFactory ? metadataFactory(...args) : undefined;
      logPerformance(operation, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      const metadata = metadataFactory ? metadataFactory(...args) : undefined;
      logPerformance(`${operation} (FAILED)`, duration, metadata);
      throw error;
    }
  }) as T;
}

/**
 * Query performance helper specifically for database operations
 *
 * @param queryName - Name of the query
 * @param queryFn - Async query function
 * @param recordCount - Optional count of records returned (for logging)
 * @returns Query result with performance logged
 *
 * @example
 * const versions = await measureQuery(
 *   'versions.findMany',
 *   () => prisma.versions.findMany({ where })
 * );
 */
export async function measureQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  getRecordCount?: (result: T) => number
): Promise<T> {
  const start = performance.now();
  try {
    const result = await queryFn();
    const duration = performance.now() - start;
    const metadata: Record<string, unknown> = {};

    if (getRecordCount) {
      metadata.recordCount = getRecordCount(result);
    }

    logPerformance(`Query: ${queryName}`, duration, metadata);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logPerformance(`Query: ${queryName} (FAILED)`, duration);
    throw error;
  }
}
