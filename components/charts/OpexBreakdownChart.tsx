/**
 * Opex Breakdown Chart Component
 * Pie chart showing opex sub-accounts distribution
 */

'use client';

import { memo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { formatChartCurrency } from '@/lib/charts/config';
import { colors } from '@/config/design-system';

interface OpexBreakdownChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
}

const COLORS = [
  colors.chart.revenue,
  colors.chart.ebitda,
  colors.accent.yellow,
  colors.accent.orange,
  colors.accent.red,
  colors.accent.blue,
];

function OpexBreakdownChartComponent({ data }: OpexBreakdownChartProps): JSX.Element {
  if (data.length === 0) {
    return (
      <div className="h-400 flex items-center justify-center text-muted-foreground">
        No opex data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart
        role="img"
        aria-label="Opex breakdown pie chart showing operating expenses distribution by sub-account"
      >
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
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
      </PieChart>
    </ResponsiveContainer>
  );
}

// Memoize component to prevent unnecessary re-renders
export const OpexBreakdownChart = memo(OpexBreakdownChartComponent, (prevProps, nextProps) => {
  return (
    prevProps.data.length === nextProps.data.length &&
    prevProps.data.every((item, idx) => {
      const nextItem = nextProps.data[idx];
      if (!nextItem) return false;
      return item.name === nextItem.name && item.value === nextItem.value;
    })
  );
});

OpexBreakdownChart.displayName = 'OpexBreakdownChart';

