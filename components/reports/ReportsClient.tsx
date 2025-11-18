/**
 * Reports Client Component Wrapper
 * Handles dynamic import with ssr: false for Next.js 15 compatibility
 */

'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { ReportListItem } from '@/stores/reports-store';

// Dynamic import for Reports component (includes PDF/Excel generation)
const Reports = dynamic(() => import('./Reports').then(mod => ({ default: mod.Reports })), {
  loading: () => (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-96" />
    </div>
  ),
  ssr: false, // Client-side only
});

interface ReportsClientProps {
  initialReports?: ReportListItem[];
  initialPagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  versions?: Array<{ id: string; name: string }>;
  userRole?: string;
}

export function ReportsClient({ initialReports, initialPagination, versions, userRole }: ReportsClientProps): JSX.Element {
  return <Reports initialReports={initialReports} initialPagination={initialPagination} versions={versions} userRole={userRole} />;
}

