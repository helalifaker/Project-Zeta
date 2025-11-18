/**
 * Basic Configuration Section Component
 * Displays and edits basic curriculum configuration (capacity, tuition, CPI)
 */

'use client';

import type { SectionProps, EditSectionProps } from './types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

/**
 * Helper function to safely parse numeric values from plan
 */
function parseNumeric(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

/**
 * Format number with locale
 */
function formatNumber(value: number | null): string {
  if (value === null) return 'N/A';
  return value.toLocaleString('en-US');
}

/**
 * BasicConfigurationSection - Display Mode
 */
export function BasicConfigurationSection({ plan, curriculumType }: SectionProps): JSX.Element {
  const capacity = plan.capacity ?? 0;
  const tuitionBase = parseNumeric(plan.tuitionBase);
  const cpiFrequency = plan.cpiFrequency ?? 1;
  const tuitionGrowthRate = parseNumeric(plan.tuitionGrowthRate);

  return (
    <div className="space-y-2">
      <h3 className="text-base font-medium text-foreground">Basic Configuration</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Capacity</p>
          <p className="text-sm font-semibold text-foreground">
            {capacity} students
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Base Tuition</p>
          <p className="text-sm font-semibold text-foreground">
            {tuitionBase !== null ? `${formatNumber(tuitionBase)} SAR` : 'N/A'}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">CPI Frequency</p>
          <p className="text-sm font-semibold text-foreground">
            Every {cpiFrequency} year{cpiFrequency !== 1 ? 's' : ''}
          </p>
        </div>
        {tuitionGrowthRate !== null && tuitionGrowthRate !== undefined && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Tuition Growth Rate</p>
            <p className="text-sm font-semibold text-foreground">
              {(tuitionGrowthRate * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">
              Applied every {cpiFrequency} year{cpiFrequency !== 1 ? 's' : ''}, separate from CPI
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * BasicConfigurationSection - Edit Mode
 */
export function BasicConfigurationSectionEdit({
  plan,
  curriculumType,
  formData,
  onFormDataChange,
  errors,
}: EditSectionProps): JSX.Element {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium text-foreground">Basic Configuration</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`capacity-${plan.id}`}>
            Capacity (students)
            {curriculumType === 'FR' && (
              <span aria-label="required" className="text-destructive ml-1">*</span>
            )}
          </Label>
          <Input
            id={`capacity-${plan.id}`}
            type="number"
            min={curriculumType === 'IB' ? 0 : 1}
            value={formData.capacity}
            onChange={(e) =>
              onFormDataChange({
                capacity: parseInt(e.target.value) || 0,
              })
            }
            aria-invalid={errors?.capacity ? 'true' : 'false'}
            aria-describedby={errors?.capacity ? `capacity-error-${plan.id}` : undefined}
            className={errors?.capacity ? 'border-destructive' : ''}
          />
          {errors?.capacity && (
            <p id={`capacity-error-${plan.id}`} className="text-xs text-destructive" role="alert">
              {errors.capacity}
            </p>
          )}
          {curriculumType === 'IB' && (
            <p className="text-xs text-muted-foreground">
              Set to 0 to disable IB program
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`tuition-${plan.id}`}>
            Base Tuition (SAR)
            <span aria-label="required" className="text-destructive ml-1">*</span>
          </Label>
          <Input
            id={`tuition-${plan.id}`}
            type="number"
            min="0"
            step="1000"
            value={formData.tuitionBase ?? 0}
            onChange={(e) =>
              onFormDataChange({
                tuitionBase: parseFloat(e.target.value) || 0,
              })
            }
            aria-invalid={errors?.tuitionBase ? 'true' : 'false'}
            aria-describedby={errors?.tuitionBase ? `tuition-error-${plan.id}` : undefined}
            className={errors?.tuitionBase ? 'border-destructive' : ''}
          />
          {errors?.tuitionBase && (
            <p id={`tuition-error-${plan.id}`} className="text-xs text-destructive" role="alert">
              {errors.tuitionBase}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`cpi-${plan.id}`}>
            CPI Frequency (years)
            <span aria-label="required" className="text-destructive ml-1">*</span>
          </Label>
          <Input
            id={`cpi-${plan.id}`}
            type="number"
            min="1"
            max="3"
            value={formData.cpiFrequency}
            onChange={(e) =>
              onFormDataChange({
                cpiFrequency: parseInt(e.target.value) || 1,
              })
            }
            aria-invalid={errors?.cpiFrequency ? 'true' : 'false'}
            aria-describedby={errors?.cpiFrequency ? `cpi-error-${plan.id}` : undefined}
            className={errors?.cpiFrequency ? 'border-destructive' : ''}
          />
          {errors?.cpiFrequency && (
            <p id={`cpi-error-${plan.id}`} className="text-xs text-destructive" role="alert">
              {errors.cpiFrequency}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            How often to apply tuition growth rate (every 1, 2, or 3 years)
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`tuition-growth-rate-${plan.id}`}>
            Tuition Growth Rate (0-100%, e.g., 5 = 5% increase)
          </Label>
          <Input
            id={`tuition-growth-rate-${plan.id}`}
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={(formData.tuitionGrowthRate ?? 0.03) * 100}
            onChange={(e) =>
              onFormDataChange({
                tuitionGrowthRate: parseFloat(e.target.value) / 100 || 0,
              })
            }
            aria-invalid={errors?.tuitionGrowthRate ? 'true' : 'false'}
            aria-describedby={errors?.tuitionGrowthRate ? `tuition-growth-rate-error-${plan.id}` : undefined}
            className={errors?.tuitionGrowthRate ? 'border-destructive' : ''}
          />
          {errors?.tuitionGrowthRate && (
            <p id={`tuition-growth-rate-error-${plan.id}`} className="text-xs text-destructive" role="alert">
              {errors.tuitionGrowthRate}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Applied every {formData.cpiFrequency} year{formData.cpiFrequency !== 1 ? 's' : ''}, separate from CPI rate
          </p>
        </div>
      </div>
    </div>
  );
}

