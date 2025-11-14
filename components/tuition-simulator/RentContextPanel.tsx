/**
 * Rent Context Panel Component
 * Left panel displaying rent model information (read-only)
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RevenueChart } from '@/components/charts/RevenueChart';
import type { VersionWithRelations } from '@/services/version';
import type { FullProjectionResult } from '@/lib/calculations/financial/projection';
import Decimal from 'decimal.js';

interface RentContextPanelProps {
  version: VersionWithRelations | null;
  projection: FullProjectionResult | null;
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

function getRentModelDisplayName(rentModel: string): string {
  switch (rentModel) {
    case 'FIXED_ESCALATION':
      return 'Fixed Escalation';
    case 'REVENUE_SHARE':
      return 'Revenue Share';
    case 'PARTNER_MODEL':
      return 'Partner Model';
    default:
      return rentModel;
  }
}

export function RentContextPanel({ version, projection }: RentContextPanelProps) {
  if (!version || !version.rentPlan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rent Context</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select a version to view rent information</p>
        </CardContent>
      </Card>
    );
  }

  const rentPlan = version.rentPlan;
  const parameters = rentPlan.parameters as Record<string, unknown>;

  // Get rent projection data for chart
  const rentChartData =
    projection?.years.map((year) => ({
      year: year.year,
      rent: year.rent.toNumber(),
    })) || [];

  // Calculate NPV of Rent (2028-2052)
  const npvRent = projection?.summary.npvRent || new Decimal(0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Rent Model</CardTitle>
          <CardDescription>{getRentModelDisplayName(rentPlan.rentModel)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Model-specific parameters */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Key Parameters</h4>
            <div className="space-y-1 text-sm">
              {rentPlan.rentModel === 'FIXED_ESCALATION' && (
                <>
                  {parameters.baseRent && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Rent:</span>
                      <span className="font-medium">{formatCurrency(parameters.baseRent as number | string)}</span>
                    </div>
                  )}
                  {parameters.escalationRate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Escalation Rate:</span>
                      <span className="font-medium">
                        {((parameters.escalationRate as number) * 100).toFixed(2)}%
                      </span>
                    </div>
                  )}
                </>
              )}
              {rentPlan.rentModel === 'REVENUE_SHARE' && (
                <>
                  {parameters.revenueSharePercent && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenue Share:</span>
                      <span className="font-medium">
                        {((parameters.revenueSharePercent as number) * 100).toFixed(2)}%
                      </span>
                    </div>
                  )}
                  {parameters.minRent && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Minimum Rent:</span>
                      <span className="font-medium">{formatCurrency(parameters.minRent as number | string)}</span>
                    </div>
                  )}
                </>
              )}
              {rentPlan.rentModel === 'PARTNER_MODEL' && (
                <>
                  {parameters.landSize && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Land Size (m²):</span>
                      <span className="font-medium">{String(parameters.landSize)}</span>
                    </div>
                  )}
                  {parameters.buaSize && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">BUA Size (m²):</span>
                      <span className="font-medium">{String(parameters.buaSize)}</span>
                    </div>
                  )}
                  {parameters.yieldBase && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Yield Base:</span>
                      <span className="font-medium">
                        {((parameters.yieldBase as number) * 100).toFixed(2)}%
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* NPV of Rent */}
          <div className="pt-4 border-t">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">NPV of Rent (2028-2052)</div>
              <div className="text-2xl font-bold">{formatCurrency(npvRent)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rent Projection Chart */}
      {rentChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rent Projection</CardTitle>
            <CardDescription>30-year rent projection</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart 
              data={rentChartData.map(item => ({ year: item.year, revenue: 0, rent: item.rent }))} 
              showRent={true} 
            />
          </CardContent>
        </Card>
      )}

      {/* Informational Note */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            <strong>Note:</strong> Rent is fixed. Adjust tuition and enrollment to see financial
            impact.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

