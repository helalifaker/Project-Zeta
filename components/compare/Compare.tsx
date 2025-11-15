/**
 * Compare Client Component
 * Client component for version comparison
 */

'use client';

import { useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { VersionSelectorList } from './VersionSelectorList';
import { ComparisonTable } from './ComparisonTable';
import { ComparisonCharts } from './ComparisonCharts';
import { useComparisonStore } from '@/stores/comparison-store';
import { useFinancialCalculation } from '@/hooks/useFinancialCalculation';
import type { VersionWithRelations } from '@/services/version';
import type { FullProjectionParams } from '@/lib/calculations/financial/projection';
import { toWorkerNumber, serializeRentPlanParametersForWorker } from '@/lib/utils/worker-serialize';

interface CompareProps {
  versions: VersionWithRelations[];
}

/**
 * Transform version data to FullProjectionParams format
 * (Reused from Dashboard.tsx)
 */
function versionToProjectionParams(version: VersionWithRelations): FullProjectionParams | null {
  if (!version.rentPlan || version.curriculumPlans.length < 2) {
    return null;
  }

  const frPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'FR');
  const ibPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'IB');

  if (!frPlan || !ibPlan) {
    return null;
  }

  const frStudentsProjection = (
    frPlan.studentsProjection as Array<{ year: number; students: number }>
  ).map((sp) => ({ year: sp.year, students: sp.students }));

  const ibStudentsProjection = (
    ibPlan.studentsProjection as Array<{ year: number; students: number }>
  ).map((sp) => ({ year: sp.year, students: sp.students }));

  // Use numbers instead of Decimal objects for Web Worker serialization
  const adminSettings = {
    cpiRate: 0.03,
    discountRate: 0.08,
    taxRate: 0.20,
  };

  const staffCostBase = 15_000_000;
  const staffCostCpiFrequency: 1 | 2 | 3 = 2;

  const capexItems = version.capexItems.map((item) => ({
    year: item.year,
    amount: toWorkerNumber(item.amount) ?? 0,
  }));

  const opexSubAccounts = version.opexSubAccounts.map((account) => ({
    subAccountName: account.subAccountName,
    percentOfRevenue: toWorkerNumber(account.percentOfRevenue),
    isFixed: account.isFixed,
    fixedAmount: toWorkerNumber(account.fixedAmount),
  }));

  return {
    curriculumPlans: [
      {
        curriculumType: 'FR',
        capacity: frPlan.capacity,
        tuitionBase: toWorkerNumber(frPlan.tuitionBase) ?? 0,
        cpiFrequency: frPlan.cpiFrequency as 1 | 2 | 3,
        studentsProjection: frStudentsProjection,
      },
      {
        curriculumType: 'IB',
        capacity: ibPlan.capacity,
        tuitionBase: toWorkerNumber(ibPlan.tuitionBase) ?? 0,
        cpiFrequency: ibPlan.cpiFrequency as 1 | 2 | 3,
        studentsProjection: ibStudentsProjection,
      },
    ],
    rentPlan: {
      rentModel: version.rentPlan.rentModel as 'FIXED_ESCALATION' | 'REVENUE_SHARE' | 'PARTNER_MODEL',
      parameters: serializeRentPlanParametersForWorker(version.rentPlan.parameters as Record<string, unknown>),
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

export function Compare({ versions }: CompareProps) {
  const {
    selectedVersionIds,
    setVersions,
    projections,
    setProjection,
    setLoading,
    setError,
  } = useComparisonStore();

  const { calculate, projection: calculatedProjection } =
    useFinancialCalculation();

  // Initialize store with versions
  useEffect(() => {
    setVersions(versions as any[]);
  }, [versions, setVersions]);

  // Get selected versions
  const selectedVersions = useMemo(() => {
    return versions.filter((v) => selectedVersionIds.includes(v.id));
  }, [versions, selectedVersionIds]);

  // Calculate projections for selected versions
  useEffect(() => {
    if (selectedVersions.length === 0) {
      return;
    }

    selectedVersions.forEach((version) => {
      // Skip if projection already exists
      if (projections.has(version.id)) {
        return;
      }

      const params = versionToProjectionParams(version);
      if (!params) {
        setError(`Invalid data for version: ${version.name}`);
        return;
      }

      setLoading(true);
      // Calculate projection (simplified - in production, we'd need to track multiple calculations)
      calculate(params);
    });
  }, [selectedVersions, calculate, setLoading, setError, projections]);

  // Update projection when calculation completes
  useEffect(() => {
    if (calculatedProjection && selectedVersions.length > 0) {
      // Match the calculated projection to the correct version
      // This is simplified - in production, we'd need to track which version is being calculated
      const version = selectedVersions[selectedVersions.length - 1];
      if (version && !projections.has(version.id)) {
        setProjection(version.id, calculatedProjection);
      }
    }
  }, [calculatedProjection, selectedVersions, projections, setProjection]);

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    alert('PDF export functionality will be implemented');
  };

  const handleExportExcel = () => {
    // TODO: Implement Excel export
    alert('Excel export functionality will be implemented');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Version Comparison</h1>
          <p className="text-muted-foreground mt-1">
            Compare financial projections across multiple versions
          </p>
        </div>
        {selectedVersions.length >= 2 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        )}
      </div>

      {/* Version Selector */}
      <VersionSelectorList versions={versions as any[]} />

      {/* Comparison Content */}
      {selectedVersions.length >= 2 ? (
        <>
          {/* Comparison Table */}
          <ComparisonTable versions={selectedVersions} projections={projections} />

          {/* Comparison Charts */}
          <ComparisonCharts versions={selectedVersions} projections={projections} />
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            Select at least 2 versions to compare (up to 4 versions)
          </CardContent>
        </Card>
      )}
    </div>
  );
}

