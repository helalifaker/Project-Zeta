/**
 * Admin Settings Service
 * Manages global admin settings stored in AdminSetting table
 */

import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';
import { logAudit } from '@/services/audit';
import type { UpdateAdminSettingsInput } from '@/lib/validation/admin';
import { createCache } from '@/lib/cache/memory-cache';

/**
 * Admin setting keys
 */
export type AdminSettingKey = 
  | 'cpiRate'
  | 'discountRate'
  | 'zakatRate' // ✅ New (preferred)
  | 'taxRate' // @deprecated - Keep for backward compatibility
  | 'currency'
  | 'timezone'
  | 'dateFormat'
  | 'numberFormat';

/**
 * Admin settings type
 */
export interface AdminSettings {
  cpiRate: number;
  discountRate: number;
  zakatRate: number; // ✅ Saudi Arabian Zakat rate (default 2.5%)
  currency: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
}

/**
 * Cache admin settings to avoid repeated DB round trips
 * TTL: 10 minutes (settings rarely change)
 */
const adminSettingsCache = createCache<AdminSettings>('admin-settings-general', 600000);

/**
 * Fetch admin settings directly from the database (uncached)
 */
async function loadAdminSettingsFromDb(): Promise<AdminSettings> {
  const queryStart = performance.now();
  const settings = await prisma.admin_settings.findMany({
    where: {
      key: {
        in: ['cpiRate', 'discountRate', 'zakatRate', 'taxRate', 'currency', 'timezone', 'dateFormat', 'numberFormat'],
      },
    },
  });
  const queryTime = performance.now() - queryStart;

  // Log performance (query time only - network latency is separate)
  if (queryTime > 100) {
    console.warn(`⚠️ Settings query slow: ${queryTime.toFixed(0)}ms (target: <100ms)`);
  }

  // Transform to object
  const settingsMap: Partial<AdminSettings> = {};

  for (const setting of settings) {
    const key = setting.key as AdminSettingKey;
    const value = setting.value;

    // Parse JSON value
    if (typeof value === 'object' && value !== null) {
      if (key === 'cpiRate' || key === 'discountRate' || key === 'zakatRate' || key === 'taxRate') {
        (settingsMap as Record<string, number>)[key] = typeof value === 'number' ? value : parseFloat(String(value));
      } else {
        (settingsMap as Record<string, string>)[key] = String(value);
      }
    } else if (typeof value === 'number') {
      if (key === 'cpiRate' || key === 'discountRate' || key === 'zakatRate' || key === 'taxRate') {
        (settingsMap as Record<string, number>)[key] = value;
      }
    } else {
      (settingsMap as Record<string, string>)[key] = String(value);
    }
  }

  // Set defaults if missing
  // ✅ Backward compatibility: zakatRate (preferred) → taxRate (fallback) → 0.025 (default)
  const zakatRate =
    (settingsMap.zakatRate as number) ??
    (settingsMap.taxRate as number) ??
    0.025; // 2.5% Saudi Arabian Zakat rate

  return {
    cpiRate: (settingsMap.cpiRate as number) ?? 0.03,
    discountRate: (settingsMap.discountRate as number) ?? 0.08,
    zakatRate,
    currency: settingsMap.currency ?? 'SAR',
    timezone: settingsMap.timezone ?? 'Asia/Riyadh',
    dateFormat: settingsMap.dateFormat ?? 'DD/MM/YYYY',
    numberFormat: settingsMap.numberFormat ?? '1,000,000',
  };
}

/**
 * Get all admin settings
 */
export async function getAdminSettings(): Promise<Result<AdminSettings>> {
  try {
    const cached = await adminSettingsCache.getOrSet('all', loadAdminSettingsFromDb);
    return success(cached);
  } catch (err) {
    console.error('Failed to fetch admin settings:', err);
    return error('Failed to fetch admin settings');
  }
}

/**
 * Get single setting value
 */
export async function getSetting(key: AdminSettingKey): Promise<Result<unknown>> {
  try {
    const setting = await prisma.admin_settings.findUnique({
      where: { key },
    });

    if (!setting) {
      return error(`Setting ${key} not found`);
    }

    return success(setting.value);
  } catch (err) {
    console.error(`Failed to fetch setting ${key}:`, err);
    return error(`Failed to fetch setting ${key}`);
  }
}

/**
 * Update admin settings
 */
export async function updateAdminSettings(
  updates: UpdateAdminSettingsInput,
  userId: string
): Promise<Result<AdminSettings>> {
  try {
    const updatedKeys: string[] = [];

    // Update each setting
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        await prisma.admin_settings.upsert({
          where: { key },
          update: {
            value: value as Prisma.InputJsonValue,
            updatedBy: userId,
          },
          create: {
            key,
            value: value as Prisma.InputJsonValue,
            updatedBy: userId,
          },
        });
        updatedKeys.push(key);
      }
    }

    // Audit log
    await logAudit({
      action: 'UPDATE_ADMIN_SETTINGS',
      userId,
      entityType: 'SETTING',
      entityId: 'global',
      metadata: {
        updatedKeys,
        updates,
      },
    });

    // Invalidate and refresh cache after successful update
    adminSettingsCache.invalidateAll();
    const freshSettings = await loadAdminSettingsFromDb();
    adminSettingsCache.set('all', freshSettings);

    return success(freshSettings);
  } catch (err) {
    console.error('Failed to update admin settings:', err);
    return error('Failed to update admin settings');
  }
}
