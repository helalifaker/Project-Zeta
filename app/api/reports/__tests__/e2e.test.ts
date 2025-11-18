/**
 * End-to-End Tests: Report Generation Flow
 * Tests full user flow from generation to download to delete
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../generate/[versionId]/route';
import { GET as GET_LIST } from '../../route';
import { GET as GET_DOWNLOAD } from '../../[reportId]/download/route';
import { DELETE } from '../../[reportId]/route';
import type { NextRequest } from 'next/server';
import { ReportType, ReportFormat } from '@prisma/client';
import Decimal from 'decimal.js';

// Mock all dependencies
vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(),
}));

vi.mock('@/services/version', () => ({
  getVersionById: vi.fn(),
}));

vi.mock('@/services/admin/settings', () => ({
  getAdminSettings: vi.fn(),
}));

vi.mock('@/lib/calculations/financial/staff-costs', () => ({
  calculateStaffCostBaseFromCurriculum: vi.fn(),
}));

vi.mock('@/lib/calculations/financial/projection', () => ({
  calculateFullProjection: vi.fn(),
}));

vi.mock('@/services/report/generate', () => ({
  generateReport: vi.fn(),
}));

vi.mock('@/services/report/storage', () => ({
  storeReport: vi.fn(),
  getReportUrl: vi.fn(),
  readReportFile: vi.fn(),
  deleteReport: vi.fn(),
}));

vi.mock('@/services/audit', () => ({
  logAudit: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    reports: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { auth } from '@/lib/auth/config';
import { getVersionById } from '@/services/version';
import { getAdminSettings } from '@/services/admin/settings';
import { calculateStaffCostBaseFromCurriculum } from '@/lib/calculations/financial/staff-costs';
import { calculateFullProjection } from '@/lib/calculations/financial/projection';
import { generateReport } from '@/services/report/generate';
import { storeReport, getReportUrl, readReportFile, deleteReport } from '@/services/report/storage';
import { logAudit } from '@/services/audit';
import { prisma } from '@/lib/db/prisma';

describe('End-to-End Report Flow', () => {
  const mockUserId = 'user-123';
  const mockVersionId = 'version-123';
  const mockReportId = 'report-123';
  const mockSession = {
    user: {
      id: mockUserId,
      email: 'test@example.com',
      role: 'PLANNER',
    },
  };

  const mockVersion = {
    id: mockVersionId,
    name: 'Test Version',
    curriculumPlans: [
      {
        id: 'cp-1',
        curriculumType: 'FR',
        capacity: 400,
        tuitionBase: new Decimal(50000),
        cpiFrequency: 2,
        studentsProjection: [{ year: 2028, students: 300 }],
        teacherRatio: new Decimal(0.0714),
        nonTeacherRatio: new Decimal(0.0385),
        teacherMonthlySalary: new Decimal(20000),
        nonTeacherMonthlySalary: new Decimal(15000),
      },
      {
        id: 'cp-2',
        curriculumType: 'IB',
        capacity: 200,
        tuitionBase: new Decimal(60000),
        cpiFrequency: 2,
        studentsProjection: [{ year: 2028, students: 100 }],
        teacherRatio: new Decimal(0.0714),
        nonTeacherRatio: new Decimal(0.0385),
        teacherMonthlySalary: new Decimal(20000),
        nonTeacherMonthlySalary: new Decimal(15000),
      },
    ],
    rentPlan: {
      id: 'rent-1',
      rentModel: 'FIXED_ESCALATION',
      parameters: {
        baseRent: 1000000,
        escalationRate: 0.04,
      },
    },
    capexItems: [],
    opexSubAccounts: [],
    capexRules: [],
  };

  const mockAdminSettings = {
    cpiRate: 0.03,
    discountRate: 0.08,
    taxRate: 0.20,
  };

  const mockProjection = {
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
    ],
    summary: {
      totalRevenue: new Decimal(20000000),
      totalStaffCost: new Decimal(5000000),
      totalRent: new Decimal(1000000),
      totalOpex: new Decimal(2000000),
      totalEBITDA: new Decimal(13000000),
      totalCapex: new Decimal(0),
      totalCashFlow: new Decimal(13000000),
      averageRentLoad: new Decimal(5),
      npvRent: new Decimal(20000000),
      npvCashFlow: new Decimal(25000000),
    },
  };

  const mockReport = {
    id: mockReportId,
    versionId: mockVersionId,
    reportType: ReportType.EXECUTIVE_SUMMARY,
    format: ReportFormat.PDF,
    fileName: 'executive-summary-test_version-2025-01-01T00-00-00.pdf',
    filePath: '/path/to/report.pdf',
    fileSize: 1024,
    downloadUrl: 'https://example.com/reports/report-123.pdf',
    expiresAt: new Date('2025-12-31'),
    generatedBy: mockUserId,
    generatedAt: new Date('2025-01-01'),
    metadata: null,
    deletedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(getVersionById).mockResolvedValue({
      success: true,
      data: mockVersion as any,
    });
    vi.mocked(getAdminSettings).mockResolvedValue({
      success: true,
      data: mockAdminSettings,
    });
    vi.mocked(calculateStaffCostBaseFromCurriculum).mockReturnValue({
      success: true,
      data: new Decimal(5000000),
    });
    vi.mocked(calculateFullProjection).mockReturnValue({
      success: true,
      data: mockProjection as any,
    });
    vi.mocked(generateReport).mockResolvedValue({
      success: true,
      data: {
        file: Buffer.from('mock-file-content'),
        fileName: 'executive-summary-test_version-2025-01-01T00-00-00.pdf',
      },
    });
    vi.mocked(storeReport).mockResolvedValue({
      filePath: '/path/to/report.pdf',
      fileSize: 1024,
    });
    vi.mocked(getReportUrl).mockReturnValue('https://example.com/reports/report-123.pdf');
    vi.mocked(prisma.reports.create).mockResolvedValue(mockReport as any);
    vi.mocked(prisma.reports.update).mockResolvedValue({} as any);
    vi.mocked(prisma.reports.findMany).mockResolvedValue([mockReport] as any);
    vi.mocked(prisma.reports.count).mockResolvedValue(1);
    vi.mocked(prisma.reports.findUnique).mockResolvedValue(mockReport as any);
    vi.mocked(readReportFile).mockResolvedValue(Buffer.from('mock-file-content'));
    vi.mocked(deleteReport).mockResolvedValue(undefined);
    vi.mocked(logAudit).mockResolvedValue(undefined);
  });

  describe('Full User Flow', () => {
    it('should complete full flow: generate → list → download → delete', async () => {
      // Step 1: User navigates to /reports and sees list (empty initially)
      const listReq1 = {
        url: 'http://localhost:3000/api/reports',
      } as NextRequest;

      vi.mocked(prisma.reports.findMany).mockResolvedValueOnce([] as any);
      vi.mocked(prisma.reports.count).mockResolvedValueOnce(0);

      const listResponse1 = await GET_LIST(listReq1);
      const listData1 = await listResponse1.json();

      expect(listResponse1.status).toBe(200);
      expect(listData1.data.reports).toHaveLength(0);

      // Step 2: User clicks "Generate New Report"
      const generateReq = {
        json: async () => ({
          reportType: ReportType.EXECUTIVE_SUMMARY,
          format: ReportFormat.PDF,
          includeCharts: true,
          includeYearByYear: true,
          includeAssumptions: false,
          includeAuditTrail: false,
        }),
      } as NextRequest;

      const generateParams = { versionId: mockVersionId };

      const generateResponse = await POST(generateReq, {
        params: Promise.resolve(generateParams),
      });
      const generateData = await generateResponse.json();

      expect(generateResponse.status).toBe(201);
      expect(generateData.success).toBe(true);
      expect(generateData.data.reportId).toBe(mockReportId);
      expect(generateData.data.downloadUrl).toBeDefined();

      // Step 3: Report appears in library
      const listReq2 = {
        url: 'http://localhost:3000/api/reports',
      } as NextRequest;

      vi.mocked(prisma.reports.findMany).mockResolvedValueOnce([mockReport] as any);
      vi.mocked(prisma.reports.count).mockResolvedValueOnce(1);

      const listResponse2 = await GET_LIST(listReq2);
      const listData2 = await listResponse2.json();

      expect(listResponse2.status).toBe(200);
      expect(listData2.data.reports).toHaveLength(1);
      expect(listData2.data.reports[0].id).toBe(mockReportId);

      // Step 4: User can download report
      const downloadReq = {} as NextRequest;
      const downloadParams = { reportId: mockReportId };

      const downloadResponse = await GET_DOWNLOAD(downloadReq, {
        params: Promise.resolve(downloadParams),
      });

      expect(downloadResponse.status).toBe(200);
      expect(downloadResponse.headers.get('Content-Type')).toBe('application/pdf');
      expect(downloadResponse.headers.get('Content-Disposition')).toContain(
        'executive-summary-test_version'
      );

      // Step 5: User can download report again
      const downloadResponse2 = await GET_DOWNLOAD(downloadReq, {
        params: Promise.resolve(downloadParams),
      });

      expect(downloadResponse2.status).toBe(200);

      // Step 6: User can delete report (if creator)
      const deleteReq = {} as NextRequest;
      const deleteParams = { reportId: mockReportId };

      const deleteResponse = await DELETE(deleteReq, {
        params: Promise.resolve(deleteParams),
      });
      const deleteData = await deleteResponse.json();

      expect(deleteResponse.status).toBe(200);
      expect(deleteData.success).toBe(true);
      expect(deleteData.data.message).toContain('deleted successfully');

      // Step 7: Report no longer appears in list (soft deleted)
      vi.mocked(prisma.reports.findMany).mockResolvedValueOnce([] as any);
      vi.mocked(prisma.reports.count).mockResolvedValueOnce(0);

      const listResponse3 = await GET_LIST(listReq2);
      const listData3 = await listResponse3.json();

      expect(listResponse3.status).toBe(200);
      expect(listData3.data.reports).toHaveLength(0);
    });

    it('should show loading state during generation', async () => {
      // Simulate slow generation
      vi.mocked(generateReport).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                success: true,
                data: {
                  file: Buffer.from('mock-file-content'),
                  fileName: 'test-report.pdf',
                },
              });
            }, 100);
          })
      );

      const requestBody = {
        reportType: ReportType.EXECUTIVE_SUMMARY,
        format: ReportFormat.PDF,
        includeCharts: true,
        includeYearByYear: true,
        includeAssumptions: false,
        includeAuditTrail: false,
      };

      const req = {
        json: async () => requestBody,
      } as NextRequest;

      const params = { versionId: mockVersionId };

      const startTime = performance.now();
      const response = await POST(req, { params: Promise.resolve(params) });
      const duration = performance.now() - startTime;

      expect(response.status).toBe(201);
      expect(duration).toBeGreaterThan(100); // Should take some time
    });

    it('should handle error during generation gracefully', async () => {
      vi.mocked(calculateFullProjection).mockReturnValue({
        success: false,
        error: 'Calculation failed',
      });

      const requestBody = {
        reportType: ReportType.EXECUTIVE_SUMMARY,
        format: ReportFormat.PDF,
        includeCharts: true,
        includeYearByYear: true,
        includeAssumptions: false,
        includeAuditTrail: false,
      };

      const req = {
        json: async () => requestBody,
      } as NextRequest;

      const params = { versionId: mockVersionId };

      const response = await POST(req, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.code).toBe('CALCULATION_ERROR');
    });
  });

  describe('Error Handling in UI Flow', () => {
    it('should handle missing version gracefully', async () => {
      vi.mocked(getVersionById).mockResolvedValue({
        success: false,
        error: 'Version not found',
      });

      const requestBody = {
        reportType: ReportType.EXECUTIVE_SUMMARY,
        format: ReportFormat.PDF,
        includeCharts: true,
        includeYearByYear: true,
        includeAssumptions: false,
        includeAuditTrail: false,
      };

      const req = {
        json: async () => requestBody,
      } as NextRequest;

      const params = { versionId: 'invalid-version-id' };

      const response = await POST(req, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.code).toBe('NOT_FOUND');
      // UI should display user-friendly error message
    });

    it('should handle expired report download gracefully', async () => {
      const expiredReport = {
        ...mockReport,
        expiresAt: new Date('2020-01-01'), // Past date
      };

      vi.mocked(prisma.reports.findUnique).mockResolvedValue(expiredReport as any);

      const req = {} as NextRequest;
      const params = { reportId: mockReportId };

      const response = await GET_DOWNLOAD(req, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(410);
      expect(data.success).toBe(false);
      expect(data.code).toBe('EXPIRED');
      // UI should show "Report expired" message and offer to regenerate
    });
  });

  describe('Report Library Display', () => {
    it('should display reports with correct metadata', async () => {
      const req = {
        url: 'http://localhost:3000/api/reports',
      } as NextRequest;

      const response = await GET_LIST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.reports[0]).toMatchObject({
        id: mockReportId,
        reportType: ReportType.EXECUTIVE_SUMMARY,
        format: ReportFormat.PDF,
        fileName: expect.stringContaining('executive-summary'),
        fileSize: 1024,
        generatedAt: expect.any(String),
        expiresAt: expect.any(String),
        version: expect.objectContaining({
          id: mockVersionId,
          name: 'Test Version',
        }),
        generator: expect.objectContaining({
          id: mockUserId,
          email: 'test@example.com',
        }),
      });
    });

    it('should support filtering by version', async () => {
      const req = {
        url: `http://localhost:3000/api/reports?versionId=${mockVersionId}`,
      } as NextRequest;

      await GET_LIST(req);

      expect(vi.mocked(prisma.reports.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            versionId: mockVersionId,
          }),
        })
      );
    });

    it('should support filtering by report type', async () => {
      const req = {
        url: 'http://localhost:3000/api/reports?reportType=EXECUTIVE_SUMMARY',
      } as NextRequest;

      await GET_LIST(req);

      expect(vi.mocked(prisma.reports.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            reportType: ReportType.EXECUTIVE_SUMMARY,
          }),
        })
      );
    });
  });
});

