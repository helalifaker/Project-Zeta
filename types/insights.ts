/**
 * Insights Types
 * Type definitions for cost insights and recommendations
 */

/**
 * Insight severity level
 */
export type InsightType = 'optimal' | 'warning' | 'critical';

/**
 * Insight interface for cost analysis recommendations
 */
export interface Insight {
  /** Severity level of the insight */
  type: InsightType;
  /** Short title for the insight */
  title: string;
  /** Detailed message explaining the insight */
  message: string;
  /** Actionable recommendation */
  recommendation: string;
}

