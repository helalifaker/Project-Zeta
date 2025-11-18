/**
 * Compare Client Component
 * Client component for version comparison
 */

'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
  versions?: VersionWithRelations[];
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

export function Compare({ versions: initialVersions }: CompareProps) {
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
          setVersions(lightList as any); // For selector - will be replaced with full details
        }
        setVersionsLoading(false);
      })
      .catch(error => {
        console.error('❌ Failed to fetch versions:', error);
        setVersionsLoading(false);
      });
  }, [initialVersions]);

  // Fetch full details for selected versions ONLY (lazy loading)
  useEffect(() => {
    if (selectedVersionIds.length === 0 || lightVersions.length === 0) {
      return;
    }

    // First, load any cached versions into state
    const cachedVersions: VersionWithRelations[] = [];
    selectedVersionIds.forEach(id => {
      if (versionDetailsCache.has(id)) {
        const cached = versionDetailsCache.get(id)!;
        cachedVersions.push(cached);
      }
    });

    if (cachedVersions.length > 0) {
      setVersionsState(prev => {
        const updated = [...prev];
        cachedVersions.forEach(cached => {
          const index = updated.findIndex(v => v.id === cached.id);
          if (index >= 0) {
            updated[index] = cached;
          } else {
            updated.push(cached);
          }
        });
        return updated;
      });
    }

    const fetchDetailsForSelected = async () => {
      const missingIds = selectedVersionIds.filter(id => {
        // Check cache first
        if (versionDetailsCache.has(id)) {
          return false;
        }
        // Check if version in state has full details
        const versionInState = versions.find(v => v.id === id);
        if (versionInState && 'curriculumPlans' in versionInState && Array.isArray((versionInState as VersionWithRelations).curriculumPlans)) {
          return false;
        }
        return true;
      });

      if (missingIds.length === 0) {
        return; // All selected versions already have details
      }

      console.log(`📡 Fetching full details for ${missingIds.length} selected version(s)...`);
      const fetchStart = performance.now();

      const detailPromises = missingIds.map((id) =>
        fetch(`/api/versions/${id}`)
          .then(res => res.json())
          .then(detail => detail.success ? detail.data : null)
          .catch(() => null)
      );

      const detailedVersions = (await Promise.all(detailPromises)).filter(Boolean) as VersionWithRelations[];
      const fetchTime = performance.now() - fetchStart;
      console.log(`✅ Full details loaded in ${fetchTime.toFixed(0)}ms`);

      // Update cache
      const newCache = new Map(versionDetailsCache);
      detailedVersions.forEach(v => newCache.set(v.id, v));
      setVersionDetailsCache(newCache);

      // Update versions state with full details
      setVersionsState(prev => {
        const updated = [...prev];
        detailedVersions.forEach(detailed => {
          const index = updated.findIndex(v => v.id === detailed.id);
          if (index >= 0) {
            updated[index] = detailed;
          } else {
            updated.push(detailed);
          }
        });
        return updated;
      });

      // Also update store with full details
      setVersions(detailedVersions as any[]);
    };

    fetchDetailsForSelected();
  }, [selectedVersionIds, lightVersions, versionDetailsCache, versions, setVersions]);

  // Initialize store with light versions for selector
  useEffect(() => {
    if (lightVersions.length > 0) {
      setVersions(lightVersions as any[]);
    }
  }, [lightVersions, setVersions]);

  // Get selected versions (only those with full details)
  const selectedVersions = useMemo(() => {
    return versions.filter((v) => 
      selectedVersionIds.includes(v.id) && 
      'curriculumPlans' in v && 
      Array.isArray((v as VersionWithRelations).curriculumPlans)
    ) as VersionWithRelations[];
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

  // Show skeleton while versions are loading
  if (versionsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

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

      {/* Version Selector - use light versions for fast rendering */}
      <VersionSelectorList versions={lightVersions.length > 0 ? lightVersions as any[] : versions as any[]} />

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

