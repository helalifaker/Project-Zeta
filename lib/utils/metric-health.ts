/**
 * Metric Health Utilities
 * Calculate health status and styles for dashboard KPI metrics
 */

export type MetricType = 'npv' | 'ebitda' | 'rentLoad' | 'netProfit';
export type HealthStatus = 'excellent' | 'good' | 'warning' | 'critical' | 'neutral';

interface HealthThresholds {
  excellent: number;
  good: number;
  warning: number;
}

const thresholds: Record<MetricType, HealthThresholds | null> = {
  npv: { excellent: 100_000_000, good: 50_000_000, warning: 0 },
  ebitda: { excellent: 20, good: 10, warning: 0 },
  rentLoad: { excellent: 25, good: 35, warning: 45 },
  netProfit: { excellent: 15, good: 5, warning: 0 }, // Net profit margin % (higher is better)
};

/**
 * Calculate health status for a given metric
 * @param metric - The type of metric to evaluate
 * @param value - The metric value (can be number or formatted string)
 * @returns The health status of the metric
 */
export function getMetricHealth(metric: MetricType, value: number | string): HealthStatus {
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;

  if (isNaN(numValue)) {
    return 'neutral';
  }

  const t = thresholds[metric];
  if (!t) return 'neutral';

  // Rent load: lower is better
  if (metric === 'rentLoad') {
    if (numValue <= t.excellent) return 'excellent';
    if (numValue <= t.good) return 'good';
    if (numValue <= t.warning) return 'warning';
    return 'critical';
  }

  // Others: higher is better
  if (numValue >= t.excellent) return 'excellent';
  if (numValue >= t.good) return 'good';
  if (numValue >= t.warning) return 'warning';
  return 'critical';
}

/**
 * Get styling classes for a health status
 * @param status - The health status
 * @returns Object with gradient, border, and text color classes
 */
export function getHealthStyles(status: HealthStatus): {
  gradient: string;
  border: string;
  text: string;
} {
  const styles = {
    excellent: {
      gradient: 'bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent',
      border: 'border-l-green-500',
      text: 'text-green-400',
    },
    good: {
      gradient: 'bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent',
      border: 'border-l-blue-500',
      text: 'text-blue-400',
    },
    warning: {
      gradient: 'bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent',
      border: 'border-l-yellow-500',
      text: 'text-yellow-400',
    },
    critical: {
      gradient: 'bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent',
      border: 'border-l-red-500',
      text: 'text-red-400',
    },
    neutral: {
      gradient: 'bg-gradient-to-br from-muted/30 via-transparent to-transparent',
      border: 'border-l-muted',
      text: 'text-muted-foreground',
    },
  };

  return styles[status];
}

/**
 * Calculate overall scenario health based on projection data
 * @param projection - The full projection result
 * @returns The overall scenario health status
 */
export function getScenarioHealth(
  projection: { summary?: { npvRent?: number | { toString: () => string } } } | null | undefined
): 'healthy' | 'warning' | 'error' {
  if (!projection) return 'warning';

  // Simple logic: check if NPV is positive
  const npv = projection.summary?.npvRent;
  if (!npv) return 'warning';

  const npvValue = typeof npv === 'number' ? npv : parseFloat(npv.toString());

  if (npvValue > 50_000_000) return 'healthy';
  if (npvValue > 0) return 'warning';
  return 'error';
}
