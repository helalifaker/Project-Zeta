/**
 * Transition Period Integration Tests
 *
 * Purpose: Test the integration of transition data (2025-2027) into the
 * financial calculation engine.
 *
 * Test Coverage:
 * 1. Transition data fetching and validation
 * 2. Enrollment adjustments using targetEnrollment
 * 3. Rent calculation from 2024 + adjustment
 * 4. Staff cost usage from database
 * 5. Backward compatibility (fallback when data unavailable)
 * 6. Full projection with transition data
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import {
  getTransitionPeriodData,
  getAllTransitionPeriodData,
  calculateTransitionRentFromHistorical,
  calculateTransitionWeightedAverageTuition,
  calculateTransitionRevenue,
  isTransitionDataAvailable,
} from '../transition-helpers';
import { calculateFullProjection, type FullProjectionParams } from '../projection';

const prisma = new PrismaClient();

describe('Transition Period Integration Tests', () => {
  let testVersionId: string;
  let testUserId: string;
  const TEST_HISTORICAL_RENT_2024 = 10000000; // 10M SAR
  const TEST_RENT_ADJUSTMENT = 10.0; // +10%
  const TEST_CAPACITY_CAP = 1850;

  beforeAll(async () => {
    // Create test user (required for version creation)
    const user = await prisma.users.upsert({
      where: { email: 'transition-test@example.com' },
      create: {
        email: 'transition-test@example.com',
        name: 'Transition Test User',
        role: 'ADMIN',
      },
      update: {},
    });
    testUserId = user.id;

    // Create test version
    const version = await prisma.versions.create({
      data: {
        name: 'Transition Integration Test Version',
        description: 'Test version for transition period integration',
        mode: 'RELOCATION_2028',
        createdBy: testUserId,
      },
    });
    testVersionId = version.id;

    // Create admin settings
    await prisma.admin_settings.upsert({
      where: { key: 'global' },
      create: {
        key: 'global',
        value: {
          cpiRate: 0.03,
          discountRate: 0.08,
          zakatRate: 0.025,
        },
        transitionCapacityCap: TEST_CAPACITY_CAP,
        transitionRentAdjustmentPercent: new Decimal(TEST_RENT_ADJUSTMENT),
      },
      update: {
        transitionCapacityCap: TEST_CAPACITY_CAP,
        transitionRentAdjustmentPercent: new Decimal(TEST_RENT_ADJUSTMENT),
      },
    });

    // Create 2024 historical data (using correct schema field names)
    await prisma.historical_actuals.create({
      data: {
        versionId: testVersionId,
        year: 2024,
        // P&L - Revenue
        tuitionFrenchCurriculum: new Decimal(60000000), // 60M SAR
        tuitionIB: new Decimal(40000000), // 40M SAR
        otherIncome: new Decimal(0),
        totalRevenues: new Decimal(100000000), // 100M SAR
        // P&L - Expenses
        salariesAndRelatedCosts: new Decimal(20000000),
        schoolRent: new Decimal(TEST_HISTORICAL_RENT_2024),
        otherExpenses: new Decimal(20000000),
        totalOperatingExpenses: new Decimal(50000000),
        // P&L - Other
        depreciationAmortization: new Decimal(5000000),
        interestIncome: new Decimal(0),
        interestExpenses: new Decimal(0),
        netResult: new Decimal(45000000),
        // Balance Sheet - Assets
        cashOnHandAndInBank: new Decimal(5000000),
        accountsReceivableAndOthers: new Decimal(2000000),
        totalCurrentAssets: new Decimal(7000000),
        tangibleIntangibleAssetsGross: new Decimal(50000000),
        accumulatedDepreciationAmort: new Decimal(10000000),
        nonCurrentAssets: new Decimal(40000000),
        totalAssets: new Decimal(47000000),
        // Balance Sheet - Liabilities
        accountsPayable: new Decimal(1000000),
        deferredIncome: new Decimal(500000),
        totalCurrentLiabilities: new Decimal(1500000),
        provisions: new Decimal(0),
        totalLiabilities: new Decimal(1500000),
        // Balance Sheet - Equity
        retainedEarnings: new Decimal(40500000),
        equity: new Decimal(45500000),
        // Cash Flow - Operating Activities
        cfNetResult: new Decimal(45000000),
        cfAccountsReceivable: new Decimal(0),
        cfPrepaidExpenses: new Decimal(0),
        cfLoans: new Decimal(0),
        cfIntangibleAssets: new Decimal(0),
        cfAccountsPayable: new Decimal(0),
        cfAccruedExpenses: new Decimal(0),
        cfDeferredIncome: new Decimal(0),
        cfProvisions: new Decimal(0),
        cfDepreciation: new Decimal(5000000),
        netCashFromOperatingActivities: new Decimal(50000000),
        // Cash Flow - Investing Activities
        cfAdditionsFixedAssets: new Decimal(5000000),
        netCashFromInvestingActivities: new Decimal(-5000000),
        // Cash Flow - Financing Activities
        cfChangesInFundBalance: new Decimal(0),
        netCashFromFinancingActivities: new Decimal(0),
        // Cash Flow - Summary
        netIncreaseDecreaseCash: new Decimal(45000000),
        cashBeginningOfPeriod: new Decimal(0),
        cashEndOfPeriod: new Decimal(45000000),
      },
    });

    // Create transition year data (2025-2027)
    await prisma.transition_year_data.createMany({
      data: [
        {
          year: 2025,
          targetEnrollment: 1500,
          staffCostBase: new Decimal(18000000), // 18M SAR
          notes: 'Test year 2025',
        },
        {
          year: 2026,
          targetEnrollment: 1700,
          staffCostBase: new Decimal(19000000), // 19M SAR
          notes: 'Test year 2026',
        },
        {
          year: 2027,
          targetEnrollment: 1850, // At capacity cap
          staffCostBase: new Decimal(20000000), // 20M SAR
          notes: 'Test year 2027',
        },
      ],
    });

    // Create curriculum plans with studentsProjection (2023-2030 to support test range)
    await prisma.curriculum_plans.createMany({
      data: [
        {
          versionId: testVersionId,
          curriculumType: 'FR',
          capacity: 2000,
          tuitionBase: new Decimal(30000),
          cpiFrequency: 2,
          studentsProjection: [
            { year: 2023, students: 900 },
            { year: 2024, students: 1000 },
            { year: 2025, students: 1100 },
            { year: 2026, students: 1200 },
            { year: 2027, students: 1300 },
            { year: 2028, students: 1400 },
            { year: 2029, students: 1450 },
            { year: 2030, students: 1500 },
          ],
        },
        {
          versionId: testVersionId,
          curriculumType: 'IB',
          capacity: 1000,
          tuitionBase: new Decimal(40000),
          cpiFrequency: 2,
          studentsProjection: [
            { year: 2023, students: 400 },
            { year: 2024, students: 500 },
            { year: 2025, students: 600 },
            { year: 2026, students: 700 },
            { year: 2027, students: 800 },
            { year: 2028, students: 900 },
            { year: 2029, students: 950 },
            { year: 2030, students: 1000 },
          ],
        },
      ],
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.transition_year_data.deleteMany({});
    await prisma.historical_actuals.deleteMany({ where: { versionId: testVersionId } });
    await prisma.curriculum_plans.deleteMany({ where: { versionId: testVersionId } });
    await prisma.versions.delete({ where: { id: testVersionId } });
    await prisma.$disconnect();
  });

  describe('Transition Data Availability', () => {
    it('should detect when transition data is available', async () => {
      const result = await isTransitionDataAvailable(testVersionId);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return false when transition data is incomplete', async () => {
      // Create a version without transition data
      const emptyVersion = await prisma.versions.create({
        data: {
          name: 'Empty Version',
          description: 'No transition data',
          mode: 'RELOCATION_2028',
          createdBy: testUserId,
        },
      });

      const result = await isTransitionDataAvailable(emptyVersion.id);

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);

      // Clean up
      await prisma.versions.delete({ where: { id: emptyVersion.id } });
    });
  });

  describe('Transition Period Data Fetching', () => {
    it('should fetch transition data for a single year', async () => {
      const result = await getTransitionPeriodData(2025, testVersionId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.year).toBe(2025);
        expect(result.data.targetEnrollment).toBe(1500);
        expect(result.data.staffCostBase.toString()).toBe('18000000');
        // Rent should be calculated: 10M × 1.10 = 11M
        expect(result.data.rent.toString()).toBe('11000000');
      }
    });

    it('should fetch all transition years (2025-2027)', async () => {
      const result = await getAllTransitionPeriodData(testVersionId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(3);
        expect(result.data.map((d) => d.year)).toEqual([2025, 2026, 2027]);
        expect(result.data.map((d) => d.targetEnrollment)).toEqual([1500, 1700, 1850]);
      }
    }, 10000); // 10 second timeout for slow database queries

    it('should reject invalid transition year', async () => {
      const result = await getTransitionPeriodData(2024, testVersionId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid transition year');
      }
    });
  });

  describe('Transition Rent Calculation', () => {
    it('should calculate rent from 2024 historical + adjustment', async () => {
      const result = await calculateTransitionRentFromHistorical(
        testVersionId,
        TEST_RENT_ADJUSTMENT
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Expected: 10M × 1.10 = 11M
        expect(result.data.toString()).toBe('11000000');
      }
    });

    it('should handle negative rent adjustment', async () => {
      const result = await calculateTransitionRentFromHistorical(testVersionId, -10.0);

      expect(result.success).toBe(true);
      if (result.success) {
        // Expected: 10M × 0.90 = 9M
        expect(result.data.toString()).toBe('9000000');
      }
    });

    it('should fail if 2024 historical data missing', async () => {
      // Create version without 2024 data
      const noHistoricalVersion = await prisma.versions.create({
        data: {
          name: 'No Historical Version',
          description: 'Missing 2024 data',
          mode: 'RELOCATION_2028',
          createdBy: testUserId,
        },
      });

      const result = await calculateTransitionRentFromHistorical(noHistoricalVersion.id, 10.0);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('No historical data found for year 2024');
      }

      // Clean up
      await prisma.versions.delete({ where: { id: noHistoricalVersion.id } });
    });
  });

  describe('Transition Weighted Average Tuition', () => {
    it('should calculate weighted average tuition from 2024 data', async () => {
      const result = await calculateTransitionWeightedAverageTuition(testVersionId, 2025, 0.03);

      expect(result.success).toBe(true);
      if (result.success) {
        // 2024: Total tuition revenue = 60M + 40M = 100M
        // 2024: Total enrollment = 1000 + 500 = 1500
        // Average tuition 2024 = 100M / 1500 = 66,666.67
        // With CPI growth (1 year @ 3%): 66,666.67 × 1.03 = 68,666.67
        expect(result.data.toNumber()).toBeCloseTo(68666.67, 2);
      }
    });

    it('should apply CPI growth correctly over multiple years', async () => {
      const result2026 = await calculateTransitionWeightedAverageTuition(testVersionId, 2026, 0.03);
      const result2027 = await calculateTransitionWeightedAverageTuition(testVersionId, 2027, 0.03);

      expect(result2026.success).toBe(true);
      expect(result2027.success).toBe(true);

      if (result2026.success && result2027.success) {
        // 2026: 2 years growth = 66,666.67 × 1.03^2 ≈ 70,726.67
        expect(result2026.data.toNumber()).toBeCloseTo(70726.67, 0); // Less precision due to rounding

        // 2027: 3 years growth = 66,666.67 × 1.03^3 ≈ 72,848.67
        expect(result2027.data.toNumber()).toBeCloseTo(72848.67, 0); // Less precision due to rounding
      }
    });
  });

  describe('Transition Revenue Calculation', () => {
    it('should calculate revenue using weighted average tuition', async () => {
      const result = await calculateTransitionRevenue(testVersionId, 2025, 1500, 0.03);

      expect(result.success).toBe(true);
      if (result.success) {
        // Average tuition 2025 ≈ 68,666.67
        // Enrollment: 1500
        // Revenue: 68,666.67 × 1500 ≈ 103M
        expect(result.data.toNumber()).toBeCloseTo(103000000, -5); // Within 100k
      }
    });

    it('should handle zero enrollment', async () => {
      const result = await calculateTransitionRevenue(testVersionId, 2025, 0, 0.03);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toString()).toBe('0');
      }
    });

    it('should reject negative enrollment', async () => {
      const result = await calculateTransitionRevenue(testVersionId, 2025, -100, 0.03);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('cannot be negative');
      }
    });
  });

  describe('Full Projection Integration', () => {
    it('should use transition data in full projection calculation', async () => {
      // Fetch curriculum plans
      const curricula = await prisma.curriculum_plans.findMany({
        where: { versionId: testVersionId },
      });

      // Prepare full projection params
      const params: FullProjectionParams = {
        curriculumPlans: curricula.map((c) => ({
          curriculumType: c.curriculumType as 'FR' | 'IB',
          capacity: c.capacity,
          tuitionBase: c.tuitionBase,
          cpiFrequency: c.cpiFrequency as 1 | 2 | 3,
          studentsProjection: c.studentsProjection as Array<{ year: number; students: number }>,
        })),
        rentPlan: {
          rentModel: 'FIXED_ESCALATION',
          parameters: {
            baseRent: 11000000,
            escalationRate: 0.03,
            frequency: 1,
            transitionRent: 11000000, // Fallback value
          },
        },
        staffCostBase: 20000000,
        staffCostCpiFrequency: 2,
        capexItems: [{ year: 2028, amount: 5000000 }],
        opexSubAccounts: [
          {
            subAccountName: 'Marketing',
            percentOfRevenue: 0.03,
            isFixed: false,
            fixedAmount: null,
          },
        ],
        adminSettings: {
          cpiRate: 0.03,
          discountRate: 0.08,
          zakatRate: 0.025,
        },
        versionId: testVersionId,
        versionMode: 'RELOCATION_2028',
        startYear: 2023,
        endYear: 2030, // Limited for test performance
      };

      const result = await calculateFullProjection(params);

      if (!result.success) {
        console.error('Full projection failed:', result.error);
      }

      expect(result.success).toBe(true);
      if (result.success) {
        const years = result.data.years;

        // Check transition years (2025-2027)
        const year2025 = years.find((y) => y.year === 2025);
        const year2026 = years.find((y) => y.year === 2026);
        const year2027 = years.find((y) => y.year === 2027);

        expect(year2025).toBeDefined();
        expect(year2026).toBeDefined();
        expect(year2027).toBeDefined();

        if (year2025 && year2026 && year2027) {
          // Verify rent uses transition calculation
          expect(year2025.rent.toString()).toBe('11000000');
          expect(year2026.rent.toString()).toBe('11000000');
          expect(year2027.rent.toString()).toBe('11000000');

          // Verify staff costs use transition data
          expect(year2025.staffCost.toString()).toBe('18000000');
          expect(year2026.staffCost.toString()).toBe('19000000');
          expect(year2027.staffCost.toString()).toBe('20000000');

          // Verify enrollment adjustments applied
          // Total enrollment should match targetEnrollment from database
          const total2025 = (year2025.studentsFR || 0) + (year2025.studentsIB || 0);
          const total2026 = (year2026.studentsFR || 0) + (year2026.studentsIB || 0);
          const total2027 = (year2027.studentsFR || 0) + (year2027.studentsIB || 0);

          expect(total2025).toBeCloseTo(1500, 0);
          expect(total2026).toBeCloseTo(1700, 0);
          expect(total2027).toBeCloseTo(1850, 0);
        }
      }
    }, 30000); // 30 second timeout for full projection calculation
  });

  describe('Backward Compatibility', () => {
    it('should fall back to rent_plans.parameters when transition data unavailable', async () => {
      // Delete transition data temporarily
      await prisma.transition_year_data.deleteMany({});

      // Fetch curriculum plans
      const curricula = await prisma.curriculum_plans.findMany({
        where: { versionId: testVersionId },
      });

      const params: FullProjectionParams = {
        curriculumPlans: curricula.map((c) => ({
          curriculumType: c.curriculumType as 'FR' | 'IB',
          capacity: c.capacity,
          tuitionBase: c.tuitionBase,
          cpiFrequency: c.cpiFrequency as 1 | 2 | 3,
          studentsProjection: c.studentsProjection as Array<{ year: number; students: number }>,
        })),
        rentPlan: {
          rentModel: 'FIXED_ESCALATION',
          parameters: {
            baseRent: 12000000,
            escalationRate: 0.03,
            frequency: 1,
            transitionRent: 9000000, // Fallback value (different from calculated)
          },
        },
        staffCostBase: 22000000,
        staffCostCpiFrequency: 2,
        capexItems: [],
        opexSubAccounts: [],
        adminSettings: {
          cpiRate: 0.03,
          discountRate: 0.08,
          zakatRate: 0.025,
        },
        versionId: testVersionId,
        versionMode: 'RELOCATION_2028',
        startYear: 2025,
        endYear: 2027,
      };

      const result = await calculateFullProjection(params);

      if (!result.success) {
        console.error('Fallback projection failed:', result.error);
      }

      expect(result.success).toBe(true);
      if (result.success) {
        const year2025 = result.data.years.find((y) => y.year === 2025);

        // Should use fallback transitionRent (9M)
        expect(year2025?.rent.toString()).toBe('9000000');
      }

      // Restore transition data
      await prisma.transition_year_data.createMany({
        data: [
          { year: 2025, targetEnrollment: 1500, staffCostBase: new Decimal(18000000) },
          { year: 2026, targetEnrollment: 1700, staffCostBase: new Decimal(19000000) },
          { year: 2027, targetEnrollment: 1850, staffCostBase: new Decimal(20000000) },
        ],
      });
    }, 60000); // 60 second timeout for full projection calculation with database operations
  });
});
