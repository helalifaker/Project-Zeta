/**
 * Comparison Store (Zustand)
 * Global state management for version comparison
 */

'use client';

import { create } from 'zustand';
import type { VersionListItem } from '@/services/version';
import type { FullProjectionResult } from '@/lib/calculations/financial/projection';

interface ComparisonState {
  // State - selected versions for comparison (2-4 versions)
  selectedVersionIds: string[];
  versions: VersionListItem[];
  projections: Map<string, FullProjectionResult>; // versionId -> projection
  loading: boolean;
  error: string | null;

  // Actions
  addVersion: (versionId: string) => void;
  removeVersion: (versionId: string) => void;
  clearComparison: () => void;
  setVersions: (versions: VersionListItem[]) => void;
  setProjection: (versionId: string, projection: FullProjectionResult) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const initialState = {
  selectedVersionIds: [],
  versions: [],
  projections: new Map<string, FullProjectionResult>(),
  loading: false,
  error: null,
};

export const useComparisonStore = create<ComparisonState>((set) => ({
  ...initialState,

  addVersion: (versionId) =>
    set((state) => {
      // Max 4 versions for comparison
      if (state.selectedVersionIds.length >= 4) {
        return state;
      }
      if (state.selectedVersionIds.includes(versionId)) {
        return state;
      }
      return {
        selectedVersionIds: [...state.selectedVersionIds, versionId],
      };
    }),

  removeVersion: (versionId) =>
    set((state) => ({
      selectedVersionIds: state.selectedVersionIds.filter((id) => id !== versionId),
      projections: new Map(
        Array.from(state.projections.entries()).filter(([id]) => id !== versionId)
      ),
    })),

  clearComparison: () =>
    set({
      selectedVersionIds: [],
      projections: new Map(),
    }),

  setVersions: (versions) => set({ versions }),

  setProjection: (versionId, projection) =>
    set((state) => {
      const newProjections = new Map(state.projections);
      newProjections.set(versionId, projection);
      return { projections: newProjections };
    }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),
}));

