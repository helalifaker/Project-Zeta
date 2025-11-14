/**
 * Settings Client Component
 * Main orchestrator component with tabs for different settings sections
 */

'use client';

import { useEffect } from 'react';
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

interface SettingsProps {
  initialSettings: AdminSettings | null;
  initialUsers: UserWithMetadata[];
  initialUsersTotal: number;
  initialAuditLogs: AuditLogEntry[];
  initialAuditLogsTotal: number;
  initialSystemHealth: SystemHealthType | null;
}

export function Settings({
  initialSettings,
  initialUsers,
  initialUsersTotal,
  initialAuditLogs,
  initialAuditLogsTotal,
  initialSystemHealth,
}: SettingsProps) {
  const {
    settings,
    users,
    auditLogs,
    systemHealth,
  } = useSettingsStore();

  // Initialize store with server data
  useEffect(() => {
    if (initialSettings && !settings) {
      useSettingsStore.setState({ settings: initialSettings });
    }
    if (initialUsers.length > 0 && users.length === 0) {
      useSettingsStore.setState({
        users: initialUsers,
        usersTotal: initialUsersTotal,
      });
    }
    if (initialAuditLogs.length > 0 && auditLogs.length === 0) {
      useSettingsStore.setState({
        auditLogs: initialAuditLogs,
        auditLogsTotal: initialAuditLogsTotal,
      });
    }
    if (initialSystemHealth && !systemHealth) {
      useSettingsStore.setState({ systemHealth: initialSystemHealth });
    }
  }, [
    initialSettings,
    initialUsers,
    initialAuditLogs,
    initialSystemHealth,
    settings,
    users,
    auditLogs,
    systemHealth,
    initialUsersTotal,
    initialAuditLogsTotal,
  ]);

  return (
    <Tabs defaultValue="settings" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="settings">Global Settings</TabsTrigger>
        <TabsTrigger value="users">User Management</TabsTrigger>
        <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        <TabsTrigger value="health">System Health</TabsTrigger>
      </TabsList>

      <TabsContent value="settings" className="mt-6">
        <GlobalSettings />
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

