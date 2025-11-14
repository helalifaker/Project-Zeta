/**
 * Tuition Controls Panel Component
 * Right panel with tuition sliders, CPI frequency selector, and enrollment inputs
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TuitionSlider } from './TuitionSlider';
import { EnrollmentInput } from './EnrollmentInput';
import { SaveScenarioButton } from './SaveScenarioButton';
import { useTuitionSimulatorStore } from '@/stores/tuition-simulator-store';
import type { VersionWithRelations } from '@/services/version';
import type { FullProjectionResult } from '@/lib/calculations/financial/projection';
import Decimal from 'decimal.js';
import { useMemo } from 'react';

interface TuitionControlsPanelProps {
  version: VersionWithRelations | null;
  projection: FullProjectionResult | null;
}

function formatCurrency(value: Decimal | number | string): string {
  const num = value instanceof Decimal ? value.toNumber() : typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0 SAR';
  
  if (Math.abs(num) >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B SAR`;
  }
  if (Math.abs(num) >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M SAR`;
  }
  if (Math.abs(num) >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K SAR`;
  }
  return `${num.toFixed(0)} SAR`;
}

function formatPercent(value: Decimal | number | string): string {
  const num = value instanceof Decimal ? value.toNumber() : typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0%';
  return `${num.toFixed(2)}%`;
}

export function TuitionControlsPanel({ version, projection }: TuitionControlsPanelProps) {
  const {
    tuitionAdjustments,
    tuitionLockedRatio,
    cpiFrequency,
    enrollmentProjections,
    setTuitionAdjustment,
    setTuitionLockedRatio,
    setCpiFrequencyForCurriculum,
  } = useTuitionSimulatorStore();

  // Get base tuition from version
  const baseTuitions = useMemo(() => {
    if (!version) return { fr: new Decimal(0), ib: new Decimal(0) };
    
    const frPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'FR');
    const ibPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'IB');
    
    return {
      fr: frPlan ? new Decimal(frPlan.tuitionBase) : new Decimal(0),
      ib: ibPlan ? new Decimal(ibPlan.tuitionBase) : new Decimal(0),
    };
  }, [version]);

  // Get capacities
  const capacities = useMemo(() => {
    if (!version) return { fr: 0, ib: 0 };
    
    const frPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'FR');
    const ibPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'IB');
    
    return {
      fr: frPlan?.capacity || 0,
      ib: ibPlan?.capacity || 0,
    };
  }, [version]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!projection) return null;

    return {
      totalRevenue: projection.summary.totalRevenue,
      avgEBITDAMargin: projection.summary.avgEBITDAMargin,
      avgRentLoad: projection.summary.avgRentLoad,
    };
  }, [projection]);

  if (!version) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          Select a version to adjust tuition and enrollment
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
      {/* Base Tuition Controls */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Base Tuition Adjustment</CardTitle>
            <CardDescription>Adjust base tuition per curriculum (-20% to +50%)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TuitionSlider
              curriculum="FR"
              baseTuition={baseTuitions.fr}
              adjustment={tuitionAdjustments.fr}
              onAdjustmentChange={(adj) => setTuitionAdjustment('fr', adj)}
              locked={tuitionLockedRatio}
              onLockToggle={() => setTuitionLockedRatio(!tuitionLockedRatio)}
            />
            <TuitionSlider
              curriculum="IB"
              baseTuition={baseTuitions.ib}
              adjustment={tuitionAdjustments.ib}
              onAdjustmentChange={(adj) => setTuitionAdjustment('ib', adj)}
              locked={tuitionLockedRatio}
            />
          </CardContent>
        </Card>

        {/* CPI Frequency Selector */}
        <Card>
          <CardHeader>
            <CardTitle>CPI Frequency</CardTitle>
            <CardDescription>Apply CPI growth every N years</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>French (FR)</Label>
              <Select
                value={String(cpiFrequency.fr)}
                onValueChange={(value) => setCpiFrequencyForCurriculum('fr', parseInt(value) as 1 | 2 | 3)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Every 1 year</SelectItem>
                  <SelectItem value="2">Every 2 years</SelectItem>
                  <SelectItem value="3">Every 3 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>IB</Label>
              <Select
                value={String(cpiFrequency.ib)}
                onValueChange={(value) => setCpiFrequencyForCurriculum('ib', parseInt(value) as 1 | 2 | 3)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Every 1 year</SelectItem>
                  <SelectItem value="2">Every 2 years</SelectItem>
                  <SelectItem value="3">Every 3 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrollment Projections */}
      <div className="space-y-4">
        <EnrollmentInput
          curriculum="FR"
          capacity={capacities.fr}
          enrollments={enrollmentProjections.fr}
          onEnrollmentChange={(year, students) => {
            useTuitionSimulatorStore.getState().setEnrollmentForYear('fr', year, students);
          }}
          suggestedStartPercentage={0.75} // 75% of capacity
          suggestedGrowthRate={5} // 5% per year
        />
        <EnrollmentInput
          curriculum="IB"
          capacity={capacities.ib}
          enrollments={enrollmentProjections.ib}
          onEnrollmentChange={(year, students) => {
            useTuitionSimulatorStore.getState().setEnrollmentForYear('ib', year, students);
          }}
          suggestedStartPercentage={0.15} // 15% of capacity
          suggestedGrowthRate={30} // 30% per year
        />
      </div>

      {/* Summary Metrics */}
      {summaryMetrics && (
        <div className="space-y-2">
          <Card>
            <CardHeader>
              <CardTitle>Summary Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <div className="text-muted-foreground">Total Revenue (30-year)</div>
                <div className="text-lg font-bold">{formatCurrency(summaryMetrics.totalRevenue)}</div>
              </div>
              <div className="text-sm">
                <div className="text-muted-foreground">Avg EBITDA Margin %</div>
                <div className="text-lg font-bold">{formatPercent(summaryMetrics.avgEBITDAMargin)}</div>
              </div>
              <div className="text-sm">
                <div className="text-muted-foreground">Avg Rent Load % (2028-2052)</div>
                <div className="text-lg font-bold">{formatPercent(summaryMetrics.avgRentLoad)}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Save Button */}
      <SaveScenarioButton version={version} />
    </div>
  );
}

