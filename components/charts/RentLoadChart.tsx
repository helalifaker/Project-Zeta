/**
 * Rent Load Chart Component
 * Line chart showing Rent Load % with color-coded thresholds
 */

'use client';

import { memo, useMemo } from 'react';
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
import { chartColors, chartTheme } from '@/lib/charts/config';
import { colors } from '@/config/design-system';

interface RentLoadChartProps {
  data: Array<{
    year: number;
    rentLoad: number;
  }>;
}

function RentLoadChartComponent({ data }: RentLoadChartProps): JSX.Element {
  // Memoize chart data transformation
  const chartData = useMemo(() => {
    return data.map((item) => ({
      year: item.year,
      rentLoad: item.rentLoad,
    }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        role="img"
        aria-label="Rent load percentage chart showing rent as a percentage of revenue over time with color-coded thresholds"
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
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: colors.background.secondary,
            border: `1px solid ${colors.background.tertiary}`,
            borderRadius: '0.5rem',
            color: colors.text.primary,
          }}
          formatter={(value: number) => `${value.toFixed(2)}%`}
          labelFormatter={(year) => `Year: ${year}`}
        />
        <Legend
          wrapperStyle={{
            color: colors.text.primary,
            paddingTop: '20px',
          }}
        />
        <ReferenceLine
          y={30}
          stroke={chartColors.ebitda}
          strokeDasharray="3 3"
          label={{ value: '30% (Good)', position: 'insideTopRight' }}
        />
        <ReferenceLine
          y={40}
          stroke={colors.accent.yellow}
          strokeDasharray="3 3"
          label={{ value: '40% (Warning)', position: 'insideTopRight' }}
        />
        <Line
          type="monotone"
          dataKey="rentLoad"
          stroke={chartColors.rentLoad}
          strokeWidth={2}
          name="Rent Load %"
          dot={{ fill: chartColors.rentLoad, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Memoize component to prevent unnecessary re-renders
export const RentLoadChart = memo(RentLoadChartComponent, (prevProps, nextProps) => {
  return (
    prevProps.data.length === nextProps.data.length &&
    prevProps.data.every((item, idx) => {
      const nextItem = nextProps.data[idx];
      if (!nextItem) return false;
      return item.year === nextItem.year && item.rentLoad === nextItem.rentLoad;
    })
  );
});

RentLoadChart.displayName = 'RentLoadChart';

