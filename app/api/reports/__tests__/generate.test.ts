/**
 * Integration Tests: Report Generation API Route
 * Tests POST /api/reports/generate/[versionId]
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../generate/[versionId]/route';
import type { NextRequest } from 'next/server';
import { ReportType, ReportFormat } from '@prisma/client';

// Mock dependencies
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
}));

vi.mock('@/services/audit', () => ({
  logAudit: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    reports: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { auth } from '@/lib/auth/config';
import { getVersionById } from '@/services/version';
import { getAdminSettings } from '@/services/admin/settings';
import { calculateStaffCostBaseFromCurriculum } from '@/lib/calculations/financial/staff-costs';
import { calculateFullProjection } from '@/lib/calculations/financial/projection';
import { generateReport } from '@/services/report/generate';
import { storeReport, getReportUrl } from '@/services/report/storage';
import { logAudit } from '@/services/audit';
import { prisma } from '@/lib/db/prisma';
import Decimal from 'decimal.js';

describe('POST /api/reports/generate/[versionId]', () => {
  const mockUserId = 'user-123';
  const mockVersionId = 'version-123';
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
    zakatRate: 0.025, // ✅ Saudi Arabian Zakat rate (2.5%)
    currency: 'SAR',
    timezone: 'Asia/Riyadh',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '1,000,000',
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

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
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
        fileName: 'test-report.pdf',
      },
    });
    vi.mocked(storeReport).mockResolvedValue({
      filePath: '/path/to/report.pdf',
      fileSize: 1024,
    });
    vi.mocked(getReportUrl).mockReturnValue('https://example.com/reports/test-id.pdf');
    vi.mocked(prisma.reports.create).mockResolvedValue({
      id: 'report-123',
      versionId: mockVersionId,
      reportType: ReportType.EXECUTIVE_SUMMARY,
      format: ReportFormat.PDF,
      fileName: 'test-report.pdf',
      filePath: '/path/to/report.pdf',
      fileSize: 1024,
      downloadUrl: 'https://example.com/reports/test-id.pdf',
      expiresAt: new Date(),
      generatedBy: mockUserId,
      generatedAt: new Date(),
      metadata: null,
      deletedAt: null,
    } as any);
    vi.mocked(prisma.reports.update).mockResolvedValue({} as any);
    vi.mocked(logAudit).mockResolvedValue(undefined);
  });

  describe('Success Cases', () => {
    it('should generate Executive Summary PDF report', async () => {
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

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.reportId).toBe('report-123');
      expect(data.data.downloadUrl).toBeDefined();
      expect(data.data.expiresAt).toBeDefined();
    });

    it('should generate Financial Detail Excel report', async () => {
      const requestBody = {
        reportType: ReportType.FINANCIAL_DETAIL,
        format: ReportFormat.EXCEL,
        includeCharts: true,
        includeYearByYear: true,
        includeAssumptions: true,
        includeAuditTrail: false,
      };

      const req = {
        json: async () => requestBody,
      } as NextRequest;

      const params = { versionId: mockVersionId };

      const response = await POST(req, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(vi.mocked(generateReport)).toHaveBeenCalledWith(
        expect.objectContaining({
          reportType: ReportType.FINANCIAL_DETAIL,
          format: ReportFormat.EXCEL,
          options: expect.objectContaining({
            includeAssumptions: true,
          }),
        })
      );
    });

    it('should fetch admin settings correctly', async () => {
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

      await POST(req, { params: Promise.resolve(params) });

      expect(vi.mocked(getAdminSettings)).toHaveBeenCalled();

      // Verify admin settings are passed to calculateFullProjection
      const projectionCall = vi.mocked(calculateFullProjection).mock.calls[0][0] as any;
      expect(projectionCall.adminSettings).toBeDefined();

      // Admin settings should be Decimal objects
      expect(projectionCall.adminSettings.cpiRate).toBeInstanceOf(Decimal);
      expect(projectionCall.adminSettings.discountRate).toBeInstanceOf(Decimal);
      expect(projectionCall.adminSettings.zakatRate).toBeInstanceOf(Decimal);

      // Verify values
      expect(projectionCall.adminSettings.cpiRate.toString()).toBe('0.03');
      expect(projectionCall.adminSettings.discountRate.toString()).toBe('0.08');
      expect(projectionCall.adminSettings.zakatRate.toString()).toBe('0.025');
    });

    it('should calculate staff cost base from curriculum plans', async () => {
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

      await POST(req, { params: Promise.resolve(params) });

      expect(vi.mocked(calculateStaffCostBaseFromCurriculum)).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            curriculumType: 'FR',
            studentsProjection: expect.any(Array),
            teacherRatio: expect.any(Object),
          }),
          expect.objectContaining({
            curriculumType: 'IB',
            studentsProjection: expect.any(Array),
            teacherRatio: expect.any(Object),
          }),
        ]),
        2028
      );
    });

    it('should convert opex percentages correctly', async () => {
      const versionWithOpex = {
        ...mockVersion,
        opexSubAccounts: [
          {
            subAccountName: 'Marketing',
            percentOfRevenue: new Decimal(48), // 48% stored as 48
            isFixed: false,
            fixedAmount: null,
          },
        ],
      };

      vi.mocked(getVersionById).mockResolvedValue({
        success: true,
        data: versionWithOpex as any,
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

      await POST(req, { params: Promise.resolve(params) });

      expect(vi.mocked(calculateFullProjection)).toHaveBeenCalledWith(
        expect.objectContaining({
          opexSubAccounts: expect.arrayContaining([
            expect.objectContaining({
              subAccountName: 'Marketing',
              percentOfRevenue: expect.objectContaining({
                // Should be 0.48 (48 / 100), not 48
              }),
            }),
          ]),
        })
      );
    });

    it('should set expiration to 30 days', async () => {
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

      const beforeDate = new Date();
      beforeDate.setDate(beforeDate.getDate() + 30);

      await POST(req, { params: Promise.resolve(params) });

      expect(vi.mocked(prisma.reports.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            expiresAt: expect.any(Date),
          }),
        })
      );

      const createCall = vi.mocked(prisma.reports.create).mock.calls[0][0] as any;
      const expiresAt = new Date(createCall.data.expiresAt);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 30);

      // Allow 1 second tolerance
      expect(Math.abs(expiresAt.getTime() - expectedDate.getTime())).toBeLessThan(1000);
    });
  });

  describe('Error Cases', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const req = {
        json: async () => ({}),
      } as NextRequest;

      const params = { versionId: mockVersionId };

      const response = await POST(req, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 if validation fails', async () => {
      const req = {
        json: async () => ({
          reportType: 'INVALID_TYPE',
        }),
      } as NextRequest;

      const params = { versionId: mockVersionId };

      const response = await POST(req, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 if version not found', async () => {
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

      const params = { versionId: mockVersionId };

      const response = await POST(req, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.code).toBe('NOT_FOUND');
    });

    it('should return 400 if version has no rent plan', async () => {
      const versionWithoutRent = {
        ...mockVersion,
        rentPlan: null,
      };

      vi.mocked(getVersionById).mockResolvedValue({
        success: true,
        data: versionWithoutRent as any,
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

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.error).toContain('rent plan');
    });

    it('should return 400 if version has less than 2 curriculum plans', async () => {
      const versionWithOneCurriculum = {
        ...mockVersion,
        curriculumPlans: [mockVersion.curriculumPlans[0]],
      };

      vi.mocked(getVersionById).mockResolvedValue({
        success: true,
        data: versionWithOneCurriculum as any,
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

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.error).toContain('curriculum plans');
    });

    it('should return 500 if admin settings fetch fails', async () => {
      vi.mocked(getAdminSettings).mockResolvedValue({
        success: false,
        error: 'Failed to fetch admin settings',
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
      expect(data.code).toBe('SETTINGS_ERROR');
    });

    it('should return 500 if staff cost calculation fails', async () => {
      vi.mocked(calculateStaffCostBaseFromCurriculum).mockReturnValue({
        success: false,
        error: 'Failed to calculate staff cost',
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
      expect(data.code).toBe('STAFF_COST_ERROR');
    });

    it('should return 500 if projection calculation fails', async () => {
      vi.mocked(calculateFullProjection).mockReturnValue({
        success: false,
        error: 'Failed to calculate projection',
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

    it('should return 500 if report generation fails', async () => {
      vi.mocked(generateReport).mockResolvedValue({
        success: false,
        error: 'Failed to generate report',
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
      expect(data.code).toBe('GENERATION_ERROR');
    });
  });

  describe('Comparison Reports', () => {
    it('should generate comparison report with 2 versions', async () => {
      const compareVersionId1 = 'version-456';
      const compareVersionId2 = 'version-789';

      const compareVersion1 = {
        ...mockVersion,
        id: compareVersionId1,
        name: 'Compare Version 1',
      };

      const compareVersion2 = {
        ...mockVersion,
        id: compareVersionId2,
        name: 'Compare Version 2',
      };

      // Mock fetching comparison versions
      vi.mocked(getVersionById).mockImplementation((id) => {
        if (id === mockVersionId) {
          return Promise.resolve({
            success: true,
            data: mockVersion as any,
          });
        }
        if (id === compareVersionId1) {
          return Promise.resolve({
            success: true,
            data: compareVersion1 as any,
          });
        }
        if (id === compareVersionId2) {
          return Promise.resolve({
            success: true,
            data: compareVersion2 as any,
          });
        }
        return Promise.resolve({
          success: false,
          error: 'Version not found',
        });
      });

      const requestBody = {
        reportType: ReportType.COMPARISON,
        format: ReportFormat.PDF,
        includeCharts: true,
        includeYearByYear: true,
        includeAssumptions: false,
        includeAuditTrail: false,
        compareWithIds: [compareVersionId1, compareVersionId2],
      };

      const req = {
        json: async () => requestBody,
      } as NextRequest;

      const params = { versionId: mockVersionId };

      const response = await POST(req, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(vi.mocked(getVersionById)).toHaveBeenCalledTimes(3); // Main version + 2 comparison versions
      expect(vi.mocked(calculateFullProjection)).toHaveBeenCalledTimes(3); // Projections for all 3 versions
      expect(vi.mocked(generateReport)).toHaveBeenCalledWith(
        expect.objectContaining({
          reportType: ReportType.COMPARISON,
          compareVersions: expect.arrayContaining([
            expect.objectContaining({ id: compareVersionId1 }),
            expect.objectContaining({ id: compareVersionId2 }),
          ]),
          compareProjections: expect.arrayContaining([expect.any(Object), expect.any(Object)]),
        })
      );
    });

    it('should return 400 if comparison report missing compareWithIds', async () => {
      const requestBody = {
        reportType: ReportType.COMPARISON,
        format: ReportFormat.PDF,
        includeCharts: true,
        includeYearByYear: true,
        includeAssumptions: false,
        includeAuditTrail: false,
        // compareWithIds missing
      };

      const req = {
        json: async () => requestBody,
      } as NextRequest;

      const params = { versionId: mockVersionId };

      const response = await POST(req, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 if comparison report has more than 3 compareWithIds', async () => {
      const requestBody = {
        reportType: ReportType.COMPARISON,
        format: ReportFormat.PDF,
        includeCharts: true,
        includeYearByYear: true,
        includeAssumptions: false,
        includeAuditTrail: false,
        compareWithIds: ['id1', 'id2', 'id3', 'id4'], // 4 IDs (max is 3)
      };

      const req = {
        json: async () => requestBody,
      } as NextRequest;

      const params = { versionId: mockVersionId };

      const response = await POST(req, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 if comparison version not found', async () => {
      const compareVersionId = 'invalid-version-id';

      vi.mocked(getVersionById).mockImplementation((id) => {
        if (id === mockVersionId) {
          return Promise.resolve({
            success: true,
            data: mockVersion as any,
          });
        }
        return Promise.resolve({
          success: false,
          error: 'Version not found',
        });
      });

      const requestBody = {
        reportType: ReportType.COMPARISON,
        format: ReportFormat.PDF,
        includeCharts: true,
        includeYearByYear: true,
        includeAssumptions: false,
        includeAuditTrail: false,
        compareWithIds: [compareVersionId],
      };

      const req = {
        json: async () => requestBody,
      } as NextRequest;

      const params = { versionId: mockVersionId };

      const response = await POST(req, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.code).toBe('NOT_FOUND');
    });

    it('should return 400 if comparison version missing rent plan', async () => {
      const compareVersionId = 'version-456';
      const compareVersionWithoutRent = {
        ...mockVersion,
        id: compareVersionId,
        rentPlan: null,
      };

      vi.mocked(getVersionById).mockImplementation((id) => {
        if (id === mockVersionId) {
          return Promise.resolve({
            success: true,
            data: mockVersion as any,
          });
        }
        if (id === compareVersionId) {
          return Promise.resolve({
            success: true,
            data: compareVersionWithoutRent as any,
          });
        }
        return Promise.resolve({
          success: false,
          error: 'Version not found',
        });
      });

      const requestBody = {
        reportType: ReportType.COMPARISON,
        format: ReportFormat.PDF,
        includeCharts: true,
        includeYearByYear: true,
        includeAssumptions: false,
        includeAuditTrail: false,
        compareWithIds: [compareVersionId],
      };

      const req = {
        json: async () => requestBody,
      } as NextRequest;

      const params = { versionId: mockVersionId };

      const response = await POST(req, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.error).toContain('rent plan');
    });
  });
});
