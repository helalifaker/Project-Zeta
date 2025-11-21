/**
 * Test Fixtures for Transition Period Features
 *
 * Provides mock data and expected values for transition period tests.
 * All financial values use Decimal.js for precision.
 */

import Decimal from 'decimal.js';

/**
 * Mock transition settings (global admin settings)
 */
export const mockTransitionSettings = {
  capacityCap: 1850,
  rentAdjustmentPercent: 10.0, // 10% increase from 2024 baseline
};

/**
 * Mock transition year data for all three years (2025-2027)
 *
 * Based on backward deflation from 2028 base with 3% CPI:
 * - 2025: 10M / (1.03^3) = 9,151,417
 * - 2026: 10M / (1.03^2) = 9,425,959
 * - 2027: 10M / (1.03^1) = 9,708,738
 */
export const mockTransitionYearData = [
  {
    year: 2025,
    targetEnrollment: 1850,
    staffCostBase: new Decimal('9151416.99'),
    notes: 'First transition year',
  },
  {
    year: 2026,
    targetEnrollment: 1850,
    staffCostBase: new Decimal('9425958.99'),
    notes: 'Second transition year',
  },
  {
    year: 2027,
    targetEnrollment: 1850,
    staffCostBase: new Decimal('9708737.86'),
    notes: 'Third transition year - pre-relocation',
  },
];

/**
 * Mock 2024 historical data (required for transition calculations)
 */
export const mockHistorical2024 = {
  year: 2024,
  tuitionFrenchCurriculum: new Decimal(40000000), // 40M
  tuitionIB: new Decimal(10000000), // 10M
  schoolRent: new Decimal(12000000), // 12M (baseline for transition rent)
  totalEnrollment: 1100, // FR: 850, IB: 250
};

/**
 * Expected transition rent calculation
 *
 * Formula: 12M × (1 + 10/100) = 12M × 1.10 = 13.2M
 */
export const expectedTransitionRent = new Decimal(13200000);

/**
 * Expected weighted average tuition for 2024
 *
 * Formula: (40M + 10M) / (850 + 250) = 50M / 1100 = 45,454.55 per student
 */
export const expectedAvgTuition2024 = new Decimal('45454.545454545454545455');

/**
 * Expected weighted average tuition for 2025 (with 3% CPI growth)
 *
 * Formula: 45,454.55 × (1.03^1) = 46,818.18
 */
export const expectedAvgTuition2025 = new Decimal('46818.181818181818181818');

/**
 * Expected transition revenue for 2025
 *
 * Formula: 46,818.18 × 1850 = 86,613,636
 */
export const expectedTransitionRevenue2025 = new Decimal('86613636.363636363636363');

/**
 * Mock admin settings (comprehensive)
 */
export const mockAdminSettings = {
  cpiRate: 0.03, // 3% annual inflation
  discountRate: 0.08, // 8% discount rate for NPV
  zakatRate: 0.025, // 2.5% zakat rate
  workingCapitalDays: 30, // 30 days working capital
  depositInterestRate: 0.02, // 2% interest on deposits
  overdraftInterestRate: 0.05, // 5% interest on overdrafts
  teacherStudentRatio: 0.0714, // 1 teacher per 14 students
  nonTeacherRatio: 0.4, // 40% of teachers
  teacherMonthlySalary: 15000, // 15K per month
  nonTeacherMonthlySalary: 10000, // 10K per month
};

/**
 * Recalculation test data
 *
 * Input: base2028 = 10M, cpiRate = 3%
 * Expected outputs (backward deflation):
 */
export const recalculationTestData = {
  input: {
    base2028StaffCost: 10000000,
    cpiRate: 0.03,
  },
  expectedResults: [
    {
      year: 2025,
      staffCostBase: new Decimal('9151416.99'), // 10M / (1.03^3)
    },
    {
      year: 2026,
      staffCostBase: new Decimal('9425958.99'), // 10M / (1.03^2)
    },
    {
      year: 2027,
      staffCostBase: new Decimal('9708737.86'), // 10M / (1.03^1)
    },
  ],
};

/**
 * Validation test cases for transition settings
 */
export const transitionSettingsValidationCases = {
  valid: [
    { capacityCap: 1850, rentAdjustmentPercent: 10.0 },
    { capacityCap: 2000, rentAdjustmentPercent: 0 },
    { capacityCap: 1500, rentAdjustmentPercent: -10 }, // Negative adjustment allowed
    { capacityCap: 5000, rentAdjustmentPercent: 100 }, // High but valid
  ],
  invalid: [
    { capacityCap: 0, rentAdjustmentPercent: 10, error: 'Capacity cap must be positive' },
    { capacityCap: -100, rentAdjustmentPercent: 10, error: 'Capacity cap must be positive' },
    {
      capacityCap: 6000,
      rentAdjustmentPercent: 10,
      error: 'Capacity cap seems unreasonably high',
    },
    {
      capacityCap: 1850,
      rentAdjustmentPercent: -101,
      error: 'Rent adjustment cannot be less than -100%',
    },
    {
      capacityCap: 1850,
      rentAdjustmentPercent: 1001,
      error: 'Rent adjustment seems unreasonably high',
    },
  ],
};

