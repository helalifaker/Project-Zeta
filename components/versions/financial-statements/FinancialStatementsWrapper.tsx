/**
 * Financial Statements Wrapper Component
 * 
 * Fetches version data, balance sheet settings, other revenue, and calculates
 * 30-year arrays needed for the Financial Statements component.
 * 
 * This component handles all data preparation and passes clean props to FinancialStatements.
 */

'use client';

import { useState, useEffect } from 'react';
import { FinancialStatements } from './FinancialStatements';
import { BalanceSheetSettings } from '../BalanceSheetSettings';
import { OtherRevenueEditor } from '../OtherRevenueEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Settings, DollarSign } from 'lucide-react';
import { calculateFullProjection } from '@/lib/calculations/financial/projection';
import type { CurriculumPlanInput, RentPlanInput, YearlyProjection } from '@/lib/calculations/financial/projection';
import { calculateStaffCostBaseFromCurriculum } from '@/lib/calculations/financial/staff-costs';
import type { VersionWithRelations } from '@/services/version';
import Decimal from 'decimal.js';

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
export function FinancialStatementsWrapper(
  props: FinancialStatementsWrapperProps
): JSX.Element {
  const { version, adminSettings } = props;

  // State for balance sheet settings, other revenue, and historical data
  const [balanceSheetSettings, setBalanceSheetSettings] = useState<{
    startingCash: number;
    openingEquity: number;
  } | null>(null);
  const [otherRevenue, setOtherRevenue] = useState<Record<number, number>>({});
  const [historicalActuals, setHistoricalActuals] = useState<Array<{
    year: number;
    revenue: number;
    staffCost: number;
    rent: number;
    opex: number;
    capex: number;
  }>>([]);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch balance sheet settings and other revenue
  useEffect(() => {
    async function fetchData() {
      setLoadingSettings(true);
      setError(null);

      try {
        // Fetch balance sheet settings
        const bsResponse = await fetch(`/api/versions/${version.id}/balance-sheet-settings`);
        const bsData = await bsResponse.json();

        if (bsData.success && bsData.data) {
          setBalanceSheetSettings({
            startingCash: bsData.data.startingCash
              ? parseFloat(bsData.data.startingCash.toString())
              : 5000000, // Default: 5M SAR
            openingEquity: bsData.data.openingEquity
              ? parseFloat(bsData.data.openingEquity.toString())
              : 55000000, // Default: 55M SAR
          });
        } else {
          // Use defaults if not found
          setBalanceSheetSettings({
            startingCash: 5000000,
            openingEquity: 55000000,
          });
        }

        // Fetch other revenue
        const orResponse = await fetch(`/api/versions/${version.id}/other-revenue`);

        if (!orResponse.ok) {
          console.error('[FinancialStatementsWrapper] Other revenue HTTP error:', orResponse.status, orResponse.statusText);
          // Continue with empty other revenue (not critical)
        } else {
          const orData = await orResponse.json();

          if (orData.success && orData.data && orData.data.items) {
            const revenueMap: Record<number, number> = {};
            orData.data.items.forEach((item: { year: number; amount: string | number }) => {
              revenueMap[item.year] = parseFloat(item.amount.toString());
            });
            setOtherRevenue(revenueMap);
          }
        }

        // Fetch historical actuals (2023-2024)
        const haResponse = await fetch(`/api/admin/historical-data?versionId=${version.id}`);

        if (!haResponse.ok) {
          console.error('[FinancialStatementsWrapper] Historical data HTTP error:', haResponse.status, haResponse.statusText);
          // Continue with empty historical data (not critical)
        } else {
          const haData = await haResponse.json();

          if (haData.success && haData.data && Array.isArray(haData.data)) {
            const historicalArray = haData.data.map((h: any) => ({
              year: h.year,
              // Map complete financial statement fields to simple projection fields
              revenue: parseFloat(h.totalRevenues || '0'),
              staffCost: parseFloat(h.salariesAndRelatedCosts || '0'),
              rent: parseFloat(h.schoolRent || '0'),
              // Calculate opex as total operating expenses minus salaries and rent
              opex: parseFloat(h.totalOperatingExpenses || '0') -
                    parseFloat(h.salariesAndRelatedCosts || '0') -
                    parseFloat(h.schoolRent || '0'),
              capex: Math.abs(parseFloat(h.cfAdditionsFixedAssets || '0')),
            }));

            console.log('[FinancialStatementsWrapper] ✅ Fetched historical actuals:', historicalArray);
            setHistoricalActuals(historicalArray);
          }
        }
      } catch (err) {
        console.error('[FinancialStatementsWrapper] Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load settings');
        // Use defaults on error
        setBalanceSheetSettings({
          startingCash: 5000000,
          openingEquity: 55000000,
        });
      } finally {
        setLoadingSettings(false);
      }
    }

    fetchData();
  }, [version.id]);

  // ✅ FIX 1: Convert to useEffect + useState to support async calculateFullProjection
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
  const [projectionLoading, setProjectionLoading] = useState(false);

  useEffect(() => {
    async function calculateProjection() {
      if (!version.curriculumPlans || version.curriculumPlans.length === 0) {
        setProjectionData(null);
        return;
      }

      setProjectionLoading(true);

      try {
        // Prepare curriculum plans
        const curriculumPlans = version.curriculumPlans.map((cp) => {
          // Extract staff cost fields (they exist in the database schema)
          const teacherRatio = (cp as any).teacherRatio ?? null;
          const nonTeacherRatio = (cp as any).nonTeacherRatio ?? null;
          const teacherMonthlySalary = (cp as any).teacherMonthlySalary ?? null;
          const nonTeacherMonthlySalary = (cp as any).nonTeacherMonthlySalary ?? null;
          
          // 🐛 DEBUG: Log what we're getting from the database
          console.log(`[STAFF COST DATA] ${cp.curriculumType}:`, {
            teacherRatio,
            nonTeacherRatio,
            teacherMonthlySalary,
            nonTeacherMonthlySalary,
            hasAllFields: teacherRatio !== null && nonTeacherRatio !== null && 
                         teacherMonthlySalary !== null && nonTeacherMonthlySalary !== null,
            rawCp: cp, // Log entire object to see what fields are available
          });
          
          return {
            curriculumType: cp.curriculumType as 'FR' | 'IB',
            capacity: cp.capacity,
            tuitionBase: cp.tuitionBase,
            cpiFrequency: cp.cpiFrequency as 1 | 2 | 3,
            studentsProjection: cp.studentsProjection
              ? (Array.isArray(cp.studentsProjection)
                  ? cp.studentsProjection
                  : JSON.parse(String(cp.studentsProjection)))
              : [],
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
                ? (typeof version.rentPlan.parameters === 'string'
                    ? JSON.parse(version.rentPlan.parameters)
                    : version.rentPlan.parameters)
                : {},
            }
          : {
              rentModel: 'FIXED_ESCALATION' as const,
              parameters: {},
            };

        // Calculate staff cost base
        // Try using proper teacher ratios if available, otherwise use fallback estimate
        const baseYear = version.mode === 'RELOCATION_2028' ? 2028 : 2023; // Use 2028 for relocation, 2023 for historical
        
        // Check if curriculum plans have staff cost configuration
        const hasStaffCostConfig = curriculumPlans.some(
          cp => cp.teacherRatio !== null && cp.teacherRatio !== undefined &&
                cp.nonTeacherRatio !== null && cp.nonTeacherRatio !== undefined &&
                cp.teacherMonthlySalary !== null && cp.teacherMonthlySalary !== undefined &&
                cp.nonTeacherMonthlySalary !== null && cp.nonTeacherMonthlySalary !== undefined
        );
        
        let staffCostBase: number;
        
        if (hasStaffCostConfig) {
          // Use proper calculation with teacher ratios
          const staffCostBaseResult = calculateStaffCostBaseFromCurriculum(
            curriculumPlans,
            baseYear
          );
          
          if (!staffCostBaseResult.success) {
            console.error('[FinancialStatementsWrapper] Failed to calculate staff cost base:', staffCostBaseResult.error);
            setError(staffCostBaseResult.error);
            return;
          }
          
          staffCostBase = staffCostBaseResult.data.toNumber();
        } else {
          // Fallback: Use capacity-based estimate (30K SAR per student per year)
          // This is a placeholder until staff cost configuration is added to the database
          console.warn('[FinancialStatementsWrapper] Staff cost configuration not found, using fallback estimate');
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

        // ✅ FIX 1: Convert otherRevenue state to otherRevenueByYear format
        const otherRevenueByYear = Object.entries(otherRevenue).map(([year, amount]) => ({
          year: parseInt(year, 10),
          amount,
        }));

        // Calculate full projection (now async)
        const projectionResult = await calculateFullProjection({
          curriculumPlans,
          rentPlan,
          staffCostBase,
          staffCostCpiFrequency: 2, // Default: every 2 years
          capexItems,
          opexSubAccounts,
          adminSettings: {
            cpiRate: adminSettings.cpiRate,
            discountRate: adminSettings.discountRate,
            zakatRate: adminSettings.zakatRate,
          },
          otherRevenueByYear, // ✅ FIX 1: Pass Other Revenue (removes need for manual addition)
          versionId: version.id, // ✅ FIX 3: Required for CircularSolver
          versionMode: version.mode as 'RELOCATION_2028' | 'HISTORICAL_BASELINE', // ✅ FIX 3: Pass version mode
          balanceSheetSettings: balanceSheetSettings ? { // ✅ FIX 3: Pass balance sheet settings
            startingCash: balanceSheetSettings.startingCash,
            openingEquity: balanceSheetSettings.openingEquity,
          } : undefined,
          depreciationRate: 0.10, // ✅ FIX 3: Default 10% (TODO: fetch from admin settings)
          startYear: 2023,
          endYear: 2052,
          historicalActuals: historicalActuals.length > 0 ? historicalActuals : undefined, // ✅ Pass pre-fetched historical data
        });

        if (!projectionResult.success) {
          console.error('[FinancialStatementsWrapper] Projection error:', projectionResult.error);
          setProjectionData(null);
          return;
        }

        const projection = projectionResult.data;

        // ✅ CHALLENGE 1 FIX: Store full projection data instead of extracting arrays
        setProjectionData({
          years: projection.years, // Full YearlyProjection[] with all fields
          metadata: projection.metadata ? {
            converged: projection.metadata.converged,
            iterations: projection.metadata.iterations,
            maxError: projection.metadata.maxError.toNumber(),
            duration: projection.metadata.duration,
            solverUsed: projection.metadata.solverUsed,
          } : {
            converged: false,
            iterations: 0,
            maxError: 0,
            duration: projection.duration,
            solverUsed: false,
          },
        });
      } catch (err) {
        console.error('[FinancialStatementsWrapper] Projection calculation error:', err);
        setProjectionData(null);
      } finally {
        setProjectionLoading(false);
      }
    }

    calculateProjection();
  }, [version, adminSettings, otherRevenue, historicalActuals]);

  // Handle settings save
  const handleBalanceSheetSettingsSave = () => {
    // Refetch data after save
    window.location.reload();
  };

  const handleOtherRevenueSave = () => {
    // Refetch data after save
    window.location.reload();
  };

  if (loadingSettings || projectionLoading) {
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
          Unable to calculate financial statements. Please ensure the version has curriculum plans configured.
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

