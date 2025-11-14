/**
 * Tuition Simulator Store (Zustand)
 * Global state management for tuition simulator UI
 */

'use client';

import { create } from 'zustand';
import type { VersionWithRelations } from '@/services/version';
import type { FullProjectionResult } from '@/lib/calculations/financial/projection';

interface TuitionSimulatorState {
  // State
  selectedVersionId: string | null;
  baseVersion: VersionWithRelations | null;
  tuitionAdjustments: { fr: number; ib: number }; // Percentage adjustments (-20% to +50%)
  tuitionLockedRatio: boolean;
  cpiFrequency: { fr: 1 | 2 | 3; ib: 1 | 2 | 3 };
  enrollmentProjections: {
    fr: Array<{ year: number; students: number }>;
    ib: Array<{ year: number; students: number }>;
  };
  projection: FullProjectionResult | null;
  loading: boolean;
  error: string | null;

  // Actions
  setSelectedVersionId: (versionId: string | null) => void;
  setBaseVersion: (version: VersionWithRelations | null) => void;
  setTuitionAdjustments: (adjustments: { fr: number; ib: number }) => void;
  setTuitionAdjustment: (curriculum: 'fr' | 'ib', adjustment: number) => void;
  setTuitionLockedRatio: (locked: boolean) => void;
  setCpiFrequency: (frequency: { fr: 1 | 2 | 3; ib: 1 | 2 | 3 }) => void;
  setCpiFrequencyForCurriculum: (curriculum: 'fr' | 'ib', frequency: 1 | 2 | 3) => void;
  setEnrollmentProjections: (projections: {
    fr: Array<{ year: number; students: number }>;
    ib: Array<{ year: number; students: number }>;
  }) => void;
  setEnrollmentForYear: (curriculum: 'fr' | 'ib', year: number, students: number) => void;
  setProjection: (projection: FullProjectionResult | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetSimulator: () => void;
}

type TuitionSimulatorStateData = Omit<
  TuitionSimulatorState,
  | 'setSelectedVersionId'
  | 'setBaseVersion'
  | 'setTuitionAdjustments'
  | 'setTuitionAdjustment'
  | 'setTuitionLockedRatio'
  | 'setCpiFrequency'
  | 'setCpiFrequencyForCurriculum'
  | 'setEnrollmentProjections'
  | 'setEnrollmentForYear'
  | 'setProjection'
  | 'setLoading'
  | 'setError'
  | 'resetSimulator'
>;

const initialState: TuitionSimulatorStateData = {
  selectedVersionId: null,
  baseVersion: null,
  tuitionAdjustments: { fr: 0, ib: 0 }, // 0% adjustment by default
  tuitionLockedRatio: false,
  cpiFrequency: { fr: 2, ib: 2 }, // Default: 2 years
  enrollmentProjections: {
    fr: [],
    ib: [],
  },
  projection: null,
  loading: false,
  error: null,
};

export const useTuitionSimulatorStore = create<TuitionSimulatorState>((set) => ({
  ...initialState,

  setSelectedVersionId: (versionId) => set({ selectedVersionId: versionId }),

  setBaseVersion: (version) => {
    if (!version) {
      set({ baseVersion: null });
      return;
    }

    // Initialize enrollment projections from version's curriculum plans
    const frPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'FR');
    const ibPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'IB');

    const frProjection = frPlan
      ? (frPlan.studentsProjection as Array<{ year: number; students: number }>)
      : [];
    const ibProjection = ibPlan
      ? (ibPlan.studentsProjection as Array<{ year: number; students: number }>)
      : [];

    // Initialize CPI frequency from version
    const frCpiFrequency = (frPlan?.cpiFrequency as 1 | 2 | 3) || 2;
    const ibCpiFrequency = (ibPlan?.cpiFrequency as 1 | 2 | 3) || 2;

    set({
      baseVersion: version,
      enrollmentProjections: {
        fr: frProjection,
        ib: ibProjection,
      },
      cpiFrequency: {
        fr: frCpiFrequency,
        ib: ibCpiFrequency,
      },
      tuitionAdjustments: { fr: 0, ib: 0 }, // Reset adjustments
    });
  },

  setTuitionAdjustments: (adjustments) => set({ tuitionAdjustments: adjustments }),

  setTuitionAdjustment: (curriculum, adjustment) =>
    set((state) => {
      if (state.tuitionLockedRatio) {
        // Apply same adjustment to both curricula
        return {
          tuitionAdjustments: { fr: adjustment, ib: adjustment },
        };
      }
      return {
        tuitionAdjustments: {
          ...state.tuitionAdjustments,
          [curriculum]: adjustment,
        },
      };
    }),

  setTuitionLockedRatio: (locked) => set({ tuitionLockedRatio: locked }),

  setCpiFrequency: (frequency) => set({ cpiFrequency: frequency }),

  setCpiFrequencyForCurriculum: (curriculum, frequency) =>
    set((state) => ({
      cpiFrequency: {
        ...state.cpiFrequency,
        [curriculum]: frequency,
      },
    })),

  setEnrollmentProjections: (projections) => set({ enrollmentProjections: projections }),

  setEnrollmentForYear: (curriculum, year, students) =>
    set((state) => {
      const curriculumKey = curriculum === 'fr' ? 'fr' : 'ib';
      const existingProjection = state.enrollmentProjections[curriculumKey];
      const index = existingProjection.findIndex((p) => p.year === year);

      if (index >= 0) {
        const updated = [...existingProjection];
        updated[index] = { year, students };
        return {
          enrollmentProjections: {
            ...state.enrollmentProjections,
            [curriculumKey]: updated,
          },
        };
      } else {
        return {
          enrollmentProjections: {
            ...state.enrollmentProjections,
            [curriculumKey]: [...existingProjection, { year, students }].sort(
              (a, b) => a.year - b.year
            ),
          },
        };
      }
    }),

  setProjection: (projection) => set({ projection }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  resetSimulator: () => {
    set({
      selectedVersionId: null,
      baseVersion: null,
      tuitionAdjustments: { fr: 0, ib: 0 },
      tuitionLockedRatio: false,
      cpiFrequency: { fr: 2, ib: 2 },
      enrollmentProjections: { fr: [], ib: [] },
      projection: null,
      loading: false,
      error: null,
    });
  },
}));

