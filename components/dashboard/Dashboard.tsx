/**
 * Dashboard Client Component
 * Client component for displaying dashboard with KPIs and charts
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { KPIGrid } from './KPIGrid';
import { VersionSelector } from './VersionSelector';
import { useDashboardStore } from '@/stores/dashboard-store';
import { useFinancialCalculation } from '@/hooks/useFinancialCalculation';
import { useDebounce } from '@/hooks/useDebounce';
import { serializeVersionForClient } from '@/lib/utils/serialize';
import { serializeRentPlanParametersForWorker } from '@/lib/utils/worker-serialize';
import type { VersionWithRelations } from '@/services/version';
import type { FullProjectionParams } from '@/lib/calculations/financial/projection';

// Dynamic imports for heavy chart components (Recharts is heavy)
const RevenueChart = dynamic(() => import('@/components/charts/RevenueChart').then(mod => ({ default: mod.RevenueChart })), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false,
});

const EBITDATrendChart = dynamic(() => import('@/components/charts/EBITDATrendChart').then(mod => ({ default: mod.EBITDATrendChart })), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false,
});

const RentLoadChart = dynamic(() => import('@/components/charts/RentLoadChart').then(mod => ({ default: mod.RentLoadChart })), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false,
});

const EnrollmentChart = dynamic(() => import('@/components/charts/EnrollmentChart').then(mod => ({ default: mod.EnrollmentChart })), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false,
});

interface DashboardProps {
  versions: VersionWithRelations[];
}

/**
 * Transform version data to FullProjectionParams format
 */
function versionToProjectionParams(version: VersionWithRelations): FullProjectionParams | null {
  if (!version.rentPlan || version.curriculumPlans.length < 2) {
    return null;
  }

  // Get FR and IB curriculum plans
  const frPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'FR');
  const ibPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'IB');

  if (!frPlan || !ibPlan) {
    return null;
  }

  // Transform students projection - ensure it's an array
  const frStudentsProjection = Array.isArray(frPlan.studentsProjection)
    ? (frPlan.studentsProjection as Array<{ year: number; students: number }>).map((sp) => ({
        year: sp.year,
        students: sp.students,
      }))
    : [];

  const ibStudentsProjection = Array.isArray(ibPlan.studentsProjection)
    ? (ibPlan.studentsProjection as Array<{ year: number; students: number }>).map((sp) => ({
        year: sp.year,
        students: sp.students,
      }))
    : [];

  // Validate that students projections are not empty
  if (frStudentsProjection.length === 0 || ibStudentsProjection.length === 0) {
    console.error('Dashboard: Missing students projection data', {
      fr: frStudentsProjection.length,
      ib: ibStudentsProjection.length,
      frPlan: frPlan.studentsProjection,
      ibPlan: ibPlan.studentsProjection,
    });
    return null;
  }

  // Helper to safely convert any value to number (handles Decimal objects)
  // This MUST be defined before it's used
  const toNumber = (value: unknown): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    // Check if it's a Decimal object
    if (value !== null && typeof value === 'object' && typeof (value as any).toNumber === 'function') {
      return (value as any).toNumber();
    }
    // Fallback
    try {
      return Number(value);
    } catch {
      return 0;
    }
  };

  // Default admin settings (should come from admin settings table)
  // Use numbers instead of Decimal objects for Web Worker serialization
  const adminSettings = {
    cpiRate: 0.03,
    discountRate: 0.08,
    taxRate: 0.20,
  };

  // Default staff cost (should come from version data)
  // Use numbers instead of Decimal objects for Web Worker serialization
  const staffCostBase = 15_000_000;
  const staffCostCpiFrequency: 1 | 2 | 3 = 2;

  // Transform capex items - convert to numbers for Web Worker
  const capexItems = version.capexItems.map((item) => ({
    year: item.year,
    amount: toNumber(item.amount), // Use helper to handle Decimal objects
  }));

  // Transform opex sub-accounts - convert to numbers for Web Worker
  const opexSubAccounts = version.opexSubAccounts.map((account) => ({
    subAccountName: account.subAccountName,
    percentOfRevenue: account.percentOfRevenue !== null ? toNumber(account.percentOfRevenue) : null,
    isFixed: account.isFixed,
    fixedAmount: account.fixedAmount !== null ? toNumber(account.fixedAmount) : null,
  }));

  return {
    curriculumPlans: [
      {
        curriculumType: 'FR',
        capacity: frPlan.capacity,
        tuitionBase: toNumber(frPlan.tuitionBase), // Use helper to handle Decimal objects
        cpiFrequency: frPlan.cpiFrequency as 1 | 2 | 3,
        studentsProjection: frStudentsProjection,
      },
      {
        curriculumType: 'IB',
        capacity: ibPlan.capacity,
        tuitionBase: toNumber(ibPlan.tuitionBase), // Use helper to handle Decimal objects
        cpiFrequency: ibPlan.cpiFrequency as 1 | 2 | 3,
        studentsProjection: ibStudentsProjection,
      },
    ],
    rentPlan: {
      rentModel: version.rentPlan.rentModel as 'FIXED_ESCALATION' | 'REVENUE_SHARE' | 'PARTNER_MODEL',
      // Ensure parameters are serialized (no Decimal objects)
      parameters: serializeRentPlanParametersForWorker(version.rentPlan.parameters as Record<string, unknown>),
    },
    staffCostBase: toNumber(staffCostBase), // Ensure it's a number, not Decimal
    staffCostCpiFrequency,
    capexItems: capexItems.map(item => ({
      year: item.year,
      amount: toNumber(item.amount), // Ensure it's a number, not Decimal
    })),
    opexSubAccounts: opexSubAccounts.map(account => ({
      subAccountName: account.subAccountName,
      percentOfRevenue: account.percentOfRevenue !== null ? toNumber(account.percentOfRevenue) : null,
      isFixed: account.isFixed,
      fixedAmount: account.fixedAmount !== null ? toNumber(account.fixedAmount) : null,
    })),
    adminSettings: {
      cpiRate: toNumber(adminSettings.cpiRate),
      discountRate: toNumber(adminSettings.discountRate),
      taxRate: toNumber(adminSettings.taxRate),
    },
    startYear: 2023,
    endYear: 2052,
  };
}

