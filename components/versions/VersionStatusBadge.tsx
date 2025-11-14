/**
 * Version Status Badge Component
 * Displays version status with appropriate color coding
 */

'use client';

import { VersionStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface VersionStatusBadgeProps {
  status: VersionStatus;
  className?: string;
}

const statusConfig = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  },
  READY: {
    label: 'Ready',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  APPROVED: {
    label: 'Approved',
    className: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  LOCKED: {
    label: 'Locked',
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
};

export function VersionStatusBadge({ status, className }: VersionStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

