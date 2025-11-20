/**
 * Admin Settings Helper Utilities
 * 
 * Purpose: Provide backward compatibility during taxRate → zakatRate migration
 * Strategy: Read from zakatRate (new), fall back to taxRate (deprecated)
 * 
 * Migration Phases:
 * - Phase 1: Add zakatRate alongside taxRate ✅ (this file)
 * - Phase 2: Update all code to use these helpers ⏳ (Phase 1 Day 1-3)
 * - Phase 3: Remove taxRate from database 🔜 (post-validation)
 * 
 * Reference: FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md (lines 275-371)
 */

import { prisma } from '@/lib/db/prisma';
import Decimal from 'decimal.js';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Result type for settings retrieval
 */
export type SettingsResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

/**
 * Working Capital Settings Structure
 */
export interface WorkingCapitalSettings {
  accountsReceivable: {
    collectionDays: number; // Days to collect revenue (default: 0)
  };
  accountsPayable: {
    paymentDays: number; // Days to pay OpEx (default: 30)
  };
  deferredIncome: {
    deferralFactor: number; // % of revenue deferred (default: 0.25 = 25%)
  };
  accruedExpenses: {
    accrualDays: number; // Days of OpEx accrued (default: 15)
  };
}

/**
 * Get Zakat Rate (with backward compatibility for taxRate)
 * 
 * @returns Zakat rate as Decimal (default: 0.025 = 2.5%)
 * 
 * @example
 * const zakatRate = await getZakatRate();
 * if (zakatRate.success) {
 *   console.log('Zakat Rate:', zakatRate.data.toNumber()); // 0.025
 * }
 */
export async function getZakatRate(): Promise<SettingsResult<Decimal>> {
  try {
    // Try zakatRate first (new)
    const zakatSetting = await prisma.admin_settings.findUnique({
      where: { key: 'zakatRate' },
    });

    if (zakatSetting) {
      const value = parseFloat(String(zakatSetting.value));
      if (isNaN(value) || value < 0 || value > 0.10) {
        return {
          success: false,
          error: 'Invalid zakatRate value (must be 0-10%)',
          code: 'INVALID_ZAKAT_RATE',
        };
      }
      return { success: true, data: new Decimal(value) };
    }

    // Fall back to taxRate (deprecated, for backward compatibility)
    console.warn(
      '⚠️ [DEPRECATION] Using deprecated taxRate. Please run migration to add zakatRate.'
    );
    const taxSetting = await prisma.admin_settings.findUnique({
      where: { key: 'taxRate' },
    });

    if (taxSetting) {
      const value = parseFloat(String(taxSetting.value));
      if (isNaN(value) || value < 0 || value > 0.10) {
        return {
          success: false,
          error: 'Invalid taxRate value (must be 0-10%)',
          code: 'INVALID_TAX_RATE',
        };
      }
      return { success: true, data: new Decimal(value) };
    }

    // Neither found - use default
    console.warn(
      '⚠️ [DEFAULT] Neither zakatRate nor taxRate found. Using default 2.5%.'
    );
    return { success: true, data: new Decimal(0.025) }; // Default: 2.5%
  } catch (error) {
    console.error('Failed to fetch zakatRate:', error);
    return {
      success: false,
      error: 'Failed to fetch zakat rate',
      code: 'DATABASE_ERROR',
    };
  }
}

/**
 * Get Debt Interest Rate
 * 
 * @returns Debt interest rate as Decimal (default: 0.05 = 5%)
 * 
 * @example
 * const debtRate = await getDebtInterestRate();
 * if (debtRate.success) {
 *   console.log('Debt Rate:', debtRate.data.toNumber()); // 0.05
 * }
 */
export async function getDebtInterestRate(): Promise<SettingsResult<Decimal>> {
  try {
    const setting = await prisma.admin_settings.findUnique({
      where: { key: 'debt_interest_rate' },
    });

    if (!setting) {
      console.warn(
        '⚠️ [DEFAULT] debt_interest_rate not found. Using default 5%.'
      );
      return { success: true, data: new Decimal(0.05) }; // Default: 5%
    }

    const value = parseFloat(String(setting.value));
    if (isNaN(value) || value < 0 || value > 0.30) {
      return {
        success: false,
        error: 'Invalid debt_interest_rate value (must be 0-30%)',
        code: 'INVALID_DEBT_RATE',
      };
    }

    return { success: true, data: new Decimal(value) };
  } catch (error) {
    console.error('Failed to fetch debt_interest_rate:', error);
    return {
      success: false,
      error: 'Failed to fetch debt interest rate',
      code: 'DATABASE_ERROR',
    };
  }
}

/**
 * Get Bank Deposit Interest Rate
 * 
 * @returns Bank deposit interest rate as Decimal (default: 0.02 = 2%)
 * 
 * @example
 * const depositRate = await getBankDepositInterestRate();
 * if (depositRate.success) {
 *   console.log('Deposit Rate:', depositRate.data.toNumber()); // 0.02
 * }
 */
export async function getBankDepositInterestRate(): Promise<SettingsResult<Decimal>> {
  try {
    const setting = await prisma.admin_settings.findUnique({
      where: { key: 'bank_deposit_interest_rate' },
    });

    if (!setting) {
      console.warn(
        '⚠️ [DEFAULT] bank_deposit_interest_rate not found. Using default 2%.'
      );
      return { success: true, data: new Decimal(0.02) }; // Default: 2%
    }

    const value = parseFloat(String(setting.value));
    if (isNaN(value) || value < 0 || value > 0.20) {
      return {
        success: false,
        error: 'Invalid bank_deposit_interest_rate value (must be 0-20%)',
        code: 'INVALID_DEPOSIT_RATE',
      };
    }

    return { success: true, data: new Decimal(value) };
  } catch (error) {
    console.error('Failed to fetch bank_deposit_interest_rate:', error);
    return {
      success: false,
      error: 'Failed to fetch bank deposit interest rate',
      code: 'DATABASE_ERROR',
    };
  }
}

