/**
 * Dashboard Page
 * Server component for displaying dashboard with KPIs and charts
 */

import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { auth } from '@/lib/auth/config';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { VersionWithRelations } from '@/services/version';

// Dynamic import for Dashboard component (includes heavy charts)
const Dashboard = dynamic(() => import('@/components/dashboard/Dashboard').then(mod => ({ default: mod.Dashboard })), {
  loading: () => (
    <div className="container mx-auto py-6 px-4">
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  ),
  ssr: false, // Client-side only since it uses Web Workers
});

export const revalidate = 60; // Revalidate every 60 seconds

export default async function DashboardPage(): Promise<JSX.Element> {
  // Authentication required
  const session = await auth();

  if (!session || !session.user) {
    redirect('/auth/signin?callbackUrl=/dashboard');
  }

  // Fetch user's versions from API
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/versions?page=1&limit=100`, {
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
            Failed to load versions. Please try again later.
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
            {data.error || 'Failed to load versions'}
          </div>
        </Card>
      </div>
    );
  }

  const versions = data.data.versions || [];

  // For each version, we need to fetch full details with relationships
  // This is a simplified version - in production, we might want to fetch versions
  // with relationships in a single query or optimize this
  const versionsWithDetails: VersionWithRelations[] = await Promise.all(
    versions.slice(0, 10).map(async (version: { id: string; [key: string]: unknown }) => {
      try {
        const versionResponse = await fetch(`${baseUrl}/api/versions/${version.id}`, {
          headers: {
            Cookie: `next-auth.session-token=${(session as { token?: string }).token || ''}`,
          },
          cache: 'no-store',
        });

        if (versionResponse.ok) {
          const versionData = await versionResponse.json();
          if (versionData.success) {
            return versionData.data;
          }
        }
        return version;
      } catch (error) {
        console.error(`Failed to fetch version ${version.id}:`, error);
        return version;
      }
    })
  );

  return (
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
        <Dashboard versions={versionsWithDetails} />
      </Suspense>
    </div>
  );
}

