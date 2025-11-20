/**
 * Cost Breakdown Component
 * Displays pie chart and table showing all cost categories (Rent, Staff, Opex)
 * Note: CAPEX is excluded from cost breakdown (it's a capital investment, not an operating cost)
 * Read-only visualization component for Costs Analysis tab
 *
 * @component
 * @example
 * ```tsx
 * <CostBreakdown
 *   version={version}
 *   adminSettings={adminSettings}
 * />
 * ```
 */

'use client';

import { useMemo } from 'react';
import Decimal from 'decimal.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateFullProjection, type FullProjectionParams } from '@/lib/calculations/financial/projection';
import { calculateStaffCostBaseFromCurriculum } from '@/lib/calculations/financial/staff-costs';
import type { VersionWithRelations } from '@/services/version/create';
import type { AdminSettings } from '@/lib/calculations/financial/projection';
import { toDecimal } from '@/lib/calculations/decimal-helpers';

/**
 * Constants
 */
const PERFORMANCE_TARGET_MS = 50; // Target: <50ms for calculations

/**
 * Props for CostBreakdown component
 */
interface CostBreakdownProps {
  /** Version data with all relationships (curriculum plans, rent plan, capex, opex) */
  version: VersionWithRelations;
  /** Admin settings (CPI rate, discount rate, tax rate) */
  adminSettings: AdminSettings | null;
  /** Start year for calculations (default: 2023) */
  startYear?: number;
  /** End year for calculations (default: 2052) */
  endYear?: number;
}

/**
 * Format number as SAR currency
 */
