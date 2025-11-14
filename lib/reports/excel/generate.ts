/**
 * Excel Generation Service
 * Generate Excel workbooks for all report types
 */

import ExcelJS from 'exceljs';
import type { VersionWithRelations } from '@/services/version';
import type { FullProjectionResult } from '@/lib/calculations/financial/projection';

interface GenerateExcelOptions {
  includeCharts: boolean;
  includeYearByYear: boolean;
  includeAssumptions: boolean;
  includeAuditTrail: boolean;
}

/**
 * Generate Executive Summary Excel workbook
 */
export async function generateExecutiveSummaryExcel(
  version: VersionWithRelations,
  projection: FullProjectionResult,
  _options: GenerateExcelOptions
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Executive Summary');

  // Add header
  worksheet.addRow(['Project Zeta - Executive Summary']);
  worksheet.addRow(['Version:', version.name]);
  worksheet.addRow(['Generated:', new Date().toLocaleDateString()]);
  worksheet.addRow([]);

  // Add KPIs
  worksheet.addRow(['Key Performance Indicators']);
  worksheet.addRow(['NPV (Rent)', projection.summary.npvRent.toFixed(0)]);
  worksheet.addRow(['NPV (Cash Flow)', projection.summary.npvCashFlow.toFixed(0)]);
  worksheet.addRow(['Avg EBITDA Margin', `${projection.summary.avgEBITDAMargin.toFixed(2)}%`]);
  worksheet.addRow(['Avg Rent Load', `${projection.summary.avgRentLoad.toFixed(2)}%`]);

  return workbook;
}

/**
 * Generate Financial Detail Excel workbook
 */
export async function generateFinancialDetailExcel(
  version: VersionWithRelations,
  projection: FullProjectionResult,
  options: GenerateExcelOptions
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();

  // Summary sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.addRow(['Project Zeta - Financial Detail Report']);
  summarySheet.addRow(['Version:', version.name]);
  summarySheet.addRow([]);
  summarySheet.addRow(['NPV (Rent)', projection.summary.npvRent.toFixed(0)]);
  summarySheet.addRow(['NPV (Cash Flow)', projection.summary.npvCashFlow.toFixed(0)]);

  // Year-by-Year sheet
  if (options.includeYearByYear) {
    const yearSheet = workbook.addWorksheet('Year-by-Year');
    yearSheet.addRow(['Year', 'Revenue', 'Rent', 'EBITDA', 'Cash Flow']);
    projection.years.forEach((year) => {
      yearSheet.addRow([
        year.year,
        year.revenue.toFixed(0),
        year.rent.toFixed(0),
        year.ebitda.toFixed(0),
        year.cashFlow.toFixed(0),
      ]);
    });
  }

  // Curriculum Detail sheet
  const curriculumSheet = workbook.addWorksheet('Curriculum Detail');
  curriculumSheet.addRow(['Year', 'FR Students', 'IB Students', 'FR Tuition', 'IB Tuition']);
  projection.years.forEach((year) => {
    curriculumSheet.addRow([
      year.year,
      year.studentsFR || 0,
      year.studentsIB || 0,
      year.tuitionFR?.toFixed(0) || 'N/A',
      year.tuitionIB?.toFixed(0) || 'N/A',
    ]);
  });

  return workbook;
}

/**
 * Generate Comparison Excel workbook
 */
export async function generateComparisonExcel(
  baseVersion: VersionWithRelations,
  baseProjection: FullProjectionResult,
  compareVersions: VersionWithRelations[],
  compareProjections: FullProjectionResult[],
  _options: GenerateExcelOptions
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  const comparisonSheet = workbook.addWorksheet('Comparison');

  comparisonSheet.addRow(['Project Zeta - Comparison Report']);
  comparisonSheet.addRow([]);
  comparisonSheet.addRow(['Metric', baseVersion.name, ...compareVersions.map((v) => v.name)]);
  comparisonSheet.addRow([
    'NPV (Rent)',
    baseProjection.summary.npvRent.toFixed(0),
    ...compareProjections.map((p) => p.summary.npvRent.toFixed(0)),
  ]);
  comparisonSheet.addRow([
    'NPV (Cash Flow)',
    baseProjection.summary.npvCashFlow.toFixed(0),
    ...compareProjections.map((p) => p.summary.npvCashFlow.toFixed(0)),
  ]);

  return workbook;
}

