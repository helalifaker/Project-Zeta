/**
 * Unit Tests: Opex Calculation
 */

import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  calculateOpexForYear,
  calculateOpex,
  type OpexSubAccount,
  type OpexParams,
} from '../opex';

describe('Opex Calculation', () => {
  describe('calculateOpexForYear', () => {
    it('should calculate opex with variable % only', () => {
      const subAccounts: OpexSubAccount[] = [
        {
          subAccountName: 'Marketing',
          percentOfRevenue: 0.03, // 3% of revenue
          isFixed: false,
          fixedAmount: null,
        },
      ];

      const result = calculateOpexForYear(50_000_000, subAccounts);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.variableOpex.toNumber()).toBe(1_500_000); // 50M × 0.03
        expect(result.data.fixedOpex.toNumber()).toBe(0);
        expect(result.data.totalOpex.toNumber()).toBe(1_500_000);
        expect(result.data.breakdown).toHaveLength(1);
        expect(result.data.breakdown[0]?.type).toBe('variable');
        expect(result.data.breakdown[0]?.amount.toNumber()).toBe(1_500_000);
      }
    });

    it('should calculate opex with fixed amount only', () => {
      const subAccounts: OpexSubAccount[] = [
        {
          subAccountName: 'Utilities',
          percentOfRevenue: null,
          isFixed: true,
          fixedAmount: 200_000, // 200K fixed
        },
      ];

      const result = calculateOpexForYear(50_000_000, subAccounts);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.variableOpex.toNumber()).toBe(0);
        expect(result.data.fixedOpex.toNumber()).toBe(200_000);
        expect(result.data.totalOpex.toNumber()).toBe(200_000);
        expect(result.data.breakdown[0]?.type).toBe('fixed');
        expect(result.data.breakdown[0]?.amount.toNumber()).toBe(200_000);
      }
    });

    it('should calculate opex with mixed variable % and fixed', () => {
      const subAccounts: OpexSubAccount[] = [
        {
          subAccountName: 'Marketing',
          percentOfRevenue: 0.03, // 3% of revenue = 1.5M
          isFixed: false,
          fixedAmount: null,
        },
        {
          subAccountName: 'Utilities',
          percentOfRevenue: null,
          isFixed: true,
          fixedAmount: 200_000, // 200K fixed
        },
        {
          subAccountName: 'Maintenance',
          percentOfRevenue: 0.02, // 2% of revenue = 1M
          isFixed: false,
          fixedAmount: null,
        },
      ];

      const result = calculateOpexForYear(50_000_000, subAccounts);

      expect(result.success).toBe(true);
      if (result.success) {
        // Variable: 3% + 2% = 5% of 50M = 2.5M
        expect(result.data.variableOpex.toNumber()).toBe(2_500_000);
        // Fixed: 200K
        expect(result.data.fixedOpex.toNumber()).toBe(200_000);
        // Total: 2.5M + 200K = 2.7M
        expect(result.data.totalOpex.toNumber()).toBe(2_700_000);
        expect(result.data.breakdown).toHaveLength(3);
      }
    });

    it('should handle zero revenue', () => {
      const subAccounts: OpexSubAccount[] = [
        {
          subAccountName: 'Marketing',
          percentOfRevenue: 0.03,
          isFixed: false,
          fixedAmount: null,
        },
      ];

      const result = calculateOpexForYear(0, subAccounts);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.variableOpex.toNumber()).toBe(0);
        expect(result.data.totalOpex.toNumber()).toBe(0);
      }
    });

    it('should handle zero sub-accounts', () => {
      const result = calculateOpexForYear(50_000_000, []);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.variableOpex.toNumber()).toBe(0);
        expect(result.data.fixedOpex.toNumber()).toBe(0);
        expect(result.data.totalOpex.toNumber()).toBe(0);
        expect(result.data.breakdown).toHaveLength(0);
      }
    });

    it('should reject negative revenue', () => {
      const subAccounts: OpexSubAccount[] = [
        {
          subAccountName: 'Marketing',
          percentOfRevenue: 0.03,
          isFixed: false,
          fixedAmount: null,
        },
      ];

      const result = calculateOpexForYear(-50_000_000, subAccounts);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Revenue cannot be negative');
      }
    });

    it('should reject missing fixed amount for fixed sub-account', () => {
      const subAccounts: OpexSubAccount[] = [
        {
          subAccountName: 'Utilities',
          percentOfRevenue: null,
          isFixed: true,
          fixedAmount: null, // Missing
        },
      ];

      const result = calculateOpexForYear(50_000_000, subAccounts);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Fixed amount is required');
      }
    });

    it('should reject missing percentage for variable sub-account', () => {
      const subAccounts: OpexSubAccount[] = [
        {
          subAccountName: 'Marketing',
          percentOfRevenue: null, // Missing
          isFixed: false,
          fixedAmount: null,
        },
      ];

      const result = calculateOpexForYear(50_000_000, subAccounts);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Percentage is required');
      }
    });

    it('should reject negative fixed amount', () => {
      const subAccounts: OpexSubAccount[] = [
        {
          subAccountName: 'Utilities',
          percentOfRevenue: null,
          isFixed: true,
          fixedAmount: -200_000,
        },
      ];

      const result = calculateOpexForYear(50_000_000, subAccounts);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Fixed amount cannot be negative');
      }
    });

    it('should reject negative percentage', () => {
      const subAccounts: OpexSubAccount[] = [
        {
          subAccountName: 'Marketing',
          percentOfRevenue: -0.01,
          isFixed: false,
          fixedAmount: null,
        },
      ];

      const result = calculateOpexForYear(50_000_000, subAccounts);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Percentage cannot be negative');
      }
    });

    it('should handle 100% revenue share', () => {
      const subAccounts: OpexSubAccount[] = [
        {
          subAccountName: 'All Opex',
          percentOfRevenue: 1.0, // 100% of revenue
          isFixed: false,
          fixedAmount: null,
        },
      ];

      const result = calculateOpexForYear(50_000_000, subAccounts);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalOpex.toNumber()).toBe(50_000_000);
      }
    });

    it('should work with Decimal.js inputs', () => {
      const subAccounts: OpexSubAccount[] = [
        {
          subAccountName: 'Marketing',
          percentOfRevenue: new Decimal(0.03),
          isFixed: false,
          fixedAmount: null,
        },
      ];

      const result = calculateOpexForYear(new Decimal(50_000_000), subAccounts);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalOpex.toNumber()).toBe(1_500_000);
      }
    });
  });

  describe('calculateOpex', () => {
    it('should calculate opex for multiple years', () => {
      const params: OpexParams = {
        revenueByYear: [
          { year: 2028, revenue: new Decimal(50_000_000) },
          { year: 2029, revenue: new Decimal(52_000_000) },
        ],
        subAccounts: [
          {
            subAccountName: 'Marketing',
            percentOfRevenue: 0.03,
            isFixed: false,
            fixedAmount: null,
          },
          {
            subAccountName: 'Utilities',
            percentOfRevenue: null,
            isFixed: true,
            fixedAmount: 200_000,
          },
        ],
      };

      const result = calculateOpex(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        // Year 2028: 50M × 3% + 200K = 1.5M + 200K = 1.7M
        expect(result.data[0]?.year).toBe(2028);
        expect(result.data[0]?.totalOpex.toNumber()).toBe(1_700_000);
        // Year 2029: 52M × 3% + 200K = 1.56M + 200K = 1.76M
        expect(result.data[1]?.year).toBe(2029);
        expect(result.data[1]?.totalOpex.toNumber()).toBe(1_760_000);
      }
    });

    it('should reject empty revenue array', () => {
      const params: OpexParams = {
        revenueByYear: [],
        subAccounts: [
          {
            subAccountName: 'Marketing',
            percentOfRevenue: 0.03,
            isFixed: false,
            fixedAmount: null,
          },
        ],
      };

      const result = calculateOpex(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Revenue data is required');
      }
    });

    it('should validate sub-accounts structure', () => {
      const params: OpexParams = {
        revenueByYear: [
          { year: 2028, revenue: new Decimal(50_000_000) },
        ],
        subAccounts: [
          {
            subAccountName: 'Utilities',
            percentOfRevenue: null,
            isFixed: true,
            fixedAmount: null, // Missing
          },
        ],
      };

      const result = calculateOpex(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Fixed amount is required');
      }
    });
  });
});

