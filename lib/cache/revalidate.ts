/**
 * Cache Revalidation Utilities
 * Helpers for managing cache revalidation in Next.js
 */

/**
 * Revalidate time constants (in seconds)
 */
export const REVALIDATE_TIME = {
  SHORT: 60, // 1 minute for frequently changing data
  MEDIUM: 300, // 5 minutes for moderately changing data
  LONG: 3600, // 1 hour for slowly changing data
  STATIC: false, // No revalidation for static data
} as const;

/**
 * Get cache headers for API routes
 * @param maxAge - Maximum age in seconds
 * @param staleWhileRevalidate - Stale-while-revalidate time in seconds
 * @returns Cache-Control header value
 */
export function getCacheHeaders(
  maxAge: number = 60,
  staleWhileRevalidate: number = 300
): string {
  return `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
}

/**
 * Get no-cache headers for API routes that should not be cached
 * @returns Cache-Control header value
 */
export function getNoCacheHeaders(): string {
  return 'no-store, no-cache, must-revalidate, proxy-revalidate';
}

