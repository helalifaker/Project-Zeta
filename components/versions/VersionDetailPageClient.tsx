/**
 * Version Detail Page Client Component
 * Wraps the entire page in a client component to avoid server-side rendering issues
 */

'use client';

import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamic import for VersionDetail component
const VersionDetail = dynamic(() => import('./VersionDetail').then(mod => ({ default: mod.VersionDetail })), {
  loading: () => (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-96" />
    </div>
  ),
  ssr: false, // Client-side only
});

interface VersionDetailPageClientProps {
  versionId: string;
}

export function VersionDetailPageClient({ versionId }: VersionDetailPageClientProps): JSX.Element {
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4">
        <VersionDetail versionId={versionId} />
      </div>
    </AuthenticatedLayout>
  );
}

