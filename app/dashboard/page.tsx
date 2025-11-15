/**
 * Dashboard Page
 * Server component for displaying dashboard with KPIs and charts
 */

import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/lib/auth/config';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function DashboardPage(): Promise<JSX.Element> {
  // Authentication required
  const session = await auth();

  if (!session || !session.user) {
    redirect('/auth/signin?callbackUrl=/dashboard');
  }

  // Fetch user's versions directly from database using service layer
  const userId = session.user.id;
  
  // Skip database connection test for faster loading
  // Direct query is faster than testing connection first
  
  // Import version service function
  const { listVersions } = await import('@/services/version');
  
  // Time the query for performance monitoring
  const queryStart = performance.now();
  let versionsResult;
  try {
    // Fetch only first page with limited results for instant navigation
    versionsResult = await listVersions(
      {
        page: 1,
        limit: 5,
      },
      userId
    );
    const queryTime = performance.now() - queryStart;
    if (queryTime > 100) {
      console.warn(`⚠️ Dashboard query took ${queryTime.toFixed(0)}ms (target: <100ms)`);
    }
  } catch (err) {
    console.error('Dashboard: Failed to load versions:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    const errorStack = err instanceof Error ? err.stack : undefined;
    
    return (
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
    );
  }

  if (!versionsResult.success) {
    console.error('Dashboard: listVersions returned error:', versionsResult.error, versionsResult.code);
    return (
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
    );
  }

  // Pass lightweight version list (just id + name) for version selector
  // Full version details will be loaded on-demand when user selects a version
  const versions = versionsResult.data.versions || [];
  
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-96 w-full max-w-6xl" />
      </div>
    }>
      <DashboardClient versions={versions as any} />
    </Suspense>
  );
}

