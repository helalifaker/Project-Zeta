/**
 * Unit Tests: Fixed Escalation Rent Model
 */

import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  calculateFixedEscalationRent,
  calculateFixedEscalationRentForYear,
  calculateFixedEscalationTotalRent,
  type FixedEscalationParams,
} from '../fixed-escalation';

describe('Fixed Escalation Rent Model', () => {
  describe('calculateFixedEscalationRentForYear', () => {
    it('should calculate rent for year 1 (start year)', () => {
      const result = calculateFixedEscalationRentForYear(
        1_000_000, // 1M SAR
        0.04, // 4%
        2028,
        2028
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(1_000_000);
      }
    });

    it('should calculate rent for year 2 with 4% escalation', () => {
      const result = calculateFixedEscalationRentForYear(
        1_000_000,
        0.04,
        2028,
        2029
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(1_040_000);
      }
    });

    it('should calculate rent for year 3 with 4% escalation', () => {
      const result = calculateFixedEscalationRentForYear(
        1_000_000,
        0.04,
        2028,
        2030
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // 1M × (1.04)^2 = 1,081,600
        expect(result.data.toNumber()).toBeCloseTo(1_081_600, 0);
      }
    });

    it('should handle zero escalation rate', () => {
      const result = calculateFixedEscalationRentForYear(
        1_000_000,
        0, // 0% escalation
        2028,
        2030
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(1_000_000);
      }
    });

    it('should reject negative base rent', () => {
      const result = calculateFixedEscalationRentForYear(
        -1_000_000,
        0.04,
        2028,
        2028
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Base rent must be positive');
      }
    });

    it('should reject negative escalation rate', () => {
      const result = calculateFixedEscalationRentForYear(
        1_000_000,
        -0.01,
        2028,
        2028
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Escalation rate cannot be negative');
      }
    });

    it('should reject year before start year', () => {
      const result = calculateFixedEscalationRentForYear(
        1_000_000,
        0.04,
        2028,
        2027
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Year must be >= start year');
      }
    });

    it('should work with Decimal.js inputs', () => {
      const result = calculateFixedEscalationRentForYear(
        new Decimal(1_000_000),
        new Decimal(0.04),
        2028,
        2029
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(1_040_000);
      }
    });
  });

  describe('calculateFixedEscalationRent', () => {
    it('should calculate rent for multiple years', () => {
      const params: FixedEscalationParams = {
        baseRent: 1_000_000,
        escalationRate: 0.04,
        startYear: 2028,
        endYear: 2030,
      };

      const result = calculateFixedEscalationRent(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(3);
        expect(result.data[0]?.year).toBe(2028);
        expect(result.data[0]?.rent.toNumber()).toBe(1_000_000);
        expect(result.data[1]?.year).toBe(2029);
        expect(result.data[1]?.rent.toNumber()).toBe(1_040_000);
        expect(result.data[2]?.year).toBe(2030);
        expect(result.data[2]?.rent.toNumber()).toBeCloseTo(1_081_600, 0);
      }
    });

    it('should handle 30-year period', () => {
      const params: FixedEscalationParams = {
        baseRent: 1_000_000,
        escalationRate: 0.04,
        startYear: 2028,
        endYear: 2052,
      };

      const result = calculateFixedEscalationRent(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(25); // 2028-2052 = 25 years
        expect(result.data[0]?.year).toBe(2028);
        expect(result.data[result.data.length - 1]?.year).toBe(2052);
      }
    });

    it('should reject invalid year range', () => {
      const params: FixedEscalationParams = {
        baseRent: 1_000_000,
        escalationRate: 0.04,
        startYear: 2030,
        endYear: 2028, // Invalid: end < start
      };

      const result = calculateFixedEscalationRent(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Start year must be <= end year');
      }
    });

    it('should reject years outside valid range', () => {
      const params: FixedEscalationParams = {
        baseRent: 1_000_000,
        escalationRate: 0.04,
        startYear: 2020, // Too early
        endYear: 2028,
      };

      const result = calculateFixedEscalationRent(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Years must be between 2023 and 2052');
      }
    });

    it('should calculate correct escalation factors', () => {
      const params: FixedEscalationParams = {
        baseRent: 1_000_000,
        escalationRate: 0.05, // 5%
        startYear: 2028,
        endYear: 2030,
      };

      const result = calculateFixedEscalationRent(params);

      expect(result.success).toBe(true);
      if (result.success) {
        // Year 0: factor = 1.0
        expect(result.data[0]?.escalationFactor.toNumber()).toBe(1.0);
        // Year 1: factor = 1.05
        expect(result.data[1]?.escalationFactor.toNumber()).toBe(1.05);
        // Year 2: factor = 1.1025
        expect(result.data[2]?.escalationFactor.toNumber()).toBeCloseTo(1.1025, 4);
      }
    });
  });

  describe('calculateFixedEscalationTotalRent', () => {
    it('should calculate total rent over period', () => {
      const params: FixedEscalationParams = {
        baseRent: 1_000_000,
        escalationRate: 0.04,
        startYear: 2028,
        endYear: 2030,
      };

      const result = calculateFixedEscalationTotalRent(params);

      expect(result.success).toBe(true);
      if (result.success) {
        // 1M + 1.04M + 1.0816M = 3,121,600
        expect(result.data.toNumber()).toBeCloseTo(3_121_600, 0);
      }
    });

    it('should handle single year period', () => {
      const params: FixedEscalationParams = {
        baseRent: 1_000_000,
        escalationRate: 0.04,
        startYear: 2028,
        endYear: 2028,
      };

      const result = calculateFixedEscalationTotalRent(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toNumber()).toBe(1_000_000);
      }
    });
  });
});

