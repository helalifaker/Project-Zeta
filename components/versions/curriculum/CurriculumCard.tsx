/**
 * Curriculum Card Component
 * Main component for displaying and editing curriculum plans
 * Supports visual distinction (FR blue, IB green) and integrated editing
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Edit2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CurriculumCardProps, EditFormData } from './types';
import { BasicConfigurationSection, BasicConfigurationSectionEdit } from './BasicConfigurationSection';
import { StaffingParametersSection, StaffingParametersSectionEdit } from './StaffingParametersSection';
import { RampUpSection, RampUpSectionEdit } from './RampUpSection';
import { useState, useEffect } from 'react';

/**
 * CurriculumCard component displays curriculum plan information
 * with visual distinction for FR (blue) and IB (green) curricula.
 * 
 * Supports inline editing mode with form validation and error handling.
 * 
 * @param props - CurriculumCardProps containing plan data and callbacks
 * @returns JSX.Element - Card component with curriculum information
 * 
 * @example
 * ```tsx
 * <CurriculumCard
 *   curriculumType="FR"
 *   plan={frPlan}
 *   isEditing={editingPlanId === frPlan.id}
 *   editFormData={editFormData}
 *   onEditStart={() => handleEditStart(frPlan)}
 *   onEditCancel={handleEditCancel}
 *   onSave={handleSave}
 *   canEdit={version.status === 'DRAFT'}
 *   saving={saving}
 * />
 * ```
 */
