/**
 * Recharts Configuration
 * Chart theme and default settings for Project Zeta
 */

import { colors } from '@/config/design-system';

/**
 * Default chart colors matching design system
 */
export const chartColors = {
  revenue: colors.chart.revenue, // Blue
  rent: colors.chart.rent, // Purple
  ebitda: colors.chart.ebitda, // Green
  cashflow: colors.chart.cashflow, // Teal
  rentLoad: colors.chart.rentLoad, // Orange
} as const;

/**
 * Default chart theme (dark mode)
 */
export const chartTheme = {
  backgroundColor: colors.background.primary,
  textColor: colors.text.secondary,
  gridColor: colors.background.tertiary,
  borderColor: colors.background.tertiary,
} as const;

/**
 * Default chart dimensions
 */
export const chartDimensions = {
  width: 800,
  height: 400,
  margin: {
    top: 20,
    right: 30,
    left: 20,
    bottom: 20,
  },
} as const;

/**
 * Format currency for chart tooltips
 */
export function formatChartCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0 SAR';
  
  if (Math.abs(num) >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M SAR`;
  }
  if (Math.abs(num) >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K SAR`;
  }
  return `${num.toFixed(0)} SAR`;
}

/**
 * Format percentage for chart tooltips
 */
export function formatChartPercent(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0%';
  return `${(num * 100).toFixed(2)}%`;
}