/**
 * Transform projection years to chart data format
 * Note: Data from Worker is already serialized to numbers (no Decimal objects)
 */
function transformProjectionData(projection: NonNullable<ReturnType<typeof useFinancialCalculation>['projection']>) {
  return {
    revenueRent: projection.years.map((year) => ({
      year: year.year,
      revenue: typeof year.revenue === 'number' ? year.revenue : (year.revenue as any).toNumber(),
      rent: typeof year.rent === 'number' ? year.rent : (year.rent as any).toNumber(),
    })),
    ebitda: projection.years.map((year) => ({
      year: year.year,
      ebitda: typeof year.ebitda === 'number' ? year.ebitda : (year.ebitda as any).toNumber(),
    })),
    rentLoad: projection.years.map((year) => ({
      year: year.year,
      rentLoad: typeof year.rentLoad === 'number' ? year.rentLoad : (year.rentLoad as any).toNumber(),
    })),
    enrollment: projection.years.map((year) => ({
      year: year.year,
      studentsFR: year.studentsFR,
      studentsIB: year.studentsIB,
    })),
  };
}

export function Dashboard({ versions }: DashboardProps) {
  const {
    selectedVersionId,
    setSelectedVersionId,
    setVersions,
    setProjection,
    setLoading,
    setError,
    projection,
  } = useDashboardStore();
  const { calculate, loading: calculationLoading, error: calculationError, projection: calculatedProjection } =
    useFinancialCalculation();
  
  // Cache for loaded versions (to avoid re-fetching)
  // Initialize cache safely to avoid hydration issues
  const [versionCache, setVersionCache] = useState<Map<string, VersionWithRelations>>(() => {
    if (typeof window === 'undefined') {
      // Server-side: return empty map
      return new Map<string, VersionWithRelations>();
    }
    // Client-side: initialize with provided versions
    const cache = new Map<string, VersionWithRelations>();
    if (Array.isArray(versions)) {
      versions.forEach(v => {
        if (v && v.id) {
          cache.set(v.id, v);
        }
      });
    }
    return cache;
  });
  
  // Update cache when versions prop changes (but only on client)
  useEffect(() => {
    if (typeof window !== 'undefined' && Array.isArray(versions)) {
      setVersionCache(prev => {
        const newCache = new Map(prev);
        versions.forEach(v => {
          if (v && v.id && !newCache.has(v.id)) {
            newCache.set(v.id, v);
          }
        });
        return newCache;
      });
    }
  }, [versions]);

  // Initialize store with versions
  useEffect(() => {
    setVersions(versions as any[]);
    if (versions.length > 0 && !selectedVersionId && versions[0]) {
      setSelectedVersionId(versions[0].id);
    }
  }, [versions, selectedVersionId, setVersions, setSelectedVersionId]);

  // Get selected version from cache or initial versions
  const selectedVersion = useMemo(() => {
    if (!selectedVersionId) return null;
    return versionCache.get(selectedVersionId) || versions.find((v) => v.id === selectedVersionId) || null;
  }, [versions, selectedVersionId, versionCache]);
  
  // Load version details on-demand when selected version is not in cache
  useEffect(() => {
    if (!selectedVersionId || versionCache.has(selectedVersionId)) return;
    
    let cancelled = false;
    
    // Background fetch (don't block UI with loading state)
    fetch(`/api/versions/${selectedVersionId}`)
      .then(response => response.json())
      .then(data => {
        if (!cancelled && data.success && data.data) {
          const serializedVersion = serializeVersionForClient(data.data);
          setVersionCache(prev => {
            const newCache = new Map(prev);
            newCache.set(selectedVersionId, serializedVersion);
            return newCache;
          });
        }
      })
      .catch(error => {
        if (!cancelled) {
          console.error('Failed to load version:', error);
        }
      });
    
    return () => {
      cancelled = true;
    };
  }, [selectedVersionId, versionCache]);

  // Memoize projection params to avoid recalculating on every render
  const projectionParams = useMemo(() => {
    if (!selectedVersion) return null;
    return versionToProjectionParams(selectedVersion);
  }, [selectedVersion]);

  // Debounce params to prevent too many calculations (150ms for responsive UI)
  const debouncedParams = useDebounce(projectionParams, 150);

  // Calculate projection when debounced params change
  useEffect(() => {
    if (!debouncedParams) {
      setProjection(null);
      setLoading(false);
      setError(null);
      return;
    }

    setError(null);
    setLoading(true);
    calculate(debouncedParams);
  }, [debouncedParams, calculate]);

  // Update store when calculation completes (optimized to reduce re-renders)
  useEffect(() => {
    if (calculatedProjection) {
      setProjection(calculatedProjection);
      setLoading(false);
      setError(null);
    } else if (calculationError) {
      setError(calculationError);
      setLoading(false);
    } else if (calculationLoading) {
      setLoading(true);
    }
  }, [calculationLoading, calculationError, calculatedProjection, setLoading, setError, setProjection]);

  const chartData = useMemo(() => {
    if (!projection) return null;
    return transformProjectionData(projection);
  }, [projection]);

  return (
    <div className="space-y-6">
      {/* Header with Version Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Financial projections and key metrics
          </p>
        </div>
        {versions.length > 0 && <VersionSelector versions={versions as any[]} />}
      </div>

      {/* Empty State Message */}
      {versions.length === 0 && (
        <Card className="p-6 border-dashed">
          <div className="text-center py-8">
            <p className="text-lg font-semibold text-text-primary mb-2">No versions available</p>
            <p className="text-sm text-text-secondary mb-4">
              Create a version to view dashboard data and financial projections
            </p>
            <a
              href="/versions/new"
              className="inline-flex items-center px-4 py-2 bg-accent-blue text-white rounded-md hover:bg-accent-blue/90 transition-colors font-medium"
            >
              Create New Version
            </a>
          </div>
        </Card>
      )}

      {/* KPI Grid - Always show, even when empty */}
      <KPIGrid
        projection={projection || null}
        totalVersions={versions.length}
        loading={calculationLoading}
      />

      {/* Charts Grid */}
      {chartData ? (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Revenue vs Rent Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Rent</CardTitle>
              <CardDescription>30-year projection</CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart data={chartData.revenueRent} showRent={true} />
            </CardContent>
          </Card>

          {/* EBITDA Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>EBITDA Trend</CardTitle>
              <CardDescription>Positive and negative periods</CardDescription>
            </CardHeader>
            <CardContent>
              <EBITDATrendChart data={chartData.ebitda} />
            </CardContent>
          </Card>

          {/* Rent Load % Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Rent Load %</CardTitle>
              <CardDescription>Rent as percentage of revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <RentLoadChart data={chartData.rentLoad} />
            </CardContent>
          </Card>

          {/* Enrollment Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Enrollment</CardTitle>
              <CardDescription>FR vs IB students over time</CardDescription>
            </CardHeader>
            <CardContent>
              <EnrollmentChart
                data={chartData.enrollment.map((item) => ({
                  year: item.year,
                  studentsFR: item.studentsFR || 0,
                  studentsIB: item.studentsIB || 0,
                }))}
              />
            </CardContent>
          </Card>
        </div>
      ) : calculationLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-12">
              <div className="h-96 bg-muted rounded-lg animate-pulse" />
            </Card>
          ))}
        </div>
      ) : versions.length === 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-12 border-dashed">
              <div className="h-96 flex items-center justify-center">
                <p className="text-text-tertiary text-sm">No data available</p>
              </div>
            </Card>
          ))}
        </div>
      ) : calculationError ? (
        <Card className="p-6">
          <div className="text-destructive">
            Failed to calculate projection: {calculationError}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

