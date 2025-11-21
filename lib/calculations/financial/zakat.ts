/**
 * FORMULA-003: Zakat Calculation Methods
 *
 * This module implements two methods for Zakat calculation:
 * 1. Income-Based Method (Simplified) - Currently used
 * 2. Asset-Based Method (Full Islamic Method) - Islamic finance standard
 *
 * BUSINESS CONTEXT:
 * Zakat is an Islamic wealth tax of 2.5% (one-fortieth) required annually
 * on specific types of wealth that have been held for a lunar year (hawl).
 *
 * TERMINOLOGY:
 * - Zakat: Obligatory charitable payment (2.5% of qualifying wealth)
 * - Nisab: Minimum threshold of wealth that makes Zakat obligatory
 * - Hawl: Lunar year (354 days) - wealth must be held for this period
 * - Zakatable Assets: Assets subject to Zakat (cash, receivables, inventory)
 *
 * IMPLEMENTATION NOTES:
 * - Both methods maintain 2.5% rate (Islamic standard)
 * - Admin can choose method via zakatCalculationMethod setting
 * - Default: Income-based (backward compatible)
 * - Asset-based provides more accurate Islamic finance compliance
 */

import Decimal from 'decimal.js';
import type { Result } from '../../../types/result';
import { success, error } from '../../../types/result';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Zakat Calculation Methods
 */
export type ZakatCalculationMethod = 'INCOME_BASED' | 'ASSET_BASED';

/**
 * Standard Zakat Rate (2.5% = 1/40th)
 * This is the Islamic standard rate and should not be changed
 */
export const STANDARD_ZAKAT_RATE = new Decimal(0.025);

/**
 * Nisab Threshold (in SAR)
 *
 * Nisab is the minimum amount of wealth a person must possess for Zakat to be obligatory.
 * It is equivalent to the value of:
 * - 85 grams of gold, OR
 * - 595 grams of silver
 *
 * As of 2024, using gold standard:
 * - Gold price: ~250 SAR/gram
 * - Nisab (gold): 85g × 250 SAR/g = 21,250 SAR
 *
 * Note: This value should be updated annually based on current gold/silver prices
 * Consider making this configurable in admin_settings
 */
export const NISAB_THRESHOLD_SAR = new Decimal(21250);

/**
 * Income-Based Zakat Parameters
 */
export interface IncomeBasedZakatParams {
  /**
   * Net income or EBITDA for the period
   * Only positive income is subject to Zakat
   */
  netIncome: Decimal | number | string;

  /**
   * Zakat rate (default: 2.5%)
   * Usually kept at standard 0.025 (2.5%)
   */
  zakatRate?: Decimal | number | string;
}

/**
 * Asset-Based Zakat Parameters
 */
export interface AssetBasedZakatParams {
  /**
   * Cash and bank balances
   * Fully zakatable
   */
  cash: Decimal | number | string;

  /**
   * Accounts Receivable (amounts owed to the organization)
   * Typically zakatable if collectible
   */
  accountsReceivable: Decimal | number | string;

  /**
   * Inventory value (if applicable)
   * For schools, usually minimal or zero
   */
  inventory?: Decimal | number | string;

  /**
   * Zakat rate (default: 2.5%)
   */
  zakatRate?: Decimal | number | string;

  /**
   * Nisab threshold (minimum wealth for Zakat obligation)
   * Default: 21,250 SAR (based on 85g gold @ ~250 SAR/g)
   */
  nisabThreshold?: Decimal | number | string;
}

