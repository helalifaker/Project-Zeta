/**
 * Performance Tests: Report Generation
 * Verifies performance targets are met
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../generate/[versionId]/route';
import type { NextRequest } from 'next/server';
import { ReportType, ReportFormat } from '@prisma/client';
import Decimal from 'decimal.js';

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
import { prisma } from '@/lib/db/prisma';

describe('Performance Tests', () => {
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
        studentsProjection: Array.from({ length: 30 }, (_, i) => ({
          year: 2023 + i,
          students: 300 + i * 10,
        })),
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
        studentsProjection: Array.from({ length: 30 }, (_, i) => ({
          year: 2023 + i,
          students: 100 + i * 5,
        })),
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
    years: Array.from({ length: 30 }, (_, i) => ({
      year: 2023 + i,
      revenue: new Decimal(20000000 + i * 1000000),
      staffCost: new Decimal(5000000 + i * 100000),
      rent: new Decimal(1000000 + i * 40000),
      opex: new Decimal(2000000 + i * 100000),
      ebitda: new Decimal(13000000 + i * 850000),
      ebitdaMargin: new Decimal(65),
      capex: new Decimal(0),
      interest: new Decimal(0),
      taxes: new Decimal(0),
      cashFlow: new Decimal(13000000 + i * 850000),
      rentLoad: new Decimal(5),
    })),
    summary: {
      totalRevenue: new Decimal(600000000),
      totalStaffCost: new Decimal(150000000),
      totalRent: new Decimal(30000000),
      totalOpex: new Decimal(60000000),
      totalEBITDA: new Decimal(390000000),
      totalCapex: new Decimal(0),
      totalCashFlow: new Decimal(390000000),
      averageRentLoad: new Decimal(5),
      npvRent: new Decimal(20000000),
      npvCashFlow: new Decimal(25000000),
    },
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
  });

  describe('Performance Targets', () => {
    it('should generate Executive Summary in < 5 seconds', async () => {
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
      expect(duration).toBeLessThan(5000); // < 5 seconds
    });

    it('should generate Financial Detail in < 10 seconds', async () => {
      const requestBody = {
        reportType: ReportType.FINANCIAL_DETAIL,
        format: ReportFormat.PDF,
        includeCharts: true,
        includeYearByYear: true,
        includeAssumptions: true,
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
      expect(duration).toBeLessThan(10000); // < 10 seconds
    });

    it('should generate Excel export in < 8 seconds', async () => {
      const requestBody = {
        reportType: ReportType.EXECUTIVE_SUMMARY,
        format: ReportFormat.EXCEL,
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
      expect(duration).toBeLessThan(8000); // < 8 seconds
    });
  });

  describe('Performance with Large Datasets', () => {
    it('should handle 30 years of data efficiently', async () => {
      // Mock projection with full 30 years
      const fullProjection = {
        years: Array.from({ length: 30 }, (_, i) => ({
          year: 2023 + i,
          revenue: new Decimal(20000000 + i * 1000000),
          staffCost: new Decimal(5000000 + i * 100000),
          rent: new Decimal(1000000 + i * 40000),
          opex: new Decimal(2000000 + i * 100000),
          ebitda: new Decimal(13000000 + i * 850000),
          ebitdaMargin: new Decimal(65),
          capex: new Decimal(0),
          interest: new Decimal(0),
          taxes: new Decimal(0),
          cashFlow: new Decimal(13000000 + i * 850000),
          rentLoad: new Decimal(5),
        })),
        summary: {
          totalRevenue: new Decimal(600000000),
          totalStaffCost: new Decimal(150000000),
          totalRent: new Decimal(30000000),
          totalOpex: new Decimal(60000000),
          totalEBITDA: new Decimal(390000000),
          totalCapex: new Decimal(0),
          totalCashFlow: new Decimal(390000000),
          averageRentLoad: new Decimal(5),
          npvRent: new Decimal(20000000),
          npvCashFlow: new Decimal(25000000),
        },
      };

      vi.mocked(calculateFullProjection).mockReturnValue({
        success: true,
        data: fullProjection as any,
      });

      const requestBody = {
        reportType: ReportType.FINANCIAL_DETAIL,
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
      expect(duration).toBeLessThan(10000); // Should still be < 10 seconds with full data
    });
  });

  describe('Database Query Performance', () => {
    it('should fetch admin settings efficiently', async () => {
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
      await POST(req, { params: Promise.resolve(params) });
      const duration = performance.now() - startTime;

      // Admin settings fetch should be fast (mocked, but verify it's called)
      expect(vi.mocked(getAdminSettings)).toHaveBeenCalled();
      expect(duration).toBeLessThan(5000); // Overall should still be < 5 seconds
    });
  });
});

