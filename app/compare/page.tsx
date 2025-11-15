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
import { serializeVersionForClient } from '@/lib/utils/serialize';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function ComparePage(): Promise<JSX.Element> {
  // Authentication required
  const session = await auth();

  if (!session || !session.user) {
    redirect('/auth/signin?callbackUrl=/compare');
  }

  const userId = session.user.id;
  const userRole = session.user.role;

  // Fetch versions directly from service layer
  const { listVersions, getVersionById } = await import('@/services/version');
  
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

  // Fetch full details with relationships for first 10 versions
  const versionsWithDetails: VersionWithRelations[] = [];
  
  for (const version of versions.slice(0, 10)) {
    try {
      const versionResult = await getVersionById(version.id, userId, userRole);
      if (versionResult.success && versionResult.data) {
        versionsWithDetails.push(serializeVersionForClient(versionResult.data));
      }
    } catch (error) {
      console.error(`Failed to load version ${version.id}:`, error);
      // Continue with other versions
    }
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4">
        <Suspense
          fallback={
            <div className="space-y-6">
              <Skeleton className="h-8 w-64" />
              <div className="grid gap-4 md:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            </div>
          }
        >
          <CompareClient versions={versionsWithDetails} />
        </Suspense>
      </div>
    </AuthenticatedLayout>
  );
}
