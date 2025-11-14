/**
 * Chart Helpers
 * Utilities for generating chart data from projection results
 */

import type { FullProjectionResult } from '@/lib/calculations/financial/projection';
import { renderSimpleChartSVG } from './render';

/**
 * Generate Revenue vs Rent chart data and SVG
 */
export function generateRevenueRentChart(
  projection: FullProjectionResult
): string {
  const data = projection.years.map((year) => ({
    year: year.year,
    revenue: year.revenue.toNumber(),
    rent: year.rent.toNumber(),
  }));

  return renderSimpleChartSVG(data, {
    xKey: 'year',
    yKeys: ['revenue', 'rent'],
    width: 800,
    height: 400,
    title: 'Revenue vs Rent',
  });
}

/**
 * Generate EBITDA Trend chart data and SVG
 */
export function generateEBITDATrendChart(
  projection: FullProjectionResult
): string {
  const data = projection.years.map((year) => ({
    year: year.year,
    ebitda: year.ebitda.toNumber(),
  }));

  return renderSimpleChartSVG(data, {
    xKey: 'year',
    yKeys: ['ebitda'],
    width: 800,
    height: 400,
    title: 'EBITDA Trend',
  });
}

/**
 * Generate Rent Load % chart data and SVG
 */
export function generateRentLoadChart(
  projection: FullProjectionResult
): string {
  const data = projection.years.map((year) => ({
    year: year.year,
    rentLoad: year.rentLoad.toNumber(),
  }));

  return renderSimpleChartSVG(data, {
    xKey: 'year',
    yKeys: ['rentLoad'],
    width: 800,
    height: 400,
    title: 'Rent Load %',
  });
}

/**
 * Generate Enrollment chart data and SVG
 */
export function generateEnrollmentChart(
  projection: FullProjectionResult
): string {
  const data = projection.years.map((year) => ({
    year: year.year,
    studentsFR: year.studentsFR || 0,
    studentsIB: year.studentsIB || 0,
  }));

  return renderSimpleChartSVG(data, {
    xKey: 'year',
    yKeys: ['studentsFR', 'studentsIB'],
    width: 800,
    height: 400,
    title: 'Enrollment (FR vs IB)',
  });
}

/**
 * Generate Cash Flow chart data and SVG
 */
export function generateCashFlowChart(
  projection: FullProjectionResult
): string {
  const data = projection.years.map((year) => ({
    year: year.year,
    cashFlow: year.cashFlow.toNumber(),
  }));

  return renderSimpleChartSVG(data, {
    xKey: 'year',
    yKeys: ['cashFlow'],
    width: 800,
    height: 400,
    title: 'Cash Flow',
  });
}

/**
 * Generate all charts for a projection
 */
export function generateAllCharts(
  projection: FullProjectionResult
): Record<string, string> {
  return {
    revenueRent: generateRevenueRentChart(projection),
    ebitdaTrend: generateEBITDATrendChart(projection),
    rentLoad: generateRentLoadChart(projection),
    enrollment: generateEnrollmentChart(projection),
    cashFlow: generateCashFlowChart(projection),
  };
}

