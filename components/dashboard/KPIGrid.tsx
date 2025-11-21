/**
 * KPI Grid Component
 * Grid layout for displaying multiple KPI cards
 */

'use client';

import { memo, useMemo } from 'react';
import { KPICard } from './KPICard';
import type { FullProjectionResult } from '@/lib/calculations/financial/projection';
import Decimal from 'decimal.js';
import { getMetricHealth } from '@/lib/utils/metric-health';

interface KPIGridProps {
  projection: FullProjectionResult | null;
  totalVersions: number;
  loading?: boolean;
}

function formatCurrency(value: Decimal | number | string): string {
  const num =
    value instanceof Decimal
      ? value.toNumber()
      : typeof value === 'string'
        ? parseFloat(value)
        : value;
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

// Split currency value and unit for better display
function formatCurrencySplit(value: Decimal | number | string): { value: string; unit: string } {
  const num =
    value instanceof Decimal
      ? value.toNumber()
      : typeof value === 'string'
        ? parseFloat(value)
        : value;
  if (isNaN(num)) return { value: '0', unit: 'SAR' };

  if (Math.abs(num) >= 1_000_000_000) {
    return { value: (num / 1_000_000_000).toFixed(2), unit: 'B SAR' };
  }
  if (Math.abs(num) >= 1_000_000) {
    return { value: (num / 1_000_000).toFixed(2), unit: 'M SAR' };
  }
  if (Math.abs(num) >= 1_000) {
    return { value: (num / 1_000).toFixed(2), unit: 'K SAR' };
  }
  return { value: num.toFixed(0), unit: 'SAR' };
}

function formatPercent(value: Decimal | number | string): string {
  const num =
    value instanceof Decimal
      ? value.toNumber()
      : typeof value === 'string'
        ? parseFloat(value)
        : value;
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

    // Calculate Net Profit Margin (Net Result / Revenue * 100)
    // Average across all 30 years
    let totalNetResult = new Decimal(0);
    let totalRevenue = new Decimal(0);

    projection.years.forEach((year) => {
      // Net Result = EBITDA - Interest - Zakat - Depreciation
      // Convert to Decimal if needed (handles both Decimal objects and numbers)
      const ebitda = year.ebitda instanceof Decimal ? year.ebitda : new Decimal(year.ebitda || 0);
      const interest =
        year.interest instanceof Decimal ? year.interest : new Decimal(year.interest || 0);
      const taxes = year.taxes instanceof Decimal ? year.taxes : new Decimal(year.taxes || 0);
      const revenue =
        year.revenue instanceof Decimal ? year.revenue : new Decimal(year.revenue || 0);

      const netResult = ebitda.minus(interest).minus(taxes);
      totalNetResult = totalNetResult.plus(netResult);
      totalRevenue = totalRevenue.plus(revenue);
    });

    const avgNetProfitMargin = totalRevenue.isZero()
      ? new Decimal(0)
      : totalNetResult.dividedBy(totalRevenue).times(100);

    const npvSplit = formatCurrencySplit(projection.summary.npvRent);

    // Calculate sparkline data (last 10 years for visual trend)
    const recentYears = projection.years.slice(-10);

    // NPV Sparkline: Cumulative rent cash flow over time
    let cumulativeNpv = new Decimal(0);
    const npvSparkline = recentYears.map((year) => {
      // Convert to Decimal if needed (handles both Decimal objects and numbers)
      const rent = year.rent instanceof Decimal ? year.rent : new Decimal(year.rent || 0);
      cumulativeNpv = cumulativeNpv.plus(rent);
      return { value: cumulativeNpv.toNumber() };
    });

    // EBITDA Margin Sparkline
    const ebitdaSparkline = recentYears.map((year) => {
      const ebitda = year.ebitda instanceof Decimal ? year.ebitda : new Decimal(year.ebitda || 0);
      const revenue =
        year.revenue instanceof Decimal ? year.revenue : new Decimal(year.revenue || 0);
      const margin = revenue.isZero() ? 0 : ebitda.dividedBy(revenue).times(100).toNumber();
      return { value: margin };
    });

    // Rent Load Sparkline
    const rentLoadSparkline = recentYears.map((year) => {
      return {
        value: year.rentLoad instanceof Decimal ? year.rentLoad.toNumber() : Number(year.rentLoad),
      };
    });

    // Net Profit Margin Sparkline
    const netProfitSparkline = recentYears.map((year) => {
      // Convert to Decimal if needed (handles both Decimal objects and numbers)
      const ebitda = year.ebitda instanceof Decimal ? year.ebitda : new Decimal(year.ebitda || 0);
      const interest =
        year.interest instanceof Decimal ? year.interest : new Decimal(year.interest || 0);
      const taxes = year.taxes instanceof Decimal ? year.taxes : new Decimal(year.taxes || 0);
      const revenue =
        year.revenue instanceof Decimal ? year.revenue : new Decimal(year.revenue || 0);

      const netResult = ebitda.minus(interest).minus(taxes);
      const margin = revenue.isZero() ? 0 : netResult.dividedBy(revenue).times(100).toNumber();
      return { value: margin };
    });

    return {
      npvValue: npvSplit.value,
      npvUnit: npvSplit.unit,
      avgEBITDAMargin: formatPercent(projection.summary.avgEBITDAMargin),
      avgRentLoad: formatPercent(projection.summary.avgRentLoad),
      avgNetProfitMargin: formatPercent(avgNetProfitMargin),
      npvSparkline,
      ebitdaSparkline,
      rentLoadSparkline,
      netProfitSparkline,
    };
  }, [projection, totalVersions]);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!kpis || !projection) {
    // Show KPI cards with placeholder values when no projection data
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="NPV (Rent)" value="—" description="2028-2052 period" />
        <KPICard title="Avg EBITDA Margin" value="—" description="30-year average" />
        <KPICard title="Avg Rent Load" value="—" description="25-year average (2028-2052)" />
        <KPICard title="Avg Net Profit Margin" value="—" description="30-year average" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="NPV (Rent)"
        value={kpis.npvValue}
        unit={kpis.npvUnit}
        description="2028-2052 period"
        status={getMetricHealth('npv', `${kpis.npvValue}${kpis.npvUnit}`)}
        sparklineData={kpis.npvSparkline}
      />
      <KPICard
        title="Avg EBITDA Margin"
        value={kpis.avgEBITDAMargin}
        description="30-year average"
        status={getMetricHealth('ebitda', kpis.avgEBITDAMargin)}
        sparklineData={kpis.ebitdaSparkline}
      />
      <KPICard
        title="Avg Rent Load"
        value={kpis.avgRentLoad}
        description="25-year average (2028-2052)"
        status={getMetricHealth('rentLoad', kpis.avgRentLoad)}
        sparklineData={kpis.rentLoadSparkline}
      />
      <KPICard
        title="Avg Net Profit Margin"
        value={kpis.avgNetProfitMargin}
        description="30-year average"
        status={getMetricHealth('netProfit', kpis.avgNetProfitMargin)}
        sparklineData={kpis.netProfitSparkline}
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
