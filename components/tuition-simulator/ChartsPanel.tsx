/**
 * Charts Panel Component
 * Center panel displaying charts and year-by-year table
 */

'use client';

import { useMemo, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { EBITDATrendChart } from '@/components/charts/EBITDATrendChart';
import { RentLoadChart } from '@/components/charts/RentLoadChart';
import { UtilizationIndicator } from './UtilizationIndicator';
import type { FullProjectionResult } from '@/lib/calculations/financial/projection';
import type { VersionWithRelations } from '@/services/version';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Decimal from 'decimal.js';

interface ChartsPanelProps {
  version: VersionWithRelations | null;
  projection: FullProjectionResult | null;
  loading?: boolean;
}

function formatCurrency(value: Decimal | number | string): string {
  const num = value instanceof Decimal ? value.toNumber() : typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0 SAR';
  
  if (Math.abs(num) >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (Math.abs(num) >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(num) >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  return `${num.toFixed(0)}`;
}

function ChartsPanelComponent({ version, projection, loading }: ChartsPanelProps) {
  // Memoize capacities
  const capacities = useMemo(() => {
    return version
      ? {
          fr: version.curriculumPlans.find((cp) => cp.curriculumType === 'FR')?.capacity || 0,
          ib: version.curriculumPlans.find((cp) => cp.curriculumType === 'IB')?.capacity || 0,
        }
      : { fr: 0, ib: 0 };
  }, [version]);

  // Memoize chart data transformation
  const chartData = useMemo(() => {
    if (!projection) return null;

    return {
      revenueRent: projection.years.map((year) => ({
        year: year.year,
        revenue: year.revenue.toNumber(),
        rent: year.rent.toNumber(),
      })),
      ebitda: projection.years.map((year) => ({
        year: year.year,
        ebitda: year.ebitda.toNumber(),
      })),
      rentLoad: projection.years.map((year) => ({
        year: year.year,
        rentLoad: year.rentLoad.toNumber(),
      })),
    };
  }, [projection]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-12">
            <div className="h-96 bg-muted rounded-lg animate-pulse" />
          </Card>
        ))}
      </div>
    );
  }

  if (!chartData || !projection) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          Adjust tuition and enrollment to see projections
        </CardContent>
      </Card>
    );
  }

  // Memoize ramp-up years filter
  const rampUpYears = useMemo(() => {
    if (!projection) return [];
    return projection.years.filter((y) => y.year >= 2028 && y.year <= 2032);
  }, [projection]);

  return (
    <div className="space-y-6">
      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-1">
        {/* Revenue vs Rent Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Rent</CardTitle>
            <CardDescription>30-year projection</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={chartData.revenueRent} showRent={true} />
          </CardContent>
        </Card>

        {/* EBITDA Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>EBITDA Trend</CardTitle>
            <CardDescription>Positive and negative periods</CardDescription>
          </CardHeader>
          <CardContent>
            <EBITDATrendChart data={chartData.ebitda} />
          </CardContent>
        </Card>

        {/* Rent Load % Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Rent Load %</CardTitle>
            <CardDescription>Rent as percentage of revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <RentLoadChart data={chartData.rentLoad} />
          </CardContent>
        </Card>
      </div>

      {/* Year-by-Year Table (Ramp-Up Period) */}
      <Card>
        <CardHeader>
          <CardTitle>Year-by-Year Projection</CardTitle>
          <CardDescription>Ramp-up period (2028-2032) - Utilization % highlighted</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>Tuition (FR)</TableHead>
                  <TableHead>Tuition (IB)</TableHead>
                  <TableHead>Students (FR)</TableHead>
                  <TableHead>Students (IB)</TableHead>
                  <TableHead>Util. (FR)</TableHead>
                  <TableHead>Util. (IB)</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>EBITDA</TableHead>
                  <TableHead>Rent Load %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rampUpYears.map((year) => {
                  return (
                    <TableRow key={year.year}>
                      <TableCell className="font-medium">{year.year}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {year.tuitionFR ? formatCurrency(year.tuitionFR) : 'N/A'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {year.tuitionIB ? formatCurrency(year.tuitionIB) : 'N/A'}
                      </TableCell>
                      <TableCell>{year.studentsFR || 0}</TableCell>
                      <TableCell>{year.studentsIB || 0}</TableCell>
                      <TableCell>
                        <UtilizationIndicator
                          students={year.studentsFR || 0}
                          capacity={capacities.fr}
                          year={year.year}
                          highlightRampUp={true}
                        />
                      </TableCell>
                      <TableCell>
                        <UtilizationIndicator
                          students={year.studentsIB || 0}
                          capacity={capacities.ib}
                          year={year.year}
                          highlightRampUp={true}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatCurrency(year.revenue)}M
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatCurrency(year.rent)}M
                      </TableCell>
                      <TableCell
                        className={`font-mono text-sm ${year.ebitda.isNegative() ? 'text-red-400' : 'text-green-400'}`}
                      >
                        {formatCurrency(year.ebitda)}M
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {year.rentLoad.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
export const ChartsPanel = memo(ChartsPanelComponent, (prevProps: ChartsPanelProps, nextProps: ChartsPanelProps) => {
  return (
    prevProps.loading === nextProps.loading &&
    prevProps.version === nextProps.version &&
    prevProps.projection === nextProps.projection
  );
});

ChartsPanel.displayName = 'ChartsPanel';

