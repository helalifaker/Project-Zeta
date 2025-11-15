/**
 * Reports Page
 * Server component for reports management
 */

import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/lib/auth/config';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportsClient } from '@/components/reports/ReportsClient';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function ReportsPage(): Promise<JSX.Element> {
  // Authentication required
  const session = await auth();

  if (!session || !session.user) {
    redirect('/auth/signin?callbackUrl=/reports');
  }

  // Fetch user's reports from API
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/reports?page=1&limit=100`, {
    headers: {
      Cookie: `next-auth.session-token=${(session as { token?: string }).token || ''}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="p-6">
          <div className="text-destructive">
            Failed to load reports. Please try again later.
          </div>
        </Card>
      </div>
    );
  }

  const data = await response.json();

  if (!data.success) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="p-6">
          <div className="text-destructive">
            {data.error || 'Failed to load reports'}
          </div>
        </Card>
      </div>
    );
  }

  const reports = data.data.reports || [];
  const pagination = data.data.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  };

  // Fetch available versions for report generation
  const versionsResponse = await fetch(`${baseUrl}/api/versions?page=1&limit=100`, {
    headers: {
      Cookie: `next-auth.session-token=${(session as { token?: string }).token || ''}`,
    },
    cache: 'no-store',
  });

  let versions: Array<{ id: string; name: string; [key: string]: unknown }> = [];
  if (versionsResponse.ok) {
    const versionsData = await versionsResponse.json();
    if (versionsData.success) {
      versions = versionsData.data.versions || [];
    }
  }

  const userRole = (session.user as { role?: string }).role || 'VIEWER';

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4">
        <Suspense fallback={
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-96" />
          </div>
        }>
          <ReportsClient
            initialReports={reports}
            initialPagination={pagination}
            versions={versions}
            userRole={userRole}
          />
        </Suspense>
      </div>
    </AuthenticatedLayout>
  );
}