export function CurriculumCard(props: CurriculumCardProps): JSX.Element {
  const {
    curriculumType,
    plan,
    isEditing,
    editFormData,
    onEditStart,
    onEditCancel,
    onSave,
    onEnableToggle,
    canEdit,
    canToggleIB = false,
    saving,
    ibEnabled = true,
  } = props;

  const [localFormData, setLocalFormData] = useState<EditFormData | null>(editFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update local form data when prop changes
  useEffect(() => {
    if (editFormData !== null) {
      setLocalFormData(editFormData);
      // Clear errors when form data is reset
      setErrors({});
    }
  }, [editFormData]);

  // Visual distinction: FR = blue, IB = green
  const isFR = curriculumType === 'FR';
  const accentColor = isFR ? 'accent-blue' : 'accent-green';
  const icon = isFR ? '🇫🇷' : '🌍';
  const isRequired = isFR;
  const isEnabled = isFR ? true : ibEnabled;

  // Handle form data changes
  const handleFormDataChange = (updates: Partial<EditFormData>) => {
    if (!localFormData) return;
    const updated = { ...localFormData, ...updates };
    setLocalFormData(updated);
    
    // Validate on change
    const validationErrors = validateFormData(updated, curriculumType);
    setErrors(validationErrors);
  };

  // Validate form data
  const validateFormData = (
    data: EditFormData,
    type: 'FR' | 'IB'
  ): Record<string, string> => {
    const validationErrors: Record<string, string> = {};

    // Capacity validation
    if (type === 'FR' && data.capacity <= 0) {
      validationErrors.capacity = 'Capacity must be greater than 0 for FR curriculum';
    } else if (type === 'IB' && data.capacity < 0) {
      validationErrors.capacity = 'Capacity must be 0 or greater for IB curriculum';
    }

    // Tuition validation
    if (data.tuitionBase <= 0) {
      validationErrors.tuitionBase = 'Base tuition must be greater than 0';
    }

    // CPI Frequency validation
    if (![1, 2, 3].includes(data.cpiFrequency)) {
      validationErrors.cpiFrequency = 'CPI frequency must be 1, 2, or 3 years';
    }

    // Ramp-up validation
    if (data.rampUp) {
      Object.entries(data.rampUp).forEach(([year, percentage]) => {
        if (percentage < 0 || percentage > 100) {
          validationErrors[`rampUp.${year}`] = 'Ramp-up percentage must be between 0% and 100%';
        }
      });
    }

    return validationErrors;
  };

  // Handle save
  const handleSaveClick = async () => {
    if (!localFormData) return;

    // Final validation
    const validationErrors = validateFormData(localFormData, curriculumType);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    await onSave(localFormData);
  };

  // Determine if save button should be disabled
  const canSave = localFormData && Object.keys(errors).length === 0 && !saving;

  return (
    <Card
      className={cn(
        'border-2 transition-colors',
        isFR
          ? 'border-accent-blue/20 hover:border-accent-blue/30'
          : 'border-accent-green/20 hover:border-accent-green/30',
        !isEnabled && !isFR && 'opacity-60'
      )}
      aria-label={`${curriculumType} Curriculum Configuration`}
    >
      <CardHeader
        className={cn(
          'bg-gradient-to-r',
          isFR
            ? 'from-accent-blue/10 to-accent-blue/5'
            : 'from-accent-green/10 to-accent-green/5'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-2xl" aria-hidden="true">
              {icon}
            </span>
            <CardTitle
              id={`${curriculumType.toLowerCase()}-curriculum-title`}
              className="text-xl font-semibold tracking-tight"
            >
              {curriculumType} CURRICULUM
            </CardTitle>
            <Badge variant="outline" aria-label="Curriculum requirement level">
              {isRequired ? 'Required' : 'Optional'}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                isEnabled
                  ? isFR
                    ? 'border-accent-blue/50 text-accent-blue'
                    : 'border-accent-green/50 text-accent-green'
                  : 'border-muted text-muted-foreground'
              )}
              aria-label="Curriculum status"
            >
              {isEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
            {!isFR && canToggleIB && (
              <label className="flex items-center gap-2 ml-auto cursor-pointer">
                <Checkbox
                  checked={ibEnabled}
                  onCheckedChange={async (checked) => {
                    if (onEnableToggle) {
                      await onEnableToggle(checked === true);
                    }
                  }}
                  disabled={saving}
                  aria-label="Enable IB program"
                />
                <span className="text-sm font-medium text-muted-foreground">
                  {ibEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            )}
          </div>
          {canEdit && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEditStart}
              disabled={!isEnabled && !isFR}
              aria-label={`Edit ${curriculumType} curriculum`}
              aria-describedby={`${curriculumType.toLowerCase()}-curriculum-title`}
            >
              <Edit2 className="h-4 w-4 mr-2" aria-hidden="true" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        {isEditing && localFormData ? (
          <div className="space-y-4">
            <BasicConfigurationSectionEdit
              plan={plan}
              curriculumType={curriculumType}
              formData={localFormData}
              onFormDataChange={handleFormDataChange}
              errors={errors}
            />
            <StaffingParametersSectionEdit
              plan={plan}
              curriculumType={curriculumType}
              formData={localFormData}
              onFormDataChange={handleFormDataChange}
              errors={errors}
            />
            <RampUpSectionEdit
              plan={plan}
              curriculumType={curriculumType}
              formData={localFormData}
              onFormDataChange={handleFormDataChange}
              errors={errors}
            />
            <div className="flex gap-2 pt-4 border-t">
              <Button
                size="sm"
                onClick={handleSaveClick}
                disabled={!canSave}
                aria-label="Save changes"
              >
                <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onEditCancel}
                disabled={saving}
                aria-label="Cancel editing"
              >
                <X className="h-4 w-4 mr-2" aria-hidden="true" />
                Cancel
              </Button>
            </div>
            {Object.keys(errors).length > 0 && (
              <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">
                Please fix validation errors before saving
              </div>
            )}
          </div>
        ) : (
          <div className={cn('space-y-4', !isEnabled && !isFR && 'opacity-60')}>
            <BasicConfigurationSection plan={plan} curriculumType={curriculumType} />
            <StaffingParametersSection plan={plan} curriculumType={curriculumType} />
            <RampUpSection plan={plan} curriculumType={curriculumType} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

