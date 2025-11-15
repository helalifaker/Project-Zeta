/**
 * Dashboard Page
 * Server component for displaying dashboard with KPIs and charts
 */

import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/lib/auth/config';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { VersionWithRelations } from '@/services/version';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { serializeVersionForClient } from '@/lib/utils/serialize';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function DashboardPage(): Promise<JSX.Element> {
  // Authentication required
  const session = await auth();

  if (!session || !session.user) {
    redirect('/auth/signin?callbackUrl=/dashboard');
  }

  // Fetch user's versions directly from database using service layer
  const userId = session.user.id;
  const userRole = session.user.role;
  
  // Test database connection first
  const { testDatabaseConnection } = await import('@/lib/db/test-connection');
  const connectionTest = await testDatabaseConnection();
  
  if (!connectionTest.success) {
    console.error('Dashboard: Database connection failed:', connectionTest.error);
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto py-6 px-4">
          <Card className="p-6 border-destructive">
            <div className="text-destructive space-y-2">
              <p className="font-semibold">Database Connection Error</p>
              <p className="text-sm text-muted-foreground">
                Unable to connect to the database. Please check your connection settings.
              </p>
              <p className="text-xs text-muted-foreground mt-4 font-mono">
                {connectionTest.error || 'Unknown connection error'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Make sure DATABASE_URL is set in your .env.local file.
              </p>
            </div>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }
  
  // Import version service functions
  const { listVersions, getVersionById } = await import('@/services/version');
  
  let versionsResult;
  try {
    // Fetch only first page with limited results for faster initial load
    versionsResult = await listVersions(
      {
        page: 1,
        limit: 10, // Reduced from 100 to 10 for faster loading
      },
      userId
    );
  } catch (err) {
    console.error('Dashboard: Failed to load versions:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    const errorStack = err instanceof Error ? err.stack : undefined;
    
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto py-6 px-4">
          <Card className="p-6 border-destructive">
            <div className="text-destructive space-y-2">
              <p className="font-semibold">Failed to load versions</p>
              <p className="text-sm text-muted-foreground">
                {errorMessage}
              </p>
              {errorStack && process.env.NODE_ENV === 'development' && (
                <details className="mt-4">
                  <summary className="text-xs text-muted-foreground cursor-pointer">Error details</summary>
                  <pre className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded overflow-auto">
                    {errorStack}
                  </pre>
                </details>
              )}
              <p className="text-xs text-muted-foreground mt-4">
                Please check your database connection and try again.
              </p>
            </div>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!versionsResult.success) {
    console.error('Dashboard: listVersions returned error:', versionsResult.error, versionsResult.code);
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto py-6 px-4">
          <Card className="p-6 border-destructive">
            <div className="text-destructive space-y-2">
              <p className="font-semibold">Failed to load versions</p>
              <p className="text-sm text-muted-foreground">
                {versionsResult.error || 'An unexpected error occurred'}
              </p>
              {versionsResult.code && (
                <p className="text-xs text-muted-foreground">
                  Error code: {versionsResult.code}
                </p>
              )}
            </div>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  const versions = versionsResult.data.versions || [];

  // Fetch full details only for the first version initially (for faster initial load)
  // Other versions will be loaded on-demand when selected
  const versionsWithDetails: VersionWithRelations[] = [];
  
  if (versions.length > 0 && versions[0]) {
    try {
      const firstVersion = versions[0];
      const versionResult = await getVersionById(firstVersion.id, userId, userRole);
      if (versionResult.success && versionResult.data) {
        // Serialize version data for Client Component (convert Decimal to number)
        versionsWithDetails.push(serializeVersionForClient(versionResult.data));
      }
    } catch (err) {
      console.error('Dashboard: Failed to load first version details:', err);
      // Continue without the first version's details - it will load on-demand
    }
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4">
        <Suspense fallback={
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        }>
          <DashboardClient versions={versionsWithDetails} />
        </Suspense>
      </div>
    </AuthenticatedLayout>
  );
}

