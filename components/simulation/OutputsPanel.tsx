/**
 * Outputs Panel Component
 * Center panel displaying KPI cards, charts, and year-by-year table
 */

'use client';

import { useMemo, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KPICard } from '@/components/dashboard/KPICard';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { EBITDATrendChart } from '@/components/charts/EBITDATrendChart';
import { RentLoadChart } from '@/components/charts/RentLoadChart';
import { EnrollmentChart } from '@/components/charts/EnrollmentChart';
import { CapexTimelineChart } from '@/components/charts/CapexTimelineChart';
import { OpexBreakdownChart } from '@/components/charts/OpexBreakdownChart';
import { CumulativeCashFlowChart } from '@/components/charts/CumulativeCashFlowChart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { FullProjectionResult } from '@/lib/calculations/financial/projection';
import type { VersionWithRelations } from '@/services/version';
import Decimal from 'decimal.js';

interface OutputsPanelProps {
  version: VersionWithRelations | null;
  projection: FullProjectionResult | null;
  loading?: boolean;
}

function formatCurrency(value: Decimal | number | string): string {
  const num = value instanceof Decimal ? value.toNumber() : typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0 SAR';
  
  if (Math.abs(num) >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B SAR`;
  }
  if (Math.abs(num) >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M SAR`;
  }
  if (Math.abs(num) >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K SAR`;
  }
  return `${num.toFixed(0)} SAR`;
}

function formatPercent(value: Decimal | number | string): string {
  const num = value instanceof Decimal ? value.toNumber() : typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0%';
  return `${num.toFixed(2)}%`;
}

function calculateBreakevenYear(years: FullProjectionResult['years']): number | null {
  let cumulativeCashFlow = new Decimal(0);
  
  for (const year of years) {
    cumulativeCashFlow = cumulativeCashFlow.plus(year.cashFlow);
    if (cumulativeCashFlow.isPositive()) {
      return year.year;
    }
  }
  
  return null;
}

function calculateCumulativeCashFlow(years: FullProjectionResult['years']): Array<{ year: number; cumulativeCashFlow: number }> {
  let cumulative = new Decimal(0);
  return years.map((year) => {
    cumulative = cumulative.plus(year.cashFlow);
    return {
      year: year.year,
      cumulativeCashFlow: cumulative.toNumber(),
    };
  });
}

function OutputsPanelComponent({ version, projection, loading }: OutputsPanelProps) {
  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!projection) return null;

    const breakevenYear = calculateBreakevenYear(projection.years);
    const totalCapex = projection.summary.totalCapex;
    const finalCashPosition = calculateCumulativeCashFlow(projection.years);
    const finalCash = finalCashPosition[finalCashPosition.length - 1]?.cumulativeCashFlow || 0;

    return {
      npvRent: projection.summary.npvRent,
      npvCashFlow: projection.summary.npvCashFlow,
      avgEBITDAMargin: projection.summary.avgEBITDAMargin,
      avgRentLoad: projection.summary.avgRentLoad,
      breakevenYear,
      totalRevenue: projection.summary.totalRevenue,
      totalRent: projection.summary.totalRent,
      totalCapex,
      finalCashPosition: new Decimal(finalCash),
    };
  }, [projection]);

  // Transform projection data for charts
  const chartData = useMemo(() => {
    if (!projection) return null;

    // Calculate cumulative cash flow
    const cumulativeCashFlow = calculateCumulativeCashFlow(projection.years);

    // Calculate opex breakdown (for pie chart)
    // This is a simplified calculation - in production, we'd track opex by sub-account
    const opexBreakdown = [
      { name: 'Opex', value: projection.summary.totalOpex.toNumber() },
    ];

    // Get capex items by year and category from version
    const capexByYear = projection.years.map((year) => {
      const capexItem = version?.capexItems.find((item) => item.year === year.year);
      return {
        year: year.year,
        amount: year.capex.toNumber(),
        category: capexItem?.category || 'Other',
      };
    }).filter((item) => item.amount > 0);

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
      enrollment: projection.years.map((year) => ({
        year: year.year,
        studentsFR: year.studentsFR || 0,
        studentsIB: year.studentsIB || 0,
      })),
      cashFlow: projection.years.map((year) => ({
        year: year.year,
        cashFlow: year.cashFlow.toNumber(),
      })),
      cumulativeCashFlow,
      capexTimeline: capexByYear,
      opexBreakdown,
    };
  }, [projection, version]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="p-12">
            <div className="h-96 bg-muted rounded-lg animate-pulse" />
          </Card>
        ))}
      </div>
    );
  }

  if (!chartData || !projection || !summaryMetrics) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          Edit parameters to see projections
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid (3x3) */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3">
        <KPICard
          title="NPV (Rent)"
          value={formatCurrency(summaryMetrics.npvRent)}
          description="2028-2052 period"
        />
        <KPICard
          title="NPV (Cash Flow)"
          value={formatCurrency(summaryMetrics.npvCashFlow)}
          description="2028-2052 period"
        />
        <KPICard
          title="Avg EBITDA Margin"
          value={formatPercent(summaryMetrics.avgEBITDAMargin)}
          description="30-year average"
        />
        <KPICard
          title="Avg Rent Load"
          value={formatPercent(summaryMetrics.avgRentLoad)}
          description="25-year average (2028-2052)"
        />
        <KPICard
          title="Breakeven Year"
          value={summaryMetrics.breakevenYear ? summaryMetrics.breakevenYear.toString() : 'N/A'}
          description="First positive cash flow"
        />
        <KPICard
          title="Total Revenue"
          value={formatCurrency(summaryMetrics.totalRevenue)}
          description="30-year sum"
        />
        <KPICard
          title="Total Rent"
          value={formatCurrency(summaryMetrics.totalRent)}
          description="30-year sum"
        />
        <KPICard
          title="Total Capex"
          value={formatCurrency(summaryMetrics.totalCapex)}
          description="30-year sum"
        />
        <KPICard
          title="Final Cash Position"
          value={formatCurrency(summaryMetrics.finalCashPosition)}
          description="End of 2052"
        />
      </div>

      {/* Charts (8+ charts) */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Rent</CardTitle>
            <CardDescription>30-year projection</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={chartData.revenueRent} showRent={true} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>EBITDA Trend</CardTitle>
            <CardDescription>Positive and negative periods</CardDescription>
          </CardHeader>
          <CardContent>
            <EBITDATrendChart data={chartData.ebitda} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cash Flow</CardTitle>
            <CardDescription>30-year cash flow projection</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={chartData.cashFlow.map(item => ({ year: item.year, revenue: item.cashFlow }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rent Load %</CardTitle>
            <CardDescription>Rent as percentage of revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <RentLoadChart data={chartData.rentLoad} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enrollment</CardTitle>
            <CardDescription>FR vs IB students over time</CardDescription>
          </CardHeader>
          <CardContent>
            <EnrollmentChart data={chartData.enrollment} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capex Timeline</CardTitle>
            <CardDescription>Capital expenditure by year and category</CardDescription>
          </CardHeader>
          <CardContent>
            <CapexTimelineChart data={chartData.capexTimeline} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Opex Breakdown</CardTitle>
            <CardDescription>Operating expenses distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <OpexBreakdownChart data={chartData.opexBreakdown} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cumulative Cash Flow</CardTitle>
            <CardDescription>30-year cumulative cash flow</CardDescription>
          </CardHeader>
          <CardContent>
            <CumulativeCashFlowChart data={chartData.cumulativeCashFlow} />
          </CardContent>
        </Card>
      </div>

      {/* Year-by-Year Table (Tabbed) */}
      <Card>
        <CardHeader>
          <CardTitle>Year-by-Year Projection</CardTitle>
          <CardDescription>30-year financial projection (2023-2052)</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="financial" className="w-full">
            <TabsList>
              <TabsTrigger value="financial">Financial Summary</TabsTrigger>
              <TabsTrigger value="curriculum">Curriculum Detail</TabsTrigger>
              <TabsTrigger value="rent">Rent Breakdown</TabsTrigger>
              <TabsTrigger value="capex">Capex Schedule</TabsTrigger>
            </TabsList>

            <TabsContent value="financial" className="mt-4">
              <FinancialSummaryTable projection={projection} />
            </TabsContent>

            <TabsContent value="curriculum" className="mt-4">
              <CurriculumDetailTable projection={projection} />
            </TabsContent>

            <TabsContent value="rent" className="mt-4">
              <RentBreakdownTable projection={projection} />
            </TabsContent>

            <TabsContent value="capex" className="mt-4">
              <CapexScheduleTable projection={projection} version={version} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Table Components
interface TableProps {
  projection: FullProjectionResult;
  version?: VersionWithRelations | null;
}

function FinancialSummaryTable({ projection }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Year</TableHead>
            <TableHead>Revenue</TableHead>
            <TableHead>Rent</TableHead>
            <TableHead>Rent Load %</TableHead>
            <TableHead>Staff Cost</TableHead>
            <TableHead>Opex</TableHead>
            <TableHead>Capex</TableHead>
            <TableHead>EBITDA</TableHead>
            <TableHead>EBITDA %</TableHead>
            <TableHead>Taxes</TableHead>
            <TableHead>Cash Flow</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projection.years.map((year) => (
            <TableRow key={year.year}>
              <TableCell className="font-medium">{year.year}</TableCell>
              <TableCell className="font-mono text-sm">
                {formatCurrency(year.revenue).replace(' SAR', '')}M
              </TableCell>
              <TableCell className="font-mono text-sm">
                {formatCurrency(year.rent).replace(' SAR', '')}M
              </TableCell>
              <TableCell className="text-sm">{year.rentLoad.toFixed(2)}%</TableCell>
              <TableCell className="font-mono text-sm">
                {formatCurrency(year.staffCost).replace(' SAR', '')}M
              </TableCell>
              <TableCell className="font-mono text-sm">
                {formatCurrency(year.opex).replace(' SAR', '')}M
              </TableCell>
              <TableCell className="font-mono text-sm">
                {formatCurrency(year.capex).replace(' SAR', '')}M
              </TableCell>
              <TableCell
                className={`font-mono text-sm ${year.ebitda.isNegative() ? 'text-red-400' : 'text-green-400'}`}
              >
                {formatCurrency(year.ebitda).replace(' SAR', '')}M
              </TableCell>
              <TableCell className="text-sm">{year.ebitdaMargin.toFixed(2)}%</TableCell>
              <TableCell className="font-mono text-sm">
                {formatCurrency(year.taxes).replace(' SAR', '')}M
              </TableCell>
              <TableCell
                className={`font-mono text-sm ${year.cashFlow.isNegative() ? 'text-red-400' : 'text-green-400'}`}
              >
                {formatCurrency(year.cashFlow).replace(' SAR', '')}M
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function CurriculumDetailTable({ projection }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Year</TableHead>
            <TableHead>Tuition (FR)</TableHead>
            <TableHead>Tuition (IB)</TableHead>
            <TableHead>Students (FR)</TableHead>
            <TableHead>Students (IB)</TableHead>
            <TableHead>Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projection.years.map((year) => (
            <TableRow key={year.year}>
              <TableCell className="font-medium">{year.year}</TableCell>
              <TableCell className="font-mono text-sm">
                {year.tuitionFR ? formatCurrency(year.tuitionFR).replace(' SAR', '') : 'N/A'}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {year.tuitionIB ? formatCurrency(year.tuitionIB).replace(' SAR', '') : 'N/A'}
              </TableCell>
              <TableCell>{year.studentsFR || 0}</TableCell>
              <TableCell>{year.studentsIB || 0}</TableCell>
              <TableCell className="font-mono text-sm">
                {formatCurrency(year.revenue).replace(' SAR', '')}M
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RentBreakdownTable({ projection }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Year</TableHead>
            <TableHead>Revenue</TableHead>
            <TableHead>Rent</TableHead>
            <TableHead>Rent Load %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projection.years.map((year: { year: number; revenue: Decimal; rent: Decimal; rentLoad: Decimal }) => (
            <TableRow key={year.year}>
              <TableCell className="font-medium">{year.year}</TableCell>
              <TableCell className="font-mono text-sm">
                {formatCurrency(year.revenue).replace(' SAR', '')}M
              </TableCell>
              <TableCell className="font-mono text-sm">
                {formatCurrency(year.rent).replace(' SAR', '')}M
              </TableCell>
              <TableCell className="text-sm">{year.rentLoad.toFixed(2)}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function CapexScheduleTable({ projection: _projection, version }: TableProps & { version?: VersionWithRelations | null }) {
  const capexItems = version?.capexItems || [];

  if (capexItems.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        No capex items scheduled
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Year</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount (SAR)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {capexItems.map((item, index) => (
            <TableRow key={`${item.year}-${index}`}>
              <TableCell className="font-medium">{item.year}</TableCell>
              <TableCell>{item.category || 'Other'}</TableCell>
              <TableCell className="font-mono text-sm">{formatCurrency(item.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
export const OutputsPanel = memo(OutputsPanelComponent, (prevProps, nextProps) => {
  return (
    prevProps.loading === nextProps.loading &&
    prevProps.version === nextProps.version &&
    prevProps.projection === nextProps.projection
  );
});

OutputsPanel.displayName = 'OutputsPanel';

