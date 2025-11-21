/**
 * P&L (Profit & Loss) Statement Component
 *
 * Displays 30-year Income Statement with:
 * - Revenue (by curriculum + other revenue)
 * - Operating costs (staff, rent, opex, depreciation)
 * - Interest expense (calculated from debt)
 * - Interest income (calculated from cash)
 * - Zakat (2.5% on profit - Saudi Arabian law)
 * - Net Result
 *
 * Formula: Net Result = EBITDA - Depreciation - Interest Expense + Interest Income - Zakat
 *
 * Reference: FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md (lines 1769-1789)
 */

'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { YearlyProjection } from '@/lib/calculations/financial/projection';
import Decimal from 'decimal.js';

export interface PnLStatementProps {
  projection: YearlyProjection[];
  historicalData?: any[]; // Historical actuals for 2023-2024
}

/**
 * Format currency in SAR with commas
 */
function formatCurrency(value: Decimal | number | string): string {
  let num: number;
  if (typeof value === 'string') {
    num = parseFloat(value);
  } else if (typeof value === 'number') {
    num = value;
  } else {
    num = value.toNumber();
  }

  if (isNaN(num)) num = 0;

  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Helper to get value as Decimal (handles both Decimal and string from DB)
 */
function toDecimal(value: any): Decimal {
  if (value instanceof Decimal) return value;
  if (typeof value === 'string') return new Decimal(value || 0);
  if (typeof value === 'number') return new Decimal(value);
  return new Decimal(0);
}

/**
 * Format currency in SAR with commas (original signature kept for compatibility)
 */
function formatCurrencyLegacy(value: Decimal | number): string {
  const num = typeof value === 'number' ? value : value.toNumber();
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format percentage with 1 decimal place
 */
function formatPercent(value: Decimal | number): string {
  const num = typeof value === 'number' ? value : value.toNumber();
  return `${(num * 100).toFixed(1)}%`;
}

/**
 * P&L Statement Component
 *
 * @example
 * <PnLStatement projection={projectionData} historicalData={historicalActuals} />
 */
export function PnLStatement(props: PnLStatementProps): JSX.Element {
  const { projection, historicalData = [] } = props;

  // Create a map of historical data by year for quick lookup
  const historicalMap = useMemo(() => {
    const map = new Map<number, any>();
    historicalData.forEach((h) => {
      map.set(h.year, h);
    });
    return map;
  }, [historicalData]);

  // Calculate totals with defensive null checks
  const totals = useMemo(() => {
    const total = projection.reduce(
      (acc, year) => {
        // Defensive checks: ensure all fields are defined before using them
        const revenue = year.revenue ?? new Decimal(0);
        const staffCosts = year.staffCosts ?? year.staffCost ?? new Decimal(0); // Try staffCosts first, fallback to staffCost
        const ebitda = year.ebitda ?? new Decimal(0);
        const depreciation = year.depreciation ?? new Decimal(0);
        const interestExpense = year.interestExpense ?? new Decimal(0);
        const interestIncome = year.interestIncome ?? new Decimal(0);
        const zakat = year.zakat ?? new Decimal(0);
        const netResult = year.netResult ?? new Decimal(0);

        return {
          revenue: acc.revenue.plus(revenue),
          staffCosts: acc.staffCosts.plus(staffCosts),
          ebitda: acc.ebitda.plus(ebitda),
          depreciation: acc.depreciation.plus(depreciation),
          interestExpense: acc.interestExpense.plus(interestExpense),
          interestIncome: acc.interestIncome.plus(interestIncome),
          zakat: acc.zakat.plus(zakat),
          netResult: acc.netResult.plus(netResult),
        };
      },
      {
        revenue: new Decimal(0),
        staffCosts: new Decimal(0),
        ebitda: new Decimal(0),
        depreciation: new Decimal(0),
        interestExpense: new Decimal(0),
        interestIncome: new Decimal(0),
        zakat: new Decimal(0),
        netResult: new Decimal(0),
      }
    );

    return {
      ...total,
      ebitdaMargin: total.revenue.isZero() ? new Decimal(0) : total.ebitda.div(total.revenue),
      netMargin: total.revenue.isZero() ? new Decimal(0) : total.netResult.div(total.revenue),
    };
  }, [projection]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profit & Loss Statement</CardTitle>
        <CardDescription>
          30-year income statement (2023-2052) with automatic interest and Zakat calculations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] sticky left-0 bg-background-secondary z-10">
                  Year
                </TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Staff Costs</TableHead>
                <TableHead className="text-right">EBITDA</TableHead>
                <TableHead className="text-right">EBITDA %</TableHead>
                <TableHead className="text-right">Depreciation</TableHead>
                <TableHead className="text-right">Interest Expense</TableHead>
                <TableHead className="text-right">Interest Income</TableHead>
                <TableHead className="text-right">Zakat (2.5%)</TableHead>
                <TableHead className="text-right font-semibold">Net Result</TableHead>
                <TableHead className="text-right">Net %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projection.map((year) => {
                // Check if we have historical data for this year (2023 or 2024)
                const historical = historicalMap.get(year.year);

                // Use historical data if available, otherwise use projection (with defensive null checks)
                const revenue = historical
                  ? toDecimal(historical.totalRevenues)
                  : (year.revenue ?? new Decimal(0));
                const staffCosts = historical
                  ? toDecimal(historical.salariesAndRelatedCosts)
                  : (year.staffCosts ?? year.staffCost ?? new Decimal(0)); // Try staffCosts first, fallback to staffCost
                const depreciation = historical
                  ? toDecimal(historical.depreciationAmortization)
                  : (year.depreciation ?? new Decimal(0));
                const interestExpense = historical
                  ? toDecimal(historical.interestExpenses)
                  : (year.interestExpense ?? new Decimal(0));
                const interestIncome = historical
                  ? toDecimal(historical.interestIncome)
                  : (year.interestIncome ?? new Decimal(0));
                const netResult = historical
                  ? toDecimal(historical.netResult)
                  : (year.netResult ?? new Decimal(0));

                // Calculate EBITDA and zakat based on source (with defensive null checks)
                const ebitda = historical
                  ? netResult.plus(depreciation).plus(interestExpense).minus(interestIncome)
                  : (year.ebitda ?? new Decimal(0));
                const zakat = historical ? new Decimal(0) : (year.zakat ?? new Decimal(0)); // Zakat not calculated for historical years

                const ebitdaMargin = revenue.isZero() ? new Decimal(0) : ebitda.div(revenue);
                const netMargin = revenue.isZero() ? new Decimal(0) : netResult.div(revenue);
                const isNegative = netResult.isNegative();
                const isHistorical = historical !== undefined;

                return (
                  <TableRow
                    key={year.year}
                    className={isHistorical ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}
                  >
                    <TableCell
                      className={`font-medium sticky left-0 z-10 ${isHistorical ? 'bg-blue-50/50 dark:bg-blue-950/20' : 'bg-background-secondary'}`}
                    >
                      {year.year}
                      {isHistorical && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Actual
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(revenue)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-accent-red">
                      ({formatCurrency(staffCosts)})
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      {formatCurrency(ebitda)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-text-tertiary">
                      {formatPercent(ebitdaMargin)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-accent-red">
                      ({formatCurrency(depreciation)})
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-accent-red">
                      {interestExpense.greaterThan(0) && '('}
                      {formatCurrency(interestExpense)}
                      {interestExpense.greaterThan(0) && ')'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-accent-green">
                      {formatCurrency(interestIncome)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-accent-red">
                      {zakat.greaterThan(0) ? `(${formatCurrency(zakat)})` : '-'}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono text-sm font-bold ${isNegative ? 'text-accent-red' : 'text-accent-green'}`}
                    >
                      {isNegative && '('}
                      {formatCurrency(netResult.abs())}
                      {isNegative && ')'}
                    </TableCell>
                    <TableCell
                      className={`text-right text-sm ${isNegative ? 'text-accent-red' : 'text-accent-green'}`}
                    >
                      {formatPercent(netMargin)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {/* Totals Row */}
              <TableRow className="bg-background-tertiary font-semibold border-t-2">
                <TableCell className="sticky left-0 bg-background-tertiary z-10">TOTAL</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(totals.revenue)}
                </TableCell>
                <TableCell className="text-right font-mono text-accent-red">
                  ({formatCurrency(totals.staffCosts)})
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(totals.ebitda)}
                </TableCell>
                <TableCell className="text-right text-text-tertiary">
                  {formatPercent(totals.ebitdaMargin)}
                </TableCell>
                <TableCell className="text-right font-mono text-accent-red">
                  ({formatCurrency(totals.depreciation)})
                </TableCell>
                <TableCell className="text-right font-mono text-accent-red">
                  ({formatCurrency(totals.interestExpense)})
                </TableCell>
                <TableCell className="text-right font-mono text-accent-green">
                  {formatCurrency(totals.interestIncome)}
                </TableCell>
                <TableCell className="text-right font-mono text-accent-red">
                  ({formatCurrency(totals.zakat)})
                </TableCell>
                <TableCell
                  className={`text-right font-mono font-bold ${totals.netResult.isNegative() ? 'text-accent-red' : 'text-accent-green'}`}
                >
                  {totals.netResult.isNegative() && '('}
                  {formatCurrency(totals.netResult.abs())}
                  {totals.netResult.isNegative() && ')'}
                </TableCell>
                <TableCell
                  className={`text-right ${totals.netResult.isNegative() ? 'text-accent-red' : 'text-accent-green'}`}
                >
                  {formatPercent(totals.netMargin)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Formula Explanation */}
        <div className="mt-4 p-4 bg-background-tertiary rounded-md">
          <p className="text-sm text-text-secondary">
            <span className="font-semibold">Formula:</span> Net Result = EBITDA - Depreciation -
            Interest Expense + Interest Income - Zakat
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Zakat Rate: 2.5% (Saudi Arabian Law)
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Interest: Auto-calculated from debt/cash balances
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
