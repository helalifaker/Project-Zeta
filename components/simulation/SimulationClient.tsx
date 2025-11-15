/**
 * Simulation Client Component Wrapper
 * Handles dynamic import with ssr: false for Next.js 15 compatibility
 */

'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { VersionWithRelations } from '@/services/version';

// Dynamic import for Simulation component (includes heavy charts and calculations)
const Simulation = dynamic(() => import('./Simulation').then(mod => ({ default: mod.Simulation })), {
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

interface SimulationClientProps {
  versions: VersionWithRelations[];
  userRole?: string;
}

export function SimulationClient({ versions, userRole = 'VIEWER' }: SimulationClientProps): JSX.Element {
  return <Simulation versions={versions} userRole={userRole} />;
}

