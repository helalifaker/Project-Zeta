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

/**
 * Admin setting keys
 */
export type AdminSettingKey = 
  | 'cpiRate'
  | 'discountRate'
  | 'taxRate'
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
  taxRate: number;
  currency: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
}

/**
 * Get all admin settings
 */
export async function getAdminSettings(): Promise<Result<AdminSettings>> {
  try {
    const queryStart = performance.now();
    const settings = await prisma.admin_settings.findMany({
      where: {
        key: {
          in: ['cpiRate', 'discountRate', 'taxRate', 'currency', 'timezone', 'dateFormat', 'numberFormat'],
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
        if (key === 'cpiRate' || key === 'discountRate' || key === 'taxRate') {
          (settingsMap as Record<string, number>)[key] = typeof value === 'number' ? value : parseFloat(String(value));
        } else {
          (settingsMap as Record<string, string>)[key] = String(value);
        }
      } else if (typeof value === 'number') {
        if (key === 'cpiRate' || key === 'discountRate' || key === 'taxRate') {
          (settingsMap as Record<string, number>)[key] = value;
        }
      } else {
        (settingsMap as Record<string, string>)[key] = String(value);
      }
    }

    // Set defaults if missing
    const result: AdminSettings = {
      cpiRate: (settingsMap.cpiRate as number) ?? 0.03,
      discountRate: (settingsMap.discountRate as number) ?? 0.08,
      taxRate: (settingsMap.taxRate as number) ?? 0.15,
      currency: settingsMap.currency ?? 'SAR',
      timezone: settingsMap.timezone ?? 'Asia/Riyadh',
      dateFormat: settingsMap.dateFormat ?? 'DD/MM/YYYY',
      numberFormat: settingsMap.numberFormat ?? '1,000,000',
    };

    return success(result);
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

    // Return updated settings
    return getAdminSettings();
  } catch (err) {
    console.error('Failed to update admin settings:', err);
    return error('Failed to update admin settings');
  }
}

