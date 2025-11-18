/**
 * CSV Generation Service
 * Generate CSV files from projection data
 */

import type { VersionWithRelations } from '@/services/version';
import type { FullProjectionResult } from '@/lib/calculations/financial/projection';

interface GenerateCSVOptions {
  includeCharts: boolean;
  includeYearByYear: boolean;
  includeAssumptions: boolean;
  includeAuditTrail: boolean;
}

/**
 * Escape CSV field (handle commas, quotes, newlines)
 */
function escapeCSVField(value: string | number): string {
  const stringValue = String(value);
  
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Format number for CSV (with proper decimal places)
 */
function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return num.toFixed(2);
}

/**
 * Generate CSV string from projection data
 */
export function generateCSV(
  version: VersionWithRelations,
  projection: FullProjectionResult,
  options: GenerateCSVOptions
): string {
  const lines: string[] = [];
  
  // Header section
  lines.push('Project Zeta - Financial Report');
  lines.push(`Version,${escapeCSVField(version.name)}`);
  lines.push(`Generated,${new Date().toISOString()}`);
  lines.push('');
  
  // Summary section
  lines.push('Summary');
  lines.push('Metric,Value (SAR)');
  lines.push(`Total Revenue,${formatNumber(projection.summary.totalRevenue.toString())}`);
  lines.push(`Total Staff Cost,${formatNumber(projection.summary.totalStaffCost.toString())}`);
  lines.push(`Total Rent,${formatNumber(projection.summary.totalRent.toString())}`);
  lines.push(`Total Opex,${formatNumber(projection.summary.totalOpex.toString())}`);
  lines.push(`Total EBITDA,${formatNumber(projection.summary.totalEBITDA.toString())}`);
  lines.push(`Total Capex,${formatNumber(projection.summary.totalCapex.toString())}`);
  lines.push(`Total Cash Flow,${formatNumber(projection.summary.totalCashFlow.toString())}`);
  lines.push(`Average Rent Load (%),${formatNumber(projection.summary.averageRentLoad.toString())}`);
  lines.push(`NPV (Rent),${formatNumber(projection.summary.npvRent.toString())}`);
  lines.push(`NPV (Cash Flow),${formatNumber(projection.summary.npvCashFlow.toString())}`);
  lines.push('');
  
  // Year-by-year data (if requested)
  if (options.includeYearByYear) {
    lines.push('Year-by-Year Data');
    lines.push('Year,Revenue,Staff Cost,Rent,Opex,EBITDA,EBITDA Margin (%),Capex,Interest,Taxes,Cash Flow,Rent Load (%)');
    
    for (const yearData of projection.years) {
      const row = [
        yearData.year.toString(),
        formatNumber(yearData.revenue.toString()),
        formatNumber(yearData.staffCost.toString()),
        formatNumber(yearData.rent.toString()),
        formatNumber(yearData.opex.toString()),
        formatNumber(yearData.ebitda.toString()),
        formatNumber(yearData.ebitdaMargin.toString()),
        formatNumber(yearData.capex.toString()),
        formatNumber(yearData.interest.toString()),
        formatNumber(yearData.taxes.toString()),
        formatNumber(yearData.cashFlow.toString()),
        formatNumber(yearData.rentLoad.toString()),
      ];
      
      lines.push(row.map(escapeCSVField).join(','));
    }
    
    lines.push('');
  }
  
  // Assumptions section (if requested)
  if (options.includeAssumptions) {
    lines.push('Assumptions');
    lines.push('Setting,Value');
    lines.push(`Rent Model,${version.rentPlan?.rentModel || 'N/A'}`);
    
    if (version.curriculumPlans && version.curriculumPlans.length > 0) {
      for (const plan of version.curriculumPlans) {
        lines.push(`${plan.curriculumType} - Base Tuition,${formatNumber(plan.tuitionBase.toString())}`);
        lines.push(`${plan.curriculumType} - Capacity,${plan.capacity}`);
        lines.push(`${plan.curriculumType} - CPI Frequency,${plan.cpiFrequency} years`);
      }
    }
    
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Generate Comparison CSV (for comparison reports)
 */
export function generateComparisonCSV(
  version: VersionWithRelations,
  projection: FullProjectionResult,
  compareVersions: VersionWithRelations[],
  compareProjections: FullProjectionResult[],
  options: GenerateCSVOptions
): string {
  const lines: string[] = [];
  
  // Header section
  lines.push('Project Zeta - Comparison Report');
  lines.push(`Base Version,${escapeCSVField(version.name)}`);
  lines.push(`Comparison Versions,${compareVersions.map(v => escapeCSVField(v.name)).join('; ')}`);
  lines.push(`Generated,${new Date().toISOString()}`);
  lines.push('');
  
  // Summary comparison
  lines.push('Summary Comparison');
  lines.push('Metric,Base Version,Comparison Version 1,Comparison Version 2,Comparison Version 3');
  
  const allProjections = [projection, ...compareProjections];
  const allVersions = [version, ...compareVersions];
  
  const metrics = [
    { name: 'Total Revenue', key: 'totalRevenue' as const },
    { name: 'Total Staff Cost', key: 'totalStaffCost' as const },
    { name: 'Total Rent', key: 'totalRent' as const },
    { name: 'Total Opex', key: 'totalOpex' as const },
    { name: 'Total EBITDA', key: 'totalEBITDA' as const },
    { name: 'Total Cash Flow', key: 'totalCashFlow' as const },
    { name: 'Average Rent Load (%)', key: 'averageRentLoad' as const },
    { name: 'NPV (Rent)', key: 'npvRent' as const },
    { name: 'NPV (Cash Flow)', key: 'npvCashFlow' as const },
  ];
  
  for (const metric of metrics) {
    const row = [
      metric.name,
      ...allProjections.map((proj) => formatNumber(proj.summary[metric.key].toString())),
    ];
    // Pad row if fewer than 4 versions
    while (row.length < 5) {
      row.push('');
    }
    lines.push(row.map(escapeCSVField).join(','));
  }
  
  lines.push('');
  
  // Year-by-year comparison (if requested)
  if (options.includeYearByYear) {
    lines.push('Year-by-Year Comparison');
    const headerRow = [
      'Year',
      ...allVersions.map((v, i) => `Version ${i === 0 ? 'Base' : i} - Revenue`),
      ...allVersions.map((v, i) => `Version ${i === 0 ? 'Base' : i} - EBITDA`),
      ...allVersions.map((v, i) => `Version ${i === 0 ? 'Base' : i} - Cash Flow`),
    ];
    lines.push(headerRow.map(escapeCSVField).join(','));
    
    // Get all years from all projections
    const allYears = new Set<number>();
    for (const proj of allProjections) {
      for (const yearData of proj.years) {
        allYears.add(yearData.year);
      }
    }
    
    const sortedYears = Array.from(allYears).sort();
    
    for (const year of sortedYears) {
      const row: string[] = [year.toString()];
      
      // Revenue for each version
      for (const proj of allProjections) {
        const yearData = proj.years.find((y) => y.year === year);
        row.push(yearData ? formatNumber(yearData.revenue.toString()) : '');
      }
      
      // EBITDA for each version
      for (const proj of allProjections) {
        const yearData = proj.years.find((y) => y.year === year);
        row.push(yearData ? formatNumber(yearData.ebitda.toString()) : '');
      }
      
      // Cash Flow for each version
      for (const proj of allProjections) {
        const yearData = proj.years.find((y) => y.year === year);
        row.push(yearData ? formatNumber(yearData.cashFlow.toString()) : '');
      }
      
      lines.push(row.map(escapeCSVField).join(','));
    }
    
    lines.push('');
  }
  
  return lines.join('\n');
}

