/**
 * Balance Sheet Balancing Regression Tests
 *
 * Purpose: Ensure Balance Sheet always satisfies Assets = Liabilities + Equity
 *
 * Critical Tests:
 * 1. CircularSolver produces balanced sheets for all 30 years
 * 2. Historical actuals have correct equity values (A = L + E)
 * 3. Opening equity is correctly used in projections
 * 4. Retained earnings accumulate correctly year-over-year
 * 5. Balance check tolerance is within 0.01 SAR (halala precision)
 *
 * Reference: Balance Sheet imbalance bug fix (2025-11-20)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import Decimal from 'decimal.js';
import { CircularSolver, type SolverParams } from '../circular-solver';
import { PrismaClient } from '@prisma/client';

// Configure Decimal.js
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

const prisma = new PrismaClient();

describe('Balance Sheet Balancing', () => {
  describe('CircularSolver Balance Sheet', () => {
    it('should produce balanced sheets for all 30 years', async () => {
      // Arrange: Create test data
      const revenue = new Array(30)
        .fill(null)
        .map((_, i) => new Decimal(100_000_000 + i * 1_000_000));
      const ebitda = revenue.map((r) => r.times(0.15)); // 15% EBITDA margin
      const capex = new Array(30).fill(null).map(() => new Decimal(5_000_000));
      const staffCosts = revenue.map((r) => r.times(0.4)); // 40% staff costs

      const params: SolverParams = {
        versionId: 'test',
        versionMode: 'RELOCATION_2028',
        revenue,
        ebitda,
        capex,
        fixedAssetsOpening: new Decimal(50_000_000),
        depreciationRate: new Decimal(0.1),
        staffCosts,
        startingCash: new Decimal(5_000_000),
        openingEquity: new Decimal(55_000_000),
      };

      // Act: Run solver
      const solver = new CircularSolver();
      const result = await solver.solve(params);

      // Assert: Solver converged
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.success).toBe(true);
      expect(result.data.converged).toBe(true);
      expect(result.data.iterations).toBeLessThanOrEqual(10);

      // Assert: All years are balanced
      const solverData = result.data;
      const imbalancedYears: Array<{ year: number; balance: string }> = [];

      for (const yearData of solverData.projection) {
        const assets = yearData.totalAssets;
        const liabilities = yearData.totalLiabilities;
        const equity = yearData.totalEquity;
        const balance = assets.minus(liabilities).minus(equity);

        // Balance check: Within 0.01 SAR tolerance (halala precision)
        if (balance.abs().greaterThanOrEqualTo(0.01)) {
          imbalancedYears.push({
            year: yearData.year,
            balance: balance.toFixed(2),
          });
        }
      }

      expect(imbalancedYears).toHaveLength(0);

      if (imbalancedYears.length > 0) {
        console.error('Imbalanced years:', imbalancedYears);
      }
    });

    it('should correctly accumulate retained earnings year-over-year', async () => {
      // Arrange
      const revenue = new Array(30).fill(null).map(() => new Decimal(100_000_000));
      const ebitda = revenue.map((r) => r.times(0.15));
      const capex = new Array(30).fill(null).map(() => new Decimal(5_000_000));
      const staffCosts = revenue.map((r) => r.times(0.4));

      const params: SolverParams = {
        versionId: 'test',
        versionMode: 'RELOCATION_2028',
        revenue,
        ebitda,
        capex,
        fixedAssetsOpening: new Decimal(50_000_000),
        depreciationRate: new Decimal(0.1),
        staffCosts,
        startingCash: new Decimal(5_000_000),
        openingEquity: new Decimal(55_000_000),
      };

      // Act
      const solver = new CircularSolver();
      const result = await solver.solve(params);

      // Assert
      expect(result.success).toBe(true);
      if (!result.success) return;

      const projection = result.data.projection;

      // Check retained earnings accumulation
      for (let i = 1; i < projection.length; i++) {
        const previousRE = projection[i - 1].retainedEarnings;
        const currentRE = projection[i].retainedEarnings;
        const netResult = projection[i].netResult;

        // Current RE should equal Previous RE + Net Result
        const expectedRE = previousRE.plus(netResult);
        const difference = currentRE.minus(expectedRE).abs();

        expect(difference.lessThan(0.01)).toBe(true);

        if (difference.greaterThanOrEqualTo(0.01)) {
          console.error(`Year ${projection[i].year}: RE mismatch`, {
            previousRE: previousRE.toFixed(2),
            netResult: netResult.toFixed(2),
            expectedRE: expectedRE.toFixed(2),
            actualRE: currentRE.toFixed(2),
            difference: difference.toFixed(2),
          });
        }
      }
    });

    it('should use openingEquity in total equity calculation', async () => {
      // Arrange
      const openingEquity = new Decimal(55_000_000);
      const revenue = new Array(30).fill(null).map(() => new Decimal(100_000_000));
      const ebitda = revenue.map((r) => r.times(0.15));
      const capex = new Array(30).fill(null).map(() => new Decimal(5_000_000));
      const staffCosts = revenue.map((r) => r.times(0.4));

      const params: SolverParams = {
        versionId: 'test',
        versionMode: 'RELOCATION_2028',
        revenue,
        ebitda,
        capex,
        fixedAssetsOpening: new Decimal(50_000_000),
        depreciationRate: new Decimal(0.1),
        staffCosts,
        startingCash: new Decimal(5_000_000),
        openingEquity,
      };

      // Act
      const solver = new CircularSolver();
      const result = await solver.solve(params);

      // Assert
      expect(result.success).toBe(true);
      if (!result.success) return;

      const projection = result.data.projection;

      // All years should have openingEquity = input openingEquity
      for (const yearData of projection) {
        expect(yearData.openingEquity.equals(openingEquity)).toBe(true);

        // Total Equity should equal Opening Equity + Retained Earnings
        const expectedEquity = openingEquity.plus(yearData.retainedEarnings);
        const difference = yearData.totalEquity.minus(expectedEquity).abs();

        expect(difference.lessThan(0.01)).toBe(true);
      }
    });

    it('should balance sheet components (Assets, Liabilities, Equity)', async () => {
      // Arrange
      const revenue = new Array(30).fill(null).map(() => new Decimal(100_000_000));
      const ebitda = revenue.map((r) => r.times(0.15));
      const capex = new Array(30).fill(null).map(() => new Decimal(5_000_000));
      const staffCosts = revenue.map((r) => r.times(0.4));

      const params: SolverParams = {
        versionId: 'test',
        versionMode: 'RELOCATION_2028',
        revenue,
        ebitda,
        capex,
        fixedAssetsOpening: new Decimal(50_000_000),
        depreciationRate: new Decimal(0.1),
        staffCosts,
        startingCash: new Decimal(5_000_000),
        openingEquity: new Decimal(55_000_000),
      };

      // Act
      const solver = new CircularSolver();
      const result = await solver.solve(params);

      // Assert
      expect(result.success).toBe(true);
      if (!result.success) return;

      const projection = result.data.projection;

      for (const yearData of projection) {
        // Verify Assets = Cash + AR + Fixed Assets
        const calculatedAssets = yearData.cash
          .plus(yearData.accountsReceivable)
          .plus(yearData.fixedAssets);

        expect(calculatedAssets.minus(yearData.totalAssets).abs().lessThan(0.01)).toBe(true);

        // Verify Liabilities = AP + Deferred + Accrued + Debt
        const calculatedLiabilities = yearData.accountsPayable
          .plus(yearData.deferredIncome)
          .plus(yearData.accruedExpenses)
          .plus(yearData.shortTermDebt);

        expect(calculatedLiabilities.minus(yearData.totalLiabilities).abs().lessThan(0.01)).toBe(
          true
        );

        // Verify Equity = Opening Equity + Retained Earnings
        const calculatedEquity = yearData.openingEquity.plus(yearData.retainedEarnings);

        expect(calculatedEquity.minus(yearData.totalEquity).abs().lessThan(0.01)).toBe(true);
      }
    });

    it('should handle debt auto-creation correctly without breaking balance', async () => {
      // Arrange: Create scenario where debt is needed (low EBITDA, high CapEx)
      const revenue = new Array(30).fill(null).map(() => new Decimal(50_000_000));
      const ebitda = revenue.map((r) => r.times(0.05)); // Low 5% margin
      const capex = new Array(30).fill(null).map(() => new Decimal(10_000_000)); // High CapEx
      const staffCosts = revenue.map((r) => r.times(0.4));

      const params: SolverParams = {
        versionId: 'test',
        versionMode: 'RELOCATION_2028',
        revenue,
        ebitda,
        capex,
        fixedAssetsOpening: new Decimal(50_000_000),
        depreciationRate: new Decimal(0.1),
        staffCosts,
        startingCash: new Decimal(5_000_000),
        openingEquity: new Decimal(55_000_000),
      };

      // Act
      const solver = new CircularSolver();
      const result = await solver.solve(params);

      // Assert
      expect(result.success).toBe(true);
      if (!result.success) return;

      const projection = result.data.projection;

      // Find years with debt
      const yearsWithDebt = projection.filter((y) => y.shortTermDebt.greaterThan(0));
      expect(yearsWithDebt.length).toBeGreaterThan(0); // Should have some debt

      // Verify balance even with debt
      for (const yearData of projection) {
        const balance = yearData.totalAssets
          .minus(yearData.totalLiabilities)
          .minus(yearData.totalEquity);

        expect(balance.abs().lessThan(0.01)).toBe(true);
      }
    });
  });

  describe('Historical Actuals Balance Sheet', () => {
    it('should have balanced historical actuals (2023-2024)', async () => {
      // Fetch all historical actuals from database
      const historicalRecords = await prisma.historical_actuals.findMany({
        where: {
          year: { in: [2023, 2024] },
        },
      });

      expect(historicalRecords.length).toBeGreaterThan(0);

      // Check each record
      const imbalanced: Array<{ year: number; versionId: string; balance: string }> = [];

      for (const record of historicalRecords) {
        const assets = new Decimal(record.totalAssets.toString());
        const liabilities = new Decimal(record.totalLiabilities.toString());
        const equity = new Decimal(record.equity.toString());
        const balance = assets.minus(liabilities).minus(equity);

        if (balance.abs().greaterThanOrEqualTo(0.01)) {
          imbalanced.push({
            year: record.year,
            versionId: record.versionId,
            balance: balance.toFixed(2),
          });
        }
      }

      expect(imbalanced).toHaveLength(0);

      if (imbalanced.length > 0) {
        console.error('Imbalanced historical records:', imbalanced);
      }
    });

    it('should have equity = retained earnings + opening equity (not just retained earnings)', async () => {
      // Fetch historical actuals
      const historicalRecords = await prisma.historical_actuals.findMany({
        where: {
          year: { in: [2023, 2024] },
        },
      });

      expect(historicalRecords.length).toBeGreaterThan(0);

      for (const record of historicalRecords) {
        const equity = new Decimal(record.equity.toString());
        const retainedEarnings = new Decimal(record.retainedEarnings.toString());

        // Equity should be greater than just retained earnings (includes opening equity)
        // This is a regression test for the bug where equity = retained earnings only
        expect(equity.greaterThanOrEqualTo(retainedEarnings)).toBe(true);

        // In most cases, equity should be significantly larger than retained earnings
        // (unless opening equity was near zero)
        if (retainedEarnings.greaterThan(0)) {
          expect(equity.greaterThan(retainedEarnings)).toBe(true);
        }
      }
    });
  });

  describe('Balance Sheet Settings', () => {
    it('should have balance_sheet_settings for all versions', async () => {
      // Fetch all versions
      const versions = await prisma.versions.findMany({
        include: {
          balance_sheet_settings: true,
        },
      });

      expect(versions.length).toBeGreaterThan(0);

      // Check each version
      const versionsWithoutSettings = versions.filter((v) => !v.balance_sheet_settings);

      expect(versionsWithoutSettings).toHaveLength(0);

      if (versionsWithoutSettings.length > 0) {
        console.error(
          'Versions without balance sheet settings:',
          versionsWithoutSettings.map((v) => v.name)
        );
      }
    });

    it('should have valid opening equity values (not zero)', async () => {
      // Fetch all balance sheet settings
      const settings = await prisma.balance_sheet_settings.findMany();

      expect(settings.length).toBeGreaterThan(0);

      for (const setting of settings) {
        const openingEquity = new Decimal(setting.openingEquity.toString());

        // Opening equity should not be zero (default is 55M or from historical data)
        expect(openingEquity.greaterThan(0)).toBe(true);

        // Reasonable range check (1M to 100M SAR)
        expect(openingEquity.greaterThan(1_000_000)).toBe(true);
        expect(openingEquity.lessThan(100_000_000)).toBe(true);
      }
    });
  });

  describe('Balance Check Tolerance', () => {
    it('should accept balance within 0.01 SAR (halala precision)', () => {
      // Test tolerance level
      const assets = new Decimal(100_000_000);
      const liabilities = new Decimal(40_000_000);
      const equity = new Decimal(60_000_000.005); // 0.005 SAR difference

      const balance = assets.minus(liabilities).minus(equity);

      expect(balance.abs().lessThan(0.01)).toBe(true);
    });

    it('should reject balance outside 0.01 SAR tolerance', () => {
      // Test tolerance level
      const assets = new Decimal(100_000_000);
      const liabilities = new Decimal(40_000_000);
      const equity = new Decimal(59_999_999.98); // 0.02 SAR difference

      const balance = assets.minus(liabilities).minus(equity);

      expect(balance.abs().greaterThanOrEqualTo(0.01)).toBe(true);
    });
  });
});
