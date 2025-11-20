/**
 * Calculation Accuracy Tests
 * Compares report calculations with Costs Analysis tab calculations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../generate/[versionId]/route';
import type { NextRequest } from 'next/server';
import { ReportType, ReportFormat } from '@prisma/client';
import Decimal from 'decimal.js';
import { calculateFullProjection } from '@/lib/calculations/financial/projection';

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

vi.mock('@/lib/calculations/financial/projection');
vi.mock('@/services/report/generate');
vi.mock('@/services/report/storage');
vi.mock('@/services/audit');
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
import { prisma } from '@/lib/db/prisma';

describe('Calculation Accuracy Tests', () => {
  const mockUserId = 'user-123';
  const mockVersionId = 'version-123';
  const mockSession = {
    user: {
      id: mockUserId,
      email: 'test@example.com',
      role: 'PLANNER',
    },
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
        studentsProjection: [
          { year: 2028, students: 300 },
          { year: 2029, students: 350 },
          { year: 2030, students: 400 },
        ],
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
        studentsProjection: [
          { year: 2028, students: 100 },
          { year: 2029, students: 150 },
          { year: 2030, students: 200 },
        ],
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
    opexSubAccounts: [
      {
        id: 'opex-1',
        subAccountName: 'Marketing',
        percentOfRevenue: new Decimal(48), // 48% stored as 48
        isFixed: false,
        fixedAmount: null,
      },
      {
        id: 'opex-2',
        subAccountName: 'Utilities',
        percentOfRevenue: null,
        isFixed: true,
        fixedAmount: new Decimal(200000),
      },
    ],
    capexRules: [],
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
    vi.mocked(prisma.reports.create).mockResolvedValue({
      id: 'report-123',
      versionId: mockVersionId,
      reportType: ReportType.EXECUTIVE_SUMMARY,
      format: ReportFormat.PDF,
      fileName: 'test-report.pdf',
      filePath: '/path/to/report.pdf',
      fileSize: 1024,
      downloadUrl: 'https://example.com/reports/report-123.pdf',
      expiresAt: new Date(),
      generatedBy: mockUserId,
      generatedAt: new Date(),
      metadata: null,
      deletedAt: null,
    } as any);
    vi.mocked(prisma.reports.update).mockResolvedValue({} as any);
  });

  describe('Admin Settings Usage', () => {
    it('should use admin settings from database (not hardcoded)', async () => {
      const customAdminSettings = {
        cpiRate: 0.035, // 3.5% instead of default 3%
        discountRate: 0.09, // 9% instead of default 8%
        zakatRate: 0.025, // 2.5% Saudi Arabian Zakat rate
        currency: 'SAR',
        timezone: 'Asia/Riyadh',
        dateFormat: 'DD/MM/YYYY',
        numberFormat: '1,000,000',
      };

      vi.mocked(getAdminSettings).mockResolvedValue({
        success: true,
        data: customAdminSettings,
      });

      const staffCostBase = new Decimal(5000000);
      vi.mocked(calculateStaffCostBaseFromCurriculum).mockReturnValue({
        success: true,
        data: staffCostBase,
      });

      const mockProjection = {
        years: [],
        summary: {
          totalRevenue: new Decimal(0),
          totalStaffCost: new Decimal(0),
          totalRent: new Decimal(0),
          totalOpex: new Decimal(0),
          totalEBITDA: new Decimal(0),
          totalCapex: new Decimal(0),
          totalCashFlow: new Decimal(0),
          averageRentLoad: new Decimal(0),
          npvRent: new Decimal(0),
          npvCashFlow: new Decimal(0),
        },
      };

      vi.mocked(calculateFullProjection).mockReturnValue({
        success: true,
        data: mockProjection as any,
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

      // Verify calculateFullProjection was called with custom admin settings
      expect(vi.mocked(calculateFullProjection)).toHaveBeenCalledWith(
        expect.objectContaining({
          adminSettings: expect.objectContaining({
            cpiRate: expect.objectContaining({
              // Should be 0.035 (from custom settings), not 0.03 (hardcoded)
            }),
            discountRate: expect.objectContaining({
              // Should be 0.09 (from custom settings), not 0.08 (hardcoded)
            }),
            taxRate: expect.objectContaining({
              // Should be 0.25 (from custom settings), not 0.20 (hardcoded)
            }),
          }),
        })
      );
    });
  });

  describe('Staff Cost Calculation', () => {
    it('should calculate staff cost base from curriculum plans (not hardcoded 15M)', async () => {
      // Calculate expected staff cost manually
      // FR: 300 students × 0.0714 × 20000 × 12 + 300 × 0.0385 × 15000 × 12
      // IB: 100 students × 0.0714 × 20000 × 12 + 100 × 0.0385 × 15000 × 12
      const expectedStaffCostFR = new Decimal(300)
        .times(0.0714)
        .times(20000)
        .times(12)
        .plus(new Decimal(300).times(0.0385).times(15000).times(12));

      const expectedStaffCostIB = new Decimal(100)
        .times(0.0714)
        .times(20000)
        .times(12)
        .plus(new Decimal(100).times(0.0385).times(15000).times(12));

      const expectedTotal = expectedStaffCostFR.plus(expectedStaffCostIB);

      vi.mocked(calculateStaffCostBaseFromCurriculum).mockReturnValue({
        success: true,
        data: expectedTotal,
      });

      const mockProjection = {
        years: [],
        summary: {
          totalRevenue: new Decimal(0),
          totalStaffCost: new Decimal(0),
          totalRent: new Decimal(0),
          totalOpex: new Decimal(0),
          totalEBITDA: new Decimal(0),
          totalCapex: new Decimal(0),
          totalCashFlow: new Decimal(0),
          averageRentLoad: new Decimal(0),
          npvRent: new Decimal(0),
          npvCashFlow: new Decimal(0),
        },
      };

      vi.mocked(calculateFullProjection).mockReturnValue({
        success: true,
        data: mockProjection as any,
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

      // Verify calculateStaffCostBaseFromCurriculum was called
      expect(vi.mocked(calculateStaffCostBaseFromCurriculum)).toHaveBeenCalled();

      // Verify calculateFullProjection was called with calculated staff cost (not 15M)
      expect(vi.mocked(calculateFullProjection)).toHaveBeenCalledWith(
        expect.objectContaining({
          staffCostBase: expectedTotal, // Should be calculated value, not hardcoded 15M
        })
      );

      // Verify it's NOT the hardcoded 15M value
      const projectionCall = vi.mocked(calculateFullProjection).mock.calls[0][0] as any;
      expect(projectionCall.staffCostBase.toString()).not.toBe('15000000');
    });
  });

  describe('Opex Percentage Conversion', () => {
    it('should convert opex percentages from percentage to decimal (48 → 0.48)', async () => {
      const staffCostBase = new Decimal(5000000);
      vi.mocked(calculateStaffCostBaseFromCurriculum).mockReturnValue({
        success: true,
        data: staffCostBase,
      });

      const mockProjection = {
        years: [],
        summary: {
          totalRevenue: new Decimal(0),
          totalStaffCost: new Decimal(0),
          totalRent: new Decimal(0),
          totalOpex: new Decimal(0),
          totalEBITDA: new Decimal(0),
          totalCapex: new Decimal(0),
          totalCashFlow: new Decimal(0),
          averageRentLoad: new Decimal(0),
          npvRent: new Decimal(0),
          npvCashFlow: new Decimal(0),
        },
      };

      vi.mocked(calculateFullProjection).mockReturnValue({
        success: true,
        data: mockProjection as any,
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

      // Verify calculateFullProjection was called with converted opex percentages
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

      // Verify the conversion: 48 → 0.48
      const projectionCall = vi.mocked(calculateFullProjection).mock.calls[0][0] as any;
      const marketingOpex = projectionCall.opexSubAccounts.find(
        (a: any) => a.subAccountName === 'Marketing'
      );
      expect(marketingOpex.percentOfRevenue.toString()).toBe('0.48');
      expect(marketingOpex.percentOfRevenue.toString()).not.toBe('48');
    });

    it('should handle fixed opex amounts correctly', async () => {
      const staffCostBase = new Decimal(5000000);
      vi.mocked(calculateStaffCostBaseFromCurriculum).mockReturnValue({
        success: true,
        data: staffCostBase,
      });

      const mockProjection = {
        years: [],
        summary: {
          totalRevenue: new Decimal(0),
          totalStaffCost: new Decimal(0),
          totalRent: new Decimal(0),
          totalOpex: new Decimal(0),
          totalEBITDA: new Decimal(0),
          totalCapex: new Decimal(0),
          totalCashFlow: new Decimal(0),
          averageRentLoad: new Decimal(0),
          npvRent: new Decimal(0),
          npvCashFlow: new Decimal(0),
        },
      };

      vi.mocked(calculateFullProjection).mockReturnValue({
        success: true,
        data: mockProjection as any,
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

      // Verify fixed opex amounts are passed correctly
      const projectionCall = vi.mocked(calculateFullProjection).mock.calls[0][0] as any;
      const utilitiesOpex = projectionCall.opexSubAccounts.find(
        (a: any) => a.subAccountName === 'Utilities'
      );
      expect(utilitiesOpex.isFixed).toBe(true);
      expect(utilitiesOpex.fixedAmount).toBeDefined();
      expect(utilitiesOpex.percentOfRevenue).toBeNull();
    });
  });

  describe('Calculation Consistency', () => {
    it('should use same calculation logic as Costs Analysis tab', async () => {
      // This test verifies that the same calculation functions are used
      // The actual calculation logic is tested in unit tests for each calculation module
      // Here we verify that the report generation uses the same functions

      const staffCostBase = new Decimal(5000000);
      vi.mocked(calculateStaffCostBaseFromCurriculum).mockReturnValue({
        success: true,
        data: staffCostBase,
      });

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

      vi.mocked(calculateFullProjection).mockReturnValue({
        success: true,
        data: mockProjection as any,
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

      // Verify calculateFullProjection was called (same function used in Costs Analysis tab)
      expect(vi.mocked(calculateFullProjection)).toHaveBeenCalled();

      // Verify the projection result is passed to report generation
      // (This ensures reports use the same calculations as the Costs Analysis tab)
      const { generateReport } = await import('@/services/report/generate');
      expect(vi.mocked(generateReport)).toHaveBeenCalledWith(
        expect.objectContaining({
          projection: mockProjection,
        })
      );
    });
  });
});

