/**
 * Dashboard Client Component
 * Client component for displaying dashboard with KPIs and charts
 */

'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
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
import { cachedFetch } from '@/lib/utils/fetch-cache';
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
  versions?: VersionWithRelations[]; // Optional - will fetch on client if not provided
}

/**
 * Transform version data to FullProjectionParams format
 */
function versionToProjectionParams(version: VersionWithRelations): FullProjectionParams | null {
  console.log('🔄 versionToProjectionParams called:', {
    versionName: version.name,
    hasRentPlan: !!version.rentPlan,
    numCurriculumPlans: version.curriculumPlans?.length || 0,
    curriculumTypes: version.curriculumPlans?.map(cp => cp.curriculumType) || [],
  });

  if (!version.rentPlan) {
    console.error('❌ versionToProjectionParams: No rentPlan');
    return null;
  }

  if (version.curriculumPlans.length < 2) {
    console.error('❌ versionToProjectionParams: Less than 2 curriculum plans:', version.curriculumPlans.length);
    return null;
  }

  // Get FR and IB curriculum plans
  const frPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'FR');
  const ibPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'IB');

  console.log('🔍 Curriculum plans search:', {
    hasFR: !!frPlan,
    hasIB: !!ibPlan,
    frPlan: frPlan ? { type: frPlan.curriculumType, capacity: frPlan.capacity } : null,
    ibPlan: ibPlan ? { type: ibPlan.curriculumType, capacity: ibPlan.capacity } : null,
  });

  if (!frPlan || !ibPlan) {
    console.error('❌ versionToProjectionParams: Missing FR or IB plan', { hasFR: !!frPlan, hasIB: !!ibPlan });
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

export function Dashboard({ versions: initialVersions }: DashboardProps) {
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
  
  // Client-side version loading
  const [versions, setVersionsState] = useState<VersionWithRelations[]>(initialVersions || []);
  const [versionsLoading, setVersionsLoading] = useState(!initialVersions);
  
  // Fetch versions on client side if not provided by server
  useEffect(() => {
    if (initialVersions) {
      // Versions provided by server - use them
      setVersionsState(initialVersions);
      setVersionsLoading(false);
      return;
    }
    
    // Prevent duplicate fetches (React Strict Mode runs effects twice in development)
    if (versionsFetchedRef.current) {
      return;
    }
    versionsFetchedRef.current = true;
    
    // Fetch versions from API (lightweight for speed)
    console.log('📡 Fetching versions from API (client-side - lightweight)...');
    const fetchStart = performance.now();
    
    // Use cached fetch to prevent duplicate concurrent requests
    cachedFetch('/api/versions?page=1&limit=10&lightweight=true')
      .then(response => response.json())
      .then(data => {
        const fetchTime = performance.now() - fetchStart;
        console.log(`✅ Versions loaded in ${fetchTime.toFixed(0)}ms`);
        
        if (data.success && data.data?.versions) {
          const versionsList = data.data.versions;
          setVersionsState(versionsList);
          
          // OPTIMIZATION: Pre-fetch first version's details immediately
          // This eliminates the 1400ms wait after version selection
          if (versionsList.length > 0 && versionsList[0]?.id) {
            const firstVersionId = versionsList[0].id;
            console.log('⚡ Pre-fetching first version details for instant display...');
            
            // Mark as fetching to prevent duplicate requests
            fetchingRef.current.add(firstVersionId);
            
            // Fetch full details in background (don't block UI)
            // Use cached fetch to prevent duplicate concurrent requests
            cachedFetch(`/api/versions/${firstVersionId}`)
              .then(async response => {
                if (!response.ok) return null;
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) return null;
                return response.json();
              })
              .then(versionData => {
                if (versionData?.success && versionData?.data) {
                  console.log('⚡ Pre-fetched version details cached');
                  const serializedVersion = serializeVersionForClient(versionData.data);
                  setVersionCache(prev => {
                    const newCache = new Map(prev);
                    newCache.set(firstVersionId, serializedVersion);
                    return newCache;
                  });
                  setCacheVersion(v => v + 1);
                  // Note: Auto-selection is handled by separate useEffect to avoid race conditions
                }
              })
              .catch(error => {
                console.warn('⚠️ Pre-fetch failed (non-critical):', error.message);
              })
              .finally(() => {
                // Remove from fetching set when done
                fetchingRef.current.delete(firstVersionId);
              });
          }
        }
        setVersionsLoading(false);
      })
      .catch(error => {
        console.error('❌ Failed to fetch versions:', error);
        setVersionsLoading(false);
      });
  }, [initialVersions]);
  
  // Cache for loaded versions (to avoid re-fetching)
  // Initialize cache safely to avoid hydration issues
  const [versionCache, setVersionCache] = useState<Map<string, VersionWithRelations>>(() => {
    // Initialize empty map on first render only (SSR-safe)
    return new Map<string, VersionWithRelations>();
  });
  
  // Cache version counter to trigger re-renders when cache updates
  const [cacheVersion, setCacheVersion] = useState(0);
  
  // Track in-flight fetches to prevent duplicate requests
  const fetchingRef = useRef<Set<string>>(new Set());
  
  // Track if versions have been fetched to prevent duplicate fetches (React Strict Mode)
  const versionsFetchedRef = useRef(false);
  
  // Initialize cache with provided versions once on mount
  const [cacheInitialized, setCacheInitialized] = useState(false);
  useEffect(() => {
    if (!cacheInitialized && versions.length > 0) {
      const newCache = new Map<string, VersionWithRelations>();
      versions.forEach(v => {
        if (v && v.id) {
          newCache.set(v.id, v);
        }
      });
      setVersionCache(newCache);
      setCacheVersion(v => v + 1); // Trigger selectedVersion memo update
      setCacheInitialized(true);
    }
  }, [cacheInitialized, versions]);

  // Initialize store with versions (only on mount or when versions change)
  useEffect(() => {
    setVersions(versions as any[]);
  }, [versions, setVersions]);

  // Set initial selected version (only once, when versions first load)
  // Pre-fetch happens in the versions fetch effect, so this can select immediately
  useEffect(() => {
    if (versions.length > 0 && !selectedVersionId && versions[0]?.id) {
      setSelectedVersionId(versions[0].id);
    }
  }, [versions.length, selectedVersionId, setSelectedVersionId]); // Only depend on array length and selectedVersionId

  // Get selected version from cache (cache is source of truth for complete versions)
  // Only use a version if it has required relations (curriculumPlans and rentPlan)
  // Optimized: cache is the only source of complete versions
  const selectedVersion = useMemo(() => {
    if (!selectedVersionId) return null;
    
    // Cache is the source of truth - it contains complete versions with relations
    // Initial versions are also stored in cache by cacheInitialized effect
    const cached = versionCache.get(selectedVersionId);
    if (cached && cached.curriculumPlans && cached.rentPlan) {
      return cached;
    }
    
    return null; // Wait for API fetch to complete
  }, [selectedVersionId, cacheVersion]); // Only depend on cacheVersion - cache updates trigger recalculation
  // Note: cacheVersion increments when cache updates, triggering memo recalculation
  
  // Load version details on-demand when selected version is not in cache OR incomplete
  useEffect(() => {
    if (!selectedVersionId) return;
    
    // Check cache before fetching (but don't include versionCache in deps)
    const cached = versionCache.get(selectedVersionId);
    // Only skip fetch if we have a COMPLETE cached version with relations
    if (cached && cached.curriculumPlans && cached.rentPlan) {
      return; // Already have complete version
    }
    
    // Check if already fetching (prevent duplicate requests)
    // Use a synchronous check and add atomically to prevent race conditions
    if (fetchingRef.current.has(selectedVersionId)) {
      return; // Already fetching
    }
    
    // Mark as fetching IMMEDIATELY (before async operations)
    fetchingRef.current.add(selectedVersionId);
    let cancelled = false;
    
    // Background fetch (don't block UI with loading state)
    // Use cached fetch to prevent duplicate concurrent requests
    cachedFetch(`/api/versions/${selectedVersionId}`)
      .then(async response => {
        if (cancelled) return null;
        
        // Check if response is OK before parsing JSON
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        // Check content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Invalid response type: ${contentType}`);
        }
        
        return response.json();
      })
      .then(data => {
        if (cancelled || !data) {
          return;
        }

        if (!data || typeof data !== 'object') {
          console.error('❌ Invalid API response: not an object', data);
          return;
        }

        if (!data.success) {
          console.error('❌ API returned error:', {
            error: data.error,
            code: data.code,
            details: data.details,
          });
          return;
        }

        if (!data.data) {
          console.error('❌ API response missing data field:', data);
          return;
        }

        const serializedVersion = serializeVersionForClient(data.data);
        
        // Only update cache if not cancelled and not already cached
        if (!cancelled) {
          setVersionCache(prev => {
            // Double-check cache hasn't been updated by another request
            const existing = prev.get(selectedVersionId);
            if (existing && existing.curriculumPlans && existing.rentPlan) {
              return prev; // Already cached by another request
            }
            const newCache = new Map(prev);
            newCache.set(selectedVersionId, serializedVersion);
            return newCache;
          });
          setCacheVersion(v => v + 1); // Trigger selectedVersion memo update
        }
      })
      .catch(error => {
        if (!cancelled) {
          console.error('❌ Failed to load version details:', {
            error: error.message,
            stack: error.stack,
            versionId: selectedVersionId,
          });
        }
      })
      .finally(() => {
        // Remove from fetching set when done
        fetchingRef.current.delete(selectedVersionId);
      });
    
    return () => {
      cancelled = true;
      fetchingRef.current.delete(selectedVersionId);
    };
  }, [selectedVersionId]);
  // Note: versionCache is a Map, omitted from deps to prevent infinite loops

  // Memoize projection params to avoid recalculating on every render
  // Use stable dependencies: create a serialized key from version data
  // This prevents recalculation when object references change but data is the same
  const projectionParamsKey = useMemo(() => {
    if (!selectedVersion) return null;
    // Create a stable key from version data (not object reference)
    return `${selectedVersion.id}-${selectedVersion.curriculumPlans?.length || 0}-${selectedVersion.rentPlan?.id || ''}`;
  }, [selectedVersion?.id, selectedVersion?.curriculumPlans?.length, selectedVersion?.rentPlan?.id]);
  
  // Track last calculated params to prevent duplicate calculations
  // Store both the key and the params to avoid recalculating when key is the same
  const lastCalculatedParamsRef = useRef<{ key: string; params: FullProjectionParams | null } | null>(null);
  
  // Store latest selectedVersion in ref to access it without triggering memo recalculation
  const selectedVersionRef = useRef<typeof selectedVersion>(null);
  selectedVersionRef.current = selectedVersion;
  
  const projectionParams = useMemo(() => {
    // Early return if no key (no version selected)
    if (!projectionParamsKey) {
      lastCalculatedParamsRef.current = null;
      return null;
    }
    
    // Return cached params if key hasn't changed (key is stable, calculated from version data)
    // This prevents recalculation when selectedVersion object reference changes but data is identical
    const cached = lastCalculatedParamsRef.current;
    if (cached?.key === projectionParamsKey) {
      return cached.params; // Return cached immediately - no calculation needed
    }
    
    // Calculate new params only if key changed (data actually changed)
    // Use ref to get latest version without adding it to dependencies
    const version = selectedVersionRef.current;
    if (!version) {
      return null;
    }
    
    // Only calculate if we don't have cached params for this key
    const params = versionToProjectionParams(version);
    lastCalculatedParamsRef.current = { 
      key: projectionParamsKey, 
      params
    };
    return params;
  }, [projectionParamsKey]); // Only depend on key - version accessed via ref to avoid recalculation

  // Debounce params to prevent too many calculations (50ms for ultra-responsive UI)
  const debouncedParams = useDebounce(projectionParams, 50);

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
  }, [calculationLoading, calculationError, calculatedProjection]);
  // Note: Zustand setters are stable and don't need to be in deps

  const chartData = useMemo(() => {
    if (!projection) return null;
    return transformProjectionData(projection);
  }, [projection]);

  // Show skeleton while versions are loading
  if (versionsLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
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
        {versions.length > 0 && <VersionSelector versions={versions as any[]} />}
      </div>

      {/* Empty State Message */}
      {!versionsLoading && versions.length === 0 && (
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
      ) : calculationLoading || (selectedVersionId && !selectedVersion) ? (
        // Show loading state while calculating OR while waiting for version details
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

