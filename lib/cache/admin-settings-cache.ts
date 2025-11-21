/**
 * Admin Settings Cache
 *
 * Purpose: Cache admin settings to reduce database queries
 * Performance Impact:
 * - Reduces 1 database query per projection calculation
 * - Cache hit: <1ms vs 50-100ms database query
 * - TTL: 10 minutes (600,000ms) - settings rarely change
 *
 * Usage:
 * - Replace direct calls to getAllFinancialSettings() with getCachedFinancialSettings()
 * - Invalidate cache when admin settings are updated
 *
 * Reference: PHASE_0_1_0_2_FINAL_VERIFICATION_REPORT.md
 */

import { createCache } from './memory-cache';
import type { WorkingCapitalSettings } from '@/lib/utils/admin-settings';
import Decimal from 'decimal.js';

/**
 * Cached financial settings type
 */
export interface CachedFinancialSettings {
  zakatRate: Decimal;
  debtInterestRate: Decimal;
  bankDepositInterestRate: Decimal;
  minimumCashBalance: Decimal;
  workingCapitalSettings: WorkingCapitalSettings;
}

/**
 * Admin settings cache with 10-minute TTL
 * Module-level singleton - survives between requests
 */
const adminSettingsCache = createCache<CachedFinancialSettings>(
  'admin-settings',
  600000 // 10 minutes
);

/**
 * Get all financial settings from cache or database
 *
 * @returns Financial settings (cached or fresh from database)
 *
 * @example
 * // In circular-solver.ts or other calculation files:
 * const settings = await getCachedFinancialSettings();
 * const zakatRate = settings.zakatRate;
 */
export async function getCachedFinancialSettings(): Promise<CachedFinancialSettings> {
  return adminSettingsCache.getOrSet(
    'financial-settings',
    async () => {
      // Cache miss - fetch from database
      const { getAllFinancialSettings } = await import('@/lib/utils/admin-settings');
      const result = await getAllFinancialSettings();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch financial settings');
      }

      return result.data;
    }
  );
}

/**
 * Invalidate admin settings cache
 * Call this when admin settings are updated
 *
 * @example
 * // In app/api/admin/settings/route.ts (PATCH endpoint):
 * await updateAdminSettings(data, userId);
 * invalidateAdminSettingsCache();
 */
export function invalidateAdminSettingsCache(): void {
  adminSettingsCache.invalidateAll();
  console.log('✅ [CACHE] Admin settings cache invalidated');
}

/**
 * Get cache statistics for monitoring
 */
export function getAdminSettingsCacheStats(): { size: number; name: string } {
  return adminSettingsCache.getStats();
}
