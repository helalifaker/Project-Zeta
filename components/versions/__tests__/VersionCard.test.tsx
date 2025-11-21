/**
 * VersionCard Component Tests
 * Comprehensive tests for VersionCard including formatDate edge cases
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VersionCard } from '../VersionCard';
import type { VersionListItem } from '@/services/version';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/versions',
}));

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
      },
    },
    status: 'authenticated',
  }),
}));

// Mock auth hook (uses next-auth under the hood)
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com', name: 'Test User', role: 'ADMIN' },
    isAuthenticated: true,
    isLoading: false,
    role: 'ADMIN',
  }),
}));

// Mock comparison store
vi.mock('@/stores/comparison-store', () => ({
  useComparisonStore: () => ({
    selectedVersionIds: [],
    addVersion: vi.fn(),
    removeVersion: vi.fn(),
    clearVersions: vi.fn(),
  }),
}));

// Helper to create test version data
function createTestVersion(overrides?: Partial<VersionListItem>): VersionListItem {
  return {
    id: 'version-1',
    name: 'Test Version',
    description: 'Test description',
    mode: 'RELOCATION_2028',
    status: 'DRAFT',
    createdBy: 'user-1',
    basedOnId: null,
    createdAt: new Date('2024-01-01T12:00:00Z'),
    updatedAt: new Date('2024-01-01T12:00:00Z'),
    lockedAt: null,
    lockedBy: null,
    lockReason: null,
    transitionCapacity: 1850,
    creator: {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
    },
    basedOn: null,
    _count: {
      curriculum_plans: 2,
      derivatives: 0,
    },
    ...overrides,
  };
}

describe('VersionCard', () => {
  describe('rendering', () => {
    it('should render version name and description', () => {
      const version = createTestVersion();
      render(<VersionCard version={version} />);

      expect(screen.getByText('Test Version')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('should render "No description" when description is missing', () => {
      const version = createTestVersion({ description: null });
      render(<VersionCard version={version} />);

      expect(screen.getByText('No description')).toBeInTheDocument();
    });

    it('should render creator name', () => {
      const version = createTestVersion();
      render(<VersionCard version={version} />);

      expect(screen.getByText(/Created by Test User/)).toBeInTheDocument();
    });

    it('should render creator email when name is missing', () => {
      const version = createTestVersion({
        creator: {
          id: 'user-1',
          email: 'test@example.com',
          name: null,
        },
      });
      render(<VersionCard version={version} />);

      expect(screen.getByText(/Created by test@example.com/)).toBeInTheDocument();
    });

    it('should render "Unknown" when creator is missing', () => {
      const version = createTestVersion({ creator: null });
      render(<VersionCard version={version} />);

      expect(screen.getByText(/Created by Unknown/)).toBeInTheDocument();
    });

    it('should render curriculum plan count', () => {
      const version = createTestVersion();
      render(<VersionCard version={version} />);

      expect(screen.getByText('2 curriculum plans')).toBeInTheDocument();
    });

    it('should render singular "plan" for count of 1', () => {
      const version = createTestVersion({
        _count: { curriculum_plans: 1, derivatives: 0 },
      });
      render(<VersionCard version={version} />);

      expect(screen.getByText('1 curriculum plan')).toBeInTheDocument();
    });

    it('should render mode as "Relocation" for RELOCATION_2028', () => {
      const version = createTestVersion({ mode: 'RELOCATION_2028' });
      render(<VersionCard version={version} />);

      expect(screen.getByText('Relocation')).toBeInTheDocument();
    });

    it('should render mode as "Historical" for HISTORICAL_BASELINE', () => {
      const version = createTestVersion({ mode: 'HISTORICAL_BASELINE' });
      render(<VersionCard version={version} />);

      expect(screen.getByText('Historical')).toBeInTheDocument();
    });
  });

  describe('formatDate edge cases', () => {
    beforeEach(() => {
      // Mock current time for consistent relative time testing
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-10T12:00:00Z'));
    });

    it('should handle null createdAt gracefully', () => {
      const version = createTestVersion({ createdAt: null as any });
      render(<VersionCard version={version} />);

      expect(screen.getByText('No date')).toBeInTheDocument();
    });

    it('should handle undefined createdAt gracefully', () => {
      const version = createTestVersion({ createdAt: undefined as any });
      render(<VersionCard version={version} />);

      expect(screen.getByText('No date')).toBeInTheDocument();
    });

    it('should handle invalid date string gracefully', () => {
      const version = createTestVersion({ createdAt: 'invalid-date' as any });
      render(<VersionCard version={version} />);

      expect(screen.getByText('Invalid date')).toBeInTheDocument();
    });

    it('should handle empty string date gracefully', () => {
      const version = createTestVersion({ createdAt: '' as any });
      render(<VersionCard version={version} />);

      expect(screen.getByText('Invalid date')).toBeInTheDocument();
    });

    it('should format "just now" for dates less than 1 minute ago', () => {
      const now = new Date('2024-01-10T12:00:00Z');
      const version = createTestVersion({ createdAt: new Date(now.getTime() - 30000) }); // 30 seconds ago
      render(<VersionCard version={version} />);

      expect(screen.getByText('just now')).toBeInTheDocument();
    });

    it('should format minutes for dates less than 1 hour ago', () => {
      const now = new Date('2024-01-10T12:00:00Z');
      const version = createTestVersion({ createdAt: new Date(now.getTime() - 5 * 60000) }); // 5 minutes ago
      render(<VersionCard version={version} />);

      expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
    });

    it('should format singular "minute" correctly', () => {
      const now = new Date('2024-01-10T12:00:00Z');
      const version = createTestVersion({ createdAt: new Date(now.getTime() - 60000) }); // 1 minute ago
      render(<VersionCard version={version} />);

      expect(screen.getByText('1 minute ago')).toBeInTheDocument();
    });

    it('should format hours for dates less than 24 hours ago', () => {
      const now = new Date('2024-01-10T12:00:00Z');
      const version = createTestVersion({ createdAt: new Date(now.getTime() - 3 * 3600000) }); // 3 hours ago
      render(<VersionCard version={version} />);

      expect(screen.getByText('3 hours ago')).toBeInTheDocument();
    });

    it('should format singular "hour" correctly', () => {
      const now = new Date('2024-01-10T12:00:00Z');
      const version = createTestVersion({ createdAt: new Date(now.getTime() - 3600000) }); // 1 hour ago
      render(<VersionCard version={version} />);

      expect(screen.getByText('1 hour ago')).toBeInTheDocument();
    });

    it('should format days for dates less than 7 days ago', () => {
      const now = new Date('2024-01-10T12:00:00Z');
      const version = createTestVersion({ createdAt: new Date(now.getTime() - 5 * 86400000) }); // 5 days ago
      render(<VersionCard version={version} />);

      expect(screen.getByText('5 days ago')).toBeInTheDocument();
    });

    it('should format singular "day" correctly', () => {
      const now = new Date('2024-01-10T12:00:00Z');
      const version = createTestVersion({ createdAt: new Date(now.getTime() - 86400000) }); // 1 day ago
      render(<VersionCard version={version} />);

      expect(screen.getByText('1 day ago')).toBeInTheDocument();
    });

    it('should format full date for dates older than 7 days', () => {
      const version = createTestVersion({ createdAt: new Date('2024-01-01T12:00:00Z') }); // 9 days ago
      render(<VersionCard version={version} />);

      // Check that it contains a date format (exact format may vary by locale)
      const dateText = screen.getByText(/1\/1\/2024|Jan|January/i);
      expect(dateText).toBeInTheDocument();
    });

    it('should handle ISO 8601 date strings (from API)', () => {
      const version = createTestVersion({ createdAt: '2024-01-09T12:00:00.000Z' as any }); // 1 day ago
      render(<VersionCard version={version} />);

      expect(screen.getByText('1 day ago')).toBeInTheDocument();
    });

    it('should handle Date objects', () => {
      const now = new Date('2024-01-10T12:00:00Z');
      const version = createTestVersion({ createdAt: new Date(now.getTime() - 60000) }); // 1 minute ago
      render(<VersionCard version={version} />);

      expect(screen.getByText('1 minute ago')).toBeInTheDocument();
    });

    it('should handle future dates gracefully', () => {
      const future = new Date('2025-01-01T12:00:00Z');
      const version = createTestVersion({ createdAt: future });
      const { container } = render(<VersionCard version={version} />);

      // Future dates will have negative diff, should still render without crashing
      // Since we're mocking time at 2024-01-10, a 2025-01-01 date would have negative values
      // The implementation will show large negative values or formatted date
      // Just verify it renders without crashing
      expect(container).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper link navigation', () => {
      const version = createTestVersion();
      render(<VersionCard version={version} />);

      const link = screen.getByRole('link', { name: 'Test Version' });
      expect(link).toHaveAttribute('href', '/versions/version-1');
    });
  });
});
