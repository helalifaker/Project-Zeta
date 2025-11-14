/**
 * Capex Timeline Chart Component
 * Bar chart showing capex items by year
 */

'use client';

import { memo, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { chartTheme, formatChartCurrency } from '@/lib/charts/config';
import { colors } from '@/config/design-system';

interface CapexTimelineChartProps {
  data: Array<{
    year: number;
    amount: number;
    category?: string;
  }>;
}

function CapexTimelineChartComponent({ data }: CapexTimelineChartProps): JSX.Element {
  // Group by category for stacked bars
  const categories = ['Building', 'Equipment', 'Technology', 'Other'];
  const categoryColors: Record<string, string> = {
    Building: colors.accent.blue,
    Equipment: colors.accent.green,
    Technology: colors.accent.yellow,
    Other: colors.accent.orange,
  };

  // Memoize chart data transformation
  const chartData = useMemo(() => {
    return data.map((item) => {
      const result: Record<string, number> = { year: item.year };
      categories.forEach((cat) => {
        result[cat] = item.category === cat ? item.amount : 0;
      });
      return result;
    });
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        role="img"
        aria-label="Capex timeline chart showing capital expenditure by year and category"
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
        {categories.map((category) => (
          <Bar
            key={category}
            dataKey={category}
            stackId="capex"
            fill={categoryColors[category]}
            name={category}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// Memoize component to prevent unnecessary re-renders
export const CapexTimelineChart = memo(CapexTimelineChartComponent, (prevProps, nextProps) => {
  return (
    prevProps.data.length === nextProps.data.length &&
    prevProps.data.every((item, idx) => {
      const nextItem = nextProps.data[idx];
      if (!nextItem) return false;
      return (
        item.year === nextItem.year &&
        item.amount === nextItem.amount &&
        item.category === nextItem.category
      );
    })
  );
});

CapexTimelineChart.displayName = 'CapexTimelineChart';

