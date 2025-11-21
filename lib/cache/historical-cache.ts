/**
 * Historical Data Cache
 *
 * Purpose: Cache historical actuals (2023-2024) which never change
 * Performance Impact:
 * - Reduces database queries in projection calculations
 * - Cache hit: <1ms vs 50-150ms database query
 * - TTL: 60 minutes (3,600,000ms) - data is static
 *
 * Usage:
 * - Cache historical actuals by versionId
 * - No invalidation needed (data never changes once created)
 *
 * Reference: PHASE_0_1_0_2_FINAL_VERIFICATION_REPORT.md
 */

import { createCache } from './memory-cache';
import type { historical_actuals } from '@prisma/client';

/**
 * Historical actuals cache with 60-minute TTL
 * Module-level singleton - survives between requests
 */
const historicalDataCache = createCache<historical_actuals[]>(
  'historical-data',
  3600000 // 60 minutes
);

/**
 * Get cached historical actuals for a version
 *
 * @param versionId - Version ID to fetch historical data for
 * @returns Cached historical actuals or undefined if not cached
 *
 * @example
 * const cached = getCachedHistoricalData(versionId);
 * if (cached) {
 *   return cached; // Use cached data
 * }
 * // Otherwise fetch from database and cache
 */
export function getCachedHistoricalData(
  versionId: string
): historical_actuals[] | undefined {
  return historicalDataCache.get(getCacheKey(versionId));
}

/**
 * Set cached historical actuals for a version
 *
 * @param versionId - Version ID
 * @param data - Historical actuals to cache
 *
 * @example
 * const historicalData = await prisma.historical_actuals.findMany({ ... });
 * setCachedHistoricalData(versionId, historicalData);
 */
export function setCachedHistoricalData(
  versionId: string,
  data: historical_actuals[]
): void {
  historicalDataCache.set(getCacheKey(versionId), data);
}

/**
 * Invalidate historical data cache for a specific version
 * Rarely needed since historical data doesn't change
 *
 * @param versionId - Version ID whose cache should be invalidated
 */
export function invalidateHistoricalCache(versionId: string): void {
  historicalDataCache.invalidate(getCacheKey(versionId));
  console.log(`✅ [CACHE] Historical data cache invalidated for version ${versionId}`);
}

/**
 * Get cache statistics for monitoring
 */
export function getHistoricalCacheStats(): { size: number; name: string } {
  return historicalDataCache.getStats();
}

/**
 * Get cache key for version's historical data
 */
function getCacheKey(versionId: string): string {
  return `version:${versionId}:historical`;
}
