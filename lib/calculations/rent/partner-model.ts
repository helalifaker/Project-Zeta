/**
 * Partner Model Rent Calculation
 * Calculates rent based on land value + construction cost × yield
 *
 * Formula: rent(t) = (land_size × land_price_per_sqm + bua_size × construction_cost_per_sqm) × yield_base
 *
 * @example
 * Land: 10,000 sqm @ 5K SAR/sqm = 50M
 * BUA: 8,000 sqm @ 3K SAR/sqm = 24M
 * Total: 74M
 * Yield: 4.5%
 * Rent: 74M × 0.045 = 3.33M SAR/year
 */

import Decimal from 'decimal.js';
import { toDecimal } from '../decimal-helpers';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';

export interface PartnerModelParams {
  landSize: Decimal | number | string; // in square meters
  landPricePerSqm: Decimal | number | string; // SAR per sqm
  buaSize: Decimal | number | string; // Built-up area in square meters
  constructionCostPerSqm: Decimal | number | string; // SAR per sqm
  yieldBase: Decimal | number | string; // e.g., 0.045 for 4.5%
  growthRate?: Decimal | number | string; // Annual rent growth rate (0-1, e.g., 0.03 = 3%), optional, default 0
  frequency?: number; // Apply growth every N years (1, 2, 3, 4, or 5), optional, default 1
  startYear: number;
  endYear: number;
}

export interface PartnerModelResult {
  year: number;
  landValue: Decimal;
  constructionCost: Decimal;
  totalValue: Decimal;
  rent: Decimal;
}

/**
 * Calculate base rent using partner model (same for all years)
 */
export function calculatePartnerModelBaseRent(
  landSize: Decimal | number | string,
  landPricePerSqm: Decimal | number | string,
  buaSize: Decimal | number | string,
  constructionCostPerSqm: Decimal | number | string,
  yieldBase: Decimal | number | string
): Result<Decimal> {
  try {
    const land = toDecimal(landSize);
    const landPrice = toDecimal(landPricePerSqm);
    const bua = toDecimal(buaSize);
    const constructionCost = toDecimal(constructionCostPerSqm);
    const yieldRate = toDecimal(yieldBase);

    // Validate inputs
    if (land.isNegative() || land.isZero()) {
      return error('Land size must be positive');
    }

    if (landPrice.isNegative() || landPrice.isZero()) {
      return error('Land price per sqm must be positive');
    }

    if (bua.isNegative() || bua.isZero()) {
      return error('BUA size must be positive');
    }

    if (constructionCost.isNegative() || constructionCost.isZero()) {
      return error('Construction cost per sqm must be positive');
    }

    if (yieldRate.isNegative() || yieldRate.isZero() || yieldRate.greaterThan(1)) {
      return error('Yield must be between 0 and 1 (0% to 100%)');
    }

    // Calculate: (land_size × land_price + bua_size × construction_cost) × yield
    const landValue = land.times(landPrice);
    const constructionValue = bua.times(constructionCost);
    const totalValue = landValue.plus(constructionValue);
    const rent = totalValue.times(yieldRate);

    return success(rent);
  } catch (err) {
    return error(`Failed to calculate partner model rent: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Calculate rent for multiple years using partner model
 * Supports optional rent escalation with growth rate and frequency
 */
export function calculatePartnerModelRent(
  params: PartnerModelParams
): Result<PartnerModelResult[]> {
  try {
    const {
      landSize,
      landPricePerSqm,
      buaSize,
      constructionCostPerSqm,
      yieldBase,
      growthRate = 0,
      frequency = 1,
      startYear,
      endYear,
    } = params;

    // Validate year range
    if (startYear > endYear) {
      return error('Start year must be <= end year');
    }

    if (startYear < 2023 || endYear > 2052) {
      return error('Years must be between 2023 and 2052');
    }

    // Calculate base values
    const land = toDecimal(landSize);
    const landPrice = toDecimal(landPricePerSqm);
    const bua = toDecimal(buaSize);
    const constructionCost = toDecimal(constructionCostPerSqm);
    const yieldRate = toDecimal(yieldBase);
    const growth = toDecimal(growthRate ?? 0);
    const freq = frequency ?? 1;

    // Validate inputs
    if (land.isNegative() || land.isZero()) {
      return error('Land size must be positive');
    }

    if (landPrice.isNegative() || landPrice.isZero()) {
      return error('Land price per sqm must be positive');
    }

    if (bua.isNegative() || bua.isZero()) {
      return error('BUA size must be positive');
    }

    if (constructionCost.isNegative() || constructionCost.isZero()) {
      return error('Construction cost per sqm must be positive');
    }

    if (yieldRate.isNegative() || yieldRate.isZero() || yieldRate.greaterThan(1)) {
      return error('Yield must be between 0 and 1 (0% to 100%)');
    }

    // Validate growth rate (0 to 1, i.e., 0% to 100%)
    if (growth.isNegative() || growth.greaterThan(1)) {
      return error('Growth rate must be between 0 and 1 (0% to 100%)');
    }

    // Validate frequency (1, 2, 3, 4, or 5)
    if (![1, 2, 3, 4, 5].includes(freq)) {
      return error('Frequency must be 1, 2, 3, 4, or 5 years');
    }

    // Calculate base values
    const landValue = land.times(landPrice);
    const constructionValue = bua.times(constructionCost);
    const totalValue = landValue.plus(constructionValue);
    const baseRent = totalValue.times(yieldRate);

    // Create results for each year with optional escalation
    const results: PartnerModelResult[] = [];

    for (let year = startYear; year <= endYear; year++) {
      let rent = baseRent;

      // Year 1: Use base rent (calculated from yield) - no escalation
      // Year 2+: Apply escalation rate with frequency
      const yearsFromStart = year - startYear;
      
      // Only apply escalation for years 2+ (yearsFromStart > 0)
      // AND only if growth rate is set (growthRate > 0)
      if (yearsFromStart > 0 && growth.greaterThan(0)) {
        // Calculate number of escalations based on frequency
        // Example: frequency=2, yearsFromStart=3 → escalations = floor(3/2) = 1
        const escalations = Math.floor(yearsFromStart / freq);
        
        // Apply escalation only if escalations > 0
        // This ensures Year 1 (yearsFromStart=0, escalations=0) uses base rent
        // And Year 2 with frequency=2 (yearsFromStart=1, escalations=0) also uses base rent
        if (escalations > 0) {
          const escalationFactor = Decimal.add(1, growth).pow(escalations);
          rent = baseRent.times(escalationFactor);
        }
      }

      results.push({
        year,
        landValue,
        constructionCost: constructionValue,
        totalValue,
        rent,
      });
    }

    return success(results);
  } catch (err) {
    return error(`Failed to calculate partner model rent: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Calculate total rent over a period (sum of all years)
 */
export function calculatePartnerModelTotalRent(
  params: PartnerModelParams
): Result<Decimal> {
  const result = calculatePartnerModelRent(params);

  if (!result.success) {
    return result;
  }

  try {
    const total = result.data.reduce(
      (sum, item) => sum.plus(item.rent),
      new Decimal(0)
    );

    return success(total);
  } catch (err) {
    return error(`Failed to calculate total rent: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

