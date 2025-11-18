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
        // All years should have the same rent (no escalation)
        const firstRent = result.data[0]?.rent.toNumber();
        const lastRent = result.data[result.data.length - 1]?.rent.toNumber();
        expect(firstRent).toBe(lastRent);
      }
    });

    it('should apply rent escalation with 3% growth every 2 years', () => {
      const params: PartnerModelParams = {
        landSize: 10_000,
        landPricePerSqm: 5_000,
        buaSize: 8_000,
        constructionCostPerSqm: 3_000,
        yieldBase: 0.045,
        growthRate: 0.03, // 3%
        frequency: 2, // Every 2 years
        startYear: 2028,
        endYear: 2033,
      };

      const result = calculatePartnerModelRent(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(6); // 2028-2033 = 6 years
        
        const baseRent = 3_330_000; // 74M × 0.045
        
        // 2028-2029: Base rent (no escalation yet)
        expect(result.data[0]?.rent.toNumber()).toBeCloseTo(baseRent, 0);
        expect(result.data[1]?.rent.toNumber()).toBeCloseTo(baseRent, 0);
        
        // 2030-2031: First escalation (3% increase)
        const year2Rent = baseRent * 1.03;
        expect(result.data[2]?.rent.toNumber()).toBeCloseTo(year2Rent, 0);
        expect(result.data[3]?.rent.toNumber()).toBeCloseTo(year2Rent, 0);
        
        // 2032-2033: Second escalation (3% × 2 = 6.09% total)
        const year4Rent = baseRent * 1.03 * 1.03;
        expect(result.data[4]?.rent.toNumber()).toBeCloseTo(year4Rent, 0);
        expect(result.data[5]?.rent.toNumber()).toBeCloseTo(year4Rent, 0);
      }
    });

    it('should apply rent escalation with 5% growth every 1 year', () => {
      const params: PartnerModelParams = {
        landSize: 10_000,
        landPricePerSqm: 5_000,
        buaSize: 8_000,
        constructionCostPerSqm: 3_000,
        yieldBase: 0.045,
        growthRate: 0.05, // 5%
        frequency: 1, // Every year
        startYear: 2028,
        endYear: 2030,
      };

      const result = calculatePartnerModelRent(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const baseRent = 3_330_000;
        
        // 2028: Base rent
        expect(result.data[0]?.rent.toNumber()).toBeCloseTo(baseRent, 0);
        
        // 2029: First escalation (5% increase)
        expect(result.data[1]?.rent.toNumber()).toBeCloseTo(baseRent * 1.05, 0);
        
        // 2030: Second escalation (5% × 2 = 10.25% total)
        expect(result.data[2]?.rent.toNumber()).toBeCloseTo(baseRent * 1.05 * 1.05, 0);
      }
    });

    it('should apply rent escalation with 2% growth every 5 years', () => {
      const params: PartnerModelParams = {
        landSize: 10_000,
        landPricePerSqm: 5_000,
        buaSize: 8_000,
        constructionCostPerSqm: 3_000,
        yieldBase: 0.045,
        growthRate: 0.02, // 2%
        frequency: 5, // Every 5 years
        startYear: 2028,
        endYear: 2042,
      };

      const result = calculatePartnerModelRent(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const baseRent = 3_330_000;
        
        // 2028-2032: Base rent (no escalation)
        for (let i = 0; i < 5; i++) {
          expect(result.data[i]?.rent.toNumber()).toBeCloseTo(baseRent, 0);
        }
        
        // 2033-2037: First escalation (2% increase)
        const year5Rent = baseRent * 1.02;
        for (let i = 5; i < 10; i++) {
          expect(result.data[i]?.rent.toNumber()).toBeCloseTo(year5Rent, 0);
        }
        
        // 2038-2042: Second escalation (2% × 2 = 4.04% total)
        const year10Rent = baseRent * 1.02 * 1.02;
        for (let i = 10; i < 15; i++) {
          expect(result.data[i]?.rent.toNumber()).toBeCloseTo(year10Rent, 0);
        }
      }
    });

    it('should maintain flat rent when growthRate is 0', () => {
      const params: PartnerModelParams = {
        landSize: 10_000,
        landPricePerSqm: 5_000,
        buaSize: 8_000,
        constructionCostPerSqm: 3_000,
        yieldBase: 0.045,
        growthRate: 0, // No growth
        frequency: 2,
        startYear: 2028,
        endYear: 2032,
      };

      const result = calculatePartnerModelRent(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const baseRent = 3_330_000;
        // All years should have the same rent
        result.data.forEach((item) => {
          expect(item.rent.toNumber()).toBeCloseTo(baseRent, 0);
        });
      }
    });

    it('should reject invalid growth rate (> 100%)', () => {
      const params: PartnerModelParams = {
        landSize: 10_000,
        landPricePerSqm: 5_000,
        buaSize: 8_000,
        constructionCostPerSqm: 3_000,
        yieldBase: 0.045,
        growthRate: 1.1, // 110% (invalid)
        frequency: 2,
        startYear: 2028,
        endYear: 2030,
      };

      const result = calculatePartnerModelRent(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Growth rate must be between 0 and 1');
      }
    });

    it('should reject invalid frequency', () => {
      const params: PartnerModelParams = {
        landSize: 10_000,
        landPricePerSqm: 5_000,
        buaSize: 8_000,
        constructionCostPerSqm: 3_000,
        yieldBase: 0.045,
        growthRate: 0.03,
        frequency: 6, // Invalid (must be 1-5)
        startYear: 2028,
        endYear: 2030,
      };

      const result = calculatePartnerModelRent(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Frequency must be 1, 2, 3, 4, or 5 years');
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

    it('should calculate year 1 rent using yield only (no escalation)', () => {
      const params: PartnerModelParams = {
        landSize: 10_000,
        landPricePerSqm: 5_000,
        buaSize: 8_000,
        constructionCostPerSqm: 3_000,
        yieldBase: 0.045, // 4.5%
        growthRate: 0.04, // 4% (should not apply to year 1)
        frequency: 2,
        startYear: 2028,
        endYear: 2028, // Only year 1
      };

      const result = calculatePartnerModelRent(params);

      expect(result.success).toBe(true);
      if (result.success) {
        // Year 1: (10,000 × 5,000 + 8,000 × 3,000) × 0.045 = 3,330,000
        const expectedRent = (10_000 * 5_000 + 8_000 * 3_000) * 0.045;
        expect(result.data[0]?.rent.toNumber()).toBeCloseTo(expectedRent, 0);
      }
    });

    it('should apply escalation to years 2+ based on frequency', () => {
      const params: PartnerModelParams = {
        landSize: 10_000,
        landPricePerSqm: 5_000,
        buaSize: 8_000,
        constructionCostPerSqm: 3_000,
        yieldBase: 0.045, // 4.5%
        growthRate: 0.04, // 4% escalation
        frequency: 2, // Every 2 years
        startYear: 2028,
        endYear: 2032,
      };

      const result = calculatePartnerModelRent(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const baseRent = (10_000 * 5_000 + 8_000 * 3_000) * 0.045; // 3,330,000
        
        // Year 2028: baseRent (no escalation)
        expect(result.data[0]?.rent.toNumber()).toBeCloseTo(baseRent, 0);
        
        // Year 2029: baseRent (no escalation yet, frequency=2)
        expect(result.data[1]?.rent.toNumber()).toBeCloseTo(baseRent, 0);
        
        // Year 2030: baseRent × 1.04 (first escalation)
        expect(result.data[2]?.rent.toNumber()).toBeCloseTo(baseRent * 1.04, 0);
        
        // Year 2031: baseRent × 1.04 (same as 2030)
        expect(result.data[3]?.rent.toNumber()).toBeCloseTo(baseRent * 1.04, 0);
        
        // Year 2032: baseRent × 1.04^2 (second escalation)
        expect(result.data[4]?.rent.toNumber()).toBeCloseTo(baseRent * 1.0816, 0);
      }
    });

    it('should keep rent constant if growthRate is 0', () => {
      const params: PartnerModelParams = {
        landSize: 10_000,
        landPricePerSqm: 5_000,
        buaSize: 8_000,
        constructionCostPerSqm: 3_000,
        yieldBase: 0.045,
        growthRate: 0, // No escalation
        frequency: 2,
        startYear: 2028,
        endYear: 2032,
      };

      const result = calculatePartnerModelRent(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const baseRent = (10_000 * 5_000 + 8_000 * 3_000) * 0.045;
        // All years should have same rent (no escalation)
        result.data.forEach((year) => {
          expect(year.rent.toNumber()).toBeCloseTo(baseRent, 0);
        });
      }
    });
  });
});

