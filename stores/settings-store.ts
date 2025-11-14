/**
 * Settings Store
 * Zustand store for admin settings page state management
 */

import { create } from 'zustand';
import type { AdminSettings } from '@/services/admin/settings';
import type { UserWithMetadata } from '@/services/admin/users';
import type { AuditLogEntry } from '@/services/admin/audit';
import type { SystemHealth } from '@/services/admin/health';

interface SettingsState {
  // Settings
  settings: AdminSettings | null;
  settingsLoading: boolean;
  settingsError: string | null;

  // Users
  users: UserWithMetadata[];
  usersTotal: number;
  usersPage: number;
  usersLimit: number;
  usersLoading: boolean;
  usersError: string | null;
  usersFilters: {
    role?: string;
    search?: string;
  };

  // Audit Logs
  auditLogs: AuditLogEntry[];
  auditLogsTotal: number;
  auditLogsPage: number;
  auditLogsLimit: number;
  auditLogsLoading: boolean;
  auditLogsError: string | null;
  auditLogsFilters: {
    userId?: string;
    entityType?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  };

  // System Health
  systemHealth: SystemHealth | null;
  systemHealthLoading: boolean;
  systemHealthError: string | null;

  // Actions
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AdminSettings>) => Promise<boolean>;
  fetchUsers: (filters?: { role?: string; search?: string; page?: number; limit?: number }) => Promise<void>;
  createUser: (data: { email: string; name: string; role: string; password: string }) => Promise<boolean>;
  updateUser: (userId: string, data: Partial<{ name: string; role: string; email: string; password: string }>) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  fetchAuditLogs: (filters?: {
    userId?: string;
    entityType?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  fetchSystemHealth: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  settings: null,
  settingsLoading: false,
  settingsError: null,
  users: [],
  usersTotal: 0,
  usersPage: 1,
  usersLimit: 20,
  usersLoading: false,
  usersError: null,
  usersFilters: {},
  auditLogs: [],
  auditLogsTotal: 0,
  auditLogsPage: 1,
  auditLogsLimit: 20,
  auditLogsLoading: false,
  auditLogsError: null,
  auditLogsFilters: {},
  systemHealth: null,
  systemHealthLoading: false,
  systemHealthError: null,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...initialState,

  fetchSettings: async () => {
    set({ settingsLoading: true, settingsError: null });
    try {
      const response = await fetch('/api/admin/settings');
      const result = await response.json();
      if (result.success) {
        set({ settings: result.data, settingsLoading: false });
      } else {
        set({ settingsError: result.error, settingsLoading: false });
      }
    } catch (error) {
      set({ settingsError: 'Failed to fetch settings', settingsLoading: false });
    }
  },

  updateSettings: async (updates) => {
    set({ settingsLoading: true, settingsError: null });
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const result = await response.json();
      if (result.success) {
        set({ settings: result.data, settingsLoading: false });
        return true;
      } else {
        set({ settingsError: result.error, settingsLoading: false });
        return false;
      }
    } catch (error) {
      set({ settingsError: 'Failed to update settings', settingsLoading: false });
      return false;
    }
  },

  fetchUsers: async (filters = {}) => {
    set({ usersLoading: true, usersError: null });
    try {
      const params = new URLSearchParams();
      if (filters.role) params.append('role', filters.role);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const result = await response.json();
      if (result.success) {
        const newFilters: { role?: string; search?: string } = {};
        if (filters.role) newFilters.role = filters.role;
        if (filters.search) newFilters.search = filters.search;
        set({
          users: result.data.users,
          usersTotal: result.data.total,
          usersPage: result.data.page,
          usersLimit: result.data.limit,
          usersFilters: newFilters,
          usersLoading: false,
        });
      } else {
        set({ usersError: result.error, usersLoading: false });
      }
    } catch (error) {
      set({ usersError: 'Failed to fetch users', usersLoading: false });
    }
  },

  createUser: async (data) => {
    set({ usersLoading: true, usersError: null });
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        // Refresh users list
        await get().fetchUsers(get().usersFilters);
        return true;
      } else {
        set({ usersError: result.error, usersLoading: false });
        return false;
      }
    } catch (error) {
      set({ usersError: 'Failed to create user', usersLoading: false });
      return false;
    }
  },

  updateUser: async (userId, data) => {
    set({ usersLoading: true, usersError: null });
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        // Refresh users list
        await get().fetchUsers(get().usersFilters);
        return true;
      } else {
        set({ usersError: result.error, usersLoading: false });
        return false;
      }
    } catch (error) {
      set({ usersError: 'Failed to update user', usersLoading: false });
      return false;
    }
  },

  deleteUser: async (userId) => {
    set({ usersLoading: true, usersError: null });
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        // Refresh users list
        await get().fetchUsers(get().usersFilters);
        return true;
      } else {
        set({ usersError: result.error, usersLoading: false });
        return false;
      }
    } catch (error) {
      set({ usersError: 'Failed to delete user', usersLoading: false });
      return false;
    }
  },

  fetchAuditLogs: async (filters = {}) => {
    set({ auditLogsLoading: true, auditLogsError: null });
    try {
      const params = new URLSearchParams();
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.action) params.append('action', filters.action);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const result = await response.json();
      if (result.success) {
        const newFilters: {
          userId?: string;
          entityType?: string;
          action?: string;
          startDate?: string;
          endDate?: string;
        } = {};
        if (filters.userId) newFilters.userId = filters.userId;
        if (filters.entityType) newFilters.entityType = filters.entityType;
        if (filters.action) newFilters.action = filters.action;
        if (filters.startDate) newFilters.startDate = filters.startDate;
        if (filters.endDate) newFilters.endDate = filters.endDate;
        set({
          auditLogs: result.data.logs,
          auditLogsTotal: result.data.total,
          auditLogsPage: result.data.page,
          auditLogsLimit: result.data.limit,
          auditLogsFilters: newFilters,
          auditLogsLoading: false,
        });
      } else {
        set({ auditLogsError: result.error, auditLogsLoading: false });
      }
    } catch (error) {
      set({ auditLogsError: 'Failed to fetch audit logs', auditLogsLoading: false });
    }
  },

  fetchSystemHealth: async () => {
    set({ systemHealthLoading: true, systemHealthError: null });
    try {
      const response = await fetch('/api/admin/health');
      const result = await response.json();
      if (result.success) {
        set({ systemHealth: result.data, systemHealthLoading: false });
      } else {
        set({ systemHealthError: result.error, systemHealthLoading: false });
      }
    } catch (error) {
      set({ systemHealthError: 'Failed to fetch system health', systemHealthLoading: false });
    }
  },

  reset: () => {
    set(initialState);
  },
}));

