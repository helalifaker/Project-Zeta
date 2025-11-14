/**
 * Version Store (Zustand)
 * Global state management for version management UI
 */

'use client';

import { create } from 'zustand';
import type { VersionWithRelations, VersionListItem } from '@/services/version';

export interface VersionFilters {
  status?: string; // 'all' | 'DRAFT' | 'READY' | 'APPROVED' | 'LOCKED'
  mode?: string; // 'all' | 'RELOCATION_2028' | 'HISTORICAL_BASELINE'
  search?: string; // Search query for name/description
}

export interface VersionPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface VersionState {
  // State
  versions: VersionListItem[];
  selectedVersion: VersionWithRelations | null;
  filters: VersionFilters;
  pagination: VersionPagination;
  loading: boolean;
  error: string | null;

  // Actions
  setVersions: (versions: VersionListItem[]) => void;
  setSelectedVersion: (version: VersionWithRelations | null) => void;
  setFilters: (filters: Partial<VersionFilters>) => void;
  setPagination: (pagination: Partial<VersionPagination>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetFilters: () => void;
}

const initialState = {
  versions: [],
  selectedVersion: null,
  filters: {
    status: 'all',
    mode: 'all',
    search: '',
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  loading: false,
  error: null,
};

export const useVersionStore = create<VersionState>((set) => ({
  ...initialState,

  setVersions: (versions) => set({ versions }),

  setSelectedVersion: (version) => set({ selectedVersion: version }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 }, // Reset to page 1 on filter change
    })),

  setPagination: (newPagination) =>
    set((state) => ({
      pagination: { ...state.pagination, ...newPagination },
    })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  resetFilters: () =>
    set({
      filters: initialState.filters,
      pagination: { ...initialState.pagination },
    }),
}));

