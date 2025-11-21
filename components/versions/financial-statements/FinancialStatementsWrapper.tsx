/**
 * Financial Statements Wrapper Component
 *
 * Fetches version data, balance sheet settings, other revenue, and calculates
 * 30-year arrays needed for the Financial Statements component.
 *
 * This component handles all data preparation and passes clean props to FinancialStatements.
 */

'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FinancialStatements } from './FinancialStatements';
import { BalanceSheetSettings } from '../BalanceSheetSettings';
import { OtherRevenueEditor } from '../OtherRevenueEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Settings, DollarSign } from 'lucide-react';
import { calculateFullProjection } from '@/lib/calculations/financial/projection';
import type {
  CurriculumPlanInput,
  RentPlanInput,
  YearlyProjection,
} from '@/lib/calculations/financial/projection';
import { calculateStaffCostBaseFromCurriculum } from '@/lib/calculations/financial/staff-costs';
import type { VersionWithRelations } from '@/services/version';
import Decimal from 'decimal.js';
import { useRenderLogger } from '@/hooks/use-render-logger';

// Configure Decimal.js
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface FinancialStatementsWrapperProps {
  version: VersionWithRelations;
  adminSettings: {
    cpiRate: number;
    discountRate: number;
    zakatRate: number; // Zakat rate (2.5% default for Saudi Arabia)
  };
}

/**
 * Financial Statements Wrapper Component
 *
 * @example
 * <FinancialStatementsWrapper version={versionData} adminSettings={settings} />
 */
