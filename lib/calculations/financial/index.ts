/**
 * Financial Calculation Index
 * Exports all financial calculation functions and types
 */

// Staff Costs
export {
  calculateStaffCostForYear,
  calculateStaffCosts,
  type StaffCostParams,
  type StaffCostResult,
} from './staff-costs';

// Opex
export {
  calculateOpexForYear,
  calculateOpex,
  type OpexSubAccount,
  type OpexParams,
  type OpexResult,
} from './opex';

// EBITDA
export {
  calculateEBITDAForYear,
  calculateEBITDA,
  type EBITDAParams,
  type EBITDAResult,
} from './ebitda';

// Cash Flow
export {
  calculateCashFlowForYear,
  calculateCashFlow,
  type CapexItem,
  type CashFlowParams,
  type CashFlowResult,
} from './cashflow';

// NPV
export {
  calculateNPVForYear,
  calculateNPV,
  type NPVParams,
  type NPVResult,
} from './npv';

// Full Projection
export {
  calculateFullProjection,
  type AdminSettings,
  type CurriculumPlanInput,
  type RentPlanInput,
  type FullProjectionParams,
  type YearlyProjection,
  type FullProjectionResult,
} from './projection';

