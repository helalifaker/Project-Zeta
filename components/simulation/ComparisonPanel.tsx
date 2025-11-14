/**
 * Comparison Panel Component
 * Right panel showing comparison with base version (deltas, changes, actions)
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Save } from 'lucide-react';
import { useSimulationStore } from '@/stores/simulation-store';
import Decimal from 'decimal.js';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';

interface ComparisonPanelProps {
  userRole?: string;
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

export function ComparisonPanel({ userRole: _userRole }: ComparisonPanelProps) {
  const router = useRouter();
  const { baseVersion, projection, baseProjection, changes, resetToBase } = useSimulationStore();
  const [saving, setSaving] = useState(false);

  // Calculate deltas
  const deltas = useMemo(() => {
    if (!projection || !baseProjection) return null;

    return {
      npvRent: projection.summary.npvRent.minus(baseProjection.summary.npvRent),
      npvCashFlow: projection.summary.npvCashFlow.minus(baseProjection.summary.npvCashFlow),
      avgEBITDAMargin: projection.summary.avgEBITDAMargin.minus(baseProjection.summary.avgEBITDAMargin),
      avgRentLoad: projection.summary.avgRentLoad.minus(baseProjection.summary.avgRentLoad),
    };
  }, [projection, baseProjection]);

  // Get list of changed parameters
  const changedParameters = useMemo(() => {
    const changesList: string[] = [];
    if (changes.curriculum?.fr) changesList.push('FR Curriculum');
    if (changes.curriculum?.ib) changesList.push('IB Curriculum');
    if (changes.rent) changesList.push('Rent');
    if (changes.staffing) changesList.push('Staffing');
    if (changes.opex) changesList.push('Opex');
    if (changes.capex) changesList.push('Capex');
    if (changes.admin) changesList.push('Admin Settings');
    return changesList;
  }, [changes]);

  const handleResetToBase = () => {
    if (confirm('Reset all changes to base version? This will discard all modifications.')) {
      resetToBase();
    }
  };

  const handleSaveAsNewVersion = async () => {
    if (!baseVersion) {
      alert('Please select a base version first');
      return;
    }

    const versionName = prompt('Enter name for new version:', `${baseVersion.name} - Modified`);
    if (!versionName) return;

    try {
      setSaving(true);
      const { parameters } = useSimulationStore.getState();
      if (!parameters) {
        alert('No parameters to save');
        return;
      }

      // Transform parameters to API format
      const response = await fetch('/api/versions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: versionName,
          description: `Modified version based on ${baseVersion.name}`,
          mode: baseVersion.mode,
          curriculumPlans: [
            {
              curriculumType: 'FR',
              capacity: parameters.curriculum.fr.capacity,
              tuitionBase:
                parameters.curriculum.fr.tuitionBase instanceof Decimal
                  ? parameters.curriculum.fr.tuitionBase.toNumber()
                  : parameters.curriculum.fr.tuitionBase,
              cpiFrequency: parameters.curriculum.fr.cpiFrequency,
              studentsProjection: parameters.curriculum.fr.studentsProjection,
            },
            {
              curriculumType: 'IB',
              capacity: parameters.curriculum.ib.capacity,
              tuitionBase:
                parameters.curriculum.ib.tuitionBase instanceof Decimal
                  ? parameters.curriculum.ib.tuitionBase.toNumber()
                  : parameters.curriculum.ib.tuitionBase,
              cpiFrequency: parameters.curriculum.ib.cpiFrequency,
              studentsProjection: parameters.curriculum.ib.studentsProjection,
            },
          ],
          rentPlan: {
            rentModel: parameters.rent.rentModel,
            parameters: parameters.rent.parameters,
          },
          // TODO: Include capex, opex, staff costs in version creation API
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/versions/${data.data.id}`);
        router.refresh();
      } else {
        alert(`Failed to save version: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to save version:', error);
      alert('Failed to save version');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <Card>
        <CardHeader>
          <CardTitle>Base Version</CardTitle>
          <CardDescription>{baseVersion?.name || 'Not selected'}</CardDescription>
        </CardHeader>
        <CardContent>
          {changedParameters.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm font-semibold">Modified Parameters:</div>
              <div className="flex flex-wrap gap-2">
                {changedParameters.map((param) => (
                  <Badge key={param} variant="outline" className="border-yellow-400">
                    {param}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No changes made</div>
          )}
        </CardContent>
      </Card>

      {/* Delta KPIs */}
      {deltas && projection && baseProjection && (
        <Card>
          <CardHeader>
            <CardTitle>Delta KPIs</CardTitle>
            <CardDescription>Difference from base version</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">NPV (Rent) Difference</div>
              <div
                className={`text-lg font-bold ${
                  deltas.npvRent.isNegative() ? 'text-red-400' : 'text-green-400'
                }`}
              >
                {deltas.npvRent.isNegative() ? '' : '+'}
                {formatCurrency(deltas.npvRent)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">NPV (Cash Flow) Difference</div>
              <div
                className={`text-lg font-bold ${
                  deltas.npvCashFlow.isNegative() ? 'text-red-400' : 'text-green-400'
                }`}
              >
                {deltas.npvCashFlow.isNegative() ? '' : '+'}
                {formatCurrency(deltas.npvCashFlow)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">EBITDA Margin Difference</div>
              <div
                className={`text-lg font-bold ${
                  deltas.avgEBITDAMargin.isNegative() ? 'text-red-400' : 'text-green-400'
                }`}
              >
                {deltas.avgEBITDAMargin.isNegative() ? '' : '+'}
                {formatPercent(deltas.avgEBITDAMargin)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Rent Load Difference</div>
              <div
                className={`text-lg font-bold ${
                  deltas.avgRentLoad.isNegative() ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {deltas.avgRentLoad.isNegative() ? '' : '+'}
                {formatPercent(deltas.avgRentLoad)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <Button
          onClick={handleResetToBase}
          variant="outline"
          className="w-full"
          disabled={changedParameters.length === 0}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Base
        </Button>
        <Button
          onClick={handleSaveAsNewVersion}
          className="w-full"
          disabled={saving || changedParameters.length === 0}
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save as New Version'}
        </Button>
      </div>
    </div>
  );
}

