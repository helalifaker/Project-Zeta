/**
 * Hero Section Component
 * Prominent header section for dashboard showing active scenario and status
 */

'use client';

import { Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
  versionName: string;
  status: 'healthy' | 'warning' | 'error';
  children?: React.ReactNode;
}

export function HeroSection({ versionName, status, children }: HeroSectionProps): JSX.Element {
  const statusConfig = {
    healthy: {
      icon: CheckCircle2,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      label: 'All metrics healthy',
    },
    warning: {
      icon: AlertCircle,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      label: 'Some metrics need attention',
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      label: 'Critical issues detected',
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-accent-blue/10 via-background to-background border border-accent-blue/20 p-6 md:p-8">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-blue/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="h-12 w-12 rounded-xl bg-accent-blue/20 flex items-center justify-center flex-shrink-0 ring-1 ring-accent-blue/30">
            <Activity className="h-6 w-6 text-accent-blue" />
          </div>

          {/* Version info */}
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Scenario</p>
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary">{versionName}</h2>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
                  config.bg,
                  config.color
                )}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {config.label}
              </div>

              <span className="text-xs text-muted-foreground">Updated just now</span>
            </div>
          </div>
        </div>

        {/* Action slot (version selector) */}
        <div className="w-full md:w-auto">{children}</div>
      </div>
    </div>
  );
}
