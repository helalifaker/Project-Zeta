/**
 * Cost Insights Calculation Module
 * Analyzes financial projections to provide actionable insights and recommendations
 * 
 * Uses Result<T> pattern for error handling and Decimal.js for financial precision.
 * 
 * Thresholds:
 * - Rent Load: 20-30% optimal, 30-40% warning, 40%+ critical
 * - Staff Costs: >50% warning
 * - Opex: >40% warning
 */

import Decimal from 'decimal.js';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';
import type { Insight } from '@/types/insights';
import type { FullProjectionResult } from '@/lib/calculations/financial/projection';

/**
 * Calculates cost insights and recommendations from financial projection.
 * 
 * Analyzes rent load, cost structure, and trends to provide actionable insights.
 * 
 * @param projection - Full financial projection result (30-year period)
 * @returns Result<Insight[]> - Array of insights with type, message, and recommendation
 * 
 * @example
 * ```typescript
 * const result = calculateCostInsights(projection);
 * if (result.success) {
 *   result.data.forEach(insight => {
 *     console.log(`${insight.type}: ${insight.title}`);
 *   });
 * }
 * ```
 */
export function calculateCostInsights(
  projection: FullProjectionResult | null
): Result<Insight[]> {
  const insights: Insight[] = [];
  
  if (!projection || !projection.years || projection.years.length === 0) {
    return error('Invalid projection data', 'INVALID_PROJECTION');
  }

  // Filter to NPV period (2028-2052, 25 years)
  const npvPeriod = projection.years.filter(y => y.year >= 2028 && y.year <= 2052);
  
  if (npvPeriod.length === 0) {
    return error('No data in NPV period (2028-2052)', 'NO_NPV_DATA');
  }

  // Calculate average rent load (2028-2052 period)
  const avgRentLoad = npvPeriod.reduce((sum, year) => {
    if (year.revenue.isZero()) return sum;
    return sum.plus(year.rentLoad);
  }, new Decimal(0)).div(npvPeriod.length);

  // Rent Load Analysis
  if (avgRentLoad.greaterThan(40)) {
    insights.push({
      type: 'critical',
      title: 'High Rent Load',
      message: `Rent load is ${avgRentLoad.toFixed(1)}%, exceeding optimal range (20-30%)`,
      recommendation: 'Consider renegotiating rent terms, increasing revenue, or exploring alternative rent models',
    });
  } else if (avgRentLoad.greaterThan(30)) {
    insights.push({
      type: 'warning',
      title: 'Elevated Rent Load',
      message: `Rent load is ${avgRentLoad.toFixed(1)}%, above optimal range (20-30%)`,
      recommendation: 'Monitor rent load trends and consider revenue optimization strategies',
    });
  } else if (avgRentLoad.greaterThanOrEqualTo(20) && avgRentLoad.lessThanOrEqualTo(30)) {
    insights.push({
      type: 'optimal',
      title: 'Optimal Rent Load',
      message: `Rent load is ${avgRentLoad.toFixed(1)}%, within optimal range (20-30%)`,
      recommendation: 'Maintain current rent model and revenue strategy',
    });
  } else {
    insights.push({
      type: 'optimal',
      title: 'Low Rent Load',
      message: `Rent load is ${avgRentLoad.toFixed(1)}%, below optimal range (20-30%)`,
      recommendation: 'Rent load is manageable. Consider opportunities for growth or investment',
    });
  }

  // Cost Structure Analysis
  const totalCosts = npvPeriod.reduce((sum, year) => 
    sum.plus(year.rent).plus(year.staffCost).plus(year.opex), 
    new Decimal(0)
  );
  
  if (totalCosts.isZero()) {
    return success(insights); // No costs to analyze
  }

  const totalStaff = npvPeriod.reduce((sum, year) => sum.plus(year.staffCost), new Decimal(0));
  const staffPercent = totalStaff.div(totalCosts).times(100);

  if (staffPercent.greaterThan(50)) {
    insights.push({
      type: 'warning',
      title: 'High Staff Costs',
      message: `Staff costs represent ${staffPercent.toFixed(1)}% of total costs`,
      recommendation: 'Review staffing ratios, salary structures, and consider efficiency improvements',
    });
  }

  // Opex Analysis
  const totalOpex = npvPeriod.reduce((sum, year) => sum.plus(year.opex), new Decimal(0));
  const opexPercent = totalOpex.div(totalCosts).times(100);

  if (opexPercent.greaterThan(40)) {
    insights.push({
      type: 'warning',
      title: 'High Operating Expenses',
      message: `Operating expenses represent ${opexPercent.toFixed(1)}% of total costs`,
      recommendation: 'Review opex sub-accounts and identify optimization opportunities',
    });
  }

  // Trend Analysis: Check if rent load is increasing
  if (npvPeriod.length >= 5) {
    const firstHalf = npvPeriod.slice(0, Math.floor(npvPeriod.length / 2));
    const secondHalf = npvPeriod.slice(Math.floor(npvPeriod.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, year) => sum.plus(year.rentLoad), new Decimal(0))
      .div(firstHalf.length);
    const secondHalfAvg = secondHalf.reduce((sum, year) => sum.plus(year.rentLoad), new Decimal(0))
      .div(secondHalf.length);
    
    const trend = secondHalfAvg.minus(firstHalfAvg);
    
    if (trend.greaterThan(5)) {
      insights.push({
        type: 'warning',
        title: 'Increasing Rent Load Trend',
        message: `Rent load is increasing by ${trend.toFixed(1)}% over the projection period`,
        recommendation: 'Monitor rent escalation rates and consider revenue growth strategies to offset increasing rent load',
      });
    }
  }

  return success(insights);
}

