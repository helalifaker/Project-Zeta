/**
 * Curriculum Component Types
 * Type definitions for curriculum plan components
 */

import type { CurriculumPlan, CurriculumType } from '@prisma/client';

/**
 * Extended CurriculumPlan type with all fields used in the UI
 */
export interface ExtendedCurriculumPlan extends Omit<CurriculumPlan, 'tuitionBase'> {
  tuitionBase: number | string | null;
  tuitionGrowthRate?: number | string | null;
  teacherRatio?: number | string | null;
  nonTeacherRatio?: number | string | null;
  teacherMonthlySalary?: number | string | null;
  nonTeacherMonthlySalary?: number | string | null;
  studentsProjection?: Array<{ year: number; students: number }> | string | null;
}

/**
 * Edit form data structure
 */
export interface EditFormData {
  capacity: number;
  tuitionBase: number;
  cpiFrequency: number;
  tuitionGrowthRate?: number;
  studentsPerTeacher?: number;
  studentsPerNonTeacher?: number;
  teacherMonthlySalary?: number;
  nonTeacherMonthlySalary?: number;
  rampUp?: {
    [year: number]: number; // year -> percentage (0-100)
  };
}

/**
 * Props for CurriculumCard component
 */
export interface CurriculumCardProps {
  curriculumType: CurriculumType;
  plan: ExtendedCurriculumPlan;
  isEditing: boolean;
  editFormData: EditFormData | null;
  onEditStart: () => void;
  onEditCancel: () => void;
  onSave: (data: EditFormData) => Promise<void>;
  onEnableToggle?: (enabled: boolean) => Promise<void>;
  canEdit: boolean;
  canToggleIB?: boolean;
  saving: boolean;
  ibEnabled?: boolean;
}

/**
 * Props for section components
 */
export interface SectionProps {
  plan: ExtendedCurriculumPlan;
  curriculumType: CurriculumType;
}

/**
 * Props for edit mode section components
 */
export interface EditSectionProps {
  plan: ExtendedCurriculumPlan;
  curriculumType: CurriculumType;
  formData: EditFormData;
  onFormDataChange: (data: Partial<EditFormData>) => void;
  errors?: Record<string, string>;
}

