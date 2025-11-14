/**
 * Comparison Charts Component
 * Overlay line charts comparing multiple versions
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { VersionWithRelations } from '@/services/version';
import type { FullProjectionResult } from '@/lib/calculations/financial/projection';
import { useMemo, memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { chartTheme, formatChartCurrency } from '@/lib/charts/config';
import { colors } from '@/config/design-system';

interface ComparisonChartsProps {
  versions: VersionWithRelations[];
  projections: Map<string, FullProjectionResult>;
}

// Colors for different versions in comparison
const versionColors = [
  colors.chart.revenue, // Blue
  colors.chart.ebitda, // Green
  colors.accent.yellow, // Yellow
  colors.accent.orange, // Orange
];

function mergeChartData(
  versions: VersionWithRelations[],
  projections: Map<string, FullProjectionResult>,
  type: 'revenue' | 'rent' | 'ebitda' | 'rentLoad'
) {
  const allYears = new Set<number>();
  
  // Collect all years
  projections.forEach((proj) => {
    proj.years.forEach((year) => allYears.add(year.year));
  });

  const sortedYears = Array.from(allYears).sort((a, b) => a - b);

  // Create merged data
  return sortedYears.map((year) => {
    const dataPoint: Record<string, number> = { year };
    versions.forEach((version) => {
      const projection = projections.get(version.id);
      if (projection) {
        const yearData = projection.years.find((y) => y.year === year);
        if (yearData) {
          if (type === 'revenue') {
            dataPoint[version.name] = yearData.revenue.toNumber();
          } else if (type === 'rent') {
            dataPoint[version.name] = yearData.rent.toNumber();
          } else if (type === 'ebitda') {
            dataPoint[version.name] = yearData.ebitda.toNumber();
          } else if (type === 'rentLoad') {
            dataPoint[version.name] = yearData.rentLoad.toNumber();
          }
        }
      }
    });
    return dataPoint;
  });
}

function ComparisonChartsComponent({ versions, projections }: ComparisonChartsProps) {
  if (versions.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          Select versions to compare
        </CardContent>
      </Card>
    );
  }

  const revenueData = useMemo(
    () => mergeChartData(versions, projections, 'revenue'),
    [versions, projections]
  );
  const ebitdaData = useMemo(
    () => mergeChartData(versions, projections, 'ebitda'),
    [versions, projections]
  );
  const rentLoadData = useMemo(
    () => mergeChartData(versions, projections, 'rentLoad'),
    [versions, projections]
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Revenue Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Comparison</CardTitle>
          <CardDescription>30-year revenue projection</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={revenueData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              role="img"
              aria-label="Revenue comparison chart showing multiple versions' revenue projections over time"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.3} />
              <XAxis dataKey="year" stroke={chartTheme.textColor} style={{ fontSize: '12px' }} />
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
              {versions.map((version, idx) => (
                <Line
                  key={version.id}
                  type="monotone"
                  dataKey={version.name}
                  stroke={versionColors[idx % versionColors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* EBITDA Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>EBITDA Comparison</CardTitle>
          <CardDescription>30-year EBITDA trend</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={ebitdaData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              role="img"
              aria-label="EBITDA comparison chart showing multiple versions' EBITDA trends over time"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.3} />
              <XAxis dataKey="year" stroke={chartTheme.textColor} style={{ fontSize: '12px' }} />
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
              {versions.map((version, idx) => (
                <Line
                  key={version.id}
                  type="monotone"
                  dataKey={version.name}
                  stroke={versionColors[idx % versionColors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Rent Load % Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Rent Load % Comparison</CardTitle>
          <CardDescription>Rent as percentage of revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={rentLoadData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              role="img"
              aria-label="Rent load percentage comparison chart showing multiple versions' rent load percentages over time"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.3} />
              <XAxis dataKey="year" stroke={chartTheme.textColor} style={{ fontSize: '12px' }} />
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
              />
              <Legend
                wrapperStyle={{
                  color: colors.text.primary,
                  paddingTop: '20px',
                }}
              />
              {versions.map((version, idx) => (
                <Line
                  key={version.id}
                  type="monotone"
                  dataKey={version.name}
                  stroke={versionColors[idx % versionColors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
export const ComparisonCharts = memo(ComparisonChartsComponent, (prevProps, nextProps) => {
  return (
    prevProps.versions.length === nextProps.versions.length &&
    prevProps.versions.every((v, idx) => v.id === nextProps.versions[idx]?.id) &&
    prevProps.projections.size === nextProps.projections.size
  );
});

ComparisonCharts.displayName = 'ComparisonCharts';

