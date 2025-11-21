/**
 * Transition Period Planning Page
 * Admin interface for managing transition period parameters (2025-2027)
 */

'use client';

import { useState, useEffect } from 'react';
import { GlobalSettingsCard } from '@/components/admin/transition/GlobalSettingsCard';
import { YearlyPlanningTable } from '@/components/admin/transition/YearlyPlanningTable';
import { QuickActionsBar } from '@/components/admin/transition/QuickActionsBar';
import { RecalculateDialog } from '@/components/admin/transition/RecalculateDialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, X, School, AlertTriangle } from 'lucide-react';

interface TransitionSettings {
  capacityCap: number;
  rentAdjustmentPercent: number;
  staffCostBase2024: string | null;
  rentBase2024: string | null;
}

interface YearData {
  id: string;
  year: number;
  targetEnrollment: number;
  staffCostBase: string;

  // NEW FIELDS
  averageTuitionPerStudent?: string | null;
  otherRevenue?: string | null;
  opex?: string | null; // Operating expenses
  staffCostGrowthPercent?: string | null;
  rentGrowthPercent?: string | null;

  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface TransitionData {
  settings: TransitionSettings;
  yearData: YearData[];
}

export default function TransitionPlanningPage(): JSX.Element {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showRecalculateDialog, setShowRecalculateDialog] = useState(false);

  const [settings, setSettings] = useState<TransitionSettings>({
    capacityCap: 1850,
    rentAdjustmentPercent: 10.0,
    staffCostBase2024: null,
    rentBase2024: null,
  });

