/**
 * Tuition Simulator Client Component
 * Main component coordinating 3-panel layout and live calculations
 */

'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RentContextPanel } from './RentContextPanel';
import { ChartsPanel } from './ChartsPanel';
import { TuitionControlsPanel } from './TuitionControlsPanel';
import { useTuitionSimulatorStore } from '@/stores/tuition-simulator-store';
import { useFinancialCalculation } from '@/hooks/useFinancialCalculation';
import type { VersionWithRelations } from '@/services/version';
import type { FullProjectionParams } from '@/lib/calculations/financial/projection';
import { toDecimal } from '@/lib/calculations/decimal-helpers';

interface TuitionSimulatorProps {
  versions: VersionWithRelations[];
}

/**
 * Transform version data + simulator adjustments to FullProjectionParams format
 */
function buildProjectionParams(
  version: VersionWithRelations,
  tuitionAdjustments: { fr: number; ib: number },
  cpiFrequency: { fr: 1 | 2 | 3; ib: 1 | 2 | 3 },
  enrollmentProjections: {
    fr: Array<{ year: number; students: number }>;
    ib: Array<{ year: number; students: number }>;
  }
): FullProjectionParams | null {
  if (!version.rentPlan || version.curriculumPlans.length < 2) {
    return null;
  }

  const frPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'FR');
  const ibPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'IB');

  if (!frPlan || !ibPlan) {
    return null;
  }

  // Calculate adjusted tuition bases
  const frBaseTuition = toDecimal(frPlan.tuitionBase);
  const ibBaseTuition = toDecimal(ibPlan.tuitionBase);
  const adjustedFrTuition = frBaseTuition.times(1 + tuitionAdjustments.fr / 100);
  const adjustedIbTuition = ibBaseTuition.times(1 + tuitionAdjustments.ib / 100);

  // Use enrollment projections from simulator (fallback to version's original if empty)
  const frStudentsProjection =
    enrollmentProjections.fr.length > 0
      ? enrollmentProjections.fr
      : (frPlan.studentsProjection as Array<{ year: number; students: number }>);
  const ibStudentsProjection =
    enrollmentProjections.ib.length > 0
      ? enrollmentProjections.ib
      : (ibPlan.studentsProjection as Array<{ year: number; students: number }>);

  // Default admin settings
  const adminSettings = {
    cpiRate: toDecimal(0.03),
    discountRate: toDecimal(0.08),
    taxRate: toDecimal(0.20),
  };

  // Default staff cost
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
        tuitionBase: adjustedFrTuition,
        cpiFrequency: cpiFrequency.fr,
        studentsProjection: frStudentsProjection,
      },
      {
        curriculumType: 'IB',
        capacity: ibPlan.capacity,
        tuitionBase: adjustedIbTuition,
        cpiFrequency: cpiFrequency.ib,
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

export function TuitionSimulator({ versions }: TuitionSimulatorProps) {
  const {
    selectedVersionId,
    setSelectedVersionId,
    baseVersion,
    setBaseVersion,
    tuitionAdjustments,
    cpiFrequency,
    enrollmentProjections,
    setProjection,
    setLoading,
    setError,
    projection,
  } = useTuitionSimulatorStore();

  const { calculate, loading: calculationLoading, error: calculationError, projection: calculatedProjection } =
    useFinancialCalculation();

  // Initialize with first version if available
  useEffect(() => {
    if (versions.length > 0 && !selectedVersionId && versions[0]) {
      setSelectedVersionId(versions[0].id);
      setBaseVersion(versions[0]);
    }
  }, [versions, selectedVersionId, setSelectedVersionId, setBaseVersion]);

  // Update base version when selection changes
  useEffect(() => {
    if (selectedVersionId && versions.length > 0) {
      const version = versions.find((v) => v.id === selectedVersionId);
      if (version) {
        setBaseVersion(version);
      }
    }
  }, [selectedVersionId, versions, setBaseVersion]);

  // Debounced calculation trigger
  const debounceTimerRef = useMemo(() => ({ current: null as NodeJS.Timeout | null }), []);

  const triggerCalculation = useCallback(() => {
    if (!baseVersion) return;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce calculation by 300ms
    debounceTimerRef.current = setTimeout(() => {
      const params = buildProjectionParams(
        baseVersion,
        tuitionAdjustments,
        cpiFrequency,
        enrollmentProjections
      );

      if (!params) {
        setError('Invalid version data');
        return;
      }

      setLoading(true);
      setError(null);
      calculate(params);
    }, 300);
  }, [baseVersion, tuitionAdjustments, cpiFrequency, enrollmentProjections, calculate, setLoading, setError, debounceTimerRef]);

  // Trigger calculation when parameters change
  useEffect(() => {
    if (baseVersion) {
      triggerCalculation();
    }
  }, [baseVersion, tuitionAdjustments, cpiFrequency, enrollmentProjections, triggerCalculation]);

  // Update projection when calculation completes
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

  const handleVersionChange = (versionId: string) => {
    setSelectedVersionId(versionId);
    const version = versions.find((v) => v.id === versionId);
    if (version) {
      setBaseVersion(version);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Version Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tuition Simulator</h1>
          <p className="text-muted-foreground mt-1">
            Adjust tuition and enrollment to see financial impact in real-time
          </p>
        </div>
        <Select
          {...(selectedVersionId && { value: selectedVersionId })}
          onValueChange={handleVersionChange}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select base version" />
          </SelectTrigger>
          <SelectContent>
            {versions.map((version) => (
              <SelectItem key={version.id} value={version.id}>
                {version.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {versions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No versions available. Create a version to use the tuition simulator.
          </CardContent>
        </Card>
      ) : !baseVersion ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            Select a base version to start simulating
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Rent Context (3 columns) */}
          <div className="lg:col-span-3">
            <RentContextPanel version={baseVersion} projection={projection} />
          </div>

          {/* Center Panel: Charts & Table (6 columns) */}
          <div className="lg:col-span-6">
            <ChartsPanel version={baseVersion} projection={projection} loading={calculationLoading} />
          </div>

          {/* Right Panel: Controls (3 columns) */}
          <div className="lg:col-span-3">
            <TuitionControlsPanel version={baseVersion} projection={projection} />
          </div>
        </div>
      )}
    </div>
  );
}

