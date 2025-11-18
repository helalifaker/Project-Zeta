/**
 * Staffing Parameters Section Component
 * Displays and edits staffing-related parameters
 */

'use client';

import type { SectionProps, EditSectionProps } from './types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

/**
 * Helper function to safely parse numeric values
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
 * Calculate students per teacher from teacher ratio
 */
function getStudentsPerTeacher(teacherRatio: number | string | null | undefined): number | null {
  const ratio = parseNumeric(teacherRatio);
  if (ratio === null || ratio <= 0) return null;
  return 1 / ratio;
}

/**
 * Calculate students per non-teacher from non-teacher ratio
 */
function getStudentsPerNonTeacher(nonTeacherRatio: number | string | null | undefined): number | null {
  const ratio = parseNumeric(nonTeacherRatio);
  if (ratio === null || ratio <= 0) return null;
  return 1 / ratio;
}

/**
 * Calculate teacher count needed
 */
function calculateTeacherCount(capacity: number, studentsPerTeacher: number | null): number | null {
  if (studentsPerTeacher === null || studentsPerTeacher <= 0) return null;
  return Math.ceil(capacity / studentsPerTeacher);
}

/**
 * Calculate non-teacher count needed
 */
function calculateNonTeacherCount(capacity: number, studentsPerNonTeacher: number | null): number | null {
  if (studentsPerNonTeacher === null || studentsPerNonTeacher <= 0) return null;
  return Math.ceil(capacity / studentsPerNonTeacher);
}

/**
 * StaffingParametersSection - Display Mode
 */
