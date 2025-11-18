/**
 * Simulation Client Component
 * Main component coordinating 3-panel layout and live calculations
 */

'use client';

import { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ParametersPanel } from './ParametersPanel';
import { OutputsPanel } from './OutputsPanel';
import { ComparisonPanel } from './ComparisonPanel';
import { useSimulationStore } from '@/stores/simulation-store';
import { useFinancialCalculation } from '@/hooks/useFinancialCalculation';
import type { VersionWithRelations } from '@/services/version';
import type { FullProjectionParams } from '@/lib/calculations/financial/projection';
import { toWorkerNumber } from '@/lib/utils/worker-serialize';

interface SimulationProps {
  versions?: VersionWithRelations[];
  userRole?: string;
}

/**
 * Transform simulation parameters to FullProjectionParams format
 */
function buildProjectionParams(
  parameters: ReturnType<typeof useSimulationStore.getState>['parameters']
): FullProjectionParams | null {
  if (!parameters) return null;

  // Transform opex sub-accounts - use numbers for Web Worker
  const opexSubAccounts = parameters.opex.subAccounts.map((account) => ({
    subAccountName: account.subAccountName,
    percentOfRevenue: toWorkerNumber(account.percentOfRevenue),
    isFixed: account.isFixed,
    fixedAmount: toWorkerNumber(account.fixedAmount),
  }));

  // Transform capex items - use numbers for Web Worker
  const capexItems = parameters.capex.items.map((item) => ({
    year: item.year,
    amount: toWorkerNumber(item.amount) ?? 0,
  }));

  return {
    curriculumPlans: [
      {
        curriculumType: parameters.curriculum.fr.curriculumType,
        capacity: parameters.curriculum.fr.capacity,
        tuitionBase: toWorkerNumber(parameters.curriculum.fr.tuitionBase) ?? 0,
        cpiFrequency: parameters.curriculum.fr.cpiFrequency,
        studentsProjection: parameters.curriculum.fr.studentsProjection,
      },
      {
        curriculumType: parameters.curriculum.ib.curriculumType,
        capacity: parameters.curriculum.ib.capacity,
        tuitionBase: toWorkerNumber(parameters.curriculum.ib.tuitionBase) ?? 0,
        cpiFrequency: parameters.curriculum.ib.cpiFrequency,
        studentsProjection: parameters.curriculum.ib.studentsProjection,
      },
    ],
    rentPlan: {
      rentModel: parameters.rent.rentModel,
      parameters: parameters.rent.parameters,
    },
    staffCostBase: toWorkerNumber(parameters.staffing.baseStaffCost) ?? 0,
    staffCostCpiFrequency: parameters.staffing.cpiFrequency,
    capexItems,
    opexSubAccounts,
    adminSettings: {
      cpiRate: toWorkerNumber(parameters.admin.cpiRate) ?? 0.03,
      discountRate: toWorkerNumber(parameters.admin.discountRate) ?? 0.08,
      taxRate: toWorkerNumber(parameters.admin.taxRate) ?? 0.20,
    },
    startYear: 2023,
    endYear: 2052,
  };
}

