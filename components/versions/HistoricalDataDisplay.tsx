/**
 * Historical Data Display Component
 * Shows uploaded historical financial statements (2023-2024)
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface HistoricalData {
  id: string;
  year: number;

  // P&L
  tuitionFrenchCurriculum: string;
  tuitionIB: string;
  otherIncome: string;
  totalRevenues: string;
  salariesAndRelatedCosts: string;
  schoolRent: string;
  otherExpenses: string;
  totalOperatingExpenses: string;
  depreciationAmortization: string;
  interestIncome: string;
  interestExpenses: string;
  netResult: string;

  // Balance Sheet
  cashOnHandAndInBank: string;
  accountsReceivableAndOthers: string;
  totalCurrentAssets: string;
  tangibleIntangibleAssetsGross: string;
  accumulatedDepreciationAmort: string;
  nonCurrentAssets: string;
  totalAssets: string;
  accountsPayable: string;
  deferredIncome: string;
  totalCurrentLiabilities: string;
  provisions: string;
  totalLiabilities: string;
  retainedEarnings: string;
  equity: string;

  // Cash Flow
  cfNetResult: string;
  netCashFromOperatingActivities: string;
  cfAdditionsFixedAssets: string;
  netCashFromInvestingActivities: string;
  cfChangesInFundBalance: string;
  netCashFromFinancingActivities: string;
  netIncreaseDecreaseCash: string;
  cashBeginningOfPeriod: string;
  cashEndOfPeriod: string;
}

interface HistoricalDataDisplayProps {
  versionId: string;
}

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function HistoricalDataDisplay({ versionId }: HistoricalDataDisplayProps) {
  const [data, setData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/historical-data?versionId=${versionId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch historical data');
        }

        const result = await response.json();
        setData(result.data || []);
      } catch (err) {
        console.error('Error fetching historical data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [versionId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historical Data (2023-2024)</CardTitle>
          <CardDescription>Actual financial statements from accounting records</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historical Data (2023-2024)</CardTitle>
          <CardDescription>Actual financial statements from accounting records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">Error loading historical data: {error}</div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historical Data (2023-2024)</CardTitle>
          <CardDescription>Actual financial statements from accounting records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No historical data uploaded yet.</p>
            <p className="text-sm mt-2">
              Use the import script to upload complete financial statements:
            </p>
            <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">
              npx tsx scripts/import-historical-data-complete.ts {versionId}
            </code>
          </div>
        </CardContent>
      </Card>
    );
  }

  const data2023 = data.find(d => d.year === 2023);
  const data2024 = data.find(d => d.year === 2024);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historical Data (2023-2024)</CardTitle>
        <CardDescription>
          Actual financial statements from accounting records - Read-only data used in calculations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="pnl">P&L</TabsTrigger>
            <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
            <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* 2023 Summary */}
              {data2023 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">2023</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Revenues:</span>
                      <span className="font-medium">{formatCurrency(data2023.totalRevenues)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Net Result:</span>
                      <span className="font-medium">{formatCurrency(data2023.netResult)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground">Total Assets:</span>
                      <span className="font-medium">{formatCurrency(data2023.totalAssets)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Liabilities:</span>
                      <span className="font-medium">{formatCurrency(data2023.totalLiabilities)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Equity:</span>
                      <span className="font-medium">{formatCurrency(data2023.equity)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground">Cash End of Period:</span>
                      <span className="font-medium">{formatCurrency(data2023.cashEndOfPeriod)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 2024 Summary */}
              {data2024 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">2024</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Revenues:</span>
                      <span className="font-medium">{formatCurrency(data2024.totalRevenues)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Net Result:</span>
                      <span className="font-medium">{formatCurrency(data2024.netResult)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground">Total Assets:</span>
                      <span className="font-medium">{formatCurrency(data2024.totalAssets)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Liabilities:</span>
                      <span className="font-medium">{formatCurrency(data2024.totalLiabilities)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Equity:</span>
                      <span className="font-medium">{formatCurrency(data2024.equity)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground">Cash End of Period:</span>
                      <span className="font-medium">{formatCurrency(data2024.cashEndOfPeriod)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pnl" className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Item</th>
                    {data2023 && <th className="text-right py-2">2023</th>}
                    {data2024 && <th className="text-right py-2">2024</th>}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Tuition French Curriculum</td>
                    {data2023 && <td className="text-right">{formatCurrency(data2023.tuitionFrenchCurriculum)}</td>}
                    {data2024 && <td className="text-right">{formatCurrency(data2024.tuitionFrenchCurriculum)}</td>}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Tuition IB</td>
                    {data2023 && <td className="text-right">{formatCurrency(data2023.tuitionIB)}</td>}
                    {data2024 && <td className="text-right">{formatCurrency(data2024.tuitionIB)}</td>}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Other Income</td>
                    {data2023 && <td className="text-right">{formatCurrency(data2023.otherIncome)}</td>}
                    {data2024 && <td className="text-right">{formatCurrency(data2024.otherIncome)}</td>}
                  </tr>
                  <tr className="border-b bg-muted/50">
                    <td className="py-2 font-bold">Total Revenues</td>
                    {data2023 && <td className="text-right font-bold">{formatCurrency(data2023.totalRevenues)}</td>}
                    {data2024 && <td className="text-right font-bold">{formatCurrency(data2024.totalRevenues)}</td>}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Salaries and Related Costs</td>
                    {data2023 && <td className="text-right">({formatCurrency(data2023.salariesAndRelatedCosts)})</td>}
                    {data2024 && <td className="text-right">({formatCurrency(data2024.salariesAndRelatedCosts)})</td>}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">School Rent</td>
                    {data2023 && <td className="text-right">({formatCurrency(data2023.schoolRent)})</td>}
                    {data2024 && <td className="text-right">({formatCurrency(data2024.schoolRent)})</td>}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Other Expenses</td>
                    {data2023 && <td className="text-right">({formatCurrency(data2023.otherExpenses)})</td>}
                    {data2024 && <td className="text-right">({formatCurrency(data2024.otherExpenses)})</td>}
                  </tr>
                  <tr className="border-b bg-muted/50">
                    <td className="py-2 font-bold">Total Operating Expenses</td>
                    {data2023 && <td className="text-right font-bold">({formatCurrency(data2023.totalOperatingExpenses)})</td>}
                    {data2024 && <td className="text-right font-bold">({formatCurrency(data2024.totalOperatingExpenses)})</td>}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Depreciation & Amortization</td>
                    {data2023 && <td className="text-right">({formatCurrency(data2023.depreciationAmortization)})</td>}
                    {data2024 && <td className="text-right">({formatCurrency(data2024.depreciationAmortization)})</td>}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Interest Income</td>
                    {data2023 && <td className="text-right">{formatCurrency(data2023.interestIncome)}</td>}
                    {data2024 && <td className="text-right">{formatCurrency(data2024.interestIncome)}</td>}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Interest Expenses</td>
                    {data2023 && <td className="text-right">({formatCurrency(data2023.interestExpenses)})</td>}
                    {data2024 && <td className="text-right">({formatCurrency(data2024.interestExpenses)})</td>}
                  </tr>
                  <tr className="border-b bg-muted/50">
                    <td className="py-2 font-bold">Net Result</td>
                    {data2023 && <td className="text-right font-bold">{formatCurrency(data2023.netResult)}</td>}
                    {data2024 && <td className="text-right font-bold">{formatCurrency(data2024.netResult)}</td>}
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="balance" className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Item</th>
                    {data2023 && <th className="text-right py-2">2023</th>}
                    {data2024 && <th className="text-right py-2">2024</th>}
                  </tr>
                </thead>
                <tbody>
                  <tr><td colSpan={3} className="py-2 font-bold text-primary">ASSETS</td></tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Cash on Hand and in Bank</td>
                    {data2023 && <td className="text-right">{formatCurrency(data2023.cashOnHandAndInBank)}</td>}
                    {data2024 && <td className="text-right">{formatCurrency(data2024.cashOnHandAndInBank)}</td>}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Accounts Receivable & Others</td>
                    {data2023 && <td className="text-right">{formatCurrency(data2023.accountsReceivableAndOthers)}</td>}
                    {data2024 && <td className="text-right">{formatCurrency(data2024.accountsReceivableAndOthers)}</td>}
                  </tr>
                  <tr className="border-b bg-muted/50">
                    <td className="py-2 font-bold">Total Current Assets</td>
                    {data2023 && <td className="text-right font-bold">{formatCurrency(data2023.totalCurrentAssets)}</td>}
                    {data2024 && <td className="text-right font-bold">{formatCurrency(data2024.totalCurrentAssets)}</td>}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Tangible & Intangible Assets (Gross)</td>
                    {data2023 && <td className="text-right">{formatCurrency(data2023.tangibleIntangibleAssetsGross)}</td>}
                    {data2024 && <td className="text-right">{formatCurrency(data2024.tangibleIntangibleAssetsGross)}</td>}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Accumulated Depreciation & Amort.</td>
                    {data2023 && <td className="text-right">{formatCurrency(data2023.accumulatedDepreciationAmort)}</td>}
                    {data2024 && <td className="text-right">{formatCurrency(data2024.accumulatedDepreciationAmort)}</td>}
                  </tr>
                  <tr className="border-b bg-muted/50">
                    <td className="py-2 font-bold">Non-Current Assets</td>
                    {data2023 && <td className="text-right font-bold">{formatCurrency(data2023.nonCurrentAssets)}</td>}
                    {data2024 && <td className="text-right font-bold">{formatCurrency(data2024.nonCurrentAssets)}</td>}
                  </tr>
                  <tr className="border-b bg-primary/10">
                    <td className="py-2 font-bold">TOTAL ASSETS</td>
                    {data2023 && <td className="text-right font-bold">{formatCurrency(data2023.totalAssets)}</td>}
                    {data2024 && <td className="text-right font-bold">{formatCurrency(data2024.totalAssets)}</td>}
                  </tr>

                  <tr><td colSpan={3} className="py-2 font-bold text-primary pt-4">LIABILITIES</td></tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Accounts Payable</td>
                    {data2023 && <td className="text-right">{formatCurrency(data2023.accountsPayable)}</td>}
                    {data2024 && <td className="text-right">{formatCurrency(data2024.accountsPayable)}</td>}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Deferred Income</td>
                    {data2023 && <td className="text-right">{formatCurrency(data2023.deferredIncome)}</td>}
                    {data2024 && <td className="text-right">{formatCurrency(data2024.deferredIncome)}</td>}
                  </tr>
                  <tr className="border-b bg-muted/50">
                    <td className="py-2 font-bold">Total Current Liabilities</td>
                    {data2023 && <td className="text-right font-bold">{formatCurrency(data2023.totalCurrentLiabilities)}</td>}
                    {data2024 && <td className="text-right font-bold">{formatCurrency(data2024.totalCurrentLiabilities)}</td>}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Provisions</td>
                    {data2023 && <td className="text-right">{formatCurrency(data2023.provisions)}</td>}
                    {data2024 && <td className="text-right">{formatCurrency(data2024.provisions)}</td>}
                  </tr>
                  <tr className="border-b bg-primary/10">
                    <td className="py-2 font-bold">TOTAL LIABILITIES</td>
                    {data2023 && <td className="text-right font-bold">{formatCurrency(data2023.totalLiabilities)}</td>}
                    {data2024 && <td className="text-right font-bold">{formatCurrency(data2024.totalLiabilities)}</td>}
                  </tr>

                  <tr><td colSpan={3} className="py-2 font-bold text-primary pt-4">EQUITY</td></tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Retained Earnings</td>
                    {data2023 && <td className="text-right">{formatCurrency(data2023.retainedEarnings)}</td>}
                    {data2024 && <td className="text-right">{formatCurrency(data2024.retainedEarnings)}</td>}
                  </tr>
                  <tr className="border-b bg-primary/10">
                    <td className="py-2 font-bold">TOTAL EQUITY</td>
                    {data2023 && <td className="text-right font-bold">{formatCurrency(data2023.equity)}</td>}
                    {data2024 && <td className="text-right font-bold">{formatCurrency(data2024.equity)}</td>}
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="cashflow" className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Item</th>
                    {data2023 && <th className="text-right py-2">2023</th>}
                    {data2024 && <th className="text-right py-2">2024</th>}
                  </tr>
                </thead>
                <tbody>
                  <tr><td colSpan={3} className="py-2 font-bold text-primary">OPERATING ACTIVITIES</td></tr>
                  <tr className="border-b bg-muted/50">
                    <td className="py-2 font-bold">Net Cash from Operating Activities</td>
                    {data2023 && <td className="text-right font-bold">{formatCurrency(data2023.netCashFromOperatingActivities)}</td>}
                    {data2024 && <td className="text-right font-bold">{formatCurrency(data2024.netCashFromOperatingActivities)}</td>}
                  </tr>

                  <tr><td colSpan={3} className="py-2 font-bold text-primary pt-4">INVESTING ACTIVITIES</td></tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Additions of Fixed Assets</td>
                    {data2023 && <td className="text-right">{formatCurrency(data2023.cfAdditionsFixedAssets)}</td>}
                    {data2024 && <td className="text-right">{formatCurrency(data2024.cfAdditionsFixedAssets)}</td>}
                  </tr>
                  <tr className="border-b bg-muted/50">
                    <td className="py-2 font-bold">Net Cash from Investing Activities</td>
                    {data2023 && <td className="text-right font-bold">{formatCurrency(data2023.netCashFromInvestingActivities)}</td>}
                    {data2024 && <td className="text-right font-bold">{formatCurrency(data2024.netCashFromInvestingActivities)}</td>}
                  </tr>

                  <tr><td colSpan={3} className="py-2 font-bold text-primary pt-4">FINANCING ACTIVITIES</td></tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Changes in Fund Balance</td>
                    {data2023 && <td className="text-right">{formatCurrency(data2023.cfChangesInFundBalance)}</td>}
                    {data2024 && <td className="text-right">{formatCurrency(data2024.cfChangesInFundBalance)}</td>}
                  </tr>
                  <tr className="border-b bg-muted/50">
                    <td className="py-2 font-bold">Net Cash from Financing Activities</td>
                    {data2023 && <td className="text-right font-bold">{formatCurrency(data2023.netCashFromFinancingActivities)}</td>}
                    {data2024 && <td className="text-right font-bold">{formatCurrency(data2024.netCashFromFinancingActivities)}</td>}
                  </tr>

                  <tr><td colSpan={3} className="py-2 font-bold text-primary pt-4">SUMMARY</td></tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Net Increase (Decrease) Cash</td>
                    {data2023 && <td className="text-right">{formatCurrency(data2023.netIncreaseDecreaseCash)}</td>}
                    {data2024 && <td className="text-right">{formatCurrency(data2024.netIncreaseDecreaseCash)}</td>}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Cash Beginning of Period</td>
                    {data2023 && <td className="text-right">{formatCurrency(data2023.cashBeginningOfPeriod)}</td>}
                    {data2024 && <td className="text-right">{formatCurrency(data2024.cashBeginningOfPeriod)}</td>}
                  </tr>
                  <tr className="border-b bg-primary/10">
                    <td className="py-2 font-bold">Cash End of Period</td>
                    {data2023 && <td className="text-right font-bold">{formatCurrency(data2023.cashEndOfPeriod)}</td>}
                    {data2024 && <td className="text-right font-bold">{formatCurrency(data2024.cashEndOfPeriod)}</td>}
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
