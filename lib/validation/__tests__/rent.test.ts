/**
 * Unit Tests: Rent Validation Schemas
 */

import { describe, it, expect } from 'vitest';
import { RentPlanBaseSchema } from '@/lib/validation/rent';

describe('Rent Validation', () => {
  describe('Partner Model', () => {
    it('should require frequency for Partner Model', () => {
      const invalidParams = {
        rentModel: 'PARTNER_MODEL',
        parameters: {
          landSize: 10000,
          landPricePerSqm: 5000,
          buaSize: 8000,
          constructionCostPerSqm: 3000,
          yieldBase: 0.045,
          // frequency missing - should fail
        },
      };

      const result = RentPlanBaseSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it('should accept valid Partner Model with frequency', () => {
      const validParams = {
        rentModel: 'PARTNER_MODEL',
        parameters: {
          landSize: 10000,
          landPricePerSqm: 5000,
          buaSize: 8000,
          constructionCostPerSqm: 3000,
          yieldBase: 0.045,
          frequency: 2,
        },
      };

      const result = RentPlanBaseSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('should accept Partner Model with optional growthRate', () => {
      const validParams = {
        rentModel: 'PARTNER_MODEL',
        parameters: {
          landSize: 10000,
          landPricePerSqm: 5000,
          buaSize: 8000,
          constructionCostPerSqm: 3000,
          yieldBase: 0.045,
          growthRate: 0.04,
          frequency: 2,
        },
      };

      const result = RentPlanBaseSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });
  });
});

