/**
 * Rent Load Chart Component
 * Area chart showing Rent Load % with gradients, color-coded thresholds, and enhanced tooltips
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
  ReferenceLine,
  TooltipProps,
} from 'recharts';
import { chartColors, chartTheme } from '@/lib/charts/config';
import { colors } from '@/config/design-system';

interface RentLoadChartProps {
  data: Array<{
    year: number;
    rentLoad: number;
  }>;
}

// Custom Tooltip Component with enhanced formatting
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return null;

  const rentLoadValue = (payload[0]?.value as number) || 0;

  // Determine status based on thresholds
  let status = '';
  let statusColor = colors.text.primary;

  if (rentLoadValue <= 30) {
    status = 'Excellent';
    statusColor = colors.accent.green;
  } else if (rentLoadValue <= 40) {
    status = 'Good';
    statusColor = colors.accent.blue;
  } else if (rentLoadValue <= 50) {
    status = 'Warning';
    statusColor = colors.accent.yellow;
  } else {
    status = 'Critical';
    statusColor = colors.accent.red;
  }

  return (
    <div
      className="rounded-lg border bg-card p-3 shadow-lg"
      style={{
        backgroundColor: colors.background.secondary,
        borderColor: colors.background.tertiary,
      }}
    >
      <p className="text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
        Year {label}
      </p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: chartColors.rentLoad }}
            />
            <span className="text-xs" style={{ color: colors.text.secondary }}>
              Rent Load:
            </span>
          </div>
          <span className="text-xs font-semibold" style={{ color: colors.text.primary }}>
            {rentLoadValue.toFixed(2)}%
          </span>
        </div>
        <div className="pt-2 mt-2 border-t" style={{ borderColor: colors.background.tertiary }}>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs" style={{ color: colors.text.secondary }}>
              Status:
            </span>
            <span className="text-xs font-semibold" style={{ color: statusColor }}>
              {status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

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
      <AreaChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        role="img"
        aria-label="Rent load percentage chart showing rent as a percentage of revenue over time with color-coded thresholds"
      >
        <defs>
          <linearGradient id="colorRentLoad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartColors.rentLoad} stopOpacity={0.8} />
            <stop offset="95%" stopColor={chartColors.rentLoad} stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.3} />
        <XAxis dataKey="year" stroke={chartTheme.textColor} style={{ fontSize: '12px' }} />
        <YAxis
          stroke={chartTheme.textColor}
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip content={<CustomTooltip />} />
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
          label={{
            value: '30% (Good)',
            position: 'insideTopRight',
            fill: colors.text.secondary,
            fontSize: 11,
          }}
        />
        <ReferenceLine
          y={40}
          stroke={colors.accent.yellow}
          strokeDasharray="3 3"
          label={{
            value: '40% (Warning)',
            position: 'insideTopRight',
            fill: colors.text.secondary,
            fontSize: 11,
          }}
        />
        <Area
          type="monotone"
          dataKey="rentLoad"
          stroke={chartColors.rentLoad}
          strokeWidth={2.5}
          fill="url(#colorRentLoad)"
          name="Rent Load %"
          activeDot={{ r: 6 }}
        />
      </AreaChart>
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
