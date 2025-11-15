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

  const userId = session.user.id;
  const userRole = session.user.role;

  // Fetch user's versions for report generation (versions list, not reports)
  const { listVersions } = await import('@/services/version');
  
  const versionsResult = await listVersions(
    { page: 1, limit: 100 },
    userId
  );

  if (!versionsResult.success) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="p-6">
          <div className="text-destructive">
            {versionsResult.error || 'Failed to load versions'}
          </div>
        </Card>
      </div>
    );
  }

  const versions = versionsResult.data.versions || [];
  
  // Transform versions to simple format for reports
  const versionsForReports = versions.map(v => ({
    id: v.id,
    name: v.name,
  }));

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4">
        <Suspense
          fallback={
            <div className="space-y-6">
              <Skeleton className="h-8 w-64" />
              <div className="grid gap-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            </div>
          }
        >
          <ReportsClient 
            initialReports={[]} 
            initialPagination={{ page: 1, limit: 20, total: 0, totalPages: 0 }}
            versions={versionsForReports}
            userRole={userRole}
          />
        </Suspense>
      </div>
    </AuthenticatedLayout>
  );
}
