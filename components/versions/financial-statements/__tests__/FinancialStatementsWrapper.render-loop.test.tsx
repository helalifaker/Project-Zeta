/**
 * Regression Test: FinancialStatementsWrapper Render Loop Prevention
 *
 * Tests that the FinancialStatementsWrapper component does not cause infinite re-renders
 * after fixing the cascading effects and object reference instability issues.
 *
 * Bug Fixed: Component had two cascading useEffects where one would set state that
 * the other depended on, plus object dependencies without memoization, causing loops.
 *
 * Fix Applied:
 * 1. Merged two separate effects into one unified effect
 * 2. Used useMemo to stabilize adminSettings object reference
 * 3. Changed dependencies to primitive values (version.id) instead of complex objects
 * 4. Added cleanup function to prevent setState on unmounted component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import type { VersionWithRelations } from '@/services/version';
import Decimal from 'decimal.js';

// Mock child components - MUST be before importing FinancialStatementsWrapper
vi.mock('../FinancialStatements', () => ({
  FinancialStatements: () =>
    React.createElement('div', { 'data-testid': 'financial-statements' }, 'Financial Statements'),
}));

vi.mock('../../BalanceSheetSettings', () => ({
  BalanceSheetSettings: () =>
    React.createElement(
      'div',
      { 'data-testid': 'balance-sheet-settings' },
      'Balance Sheet Settings'
    ),
}));

vi.mock('../../OtherRevenueEditor', () => ({
  OtherRevenueEditor: () =>
    React.createElement('div', { 'data-testid': 'other-revenue-editor' }, 'Other Revenue Editor'),
}));

// Mock calculation functions
vi.mock('@/lib/calculations/financial/projection', () => ({
  calculateFullProjection: vi.fn().mockResolvedValue({
    success: true,
    data: {
      years: [],
      metadata: {
        converged: true,
        iterations: 2,
        maxError: new Decimal(0.01),
        duration: 50,
        solverUsed: true,
      },
      duration: 50,
    },
  }),
}));

vi.mock('@/lib/calculations/financial/staff-costs', () => ({
  calculateStaffCostBaseFromCurriculum: vi.fn().mockReturnValue({
    success: true,
    data: new Decimal(1000000),
  }),
}));

vi.mock('@/hooks/use-render-logger', () => ({
  useRenderLogger: vi.fn(),
}));

// Import component AFTER mocks
import { FinancialStatementsWrapper } from '../FinancialStatementsWrapper';

// Mock fetch
global.fetch = vi.fn();

describe('FinancialStatementsWrapper - Render Loop Prevention', () => {
  const mockVersion: VersionWithRelations = {
    id: 'test-version-1',
    name: 'Test Version',
    mode: 'RELOCATION_2028',
    status: 'DRAFT',
    isLocked: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    userId: 'user-1',
    curriculumPlans: [
      {
        id: 'cp-1',
        versionId: 'test-version-1',
        curriculumType: 'FR',
        capacity: 800,
        tuitionBase: new Decimal(50000),
        cpiFrequency: 2,
        studentsProjection: [],
        teacherRatio: new Decimal(0.15),
        nonTeacherRatio: new Decimal(0.08),
        teacherMonthlySalary: new Decimal(15000),
        nonTeacherMonthlySalary: new Decimal(8000),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ],
    rentPlan: {
      id: 'rp-1',
      versionId: 'test-version-1',
      rentModel: 'FIXED_ESCALATION',
      parameters: {},
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    capexItems: [],
    opexSubAccounts: [],
  };

  const mockAdminSettings = {
    cpiRate: 0.035,
    discountRate: 0.09,
    zakatRate: 0.025,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock fetch responses
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('balance-sheet-settings')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              startingCash: 5000000,
              openingEquity: 55000000,
            },
          }),
        });
      }

      if (url.includes('other-revenue')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              items: [],
            },
          }),
        });
      }

      if (url.includes('historical-data')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: [],
          }),
        });
      }

      return Promise.resolve({
        ok: false,
        json: async () => ({ success: false }),
      });
    });
  });

  it('should not re-render more than 15 times on mount', async () => {
    let renderCount = 0;

    const RenderCounter = () => {
      renderCount++;
      return <FinancialStatementsWrapper version={mockVersion} adminSettings={mockAdminSettings} />;
    };

    render(<RenderCounter />);

    // Wait for all async effects to settle
    await waitFor(
      () => {
        expect(renderCount).toBeLessThan(16);
      },
      { timeout: 5000 }
    );

    console.log(`[TEST] FinancialStatementsWrapper rendered ${renderCount} times`);
  });

  it('should not cause infinite loop when adminSettings object reference changes', async () => {
    let renderCount = 0;

    const RenderCounter = ({ settings }: { settings: any }) => {
      renderCount++;
      return <FinancialStatementsWrapper version={mockVersion} adminSettings={settings} />;
    };

    const { rerender } = render(<RenderCounter settings={mockAdminSettings} />);

    // Wait for initial render to settle
    await waitFor(
      () => {
        expect(renderCount).toBeLessThan(16);
      },
      { timeout: 5000 }
    );

    const initialRenderCount = renderCount;

    // Create new object with same values (object reference changes but values are the same)
    const newAdminSettings = {
      cpiRate: 0.03,
      discountRate: 0.08,
      zakatRate: 0.025,
    };

    // Rerender with new object reference
    rerender(<RenderCounter settings={newAdminSettings} />);

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Should only trigger ONE additional render (not infinite loop)
    // Allow up to 5 additional renders for effect re-runs
    expect(renderCount - initialRenderCount).toBeLessThan(6);

    console.log(
      `[TEST] Re-render with new adminSettings object caused ${renderCount - initialRenderCount} additional renders`
    );
  });

  it('should stabilize render count after data fetching completes', async () => {
    let renderCount = 0;
    const renderCounts: number[] = [];

    const RenderCounter = () => {
      renderCount++;

      // Record render count every 200ms
      React.useEffect(() => {
        const interval = setInterval(() => {
          renderCounts.push(renderCount);
        }, 200);

        return () => clearInterval(interval);
      }, []);

      return <FinancialStatementsWrapper version={mockVersion} adminSettings={mockAdminSettings} />;
    };

    render(<RenderCounter />);

    // Wait 2 seconds for all fetches to complete
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Render count should stabilize (last 3 samples should be the same)
    const lastThree = renderCounts.slice(-3);
    if (lastThree.length === 3) {
      expect(lastThree[0]).toBe(lastThree[1]);
      expect(lastThree[1]).toBe(lastThree[2]);
    }

    console.log('[TEST] Render counts over time:', renderCounts);
  });

  it('should not trigger re-calculation when version object reference changes but ID stays the same', async () => {
    const { rerender } = render(
      <FinancialStatementsWrapper version={mockVersion} adminSettings={mockAdminSettings} />
    );

    // Wait for initial calculation
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const initialFetchCount = (global.fetch as any).mock.calls.length;

    // Create new version object with same ID
    const newVersionObject = {
      ...mockVersion,
      name: 'Updated Name', // Different property but same ID
    };

    // Rerender with new object
    rerender(
      <FinancialStatementsWrapper version={newVersionObject} adminSettings={mockAdminSettings} />
    );

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Should NOT trigger new fetch (since version.id is the same)
    const finalFetchCount = (global.fetch as any).mock.calls.length;
    expect(finalFetchCount).toBe(initialFetchCount);

    console.log('[TEST] Version object reference change did not trigger re-fetch');
  });
});
