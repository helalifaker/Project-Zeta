/**
 * Dashboard Store (Zustand)
 * Global state management for dashboard UI
 */

'use client';

import { create } from 'zustand';
import type { VersionListItem } from '@/services/version';
import type { FullProjectionResult } from '@/lib/calculations/financial/projection';

interface DashboardState {
  // State
  selectedVersionId: string | null;
  versions: VersionListItem[];
  projection: FullProjectionResult | null;
  loading: boolean;
  error: string | null;

  // Actions
  setSelectedVersionId: (versionId: string | null) => void;
  setVersions: (versions: VersionListItem[]) => void;
  setProjection: (projection: FullProjectionResult | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetDashboard: () => void;
}

const initialState = {
  selectedVersionId: null,
  versions: [],
  projection: null,
  loading: false,
  error: null,
};

export const useDashboardStore = create<DashboardState>((set) => ({
  ...initialState,

  setSelectedVersionId: (versionId) => set({ selectedVersionId: versionId }),

  setVersions: (versions) => set({ versions }),

  setProjection: (projection) => set({ projection }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  resetDashboard: () => set({ ...initialState }),
}));