export function FinancialStatementsWrapper(props: FinancialStatementsWrapperProps): JSX.Element {
  // DIAGNOSTIC: Track render count
  useRenderLogger('FinancialStatementsWrapper');

  const { version, adminSettings } = props;

  // State for balance sheet settings, other revenue, and historical data
  const [balanceSheetSettings, setBalanceSheetSettings] = useState<{
    startingCash: number;
    openingEquity: number;
  } | null>(null);
  const [otherRevenue, setOtherRevenue] = useState<Record<number, number>>({});
  const [historicalActuals, setHistoricalActuals] = useState<
    Array<{
      year: number;
      revenue: number;
      staffCost: number;
      rent: number;
      opex: number;
      capex: number;
    }>
  >([]);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ FIX: Merged effects - fetch data and calculate projection in one unified effect
  // This eliminates cascading effects that cause infinite loops
  const [projectionData, setProjectionData] = useState<{
    years: YearlyProjection[];
    metadata: {
      converged: boolean;
      iterations: number;
      maxError: number;
      duration: number;
      solverUsed: boolean;
    };
  } | null>(null);

  // ✅ FIX: Stabilize adminSettings with useMemo to prevent object reference changes
  const adminSettingsMemo = useMemo(
    () => ({
      cpiRate: adminSettings.cpiRate,
      discountRate: adminSettings.discountRate,
      zakatRate: adminSettings.zakatRate,
    }),
    [adminSettings.cpiRate, adminSettings.discountRate, adminSettings.zakatRate]
  );

  // ✅ FIX: Single unified effect that fetches AND calculates
  // Only depends on primitive versionId, not complex objects
  useEffect(() => {
    let mounted = true; // Cleanup flag

    async function fetchDataAndCalculateProjection() {
      if (!version.curriculumPlans || version.curriculumPlans.length === 0) {
        setProjectionData(null);
        setLoadingSettings(false);
        return;
      }

      setLoadingSettings(true);
      setError(null);

      try {
        // 1. Fetch balance sheet settings
        const bsResponse = await fetch(`/api/versions/${version.id}/balance-sheet-settings`);
        const bsData = await bsResponse.json();
        if (!mounted) return;

        const balanceSheetSettingsFetched =
          bsData.success && bsData.data
            ? {
                startingCash: bsData.data.startingCash
                  ? parseFloat(bsData.data.startingCash.toString())
                  : 5000000,
                openingEquity: bsData.data.openingEquity
                  ? parseFloat(bsData.data.openingEquity.toString())
                  : 55000000,
              }
            : {
                startingCash: 5000000,
                openingEquity: 55000000,
              };

        setBalanceSheetSettings(balanceSheetSettingsFetched);

        // 2. Fetch other revenue
        const orResponse = await fetch(`/api/versions/${version.id}/other-revenue`);
        if (!mounted) return;

        let otherRevenueFetched: Record<number, number> = {};
        if (orResponse.ok) {
          const orData = await orResponse.json();
          if (orData.success && orData.data && orData.data.items) {
            const revenueMap: Record<number, number> = {};
            orData.data.items.forEach((item: { year: number; amount: string | number }) => {
              revenueMap[item.year] = parseFloat(item.amount.toString());
            });
            otherRevenueFetched = revenueMap;
            setOtherRevenue(revenueMap);
          }
        }

        // 3. Fetch historical actuals
        const haResponse = await fetch(`/api/admin/historical-data?versionId=${version.id}`);
        if (!mounted) return;

        let historicalActualsFetched: Array<{
          year: number;
          revenue: number;
          staffCost: number;
          rent: number;
          opex: number;
          capex: number;
        }> = [];

        if (haResponse.ok) {
          const haData = await haResponse.json();
          if (haData.success && haData.data && Array.isArray(haData.data)) {
            historicalActualsFetched = haData.data.map((h: any) => ({
              year: h.year,
              revenue: parseFloat(h.totalRevenues || '0'),
              staffCost: parseFloat(h.salariesAndRelatedCosts || '0'),
              rent: parseFloat(h.schoolRent || '0'),
              opex:
                parseFloat(h.totalOperatingExpenses || '0') -
                parseFloat(h.salariesAndRelatedCosts || '0') -
                parseFloat(h.schoolRent || '0'),
              capex: Math.abs(parseFloat(h.cfAdditionsFixedAssets || '0')),
            }));
            setHistoricalActuals(historicalActualsFetched);
          }
        }

        // 4. Calculate projection using fetched data (no intermediate state triggers)
        if (!mounted) return;

        try {
          // Prepare curriculum plans
          const curriculumPlans = version.curriculumPlans.map((cp) => {
            // Extract staff cost fields (they exist in the database schema)
            const teacherRatio = (cp as any).teacherRatio ?? null;
            const nonTeacherRatio = (cp as any).nonTeacherRatio ?? null;
            const teacherMonthlySalary = (cp as any).teacherMonthlySalary ?? null;
            const nonTeacherMonthlySalary = (cp as any).nonTeacherMonthlySalary ?? null;

            // ✅ FIX: Robust parsing of studentsProjection with error handling
            let studentsProjection: Array<{ year: number; students: number }> = [];
            try {
              if (cp.studentsProjection) {
                if (Array.isArray(cp.studentsProjection)) {
                  studentsProjection = cp.studentsProjection;
                } else if (typeof cp.studentsProjection === 'string') {
                  const parsed = JSON.parse(cp.studentsProjection);
                  if (Array.isArray(parsed)) {
                    studentsProjection = parsed;
                  } else {
                    console.warn(
                      `[FinancialStatementsWrapper] studentsProjection for ${cp.curriculumType} is not an array:`,
                      parsed
                    );
                  }
                } else {
                  // Try to convert to array
                  studentsProjection = Array.isArray(cp.studentsProjection) ? cp.studentsProjection : [];
                }
              }
            } catch (parseError) {
              console.error(
                `[FinancialStatementsWrapper] Failed to parse studentsProjection for ${cp.curriculumType}:`,
                parseError
              );
              studentsProjection = [];
            }

            // 🐛 DEBUG: Log what we're getting from the database
            console.log(`[STAFF COST DATA] ${cp.curriculumType}:`, {
              teacherRatio,
              nonTeacherRatio,
              teacherMonthlySalary,
              nonTeacherMonthlySalary,
              hasAllFields:
                teacherRatio !== null &&
                nonTeacherRatio !== null &&
                teacherMonthlySalary !== null &&
                nonTeacherMonthlySalary !== null,
              studentsProjectionLength: studentsProjection.length,
              studentsProjectionYears: studentsProjection.map((p) => p.year).slice(0, 5), // First 5 years
              rawCp: cp, // Log entire object to see what fields are available
            });

            return {
              curriculumType: cp.curriculumType as 'FR' | 'IB',
              capacity: cp.capacity,
              tuitionBase: cp.tuitionBase,
              cpiFrequency: cp.cpiFrequency as 1 | 2 | 3,
              studentsProjection,
              // Staff cost configuration (from database - nullable fields)
              teacherRatio,
              nonTeacherRatio,
              teacherMonthlySalary,
              nonTeacherMonthlySalary,
            };
          });

          // Prepare rent plan
          const rentPlan = version.rentPlan
            ? {
                rentModel: version.rentPlan.rentModel as
                  | 'FIXED_ESCALATION'
                  | 'REVENUE_SHARE'
                  | 'PARTNER_MODEL',
                parameters: version.rentPlan.parameters
                  ? typeof version.rentPlan.parameters === 'string'
                    ? JSON.parse(version.rentPlan.parameters)
                    : version.rentPlan.parameters
                  : {},
              }
            : {
                rentModel: 'FIXED_ESCALATION' as const,
                parameters: {},
              };

          // Calculate staff cost base
          // Try using proper teacher ratios if available, otherwise use fallback estimate
          const baseYear = version.mode === 'RELOCATION_2028' ? 2028 : 2023; // Use 2028 for relocation, 2023 for historical

          // ✅ FIX: Validate that studentsProjection includes baseYear for all curricula
          const missingYears: Array<{ curriculum: string; year: number }> = [];
          for (const cp of curriculumPlans) {
            const hasBaseYear = cp.studentsProjection.some((p) => p.year === baseYear);
            if (!hasBaseYear) {
              missingYears.push({ curriculum: cp.curriculumType, year: baseYear });
            }
          }

          if (missingYears.length > 0) {
            const missingList = missingYears
              .map((m) => `${m.curriculum} (year ${m.year})`)
              .join(', ');
            console.warn(
              `⚠️ [FinancialStatementsWrapper] Missing student projections: ${missingList}. ` +
              `The calculation will use the closest available year, but results may be less accurate. ` +
              `Please update enrollment projections in the Curriculum tab to include year ${baseYear}.`
            );
            // Continue with calculation - the staff-costs function will handle fallback
          }

          // ✅ FIX: Check if curriculum plans have staff cost configuration AND valid studentsProjection
          // If any curriculum has empty studentsProjection, we can't use teacher ratios (will fail)
          const allCurriculaHaveProjections = curriculumPlans.every(
            (cp) => cp.studentsProjection && cp.studentsProjection.length > 0
          );

          const hasStaffCostConfig = curriculumPlans.some(
            (cp) =>
              cp.teacherRatio !== null &&
              cp.teacherRatio !== undefined &&
              cp.nonTeacherRatio !== null &&
              cp.nonTeacherRatio !== undefined &&
              cp.teacherMonthlySalary !== null &&
              cp.teacherMonthlySalary !== undefined &&
              cp.nonTeacherMonthlySalary !== null &&
              cp.nonTeacherMonthlySalary !== undefined
          ) && allCurriculaHaveProjections; // ✅ Only use teacher ratios if all curricula have projections

          let staffCostBase: number | undefined = undefined;

          if (hasStaffCostConfig) {
            // Use proper calculation with teacher ratios
            const staffCostBaseResult = calculateStaffCostBaseFromCurriculum(
              curriculumPlans,
              baseYear
            );

            if (!staffCostBaseResult.success) {
              console.warn(
                '[FinancialStatementsWrapper] Failed to calculate staff cost base with teacher ratios:',
                staffCostBaseResult.error,
                'Falling back to capacity-based estimate.'
              );
              // Will fall through to capacity-based estimate below
            } else {
              staffCostBase = staffCostBaseResult.data.toNumber();
            }
          }

          // ✅ FIX: Use fallback if teacher ratio calculation failed or wasn't attempted
          if (staffCostBase === undefined) {
            // Fallback: Use capacity-based estimate (30K SAR per student per year)
            // This is a placeholder until staff cost configuration is added to the database
            console.warn(
              '[FinancialStatementsWrapper] Staff cost configuration not found, using fallback estimate'
            );
            staffCostBase = curriculumPlans.reduce((sum, cp) => {
              return sum + cp.capacity * 30000; // Rough estimate: 30K SAR per student per year
            }, 0);
          }

          // Prepare capex items
          const capexItems =
            version.capexItems?.map((item) => ({
              year: item.year,
              amount: item.amount,
            })) || [];

          // Prepare opex sub-accounts
          const opexSubAccounts =
            version.opexSubAccounts?.map((oa) => ({
              subAccountName: oa.subAccountName,
              percentOfRevenue: oa.percentOfRevenue,
              isFixed: oa.isFixed,
              fixedAmount: oa.fixedAmount,
            })) || [];

          // ✅ FIX: Use fetched data directly (no state dependency)
          const otherRevenueByYear = Object.entries(otherRevenueFetched).map(([year, amount]) => ({
            year: parseInt(year, 10),
            amount,
          }));

          // Calculate full projection
          const projectionResult = await calculateFullProjection({
            curriculumPlans,
            rentPlan,
            staffCostBase,
            staffCostCpiFrequency: 2,
            capexItems,
            opexSubAccounts,
            adminSettings: adminSettingsMemo,
            otherRevenueByYear,
            versionId: version.id,
            versionMode: version.mode as 'RELOCATION_2028' | 'HISTORICAL_BASELINE',
            balanceSheetSettings: balanceSheetSettingsFetched,
            depreciationRate: 0.1,
            startYear: 2023,
            endYear: 2052,
            historicalActuals:
              historicalActualsFetched.length > 0 ? historicalActualsFetched : undefined,
          });

          if (!mounted) return;

          if (!projectionResult.success) {
            console.error('[FinancialStatementsWrapper] Projection error:', projectionResult.error);
            setError(projectionResult.error);
            setProjectionData(null);
            setLoadingSettings(false);
            return;
          }

          const projection = projectionResult.data;

          // Set projection data (single setState at the end)
          setProjectionData({
            years: projection.years,
            metadata: projection.metadata
              ? {
                  converged: projection.metadata.converged,
                  iterations: projection.metadata.iterations,
                  maxError: projection.metadata.maxError.toNumber(),
                  duration: projection.metadata.duration,
                  solverUsed: projection.metadata.solverUsed,
                }
              : {
                  converged: false,
                  iterations: 0,
                  maxError: 0,
                  duration: projection.duration,
                  solverUsed: false,
                },
          });
        } catch (projectionError) {
          if (!mounted) return;
          console.error(
            '[FinancialStatementsWrapper] Projection calculation error:',
            projectionError
          );
          setError(
            projectionError instanceof Error
              ? projectionError.message
              : 'Projection calculation failed'
          );
          setProjectionData(null);
        }
      } catch (err) {
        if (!mounted) return;
        console.error('[FinancialStatementsWrapper] Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        // Use defaults on error
        setBalanceSheetSettings({
          startingCash: 5000000,
          openingEquity: 55000000,
        });
      } finally {
        if (mounted) {
          setLoadingSettings(false);
        }
      }
    }

    fetchDataAndCalculateProjection();

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, [version.id, adminSettingsMemo]); // ✅ FIX: Only depend on primitive versionId and memoized settings

  // Handle settings save
  const handleBalanceSheetSettingsSave = () => {
    // Refetch data after save
    window.location.reload();
  };

  const handleOtherRevenueSave = () => {
    // Refetch data after save
    window.location.reload();
  };

  if (loadingSettings) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Settings</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!projectionData || !balanceSheetSettings) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Missing Data</AlertTitle>
        <AlertDescription>
          Unable to calculate financial statements. Please ensure the version has curriculum plans
          configured.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings Tabs */}
      <Tabs defaultValue="statements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="statements">Financial Statements</TabsTrigger>
          <TabsTrigger value="balance-sheet-settings">
            <Settings className="h-4 w-4 mr-2" />
            Balance Sheet Settings
          </TabsTrigger>
          <TabsTrigger value="other-revenue">
            <DollarSign className="h-4 w-4 mr-2" />
            Other Revenue
          </TabsTrigger>
        </TabsList>

        {/* Financial Statements Tab */}
        <TabsContent value="statements" className="space-y-4">
          <FinancialStatements
            versionId={version.id}
            versionMode={version.mode as 'RELOCATION_2028' | 'HISTORICAL_BASELINE'}
            projection={projectionData.years}
            metadata={projectionData.metadata}
          />
        </TabsContent>

        {/* Balance Sheet Settings Tab */}
        <TabsContent value="balance-sheet-settings" className="space-y-4">
          <BalanceSheetSettings
            versionId={version.id}
            initialData={balanceSheetSettings}
            onSave={handleBalanceSheetSettingsSave}
          />
        </TabsContent>

        {/* Other Revenue Tab */}
        <TabsContent value="other-revenue" className="space-y-4">
          <OtherRevenueEditor
            versionId={version.id}
            initialData={otherRevenue}
            onSave={handleOtherRevenueSave}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
