/**
 * Revenue Calculation Router
 * Main entry point for revenue and tuition calculations
 */

// Export functions
export {
  calculateTuitionForYear,
  calculateTuitionGrowth,
} from './tuition-growth';

export {
  calculateRevenueForYear,
  calculateRevenue,
  calculateTotalRevenue,
  calculateAverageRevenue,
} from './revenue';

// Export types
export type { TuitionGrowthParams, TuitionGrowthResult } from './tuition-growth';
export type { RevenueParams, RevenueResult } from './revenue';

