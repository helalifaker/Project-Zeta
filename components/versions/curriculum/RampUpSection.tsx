/**
 * Ramp-Up Section Component
 * Displays and edits capacity ramp-up timeline (2028-2032)
 * Most visually prominent section with timeline visualization
 */

'use client';

import type { SectionProps, EditSectionProps } from './types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Parse students projection from plan
 */
function parseStudentsProjection(
  projection: Array<{ year: number; students: number }> | string | null | undefined
): Array<{ year: number; students: number }> | null {
  if (!projection) return null;
  if (Array.isArray(projection)) return projection;
  try {
    const parsed = JSON.parse(String(projection));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Get students for a specific year from projection
 */
function getStudentsForYear(
  projection: Array<{ year: number; students: number }> | null,
  year: number
): number {
  if (!projection) return 0;
  const entry = projection.find((e) => e.year === year);
  return entry?.students ?? 0;
}

/**
 * RampUpSection - Display Mode with Timeline Visualization
 */
export function RampUpSection({ plan, curriculumType }: SectionProps): JSX.Element {
  const capacity = plan.capacity ?? 0;
  const projection = parseStudentsProjection(plan.studentsProjection);
  const rampUpYears = [2028, 2029, 2030, 2031, 2032];

  // Get 2032 data for post-2032 note
  const year2032Students = getStudentsForYear(projection, 2032);
  const year2032Utilization = capacity > 0 ? ((year2032Students / capacity) * 100).toFixed(1) : '0';

  const accentColor = curriculumType === 'FR' ? 'bg-accent-blue' : 'bg-accent-green';

  if (!projection) {
    return (
      <div className="space-y-2">
        <h3 className="text-base font-medium text-foreground">Capacity Ramp-Up (2028-2032)</h3>
        <p className="text-sm text-muted-foreground">No ramp-up data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-base font-medium text-foreground">Capacity Ramp-Up (2028-2032)</h3>
      <div className="space-y-2">
        {rampUpYears.map((year) => {
          const students = getStudentsForYear(projection, year);
          const percentage = capacity > 0 ? (students / capacity) * 100 : 0;

          return (
            <div key={year} className="flex items-center gap-3">
              {/* Year label */}
              <div className="w-12 text-sm font-medium text-muted-foreground">
                {year}
              </div>

              {/* Progress bar */}
              <div className="flex-1">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn('h-full transition-all', accentColor)}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                    aria-label={`${percentage.toFixed(1)}% utilization`}
                  />
                </div>
              </div>

              {/* Percentage and count */}
              <div className="w-32 text-right text-sm">
                <span className="font-semibold text-foreground">
                  {percentage.toFixed(1)}%
                </span>
                <span className="ml-1 text-muted-foreground">
                  ({students} students)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Note about post-2032 */}
      <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
        📌 Years 2033-2052: Maintain {year2032Utilization}% utilization ({year2032Students} students, same as 2032)
      </p>
    </div>
  );
}

/**
 * RampUpSection - Edit Mode
 */
export function RampUpSectionEdit({
  plan,
  curriculumType,
  formData,
  onFormDataChange,
  errors,
}: EditSectionProps): JSX.Element {
  const capacity = formData.capacity;
  const rampUp = formData.rampUp ?? {};
  const rampUpYears = [2028, 2029, 2030, 2031, 2032];

  const handlePercentageChange = (year: number, value: string) => {
    const percentage = parseFloat(value) || 0;
    onFormDataChange({
      rampUp: {
        ...rampUp,
        [year]: percentage,
      },
    });
  };

  const calculateStudentCount = (year: number): number => {
    const percentage = rampUp[year] ?? 0;
    return Math.round((capacity * percentage) / 100);
  };

  const get2032Percentage = (): string => {
    return (rampUp[2032] ?? 100).toFixed(1);
  };

  const get2032StudentCount = (): number => {
    return calculateStudentCount(2032);
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="space-y-2">
        <h3 className="text-base font-medium text-foreground">Capacity Ramp-Up (2028-2032)</h3>
        <p className="text-xs text-muted-foreground">
          Set enrollment as % of capacity for the first 5 years after relocation. After 2032, enrollment will maintain the same % as 2032.
          {curriculumType === 'FR' && ' FR: Established school, typically starts at 70-80% capacity.'}
          {curriculumType === 'IB' && ' IB: New program, typically starts at 0-20% capacity.'}
        </p>
      </div>
      <div className="space-y-3">
        {rampUpYears.map((year) => {
          const percentage = rampUp[year] ?? 0;
          const students = calculateStudentCount(year);
          const isOver100 = percentage > 100;
          const errorKey = `rampUp.${year}`;
          const hasError = errors?.[errorKey];

          return (
            <div key={year} className="flex items-center gap-4">
              <Label htmlFor={`rampup-${year}-${plan.id}`} className="w-12 text-sm font-medium">
                {year} {year === 2032 && '(Year 5)'}
              </Label>

              {/* Percentage input */}
              <div className="flex-1 flex items-center gap-2">
                <Input
                  id={`rampup-${year}-${plan.id}`}
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={percentage.toFixed(1)}
                  onChange={(e) => handlePercentageChange(year, e.target.value)}
                  aria-label={`${year} capacity percentage`}
                  aria-invalid={hasError || isOver100 ? 'true' : 'false'}
                  aria-describedby={
                    hasError || isOver100
                      ? `rampup-${year}-error-${plan.id}`
                      : undefined
                  }
                  className={cn(
                    'w-20',
                    (hasError || isOver100) && 'border-destructive'
                  )}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>

              {/* Student count (auto-calculated, read-only) */}
              <div className="w-32 text-sm">
                <span className="text-muted-foreground">= {students} students</span>
                {isOver100 && (
                  <span className="ml-2 text-destructive text-xs block">⚠️ Over 100%!</span>
                )}
                {hasError && (
                  <p id={`rampup-${year}-error-${plan.id}`} className="text-xs text-destructive mt-1" role="alert">
                    {errors?.[errorKey]}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Note about post-2032 */}
      <div className="mt-3 text-xs text-muted-foreground bg-muted/30 p-2 rounded-md border border-muted">
        <strong>Note:</strong> Years 2033-2052 will maintain the same enrollment percentage as 2032 ({get2032Percentage()}% = {get2032StudentCount()} students).
      </div>
    </div>
  );
}

