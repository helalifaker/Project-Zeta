/**
 * Version List Client Component
 * Client component for displaying version list with filters and pagination
 */

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VersionCard } from './VersionCard';
import { VersionTable } from './VersionTable';
import { VersionFilters } from './VersionFilters';
import { useVersionStore } from '@/stores/version-store';
import type { VersionListItem } from '@/services/version';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';

interface VersionListProps {
  initialVersions?: VersionListItem[];
  initialPagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function VersionList({ initialVersions, initialPagination }: VersionListProps) {
  const { versions, pagination, filters, setVersions, setPagination, setLoading, setError } = useVersionStore();
  const [view, setView] = useState<'card' | 'table'>('card');

  // Initialize store with server data (if provided)
  useEffect(() => {
    if (initialVersions && initialPagination) {
      setVersions(initialVersions);
      setPagination(initialPagination);
      setLoading(false);
    } else {
      // No initial data - will be fetched by next useEffect
      setLoading(true);
    }
  }, [initialVersions, initialPagination, setVersions, setPagination, setLoading]);

  // Fetch versions when filters or pagination change
  useEffect(() => {
    const fetchVersions = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: String(pagination.page),
          limit: String(pagination.limit),
          ...(filters.status && filters.status !== 'all' && { status: filters.status }),
          ...(filters.mode && filters.mode !== 'all' && { mode: filters.mode }),
          ...(filters.search && { search: filters.search }),
        });

        const response = await fetch(`/api/versions?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setVersions(data.data.versions);
          setPagination(data.data.pagination);
        } else {
          setError(data.error || 'Failed to fetch versions');
        }
      } catch (error) {
        console.error('Failed to fetch versions:', error);
        setError('Failed to fetch versions');
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [pagination.page, pagination.limit, filters, setVersions, setPagination, setLoading, setError]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination({ page: newPage });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Versions</h1>
          <p className="text-muted-foreground">
            Manage your financial planning versions
          </p>
        </div>
        <Link href="/versions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Version
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <VersionFilters />

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {pagination.total} version{pagination.total !== 1 ? 's' : ''} found
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === 'card' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('card')}
          >
            Cards
          </Button>
          <Button
            variant={view === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('table')}
          >
            Table
          </Button>
        </div>
      </div>

      {/* Version List */}
      {versions.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No versions found</p>
          <Link href="/versions/new" className="mt-4 inline-block">
            <Button variant="outline">Create your first version</Button>
          </Link>
        </Card>
      ) : view === 'card' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {versions.map((version) => (
            <VersionCard key={version.id} version={version} />
          ))}
        </div>
      ) : (
        <Card>
          <VersionTable versions={versions} />
        </Card>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

