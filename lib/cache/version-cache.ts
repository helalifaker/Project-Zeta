/**
 * Version Metadata Cache
 *
 * Purpose: Cache lightweight version lists to speed up /api/versions endpoint
 * Performance Impact:
 * - Reduces database queries for version list by 90%+
 * - Cache hit: <1ms vs 50-200ms database query
 * - TTL: 5 minutes (300,000ms) - moderate change frequency
 *
 * Usage:
 * - Cache version lists per user (keyed by userId)
 * - Invalidate on version create/update/delete
 *
 * Reference: PHASE_0_1_0_2_FINAL_VERIFICATION_REPORT.md
 */

import { createCache } from './memory-cache';
import type { VersionStatus, VersionMode } from '@prisma/client';

/**
 * Lightweight version metadata (for list views)
 */
export interface VersionMetadata {
  id: string;
  name: string;
  status: VersionStatus;
  mode: VersionMode;
}

/**
 * Version metadata cache with 5-minute TTL
 * Module-level singleton - survives between requests
 */
const versionMetadataCache = createCache<VersionMetadata[]>(
  'version-metadata',
  300000 // 5 minutes
);

/**
 * Get cached version metadata for a user
 *
 * @param userId - User ID to fetch versions for
 * @returns Cached version metadata or undefined if not cached
 *
 * @example
 * const cached = getCachedVersionMetadata(userId);
 * if (cached) {
 *   return cached; // Use cached data
 * }
 * // Otherwise fetch from database and cache
 */
export function getCachedVersionMetadata(userId: string): VersionMetadata[] | undefined {
  return versionMetadataCache.get(getCacheKey(userId));
}

/**
 * Set cached version metadata for a user
 *
 * @param userId - User ID
 * @param versions - Version metadata to cache
 *
 * @example
 * const versions = await prisma.versions.findMany({ ... });
 * setCachedVersionMetadata(userId, versions);
 */
export function setCachedVersionMetadata(
  userId: string,
  versions: VersionMetadata[]
): void {
  versionMetadataCache.set(getCacheKey(userId), versions);
}

/**
 * Invalidate version metadata cache for a specific user
 * Call this when a version is created/updated/deleted
 *
 * @param userId - User ID whose cache should be invalidated
 *
 * @example
 * // In app/api/versions/route.ts (POST endpoint):
 * await createVersion(data);
 * invalidateVersionCache(userId);
 */
export function invalidateVersionCache(userId: string): void {
  versionMetadataCache.invalidate(getCacheKey(userId));
  console.log(`✅ [CACHE] Version cache invalidated for user ${userId}`);
}

/**
 * Invalidate all version metadata caches
 * Use sparingly - only when global changes affect all users
 */
export function invalidateAllVersionCaches(): void {
  versionMetadataCache.invalidateAll();
  console.log('✅ [CACHE] All version caches invalidated');
}

/**
 * Get cache statistics for monitoring
 */
export function getVersionCacheStats(): { size: number; name: string } {
  return versionMetadataCache.getStats();
}

/**
 * Get cache key for user's version metadata
 */
function getCacheKey(userId: string): string {
  return `user:${userId}:versions`;
}