/**
 * FORMULA-003: Income-Based Zakat Calculation (Simplified Method)
 *
 * METHOD: Zakat = max(0, NetIncome) × ZakatRate
 *
 * RATIONALE:
 * - Simpler to implement and understand
 * - Based on profitability rather than balance sheet
 * - Common in corporate environments
 * - More conservative (may overstate Zakat on losses)
 *
 * PROS:
 * - Simple and transparent
 * - Easy to explain to stakeholders
 * - No balance sheet data required
 *
 * CONS:
 * - Not fully compliant with Islamic jurisprudence
 * - Ignores wealth held in assets
 * - May not reflect true zakatable wealth
 * - Not aligned with personal Zakat methodology
 *
 * RECOMMENDED FOR:
 * - Organizations prioritizing simplicity
 * - Corporate/institutional settings
 * - When balance sheet data is unreliable
 *
 * @param params - Income-based Zakat parameters
 * @returns Zakat amount (or zero if income is negative)
 *
 * @example
 * // Positive income
 * calculateIncomeBasedZakat({ netIncome: 10_000_000, zakatRate: 0.025 });
 * // Returns: 250,000 SAR (10M × 2.5%)
 *
 * @example
 * // Negative income (loss)
 * calculateIncomeBasedZakat({ netIncome: -2_000_000, zakatRate: 0.025 });
 * // Returns: 0 SAR (no Zakat on losses)
 */
export function calculateIncomeBasedZakat(params: IncomeBasedZakatParams): Result<Decimal> {
  try {
    const netIncome = new Decimal(params.netIncome);
    const zakatRate = params.zakatRate ? new Decimal(params.zakatRate) : STANDARD_ZAKAT_RATE;

    // Validate rate
    if (zakatRate.isNegative() || zakatRate.greaterThan(0.1)) {
      return error('Zakat rate must be between 0% and 10%');
    }

    // Only positive income is subject to Zakat
    const zakatableIncome = Decimal.max(0, netIncome);

    // Calculate Zakat: Income × Rate
    const zakat = zakatableIncome.times(zakatRate);

    return success(zakat);
  } catch (err) {
    return error(
      `Failed to calculate income-based Zakat: ${
        err instanceof Error ? err.message : 'Unknown error'
      }`
    );
  }
}

/**
 * FORMULA-003: Asset-Based Zakat Calculation (Full Islamic Method)
 *
 * METHOD:
 * 1. Calculate Total Zakatable Assets = Cash + AR + Inventory
 * 2. If Total ≥ Nisab Threshold: Zakat = Total × 2.5%
 * 3. If Total < Nisab Threshold: Zakat = 0 (no obligation)
 *
 * RATIONALE:
 * - Fully compliant with Islamic jurisprudence
 * - Based on wealth held, not income earned
 * - Applies Nisab threshold (minimum wealth requirement)
 * - Aligned with personal Zakat methodology
 *
 * PROS:
 * - Islamically accurate and compliant
 * - Fair wealth-based taxation
 * - Recognizes minimum exemption (Nisab)
 * - Consistent with Sharia scholars' guidance
 *
 * CONS:
 * - Requires accurate balance sheet data
 * - More complex to implement
 * - Requires annual Nisab threshold updates
 * - May be less familiar to corporate stakeholders
 *
 * RECOMMENDED FOR:
 * - Islamic institutions
 * - Organizations prioritizing Sharia compliance
 * - When accurate balance sheet data is available
 * - Schools with Islamic finance expertise
 *
 * ZAKATABLE ASSETS (for schools):
 * - Cash & Bank Balances: Fully zakatable
 * - Accounts Receivable: Zakatable if collectible (tuition receivables)
 * - Inventory: Usually minimal for schools (books, supplies)
 *
 * NON-ZAKATABLE ASSETS:
 * - Fixed Assets: Buildings, furniture, equipment (not zakatable)
 * - Accounts Payable: Liabilities reduce zakatable wealth (not included)
 *
 * @param params - Asset-based Zakat parameters
 * @returns Zakat amount (or zero if below Nisab threshold)
 *
 * @example
 * // Assets above Nisab threshold
 * calculateAssetBasedZakat({
 *   cash: 15_000_000,
 *   accountsReceivable: 8_000_000,
 *   inventory: 0,
 *   nisabThreshold: 21_250,
 * });
 * // Total zakatable: 23M SAR (above Nisab)
 * // Returns: 575,000 SAR (23M × 2.5%)
 *
 * @example
 * // Assets below Nisab threshold
 * calculateAssetBasedZakat({
 *   cash: 10_000,
 *   accountsReceivable: 5_000,
 *   inventory: 0,
 *   nisabThreshold: 21_250,
 * });
 * // Total zakatable: 15,000 SAR (below Nisab)
 * // Returns: 0 SAR (no Zakat obligation)
 */
