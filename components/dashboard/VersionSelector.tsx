/**
 * Version Selector Component
 * Dropdown selector for switching between versions on dashboard
 */

'use client';

import { useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDashboardStore } from '@/stores/dashboard-store';
import type { VersionListItem } from '@/services/version';
import { Skeleton } from '@/components/ui/skeleton';

interface VersionSelectorProps {
  versions: VersionListItem[];
  loading?: boolean;
}

export function VersionSelector({ versions, loading }: VersionSelectorProps) {
  const { selectedVersionId, setSelectedVersionId } = useDashboardStore();

  // Set default version (first one or most recent)
  useEffect(() => {
    if (!selectedVersionId && versions.length > 0 && versions[0]) {
      // Select the most recent version (first in list if sorted by createdAt desc)
      setSelectedVersionId(versions[0].id);
    }
  }, [versions, selectedVersionId, setSelectedVersionId]);

  if (loading) {
    return <Skeleton className="h-10 w-[200px]" />;
  }

  if (versions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No versions available
      </div>
    );
  }

  return (
    <Select
      {...(selectedVersionId && { value: selectedVersionId })}
      onValueChange={(value) => {
        setSelectedVersionId(value);
      }}
    >
      <SelectTrigger className="w-[250px]">
        <SelectValue placeholder="Select a version" />
      </SelectTrigger>
      <SelectContent>
        {versions.map((version) => (
          <SelectItem key={version.id} value={version.id}>
            {version.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

