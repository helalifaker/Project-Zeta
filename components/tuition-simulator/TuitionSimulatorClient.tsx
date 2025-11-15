/**
 * Tuition Simulator Client Component Wrapper
 * Handles dynamic import with ssr: false for Next.js 15 compatibility
 */

'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { VersionWithRelations } from '@/services/version';

// Dynamic import for TuitionSimulator component (includes heavy charts and calculations)
const TuitionSimulator = dynamic(() => import('./TuitionSimulator').then(mod => ({ default: mod.TuitionSimulator })), {
  loading: () => (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-screen" />
        <Skeleton className="h-screen" />
        <Skeleton className="h-screen" />
      </div>
    </div>
  ),
  ssr: false, // Client-side only since it uses Web Workers
});

interface TuitionSimulatorClientProps {
  versions: VersionWithRelations[];
}

export function TuitionSimulatorClient({ versions }: TuitionSimulatorClientProps): JSX.Element {
  return <TuitionSimulator versions={versions} />;
}

