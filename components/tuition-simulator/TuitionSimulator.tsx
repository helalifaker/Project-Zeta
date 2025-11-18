/**
 * Tuition Simulator Client Component
 * Main component coordinating 3-panel layout and live calculations
 */

'use client';

import { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { RentContextPanel } from './RentContextPanel';
import { ChartsPanel } from './ChartsPanel';
import { TuitionControlsPanel } from './TuitionControlsPanel';
import { useTuitionSimulatorStore } from '@/stores/tuition-simulator-store';
import { useFinancialCalculation } from '@/hooks/useFinancialCalculation';
import type { VersionWithRelations } from '@/services/version';
import type { FullProjectionParams } from '@/lib/calculations/financial/projection';
import { toWorkerNumber, serializeRentPlanParametersForWorker } from '@/lib/utils/worker-serialize';

interface TuitionSimulatorProps {
  versions?: VersionWithRelations[];
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
  if (!version.rentPlan || version.curriculumPlans.length < 1) {
    return null;
  }

  const frPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'FR');
  if (!frPlan) {
    return null;
  }

  const ibPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'IB');
  const isIBEnabled = ibPlan && ibPlan.capacity > 0;

  // Calculate adjusted tuition bases - convert to numbers for Web Worker
  const frBaseTuition = toWorkerNumber(frPlan.tuitionBase) ?? 0;
  const ibBaseTuition = toWorkerNumber(ibPlan.tuitionBase) ?? 0;
  const adjustedFrTuition = frBaseTuition * (1 + tuitionAdjustments.fr / 100);
  const adjustedIbTuition = ibBaseTuition * (1 + tuitionAdjustments.ib / 100);

  // Use enrollment projections from simulator (fallback to version's original if empty)
  const frStudentsProjection =
    enrollmentProjections.fr.length > 0
      ? enrollmentProjections.fr
      : (frPlan.studentsProjection as Array<{ year: number; students: number }>);
  const ibStudentsProjection =
    isIBEnabled && ibPlan
      ? (enrollmentProjections.ib.length > 0
          ? enrollmentProjections.ib
          : (ibPlan.studentsProjection as Array<{ year: number; students: number }>))
      : [];

  // Default admin settings - use numbers for Web Worker
  const adminSettings = {
    cpiRate: 0.03,
    discountRate: 0.08,
    taxRate: 0.20,
  };

  // Default staff cost - use numbers for Web Worker
  const staffCostBase = 15_000_000;
  const staffCostCpiFrequency: 1 | 2 | 3 = 2;

  // Transform capex items - use numbers for Web Worker
  const capexItems = version.capexItems.map((item) => ({
    year: item.year,
    amount: toWorkerNumber(item.amount) ?? 0,
  }));

  // Transform opex sub-accounts - use numbers for Web Worker
  const opexSubAccounts = version.opexSubAccounts.map((account) => ({
    subAccountName: account.subAccountName,
    percentOfRevenue: toWorkerNumber(account.percentOfRevenue),
    isFixed: account.isFixed,
    fixedAmount: toWorkerNumber(account.fixedAmount),
  }));

  const curriculumPlans = [
    {
      curriculumType: 'FR',
      capacity: frPlan.capacity,
      tuitionBase: adjustedFrTuition,
      cpiFrequency: cpiFrequency.fr,
      studentsProjection: frStudentsProjection,
    },
  ];

  // Only include IB if enabled
  if (isIBEnabled && ibPlan) {
    curriculumPlans.push({
      curriculumType: 'IB',
      capacity: ibPlan.capacity,
      tuitionBase: adjustedIbTuition,
      cpiFrequency: cpiFrequency.ib,
      studentsProjection: ibStudentsProjection,
    });
  }

  return {
    curriculumPlans,
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

export function TuitionSimulator({ versions: initialVersions }: TuitionSimulatorProps) {
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
    if (!selectedVersionId || lightVersions.length === 0) {
      return;
    }

    // Check if already in cache or state
    const versionInState = versions.find(v => v.id === selectedVersionId);
    if (versionInState && 'curriculumPlans' in versionInState && Array.isArray((versionInState as VersionWithRelations).curriculumPlans)) {
      return; // Already have full details
    }

    if (versionDetailsCache.has(selectedVersionId)) {
      const cached = versionDetailsCache.get(selectedVersionId)!;
      setVersionsState(prev => {
        const index = prev.findIndex(v => v.id === selectedVersionId);
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

    fetch(`/api/versions/${selectedVersionId}`)
      .then(res => res.json())
      .then(detail => {
        const fetchTime = performance.now() - fetchStart;
        console.log(`✅ Full details loaded in ${fetchTime.toFixed(0)}ms`);
        
        if (detail.success && detail.data) {
          const detailedVersion = detail.data as VersionWithRelations;
          
          // Update cache
          setVersionDetailsCache(prev => new Map(prev).set(selectedVersionId, detailedVersion));
          
          // Update state
          setVersionsState(prev => {
            const index = prev.findIndex(v => v.id === selectedVersionId);
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
  }, [selectedVersionId, lightVersions, versionDetailsCache, versions]);

  // Initialize with first version if available (use lightVersions for initial selection)
  useEffect(() => {
    if (lightVersions.length > 0 && !selectedVersionId && lightVersions[0]) {
      setSelectedVersionId(lightVersions[0].id);
    }
  }, [lightVersions, selectedVersionId]);

  // Update base version when selection changes (only if we have full details)
  useEffect(() => {
    if (selectedVersionId && versions.length > 0) {
      const version = versions.find((v) => 
        v.id === selectedVersionId && 
        'curriculumPlans' in v && 
        Array.isArray((v as VersionWithRelations).curriculumPlans)
      ) as VersionWithRelations | undefined;
      
      if (version && version !== baseVersion) {
        setBaseVersion(version);
      }
    }
  }, [selectedVersionId, versions, baseVersion, setBaseVersion]);

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