/**
 * Validation test cases for transition year updates
 */
export const transitionYearValidationCases = {
  valid: [
    { year: 2025, targetEnrollment: 1850, staffCostBase: 9000000, notes: 'Valid update' },
    { year: 2026, targetEnrollment: 2000, staffCostBase: 10000000 }, // No notes
    { year: 2027, targetEnrollment: 1500 }, // Only enrollment
    { year: 2025, staffCostBase: 8500000 }, // Only staff cost
  ],
  invalid: [
    { year: 2024, targetEnrollment: 1850, error: 'Invalid transition year' }, // Year too early
    { year: 2028, targetEnrollment: 1850, error: 'Invalid transition year' }, // Year too late
    { year: 2025, targetEnrollment: -100, error: 'Target enrollment must be positive' },
    { year: 2025, targetEnrollment: 0, error: 'Target enrollment must be positive' },
    { year: 2025, staffCostBase: -100000, error: 'Staff cost base must be positive' },
    { year: 2025, staffCostBase: 0, error: 'Staff cost base must be positive' },
  ],
};

/**
 * Edge case test data
 */
export const edgeCases = {
  // Zero CPI rate (no inflation)
  zeroCPI: {
    base2028: new Decimal(10000000),
    cpiRate: 0,
    expected2025: new Decimal(10000000), // No deflation
  },

  // Very high CPI (10%)
  highCPI: {
    base2028: new Decimal(10000000),
    cpiRate: 0.1,
    expected2025: new Decimal('7513148.01'), // 10M / (1.1^3)
  },

  // Negative rent adjustment (rent decrease)
  negativeRentAdjustment: {
    historical2024Rent: new Decimal(12000000),
    adjustmentPercent: -5,
    expectedRent: new Decimal(11400000), // 12M × 0.95
  },

  // Zero rent adjustment
  zeroRentAdjustment: {
    historical2024Rent: new Decimal(12000000),
    adjustmentPercent: 0,
    expectedRent: new Decimal(12000000), // No change
  },

  // Maximum capacity
  maxCapacity: {
    capacityCap: 5000,
    rentAdjustmentPercent: 10,
  },

  // Minimum capacity
  minCapacity: {
    capacityCap: 1,
    rentAdjustmentPercent: 10,
  },
};

/**
 * Integration test workflow data
 */
export const integrationTestWorkflow = {
  initialData: {
    year: 2025,
    targetEnrollment: 1800,
    staffCostBase: new Decimal(9000000),
    notes: 'Initial setup',
  },
  firstUpdate: {
    targetEnrollment: 1850,
    notes: 'Updated to capacity',
  },
  secondUpdate: {
    staffCostBase: new Decimal(9500000),
    notes: 'Adjusted staff costs',
  },
  recalculation: {
    base2028StaffCost: 11000000,
    cpiRate: 0.04, // 4% CPI
  },
};

/**
 * Expected calculation results for full projection test
 */
export const fullProjectionExpectedResults = {
  year2025: {
    enrollment: 1850,
    staffCost: new Decimal('9151416.99'),
    rent: new Decimal(13200000), // 12M × 1.10
    // Revenue = avgTuition × enrollment (calculated from 2024 data)
  },
  year2026: {
    enrollment: 1850,
    staffCost: new Decimal('9425958.99'),
    rent: new Decimal(13200000), // Same rent for all transition years
  },
  year2027: {
    enrollment: 1850,
    staffCost: new Decimal('9708737.86'),
    rent: new Decimal(13200000), // Same rent for all transition years
  },
};

/**
 * API response format examples
 */
export const apiResponseFormats = {
  getCompleteConfig: {
    success: true,
    data: {
      settings: mockTransitionSettings,
      yearData: mockTransitionYearData.map((d) => ({
        ...d,
        id: 'mock-id',
        staffCostBase: d.staffCostBase.toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
    },
  },
  updateSettings: {
    success: true,
    data: mockTransitionSettings,
  },
  updateYear: {
    success: true,
    data: {
      id: 'mock-id',
      ...mockTransitionYearData[0],
      staffCostBase: mockTransitionYearData[0].staffCostBase.toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  recalculate: {
    success: true,
    data: recalculationTestData.expectedResults.map((r) => ({
      id: 'mock-id',
      ...r,
      targetEnrollment: 1850,
      staffCostBase: r.staffCostBase.toString(),
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
  },
  unauthorized: {
    success: false,
    error: 'Unauthorized',
  },
  forbidden: {
    success: false,
    error: 'Admin access required',
  },
  invalidInput: {
    success: false,
    error: 'Invalid input',
  },
};
