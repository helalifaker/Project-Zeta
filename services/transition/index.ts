/**
 * Transition Period Service Layer
 *
 * Manages transition period (2025-2027) parameters including:
 * - Capacity cap settings
 * - Year-specific enrollment targets
 * - Staff cost baselines
 * - Rent adjustment percentages
 * - Revenue components (tuition, other revenue)
 * - Growth percentages from 2024 base year
 *
 * All operations follow Project Zeta patterns:
 * - Result<T> error handling
 * - Audit logging for mutations
 * - Decimal.js for financial precision
 */

// Read operations
export {
  getAllTransitionYears,
  getTransitionYear,
  getTransitionSettings,
  getCompleteTransitionConfig,
  isTransitionDataInitialized,
} from './read';

// Update operations
export {
  updateTransitionYear,
  updateTransitionSettings,
  recalculateTransitionStaffCosts,
  initializeTransitionYearData,
} from './update';

// Base year operations
export { fetchTransitionBaseYear, updateTransitionBaseYear } from './fetch-base-year';

// Helper functions
export {
  calculateTransitionStaffCost,
  isValidTransitionYear,
  calculateTransitionRent,
  getTransitionYears,
  validateTransitionSettings,
} from './helpers';

// Type exports
export type { UpdateTransitionYearInput, UpdateTransitionSettingsInput } from './update';
export type { BaseYearValues } from './fetch-base-year';
