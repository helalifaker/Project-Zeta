/**
 * KPI Card Component
 * Displays a single key performance indicator with optional trend indicator
 */

'use client';

import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

function KPICardComponent({
  title,
  value,
  description,
  trend,
  trendValue,
  className,
}: KPICardProps) {
  const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up'
      ? 'text-green-400'
      : trend === 'down'
        ? 'text-red-400'
        : 'text-muted-foreground';

  const Icon = trendIcon;

  return (
    <Card className={cn('hover:border-primary/50 transition-colors', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {trend && (
          <div className={cn('flex items-center gap-1', trendColor)}>
            <Icon className="h-4 w-4" />
            {trendValue && <span className="text-xs">{trendValue}</span>}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <CardDescription className="mt-1 text-xs">{description}</CardDescription>
        )}
      </CardContent>
    </Card>
  );
}

// Memoize component to prevent unnecessary re-renders
export const KPICard = memo(KPICardComponent, (prevProps, nextProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.value === nextProps.value &&
    prevProps.description === nextProps.description &&
    prevProps.trend === nextProps.trend &&
    prevProps.trendValue === nextProps.trendValue &&
    prevProps.className === nextProps.className
  );
});

KPICard.displayName = 'KPICard';

