/**
 * Cash Flow Statement Component
 *
 * Displays 30-year Cash Flow Statement with:
 * - Operating Activities: Net Income + Depreciation - WC Changes
 * - Investing Activities: CapEx
 * - Financing Activities: Debt changes
 * - Net Cash Flow & Cash Position
 *
 * Features:
 * - Shows working capital breakdown (AR, AP, Deferred, Accrued)
 * - Highlights debt creation for balancing
 * - Cash reconciliation (beginning → theoretical → actual ending)
 *
 * Reference: FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md (lines 1806-1823)
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
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { YearlyProjection as YearProjection } from '@/lib/calculations/financial/projection';
import Decimal from 'decimal.js';

export interface CashFlowStatementProps {
  projection: YearProjection[];
  historicalData?: any[]; // Historical actuals for 2023-2024
}

/**
 * Format currency in SAR with commas
 */
function formatCurrency(value: Decimal | number | string, showSign = false): string {
  let num: number;
  if (typeof value === 'string') {
    num = parseFloat(value);
  } else if (typeof value === 'number') {
    num = value;
  } else {
    num = value.toNumber();
  }

  if (isNaN(num)) num = 0;

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(num));

  if (showSign) {
    if (num > 0) return `+${formatted}`;
    if (num < 0) return `-${formatted}`;
  } else {
    if (num < 0) return `(${formatted})`;
  }

  return formatted;
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
 * Cash Flow Statement Component
 *
 * @example
 * <CashFlowStatement projection={projectionData} historicalData={historicalActuals} />
 */
