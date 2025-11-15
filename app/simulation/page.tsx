/**
 * Simulation Page
 * Server component for full simulation sandbox
 */

import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/lib/auth/config';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { VersionWithRelations } from '@/services/version';
import { SimulationClient } from '@/components/simulation/SimulationClient';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { serializeVersionForClient } from '@/lib/utils/serialize';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function SimulationPage(): Promise<JSX.Element> {
  // Authentication required - ADMIN or PLANNER only
  const session = await auth();

  if (!session || !session.user) {
    redirect('/auth/signin?callbackUrl=/simulation');
  }

  // Check role - only ADMIN and PLANNER can access simulation
  const userRole = session.user.role;
  if (userRole !== 'ADMIN' && userRole !== 'PLANNER') {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="p-6">
          <div className="text-destructive">
            Access denied. Only ADMIN and PLANNER roles can access the simulation sandbox.
          </div>
        </Card>
      </div>
    );
  }

  const userId = session.user.id;

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

  // Fetch full details for first 5 versions (simulation needs detailed data)
  const versionsWithDetails: VersionWithRelations[] = [];
  
  for (const version of versions.slice(0, 5)) {
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
              <div className="grid gap-6 md:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-96" />
                ))}
              </div>
            </div>
          }
        >
          <SimulationClient versions={versionsWithDetails} />
        </Suspense>
      </div>
    </AuthenticatedLayout>
  );
}
