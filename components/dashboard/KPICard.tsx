/**
 * KPI Card Component
 * Displays a single key performance indicator with optional trend indicator
 */

'use client';

import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getHealthStyles, type HealthStatus } from '@/lib/utils/metric-health';
import { Sparkline } from './Sparkline';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string; // Optional unit to display smaller (e.g., "M SAR", "%")
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  status?: HealthStatus;
  sparklineData?: Array<{ value: number }>; // Historical data for sparkline
  className?: string;
}

function KPICardComponent({
  title,
  value,
  unit,
  description,
  trend,
  trendValue,
  status,
  sparklineData,
  className,
}: KPICardProps) {
  const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-muted-foreground';

  const Icon = trendIcon;
  const healthStyles = status ? getHealthStyles(status) : null;

  return (
    <Card
      className={cn(
        'group relative overflow-hidden',
        healthStyles?.gradient || 'bg-gradient-to-br from-card via-card to-muted/5',
        'border-l-4',
        healthStyles?.border || 'border-l-muted',
        'transition-all duration-300 ease-out',
        'hover:shadow-lg hover:shadow-primary/10',
        'hover:-translate-y-1',
        'hover:ring-2 hover:ring-primary/20',
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {trend && (
          <div className={cn('flex items-center gap-1', trendColor)}>
            <Icon className="h-4 w-4" />
            {trendValue && <span className="text-xs">{trendValue}</span>}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-4xl md:text-5xl font-bold tracking-tight tabular-nums">{value}</div>
          {unit && <span className="text-lg font-medium text-muted-foreground">{unit}</span>}
        </div>
        {description && <CardDescription className="mt-1 text-xs">{description}</CardDescription>}
        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-4">
            <Sparkline
              data={sparklineData}
              color={healthStyles?.text.replace('text-', '') || 'muted-foreground'}
              height={40}
            />
          </div>
        )}
      </CardContent>

      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </Card>
  );
}

// Memoize component to prevent unnecessary re-renders
export const KPICard = memo(KPICardComponent, (prevProps, nextProps) => {
  // Check sparklineData equality (shallow comparison of array length and values)
  const sparklineEqual =
    prevProps.sparklineData === nextProps.sparklineData ||
    (prevProps.sparklineData?.length === nextProps.sparklineData?.length &&
      (prevProps.sparklineData?.every((d, i) => d.value === nextProps.sparklineData?.[i]?.value) ??
        true));

  return (
    prevProps.title === nextProps.title &&
    prevProps.value === nextProps.value &&
    prevProps.unit === nextProps.unit &&
    prevProps.description === nextProps.description &&
    prevProps.trend === nextProps.trend &&
    prevProps.trendValue === nextProps.trendValue &&
    prevProps.status === nextProps.status &&
    prevProps.className === nextProps.className &&
    sparklineEqual
  );
});

KPICard.displayName = 'KPICard';