  const [yearData, setYearData] = useState<YearData[]>([]);
  const [originalData, setOriginalData] = useState<TransitionData | null>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchTransitionData();
  }, []);

  // Track dirty state
  useEffect(() => {
    if (!originalData) {
      console.log('🔍 Dirty check: No original data yet');
      setIsDirty(false);
      return;
    }

    const settingsChanged =
      settings.capacityCap !== originalData.settings.capacityCap ||
      settings.rentAdjustmentPercent !== originalData.settings.rentAdjustmentPercent;

    const yearDataChanged = yearData.some((item, index) => {
      const original = originalData.yearData[index];
      if (!original) {
        console.log(`🔍 Year ${item.year}: No original data found`);
        return true;
      }

      const changes = {
        targetEnrollment: item.targetEnrollment !== original.targetEnrollment,
        staffCostBase: item.staffCostBase !== original.staffCostBase,
        averageTuitionPerStudent:
          item.averageTuitionPerStudent !== original.averageTuitionPerStudent,
        otherRevenue: item.otherRevenue !== original.otherRevenue,
        opex: item.opex !== original.opex,
        staffCostGrowthPercent: item.staffCostGrowthPercent !== original.staffCostGrowthPercent,
        rentGrowthPercent: item.rentGrowthPercent !== original.rentGrowthPercent,
      };

      const hasChange = Object.values(changes).some((c) => c);

      if (hasChange) {
        console.log(`🔍 Year ${item.year} changes:`, changes);
        console.log('  Current:', {
          averageTuitionPerStudent: item.averageTuitionPerStudent,
          otherRevenue: item.otherRevenue,
          opex: item.opex,
        });
        console.log('  Original:', {
          averageTuitionPerStudent: original.averageTuitionPerStudent,
          otherRevenue: original.otherRevenue,
          opex: original.opex,
        });
      }

      return hasChange;
    });

    console.log('🔍 Dirty check:', {
      settingsChanged,
      yearDataChanged,
      isDirty: settingsChanged || yearDataChanged,
    });
    setIsDirty(settingsChanged || yearDataChanged);
  }, [settings, yearData, originalData]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const fetchTransitionData = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/transition');
      const result = await response.json();

      if (result.success && result.data) {
        const data: TransitionData = result.data;
        setSettings(data.settings);
        setYearData(data.yearData);
        setOriginalData(data);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to load transition data',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to fetch transition data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load transition data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsChange = (newSettings: {
    capacityCap: number;
    rentAdjustmentPercent: number;
  }): void => {
    setSettings({
      ...settings,
      capacityCap: newSettings.capacityCap,
      rentAdjustmentPercent: newSettings.rentAdjustmentPercent,
    });
  };

  const handleYearDataChange = (newYearData: YearData[]): void => {
    setYearData(newYearData);
  };

  const handleSaveAll = async (): Promise<void> => {
    setIsSaving(true);
    try {
      // Use bulk update endpoint
      // NOTE: Base year values (staffCostBase2024, rentBase2024) are read-only from historical_actuals
      // They should NOT be saved - only displayed for reference
      const response = await fetch('/api/admin/transition', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            capacityCap: settings.capacityCap,
            rentAdjustmentPercent: settings.rentAdjustmentPercent,
            // DO NOT save base year values - they come from historical_actuals (read-only)
          },
          yearData: yearData.map((year) => {
            // Convert staffCostBase from string to number
            const staffCostBaseNum = parseFloat(year.staffCostBase);
            if (isNaN(staffCostBaseNum) || staffCostBaseNum <= 0) {
              throw new Error(`Invalid staff cost value for year ${year.year}`);
            }

            return {
              year: year.year,
              targetEnrollment: year.targetEnrollment,
              staffCostBase: staffCostBaseNum,
              averageTuitionPerStudent: year.averageTuitionPerStudent
                ? parseFloat(year.averageTuitionPerStudent)
                : undefined,
              otherRevenue: year.otherRevenue ? parseFloat(year.otherRevenue) : undefined,
              opex: year.opex ? parseFloat(year.opex) : undefined,
              staffCostGrowthPercent: year.staffCostGrowthPercent
                ? parseFloat(year.staffCostGrowthPercent)
                : undefined,
              rentGrowthPercent: year.rentGrowthPercent
                ? parseFloat(year.rentGrowthPercent)
                : undefined,
              notes: year.notes || undefined,
            };
          }),
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to save transition data');
      }

      // Refresh data from server to get updated values
      await fetchTransitionData();

      toast({
        title: 'Success',
        description: 'Transition parameters updated successfully',
      });
    } catch (error) {
      console.error('Failed to save transition data:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = (): void => {
    if (originalData) {
      setSettings(originalData.settings);
      setYearData(originalData.yearData);
      setIsDirty(false);
      toast({
        title: 'Changes Discarded',
        description: 'All unsaved changes have been discarded',
      });
    }
  };

  const handleRecalculateFromDialog = async (
    staffCost2028: number,
    cpiRate: number
  ): Promise<void> => {
    try {
      const response = await fetch('/api/admin/transition/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base2028StaffCost: staffCost2028,
          cpiRate: cpiRate / 100, // Convert percentage to decimal
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Update year data with recalculated values
        const updatedYearData = yearData.map((item) => {
          const recalculated = result.data.find((r: YearData) => r.year === item.year);
          if (recalculated) {
            return { ...item, staffCostBase: recalculated.staffCostBase };
          }
          return item;
        });
        setYearData(updatedYearData);

        toast({
          title: 'Recalculation Complete',
          description: 'Staff costs have been recalculated from 2028 baseline',
        });
      } else {
        throw new Error(result.error || 'Recalculation failed');
      }
    } catch (error) {
      console.error('Failed to recalculate:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Recalculation failed',
        variant: 'destructive',
      });
    }
  };

  const handleReset = async (): Promise<void> => {
    // Reset to default values
    const defaultSettings: TransitionSettings = {
      capacityCap: 1850,
      rentAdjustmentPercent: 10.0,
      staffCostBase2024: settings.staffCostBase2024,
      rentBase2024: settings.rentBase2024,
    };

    const defaultYearData: YearData[] = [
      {
        id: yearData[0]?.id || '',
        year: 2025,
        targetEnrollment: 1850,
        staffCostBase: '8500000',
        averageTuitionPerStudent: null,
        otherRevenue: null,
        staffCostGrowthPercent: null,
        rentGrowthPercent: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: yearData[1]?.id || '',
        year: 2026,
        targetEnrollment: 1850,
        staffCostBase: '8755000',
        averageTuitionPerStudent: null,
        otherRevenue: null,
        staffCostGrowthPercent: null,
        rentGrowthPercent: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: yearData[2]?.id || '',
        year: 2027,
        targetEnrollment: 1850,
        staffCostBase: '9017650',
        averageTuitionPerStudent: null,
        otherRevenue: null,
        staffCostGrowthPercent: null,
        rentGrowthPercent: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    setSettings(defaultSettings);
    setYearData(defaultYearData);

    toast({
      title: 'Reset Complete',
      description: 'All values have been reset to defaults',
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading transition planning data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <School className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Transition Period Planning (2025-2027)</h1>
        </div>
        <p className="text-muted-foreground">
          Configure operational parameters for temporary facility during transition years
        </p>
      </div>

      {/* Unsaved Changes Warning */}
      {isDirty && (
        <Alert className="mb-6 border-yellow-500 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-yellow-600 dark:text-yellow-400">
            You have unsaved changes. Remember to save before leaving this page.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="space-y-6">
        {/* Global Settings */}
        <GlobalSettingsCard
          capacityCap={settings.capacityCap}
          rentAdjustmentPercent={settings.rentAdjustmentPercent}
          staffCostBase2024={
            settings.staffCostBase2024 ? parseFloat(settings.staffCostBase2024) : undefined
          }
          rentBase2024={settings.rentBase2024 ? parseFloat(settings.rentBase2024) : undefined}
          onChange={handleSettingsChange}
          disabled={isSaving}
        />

        {/* Yearly Planning Table */}
        <YearlyPlanningTable
          yearData={yearData}
          capacityCap={settings.capacityCap}
          staffCostBase2024={
            settings.staffCostBase2024 ? parseFloat(settings.staffCostBase2024) : 0
          }
          rentBase2024={settings.rentBase2024 ? parseFloat(settings.rentBase2024) : 0}
          onChange={handleYearDataChange}
          disabled={isSaving}
        />

        {/* Quick Actions */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <QuickActionsBar
            onRecalculate={() => setShowRecalculateDialog(true)}
            onReset={handleReset}
            disabled={isSaving}
          />
        </div>

        {/* Save Controls */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleDiscardChanges} disabled={isSaving || !isDirty}>
            <X className="mr-2 h-4 w-4" />
            Discard Changes
          </Button>
          <Button onClick={handleSaveAll} disabled={isSaving || !isDirty}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save All Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Recalculate Dialog */}
      <RecalculateDialog
        open={showRecalculateDialog}
        onOpenChange={setShowRecalculateDialog}
        onConfirm={handleRecalculateFromDialog}
      />
    </div>
  );
}
