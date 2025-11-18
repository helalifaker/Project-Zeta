/**
 * KPI Card Component
 * Displays a single key performance indicator with value, label, and optional trend
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Decimal from 'decimal.js';

/**
 * Format number as SAR currency
 */
function formatSAR(value: Decimal | number): string {
  const num = typeof value === 'number' ? value : value.toNumber();
  if (!Number.isFinite(num) || isNaN(num)) {
    return 'SAR 0';
  }
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format number with appropriate scale (K, M, B)
 */
function formatCompact(value: Decimal | number): string {
  const num = typeof value === 'number' ? value : value.toNumber();
  if (!Number.isFinite(num) || isNaN(num)) {
    return '0';
  }
  
  if (Math.abs(num) >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (Math.abs(num) >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(num) >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toFixed(0);
}

/**
 * Format percentage
 */
function formatPercent(value: Decimal | number): string {
  const num = typeof value === 'number' ? value : value.toNumber();
  if (!Number.isFinite(num) || isNaN(num)) {
    return '0%';
  }
  return `${num.toFixed(1)}%`;
}

/**
 * Props for KPICard component
 */
export interface KPICardProps {
  /** Label for the KPI */
  label: string;
  /** Value to display */
  value: Decimal | number | string | null;
  /** Format type: 'currency', 'percentage', 'number', or 'compact' */
  format?: 'currency' | 'percentage' | 'number' | 'compact';
  /** Optional trend indicator (e.g., "+5.2%") */
  trend?: string;
  /** Optional trend color (for visual indication) */
  trendColor?: 'positive' | 'negative' | 'neutral';
  /** Accent color for the card border/hover */
  accentColor?: 'blue' | 'green' | 'orange' | 'red' | 'yellow';
  /** Status indicator (optimal, warning, critical) */
  status?: 'optimal' | 'warning' | 'critical';
  /** ARIA label for accessibility */
  ariaLabel?: string;
}

/**
 * KPI Card component displays a single key performance indicator
 * 
 * @param props - KPICardProps containing label, value, and formatting options
 * @returns JSX.Element - Card component with KPI display
 * 
 * @example
 * ```tsx
 * <KPICard
 *   label="NPV (2028-2052)"
 *   value={new Decimal(232792422)}
 *   format="currency"
 *   accentColor="blue"
 *   ariaLabel="Net Present Value for rent from 2028 to 2052"
 * />
 * ```
 */
export function KPICard({
  label,
  value,
  format = 'number',
  trend,
  trendColor = 'neutral',
  accentColor = 'blue',
  status,
  ariaLabel,
}: KPICardProps): JSX.Element {
  // Format value based on format type
  const formattedValue = (() => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    
    if (typeof value === 'string') {
      return value;
    }
    
    const decimalValue = value instanceof Decimal ? value : new Decimal(value);
    
    if (decimalValue.isNaN() || !decimalValue.isFinite()) {
      return 'N/A';
    }
    
    switch (format) {
      case 'currency':
        return formatSAR(decimalValue);
      case 'percentage':
        return formatPercent(decimalValue);
      case 'compact':
        return formatCompact(decimalValue);
      case 'number':
      default:
        return decimalValue.toLocaleString('en-US');
    }
  })();

  // Determine accent color classes
  const accentClasses = {
    blue: 'border-accent-blue/20 hover:border-accent-blue/30',
    green: 'border-accent-green/20 hover:border-accent-green/30',
    orange: 'border-accent-orange/20 hover:border-accent-orange/30',
    red: 'border-accent-red/20 hover:border-accent-red/30',
    yellow: 'border-accent-yellow/20 hover:border-accent-yellow/30',
  };

  // Determine status color classes
  const statusClasses = {
    optimal: 'border-accent-green/30',
    warning: 'border-accent-yellow/30',
    critical: 'border-accent-red/30',
  };

  // Determine trend color classes
  const trendColorClasses = {
    positive: 'text-accent-green',
    negative: 'text-accent-red',
    neutral: 'text-muted-foreground',
  };

  return (
    <Card
      className={cn(
        'border-2 transition-colors hover:shadow-md',
        accentClasses[accentColor],
        status && statusClasses[status]
      )}
      aria-label={ariaLabel || label}
    >
      <CardContent className="p-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{formattedValue}</p>
          {trend && (
            <div className={cn('flex items-center gap-1 text-xs', trendColorClasses[trendColor])}>
              <span>{trend}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

