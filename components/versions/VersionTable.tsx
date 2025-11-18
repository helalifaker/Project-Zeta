/**
 * Version Table Component
 * Detailed table view of versions with sortable columns
 */

'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { VersionStatusBadge } from './VersionStatusBadge';
import { VersionActionMenu } from './VersionActionMenu';
import type { VersionListItem } from '@/services/version';

interface VersionTableProps {
  versions: VersionListItem[];
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
}

export function VersionTable({ versions }: VersionTableProps) {
  if (versions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No versions found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Mode</TableHead>
          <TableHead>Created By</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {versions.map((version) => (
          <TableRow key={version.id} className="hover:bg-muted/50">
            <TableCell className="font-medium">
              <Link
                href={`/versions/${version.id}`}
                className="hover:text-primary transition-colors"
              >
                {version.name}
              </Link>
              {version.description && (
                <div className="text-sm text-muted-foreground truncate max-w-md">
                  {version.description}
                </div>
              )}
            </TableCell>
            <TableCell>
              <VersionStatusBadge status={version.status} />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {version.mode === 'RELOCATION_2028' ? 'Relocation' : 'Historical'}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {version.creator?.name || version.creator?.email || 'Unknown'}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(version.createdAt)}
            </TableCell>
            <TableCell className="text-right">
              <VersionActionMenu version={version} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

