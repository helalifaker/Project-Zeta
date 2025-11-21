/**
 * Version Card Component
 * Summary card displaying key version information
 */

'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VersionStatusBadge } from './VersionStatusBadge';
import { VersionActionMenu } from './VersionActionMenu';
import type { VersionListItem } from '@/services/version';
interface VersionCardProps {
  version: VersionListItem;
}

/**
 * Format date for display with relative time
 *
 * @param date - Date to format (Date object, ISO string, or null/undefined)
 * @returns Formatted date string or fallback message
 *
 * @example
 * formatDate(new Date()) // "just now"
 * formatDate("2024-01-01T00:00:00Z") // "5 days ago"
 * formatDate(null) // "No date"
 */
function formatDate(date: Date | string | null | undefined): string {
  // Handle null/undefined
  if (date === null || date === undefined) {
    return 'No date';
  }

  // Parse date
  const d = typeof date === 'string' ? new Date(date) : date;

  // Validate date object
  if (!(d instanceof Date) || isNaN(d.getTime())) {
    return 'Invalid date';
  }

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

  // For older dates, return formatted date string
  try {
    return d.toLocaleDateString();
  } catch (err) {
    return 'Invalid date';
  }
}

export function VersionCard({ version }: VersionCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1 flex-1">
          <CardTitle className="text-base">
            <Link
              href={`/versions/${version.id}`}
              className="hover:text-primary transition-colors"
            >
              {version.name}
            </Link>
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {version.description || 'No description'}
          </CardDescription>
        </div>
        <VersionActionMenu version={version} />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm space-y-2">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <VersionStatusBadge status={version.status} />
              <span className="text-muted-foreground text-xs">
                {version.mode === 'RELOCATION_2028' ? 'Relocation' : 'Historical'}
              </span>
            </div>
            <div className="text-muted-foreground text-xs">
              <div>
                Created by {version.creator?.name || version.creator?.email || 'Unknown'}
              </div>
              <div>
                {formatDate(version.createdAt)}
              </div>
              {version._count && (
                <div>
                  {version._count.curriculum_plans || 0} curriculum plan{(version._count.curriculum_plans || 0) !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

