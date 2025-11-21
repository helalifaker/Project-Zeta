/**
 * Settings Client Component
 * Main orchestrator component with tabs for different settings sections
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlobalSettings } from './GlobalSettings';
import { UserManagement } from './UserManagement';
import { AuditLogViewer } from './AuditLogViewer';
import { SystemHealth } from './SystemHealth';
import { useSettingsStore } from '@/stores/settings-store';
import type { AdminSettings } from '@/services/admin/settings';
import type { UserWithMetadata } from '@/services/admin/users';
import type { AuditLogEntry } from '@/services/admin/audit';
import type { SystemHealth as SystemHealthType } from '@/services/admin/health';
import { useRenderLogger } from '@/hooks/use-render-logger';

interface SettingsProps {
  initialSettings?: AdminSettings | null;
  initialUsers?: UserWithMetadata[];
  initialUsersTotal?: number;
  initialAuditLogs?: AuditLogEntry[];
  initialAuditLogsTotal?: number;
  initialSystemHealth?: SystemHealthType | null;
}

export function Settings({
  initialSettings,
  initialUsers,
  initialUsersTotal,
  initialAuditLogs,
  initialAuditLogsTotal,
  initialSystemHealth,
}: SettingsProps) {
  // DIAGNOSTIC: Track render count
  useRenderLogger('Settings');

  const { settings, users, auditLogs, systemHealth } = useSettingsStore();

  const [activeTab, setActiveTab] = useState('settings');
  const [loadedTabs, setLoadedTabs] = useState<string[]>([]);
  const fetchingRef = useRef<Set<string>>(new Set());
  const settingsFetchedRef = useRef(false);

  // ✅ FIX: Use ref instead of state to prevent infinite loop
  // State in dependency array that is set by the effect = infinite loop
  const initializedRef = useRef(false);

  // Initialize store with server data (if provided) - only once
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const storeState = useSettingsStore.getState();
    const tabsToMark: string[] = [];

    if (initialSettings && !storeState.settings) {
      useSettingsStore.setState({ settings: initialSettings });
      tabsToMark.push('settings');
    }
    if (initialUsers && initialUsers.length > 0 && storeState.users.length === 0) {
      useSettingsStore.setState({
        users: initialUsers,
        usersTotal: initialUsersTotal || 0,
      });
      tabsToMark.push('users');
    }
    if (initialAuditLogs && initialAuditLogs.length > 0 && storeState.auditLogs.length === 0) {
      useSettingsStore.setState({
        auditLogs: initialAuditLogs,
        auditLogsTotal: initialAuditLogsTotal || 0,
      });
      tabsToMark.push('audit');
    }
    if (initialSystemHealth && !storeState.systemHealth) {
      useSettingsStore.setState({ systemHealth: initialSystemHealth });
      tabsToMark.push('health');
    }

    if (tabsToMark.length > 0) {
      setLoadedTabs((prev) => [...prev, ...tabsToMark.filter((t) => !prev.includes(t))]);
    }
  }, [
    initialSettings,
    initialUsers,
    initialAuditLogs,
    initialSystemHealth,
    initialUsersTotal,
    initialAuditLogsTotal,
  ]);

  // Load default tab (settings) on mount if not provided - only once
  useEffect(() => {
    if (loadedTabs.includes('settings')) {
      return; // Already loaded or initialized
    }

    const currentSettings = useSettingsStore.getState().settings;
    if (currentSettings) {
      setLoadedTabs((prev) => (prev.includes('settings') ? prev : [...prev, 'settings']));
      return;
    }

    // Prevent duplicate fetches (React Strict Mode runs effects twice in development)
    if (settingsFetchedRef.current) {
      return;
    }
    settingsFetchedRef.current = true;

    // Set default values immediately so UI can render
    const defaultSettings = {
      cpiRate: 0.03,
      discountRate: 0.08,
      taxRate: 0.15,
      currency: 'SAR',
      timezone: 'Asia/Riyadh',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: '1,000,000',
    };
    useSettingsStore.setState({ settings: defaultSettings });
    setLoadedTabs((prev) => (prev.includes('settings') ? prev : [...prev, 'settings']));

    // Then fetch real values in background
    console.log('📡 Fetching settings data...');
    const fetchStart = performance.now();

    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((res) => {
        const fetchTime = performance.now() - fetchStart;
        console.log(`✅ Settings loaded in ${fetchTime.toFixed(0)}ms`);

        if (res.success && res.data) {
          useSettingsStore.setState({ settings: res.data });
        }
      })
      .catch((error) => {
        console.error('❌ Failed to fetch settings:', error);
      });
  }, []); // Empty deps - only run once on mount

  // Lazy load data when tab is activated
  useEffect(() => {
    // Check if already loaded or currently fetching
    const currentLoadedTabs = loadedTabs;
    if (currentLoadedTabs.includes(activeTab) || fetchingRef.current.has(activeTab)) {
      return; // Already loaded or fetching
    }

    const storeState = useSettingsStore.getState();
    const fetchStart = performance.now();
    let endpoint = '';
    let dataKey = '';
    let shouldFetch = false;

    switch (activeTab) {
      case 'users':
        if (storeState.users.length > 0) {
          setLoadedTabs((prev) => (prev.includes('users') ? prev : [...prev, 'users']));
          return;
        }
        endpoint = '/api/admin/users?page=1&limit=20';
        dataKey = 'users';
        shouldFetch = true;
        console.log('📡 Fetching users data...');
        break;
      case 'audit':
        if (storeState.auditLogs.length > 0) {
          setLoadedTabs((prev) => (prev.includes('audit') ? prev : [...prev, 'audit']));
          return;
        }
        endpoint = '/api/admin/audit-logs?page=1&limit=20';
        dataKey = 'audit';
        shouldFetch = true;
        console.log('📡 Fetching audit logs data...');
        break;
      case 'health':
        if (storeState.systemHealth) {
          setLoadedTabs((prev) => (prev.includes('health') ? prev : [...prev, 'health']));
          return;
        }
        endpoint = '/api/admin/health';
        dataKey = 'health';
        shouldFetch = true;
        console.log('📡 Fetching system health data...');
        break;
      default:
        return;
    }

    if (!shouldFetch) return;

    // Mark as fetching
    fetchingRef.current.add(activeTab);

    fetch(endpoint)
      .then((r) => r.json())
      .then((res) => {
        const fetchTime = performance.now() - fetchStart;
        console.log(`✅ ${dataKey} loaded in ${fetchTime.toFixed(0)}ms`);

        if (res.success && res.data) {
          if (dataKey === 'users') {
            useSettingsStore.setState({
              users: res.data.users || [],
              usersTotal: res.data.total || 0,
            });
          } else if (dataKey === 'audit') {
            useSettingsStore.setState({
              auditLogs: res.data.logs || [],
              auditLogsTotal: res.data.total || 0,
            });
          } else if (dataKey === 'health') {
            useSettingsStore.setState({ systemHealth: res.data });
          }
          setLoadedTabs((prev) => (prev.includes(activeTab) ? prev : [...prev, activeTab]));
        }
      })
      .catch((error) => {
        console.error(`❌ Failed to fetch ${dataKey}:`, error);
      })
      .finally(() => {
        // Remove from fetching set
        fetchingRef.current.delete(activeTab);
      });
  }, [activeTab]); // Only depend on activeTab - check loadedTabs inside effect

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="settings">Global Settings</TabsTrigger>
        <TabsTrigger value="transition">Transition Planning</TabsTrigger>
        <TabsTrigger value="users">User Management</TabsTrigger>
        <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        <TabsTrigger value="health">System Health</TabsTrigger>
      </TabsList>

      <TabsContent value="settings" className="mt-6">
        <GlobalSettings />
      </TabsContent>

      <TabsContent value="transition" className="mt-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            Transition planning is available at a dedicated page for better usability
          </p>
          <a href="/admin/transition" className="text-primary hover:underline font-medium">
            Go to Transition Planning →
          </a>
        </div>
      </TabsContent>

      <TabsContent value="users" className="mt-6">
        <UserManagement />
      </TabsContent>

      <TabsContent value="audit" className="mt-6">
        <AuditLogViewer />
      </TabsContent>

      <TabsContent value="health" className="mt-6">
        <SystemHealth />
      </TabsContent>
    </Tabs>
  );
}
