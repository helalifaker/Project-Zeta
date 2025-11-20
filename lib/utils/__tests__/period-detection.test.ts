/**
 * Unit Tests: Period Detection Utilities
 *
 * Tests all period detection functions with comprehensive coverage
 */

import { describe, it, expect } from 'vitest';
import {
  getPeriodForYear,
  isHistoricalYear,
  isTransitionYear,
  isDynamicYear,
  getYearsForPeriod,
  getPeriodBoundaries,
  getPeriodDescription,
  type Period,
} from '../period-detection';

describe('Period Detection Utilities', () => {
  describe('getPeriodForYear', () => {
    describe('HISTORICAL period (2023-2024)', () => {
      it('should return HISTORICAL for year 2023', () => {
        expect(getPeriodForYear(2023)).toBe('HISTORICAL');
      });

      it('should return HISTORICAL for year 2024', () => {
        expect(getPeriodForYear(2024)).toBe('HISTORICAL');
      });
    });

    describe('TRANSITION period (2025-2027)', () => {
      it('should return TRANSITION for year 2025', () => {
        expect(getPeriodForYear(2025)).toBe('TRANSITION');
      });

      it('should return TRANSITION for year 2026', () => {
        expect(getPeriodForYear(2026)).toBe('TRANSITION');
      });

      it('should return TRANSITION for year 2027', () => {
        expect(getPeriodForYear(2027)).toBe('TRANSITION');
      });
    });

    describe('DYNAMIC period (2028-2052)', () => {
      it('should return DYNAMIC for year 2028', () => {
        expect(getPeriodForYear(2028)).toBe('DYNAMIC');
      });

      it('should return DYNAMIC for year 2030', () => {
        expect(getPeriodForYear(2030)).toBe('DYNAMIC');
      });

      it('should return DYNAMIC for year 2040', () => {
        expect(getPeriodForYear(2040)).toBe('DYNAMIC');
      });

      it('should return DYNAMIC for year 2052', () => {
        expect(getPeriodForYear(2052)).toBe('DYNAMIC');
      });
    });

    describe('Edge cases and validation', () => {
      it('should throw error for year before 2023', () => {
        expect(() => getPeriodForYear(2022)).toThrow('Invalid year: 2022');
      });

      it('should throw error for year after 2052', () => {
        expect(() => getPeriodForYear(2053)).toThrow('Invalid year: 2053');
      });

      it('should throw error for year 2000', () => {
        expect(() => getPeriodForYear(2000)).toThrow('Invalid year: 2000');
      });

      it('should throw error for negative year', () => {
        expect(() => getPeriodForYear(-1)).toThrow('Invalid year: -1');
      });
    });

    describe('Boundary transitions', () => {
      it('should correctly handle transition from HISTORICAL to TRANSITION (2024->2025)', () => {
        expect(getPeriodForYear(2024)).toBe('HISTORICAL');
        expect(getPeriodForYear(2025)).toBe('TRANSITION');
      });

      it('should correctly handle transition from TRANSITION to DYNAMIC (2027->2028)', () => {
        expect(getPeriodForYear(2027)).toBe('TRANSITION');
        expect(getPeriodForYear(2028)).toBe('DYNAMIC');
      });
    });
  });

  describe('isHistoricalYear', () => {
    it('should return true for 2023', () => {
      expect(isHistoricalYear(2023)).toBe(true);
    });

    it('should return true for 2024', () => {
      expect(isHistoricalYear(2024)).toBe(true);
    });

    it('should return false for 2022', () => {
      expect(isHistoricalYear(2022)).toBe(false);
    });

    it('should return false for 2025', () => {
      expect(isHistoricalYear(2025)).toBe(false);
    });

    it('should return false for 2030', () => {
      expect(isHistoricalYear(2030)).toBe(false);
    });
  });

  describe('isTransitionYear', () => {
    it('should return true for 2025', () => {
      expect(isTransitionYear(2025)).toBe(true);
    });

    it('should return true for 2026', () => {
      expect(isTransitionYear(2026)).toBe(true);
    });

    it('should return true for 2027', () => {
      expect(isTransitionYear(2027)).toBe(true);
    });

    it('should return false for 2024', () => {
      expect(isTransitionYear(2024)).toBe(false);
    });

    it('should return false for 2028', () => {
      expect(isTransitionYear(2028)).toBe(false);
    });

    it('should return false for 2030', () => {
      expect(isTransitionYear(2030)).toBe(false);
    });
  });

  describe('isDynamicYear', () => {
    it('should return true for 2028', () => {
      expect(isDynamicYear(2028)).toBe(true);
    });

    it('should return true for 2030', () => {
      expect(isDynamicYear(2030)).toBe(true);
    });

    it('should return true for 2040', () => {
      expect(isDynamicYear(2040)).toBe(true);
    });

    it('should return true for 2052', () => {
      expect(isDynamicYear(2052)).toBe(true);
    });

    it('should return false for 2027', () => {
      expect(isDynamicYear(2027)).toBe(false);
    });

    it('should return false for 2025', () => {
      expect(isDynamicYear(2025)).toBe(false);
    });

    it('should return false for 2024', () => {
      expect(isDynamicYear(2024)).toBe(false);
    });

    it('should return false for 2053', () => {
      expect(isDynamicYear(2053)).toBe(false);
    });
  });

  describe('getYearsForPeriod', () => {
    it('should return [2023, 2024] for HISTORICAL period', () => {
      const years = getYearsForPeriod('HISTORICAL');
      expect(years).toEqual([2023, 2024]);
      expect(years).toHaveLength(2);
    });

    it('should return [2025, 2026, 2027] for TRANSITION period', () => {
      const years = getYearsForPeriod('TRANSITION');
      expect(years).toEqual([2025, 2026, 2027]);
      expect(years).toHaveLength(3);
    });

    it('should return 25 years (2028-2052) for DYNAMIC period', () => {
      const years = getYearsForPeriod('DYNAMIC');
      expect(years).toHaveLength(25);
      expect(years[0]).toBe(2028);
      expect(years[24]).toBe(2052);
      expect(years).toContain(2030);
      expect(years).toContain(2040);
    });

    it('should throw error for invalid period', () => {
      // @ts-expect-error: Testing invalid input
      expect(() => getYearsForPeriod('INVALID')).toThrow('Invalid period: INVALID');
    });
  });

  describe('getPeriodBoundaries', () => {
    it('should return correct boundaries for HISTORICAL period', () => {
      const boundaries = getPeriodBoundaries('HISTORICAL');
      expect(boundaries).toEqual({ startYear: 2023, endYear: 2024 });
    });

    it('should return correct boundaries for TRANSITION period', () => {
      const boundaries = getPeriodBoundaries('TRANSITION');
      expect(boundaries).toEqual({ startYear: 2025, endYear: 2027 });
    });

    it('should return correct boundaries for DYNAMIC period', () => {
      const boundaries = getPeriodBoundaries('DYNAMIC');
      expect(boundaries).toEqual({ startYear: 2028, endYear: 2052 });
    });

    it('should throw error for invalid period', () => {
      // @ts-expect-error: Testing invalid input
      expect(() => getPeriodBoundaries('INVALID')).toThrow('Invalid period: INVALID');
    });
  });

  describe('getPeriodDescription', () => {
    it('should return descriptive text for HISTORICAL period', () => {
      const description = getPeriodDescription('HISTORICAL');
      expect(description).toContain('2023-2024');
      expect(description).toContain('Actual data');
      expect(description).toContain('read-only');
    });

    it('should return descriptive text for TRANSITION period', () => {
      const description = getPeriodDescription('TRANSITION');
      expect(description).toContain('2025-2027');
      expect(description).toContain('Manual rent');
      expect(description).toContain('1850');
    });

    it('should return descriptive text for DYNAMIC period', () => {
      const description = getPeriodDescription('DYNAMIC');
      expect(description).toContain('2028-2052');
      expect(description).toContain('dynamic');
    });

    it('should throw error for invalid period', () => {
      // @ts-expect-error: Testing invalid input
      expect(() => getPeriodDescription('INVALID')).toThrow('Invalid period: INVALID');
    });
  });

  describe('Integration scenarios', () => {
    it('should correctly classify all years from 2023 to 2052', () => {
      const results: Array<{ year: number; period: Period }> = [];

      for (let year = 2023; year <= 2052; year++) {
        results.push({ year, period: getPeriodForYear(year) });
      }

      // Count periods
      const historicalCount = results.filter((r) => r.period === 'HISTORICAL').length;
      const transitionCount = results.filter((r) => r.period === 'TRANSITION').length;
      const dynamicCount = results.filter((r) => r.period === 'DYNAMIC').length;

      expect(historicalCount).toBe(2); // 2023-2024
      expect(transitionCount).toBe(3); // 2025-2027
      expect(dynamicCount).toBe(25); // 2028-2052
      expect(results).toHaveLength(30); // Total years
    });

    it('should have consistent behavior between getPeriodForYear and helper functions', () => {
      // Test all years from 2023 to 2052
      for (let year = 2023; year <= 2052; year++) {
        const period = getPeriodForYear(year);

        if (period === 'HISTORICAL') {
          expect(isHistoricalYear(year)).toBe(true);
          expect(isTransitionYear(year)).toBe(false);
          expect(isDynamicYear(year)).toBe(false);
        } else if (period === 'TRANSITION') {
          expect(isHistoricalYear(year)).toBe(false);
          expect(isTransitionYear(year)).toBe(true);
          expect(isDynamicYear(year)).toBe(false);
        } else if (period === 'DYNAMIC') {
          expect(isHistoricalYear(year)).toBe(false);
          expect(isTransitionYear(year)).toBe(false);
          expect(isDynamicYear(year)).toBe(true);
        }
      }
    });

    it('should have all years in getYearsForPeriod match boundary years', () => {
      const periods: Period[] = ['HISTORICAL', 'TRANSITION', 'DYNAMIC'];

      for (const period of periods) {
        const years = getYearsForPeriod(period);
        const boundaries = getPeriodBoundaries(period);

        expect(years[0]).toBe(boundaries.startYear);
        expect(years[years.length - 1]).toBe(boundaries.endYear);
        expect(years).toHaveLength(boundaries.endYear - boundaries.startYear + 1);
      }
    });
  });
});
