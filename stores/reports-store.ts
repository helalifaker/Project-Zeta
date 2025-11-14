/**
 * Reports Store (Zustand)
 * Global state management for reports page
 */

'use client';

import { create } from 'zustand';

export interface ReportListItem {
  id: string;
  versionId: string | null;
  reportType: string;
  format: string;
  fileName: string;
  fileSize: number;
  downloadUrl: string;
  expiresAt: string;
  generatedAt: string;
  version?: {
    id: string;
    name: string;
  } | null;
  generator: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface ReportsState {
  // State
  reports: ReportListItem[];
  selectedReport: ReportListItem | null;
  filters: {
    versionId?: string;
    reportType?: string;
    format?: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;

  // Actions
  setReports: (reports: ReportListItem[]) => void;
  setSelectedReport: (report: ReportListItem | null) => void;
  setFilters: (filters: Partial<ReportsState['filters']>) => void;
  setPagination: (pagination: Partial<ReportsState['pagination']>) => void;
  resetFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const initialState: Omit<
  ReportsState,
  | 'setReports'
  | 'setSelectedReport'
  | 'setFilters'
  | 'setPagination'
  | 'resetFilters'
  | 'setLoading'
  | 'setError'
> = {
  reports: [],
  selectedReport: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  loading: false,
  error: null,
};

export const useReportsStore = create<ReportsState>((set) => ({
  ...initialState,

  setReports: (reports) => set({ reports }),

  setSelectedReport: (report) => set({ selectedReport: report }),

  setFilters: (filters) => {
    set((state) => {
      const newFilters = { ...state.filters };
      if ('versionId' in filters) newFilters.versionId = filters.versionId;
      if ('reportType' in filters) newFilters.reportType = filters.reportType;
      if ('format' in filters) newFilters.format = filters.format;
      return {
        filters: newFilters,
        pagination: { ...state.pagination, page: 1 }, // Reset to first page on filter change
      };
    });
  },

  setPagination: (pagination) =>
    set((state) => ({
      pagination: { ...state.pagination, ...pagination },
    })),

  resetFilters: () =>
    set({
      filters: {},
      pagination: { ...initialState.pagination },
    }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),
}));

