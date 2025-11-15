/**
 * Compare Page
 * Server component for version comparison
 */

import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/lib/auth/config';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { VersionWithRelations } from '@/services/version';
import { CompareClient } from '@/components/compare/CompareClient';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function ComparePage(): Promise<JSX.Element> {
  // Authentication required
  const session = await auth();

  if (!session || !session.user) {
    redirect('/auth/signin?callbackUrl=/compare');
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

  // Fetch full details with relationships for each version
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
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4">
        <Suspense fallback={
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        }>
          <CompareClient versions={versionsWithDetails} />
        </Suspense>
      </div>
    </AuthenticatedLayout>
  );
}

