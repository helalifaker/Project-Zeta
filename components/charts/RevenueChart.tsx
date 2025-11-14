/**
 * Revenue Chart Component
 * Example chart component using Recharts
 */

'use client';

import { memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { chartColors, chartTheme, formatChartCurrency } from '@/lib/charts/config';
import { colors } from '@/config/design-system';

interface RevenueChartProps {
  data: Array<{
    year: number;
    revenue: number;
    rent?: number;
    ebitda?: number;
  }>;
  showRent?: boolean;
  showEbitda?: boolean;
}

function RevenueChartComponent({
  data,
  showRent = false,
  showEbitda = false,
}: RevenueChartProps): JSX.Element {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        role="img"
        aria-label="Revenue chart showing revenue, rent, and EBITDA trends over time"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={chartTheme.gridColor}
          opacity={0.3}
        />
        <XAxis
          dataKey="year"
          stroke={chartTheme.textColor}
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke={chartTheme.textColor}
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => formatChartCurrency(value)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: colors.background.secondary,
            border: `1px solid ${colors.background.tertiary}`,
            borderRadius: '0.5rem',
            color: colors.text.primary,
          }}
          formatter={(value: number) => formatChartCurrency(value)}
        />
        <Legend
          wrapperStyle={{
            color: colors.text.primary,
            paddingTop: '20px',
          }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke={chartColors.revenue}
          strokeWidth={2}
          name="Revenue"
          dot={{ fill: chartColors.revenue, r: 4 }}
        />
        {showRent && (
          <Line
            type="monotone"
            dataKey="rent"
            stroke={chartColors.rent}
            strokeWidth={2}
            name="Rent"
            dot={{ fill: chartColors.rent, r: 4 }}
          />
        )}
        {showEbitda && (
          <Line
            type="monotone"
            dataKey="ebitda"
            stroke={chartColors.ebitda}
            strokeWidth={2}
            name="EBITDA"
            dot={{ fill: chartColors.ebitda, r: 4 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

// Memoize component to prevent unnecessary re-renders
export const RevenueChart = memo(RevenueChartComponent, (prevProps, nextProps) => {
  // Custom comparison function for optimal memoization
  return (
    prevProps.showRent === nextProps.showRent &&
    prevProps.showEbitda === nextProps.showEbitda &&
    prevProps.data.length === nextProps.data.length &&
    prevProps.data.every((item, idx) => {
      const nextItem = nextProps.data[idx];
      if (!nextItem) return false;
      return (
        item.year === nextItem.year &&
        item.revenue === nextItem.revenue &&
        item.rent === nextItem.rent &&
        item.ebitda === nextItem.ebitda
      );
    })
  );
});

RevenueChart.displayName = 'RevenueChart';