export function calculateAssetBasedZakat(params: AssetBasedZakatParams): Result<Decimal> {
  try {
    const cash = new Decimal(params.cash);
    const accountsReceivable = new Decimal(params.accountsReceivable);
    const inventory = params.inventory ? new Decimal(params.inventory) : new Decimal(0);
    const zakatRate = params.zakatRate ? new Decimal(params.zakatRate) : STANDARD_ZAKAT_RATE;
    const nisabThreshold = params.nisabThreshold
      ? new Decimal(params.nisabThreshold)
      : NISAB_THRESHOLD_SAR;

    // Validate inputs
    if (cash.isNegative()) {
      return error('Cash cannot be negative');
    }
    if (accountsReceivable.isNegative()) {
      return error('Accounts Receivable cannot be negative');
    }
    if (inventory.isNegative()) {
      return error('Inventory cannot be negative');
    }
    if (zakatRate.isNegative() || zakatRate.greaterThan(0.1)) {
      return error('Zakat rate must be between 0% and 10%');
    }
    if (nisabThreshold.isNegative()) {
      return error('Nisab threshold cannot be negative');
    }

    // Step 1: Calculate total zakatable assets
    const zakatableAssets = cash.plus(accountsReceivable).plus(inventory);

    // Step 2: Check Nisab threshold
    if (zakatableAssets.lessThan(nisabThreshold)) {
      // Below Nisab - no Zakat obligation
      return success(new Decimal(0));
    }

    // Step 3: Calculate Zakat (2.5% of zakatable assets)
    const zakat = zakatableAssets.times(zakatRate);

    return success(zakat);
  } catch (err) {
    return error(
      `Failed to calculate asset-based Zakat: ${
        err instanceof Error ? err.message : 'Unknown error'
      }`
    );
  }
}

/**
 * FORMULA-003: Calculate Zakat (Method Selector)
 *
 * Main function that routes to appropriate calculation method
 * based on configuration.
 *
 * @param method - Calculation method ('INCOME_BASED' or 'ASSET_BASED')
 * @param params - Parameters for chosen method
 * @returns Zakat amount
 *
 * @example
 * // Income-based
 * calculateZakat('INCOME_BASED', { netIncome: 10_000_000 });
 *
 * @example
 * // Asset-based
 * calculateZakat('ASSET_BASED', {
 *   cash: 15_000_000,
 *   accountsReceivable: 8_000_000
 * });
 */
export function calculateZakat(
  method: ZakatCalculationMethod,
  params: IncomeBasedZakatParams | AssetBasedZakatParams
): Result<Decimal> {
  if (method === 'INCOME_BASED') {
    return calculateIncomeBasedZakat(params as IncomeBasedZakatParams);
  } else if (method === 'ASSET_BASED') {
    return calculateAssetBasedZakat(params as AssetBasedZakatParams);
  } else {
    return error(`Unknown Zakat calculation method: ${method}`);
  }
}

/**
 * Get Method Recommendation
 *
 * Provides recommendation on which method to use based on organization context
 *
 * @param context - Organization context
 * @returns Recommended method with justification
 */
export function getMethodRecommendation(context: {
  hasReliableBalanceSheet: boolean;
  prioritizesIslamicCompliance: boolean;
  isIslamicInstitution: boolean;
}): {
  method: ZakatCalculationMethod;
  reason: string;
} {
  if (context.isIslamicInstitution || context.prioritizesIslamicCompliance) {
    if (context.hasReliableBalanceSheet) {
      return {
        method: 'ASSET_BASED',
        reason:
          'Islamic institution with reliable balance sheet data should use asset-based method for full Sharia compliance',
      };
    } else {
      return {
        method: 'INCOME_BASED',
        reason:
          'Use income-based as temporary solution until balance sheet data improves, then transition to asset-based',
      };
    }
  }

  return {
    method: 'INCOME_BASED',
    reason: 'Income-based method recommended for simplicity and corporate familiarity',
  };
}
