/**
 * Sparkline Component
 * Minimal trend chart for displaying historical data in KPI cards
 */

'use client';

import { memo } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

interface SparklineProps {
  data: Array<{ value: number }>;
  color?: string;
  height?: number;
}

function SparklineComponent({ data, color = '#10b981', height = 40 }: SparklineProps) {
  // Don't render if no data or insufficient data points
  if (!data || data.length < 2) {
    return null;
  }

  // Calculate domain for Y-axis (add 10% padding for visual clarity)
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.1 || 1;
  const domain: [number, number] = [min - padding, max + padding];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`sparkline-gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis domain={domain} hide />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#sparkline-gradient-${color})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Memoize to prevent unnecessary re-renders
export const Sparkline = memo(SparklineComponent, (prevProps, nextProps) => {
  return (
    prevProps.color === nextProps.color &&
    prevProps.height === nextProps.height &&
    prevProps.data.length === nextProps.data.length &&
    prevProps.data.every((d, i) => d.value === nextProps.data[i]?.value)
  );
});

Sparkline.displayName = 'Sparkline';
