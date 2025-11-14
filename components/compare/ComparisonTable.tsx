/**
 * Comparison Table Component
 * Side-by-side comparison table of key metrics for multiple versions
 */

'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { VersionWithRelations } from '@/services/version';
import type { FullProjectionResult } from '@/lib/calculations/financial/projection';
import Decimal from 'decimal.js';

interface ComparisonTableProps {
  versions: VersionWithRelations[];
  projections: Map<string, FullProjectionResult>;
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

export function ComparisonTable({ versions, projections }: ComparisonTableProps) {
  if (versions.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          Select versions to compare
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    { label: 'Version Name', getValue: (version: VersionWithRelations, _proj?: FullProjectionResult) => version.name },
    { label: 'NPV (Rent)', getValue: (_version: VersionWithRelations, proj?: FullProjectionResult) => proj ? formatCurrency(proj.summary.npvRent) : 'N/A' },
    { label: 'Avg EBITDA Margin %', getValue: (_version: VersionWithRelations, proj?: FullProjectionResult) => proj ? formatPercent(proj.summary.avgEBITDAMargin) : 'N/A' },
    { label: 'Avg Rent Load %', getValue: (_version: VersionWithRelations, proj?: FullProjectionResult) => proj ? formatPercent(proj.summary.avgRentLoad) : 'N/A' },
    { label: 'Rent Model', getValue: (version: VersionWithRelations, _proj?: FullProjectionResult) => version.rentPlan?.rentModel || 'N/A' },
    { label: 'Base Tuition (FR)', getValue: (version: VersionWithRelations, _proj?: FullProjectionResult) => {
      const frPlan = version.curriculumPlans.find(cp => cp.curriculumType === 'FR');
      return frPlan ? formatCurrency(frPlan.tuitionBase) : 'N/A';
    }},
    { label: 'Base Tuition (IB)', getValue: (version: VersionWithRelations, _proj?: FullProjectionResult) => {
      const ibPlan = version.curriculumPlans.find(cp => cp.curriculumType === 'IB');
      return ibPlan ? formatCurrency(ibPlan.tuitionBase) : 'N/A';
    }},
    { label: 'Capacity (FR)', getValue: (version: VersionWithRelations, _proj?: FullProjectionResult) => {
      const frPlan = version.curriculumPlans.find(cp => cp.curriculumType === 'FR');
      return frPlan ? frPlan.capacity.toString() : 'N/A';
    }},
    { label: 'Capacity (IB)', getValue: (version: VersionWithRelations, _proj?: FullProjectionResult) => {
      const ibPlan = version.curriculumPlans.find(cp => cp.curriculumType === 'IB');
      return ibPlan ? ibPlan.capacity.toString() : 'N/A';
    }},
    { label: 'Total Revenue (30yr)', getValue: (_version: VersionWithRelations, proj?: FullProjectionResult) => proj ? formatCurrency(proj.summary.totalRevenue) : 'N/A' },
    { label: 'Breakeven Year', getValue: (_version: VersionWithRelations, proj?: FullProjectionResult) => {
      if (!proj) return 'N/A';
      const year = calculateBreakevenYear(proj.years);
      return year ? year.toString() : 'N/A';
    }},
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparison Table</CardTitle>
        <CardDescription>Key metrics side-by-side comparison</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                {versions.map((version) => (
                  <TableHead key={version.id} className="min-w-[150px]">
                    {version.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((metric, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{metric.label}</TableCell>
                  {versions.map((version) => {
                    const projection = projections.get(version.id);
                    const value = metric.getValue(version, projection);
                    return (
                      <TableCell key={version.id}>{value}</TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

