/**
 * Enrollment Chart Component
 * Stacked bar chart showing FR vs IB enrollment over time
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
import { chartTheme } from '@/lib/charts/config';
import { colors } from '@/config/design-system';

interface EnrollmentChartProps {
  data: Array<{
    year: number;
    studentsFR?: number;
    studentsIB?: number;
  }>;
}

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
          label={{ value: 'Students', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: colors.background.secondary,
            border: `1px solid ${colors.background.tertiary}`,
            borderRadius: '0.5rem',
            color: colors.text.primary,
          }}
        />
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