export function CashFlowStatement(props: CashFlowStatementProps): JSX.Element {
  const { projection, historicalData = [] } = props;

  // Create a map of historical data by year for quick lookup
  const historicalMap = useMemo(() => {
    const map = new Map<number, any>();
    historicalData.forEach((h) => {
      map.set(h.year, h);
    });
    return map;
  }, [historicalData]);

  // Calculate totals
  const totals = useMemo(() => {
    return projection.reduce(
      (acc, year) => ({
        netResult: acc.netResult.plus(year.netResult),
        depreciation: acc.depreciation.plus(year.depreciation),
        workingCapitalChange: acc.workingCapitalChange.plus(year.workingCapitalChange),
        operatingCashFlow: acc.operatingCashFlow.plus(year.operatingCashFlow),
        investingCashFlow: acc.investingCashFlow.plus(year.investingCashFlow),
        financingCashFlow: acc.financingCashFlow.plus(year.financingCashFlow),
        netCashFlow: acc.netCashFlow.plus(year.netCashFlow),
      }),
      {
        netResult: new Decimal(0),
        depreciation: new Decimal(0),
        workingCapitalChange: new Decimal(0),
        operatingCashFlow: new Decimal(0),
        investingCashFlow: new Decimal(0),
        financingCashFlow: new Decimal(0),
        netCashFlow: new Decimal(0),
      }
    );
  }, [projection]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow Statement</CardTitle>
        <CardDescription>
          30-year cash flow statement (2023-2052) showing operating, investing, and financing
          activities
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
                <TableHead className="text-right" colSpan={4}>
                  Operating Activities
                </TableHead>
                <TableHead className="text-right">Investing</TableHead>
                <TableHead className="text-right">Financing</TableHead>
                <TableHead className="text-right">Net CF</TableHead>
                <TableHead className="text-right" colSpan={3}>
                  Cash Position
                </TableHead>
              </TableRow>
              <TableRow className="bg-background-tertiary">
                <TableHead className="sticky left-0 bg-background-tertiary z-10"></TableHead>
                {/* Operating */}
                <TableHead className="text-right text-xs">Net Income</TableHead>
                <TableHead className="text-right text-xs">Depreciation</TableHead>
                <TableHead className="text-right text-xs">WC Change</TableHead>
                <TableHead className="text-right text-xs font-semibold">Operating CF</TableHead>
                {/* Investing */}
                <TableHead className="text-right text-xs font-semibold">CapEx</TableHead>
                {/* Financing */}
                <TableHead className="text-right text-xs font-semibold">Debt Δ</TableHead>
                {/* Net */}
                <TableHead className="text-right text-xs font-semibold">Net CF</TableHead>
                {/* Cash Position */}
                <TableHead className="text-right text-xs">Beginning</TableHead>
                <TableHead className="text-right text-xs">Theoretical</TableHead>
                <TableHead className="text-right text-xs font-semibold">Ending</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projection.map((year, index) => {
                // Check if we have historical data for this year (2023 or 2024)
                const historical = historicalMap.get(year.year);
                const isHistorical = historical !== undefined;

                // Use historical data if available, otherwise use projection
                const netResult = historical ? toDecimal(historical.netResult) : year.netResult;
                const depreciation = historical
                  ? toDecimal(historical.cfDepreciation)
                  : year.depreciation;

                // For historical years, calculate WC change from individual components
                const workingCapitalChange = historical
                  ? toDecimal(historical.cfAccountsReceivable)
                      .plus(toDecimal(historical.cfPrepaidExpenses))
                      .plus(toDecimal(historical.cfLoans))
                      .plus(toDecimal(historical.cfIntangibleAssets))
                      .plus(toDecimal(historical.cfAccountsPayable))
                      .plus(toDecimal(historical.cfAccruedExpenses))
                      .plus(toDecimal(historical.cfDeferredIncome))
                      .plus(toDecimal(historical.cfProvisions))
                  : year.workingCapitalChange;

                const operatingCashFlow = historical
                  ? toDecimal(historical.netCashFromOperatingActivities)
                  : year.operatingCashFlow;
                const investingCashFlow = historical
                  ? toDecimal(historical.netCashFromInvestingActivities)
                  : year.investingCashFlow;
                const financingCashFlow = historical
                  ? toDecimal(historical.netCashFromFinancingActivities)
                  : year.financingCashFlow;
                const netCashFlow = historical
                  ? toDecimal(historical.netIncreaseDecreaseCash)
                  : year.netCashFlow;
                const cash = historical ? toDecimal(historical.cashEndOfPeriod) : year.cash;

                const beginningCash = historical
                  ? toDecimal(historical.cashBeginningOfPeriod)
                  : index === 0
                    ? projection[0].cash.minus(projection[0].netCashFlow) // Reverse calculate from first year
                    : projection[index - 1].cash;

                const theoreticalCash = isHistorical
                  ? beginningCash.plus(netCashFlow)
                  : year.theoreticalCash;

                const isOperatingPositive = operatingCashFlow.greaterThan(0);
                const isNetPositive = netCashFlow.greaterThan(0);
                const hasDebtChange = !financingCashFlow.equals(0);

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
                    {/* Operating Activities */}
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(netResult)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-accent-green">
                      {formatCurrency(depreciation)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono text-sm ${workingCapitalChange.isNegative() ? 'text-accent-green' : 'text-accent-red'}`}
                    >
                      {formatCurrency(workingCapitalChange)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono text-sm font-semibold ${isOperatingPositive ? 'text-accent-green' : 'text-accent-red'}`}
                    >
                      {isOperatingPositive ? (
                        <div className="flex items-center justify-end gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {formatCurrency(operatingCashFlow)}
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <TrendingDown className="h-3 w-3" />
                          {formatCurrency(operatingCashFlow)}
                        </div>
                      )}
                    </TableCell>
                    {/* Investing Activities */}
                    <TableCell className="text-right font-mono text-sm font-semibold text-accent-red">
                      {formatCurrency(investingCashFlow)}
                    </TableCell>
                    {/* Financing Activities */}
                    <TableCell
                      className={`text-right font-mono text-sm font-semibold ${hasDebtChange ? (financingCashFlow.greaterThan(0) ? 'text-accent-red' : 'text-accent-green') : ''}`}
                    >
                      {hasDebtChange ? (
                        <div className="flex flex-col">
                          <span>{formatCurrency(financingCashFlow, true)}</span>
                          <Badge
                            variant={financingCashFlow.greaterThan(0) ? 'destructive' : 'default'}
                            className="text-xs mt-1"
                          >
                            {financingCashFlow.greaterThan(0) ? 'Borrowed' : 'Repaid'}
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <Minus className="h-3 w-3" />0
                        </div>
                      )}
                    </TableCell>
                    {/* Net Cash Flow */}
                    <TableCell
                      className={`text-right font-mono text-sm font-bold ${isNetPositive ? 'text-accent-green' : 'text-accent-red'}`}
                    >
                      {formatCurrency(netCashFlow, true)}
                    </TableCell>
                    {/* Cash Position */}
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(beginningCash)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-text-tertiary">
                      {formatCurrency(theoreticalCash)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      {formatCurrency(cash)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {/* Totals Row */}
              <TableRow className="bg-background-tertiary font-semibold border-t-2">
                <TableCell className="sticky left-0 bg-background-tertiary z-10">TOTAL</TableCell>
                {/* Operating */}
                <TableCell className="text-right font-mono">
                  {formatCurrency(totals.netResult)}
                </TableCell>
                <TableCell className="text-right font-mono text-accent-green">
                  {formatCurrency(totals.depreciation)}
                </TableCell>
                <TableCell
                  className={`text-right font-mono ${totals.workingCapitalChange.isNegative() ? 'text-accent-green' : 'text-accent-red'}`}
                >
                  {formatCurrency(totals.workingCapitalChange)}
                </TableCell>
                <TableCell
                  className={`text-right font-mono ${totals.operatingCashFlow.greaterThan(0) ? 'text-accent-green' : 'text-accent-red'}`}
                >
                  {formatCurrency(totals.operatingCashFlow)}
                </TableCell>
                {/* Investing */}
                <TableCell className="text-right font-mono text-accent-red">
                  {formatCurrency(totals.investingCashFlow)}
                </TableCell>
                {/* Financing */}
                <TableCell className="text-right font-mono">
                  {formatCurrency(totals.financingCashFlow, true)}
                </TableCell>
                {/* Net */}
                <TableCell
                  className={`text-right font-mono font-bold ${totals.netCashFlow.greaterThan(0) ? 'text-accent-green' : 'text-accent-red'}`}
                >
                  {formatCurrency(totals.netCashFlow, true)}
                </TableCell>
                {/* Cash Position - N/A for totals */}
                <TableCell colSpan={3} className="text-center text-text-tertiary text-sm">
                  —
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Explanation */}
        <div className="mt-4 p-4 bg-background-tertiary rounded-md space-y-2">
          <p className="text-sm text-text-secondary">
            <span className="font-semibold">Formula:</span> Operating CF = Net Income + Depreciation
            - Working Capital Changes
          </p>
          <p className="text-sm text-text-secondary">
            <span className="font-semibold">Cash Reconciliation:</span> Theoretical Ending Cash =
            Beginning Cash + Net Cash Flow. Actual Ending Cash is adjusted to maintain minimum
            balance (1M SAR), with debt created/repaid as needed.
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              WC Change: Positive = Uses cash, Negative = Provides cash
            </Badge>
            <Badge variant="secondary" className="text-xs">
              CapEx: Always negative (uses cash)
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Financing: Debt changes (borrowing/repayment)
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
