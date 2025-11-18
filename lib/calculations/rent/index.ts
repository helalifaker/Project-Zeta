/**
 * Rent Calculation Router
 * Main entry point for all rent model calculations
 */

import type { RentModel } from '@prisma/client';
import type { Result } from '@/types/result';
import { error } from '@/types/result';
import { toDecimal } from '../decimal-helpers';
import Decimal from 'decimal.js';
import type {
  FixedEscalationParams,
  FixedEscalationResult,
} from './fixed-escalation';
import {
  calculateFixedEscalationRent,
  calculateFixedEscalationRentForYear,
  calculateFixedEscalationTotalRent,
} from './fixed-escalation';
import type {
  RevenueShareParams,
  RevenueShareResult,
} from './revenue-share';
import {
  calculateRevenueShareRent,
  calculateRevenueShareRentForYear,
  calculateRevenueShareTotalRent,
} from './revenue-share';
import type {
  PartnerModelParams,
  PartnerModelResult,
} from './partner-model';
import {
  calculatePartnerModelRent,
  calculatePartnerModelBaseRent,
  calculatePartnerModelTotalRent,
} from './partner-model';

export type RentCalculationParams =
  | ({ model: 'FIXED_ESCALATION' } & FixedEscalationParams)
  | ({ model: 'REVENUE_SHARE' } & RevenueShareParams)
  | ({ model: 'PARTNER_MODEL' } & PartnerModelParams);

export type RentCalculationResult =
  | FixedEscalationResult[]
  | RevenueShareResult[]
  | PartnerModelResult[];

/**
 * Calculate rent based on model type
 */
export function calculateRent(
  params: RentCalculationParams
): Result<RentCalculationResult> {
  switch (params.model) {
    case 'FIXED_ESCALATION': {
      const { model: _model, ...fixedParams } = params;
      return calculateFixedEscalationRent(fixedParams);
    }

    case 'REVENUE_SHARE': {
      const { model: _model, ...revenueParams } = params;
      return calculateRevenueShareRent(revenueParams);
    }

    case 'PARTNER_MODEL': {
      const { model: _model, ...partnerParams } = params;
      return calculatePartnerModelRent(partnerParams);
    }

    default:
      return error(`Unknown rent model: ${(params as { model: string }).model}`);
  }
}

/**
 * Calculate rent for a single year
 */
export function calculateRentForYear(
  model: RentModel,
  params: unknown,
  year: number
): Result<{ rent: number }> {
  switch (model) {
    case 'FIXED_ESCALATION': {
      const p = params as FixedEscalationParams;
      const result = calculateFixedEscalationRentForYear(
        p.baseRent,
        p.escalationRate,
        p.startYear,
        year,
        p.frequency ?? 1
      );
      if (!result.success) {
        return result;
      }
      return { success: true, data: { rent: result.data.toNumber() } };
    }

    case 'REVENUE_SHARE': {
      const p = params as RevenueShareParams;
      // Find revenue for the year
      const revenueItem = p.revenueByYear.find((item) => item.year === year);
      if (!revenueItem) {
        return error(`Revenue data not found for year ${year}`);
      }
      const result = calculateRevenueShareRentForYear(
        revenueItem.revenue,
        p.revenueSharePercent
      );
      if (!result.success) {
        return result;
      }
      return { success: true, data: { rent: result.data.toNumber() } };
    }

    case 'PARTNER_MODEL': {
      const p = params as PartnerModelParams;
      // Calculate base rent (year 1)
      const baseResult = calculatePartnerModelBaseRent(
        p.landSize,
        p.landPricePerSqm,
        p.buaSize,
        p.constructionCostPerSqm,
        p.yieldBase
      );
      if (!baseResult.success) {
        return baseResult;
      }
      
      // Apply escalation for years 2+
      const yearsFromStart = year - p.startYear;
      if (yearsFromStart > 0) {
        const freq = p.frequency ?? 1;
        const growthRate = p.growthRate ?? 0;
        const growthRateDecimal = toDecimal(growthRate);
        
        if (growthRateDecimal.greaterThan(0)) {
          const escalations = Math.floor(yearsFromStart / freq);
          if (escalations > 0) {
            const escalationFactor = Decimal.add(1, growthRateDecimal).pow(escalations);
            const escalatedRent = baseResult.data.times(escalationFactor);
            return { success: true, data: { rent: escalatedRent.toNumber() } };
          }
        }
      }
      
      return { success: true, data: { rent: baseResult.data.toNumber() } };
    }

    default:
      return error(`Unknown rent model: ${model}`);
  }
}

/**
 * Calculate total rent over a period
 */
export function calculateTotalRent(
  params: RentCalculationParams
): Result<number> {
  switch (params.model) {
    case 'FIXED_ESCALATION': {
      const { model: _model, ...fixedParams } = params;
      const result = calculateFixedEscalationTotalRent(fixedParams);
      if (!result.success) {
        return result;
      }
      return { success: true, data: result.data.toNumber() };
    }

    case 'REVENUE_SHARE': {
      const { model: _model, ...revenueParams } = params;
      const result = calculateRevenueShareTotalRent(revenueParams);
      if (!result.success) {
        return result;
      }
      return { success: true, data: result.data.toNumber() };
    }

    case 'PARTNER_MODEL': {
      const { model: _model, ...partnerParams } = params;
      const result = calculatePartnerModelTotalRent(partnerParams);
      if (!result.success) {
        return result;
      }
      return { success: true, data: result.data.toNumber() };
    }

    default:
      return error(`Unknown rent model: ${(params as { model: string }).model}`);
  }
}

// Re-export all functions for direct use
export * from './fixed-escalation';
export * from './revenue-share';
export * from './partner-model';

