/**
 * Save Scenario Button Component
 * Save current simulation as a new version
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useTuitionSimulatorStore } from '@/stores/tuition-simulator-store';
import type { VersionWithRelations } from '@/services/version';
import { toDecimal } from '@/lib/calculations/decimal-helpers';

interface SaveScenarioButtonProps {
  version: VersionWithRelations | null;
}

export function SaveScenarioButton({ version }: SaveScenarioButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    tuitionAdjustments,
    cpiFrequency,
    enrollmentProjections,
  } = useTuitionSimulatorStore();

  const handleSave = async () => {
    if (!version) {
      alert('Please select a base version first');
      return;
    }

    if (!version.rentPlan || version.curriculumPlans.length < 2) {
      alert('Version data is incomplete');
      return;
    }

    // Prompt for new version name
    const versionName = prompt('Enter name for new scenario:', `${version.name} - Scenario`);
    if (!versionName) return;

    try {
      setLoading(true);

      // Get base curriculum plans
      const frPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'FR');
      const ibPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'IB');

      if (!frPlan) {
        alert('Version must have FR curriculum plan');
        return;
      }

      // IB is optional - only validate if present
      const isIBEnabled = ibPlan && ibPlan.capacity > 0;
      // Continue with save logic (IB can be missing/zero)

      // Calculate adjusted tuition bases
      const frBaseTuition = toDecimal(frPlan.tuitionBase);
      const ibBaseTuition = isIBEnabled && ibPlan ? toDecimal(ibPlan.tuitionBase) : new Decimal(0);
      const adjustedFrTuition = frBaseTuition.times(1 + tuitionAdjustments.fr / 100);
      const adjustedIbTuition = ibBaseTuition.times(1 + tuitionAdjustments.ib / 100);

      // Create new version via API
      const response = await fetch('/api/versions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: versionName,
          description: `Scenario based on ${version.name} with adjusted tuition and enrollment`,
          mode: version.mode,
          curriculumPlans: [
            {
              curriculumType: 'FR',
              capacity: frPlan.capacity,
              tuitionBase: adjustedFrTuition.toNumber(),
              cpiFrequency: cpiFrequency.fr,
              studentsProjection: enrollmentProjections.fr,
            },
            {
              curriculumType: 'IB',
              capacity: ibPlan.capacity,
              tuitionBase: adjustedIbTuition.toNumber(),
              cpiFrequency: cpiFrequency.ib,
              studentsProjection: enrollmentProjections.ib,
            },
          ],
          rentPlan: {
            rentModel: version.rentPlan.rentModel,
            parameters: version.rentPlan.parameters,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Navigate to new version detail page
        router.push(`/versions/${data.data.id}`);
        router.refresh();
      } else {
        alert(`Failed to save scenario: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to save scenario:', error);
      alert('Failed to save scenario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleSave} disabled={loading || !version} className="w-full">
      <Save className="mr-2 h-4 w-4" />
      {loading ? 'Saving...' : 'Save as Scenario'}
    </Button>
  );
}

