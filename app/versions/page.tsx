/**
 * Versions List Page
 * Server component for displaying list of versions
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { VersionList } from '@/components/versions/VersionList';
import { Card } from '@/components/ui/card';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';

interface VersionsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    mode?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

async function VersionsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-32 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
      </div>
      <Card className="p-12">
        <div className="h-4 w-48 bg-muted rounded animate-pulse mx-auto" />
      </Card>
    </div>
  );
}

export const revalidate = 60; // Revalidate every 60 seconds

export default async function VersionsPage({ searchParams }: VersionsPageProps) {
  // Authentication required
  const session = await auth();

  if (!session || !session.user) {
    redirect('/auth/signin?callbackUrl=/versions');
  }

  // Parse search params
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const limit = Math.min(parseInt(params.limit || '20', 10), 100);

  // Fetch versions directly from service layer (Server Component can access database directly)
  const { listVersions } = await import('@/services/version');
  
  const queryParams: any = {
    page,
    limit,
  };
  
  // Only add optional params if they have values
  if (params.status && params.status !== 'all') {
    queryParams.status = params.status;
  }
  if (params.mode && params.mode !== 'all') {
    queryParams.mode = params.mode;
  }
  if (params.search) {
    queryParams.search = params.search;
  }
  if (params.sortBy) {
    queryParams.sortBy = params.sortBy;
  }
  if (params.sortOrder) {
    queryParams.sortOrder = params.sortOrder;
  }
  
  const versionsResult = await listVersions(queryParams, session.user.id);

  if (!versionsResult.success) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <div className="text-destructive">
            {versionsResult.error || 'Failed to load versions'}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4">
        <Suspense fallback={<VersionsPageSkeleton />}>
          <VersionList
            initialVersions={versionsResult.data.versions}
            initialPagination={versionsResult.data.pagination}
          />
        </Suspense>
      </div>
    </AuthenticatedLayout>
  );
}

