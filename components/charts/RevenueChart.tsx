/**
 * Revenue Chart Component
 * Enhanced area chart with gradients and improved tooltips
 */

'use client';

import { memo } from 'react';
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

// Custom Tooltip Component with enhanced formatting
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return null;

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
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-xs" style={{ color: colors.text.secondary }}>
                {entry.name}:
              </span>
            </div>
            <span className="text-xs font-semibold" style={{ color: colors.text.primary }}>
              {formatChartCurrency(entry.value as number)}
            </span>
          </div>
        ))}
        {payload.length === 2 && payload[0] && payload[1] && (
          <div className="pt-2 mt-2 border-t" style={{ borderColor: colors.background.tertiary }}>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs" style={{ color: colors.text.secondary }}>
                Rent Load:
              </span>
              <span className="text-xs font-semibold" style={{ color: colors.text.primary }}>
                {(((payload[1].value as number) / (payload[0].value as number)) * 100 || 0).toFixed(
                  1
                )}
                %
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function RevenueChartComponent({
  data,
  showRent = false,
  showEbitda = false,
}: RevenueChartProps): JSX.Element {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        role="img"
        aria-label="Revenue chart showing revenue, rent, and EBITDA trends over time"
      >
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartColors.revenue} stopOpacity={0.8} />
            <stop offset="95%" stopColor={chartColors.revenue} stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="colorRent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartColors.rent} stopOpacity={0.8} />
            <stop offset="95%" stopColor={chartColors.rent} stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="colorEbitda" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartColors.ebitda} stopOpacity={0.8} />
            <stop offset="95%" stopColor={chartColors.ebitda} stopOpacity={0.1} />
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
          dataKey="revenue"
          stroke={chartColors.revenue}
          strokeWidth={2.5}
          fill="url(#colorRevenue)"
          name="Revenue"
          activeDot={{ r: 6 }}
        />
        {showRent && (
          <Area
            type="monotone"
            dataKey="rent"
            stroke={chartColors.rent}
            strokeWidth={2.5}
            fill="url(#colorRent)"
            name="Rent"
            activeDot={{ r: 6 }}
          />
        )}
        {showEbitda && (
          <Area
            type="monotone"
            dataKey="ebitda"
            stroke={chartColors.ebitda}
            strokeWidth={2.5}
            fill="url(#colorEbitda)"
            name="EBITDA"
            activeDot={{ r: 6 }}
          />
        )}
      </AreaChart>
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
