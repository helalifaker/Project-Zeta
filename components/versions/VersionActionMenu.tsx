/**
 * Version Action Menu Component
 * Dropdown menu with actions for version operations
 * Respects user permissions (VIEWER, PLANNER, ADMIN)
 */

'use client';

import { useRouter } from 'next/navigation';
import { MoreVertical, Edit, Copy, Lock, Trash2, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { VersionListItem, VersionWithRelations } from '@/services/version';
import { useAuth } from '@/hooks/useAuth';
import { useComparisonStore } from '@/stores/comparison-store';
import { useState } from 'react';

interface VersionActionMenuProps {
  version: VersionListItem | VersionWithRelations;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onLock?: () => void;
  onDelete?: () => void;
}

export function VersionActionMenu({
  version,
  onEdit,
  onDuplicate,
  onLock,
  onDelete,
}: VersionActionMenuProps) {
  const router = useRouter();
  const { role } = useAuth();
  const { addVersion, selectedVersionIds } = useComparisonStore();
  const [loading, setLoading] = useState(false);

  const handleAddToComparison = () => {
    addVersion(version.id);
    router.push('/compare');
  };

  const canEdit = role === 'ADMIN' || role === 'PLANNER';
  const canDelete = role === 'ADMIN';
  const canLock = role === 'ADMIN' || role === 'PLANNER';
  const isLocked = version.status === 'LOCKED';

  const handleDuplicate = async () => {
    if (onDuplicate) {
      onDuplicate();
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/versions/${version.id}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/versions/${data.data.id}`);
        router.refresh();
      } else {
        alert(`Failed to duplicate version: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to duplicate version:', error);
      alert('Failed to duplicate version');
    } finally {
      setLoading(false);
    }
  };

  const handleLock = async () => {
    if (onLock) {
      onLock();
      return;
    }

    if (isLocked) {
      return; // Already locked
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/versions/${version.id}/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success) {
        router.refresh();
      } else {
        alert(`Failed to lock version: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to lock version:', error);
      alert('Failed to lock version');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      onDelete();
      return;
    }

    if (!confirm(`Are you sure you want to delete "${version.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/versions/${version.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        router.push('/versions');
        router.refresh();
      } else {
        alert(`Failed to delete version: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to delete version:', error);
      alert('Failed to delete version');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={loading}>
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canEdit && !isLocked && (
          <DropdownMenuItem onClick={() => onEdit?.() || router.push(`/versions/${version.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}
        {canEdit && (
          <DropdownMenuItem onClick={handleDuplicate} disabled={loading}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={handleAddToComparison}
          disabled={selectedVersionIds.includes(version.id) || selectedVersionIds.length >= 4}
        >
          <GitCompare className="mr-2 h-4 w-4" />
          Add to Comparison
        </DropdownMenuItem>
        {canLock && !isLocked && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLock} disabled={loading}>
              <Lock className="mr-2 h-4 w-4" />
              Lock
            </DropdownMenuItem>
          </>
        )}
        {canDelete && !isLocked && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} disabled={loading} className="text-red-400 focus:text-red-400">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

