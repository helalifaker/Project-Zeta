/**
 * EBITDA Trend Chart Component
 * Area chart showing EBITDA over time with positive/negative highlighting
 */

'use client';

import { memo, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { chartColors, chartTheme, formatChartCurrency } from '@/lib/charts/config';
import { colors } from '@/config/design-system';

interface EBITDATrendChartProps {
  data: Array<{
    year: number;
    ebitda: number;
  }>;
}

function EBITDATrendChartComponent({ data }: EBITDATrendChartProps): JSX.Element {
  // Memoize chart data transformation
  const chartData = useMemo(() => {
    return data.map((item) => ({
      year: item.year,
      ebitda: item.ebitda,
      positive: item.ebitda > 0 ? item.ebitda : 0,
      negative: item.ebitda < 0 ? item.ebitda : 0,
    }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        role="img"
        aria-label="EBITDA trend chart showing positive and negative EBITDA periods over time"
      >
        <defs>
          <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartColors.ebitda} stopOpacity={0.8} />
            <stop offset="95%" stopColor={chartColors.ebitda} stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.accent.red} stopOpacity={0.8} />
            <stop offset="95%" stopColor={colors.accent.red} stopOpacity={0.1} />
          </linearGradient>
        </defs>
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
        <Area
          type="monotone"
          dataKey="positive"
          stroke={chartColors.ebitda}
          fill="url(#colorPositive)"
          name="Positive EBITDA"
        />
        <Area
          type="monotone"
          dataKey="negative"
          stroke={colors.accent.red}
          fill="url(#colorNegative)"
          name="Negative EBITDA"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Memoize component to prevent unnecessary re-renders
export const EBITDATrendChart = memo(EBITDATrendChartComponent, (prevProps, nextProps) => {
  return (
    prevProps.data.length === nextProps.data.length &&
    prevProps.data.every((item, idx) => {
      const nextItem = nextProps.data[idx];
      if (!nextItem) return false;
      return item.year === nextItem.year && item.ebitda === nextItem.ebitda;
    })
  );
});

EBITDATrendChart.displayName = 'EBITDATrendChart';

