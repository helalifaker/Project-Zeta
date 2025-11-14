/**
 * Unit Tests: Partner Model Rent Calculation
 */

import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  calculatePartnerModelRent,
  calculatePartnerModelBaseRent,
  calculatePartnerModelTotalRent,
  type PartnerModelParams,
} from '../partner-model';

describe('Partner Model Rent Calculation', () => {
  describe('calculatePartnerModelBaseRent', () => {
    it('should calculate rent correctly', () => {
      // Example from PRD:
      // Land: 10,000 sqm @ 5K SAR/sqm = 50M
      // BUA: 8,000 sqm @ 3K SAR/sqm = 24M
      // Total: 74M
      // Yield: 4.5%
      // Rent: 74M × 0.045 = 3.33M SAR/year
      const result = calculatePartnerModelBaseRent(
        10_000, // land size (sqm)
        5_000, // land price per sqm
        8_000, // BUA size (sqm)
        3_000, // construction cost per sqm
        0.045 // 4.5% yield
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Land value: 10,000 × 5,000 = 50,000,000
        // Construction: 8,000 × 3,000 = 24,000,000
        // Total: 74,000,000
        // Rent: 74,000,000 × 0.045 = 3,330,000
        expect(result.data.toNumber()).toBeCloseTo(3_330_000, 0);
      }
    });

    it('should reject negative land size', () => {
      const result = calculatePartnerModelBaseRent(
        -10_000,
        5_000,
        8_000,
        3_000,
        0.045
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Land size must be positive');
      }
    });

    it('should reject negative land price', () => {
      const result = calculatePartnerModelBaseRent(
        10_000,
        -5_000,
        8_000,
        3_000,
        0.045
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Land price per sqm must be positive');
      }
    });

    it('should reject negative BUA size', () => {
      const result = calculatePartnerModelBaseRent(
        10_000,
        5_000,
        -8_000,
        3_000,
        0.045
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('BUA size must be positive');
      }
    });

    it('should reject negative construction cost', () => {
      const result = calculatePartnerModelBaseRent(
        10_000,
        5_000,
        8_000,
        -3_000,
        0.045
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Construction cost per sqm must be positive');
      }
    });

    it('should reject negative yield', () => {
      const result = calculatePartnerModelBaseRent(
        10_000,
        5_000,
        8_000,
        3_000,
        -0.01
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Yield must be between 0 and 1');
      }
    });

    it('should reject yield > 100%', () => {
      const result = calculatePartnerModelBaseRent(
        10_000,
        5_000,
        8_000,
        3_000,
        1.1
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Yield must be between 0 and 1');
      }
    });

    it('should work with Decimal.js inputs', () => {
      const result = calculatePartnerModelBaseRent(
        new Decimal(10_000),
        new Decimal(5_000),
        new Decimal(8_000),
        new Decimal(3_000),
        new Decimal(0.045)
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBeCloseTo(3_330_000, 0);
      }
    });
  });

  describe('calculatePartnerModelRent', () => {
    it('should calculate constant rent for all years', () => {
      const params: PartnerModelParams = {
        landSize: 10_000,
        landPricePerSqm: 5_000,
        buaSize: 8_000,
        constructionCostPerSqm: 3_000,
        yieldBase: 0.045,
        startYear: 2028,
        endYear: 2030,
      };

      const result = calculatePartnerModelRent(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(3);
        const rent = result.data[0]?.rent.toNumber();
        
        // All years should have the same rent
        expect(result.data[0]?.rent.toNumber()).toBeCloseTo(rent!, 0);
        expect(result.data[1]?.rent.toNumber()).toBeCloseTo(rent!, 0);
        expect(result.data[2]?.rent.toNumber()).toBeCloseTo(rent!, 0);
        
        // Verify values
        expect(result.data[0]?.landValue.toNumber()).toBe(50_000_000);
        expect(result.data[0]?.constructionCost.toNumber()).toBe(24_000_000);
        expect(result.data[0]?.totalValue.toNumber()).toBe(74_000_000);
      }
    });

    it('should handle 30-year period', () => {
      const params: PartnerModelParams = {
        landSize: 10_000,
        landPricePerSqm: 5_000,
        buaSize: 8_000,
        constructionCostPerSqm: 3_000,
        yieldBase: 0.045,
        startYear: 2028,
        endYear: 2052,
      };

      const result = calculatePartnerModelRent(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(25); // 2028-2052 = 25 years
        // All years should have the same rent
        const firstRent = result.data[0]?.rent.toNumber();
        const lastRent = result.data[result.data.length - 1]?.rent.toNumber();
        expect(firstRent).toBe(lastRent);
      }
    });

    it('should reject invalid year range', () => {
      const params: PartnerModelParams = {
        landSize: 10_000,
        landPricePerSqm: 5_000,
        buaSize: 8_000,
        constructionCostPerSqm: 3_000,
        yieldBase: 0.045,
        startYear: 2030,
        endYear: 2028, // Invalid
      };

      const result = calculatePartnerModelRent(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Start year must be <= end year');
      }
    });
  });

  describe('calculatePartnerModelTotalRent', () => {
    it('should calculate total rent over period', () => {
      const params: PartnerModelParams = {
        landSize: 10_000,
        landPricePerSqm: 5_000,
        buaSize: 8_000,
        constructionCostPerSqm: 3_000,
        yieldBase: 0.045,
        startYear: 2028,
        endYear: 2030,
      };

      const result = calculatePartnerModelTotalRent(params);

      expect(result.success).toBe(true);
      if (result.success) {
        // 3.33M × 3 years = 9.99M (approximately)
        // Allow for small rounding differences
        const total = result.data.toNumber();
        expect(total).toBeGreaterThan(9_980_000);
        expect(total).toBeLessThan(10_000_000);
      }
    });
  });
});

