/**
 * Settings Page (Server Component)
 * Admin-only settings page with role check
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { Settings } from '@/components/settings/Settings';
import { getAdminSettings } from '@/services/admin/settings';
import { listUsers } from '@/services/admin/users';
import { listAuditLogs } from '@/services/admin/audit';
import { getSystemHealth } from '@/services/admin/health';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';

export default async function SettingsPage(): Promise<JSX.Element> {
  // Check authentication and role
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/settings');
  }

  // Only ADMIN can access settings
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Fetch initial data in parallel
  const [settingsResult, usersResult, auditLogsResult, healthResult] = await Promise.all([
    getAdminSettings(),
    listUsers({ page: 1, limit: 20 }, session.user.id),
    listAuditLogs({ page: 1, limit: 20 }),
    getSystemHealth(),
  ]);

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Admin Settings</h1>
          <p className="text-text-secondary mt-2">
            Manage global settings, users, and monitor system health
          </p>
        </div>

        <Settings
          initialSettings={settingsResult.success ? settingsResult.data : null}
          initialUsers={usersResult.success ? usersResult.data.users : []}
          initialUsersTotal={usersResult.success ? usersResult.data.total : 0}
          initialAuditLogs={auditLogsResult.success ? auditLogsResult.data.logs : []}
          initialAuditLogsTotal={auditLogsResult.success ? auditLogsResult.data.total : 0}
          initialSystemHealth={healthResult.success ? healthResult.data : null}
        />
      </div>
    </AuthenticatedLayout>
  );
}

