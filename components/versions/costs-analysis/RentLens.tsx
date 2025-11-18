/**
 * Rent Lens Component
 * Displays rent model details, NPV, and year-by-year projections
 * Read-only visualization component for Costs Analysis tab
 *
 * @component
 * @example
 * ```tsx
 * <RentLens
 *   rentPlan={version.rentPlan}
 *   curriculumPlans={version.curriculumPlans}
 *   adminSettings={adminSettings}
 *   onEditClick={() => setActiveTab('curriculum')}
 * />
 * ```
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import Decimal from 'decimal.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// Using simple state-based expand/collapse instead of Collapsible component
import { ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { calculateRent, type RentCalculationParams } from '@/lib/calculations/rent';
import { calculateNPV, type NPVParams } from '@/lib/calculations/financial/npv';
import { calculateRevenue, type RevenueParams } from '@/lib/calculations/revenue/revenue';
import { calculateTuitionGrowth, type TuitionGrowthParams } from '@/lib/calculations/revenue/tuition-growth';
import { RentModel } from '@prisma/client';
import type { VersionWithRelations } from '@/services/version/create';
import type { AdminSettings } from '@/lib/calculations/financial/projection';
import { toDecimal } from '@/lib/calculations/decimal-helpers';
import { RentPlanForm } from './RentPlanForm';

/**
 * Constants
 */
const NPV_START_YEAR = 2028;
const NPV_END_YEAR = 2052;
const NPV_PERIOD_YEARS = 25; // 2028-2052 = 25 years
const PERFORMANCE_TARGET_MS = 50; // Target: <50ms for calculations

/**
 * Props for RentLens component
 */
interface RentLensProps {
  /** Rent plan data from version (null if not configured) */
  rentPlan: VersionWithRelations['rentPlan'];
  /** Curriculum plans for revenue calculation */
  curriculumPlans: VersionWithRelations['curriculumPlans'];
  /** Admin settings (CPI rate, discount rate, tax rate) */
  adminSettings: AdminSettings | null;
  /** Callback function to start editing (for inline editing) */
  onEditStart?: () => void;
  /** Callback function to save rent plan changes */
  onSave?: (rentModel: RentModel, parameters: Record<string, number>) => void;
  /** Callback function to cancel editing */
  onCancel?: () => void;
  /** Whether rent plan is currently being edited */
  isEditing?: boolean;
  /** Whether save operation is in progress */
  saving?: boolean;
  /** Start year for calculations (default: 2023) */
  startYear?: number;
  /** End year for calculations (default: 2052) */
  endYear?: number;
}

/**
 * Format number as SAR currency
 */
