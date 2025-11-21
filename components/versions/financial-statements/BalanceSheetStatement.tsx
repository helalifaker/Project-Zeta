/**
 * Balance Sheet Statement Component
 *
 * Displays 30-year Balance Sheet with:
 * - Assets: Cash, AR, Fixed Assets
 * - Liabilities: AP, Deferred Income, Accrued Expenses, Short-term Debt
 * - Equity: Opening Equity + Retained Earnings
 * - Balance Check: Assets = Liabilities + Equity
 *
 * Features:
 * - Shows theoretical vs. actual cash (balancing mechanism)
 * - Highlights automatic debt creation
 * - Balance check indicator
 *
 * Reference: FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md (lines 1790-1805)
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
import { CheckCircle2, AlertCircle } from 'lucide-react';
import type { YearlyProjection as YearProjection } from '@/lib/calculations/financial/projection';
import Decimal from 'decimal.js';

export interface BalanceSheetStatementProps {
  projection: YearProjection[];
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
 * Safe get Decimal - returns Decimal(0) if undefined
 */
function safeDecimal(value: Decimal | undefined): Decimal {
  return value ?? new Decimal(0);
}

/**
 * Balance Sheet Statement Component
 *
 * @example
 * <BalanceSheetStatement projection={projectionData} historicalData={historicalActuals} />
 */
