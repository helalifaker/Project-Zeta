/**
 * Simulation Store (Zustand)
 * Global state management for full simulation sandbox
 */

'use client';

import { create } from 'zustand';
import type { VersionWithRelations } from '@/services/version';
import type { FullProjectionResult } from '@/lib/calculations/financial/projection';
import Decimal from 'decimal.js';

export interface CurriculumParameters {
  curriculumType: 'FR' | 'IB';
  capacity: number;
  tuitionBase: Decimal | number | string;
  cpiFrequency: 1 | 2 | 3;
  studentsProjection: Array<{ year: number; students: number }>;
}

export interface RentParameters {
  rentModel: 'FIXED_ESCALATION' | 'REVENUE_SHARE' | 'PARTNER_MODEL';
  parameters: Record<string, unknown>;
}

export interface StaffingParameters {
  baseStaffCost: Decimal | number | string;
  cpiFrequency: 1 | 2 | 3;
}

export interface OpexSubAccount {
  id: string;
  subAccountName: string;
  percentOfRevenue: Decimal | number | string | null;
  isFixed: boolean;
  fixedAmount: Decimal | number | string | null;
}

export interface CapexItem {
  id: string;
  year: number;
  amount: Decimal | number | string;
  category: 'Building' | 'Equipment' | 'Technology' | 'Other';
}

export interface AdminSettings {
  cpiRate: Decimal | number | string;
  discountRate: Decimal | number | string;
  taxRate: Decimal | number | string;
}

export interface SimulationParameters {
  curriculum: {
    fr: CurriculumParameters;
    ib: CurriculumParameters;
  };
  rent: RentParameters;
  staffing: StaffingParameters;
  opex: {
    subAccounts: OpexSubAccount[];
  };
  capex: {
    items: CapexItem[];
  };
  admin: AdminSettings;
}

export interface ParameterChanges {
  curriculum?: { fr?: boolean; ib?: boolean };
  rent?: boolean;
  staffing?: boolean;
  opex?: boolean;
  capex?: boolean;
  admin?: boolean;
}

interface SimulationState {
  // State
  baseVersionId: string | null;
  baseVersion: VersionWithRelations | null;
  parameters: SimulationParameters | null;
  projection: FullProjectionResult | null;
  baseProjection: FullProjectionResult | null;
  changes: ParameterChanges;
  loading: boolean;
  error: string | null;