function formatSAR(value: Decimal | number): string {
  const num = typeof value === 'number' ? value : value.toNumber();
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format percentage
 */
function formatPercent(value: Decimal | number): string {
  const num = typeof value === 'number' ? value : value.toNumber();
  return `${num.toFixed(2)}%`;
}

/**
 * Chart colors for cost categories (from design system)
 */
const CHART_COLORS = {
  rent: '#8B5CF6', // Purple (matches chart.rent)
  staff: '#3B82F6', // Blue (matches chart.revenue)
  opex: '#10B981', // Green (matches chart.ebitda)
  capex: '#F97316', // Orange (matches chart.rentLoad)
};

export function CostBreakdown({
  version,
  adminSettings,
  startYear = 2023,
  endYear = 2052,
}: CostBreakdownProps) {
  // Calculate staff cost base from curriculum plans
  const staffCostBaseResult = useMemo(() => {
    if (!version.curriculumPlans || version.curriculumPlans.length === 0) {
      return null;
    }

    const calcStart = performance.now();
    try {
      const curriculumPlansForCalc = version.curriculumPlans.map((plan) => ({
        curriculumType: plan.curriculumType as 'FR' | 'IB',
        studentsProjection: (plan.studentsProjection as Array<{ year: number; students: number }>) || [],
        teacherRatio: plan.teacherRatio ? toDecimal(plan.teacherRatio) : null,
        nonTeacherRatio: plan.nonTeacherRatio ? toDecimal(plan.nonTeacherRatio) : null,
        teacherMonthlySalary: plan.teacherMonthlySalary ? toDecimal(plan.teacherMonthlySalary) : null,
        nonTeacherMonthlySalary: plan.nonTeacherMonthlySalary
          ? toDecimal(plan.nonTeacherMonthlySalary)
          : null,
      }));

      const result = calculateStaffCostBaseFromCurriculum(curriculumPlansForCalc, 2028);
      const calcDuration = performance.now() - calcStart;
      if (calcDuration > PERFORMANCE_TARGET_MS) {
        console.warn(`⚠️ Staff cost base calculation took ${calcDuration.toFixed(2)}ms (target: <${PERFORMANCE_TARGET_MS}ms)`);
      }
      return result;
    } catch (error) {
      console.error('Error calculating staff cost base:', error);
      return null;
    }
  }, [version.curriculumPlans]);

  // Calculate full projection
  const projection = useMemo(() => {
    if (!version || !adminSettings || !staffCostBaseResult || !staffCostBaseResult.success) {
      return null;
    }

    const calcStart = performance.now();
    try {
      // Build curriculum plans input
      const curriculumPlans = version.curriculumPlans.map((plan) => ({
        curriculumType: plan.curriculumType as 'FR' | 'IB',
        capacity: plan.capacity,
        tuitionBase: toDecimal(plan.tuitionBase),
        cpiFrequency: plan.cpiFrequency as 1 | 2 | 3,
        studentsProjection: (plan.studentsProjection as Array<{ year: number; students: number }>) || [],
      }));

      // Build rent plan input
      if (!version.rentPlan) {
        return null;
      }

      const rentPlan = {
        rentModel: version.rentPlan.rentModel as 'FIXED_ESCALATION' | 'REVENUE_SHARE' | 'PARTNER_MODEL',
        parameters: version.rentPlan.parameters as Record<string, unknown>,
      };

      // Build capex items input
      const capexItems = version.capexItems.map((item) => ({
        year: item.year,
        amount: toDecimal(item.amount),
      }));

      // Build opex sub accounts input
      // Note: percentOfRevenue is stored as a percentage (e.g., 6 for 6%, 42 for 42%), but calculation expects decimal (0.06, 0.42)
      const opexSubAccounts = version.opexSubAccounts.map((account) => {
        const percentDecimal = account.percentOfRevenue 
          ? toDecimal(account.percentOfRevenue).div(100) // Convert percentage to decimal (6% -> 0.06, 42% -> 0.42)
          : null;
        
        // Debug: Log the conversion to verify it's correct
        if (account.percentOfRevenue && !account.isFixed) {
          console.log(`Opex Sub-Account "${account.subAccountName}": ${account.percentOfRevenue}% -> ${percentDecimal?.toNumber()}`);
        }
        
        return {
          subAccountName: account.subAccountName,
          percentOfRevenue: percentDecimal,
          isFixed: account.isFixed,
          fixedAmount: account.fixedAmount ? toDecimal(account.fixedAmount) : null,
        };
      });

      // Determine staff cost CPI frequency (default to 2 if not specified)
      // This should ideally come from admin settings or curriculum plan
      const staffCostCpiFrequency: 1 | 2 | 3 = 2;

      const params: FullProjectionParams = {
        curriculumPlans,
        rentPlan,
        staffCostBase: staffCostBaseResult.data,
        staffCostCpiFrequency,
        capexItems,
        opexSubAccounts,
        adminSettings,
        startYear,
        endYear,
      };

      // ⚠️ TODO (Fix 1): calculateFullProjection is now async - convert this useMemo to useEffect + useState
      // For now, this will cause a TypeScript error because useMemo can't await async functions
      // TODO: Convert to useEffect + useState pattern (see FinancialStatementsWrapper.tsx for example)
      // TODO: Add otherRevenueByYear parameter when converting to async pattern
      // @ts-expect-error - useMemo cannot await async functions, will be fixed in future update
      const result = calculateFullProjection(params);
      const calcDuration = performance.now() - calcStart;
      if (calcDuration > PERFORMANCE_TARGET_MS) {
        console.warn(`⚠️ Full projection calculation took ${calcDuration.toFixed(2)}ms (target: <${PERFORMANCE_TARGET_MS}ms)`);
      } else {
        console.log(`✅ Full projection calculated in ${calcDuration.toFixed(2)}ms (target: <${PERFORMANCE_TARGET_MS}ms)`);
      }
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error calculating full projection:', error);
      return null;
    }
  }, [version, adminSettings, staffCostBaseResult, startYear, endYear]);

  // Prepare pie chart data (aggregate costs across all years)
  const pieChartData = useMemo(() => {
    if (!projection) {
      return [];
    }

    // Calculate totals excluding CAPEX (CAPEX is capital investment, not operating cost)
    const totals = projection.years.reduce(
      (acc, year) => ({
        rent: acc.rent.plus(year.rent),
        staff: acc.staff.plus(year.staffCost),
        opex: acc.opex.plus(year.opex),
        // CAPEX excluded from cost breakdown
      }),
      {
        rent: new Decimal(0),
        staff: new Decimal(0),
        opex: new Decimal(0),
      }
    );

    // Total excludes CAPEX
    const total = totals.rent.plus(totals.staff).plus(totals.opex);

    return [
      {
        name: 'Rent',
        value: totals.rent.toNumber(),
        percentage: total.isZero() ? 0 : totals.rent.div(total).times(100).toNumber(),
        color: CHART_COLORS.rent,
      },
      {
        name: 'Staff',
        value: totals.staff.toNumber(),
        percentage: total.isZero() ? 0 : totals.staff.div(total).times(100).toNumber(),
        color: CHART_COLORS.staff,
      },
      {
        name: 'Opex',
        value: totals.opex.toNumber(),
        percentage: total.isZero() ? 0 : totals.opex.div(total).times(100).toNumber(),
        color: CHART_COLORS.opex,
      },
      // CAPEX excluded from pie chart
    ].filter((item) => item.value > 0); // Only show non-zero categories
  }, [projection]);

  // Prepare table data
  const tableData = useMemo(() => {
    if (!projection) {
      return [];
    }

    return projection.years.map((year, index) => {
      const prevYear = index > 0 ? projection.years[index - 1] : null;
      // Total cost excludes CAPEX (CAPEX is capital investment, not operating cost)
      const totalCost = year.rent.plus(year.staffCost).plus(year.opex);
      const prevTotalCost = prevYear
        ? prevYear.rent.plus(prevYear.staffCost).plus(prevYear.opex)
        : new Decimal(0);

      // Calculate total students for cost per student
      const totalStudents =
        (year.studentsFR || 0) + (year.studentsIB || 0);
      const costPerStudent = totalStudents > 0 ? totalCost.div(totalStudents) : new Decimal(0);

      // Calculate YoY change
      const yoyChange = prevTotalCost.isZero()
        ? new Decimal(0)
        : totalCost.minus(prevTotalCost).div(prevTotalCost).times(100);

      return {
        year: year.year,
        rent: year.rent,
        staff: year.staffCost,
        opex: year.opex,
        // CAPEX excluded from table data
        total: totalCost,
        costPerStudent,
        yoyChange,
        students: totalStudents,
      };
    });
  }, [projection]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!projection || !tableData || tableData.length === 0) {
      return null;
    }

    const totalCosts = tableData.reduce((sum, row) => sum.plus(row.total), new Decimal(0));
    const totalStudents = tableData.reduce((sum, row) => sum + row.students, 0);
    
    // Calculate average cost per student: average the yearly cost-per-student values
    // (not dividing total costs by total students, which would be incorrect)
    const avgCostPerStudent = tableData.length > 0
      ? tableData.reduce((sum, row) => sum.plus(row.costPerStudent), new Decimal(0)).div(tableData.length)
      : new Decimal(0);

    // Calculate cost breakdown percentages (excluding CAPEX)
    const totals = pieChartData.reduce(
      (acc, item) => ({
        rent: item.name === 'Rent' ? acc.rent + item.value : acc.rent,
        staff: item.name === 'Staff' ? acc.staff + item.value : acc.staff,
        opex: item.name === 'Opex' ? acc.opex + item.value : acc.opex,
        // CAPEX excluded from breakdown
      }),
      { rent: 0, staff: 0, opex: 0 }
    );

    const totalValue = totals.rent + totals.staff + totals.opex;

    return {
      totalCosts,
      avgCostPerStudent,
      breakdown: {
        rent: totalValue > 0 ? (totals.rent / totalValue) * 100 : 0,
        staff: totalValue > 0 ? (totals.staff / totalValue) * 100 : 0,
        opex: totalValue > 0 ? (totals.opex / totalValue) * 100 : 0,
        // CAPEX excluded from breakdown
      },
    };
  }, [projection, tableData, pieChartData]);

  // Handle missing data
  if (!adminSettings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
          <CardDescription>Complete cost analysis across all categories</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading admin settings...</p>
        </CardContent>
      </Card>
    );
  }

  if (!staffCostBaseResult || !staffCostBaseResult.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
          <CardDescription>Complete cost analysis across all categories</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {staffCostBaseResult?.error ||
              'Unable to calculate staff costs. Please configure teacher ratios and salaries in Curriculum tab.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!projection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
          <CardDescription>Complete cost analysis across all categories</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Calculating cost breakdown...</p>
        </CardContent>
      </Card>
    );
  }

  if (pieChartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
          <CardDescription>Complete cost analysis across all categories</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No cost data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Breakdown</CardTitle>
        <CardDescription>Complete cost analysis across all categories (Rent, Staff, Opex)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Metrics */}
        {summaryMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Costs (30-year)</p>
              <p className="text-lg font-semibold">{formatSAR(summaryMetrics.totalCosts)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg Cost per Student</p>
              <p className="text-lg font-semibold">{formatSAR(summaryMetrics.avgCostPerStudent)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Cost Breakdown</p>
              <div className="text-sm space-y-1">
                <div>Rent: {formatPercent(summaryMetrics.breakdown.rent)}</div>
                <div>Staff: {formatPercent(summaryMetrics.breakdown.staff)}</div>
                <div>Opex: {formatPercent(summaryMetrics.breakdown.opex)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Pie Chart */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Cost Distribution</h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart role="img" aria-label="Cost distribution pie chart showing Rent, Staff, and Opex">
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string, props: { payload?: { percentage?: number } }) => [
                  `${formatSAR(value)} (${props.payload?.percentage?.toFixed(1) ?? '0.0'}%)`,
                  name,
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Table */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Year-by-Year Cost Breakdown</h3>
          <div className="rounded-md border overflow-x-auto">
            <Table role="table" aria-label="Year-by-year cost breakdown">
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-right">Rent (SAR)</TableHead>
                  <TableHead className="text-right">Staff (SAR)</TableHead>
                  <TableHead className="text-right">Opex (SAR)</TableHead>
                  <TableHead className="text-right">Total (SAR)</TableHead>
                  <TableHead className="text-right">Cost/Student (SAR)</TableHead>
                  <TableHead className="text-right">YoY Change (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row) => (
                  <TableRow key={row.year}>
                    <TableCell className="font-medium">{row.year}</TableCell>
                    <TableCell className="text-right">{formatSAR(row.rent)}</TableCell>
                    <TableCell className="text-right">{formatSAR(row.staff)}</TableCell>
                    <TableCell className="text-right">{formatSAR(row.opex)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatSAR(row.total)}</TableCell>
                    <TableCell className="text-right">{formatSAR(row.costPerStudent)}</TableCell>
                    <TableCell className="text-right">
                      {row.year === startYear ? '—' : formatPercent(row.yoyChange)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

