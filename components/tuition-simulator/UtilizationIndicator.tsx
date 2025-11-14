/**
 * Utilization Indicator Component
 * Display utilization percentage with color coding
 */

'use client';

import { Badge } from '@/components/ui/badge';

interface UtilizationIndicatorProps {
  students: number;
  capacity: number;
  year: number;
  highlightRampUp?: boolean; // Highlight 2028-2032 period
}

export function UtilizationIndicator({
  students,
  capacity,
  year,
  highlightRampUp = false,
}: UtilizationIndicatorProps) {
  if (capacity === 0) return <span className="text-muted-foreground">N/A</span>;

  const utilization = (students / capacity) * 100;
  const isRampUpPeriod = year >= 2028 && year <= 2032;
  const isAtCapacity = utilization >= 99.9;
  const isOverCapacity = students > capacity;

  // Color coding
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
  if (isOverCapacity) {
    variant = 'destructive';
  } else if (isAtCapacity) {
    variant = 'default';
  } else if (isRampUpPeriod && highlightRampUp) {
    variant = 'outline';
  } else {
    variant = 'secondary';
  }

  return (
    <Badge variant={variant} className={isRampUpPeriod && highlightRampUp ? 'border-primary' : ''}>
      {utilization.toFixed(1)}%
      {isOverCapacity && ' ⚠️'}
    </Badge>
  );
}

