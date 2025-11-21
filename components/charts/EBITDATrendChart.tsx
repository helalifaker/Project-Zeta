/**
 * EBITDA Trend Chart Component
 * Area chart showing EBITDA over time with positive/negative highlighting and enhanced tooltips
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
  TooltipProps,
} from 'recharts';
import { chartColors, chartTheme, formatChartCurrency } from '@/lib/charts/config';
import { colors } from '@/config/design-system';

interface EBITDATrendChartProps {
  data: Array<{
    year: number;
    ebitda: number;
  }>;
}

// Custom Tooltip Component with enhanced formatting
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return null;

  // Get EBITDA value (could be in positive or negative field)
  const ebitdaValue =
    (payload.find((p) => p.dataKey === 'positive' || p.dataKey === 'negative')?.value as number) ||
    0;
  const isPositive = ebitdaValue >= 0;

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
              style={{ backgroundColor: isPositive ? chartColors.ebitda : colors.accent.red }}
            />
            <span className="text-xs" style={{ color: colors.text.secondary }}>
              EBITDA:
            </span>
          </div>
          <span
            className="text-xs font-semibold"
            style={{ color: isPositive ? colors.accent.green : colors.accent.red }}
          >
            {formatChartCurrency(ebitdaValue)}
          </span>
        </div>
        <div className="pt-2 mt-2 border-t" style={{ borderColor: colors.background.tertiary }}>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs" style={{ color: colors.text.secondary }}>
              Status:
            </span>
            <span
              className="text-xs font-semibold"
              style={{ color: isPositive ? colors.accent.green : colors.accent.red }}
            >
              {isPositive ? 'Profitable' : 'Loss'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

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
        <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.3} />
        <XAxis dataKey="year" stroke={chartTheme.textColor} style={{ fontSize: '12px' }} />
        <YAxis
          stroke={chartTheme.textColor}
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => formatChartCurrency(value)}
        />
        <Tooltip content={<CustomTooltip />} />
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
          strokeWidth={2.5}
          fill="url(#colorPositive)"
          name="Positive EBITDA"
        />
        <Area
          type="monotone"
          dataKey="negative"
          stroke={colors.accent.red}
          strokeWidth={2.5}
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
