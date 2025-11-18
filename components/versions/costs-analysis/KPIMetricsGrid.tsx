/**
 * KPI Metrics Grid Component
 * Displays key financial metrics in prominent cards at top of dashboard
 * Shows NPV, Rent Load, Year 1 Rent, and Average Cost per Student
 */

'use client';

import Decimal from 'decimal.js';
import { KPICard } from './KPICard';
import type { FullProjectionResult } from '@/lib/calculations/financial/projection';

/**
 * Props for KPIMetricsGrid component
 */
export interface KPIMetricsGridProps {
  /** Full financial projection result (30-year period) */
  projection: FullProjectionResult | null;
  /** NPV of rent (2028-2052 period) */
  rentNPV: Decimal | null;
  /** Average rent load percentage (2028-2052 period) */
  avgRentLoad: Decimal | null;
  /** Year 1 rent (2028) */
  year1Rent: Decimal | null;
  /** Average cost per student */
  avgCostPerStudent: Decimal | null;
}

/**
 * KPI Metrics Grid component displays key financial metrics
 * 
 * Shows 4 KPI cards:
 * - NPV (2028-2052)
 * - Average Rent Load %
 * - Year 1 Rent (2028)
 * - Average Cost per Student
 * 
 * @param props - KPIMetricsGridProps containing projection data and metrics
 * @returns JSX.Element - Grid of 4 KPI cards
 * 
 * @example
 * ```tsx
 * <KPIMetricsGrid
 *   projection={projection}
 *   rentNPV={new Decimal(232792422)}
 *   avgRentLoad={new Decimal(23.99)}
 *   year1Rent={new Decimal(18960000)}
 *   avgCostPerStudent={new Decimal(66437)}
 * />
 * ```
 */
export function KPIMetricsGrid({
  projection,
  rentNPV,
  avgRentLoad,
  year1Rent,
  avgCostPerStudent,
}: KPIMetricsGridProps): JSX.Element {
  // Error handling: Missing data
  if (!projection || !projection.summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="col-span-full">
          <div className="p-6 border rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground">No projection data available</p>
          </div>
        </div>
      </div>
    );
  }

  // Determine rent load status
  const getRentLoadStatus = (rentLoad: Decimal | null): 'optimal' | 'warning' | 'critical' | undefined => {
    if (!rentLoad || rentLoad.isNaN()) return undefined;
    const value = rentLoad.toNumber();
    if (value > 40) return 'critical';
    if (value > 30) return 'warning';
    if (value >= 20 && value <= 30) return 'optimal';
    return undefined;
  };

  // Determine rent load accent color
  const getRentLoadAccentColor = (rentLoad: Decimal | null): 'blue' | 'orange' | 'red' => {
    if (!rentLoad || rentLoad.isNaN()) return 'blue';
    const value = rentLoad.toNumber();
    if (value > 40) return 'red';
    if (value > 30) return 'orange';
    return 'blue';
  };

  const rentLoadStatus = getRentLoadStatus(avgRentLoad);
  const rentLoadAccentColor = getRentLoadAccentColor(avgRentLoad);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        label="NPV (2028-2052)"
        value={rentNPV}
        format="currency"
        accentColor="blue"
        ariaLabel="Net Present Value of rent from 2028 to 2052"
      />
      <KPICard
        label="Avg Rent Load %"
        value={avgRentLoad}
        format="percentage"
        accentColor={rentLoadAccentColor}
        status={rentLoadStatus}
        ariaLabel="Average rent load percentage from 2028 to 2052"
      />
      <KPICard
        label="Year 1 Rent (2028)"
        value={year1Rent}
        format="currency"
        accentColor="blue"
        ariaLabel="Rent amount for year 2028"
      />
      <KPICard
        label="Avg Cost per Student"
        value={avgCostPerStudent}
        format="currency"
        accentColor="green"
        ariaLabel="Average cost per student across all years"
      />
    </div>
  );
}