/**
 * Get Minimum Cash Balance
 * 
 * @returns Minimum cash balance as Decimal (default: 1,000,000 SAR)
 * 
 * @example
 * const minCash = await getMinimumCashBalance();
 * if (minCash.success) {
 *   console.log('Min Cash:', minCash.data.toNumber()); // 1000000
 * }
 */
export async function getMinimumCashBalance(): Promise<SettingsResult<Decimal>> {
  try {
    const setting = await prisma.admin_settings.findUnique({
      where: { key: 'minimum_cash_balance' },
    });

    if (!setting) {
      console.warn(
        '⚠️ [DEFAULT] minimum_cash_balance not found. Using default 1M SAR.'
      );
      return { success: true, data: new Decimal(1000000) }; // Default: 1M SAR
    }

    const value = parseFloat(String(setting.value));
    if (isNaN(value) || value < 0) {
      return {
        success: false,
        error: 'Invalid minimum_cash_balance value (must be >= 0)',
        code: 'INVALID_MIN_CASH',
      };
    }

    return { success: true, data: new Decimal(value) };
  } catch (error) {
    console.error('Failed to fetch minimum_cash_balance:', error);
    return {
      success: false,
      error: 'Failed to fetch minimum cash balance',
      code: 'DATABASE_ERROR',
    };
  }
}

/**
 * Get Working Capital Settings
 * 
 * @returns Working capital settings object
 * 
 * @example
 * const wcSettings = await getWorkingCapitalSettings();
 * if (wcSettings.success) {
 *   console.log('AR Days:', wcSettings.data.accountsReceivable.collectionDays); // 0
 *   console.log('AP Days:', wcSettings.data.accountsPayable.paymentDays); // 30
 * }
 */
export async function getWorkingCapitalSettings(): Promise<SettingsResult<WorkingCapitalSettings>> {
  try {
    const setting = await prisma.admin_settings.findUnique({
      where: { key: 'working_capital_settings' },
    });

    if (!setting) {
      console.warn(
        '⚠️ [DEFAULT] working_capital_settings not found. Using defaults.'
      );
      return {
        success: true,
        data: {
          accountsReceivable: { collectionDays: 0 },
          accountsPayable: { paymentDays: 30 },
          deferredIncome: { deferralFactor: 0.25 },
          accruedExpenses: { accrualDays: 15 },
        },
      };
    }

    // Validate JSON structure
    const value = setting.value as unknown;
    if (
      !value ||
      typeof value !== 'object' ||
      !('accountsReceivable' in value) ||
      !('accountsPayable' in value) ||
      !('deferredIncome' in value) ||
      !('accruedExpenses' in value)
    ) {
      return {
        success: false,
        error: 'Invalid working_capital_settings structure',
        code: 'INVALID_WC_SETTINGS',
      };
    }

    return { success: true, data: value as WorkingCapitalSettings };
  } catch (error) {
    console.error('Failed to fetch working_capital_settings:', error);
    return {
      success: false,
      error: 'Failed to fetch working capital settings',
      code: 'DATABASE_ERROR',
    };
  }
}

/**
 * Get All Financial Statement Settings (batched for performance)
 * 
 * @returns All financial settings in a single object
 * 
 * @example
 * const settings = await getAllFinancialSettings();
 * if (settings.success) {
 *   const { zakatRate, debtRate, depositRate, minCash, workingCapital } = settings.data;
 *   // Use settings
 * }
 */
export async function getAllFinancialSettings(): Promise<
  SettingsResult<{
    zakatRate: Decimal;
    debtInterestRate: Decimal;
    bankDepositInterestRate: Decimal;
    minimumCashBalance: Decimal;
    workingCapitalSettings: WorkingCapitalSettings;
  }>
> {
  try {
    // Fetch all settings in parallel for performance
    const [zakatRate, debtRate, depositRate, minCash, workingCapital] =
      await Promise.all([
        getZakatRate(),
        getDebtInterestRate(),
        getBankDepositInterestRate(),
        getMinimumCashBalance(),
        getWorkingCapitalSettings(),
      ]);

    // Check for any failures
    if (!zakatRate.success) {
      return { success: false, error: zakatRate.error, ...(zakatRate.code && { code: zakatRate.code }) };
    }
    if (!debtRate.success) {
      return { success: false, error: debtRate.error, ...(debtRate.code && { code: debtRate.code }) };
    }
    if (!depositRate.success) {
      return { success: false, error: depositRate.error, ...(depositRate.code && { code: depositRate.code }) };
    }
    if (!minCash.success) {
      return { success: false, error: minCash.error, ...(minCash.code && { code: minCash.code }) };
    }
    if (!workingCapital.success) {
      return {
        success: false,
        error: workingCapital.error,
        ...(workingCapital.code && { code: workingCapital.code }),
      };
    }

    return {
      success: true,
      data: {
        zakatRate: zakatRate.data,
        debtInterestRate: debtRate.data,
        bankDepositInterestRate: depositRate.data,
        minimumCashBalance: minCash.data,
        workingCapitalSettings: workingCapital.data,
      },
    };
  } catch (error) {
    console.error('Failed to fetch all financial settings:', error);
    return {
      success: false,
      error: 'Failed to fetch financial settings',
      code: 'DATABASE_ERROR',
    };
  }
}

