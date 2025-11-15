/**
 * Compare Client Component Wrapper
 * Handles dynamic import with ssr: false for Next.js 15 compatibility
 */

'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { VersionWithRelations } from '@/services/version';

// Dynamic import for Compare component (includes heavy comparison charts)
const Compare = dynamic(() => import('./Compare').then(mod => ({ default: mod.Compare })), {
  loading: () => (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-96" />
      <Skeleton className="h-96" />
    </div>
  ),
  ssr: false, // Client-side only since it uses Web Workers
});

interface CompareClientProps {
  versions: VersionWithRelations[];
}

export function CompareClient({ versions }: CompareClientProps): JSX.Element {
  return <Compare versions={versions} />;
}

