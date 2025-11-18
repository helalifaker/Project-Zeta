/**
 * Version Detail Client Component Wrapper
 * Handles dynamic import with ssr: false for Next.js 15 compatibility
 */

'use client';

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

interface VersionDetailClientProps {
  versionId: string;
}

export function VersionDetailClient({ versionId }: VersionDetailClientProps): JSX.Element {
  return <VersionDetail versionId={versionId} />;
}

