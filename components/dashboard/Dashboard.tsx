/**
 * Dashboard Client Component
 * Client component for displaying dashboard with KPIs and charts
 */

'use client';

import { useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { KPIGrid } from './KPIGrid';
import { VersionSelector } from './VersionSelector';
import { useDashboardStore } from '@/stores/dashboard-store';
import { useFinancialCalculation } from '@/hooks/useFinancialCalculation';
import type { VersionWithRelations } from '@/services/version';
import type { FullProjectionParams } from '@/lib/calculations/financial/projection';
import { toDecimal } from '@/lib/calculations/decimal-helpers';

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

  // Transform students projection
  const frStudentsProjection = (
    frPlan.studentsProjection as Array<{ year: number; students: number }>
  ).map((sp) => ({ year: sp.year, students: sp.students }));

  const ibStudentsProjection = (
    ibPlan.studentsProjection as Array<{ year: number; students: number }>
  ).map((sp) => ({ year: sp.year, students: sp.students }));

  // Default admin settings (should come from admin settings table)
  const adminSettings = {
    cpiRate: toDecimal(0.03),
    discountRate: toDecimal(0.08),
    taxRate: toDecimal(0.20),
  };

  // Default staff cost (should come from version data)
  const staffCostBase = toDecimal(15_000_000);
  const staffCostCpiFrequency: 1 | 2 | 3 = 2;

  // Transform capex items
  const capexItems = version.capexItems.map((item) => ({
    year: item.year,
    amount: toDecimal(item.amount),
  }));

  // Transform opex sub-accounts
  const opexSubAccounts = version.opexSubAccounts.map((account) => ({
    subAccountName: account.subAccountName,
    percentOfRevenue:
      account.percentOfRevenue !== null ? toDecimal(account.percentOfRevenue) : null,
    isFixed: account.isFixed,
    fixedAmount: account.fixedAmount !== null ? toDecimal(account.fixedAmount) : null,
  }));

  return {
    curriculumPlans: [
      {
        curriculumType: 'FR',
        capacity: frPlan.capacity,
        tuitionBase: toDecimal(frPlan.tuitionBase),
        cpiFrequency: frPlan.cpiFrequency as 1 | 2 | 3,
        studentsProjection: frStudentsProjection,
      },
      {
        curriculumType: 'IB',
        capacity: ibPlan.capacity,
        tuitionBase: toDecimal(ibPlan.tuitionBase),
        cpiFrequency: ibPlan.cpiFrequency as 1 | 2 | 3,
        studentsProjection: ibStudentsProjection,
      },
    ],
    rentPlan: {
      rentModel: version.rentPlan.rentModel as 'FIXED_ESCALATION' | 'REVENUE_SHARE' | 'PARTNER_MODEL',
      parameters: version.rentPlan.parameters as Record<string, unknown>,
    },
    staffCostBase,
    staffCostCpiFrequency,
    capexItems,
    opexSubAccounts,
    adminSettings,
    startYear: 2023,
    endYear: 2052,
  };
}

/**
 * Transform projection years to chart data format
 */
function transformProjectionData(projection: NonNullable<ReturnType<typeof useFinancialCalculation>['projection']>) {
  return {
    revenueRent: projection.years.map((year) => ({
      year: year.year,
      revenue: year.revenue.toNumber(),
      rent: year.rent.toNumber(),
    })),
    ebitda: projection.years.map((year) => ({
      year: year.year,
      ebitda: year.ebitda.toNumber(),
    })),
    rentLoad: projection.years.map((year) => ({
      year: year.year,
      rentLoad: year.rentLoad.toNumber(),
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

  // Initialize store with versions
  useEffect(() => {
    setVersions(versions as any[]);
    if (versions.length > 0 && !selectedVersionId && versions[0]) {
      setSelectedVersionId(versions[0].id);
    }
  }, [versions, selectedVersionId, setVersions, setSelectedVersionId]);

  // Get selected version
  const selectedVersion = useMemo(() => {
    return versions.find((v) => v.id === selectedVersionId);
  }, [versions, selectedVersionId]);

  // Calculate projection when version changes
  useEffect(() => {
    if (!selectedVersion) {
      setProjection(null);
      return;
    }

    const params = versionToProjectionParams(selectedVersion);
    if (!params) {
      setError('Invalid version data');
      setProjection(null);
      return;
    }

    setLoading(true);
    setError(null);
    calculate(params);
  }, [selectedVersion, calculate, setLoading, setError, setProjection]);

  // Update store when calculation completes
  useEffect(() => {
    if (calculationLoading) {
      setLoading(true);
    } else {
      setLoading(false);
    }

    if (calculationError) {
      setError(calculationError);
    } else {
      setError(null);
    }

    if (calculatedProjection) {
      setProjection(calculatedProjection);
    }
  }, [calculationLoading, calculationError, calculatedProjection, setLoading, setError, setProjection]);

  const chartData = useMemo(() => {
    if (!projection) return null;
    return transformProjectionData(projection);
  }, [projection]);

  if (versions.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">No versions available</p>
        <p className="text-sm text-muted-foreground mt-2">
          Create a version to view dashboard data
        </p>
      </Card>
    );
  }

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
        <VersionSelector versions={versions as any[]} />
      </div>

      {/* KPI Grid */}
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

