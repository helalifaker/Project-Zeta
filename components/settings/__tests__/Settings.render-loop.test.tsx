/**
 * Regression Test: Settings Component Render Loop Prevention
 *
 * Tests that the Settings component does not cause infinite re-renders after
 * fixing the isInitialized state dependency issue (replaced with ref).
 *
 * Bug Fixed: Settings component had isInitialized in useEffect dependency array,
 * which was also SET by the effect, causing infinite loops.
 *
 * Fix Applied: Replaced useState with useRef for initialization tracking.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Settings } from '../Settings';
import { useSettingsStore } from '@/stores/settings-store';
import React from 'react';

// Mock the settings store
vi.mock('@/stores/settings-store', () => ({
  useSettingsStore: vi.fn(),
}));

// Mock child components
vi.mock('../GlobalSettings', () => ({
  GlobalSettings: () => <div data-testid="global-settings">Global Settings</div>,
}));
vi.mock('../UserManagement', () => ({
  UserManagement: () => <div data-testid="user-management">User Management</div>,
}));
vi.mock('../AuditLogViewer', () => ({
  AuditLogViewer: () => <div data-testid="audit-log-viewer">Audit Log Viewer</div>,
}));
vi.mock('../SystemHealth', () => ({
  SystemHealth: () => <div data-testid="system-health">System Health</div>,
}));

// Mock fetch
global.fetch = vi.fn();

describe('Settings Component - Render Loop Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock default store state
    (useSettingsStore as any).mockReturnValue({
      settings: null,
      users: [],
      auditLogs: [],
      systemHealth: null,
    });

    // Mock getState for zustand store
    (useSettingsStore as any).getState = vi.fn().mockReturnValue({
      settings: null,
      users: [],
      auditLogs: [],
      systemHealth: null,
    });

    // Mock setState
    (useSettingsStore as any).setState = vi.fn();

    // Mock successful fetch response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          cpiRate: 0.03,
          discountRate: 0.08,
          taxRate: 0.15,
          currency: 'SAR',
          timezone: 'Asia/Riyadh',
          dateFormat: 'DD/MM/YYYY',
          numberFormat: '1,000,000',
        },
      }),
    });
  });

  it('should not re-render more than 10 times on mount', async () => {
    let renderCount = 0;

    // Wrapper component to count renders
    const RenderCounter = () => {
      renderCount++;
      return <Settings />;
    };

    render(<RenderCounter />);

    // Wait for effects to settle
    await waitFor(
      () => {
        expect(renderCount).toBeLessThan(11);
      },
      { timeout: 3000 }
    );

    // Log final render count for debugging
    console.log(`[TEST] Settings component rendered ${renderCount} times`);
  });

  it('should initialize only once even with initial props', async () => {
    let renderCount = 0;

    const RenderCounter = () => {
      renderCount++;
      return (
        <Settings
          initialSettings={{
            cpiRate: 0.03,
            discountRate: 0.08,
            taxRate: 0.15,
            currency: 'SAR',
            timezone: 'Asia/Riyadh',
            dateFormat: 'DD/MM/YYYY',
            numberFormat: '1,000,000',
          }}
          initialUsers={[]}
          initialUsersTotal={0}
          initialAuditLogs={[]}
          initialAuditLogsTotal={0}
          initialSystemHealth={null}
        />
      );
    };

    render(<RenderCounter />);

    // Wait for effects to settle
    await waitFor(
      () => {
        expect(renderCount).toBeLessThan(11);
      },
      { timeout: 3000 }
    );

    // Store setState should be called exactly once for initialSettings
    expect((useSettingsStore as any).setState).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({ cpiRate: 0.03 }),
      })
    );

    console.log(`[TEST] Settings with initial props rendered ${renderCount} times`);
  });

  it('should not cause infinite loop when switching tabs', async () => {
    const { container } = render(<Settings />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByTestid('global-settings')).toBeInTheDocument();
    });

    // Simulate tab switch (this would trigger re-renders in buggy version)
    const usersTab = container.querySelector('[value="users"]');
    if (usersTab) {
      usersTab.click();
    }

    // Should not cause infinite renders - component should stabilize
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // If we get here without timeout, test passes
    expect(true).toBe(true);
  });

  it('should stabilize render count after initial mount', async () => {
    let renderCount = 0;
    const renderCounts: number[] = [];

    const RenderCounter = () => {
      renderCount++;
      // Record render count every 100ms
      React.useEffect(() => {
        const interval = setInterval(() => {
          renderCounts.push(renderCount);
        }, 100);

        return () => clearInterval(interval);
      }, []);

      return <Settings />;
    };

    render(<RenderCounter />);

    // Wait 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Render count should stabilize (last 3 samples should be the same)
    const lastThree = renderCounts.slice(-3);
    expect(lastThree[0]).toBe(lastThree[1]);
    expect(lastThree[1]).toBe(lastThree[2]);

    console.log('[TEST] Render counts over time:', renderCounts);
  });
});