export function Simulation({ versions: initialVersions, userRole = 'VIEWER' }: SimulationProps) {
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

  // Local state for versions
  const [lightVersions, setLightVersions] = useState<Array<{ id: string; name: string }>>([]);
  const [versions, setVersionsState] = useState<VersionWithRelations[]>(initialVersions || []);
  const [versionsLoading, setVersionsLoading] = useState(!initialVersions);
  const [versionDetailsCache, setVersionDetailsCache] = useState<Map<string, VersionWithRelations>>(new Map());
  
  // Track if versions have been fetched to prevent duplicate fetches (React Strict Mode)
  const versionsFetchedRef = useRef(false);

  // Fetch lightweight list of versions (FAST - no details)
  useEffect(() => {
    if (initialVersions) {
      setVersionsState(initialVersions);
      setLightVersions(initialVersions.map(v => ({ id: v.id, name: v.name })));
      setVersionsLoading(false);
      return;
    }

    // Prevent duplicate fetches (React Strict Mode runs effects twice in development)
    if (versionsFetchedRef.current) {
      return;
    }
    versionsFetchedRef.current = true;

    console.log('📡 Fetching versions list (lightweight)...');
    const fetchStart = performance.now();

    fetch('/api/versions?page=1&limit=100&lightweight=true')
      .then(response => response.json())
      .then(data => {
        const fetchTime = performance.now() - fetchStart;
        console.log(`✅ Versions list loaded in ${fetchTime.toFixed(0)}ms`);
        
        if (data.success && data.data?.versions) {
          const lightList = data.data.versions.map((v: any) => ({
            id: v.id,
            name: v.name,
          }));
          setLightVersions(lightList);
        }
        setVersionsLoading(false);
      })
      .catch(error => {
        console.error('❌ Failed to fetch versions:', error);
        setVersionsLoading(false);
      });
  }, [initialVersions]);

  // Fetch full details for selected version ONLY (lazy loading)
  useEffect(() => {
    if (!baseVersionId || lightVersions.length === 0) {
      return;
    }

    // Check if already in cache or state
    const versionInState = versions.find(v => v.id === baseVersionId);
    if (versionInState && 'curriculumPlans' in versionInState && Array.isArray((versionInState as VersionWithRelations).curriculumPlans)) {
      return; // Already have full details
    }

    if (versionDetailsCache.has(baseVersionId)) {
      const cached = versionDetailsCache.get(baseVersionId)!;
      setVersionsState(prev => {
        const index = prev.findIndex(v => v.id === baseVersionId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = cached;
          return updated;
        }
        return [...prev, cached];
      });
      return;
    }

    // Fetch full details
    console.log(`📡 Fetching full details for selected version...`);
    const fetchStart = performance.now();

    fetch(`/api/versions/${baseVersionId}`)
      .then(res => res.json())
      .then(detail => {
        const fetchTime = performance.now() - fetchStart;
        console.log(`✅ Full details loaded in ${fetchTime.toFixed(0)}ms`);
        
        if (detail.success && detail.data) {
          const detailedVersion = detail.data as VersionWithRelations;
          
          // Update cache
          setVersionDetailsCache(prev => new Map(prev).set(baseVersionId, detailedVersion));
          
          // Update state
          setVersionsState(prev => {
            const index = prev.findIndex(v => v.id === baseVersionId);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = detailedVersion;
              return updated;
            }
            return [...prev, detailedVersion];
          });
        }
      })
      .catch(error => {
        console.error('❌ Failed to fetch version details:', error);
      });
  }, [baseVersionId, lightVersions, versionDetailsCache, versions]);

  // Initialize with first version if available (use lightVersions for initial selection)
  useEffect(() => {
    if (lightVersions.length > 0 && !baseVersionId && lightVersions[0]) {
      setBaseVersionId(lightVersions[0].id);
    }
  }, [lightVersions, baseVersionId]);

  // Update parameters when version with full details is available
  useEffect(() => {
    if (baseVersionId && versions.length > 0) {
      const version = versions.find((v) => 
        v.id === baseVersionId && 
        'curriculumPlans' in v && 
        Array.isArray((v as VersionWithRelations).curriculumPlans)
      ) as VersionWithRelations | undefined;
      
      if (version && version !== baseVersion) {
        setBaseVersion(version);
        initializeParameters(version);
      }
    }
  }, [baseVersionId, versions, baseVersion, setBaseVersion, initializeParameters]);

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

  // Show skeleton while versions are loading
  if (versionsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-screen" />
          <Skeleton className="h-screen" />
          <Skeleton className="h-screen" />
        </div>
      </div>
    );
  }

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
            {(lightVersions.length > 0 ? lightVersions : versions.map(v => ({ id: v.id, name: v.name }))).map((version) => (
              <SelectItem key={version.id} value={version.id}>
                {version.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {lightVersions.length === 0 ? (
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

