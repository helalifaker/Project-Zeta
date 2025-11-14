/**
 * Simulation Client Component
 * Main component coordinating 3-panel layout and live calculations
 */

'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ParametersPanel } from './ParametersPanel';
import { OutputsPanel } from './OutputsPanel';
import { ComparisonPanel } from './ComparisonPanel';
import { useSimulationStore } from '@/stores/simulation-store';
import { useFinancialCalculation } from '@/hooks/useFinancialCalculation';
import type { VersionWithRelations } from '@/services/version';
import type { FullProjectionParams } from '@/lib/calculations/financial/projection';
import { toDecimal } from '@/lib/calculations/decimal-helpers';

interface SimulationProps {
  versions: VersionWithRelations[];
  userRole: string;
}

/**
 * Transform simulation parameters to FullProjectionParams format
 */
function buildProjectionParams(
  parameters: ReturnType<typeof useSimulationStore.getState>['parameters']
): FullProjectionParams | null {
  if (!parameters) return null;

  // Transform opex sub-accounts
  const opexSubAccounts = parameters.opex.subAccounts.map((account) => ({
    subAccountName: account.subAccountName,
    percentOfRevenue:
      account.percentOfRevenue !== null ? toDecimal(account.percentOfRevenue) : null,
    isFixed: account.isFixed,
    fixedAmount: account.fixedAmount !== null ? toDecimal(account.fixedAmount) : null,
  }));

  // Transform capex items
  const capexItems = parameters.capex.items.map((item) => ({
    year: item.year,
    amount: toDecimal(item.amount),
  }));

  return {
    curriculumPlans: [
      {
        curriculumType: parameters.curriculum.fr.curriculumType,
        capacity: parameters.curriculum.fr.capacity,
        tuitionBase: toDecimal(parameters.curriculum.fr.tuitionBase),
        cpiFrequency: parameters.curriculum.fr.cpiFrequency,
        studentsProjection: parameters.curriculum.fr.studentsProjection,
      },
      {
        curriculumType: parameters.curriculum.ib.curriculumType,
        capacity: parameters.curriculum.ib.capacity,
        tuitionBase: toDecimal(parameters.curriculum.ib.tuitionBase),
        cpiFrequency: parameters.curriculum.ib.cpiFrequency,
        studentsProjection: parameters.curriculum.ib.studentsProjection,
      },
    ],
    rentPlan: {
      rentModel: parameters.rent.rentModel,
      parameters: parameters.rent.parameters,
    },
    staffCostBase: toDecimal(parameters.staffing.baseStaffCost),
    staffCostCpiFrequency: parameters.staffing.cpiFrequency,
    capexItems,
    opexSubAccounts,
    adminSettings: {
      cpiRate: toDecimal(parameters.admin.cpiRate),
      discountRate: toDecimal(parameters.admin.discountRate),
      taxRate: toDecimal(parameters.admin.taxRate),
    },
    startYear: 2023,
    endYear: 2052,
  };
}

export function Simulation({ versions, userRole }: SimulationProps) {
  const {
    baseVersionId,
    setBaseVersionId,
    setBaseVersion,
    baseVersion,
    parameters,
    initializeParameters,
    setProjection,
    setBaseProjection,
    setLoading,
    setError,
    projection,
  } = useSimulationStore();

  const { calculate, loading: calculationLoading, error: calculationError, projection: calculatedProjection } =
    useFinancialCalculation();

  // Initialize with first version if available
  useEffect(() => {
    if (versions.length > 0 && !baseVersionId && versions[0]) {
      setBaseVersionId(versions[0].id);
      setBaseVersion(versions[0]);
      initializeParameters(versions[0]);
    }
  }, [versions, baseVersionId, setBaseVersionId, setBaseVersion, initializeParameters]);

  // Update parameters when version changes
  useEffect(() => {
    if (baseVersionId && versions.length > 0) {
      const version = versions.find((v) => v.id === baseVersionId);
      if (version) {
        setBaseVersion(version);
        initializeParameters(version);
      }
    }
  }, [baseVersionId, versions, setBaseVersion, initializeParameters]);

  // Calculate base projection when version loads
  useEffect(() => {
    if (!baseVersion || !parameters) return;

    const params = buildProjectionParams(parameters);
    if (!params) return;

    // Calculate base projection (only once)
    setLoading(true);
    setError(null);
    calculate(params);
  }, [baseVersion, calculate, setLoading, setError]); // Only depend on baseVersion, not parameters

  // Update base projection when calculation completes (first time only)
  useEffect(() => {
    if (calculatedProjection && baseVersion && !useSimulationStore.getState().baseProjection) {
      setBaseProjection(calculatedProjection);
      setProjection(calculatedProjection);
    }
  }, [calculatedProjection, baseVersion, setBaseProjection, setProjection]);

  // Debounced calculation trigger for parameter changes
  const debounceTimerRef = useMemo(() => ({ current: null as NodeJS.Timeout | null }), []);

  const triggerCalculation = useCallback(() => {
    if (!parameters) return;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce calculation by 300ms
    debounceTimerRef.current = setTimeout(() => {
      const params = buildProjectionParams(parameters);

      if (!params) {
        setError('Invalid parameters');
        return;
      }

      setLoading(true);
      setError(null);
      calculate(params);
    }, 300);
  }, [parameters, calculate, setLoading, setError, debounceTimerRef]);

  // Trigger calculation when parameters change (but not on initial load)
  useEffect(() => {
    if (parameters && baseVersion && useSimulationStore.getState().baseProjection) {
      triggerCalculation();
    }
  }, [parameters, baseVersion, triggerCalculation]);

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
    setBaseVersionId(versionId);
    const version = versions.find((v) => v.id === versionId);
    if (version) {
      setBaseVersion(version);
      initializeParameters(version);
      // Reset base projection when version changes
      setBaseProjection(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Version Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Simulation Sandbox</h1>
          <p className="text-muted-foreground mt-1">
            Edit any parameter and see live financial impact in real-time
          </p>
        </div>
        <Select
          {...(baseVersionId && { value: baseVersionId })}
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
            No versions available. Create a version to use the simulation sandbox.
          </CardContent>
        </Card>
      ) : !baseVersion || !parameters ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            Select a base version to start simulating
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Parameters (3 columns) */}
          <div className="lg:col-span-3">
            <ParametersPanel userRole={userRole} />
          </div>

          {/* Center Panel: Outputs (6 columns) */}
          <div className="lg:col-span-6">
            <OutputsPanel
              version={baseVersion}
              projection={projection}
              loading={calculationLoading}
            />
          </div>

          {/* Right Panel: Comparison (3 columns) */}
          <div className="lg:col-span-3">
            <ComparisonPanel userRole={userRole} />
          </div>
        </div>
      )}
    </div>
  );
}

