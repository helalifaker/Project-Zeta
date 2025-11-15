/**
 * Dashboard Client Component Wrapper
 * Handles dynamic import with ssr: false for Next.js 15 compatibility
 */

'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { AppHeader } from '@/components/layout/AppHeader';
import type { VersionWithRelations } from '@/services/version';

// Dynamic import for Dashboard component (includes heavy charts)
const Dashboard = dynamic(() => import('./Dashboard').then(mod => ({ default: mod.Dashboard })), {
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

interface DashboardClientProps {
  versions: VersionWithRelations[];
}

export function DashboardClient({ versions }: DashboardClientProps): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex-1">
        <Dashboard versions={versions} />
      </div>
    </div>
  );
}