export function StaffingParametersSection({ plan, curriculumType }: SectionProps): JSX.Element {
  const capacity = plan.capacity ?? 0;
  const studentsPerTeacher = getStudentsPerTeacher(plan.teacherRatio);
  const studentsPerNonTeacher = getStudentsPerNonTeacher(plan.nonTeacherRatio);
  const teacherMonthlySalary = parseNumeric(plan.teacherMonthlySalary);
  const nonTeacherMonthlySalary = parseNumeric(plan.nonTeacherMonthlySalary);
  
  const teacherCount = calculateTeacherCount(capacity, studentsPerTeacher);
  const nonTeacherCount = calculateNonTeacherCount(capacity, studentsPerNonTeacher);

  const hasRatios = studentsPerTeacher !== null && studentsPerNonTeacher !== null;
  const hasSalaries = teacherMonthlySalary !== null && nonTeacherMonthlySalary !== null;

  return (
    <div className="space-y-2">
      <h3 className="text-base font-medium text-foreground">Staffing Parameters</h3>
      {!hasRatios && !hasSalaries ? (
        <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md border border-muted">
          <p className="font-medium text-foreground mb-1">⚠️ Staffing not configured</p>
          <p className="text-xs">
            Click Edit to set Students per Teacher, Students per Non-Teacher, and monthly salaries for staff cost calculations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {studentsPerTeacher !== null && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Students per Teacher</p>
              <p className="text-sm font-semibold text-foreground">
                {studentsPerTeacher.toFixed(2)}
              </p>
              {teacherCount !== null && (
                <p className="text-xs text-muted-foreground">
                  ~{teacherCount} teacher{teacherCount !== 1 ? 's' : ''} needed at full capacity
                </p>
              )}
            </div>
          )}
          {studentsPerNonTeacher !== null && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Students per Non-Teacher</p>
              <p className="text-sm font-semibold text-foreground">
                {studentsPerNonTeacher.toFixed(2)}
              </p>
              {nonTeacherCount !== null && (
                <p className="text-xs text-muted-foreground">
                  ~{nonTeacherCount} non-teacher{nonTeacherCount !== 1 ? 's' : ''} needed at full capacity
                </p>
              )}
            </div>
          )}
          {teacherMonthlySalary !== null && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Teacher Monthly Salary</p>
              <p className="text-sm font-semibold text-foreground">
                {formatNumber(teacherMonthlySalary)} SAR
              </p>
              <p className="text-xs text-muted-foreground">
                Yearly: {formatNumber(teacherMonthlySalary * 12)} SAR (escalates with CPI)
              </p>
            </div>
          )}
          {nonTeacherMonthlySalary !== null && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Non-Teacher Monthly Salary</p>
              <p className="text-sm font-semibold text-foreground">
                {formatNumber(nonTeacherMonthlySalary)} SAR
              </p>
              <p className="text-xs text-muted-foreground">
                Yearly: {formatNumber(nonTeacherMonthlySalary * 12)} SAR (escalates with CPI)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * StaffingParametersSection - Edit Mode
 */
export function StaffingParametersSectionEdit({
  plan,
  curriculumType,
  formData,
  onFormDataChange,
  errors,
}: EditSectionProps): JSX.Element {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium text-foreground">Staffing Parameters</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`students-per-teacher-${plan.id}`}>
            Students per Teacher (e.g., 6.67 = 1 teacher per 6.67 students)
          </Label>
          <Input
            id={`students-per-teacher-${plan.id}`}
            type="number"
            min="0.1"
            step="0.1"
            value={formData.studentsPerTeacher ?? 6.67}
            onChange={(e) =>
              onFormDataChange({
                studentsPerTeacher: parseFloat(e.target.value) || 6.67,
              })
            }
            aria-invalid={errors?.studentsPerTeacher ? 'true' : 'false'}
            aria-describedby={errors?.studentsPerTeacher ? `students-per-teacher-error-${plan.id}` : undefined}
            className={errors?.studentsPerTeacher ? 'border-destructive' : ''}
          />
          {errors?.studentsPerTeacher && (
            <p id={`students-per-teacher-error-${plan.id}`} className="text-xs text-destructive" role="alert">
              {errors.studentsPerTeacher}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Used to calculate staff costs: Students ÷ Students per Teacher × Teacher Salary
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`students-per-non-teacher-${plan.id}`}>
            Students per Non-Teacher (e.g., 12.5 = 1 non-teacher per 12.5 students)
          </Label>
          <Input
            id={`students-per-non-teacher-${plan.id}`}
            type="number"
            min="0.1"
            step="0.1"
            value={formData.studentsPerNonTeacher ?? 12.5}
            onChange={(e) =>
              onFormDataChange({
                studentsPerNonTeacher: parseFloat(e.target.value) || 12.5,
              })
            }
            aria-invalid={errors?.studentsPerNonTeacher ? 'true' : 'false'}
            aria-describedby={errors?.studentsPerNonTeacher ? `students-per-non-teacher-error-${plan.id}` : undefined}
            className={errors?.studentsPerNonTeacher ? 'border-destructive' : ''}
          />
          {errors?.studentsPerNonTeacher && (
            <p id={`students-per-non-teacher-error-${plan.id}`} className="text-xs text-destructive" role="alert">
              {errors.studentsPerNonTeacher}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Used to calculate staff costs: Students ÷ Students per Non-Teacher × Non-Teacher Salary
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`teacher-monthly-salary-${plan.id}`}>
            Teacher Monthly Salary (SAR)
          </Label>
          <Input
            id={`teacher-monthly-salary-${plan.id}`}
            type="number"
            min="0"
            step="1000"
            value={formData.teacherMonthlySalary ?? 0}
            onChange={(e) => {
              const val = e.target.value;
              const numVal = val === '' ? 0 : parseFloat(val) || 0;
              onFormDataChange({
                teacherMonthlySalary: numVal,
              });
            }}
            placeholder="e.g., 15000"
            aria-invalid={errors?.teacherMonthlySalary ? 'true' : 'false'}
            aria-describedby={errors?.teacherMonthlySalary ? `teacher-monthly-salary-error-${plan.id}` : undefined}
            className={errors?.teacherMonthlySalary ? 'border-destructive' : ''}
          />
          {errors?.teacherMonthlySalary && (
            <p id={`teacher-monthly-salary-error-${plan.id}`} className="text-xs text-destructive" role="alert">
              {errors.teacherMonthlySalary}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Monthly salary. Yearly cost = Monthly × 12. Escalates annually with CPI.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`non-teacher-monthly-salary-${plan.id}`}>
            Non-Teacher Monthly Salary (SAR)
          </Label>
          <Input
            id={`non-teacher-monthly-salary-${plan.id}`}
            type="number"
            min="0"
            step="1000"
            value={formData.nonTeacherMonthlySalary ?? 0}
            onChange={(e) => {
              const val = e.target.value;
              const numVal = val === '' ? 0 : parseFloat(val) || 0;
              onFormDataChange({
                nonTeacherMonthlySalary: numVal,
              });
            }}
            placeholder="e.g., 10000"
            aria-invalid={errors?.nonTeacherMonthlySalary ? 'true' : 'false'}
            aria-describedby={errors?.nonTeacherMonthlySalary ? `non-teacher-monthly-salary-error-${plan.id}` : undefined}
            className={errors?.nonTeacherMonthlySalary ? 'border-destructive' : ''}
          />
          {errors?.nonTeacherMonthlySalary && (
            <p id={`non-teacher-monthly-salary-error-${plan.id}`} className="text-xs text-destructive" role="alert">
              {errors.nonTeacherMonthlySalary}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Monthly salary. Yearly cost = Monthly × 12. Escalates annually with CPI.
          </p>
        </div>
      </div>
    </div>
  );
}