  // Actions
  setBaseVersionId: (versionId: string | null) => void;
  setBaseVersion: (version: VersionWithRelations | null) => void;
  initializeParameters: (version: VersionWithRelations) => void;
  updateCurriculumParameter: (
    curriculum: 'fr' | 'ib',
    field: keyof CurriculumParameters,
    value: unknown
  ) => void;
  updateRentParameter: (field: keyof RentParameters, value: unknown) => void;
  updateStaffingParameter: (field: keyof StaffingParameters, value: unknown) => void;
  addOpexSubAccount: (subAccount: Omit<OpexSubAccount, 'id'>) => void;
  removeOpexSubAccount: (id: string) => void;
  updateOpexSubAccount: (id: string, updates: Partial<OpexSubAccount>) => void;
  addCapexItem: (item: Omit<CapexItem, 'id'>) => void;
  removeCapexItem: (id: string) => void;
  updateCapexItem: (id: string, updates: Partial<CapexItem>) => void;
  updateAdminSetting: (field: keyof AdminSettings, value: Decimal | number | string) => void;
  setProjection: (projection: FullProjectionResult | null) => void;
  setBaseProjection: (projection: FullProjectionResult | null) => void;
  setChanges: (changes: ParameterChanges) => void;
  resetToBase: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type SimulationStateData = Omit<
  SimulationState,
  | 'setBaseVersionId'
  | 'setBaseVersion'
  | 'initializeParameters'
  | 'updateCurriculumParameter'
  | 'updateRentParameter'
  | 'updateStaffingParameter'
  | 'addOpexSubAccount'
  | 'removeOpexSubAccount'
  | 'updateOpexSubAccount'
  | 'addCapexItem'
  | 'removeCapexItem'
  | 'updateCapexItem'
  | 'updateAdminSetting'
  | 'setProjection'
  | 'setBaseProjection'
  | 'setChanges'
  | 'resetToBase'
  | 'setLoading'
  | 'setError'
>;

const initialState: SimulationStateData = {
  baseVersionId: null,
  baseVersion: null,
  parameters: null,
  projection: null,
  baseProjection: null,
  changes: {},
  loading: false,
  error: null,
};

export const useSimulationStore = create<SimulationState>((set, get) => ({
  ...initialState,

  setBaseVersionId: (versionId) => set({ baseVersionId: versionId }),

  setBaseVersion: (version) => set({ baseVersion: version }),

  initializeParameters: (version) => {
    if (!version.rentPlan || version.curriculumPlans.length < 1) {
      set({ error: 'Invalid version data' });
      return;
    }

    const frPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'FR');
    if (!frPlan) {
      set({ error: 'Version must have FR curriculum plan' });
      return;
    }

    const ibPlan = version.curriculumPlans.find((cp) => cp.curriculumType === 'IB');
    const isIBEnabled = ibPlan && ibPlan.capacity > 0;

    const parameters: SimulationParameters = {
      curriculum: {
        fr: {
          curriculumType: 'FR',
          capacity: frPlan.capacity,
          tuitionBase: new Decimal(frPlan.tuitionBase),
          cpiFrequency: frPlan.cpiFrequency as 1 | 2 | 3,
          studentsProjection: (
            frPlan.studentsProjection as Array<{ year: number; students: number }>
          ).map((sp) => ({ year: sp.year, students: sp.students })),
        },
        ib: isIBEnabled && ibPlan ? {
          curriculumType: 'IB',
          capacity: ibPlan.capacity,
          tuitionBase: new Decimal(ibPlan.tuitionBase),
          cpiFrequency: ibPlan.cpiFrequency as 1 | 2 | 3,
          studentsProjection: (
            ibPlan.studentsProjection as Array<{ year: number; students: number }>
          ).map((sp) => ({ year: sp.year, students: sp.students })),
        } : {
          curriculumType: 'IB',
          capacity: 0,
          tuitionBase: new Decimal(0),
          cpiFrequency: 2 as 1 | 2 | 3,
          studentsProjection: [],
        },
      },
      rent: {
        rentModel: version.rentPlan.rentModel as 'FIXED_ESCALATION' | 'REVENUE_SHARE' | 'PARTNER_MODEL',
        parameters: version.rentPlan.parameters as Record<string, unknown>,
      },
      staffing: {
        baseStaffCost: new Decimal(15_000_000), // Default - should come from version or admin settings
        cpiFrequency: 2,
      },
      opex: {
        subAccounts: version.opexSubAccounts.map((account, index) => ({
          id: `opex-${index}`,
          subAccountName: account.subAccountName,
          percentOfRevenue: account.percentOfRevenue !== null ? new Decimal(account.percentOfRevenue) : null,
          isFixed: account.isFixed,
          fixedAmount: account.fixedAmount !== null ? new Decimal(account.fixedAmount) : null,
        })),
      },
      capex: {
        items: version.capexItems.map((item, index) => ({
          id: `capex-${index}`,
          year: item.year,
          amount: new Decimal(item.amount),
          category: (item.category as 'Building' | 'Equipment' | 'Technology' | 'Other') || 'Other',
        })),
      },
      admin: {
        cpiRate: new Decimal(0.03), // Default - should come from admin settings
        discountRate: new Decimal(0.08),
        taxRate: new Decimal(0.20),
      },
    };

    set({
      parameters,
      baseVersion: version,
      changes: {},
      error: null,
    });
  },

  updateCurriculumParameter: (curriculum, field, value) => {
    const state = get();
    if (!state.parameters) return;

    set({
      parameters: {
        ...state.parameters,
        curriculum: {
          ...state.parameters.curriculum,
          [curriculum]: {
            ...state.parameters.curriculum[curriculum],
            [field]: value,
          },
        },
      },
      changes: {
        ...state.changes,
        curriculum: {
          ...state.changes.curriculum,
          [curriculum]: true,
        },
      },
    });
  },

  updateRentParameter: (field, value) => {
    const state = get();
    if (!state.parameters) return;

    set({
      parameters: {
        ...state.parameters,
        rent: {
          ...state.parameters.rent,
          [field]: value,
        },
      },
      changes: {
        ...state.changes,
        rent: true,
      },
    });
  },

  updateStaffingParameter: (field, value) => {
    const state = get();
    if (!state.parameters) return;

    set({
      parameters: {
        ...state.parameters,
        staffing: {
          ...state.parameters.staffing,
          [field]: value,
        },
      },
      changes: {
        ...state.changes,
        staffing: true,
      },
    });
  },

  addOpexSubAccount: (subAccount) => {
    const state = get();
    if (!state.parameters) return;

    const newId = `opex-${Date.now()}`;
    set({
      parameters: {
        ...state.parameters,
        opex: {
          subAccounts: [...state.parameters.opex.subAccounts, { ...subAccount, id: newId }],
        },
      },
      changes: {
        ...state.changes,
        opex: true,
      },
    });
  },

  removeOpexSubAccount: (id) => {
    const state = get();
    if (!state.parameters) return;

    set({
      parameters: {
        ...state.parameters,
        opex: {
          subAccounts: state.parameters.opex.subAccounts.filter((acc) => acc.id !== id),
        },
      },
      changes: {
        ...state.changes,
        opex: true,
      },
    });
  },

  updateOpexSubAccount: (id, updates) => {
    const state = get();
    if (!state.parameters) return;

    set({
      parameters: {
        ...state.parameters,
        opex: {
          subAccounts: state.parameters.opex.subAccounts.map((acc) =>
            acc.id === id ? { ...acc, ...updates } : acc
          ),
        },
      },
      changes: {
        ...state.changes,
        opex: true,
      },
    });
  },

  addCapexItem: (item) => {
    const state = get();
    if (!state.parameters) return;

    const newId = `capex-${Date.now()}`;
    set({
      parameters: {
        ...state.parameters,
        capex: {
          items: [...state.parameters.capex.items, { ...item, id: newId }],
        },
      },
      changes: {
        ...state.changes,
        capex: true,
      },
    });
  },

  removeCapexItem: (id) => {
    const state = get();
    if (!state.parameters) return;

    set({
      parameters: {
        ...state.parameters,
        capex: {
          items: state.parameters.capex.items.filter((item) => item.id !== id),
        },
      },
      changes: {
        ...state.changes,
        capex: true,
      },
    });
  },

  updateCapexItem: (id, updates) => {
    const state = get();
    if (!state.parameters) return;

    set({
      parameters: {
        ...state.parameters,
        capex: {
          items: state.parameters.capex.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        },
      },
      changes: {
        ...state.changes,
        capex: true,
      },
    });
  },

  updateAdminSetting: (field, value) => {
    const state = get();
    if (!state.parameters) return;

    set({
      parameters: {
        ...state.parameters,
        admin: {
          ...state.parameters.admin,
          [field]: value,
        },
      },
      changes: {
        ...state.changes,
        admin: true,
      },
    });
  },

  setProjection: (projection) => set({ projection }),

  setBaseProjection: (projection) => set({ baseProjection: projection }),

  setChanges: (changes) => set({ changes }),

  resetToBase: () => {
    const state = get();
    if (state.baseVersion) {
      get().initializeParameters(state.baseVersion);
      set({
        projection: null,
        baseProjection: null,
        changes: {},
        error: null,
      });
    }
  },

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),
}));

