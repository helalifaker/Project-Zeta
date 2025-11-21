/**
 * Live Preview Calculator Component
 * Displays real-time financial preview for a transition year
 */

'use client';

import { Badge } from '@/components/ui/badge';
import Decimal from 'decimal.js';

interface LivePreviewCalculatorProps {
  enrollment: number;
  averageTuition: number; // From props (no default!)
  otherRevenue: number; // NEW
  opex?: number; // NEW: Direct OpEx value
  staffCosts: number;
  rent: number;
  opexPercent?: number; // Keep optional with default (fallback)
  isLoading?: boolean;
}

export function LivePreviewCalculator({
  enrollment,
  averageTuition,
  otherRevenue,
  opex,
  staffCosts,
  rent,
  opexPercent = 0.15, // Default 15% of revenue (fallback)
  isLoading = false,
}: LivePreviewCalculatorProps): JSX.Element {
  const calculateMetrics = (): {
    revenue: string;
    ebitda: string;
    staffPercent: string;
  } => {
    try {
      // Tuition Revenue = Enrollment × Average Tuition
      const tuitionRevenue = new Decimal(enrollment).times(averageTuition);

      // Total Revenue = Tuition Revenue + Other Revenue
      const totalRevenue = tuitionRevenue.plus(otherRevenue);

      // OpEx: Use direct value if provided, otherwise calculate from percentage
      const opexValue = opex !== undefined ? new Decimal(opex) : totalRevenue.times(opexPercent);

      // EBITDA = Revenue - Staff Costs - Rent - OpEx
      const ebitda = totalRevenue.minus(staffCosts).minus(rent).minus(opexValue);

      // Staff % = Staff Costs / Revenue
      const staffPercent = new Decimal(staffCosts).dividedBy(totalRevenue).times(100);

      return {
        revenue: totalRevenue.toFixed(0),
        ebitda: ebitda.toFixed(0),
        staffPercent: staffPercent.toFixed(1),
      };
    } catch (error) {
      return {
        revenue: '0',
        ebitda: '0',
        staffPercent: '0.0',
      };
    }
  };

  const formatNumber = (num: string): string => {
    const numValue = parseFloat(num);
    if (isNaN(numValue)) return '0';

    // Format in millions for cleaner display
    const millions = numValue / 1000000;
    return millions.toFixed(1) + 'M';
  };

  const getEbitdaColor = (ebitda: string): string => {
    const numValue = parseFloat(ebitda);
    if (numValue < 0) return 'text-red-500';
    if (numValue > 0) return 'text-green-500';
    return 'text-muted-foreground';
  };

  if (isLoading) {
    return (
      <div className="space-y-1 animate-pulse">
        <div className="h-4 bg-muted rounded w-32" />
        <div className="h-4 bg-muted rounded w-28" />
        <div className="h-4 bg-muted rounded w-24" />
      </div>
    );
  }

  const metrics = calculateMetrics();

  return (
    <div className="space-y-1 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Revenue:</span>
        <Badge variant="outline" className="font-mono">
          {formatNumber(metrics.revenue)} SAR
        </Badge>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">EBITDA:</span>
        <Badge variant="outline" className={`font-mono ${getEbitdaColor(metrics.ebitda)}`}>
          {formatNumber(metrics.ebitda)} SAR
        </Badge>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Staff %:</span>
        <Badge variant="secondary" className="font-mono">
          {metrics.staffPercent}%
        </Badge>
      </div>
    </div>
  );
}
