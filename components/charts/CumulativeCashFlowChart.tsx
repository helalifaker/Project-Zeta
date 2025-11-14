/**
 * Cumulative Cash Flow Chart Component
 * Line chart showing cumulative cash flow over time
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
  ReferenceLine,
} from 'recharts';
import { chartTheme, chartColors, formatChartCurrency } from '@/lib/charts/config';
import { colors } from '@/config/design-system';

interface CumulativeCashFlowChartProps {
  data: Array<{
    year: number;
    cumulativeCashFlow: number;
  }>;
}

function CumulativeCashFlowChartComponent({ data }: CumulativeCashFlowChartProps): JSX.Element {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        role="img"
        aria-label="Cumulative cash flow chart showing cumulative cash flow over time"
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
        <ReferenceLine y={0} stroke={colors.text.tertiary} strokeDasharray="3 3" />
        <Line
          type="monotone"
          dataKey="cumulativeCashFlow"
          stroke={chartColors.cashflow}
          strokeWidth={2}
          name="Cumulative Cash Flow"
          dot={{ fill: chartColors.cashflow, r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Memoize component to prevent unnecessary re-renders
export const CumulativeCashFlowChart = memo(CumulativeCashFlowChartComponent, (prevProps, nextProps) => {
  return (
    prevProps.data.length === nextProps.data.length &&
    prevProps.data.every((item, idx) => {
      const nextItem = nextProps.data[idx];
      if (!nextItem) return false;
      return (
        item.year === nextItem.year &&
        item.cumulativeCashFlow === nextItem.cumulativeCashFlow
      );
    })
  );
});

CumulativeCashFlowChart.displayName = 'CumulativeCashFlowChart';