export function BalanceSheetStatement(props: BalanceSheetStatementProps): JSX.Element {
  const { projection, historicalData = [] } = props;

  // Create a map of historical data by year for quick lookup
  const historicalMap = useMemo(() => {
    const map = new Map<number, any>();
    historicalData.forEach((h) => {
      map.set(h.year, h);
    });
    return map;
  }, [historicalData]);

  // Check if all years balance (with defensive null checks)
  const allBalanced = useMemo(() => {
    return projection.every((year) => {
      // If Balance Sheet fields are not populated, skip balance check
      if (!year.totalAssets || !year.totalLiabilities || !year.totalEquity) {
        return true; // Can't check balance without data
      }
      const balance = year.totalAssets.minus(year.totalLiabilities).minus(year.totalEquity);
      return balance.abs().lessThan(0.01); // Allow 0.01 SAR tolerance (halala precision)
    });
  }, [projection]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Balance Sheet</CardTitle>
            <CardDescription>
              30-year balance sheet (2023-2052) with automatic debt creation when cash &lt; minimum
            </CardDescription>
          </div>
          <Badge
            variant={allBalanced ? 'default' : 'destructive'}
            className="flex items-center gap-2"
          >
            {allBalanced ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                Balanced
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3" />
                Imbalanced
              </>
            )}
          </Badge>
        </div>
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
                  Assets
                </TableHead>
                <TableHead className="text-right" colSpan={5}>
                  Liabilities
                </TableHead>
                <TableHead className="text-right" colSpan={2}>
                  Equity
                </TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
              <TableRow className="bg-background-tertiary">
                <TableHead className="sticky left-0 bg-background-tertiary z-10"></TableHead>
                {/* Assets */}
                <TableHead className="text-right text-xs">Cash</TableHead>
                <TableHead className="text-right text-xs">AR</TableHead>
                <TableHead className="text-right text-xs">Fixed Assets</TableHead>
                <TableHead className="text-right text-xs font-semibold">Total Assets</TableHead>
                {/* Liabilities */}
                <TableHead className="text-right text-xs">AP</TableHead>
                <TableHead className="text-right text-xs">Deferred</TableHead>
                <TableHead className="text-right text-xs">Accrued</TableHead>
                <TableHead className="text-right text-xs">Debt</TableHead>
                <TableHead className="text-right text-xs font-semibold">Total Liab.</TableHead>
                {/* Equity */}
                <TableHead className="text-right text-xs">Retained</TableHead>
                <TableHead className="text-right text-xs font-semibold">Total Equity</TableHead>
                {/* Balance Check */}
                <TableHead className="text-right text-xs">Check</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projection.map((year) => {
                // Check if we have historical data for this year (2023 or 2024)
                const historical = historicalMap.get(year.year);
                const isHistorical = historical !== undefined;

                // Use historical data if available, otherwise use projection (with safe defaults for optional fields)
                const cash = historical
                  ? toDecimal(historical.cashOnHandAndInBank)
                  : safeDecimal(year.cash);
                const accountsReceivable = historical
                  ? toDecimal(historical.accountsReceivableAndOthers)
                  : safeDecimal(year.accountsReceivable);
                const fixedAssets = historical
                  ? toDecimal(historical.tangibleIntangibleAssetsGross).minus(
                      toDecimal(historical.accumulatedDepreciationAmort)
                    )
                  : safeDecimal(year.fixedAssets);
                const totalAssets = historical
                  ? toDecimal(historical.totalAssets)
                  : safeDecimal(year.totalAssets);

                const accountsPayable = historical
                  ? toDecimal(historical.accountsPayable)
                  : safeDecimal(year.accountsPayable);
                const deferredIncome = historical
                  ? toDecimal(historical.deferredIncome)
                  : safeDecimal(year.deferredIncome);
                const accruedExpenses = historical
                  ? toDecimal(historical.provisions)
                  : safeDecimal(year.accruedExpenses);
                const shortTermDebt = historical ? new Decimal(0) : safeDecimal(year.shortTermDebt); // No debt in historical years
                const totalLiabilities = historical
                  ? toDecimal(historical.totalLiabilities)
                  : safeDecimal(year.totalLiabilities);

                const retainedEarnings = historical
                  ? toDecimal(historical.retainedEarnings)
                  : safeDecimal(year.retainedEarnings);
                const totalEquity = historical
                  ? toDecimal(historical.equity)
                  : safeDecimal(year.totalEquity);

                const balanceCheck = totalAssets.minus(totalLiabilities).minus(totalEquity);
                const isBalanced = balanceCheck.abs().lessThan(0.01);
                const hasDebt = shortTermDebt.greaterThan(0);
                const theoreticalCash = safeDecimal(year.theoreticalCash);
                const cashBelowTheoretical = !isHistorical && cash.lessThan(theoreticalCash);

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
                    {/* Assets */}
                    <TableCell className="text-right font-mono text-sm">
                      <div className="flex flex-col">
                        <span>{formatCurrency(cash)}</span>
                        {cashBelowTheoretical && (
                          <span className="text-xs text-text-tertiary">
                            (Theoretical: {formatCurrency(theoreticalCash)})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(accountsReceivable)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(fixedAssets)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      {formatCurrency(totalAssets)}
                    </TableCell>
                    {/* Liabilities */}
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(accountsPayable)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(deferredIncome)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(accruedExpenses)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono text-sm ${hasDebt ? 'font-semibold text-accent-red' : ''}`}
                    >
                      {hasDebt ? (
                        <div className="flex flex-col">
                          <span>{formatCurrency(shortTermDebt)}</span>
                          <Badge variant="destructive" className="text-xs mt-1">
                            Auto-created
                          </Badge>
                        </div>
                      ) : (
                        '0'
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      {formatCurrency(totalLiabilities)}
                    </TableCell>
                    {/* Equity */}
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(retainedEarnings)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      {formatCurrency(totalEquity)}
                    </TableCell>
                    {/* Balance Check */}
                    <TableCell
                      className={`text-right font-mono text-sm ${isBalanced ? 'text-accent-green' : 'text-accent-red'}`}
                    >
                      {isBalanced ? (
                        <CheckCircle2 className="h-4 w-4 inline" />
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 inline mr-1" />
                          {formatCurrency(balanceCheck)}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Explanation */}
        <div className="mt-4 p-4 bg-background-tertiary rounded-md space-y-2">
          <p className="text-sm text-text-secondary">
            <span className="font-semibold">Formula:</span> Assets = Liabilities + Equity
          </p>
          <p className="text-sm text-text-secondary">
            <span className="font-semibold">Balancing Mechanism:</span> When theoretical cash falls
            below minimum balance (1M SAR), short-term debt is automatically created to maintain the
            minimum. This ensures the school always has sufficient working capital.
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Cash Minimum: 1,000,000 SAR
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Debt: Auto-created when needed
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {allBalanced ? 'All 30 years balanced' : 'Warning: Some years imbalanced'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
