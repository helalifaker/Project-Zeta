/**
 * KPI Grid Component
 * Grid layout for displaying multiple KPI cards
 */

'use client';

import { memo, useMemo } from 'react';
import { KPICard } from './KPICard';
import type { FullProjectionResult } from '@/lib/calculations/financial/projection';
import Decimal from 'decimal.js';

interface KPIGridProps {
  projection: FullProjectionResult | null;
  totalVersions: number;
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

function KPIGridComponent({ projection, totalVersions, loading }: KPIGridProps) {
  const kpis = useMemo(() => {
    if (!projection) {
      return null;
    }

    const breakevenYear = calculateBreakevenYear(projection.years);

    return {
      npvRent: formatCurrency(projection.summary.npvRent),
      avgEBITDAMargin: formatPercent(projection.summary.avgEBITDAMargin),
      avgRentLoad: formatPercent(projection.summary.avgRentLoad),
      totalVersions: totalVersions.toString(),
      breakevenYear: breakevenYear ? breakevenYear.toString() : 'N/A',
    };
  }, [projection, totalVersions]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!kpis || !projection) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <div className="col-span-full text-center text-muted-foreground py-8">
          No projection data available
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <KPICard
        title="NPV (Rent)"
        value={kpis.npvRent}
        description="2028-2052 period"
      />
      <KPICard
        title="Avg EBITDA Margin"
        value={kpis.avgEBITDAMargin}
        description="30-year average"
      />
      <KPICard
        title="Avg Rent Load"
        value={kpis.avgRentLoad}
        description="25-year average (2028-2052)"
      />
      <KPICard
        title="Total Versions"
        value={kpis.totalVersions}
        description="Active versions"
      />
      <KPICard
        title="Breakeven Year"
        value={kpis.breakevenYear}
        description="First positive cash flow year"
      />
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
export const KPIGrid = memo(KPIGridComponent, (prevProps, nextProps) => {
  return (
    prevProps.loading === nextProps.loading &&
    prevProps.totalVersions === nextProps.totalVersions &&
    prevProps.projection === nextProps.projection
  );
});

KPIGrid.displayName = 'KPIGrid';

