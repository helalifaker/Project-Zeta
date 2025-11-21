/**
 * Enrollment Chart Component
 * Stacked bar chart showing FR vs IB enrollment over time with enhanced tooltips
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
  TooltipProps,
} from 'recharts';
import { chartTheme } from '@/lib/charts/config';
import { colors } from '@/config/design-system';

interface EnrollmentChartProps {
  data: Array<{
    year: number;
    studentsFR?: number;
    studentsIB?: number;
  }>;
}

// Custom Tooltip Component with enhanced formatting
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return null;

  const frValue = (payload.find((p) => p.dataKey === 'FR')?.value as number) || 0;
  const ibValue = (payload.find((p) => p.dataKey === 'IB')?.value as number) || 0;
  const total = frValue + ibValue;

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
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.accent.blue }} />
            <span className="text-xs" style={{ color: colors.text.secondary }}>
              French (FR):
            </span>
          </div>
          <span className="text-xs font-semibold" style={{ color: colors.text.primary }}>
            {frValue.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors.accent.green }}
            />
            <span className="text-xs" style={{ color: colors.text.secondary }}>
              IB:
            </span>
          </div>
          <span className="text-xs font-semibold" style={{ color: colors.text.primary }}>
            {ibValue.toLocaleString()}
          </span>
        </div>
        <div className="pt-2 mt-2 border-t" style={{ borderColor: colors.background.tertiary }}>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-semibold" style={{ color: colors.text.secondary }}>
              Total Students:
            </span>
            <span className="text-xs font-semibold" style={{ color: colors.text.primary }}>
              {total.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 mt-1">
            <span className="text-xs" style={{ color: colors.text.secondary }}>
              FR Distribution:
            </span>
            <span className="text-xs" style={{ color: colors.text.secondary }}>
              {((frValue / total) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

function EnrollmentChartComponent({ data }: EnrollmentChartProps): JSX.Element {
  // Memoize chart data transformation
  const chartData = useMemo(() => {
    return data.map((item) => ({
      year: item.year,
      FR: item.studentsFR || 0,
      IB: item.studentsIB || 0,
      Total: (item.studentsFR || 0) + (item.studentsIB || 0),
    }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        role="img"
        aria-label="Enrollment chart showing French (FR) and IB student enrollment over time"
      >
        <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.3} />
        <XAxis dataKey="year" stroke={chartTheme.textColor} style={{ fontSize: '12px' }} />
        <YAxis
          stroke={chartTheme.textColor}
          style={{ fontSize: '12px' }}
          label={{ value: 'Students', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{
            color: colors.text.primary,
            paddingTop: '20px',
          }}
        />
        <Bar dataKey="FR" stackId="enrollment" fill={colors.accent.blue} name="French (FR)" />
        <Bar dataKey="IB" stackId="enrollment" fill={colors.accent.green} name="IB" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Memoize component to prevent unnecessary re-renders
export const EnrollmentChart = memo(EnrollmentChartComponent, (prevProps, nextProps) => {
  return (
    prevProps.data.length === nextProps.data.length &&
    prevProps.data.every((item, idx) => {
      const nextItem = nextProps.data[idx];
      if (!nextItem) return false;
      return (
        item.year === nextItem.year &&
        (item.studentsFR || 0) === (nextItem.studentsFR || 0) &&
        (item.studentsIB || 0) === (nextItem.studentsIB || 0)
      );
    })
  );
});

EnrollmentChart.displayName = 'EnrollmentChart';