function formatSAR(value: Decimal | number): string {
  const num = typeof value === 'number' ? value : value.toNumber();
  // Handle NaN and invalid numbers
  if (!Number.isFinite(num) || isNaN(num)) {
    return 'SAR 0';
  }
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format percentage
 */
function formatPercent(value: Decimal | number): string {
  const num = typeof value === 'number' ? value : value.toNumber();
  return `${num.toFixed(2)}%`;
}

/**
 * Get rent model display name
 */
function getRentModelName(model: string): string {
  switch (model) {
    case 'FIXED_ESCALATION':
      return 'Fixed Escalation';
    case 'REVENUE_SHARE':
      return 'Revenue Share';
    case 'PARTNER_MODEL':
      return 'Partner Model';
    default:
      return model;
  }
}

/**
 * Display rent parameters in a user-friendly format
 */
function RentParametersDisplay({
  rentModel,
  parameters,
}: {
  rentModel: string;
  parameters: Record<string, unknown>;
}) {
  if (rentModel === 'FIXED_ESCALATION') {
    const baseRent = parameters.baseRent as number;
    const escalationRate = parameters.escalationRate as number;
    const startYear = parameters.startYear as number | undefined;
    const frequency = parameters.frequency as number | undefined;

    return (
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Base Rent:</span>{' '}
          <span className="font-medium">{formatSAR(baseRent || 0)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Escalation Rate:</span>{' '}
          <span className="font-medium">{formatPercent((escalationRate || 0) * 100)}</span>
        </div>
        {startYear && (
          <div>
            <span className="text-muted-foreground">Start Year:</span>{' '}
            <span className="font-medium">{startYear}</span>
          </div>
        )}
        {frequency && (
          <div>
            <span className="text-muted-foreground">Frequency:</span>{' '}
            <span className="font-medium">{frequency} year{frequency !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    );
  }

  if (rentModel === 'REVENUE_SHARE') {
    const revenueSharePercent = parameters.revenueSharePercent as number;
    const minRent = parameters.minRent as number | undefined;
    const maxRent = parameters.maxRent as number | undefined;

    return (
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Revenue Share:</span>{' '}
          <span className="font-medium">{formatPercent((revenueSharePercent || 0) * 100)}</span>
        </div>
        {minRent !== undefined && (
          <div>
            <span className="text-muted-foreground">Minimum Rent:</span>{' '}
            <span className="font-medium">{formatSAR(minRent)}</span>
          </div>
        )}
        {maxRent !== undefined && (
          <div>
            <span className="text-muted-foreground">Maximum Rent:</span>{' '}
            <span className="font-medium">{formatSAR(maxRent)}</span>
          </div>
        )}
      </div>
    );
  }

  if (rentModel === 'PARTNER_MODEL') {
    const landSize = parameters.landSize as number;
    const landPricePerSqm = parameters.landPricePerSqm as number;
    const buaSize = parameters.buaSize as number;
    const constructionCostPerSqm = parameters.constructionCostPerSqm as number;
    const yieldBase = parameters.yieldBase as number;
    const growthRate = parameters.growthRate as number | undefined;
    const frequency = parameters.frequency as number | undefined;

    return (
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Land Size:</span>{' '}
          <span className="font-medium">{landSize?.toLocaleString() || 0} m²</span>
        </div>
        <div>
          <span className="text-muted-foreground">Land Price:</span>{' '}
          <span className="font-medium">{formatSAR(landPricePerSqm || 0)}/m²</span>
        </div>
        <div>
          <span className="text-muted-foreground">BUA Size:</span>{' '}
          <span className="font-medium">{buaSize?.toLocaleString() || 0} m²</span>
        </div>
        <div>
          <span className="text-muted-foreground">Construction Cost:</span>{' '}
          <span className="font-medium">{formatSAR(constructionCostPerSqm || 0)}/m²</span>
        </div>
        <div>
          <span className="text-muted-foreground">Yield Base (Year 1):</span>{' '}
          <span className="font-medium">{formatPercent((yieldBase || 0) * 100)}</span>
        </div>
        {growthRate !== undefined && growthRate > 0 && (
          <div>
            <span className="text-muted-foreground">Growth Rate (Years 2+):</span>{' '}
            <span className="font-medium">{formatPercent(growthRate * 100)}</span>
          </div>
        )}
        {frequency && (
          <div>
            <span className="text-muted-foreground">Frequency:</span>{' '}
            <span className="font-medium">{frequency} year{frequency !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    );
  }

  // Fallback to JSON if model is unknown
  return (
    <pre className="text-xs bg-muted p-2 rounded overflow-auto">
      {JSON.stringify(parameters, null, 2)}
    </pre>
  );
}

/**
 * Type guard to check if rent result has year and rent fields
 */
function hasYearAndRent(
  item: unknown
): item is { year: number; rent: Decimal | number | string } {
  return (
    typeof item === 'object' &&
    item !== null &&
    'year' in item &&
    'rent' in item &&
    typeof (item as { year: unknown }).year === 'number'
  );
}

/**
 * Extract year and rent from rent projection result (handles union type)
 */
function extractYearAndRent(
  item: unknown
): { year: number; rent: Decimal } | null {
  if (!hasYearAndRent(item)) {
    return null;
  }
  return {
    year: item.year,
    rent: toDecimal(item.rent),
  };
}

export function RentLens({
  rentPlan,
  curriculumPlans,
  adminSettings,
  onEditStart,
  onSave,
  onCancel,
  isEditing = false,
  saving = false,
  startYear = 2023,
  endYear = 2052,
}: RentLensProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Auto-expand when editing starts
  useEffect(() => {
    if (isEditing && !isExpanded) {
      setIsExpanded(true);
    }
  }, [isEditing, isExpanded]);

  // Calculate revenue projection for rent load calculation
  const revenueProjection = useMemo(() => {
    console.log('🔍 [RENTLENS] Starting revenue projection calculation...');
    console.log('🔍 [RENTLENS] Curriculum Plans:', curriculumPlans?.length || 0, curriculumPlans);
    console.log('🔍 [RENTLENS] Admin Settings:', adminSettings);
    
    if (!curriculumPlans || curriculumPlans.length === 0) {
      console.warn('⚠️ [RENTLENS] No curriculum plans available for revenue calculation');
      return [];
    }

    if (!adminSettings) {
      console.warn('⚠️ [RENTLENS] Admin settings not available for revenue calculation');
      return [];
    }

    const calcStart = performance.now();
    try {
      const allRevenue: Array<{ year: number; revenue: Decimal }> = [];

      // Calculate revenue for each curriculum and sum
      for (const plan of curriculumPlans) {
        // Skip plans with null tuitionBase (e.g., disabled IB)
        if (plan.tuitionBase === null || plan.tuitionBase === undefined) {
          console.warn(`⚠️ [RENTLENS] Skipping curriculum ${plan.curriculumType} - tuitionBase is null`);
          continue;
        }
        
        // Check if tuitionBase is valid (not NaN)
        const tuitionBaseDecimal = toDecimal(plan.tuitionBase);
        if (tuitionBaseDecimal.isNaN()) {
          console.warn(`⚠️ [RENTLENS] Skipping curriculum ${plan.curriculumType} - tuitionBase is NaN`);
          continue;
        }
        
        console.log(`🔍 [RENTLENS] Curriculum ${plan.curriculumType}: tuitionBase = ${tuitionBaseDecimal.toString()}`);
        
        const tuitionParams: TuitionGrowthParams = {
          tuitionBase: tuitionBaseDecimal,
          cpiRate: toDecimal(adminSettings.cpiRate),
          cpiFrequency: plan.cpiFrequency as 1 | 2 | 3,
          baseYear: 2023, // Base year for tuition calculation (when tuition base is set)
          startYear,
          endYear,
        };

        const tuitionResult = calculateTuitionGrowth(tuitionParams);
        if (!tuitionResult.success) {
          console.error(`❌ [RENTLENS] Failed to calculate tuition growth for curriculum ${plan.curriculumType}:`, tuitionResult.error);
          continue; // Skip this curriculum, continue with others
        }
        
        // Check if tuition result contains NaN
        const hasNaN = tuitionResult.data.some(t => t.tuition.isNaN());
        if (hasNaN) {
          console.warn(`⚠️ [RENTLENS] Curriculum ${plan.curriculumType}: Tuition calculation contains NaN values`);
          const sampleTuition = tuitionResult.data.find(t => t.year === 2028);
          console.warn(`⚠️ [RENTLENS] Sample (2028): Tuition = ${sampleTuition?.tuition.toString() || 'N/A'}`);
        }

        const studentsProjection = (plan.studentsProjection as Array<{ year: number; students: number }>) || [];
        console.log(`🔍 [RENTLENS] Curriculum ${plan.curriculumType}: Students projection length = ${studentsProjection.length}`);
        
        if (studentsProjection.length === 0) {
          console.warn(`⚠️ [RENTLENS] No students projection data for curriculum ${plan.curriculumType}`);
          continue; // Skip this curriculum but continue with others
        }
        
        // Check for non-zero students
        const nonZeroYears = studentsProjection.filter(s => s.students > 0);
        console.log(`🔍 [RENTLENS] Curriculum ${plan.curriculumType}: ${nonZeroYears.length} years with students > 0`);
        if (nonZeroYears.length === 0) {
          console.warn(`⚠️ [RENTLENS] Curriculum ${plan.curriculumType}: All students are zero! Skipping revenue calculation.`);
          // Skip this curriculum - no revenue if no students
          continue;
        } else {
          const sample2028 = studentsProjection.find(s => s.year === 2028);
          console.log(`🔍 [RENTLENS] Curriculum ${plan.curriculumType}: Students in 2028 = ${sample2028?.students || 0}`);
        }

        // Check for year mismatch and warn
        const tuitionYears = new Set(tuitionResult.data.map(t => t.year));
        const studentYears = new Set(studentsProjection.map(s => s.year));
        const missingYears = [...tuitionYears].filter(y => !studentYears.has(y));
        const extraYears = [...studentYears].filter(y => !tuitionYears.has(y));

        if (missingYears.length > 0) {
          console.warn(`RentLens: Students data missing for years ${missingYears.join(', ')} in curriculum ${plan.curriculumType}`);
        }
        if (extraYears.length > 0) {
          console.warn(`RentLens: Students data exists for years ${extraYears.join(', ')} not in tuition for curriculum ${plan.curriculumType}`);
        }

        const revenueParams: RevenueParams = {
          tuitionByYear: tuitionResult.data,
          studentsByYear: studentsProjection,
        };

        const revenueResult = calculateRevenue(revenueParams);
        if (!revenueResult.success) {
          console.error(`❌ [RENTLENS] Failed to calculate revenue for curriculum ${plan.curriculumType}:`, revenueResult.error);
          continue; // Skip this curriculum but continue with others
        }

        // Check for NaN in revenue results
        const hasNaNRevenue = revenueResult.data.some(r => r.revenue.isNaN());
        if (hasNaNRevenue) {
          console.error(`❌ [RENTLENS] Curriculum ${plan.curriculumType}: Revenue calculation contains NaN values!`);
          const sample2028 = revenueResult.data.find(r => r.year === 2028);
          if (sample2028) {
            console.error(`❌ [RENTLENS] Sample (2028): Tuition = ${sample2028.tuition.toString()}, Students = ${sample2028.students}, Revenue = ${sample2028.revenue.toString()}`);
          }
          // Skip this curriculum if revenue contains NaN
          continue;
        }

        console.log(`✅ [RENTLENS] Curriculum ${plan.curriculumType}: Revenue calculated for ${revenueResult.data.length} years`);
        const sample2028 = revenueResult.data.find(r => r.year === 2028);
        if (sample2028) {
          console.log(`📊 [RENTLENS] Curriculum ${plan.curriculumType}: Revenue in 2028 = ${sample2028.revenue.toString()}`);
        }

        // Aggregate revenue by year
        for (const rev of revenueResult.data) {
          // Skip NaN revenue values
          if (rev.revenue.isNaN()) {
            console.warn(`⚠️ [RENTLENS] Skipping NaN revenue for year ${rev.year} in curriculum ${plan.curriculumType}`);
            continue;
          }
          
          const existing = allRevenue.find((r) => r.year === rev.year);
          if (existing) {
            // Check if existing revenue is NaN before adding
            if (existing.revenue.isNaN()) {
              console.warn(`⚠️ [RENTLENS] Replacing NaN revenue for year ${rev.year}`);
              existing.revenue = rev.revenue;
            } else {
              existing.revenue = existing.revenue.plus(rev.revenue);
            }
          } else {
            allRevenue.push({ year: rev.year, revenue: rev.revenue });
          }
        }
      }

      // Filter out any NaN values before returning
      const validRevenue = allRevenue.filter(r => !r.revenue.isNaN());
      const result = validRevenue.sort((a, b) => a.year - b.year);
      const calcDuration = performance.now() - calcStart;
      
      if (validRevenue.length < allRevenue.length) {
        console.warn(`⚠️ [RENTLENS] Filtered out ${allRevenue.length - validRevenue.length} NaN revenue values`);
      }
      
      console.log(`✅ [RENTLENS] Revenue projection calculated in ${calcDuration.toFixed(2)}ms (target: <${PERFORMANCE_TARGET_MS}ms)`);
      console.log(`📊 [RENTLENS] Revenue projection result: ${result.length} years (valid)`);
      
      if (result.length > 0) {
        const sampleYear = result.find(r => r.year === 2028);
        console.log(`📊 [RENTLENS] Sample (2028): Revenue = ${sampleYear?.revenue.toString() || 'N/A'}`);
        const totalRevenue = result.reduce((sum, r) => {
          if (r.revenue.isNaN()) {
            return sum;
          }
          return sum.plus(r.revenue);
        }, new Decimal(0));
        console.log(`📊 [RENTLENS] Total Revenue (all years): ${totalRevenue.toString()}`);
      }
      
      if (calcDuration > PERFORMANCE_TARGET_MS) {
        console.warn(`⚠️ [RENTLENS] Revenue projection calculation took ${calcDuration.toFixed(2)}ms (target: <${PERFORMANCE_TARGET_MS}ms)`);
      }
      
      if (result.length === 0) {
        console.warn('⚠️ [RENTLENS] Revenue projection is empty - no revenue data calculated');
      }
      
      return result;
    } catch (error) {
      console.error('❌ [RENTLENS] Error calculating revenue projection:', error);
      return [];
    }
  }, [curriculumPlans, adminSettings, startYear, endYear]);

  // Calculate rent projection
  const rentProjection = useMemo(() => {
    if (!rentPlan || !adminSettings) {
      return null;
    }

    const calcStart = performance.now();
    try {
      const rentModel = rentPlan.rentModel as 'FIXED_ESCALATION' | 'REVENUE_SHARE' | 'PARTNER_MODEL';
      const parameters = rentPlan.parameters as Record<string, unknown>;

      let params: RentCalculationParams;

      if (rentModel === 'REVENUE_SHARE') {
        // RevenueShare requires revenueByYear
        if (!revenueProjection || revenueProjection.length === 0) {
          console.error('Revenue projection required for RevenueShare model');
          return null;
        }
        params = {
          model: 'REVENUE_SHARE',
          revenueByYear: revenueProjection.map((r) => ({
            year: r.year,
            revenue: r.revenue,
          })),
          revenueSharePercent: parameters.revenueSharePercent as number,
        };
      } else if (rentModel === 'FIXED_ESCALATION') {
        params = {
          model: 'FIXED_ESCALATION',
          baseRent: parameters.baseRent as number,
          escalationRate: parameters.escalationRate as number,
          frequency: (parameters.frequency as number) ?? 1,
          startYear: (parameters.startYear as number) ?? 2028,
          endYear: 2052,
        };
      } else {
        // PARTNER_MODEL
        params = {
          model: 'PARTNER_MODEL',
          landSize: parameters.landSize as number,
          landPricePerSqm: parameters.landPricePerSqm as number,
          buaSize: parameters.buaSize as number,
          constructionCostPerSqm: parameters.constructionCostPerSqm as number,
          yieldBase: parameters.yieldBase as number,
          growthRate: parameters.growthRate as number | undefined,
          frequency: (parameters.frequency as number) ?? 1,
          startYear: (parameters.startYear as number) ?? 2028,
          endYear: 2052,
        };
      }

      const result = calculateRent(params);
      const calcDuration = performance.now() - calcStart;
      if (calcDuration > PERFORMANCE_TARGET_MS) {
        console.warn(`⚠️ Rent projection calculation took ${calcDuration.toFixed(2)}ms (target: <${PERFORMANCE_TARGET_MS}ms)`);
      }
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error calculating rent projection:', error);
      return null;
    }
  }, [rentPlan, adminSettings, revenueProjection]);

  // Calculate NPV (2028-2052, 25-year period)
  const npvResult = useMemo(() => {
    if (!rentProjection || !adminSettings) {
      return null;
    }

    try {
      const amountsByYear = rentProjection
        .map((r) => extractYearAndRent(r))
        .filter((item): item is { year: number; rent: Decimal } => {
          // Filter for 2028-2052 period (25-year NPV period)
          return item !== null && item.year >= NPV_START_YEAR && item.year <= NPV_END_YEAR;
        })
        .map((item) => ({
          year: item.year,
          amount: item.rent,
        }));

      if (amountsByYear.length === 0) {
        return null;
      }

      const npvParams: NPVParams = {
        amountsByYear,
        discountRate: toDecimal(adminSettings.discountRate),
        startYear: NPV_START_YEAR,
        endYear: NPV_END_YEAR,
        baseYear: 2027,
      };

      const result = calculateNPV(npvParams);
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error calculating NPV:', error);
      return null;
    }
  }, [rentProjection, adminSettings]);

  // Calculate rent load and combine with rent projection
  const rentDataWithLoad = useMemo(() => {
    if (!rentProjection) {
      return null;
    }

    // If revenueProjection is null or empty, still show rent data with zero revenue
    const hasRevenueData = revenueProjection && revenueProjection.length > 0;

    return rentProjection
      .map((rentItem) => extractYearAndRent(rentItem))
      .filter((item): item is { year: number; rent: Decimal } => item !== null)
      .map((item) => {
        // Find revenue for this year, or use zero if not found
        const revenueItem = hasRevenueData 
          ? revenueProjection.find((r) => r.year === item.year)
          : null;
        let revenue = revenueItem?.revenue || new Decimal(0);
        
        // Ensure revenue is not NaN (convert NaN to zero)
        if (revenue.isNaN()) {
          console.warn(`⚠️ [RENTLENS] Revenue is NaN for year ${item.year}, converting to zero`);
          revenue = new Decimal(0);
        }
        
        // Calculate rent load: (rent / revenue) × 100
        // If revenue is zero, rent load is zero (avoid division by zero)
        const rentLoad = revenue.isZero() || revenue.isNaN() 
          ? new Decimal(0) 
          : item.rent.div(revenue).times(100);

        return {
          year: item.year,
          rent: item.rent,
          revenue,
          rentLoad,
        };
      });
  }, [rentProjection, revenueProjection]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!rentDataWithLoad) {
      return null;
    }

    const year2028 = rentDataWithLoad.find((r) => r.year === NPV_START_YEAR);
    const year2052 = rentDataWithLoad.find((r) => r.year === NPV_END_YEAR);
    const avgRentLoad = rentDataWithLoad
      .filter((r) => r.year >= NPV_START_YEAR && r.year <= NPV_END_YEAR)
      .reduce((sum, r) => sum.plus(r.rentLoad), new Decimal(0))
      .div(NPV_PERIOD_YEARS);

    return {
      year1Rent: year2028?.rent || new Decimal(0),
      year30Rent: year2052?.rent || new Decimal(0),
      npv: npvResult?.npv || new Decimal(0),
      avgRentLoad,
    };
  }, [rentDataWithLoad, npvResult]);

  // Handle missing data
  if (!rentPlan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rent Model</CardTitle>
          <CardDescription>Rent model configuration and analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No rent plan configured. Please configure rent plan.
          </p>
          {onEditStart && (
            <Button
              onClick={onEditStart}
              className="mt-4"
              variant="outline"
              aria-label="Configure rent model"
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Configure Rent Model
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!adminSettings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rent Model</CardTitle>
          <CardDescription>Rent model configuration and analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading admin settings...</p>
        </CardContent>
      </Card>
    );
  }

  if (!rentProjection || !summaryMetrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rent Model</CardTitle>
          <CardDescription>Rent model configuration and analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Calculating rent projection...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              Rent Model
              <Badge variant="outline">{getRentModelName(rentPlan.rentModel)}</Badge>
            </CardTitle>
            <CardDescription>Rent model analysis and year-by-year projections</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse rent model details' : 'Expand rent model details'}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                Expand
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Collapsed State: Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Year 1 Rent (2028)</p>
            <p className="text-lg font-semibold">{formatSAR(summaryMetrics.year1Rent)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Year 30 Rent (2052)</p>
            <p className="text-lg font-semibold">{formatSAR(summaryMetrics.year30Rent)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">NPV (2028-2052)</p>
            <p className="text-lg font-semibold">{formatSAR(summaryMetrics.npv)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Avg Rent Load %</p>
            <p className="text-lg font-semibold">{formatPercent(summaryMetrics.avgRentLoad)}</p>
          </div>
        </div>

        {/* Expanded State */}
        {isExpanded && (
          <div className="mt-6 space-y-6">
            {/* Rent Model Details or Edit Form */}
            {isEditing && onSave && onCancel ? (
              <RentPlanForm
                rentModel={rentPlan.rentModel}
                parameters={rentPlan.parameters as Record<string, unknown>}
                onSave={onSave}
                onCancel={onCancel}
                saving={saving}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Rent Model Details</h3>
                  {onEditStart && (
                    <Button
                      onClick={onEditStart}
                      variant="outline"
                      size="sm"
                      aria-label="Edit rent model configuration"
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit Rent Model
                    </Button>
                  )}
                </div>

                <div className="rounded-lg border p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Model:</span>{' '}
                      <span className="font-medium">{getRentModelName(rentPlan.rentModel)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Discount Rate:</span>{' '}
                      <span className="font-medium">{formatPercent(toDecimal(adminSettings.discountRate))}</span>
                    </div>
                  </div>

                  {/* Model-specific parameters */}
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Parameters:</p>
                    <RentParametersDisplay
                      rentModel={rentPlan.rentModel}
                      parameters={rentPlan.parameters as Record<string, unknown>}
                    />
                  </div>

                  {/* NPV Details */}
                  {npvResult && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-2">NPV Calculation (2028-2052):</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">NPV:</span>{' '}
                          <span className="font-medium">{formatSAR(npvResult.npv)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Years:</span>{' '}
                          <span className="font-medium">{npvResult.totalYears}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Year-by-Year Table */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Year-by-Year Rent Projection</h3>
              <div className="rounded-md border overflow-x-auto">
                <Table role="table" aria-label="Year-by-year rent projection">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead className="text-right">Rent (SAR)</TableHead>
                      <TableHead className="text-right">Revenue (SAR)</TableHead>
                      <TableHead className="text-right">Rent Load (%)</TableHead>
                      <TableHead className="text-right">YoY Change (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rentDataWithLoad.map((row, index) => {
                      const prevRow = index > 0 ? rentDataWithLoad[index - 1] : null;
                      const yoyChange = prevRow && !prevRow.rent.isZero()
                        ? row.rent.minus(prevRow.rent).div(prevRow.rent).times(100)
                        : new Decimal(0);

                      return (
                        <TableRow key={row.year}>
                          <TableCell className="font-medium">{row.year}</TableCell>
                          <TableCell className="text-right">{formatSAR(row.rent)}</TableCell>
                          <TableCell className="text-right">{formatSAR(row.revenue)}</TableCell>
                          <TableCell className="text-right">{formatPercent(row.rentLoad)}</TableCell>
                          <TableCell className="text-right">
                            {index === 0 ? '—' : formatPercent(yoyChange)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

