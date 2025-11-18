/**
 * Report Generation Service
 * Generates PDF and Excel reports
 */

import { generateExecutiveSummaryPDF, generateFinancialDetailPDF, generateComparisonPDF } from '@/lib/reports/templates';
import { generateExecutiveSummaryExcel, generateFinancialDetailExcel, generateComparisonExcel } from '@/lib/reports/excel/generate';
import { generateCSV, generateComparisonCSV } from '@/lib/reports/csv/generate';
import type { VersionWithRelations } from '@/services/version';
import type { FullProjectionResult } from '@/lib/calculations/financial/projection';
import { ReportType, ReportFormat } from '@prisma/client';
import type { Result } from '@/types/result';
import { renderToBuffer } from '@react-pdf/renderer';
import ExcelJS from 'exceljs';

interface GenerateReportParams {
  version: VersionWithRelations;
  projection: FullProjectionResult;
  reportType: ReportType;
  format: ReportFormat;
  options: {
    includeCharts: boolean;
    includeYearByYear: boolean;
    includeAssumptions: boolean;
    includeAuditTrail: boolean;
  };
  compareVersions?: VersionWithRelations[];
  compareProjections?: FullProjectionResult[];
}

/**
 * Generate report file (PDF or Excel)
 */
export async function generateReport(
  params: GenerateReportParams
): Promise<Result<{ file: Buffer; fileName: string }>> {
  try {
    const { version, projection, reportType, format, options } = params;

    let file: Buffer;
    let fileName: string;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const versionName = version.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    if (format === 'PDF') {
      // Generate PDF
      let pdfDoc;

      if (reportType === 'EXECUTIVE_SUMMARY') {
        pdfDoc = generateExecutiveSummaryPDF(version, projection, options);
        fileName = `executive-summary-${versionName}-${timestamp}.pdf`;
      } else if (reportType === 'FINANCIAL_DETAIL') {
        pdfDoc = generateFinancialDetailPDF(version, projection, options);
        fileName = `financial-detail-${versionName}-${timestamp}.pdf`;
      } else if (reportType === 'COMPARISON') {
        if (!params.compareVersions || !params.compareProjections) {
          return {
            success: false,
            error: 'Comparison reports require compareVersions and compareProjections',
          };
        }
        pdfDoc = generateComparisonPDF(
          version,
          projection,
          params.compareVersions,
          params.compareProjections,
          options
        );
        fileName = `comparison-${versionName}-${timestamp}.pdf`;
      } else {
        return { success: false, error: 'Invalid report type' };
      }

      file = await renderToBuffer(pdfDoc);
    } else if (format === 'EXCEL') {
      // Generate Excel
      let workbook: ExcelJS.Workbook;

      if (reportType === 'EXECUTIVE_SUMMARY') {
        workbook = await generateExecutiveSummaryExcel(version, projection, options);
        fileName = `executive-summary-${versionName}-${timestamp}.xlsx`;
      } else if (reportType === 'FINANCIAL_DETAIL') {
        workbook = await generateFinancialDetailExcel(version, projection, options);
        fileName = `financial-detail-${versionName}-${timestamp}.xlsx`;
      } else if (reportType === 'COMPARISON') {
        if (!params.compareVersions || !params.compareProjections) {
          return {
            success: false,
            error: 'Comparison reports require compareVersions and compareProjections',
          };
        }
        workbook = await generateComparisonExcel(
          version,
          projection,
          params.compareVersions,
          params.compareProjections,
          options
        );
        fileName = `comparison-${versionName}-${timestamp}.xlsx`;
      } else {
        return { success: false, error: 'Invalid report type' };
      }

      // Convert workbook to buffer
      const buffer = await workbook.xlsx.writeBuffer();
      file = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    } else if (format === 'CSV') {
      // Generate CSV
      let csvContent: string;

      if (reportType === 'EXECUTIVE_SUMMARY') {
        csvContent = generateCSV(version, projection, options);
        fileName = `executive-summary-${versionName}-${timestamp}.csv`;
      } else if (reportType === 'FINANCIAL_DETAIL') {
        csvContent = generateCSV(version, projection, options);
        fileName = `financial-detail-${versionName}-${timestamp}.csv`;
      } else if (reportType === 'COMPARISON') {
        if (!params.compareVersions || !params.compareProjections) {
          return {
            success: false,
            error: 'Comparison reports require compareVersions and compareProjections',
          };
        }
        csvContent = generateComparisonCSV(
          version,
          projection,
          params.compareVersions,
          params.compareProjections,
          options
        );
        fileName = `comparison-${versionName}-${timestamp}.csv`;
      } else {
        return { success: false, error: 'Invalid report type' };
      }

      // Convert CSV string to buffer
      file = Buffer.from(csvContent, 'utf-8');
    } else {
      return { success: false, error: 'Invalid report format' };
    }

    return {
      success: true,
      data: { file, fileName },
    };
  } catch (error) {
    console.error('Error generating report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate report',
    };
  }
}

