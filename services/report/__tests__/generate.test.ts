/**
 * Unit Tests: Report Generation Service
 * Tests PDF and Excel generation for all report types
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateReport } from '../generate';
import type { VersionWithRelations } from '@/services/version';
import type { FullProjectionResult } from '@/lib/calculations/financial/projection';
import { ReportType, ReportFormat } from '@prisma/client';
import Decimal from 'decimal.js';

// Mock the PDF and Excel generation functions
vi.mock('@/lib/reports/templates', () => ({
  generateExecutiveSummaryPDF: vi.fn(() => ({})),
  generateFinancialDetailPDF: vi.fn(() => ({})),
  generateComparisonPDF: vi.fn(() => ({})),
}));

vi.mock('@/lib/reports/excel/generate', () => ({
  generateExecutiveSummaryExcel: vi.fn(async () => {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet('Summary');
    return workbook;
  }),
  generateFinancialDetailExcel: vi.fn(async () => {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet('Detail');
    return workbook;
  }),
  generateComparisonExcel: vi.fn(async () => {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet('Comparison');
    return workbook;
  }),
}));

vi.mock('@react-pdf/renderer', () => ({
  renderToBuffer: vi.fn(async () => Buffer.from('mock-pdf-content')),
}));

// Helper function to create mock version
function createMockVersion(): VersionWithRelations {
  return {
    id: 'version-123',
    name: 'Test Version',
    description: 'Test Description',
    mode: 'RELOCATION_2028',
    status: 'DRAFT',
    createdBy: 'user-123',
    basedOnId: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    lockedAt: null,
    lockedBy: null,
    lockReason: null,
    curriculumPlans: [
      {
        id: 'cp-1',
        versionId: 'version-123',
        curriculumType: 'FR',
        capacity: 400,
        tuitionBase: new Decimal(50000),
        cpiFrequency: 2,
        studentsProjection: [
          { year: 2028, students: 300 },
          { year: 2029, students: 350 },
        ],
        teacherRatio: new Decimal(0.0714),
        nonTeacherRatio: new Decimal(0.0385),
        teacherMonthlySalary: new Decimal(20000),
        nonTeacherMonthlySalary: new Decimal(15000),
        tuitionGrowthRate: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      },
      {
        id: 'cp-2',
        versionId: 'version-123',
        curriculumType: 'IB',
        capacity: 200,
        tuitionBase: new Decimal(60000),
        cpiFrequency: 2,
        studentsProjection: [
          { year: 2028, students: 100 },
          { year: 2029, students: 150 },
        ],
        teacherRatio: new Decimal(0.0714),
        nonTeacherRatio: new Decimal(0.0385),
        teacherMonthlySalary: new Decimal(20000),
        nonTeacherMonthlySalary: new Decimal(15000),
        tuitionGrowthRate: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      },
    ],
    rentPlan: {
      id: 'rent-1',
      versionId: 'version-123',
      rentModel: 'FIXED_ESCALATION',
      parameters: {
        baseRent: 1000000,
        escalationRate: 0.04,
      },
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    },
    capexItems: [],
    opexSubAccounts: [],
    capexRules: [],
  };
}

// Helper function to create mock projection
function createMockProjection(): FullProjectionResult {
  return {
    years: [
      {
        year: 2028,
        revenue: new Decimal(20000000),
        staffCost: new Decimal(5000000),
        rent: new Decimal(1000000),
        opex: new Decimal(2000000),
        ebitda: new Decimal(13000000),
        ebitdaMargin: new Decimal(65),
        capex: new Decimal(0),
        interest: new Decimal(0),
        taxes: new Decimal(0),
        cashFlow: new Decimal(13000000),
        rentLoad: new Decimal(5),
      },
      {
        year: 2029,
        revenue: new Decimal(22000000),
        staffCost: new Decimal(5500000),
        rent: new Decimal(1040000),
        opex: new Decimal(2200000),
        ebitda: new Decimal(13260000),
        ebitdaMargin: new Decimal(60.27),
        capex: new Decimal(0),
        interest: new Decimal(0),
        taxes: new Decimal(0),
        cashFlow: new Decimal(13260000),
        rentLoad: new Decimal(4.73),
      },
    ],
    summary: {
      totalRevenue: new Decimal(42000000),
      totalStaffCost: new Decimal(10500000),
      totalRent: new Decimal(2040000),
      totalOpex: new Decimal(4200000),
      totalEBITDA: new Decimal(26260000),
      totalCapex: new Decimal(0),
      totalCashFlow: new Decimal(26260000),
      averageRentLoad: new Decimal(4.87),
      npvRent: new Decimal(20000000),
      npvCashFlow: new Decimal(25000000),
    },
  };
}

describe('generateReport', () => {
  const mockVersion = createMockVersion();
  const mockProjection = createMockProjection();
  const defaultOptions = {
    includeCharts: true,
    includeYearByYear: true,
    includeAssumptions: false,
    includeAuditTrail: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PDF Generation', () => {
    it('should generate Executive Summary PDF', async () => {
      const result = await generateReport({
        version: mockVersion,
        projection: mockProjection,
        reportType: ReportType.EXECUTIVE_SUMMARY,
        format: ReportFormat.PDF,
        options: defaultOptions,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.file).toBeInstanceOf(Buffer);
        expect(result.data.fileName).toMatch(/^executive-summary-test_version-.*\.pdf$/);
        expect(result.data.file.length).toBeGreaterThan(0);
      }
    });

    it('should generate Financial Detail PDF', async () => {
      const result = await generateReport({
        version: mockVersion,
        projection: mockProjection,
        reportType: ReportType.FINANCIAL_DETAIL,
        format: ReportFormat.PDF,
        options: defaultOptions,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.file).toBeInstanceOf(Buffer);
        expect(result.data.fileName).toMatch(/^financial-detail-test_version-.*\.pdf$/);
        expect(result.data.file.length).toBeGreaterThan(0);
      }
    });

    it('should generate Comparison PDF with compareVersions', async () => {
      const compareVersion = createMockVersion();
      compareVersion.id = 'version-456';
      compareVersion.name = 'Compare Version';

      const result = await generateReport({
        version: mockVersion,
        projection: mockProjection,
        reportType: ReportType.COMPARISON,
        format: ReportFormat.PDF,
        options: defaultOptions,
        compareVersions: [compareVersion],
        compareProjections: [createMockProjection()],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.file).toBeInstanceOf(Buffer);
        expect(result.data.fileName).toMatch(/^comparison-test_version-.*\.pdf$/);
      }
    });

    it('should fail for Comparison PDF without compareVersions', async () => {
      const result = await generateReport({
        version: mockVersion,
        projection: mockProjection,
        reportType: ReportType.COMPARISON,
        format: ReportFormat.PDF,
        options: defaultOptions,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Comparison reports require compareVersions');
      }
    });

    it('should fail for Comparison PDF without compareProjections', async () => {
      const compareVersion = createMockVersion();
      compareVersion.id = 'version-456';

      const result = await generateReport({
        version: mockVersion,
        projection: mockProjection,
        reportType: ReportType.COMPARISON,
        format: ReportFormat.PDF,
        options: defaultOptions,
        compareVersions: [compareVersion],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Comparison reports require compareProjections');
      }
    });
  });

  describe('Excel Generation', () => {
    it('should generate Executive Summary Excel', async () => {
      const result = await generateReport({
        version: mockVersion,
        projection: mockProjection,
        reportType: ReportType.EXECUTIVE_SUMMARY,
        format: ReportFormat.EXCEL,
        options: defaultOptions,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.file).toBeInstanceOf(Buffer);
        expect(result.data.fileName).toMatch(/^executive-summary-test_version-.*\.xlsx$/);
        expect(result.data.file.length).toBeGreaterThan(0);
      }
    });

    it('should generate Financial Detail Excel', async () => {
      const result = await generateReport({
        version: mockVersion,
        projection: mockProjection,
        reportType: ReportType.FINANCIAL_DETAIL,
        format: ReportFormat.EXCEL,
        options: defaultOptions,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.file).toBeInstanceOf(Buffer);
        expect(result.data.fileName).toMatch(/^financial-detail-test_version-.*\.xlsx$/);
        expect(result.data.file.length).toBeGreaterThan(0);
      }
    });

    it('should generate Comparison Excel with compareVersions', async () => {
      const compareVersion = createMockVersion();
      compareVersion.id = 'version-456';
      compareVersion.name = 'Compare Version';

      const result = await generateReport({
        version: mockVersion,
        projection: mockProjection,
        reportType: ReportType.COMPARISON,
        format: ReportFormat.EXCEL,
        options: defaultOptions,
        compareVersions: [compareVersion],
        compareProjections: [createMockProjection()],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.file).toBeInstanceOf(Buffer);
        expect(result.data.fileName).toMatch(/^comparison-test_version-.*\.xlsx$/);
      }
    });

    it('should fail for Comparison Excel without compareVersions', async () => {
      const result = await generateReport({
        version: mockVersion,
        projection: mockProjection,
        reportType: ReportType.COMPARISON,
        format: ReportFormat.EXCEL,
        options: defaultOptions,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Comparison reports require compareVersions');
      }
    });
  });

  describe('File Naming', () => {
    it('should sanitize version name in file name', async () => {
      const versionWithSpecialChars = createMockVersion();
      versionWithSpecialChars.name = 'Test Version 1.0 (2028)';

      const result = await generateReport({
        version: versionWithSpecialChars,
        projection: mockProjection,
        reportType: ReportType.EXECUTIVE_SUMMARY,
        format: ReportFormat.PDF,
        options: defaultOptions,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fileName).toMatch(/^executive-summary-test_version_1_0_2028-.*\.pdf$/);
      }
    });

    it('should include timestamp in file name', async () => {
      const result = await generateReport({
        version: mockVersion,
        projection: mockProjection,
        reportType: ReportType.EXECUTIVE_SUMMARY,
        format: ReportFormat.PDF,
        options: defaultOptions,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Timestamp format: YYYY-MM-DDTHH-MM-SS
        const timestampMatch = result.data.fileName.match(/-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})\.pdf$/);
        expect(timestampMatch).toBeTruthy();
      }
    });
  });

  describe('Options Handling', () => {
    it('should pass options to PDF generator', async () => {
      const options = {
        includeCharts: false,
        includeYearByYear: false,
        includeAssumptions: true,
        includeAuditTrail: true,
      };

      const result = await generateReport({
        version: mockVersion,
        projection: mockProjection,
        reportType: ReportType.EXECUTIVE_SUMMARY,
        format: ReportFormat.PDF,
        options,
      });

      expect(result.success).toBe(true);
    });

    it('should pass options to Excel generator', async () => {
      const options = {
        includeCharts: true,
        includeYearByYear: true,
        includeAssumptions: false,
        includeAuditTrail: false,
      };

      const result = await generateReport({
        version: mockVersion,
        projection: mockProjection,
        reportType: ReportType.FINANCIAL_DETAIL,
        format: ReportFormat.EXCEL,
        options,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid report type', async () => {
      const result = await generateReport({
        version: mockVersion,
        projection: mockProjection,
        reportType: 'INVALID_TYPE' as ReportType,
        format: ReportFormat.PDF,
        options: defaultOptions,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid report type');
      }
    });

    it('should handle PDF generation errors gracefully', async () => {
      const { renderToBuffer } = await import('@react-pdf/renderer');
      vi.mocked(renderToBuffer).mockRejectedValueOnce(new Error('PDF generation failed'));

      const result = await generateReport({
        version: mockVersion,
        projection: mockProjection,
        reportType: ReportType.EXECUTIVE_SUMMARY,
        format: ReportFormat.PDF,
        options: defaultOptions,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('PDF generation failed');
      }
    });

    it('should handle Excel generation errors gracefully', async () => {
      const { generateExecutiveSummaryExcel } = await import('@/lib/reports/excel/generate');
      vi.mocked(generateExecutiveSummaryExcel).mockRejectedValueOnce(new Error('Excel generation failed'));

      const result = await generateReport({
        version: mockVersion,
        projection: mockProjection,
        reportType: ReportType.EXECUTIVE_SUMMARY,
        format: ReportFormat.EXCEL,
        options: defaultOptions,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Excel generation failed');
      }
    });
  });
});

