/**
 * Integration Tests: Download Report API Route
 * Tests GET /api/reports/[reportId]/download
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../../[reportId]/download/route';
import type { NextRequest } from 'next/server';
import { ReportType, ReportFormat } from '@prisma/client';

// Mock dependencies
vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    reports: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/services/report/storage', () => ({
  readReportFile: vi.fn(),
}));

vi.mock('@/services/audit', () => ({
  logAudit: vi.fn(),
}));

import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { readReportFile } from '@/services/report/storage';
import { logAudit } from '@/services/audit';

describe('GET /api/reports/[reportId]/download', () => {
  const mockUserId = 'user-123';
  const mockReportId = 'report-123';
  const mockSession = {
    user: {
      id: mockUserId,
      email: 'test@example.com',
      role: 'PLANNER',
    },
  };

  const mockReport = {
    id: mockReportId,
    versionId: 'version-123',
    reportType: ReportType.EXECUTIVE_SUMMARY,
    format: ReportFormat.PDF,
    fileName: 'test-report.pdf',
    filePath: '/path/to/report.pdf',
    fileSize: 1024,
    downloadUrl: 'https://example.com/reports/report-123.pdf',
    expiresAt: new Date('2025-12-31'),
    generatedBy: mockUserId,
    generatedAt: new Date('2025-01-01'),
    metadata: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.reports.findUnique).mockResolvedValue(mockReport as any);
    vi.mocked(readReportFile).mockResolvedValue(Buffer.from('mock-file-content'));
    vi.mocked(logAudit).mockResolvedValue(undefined);
  });

  describe('Success Cases', () => {
    it('should download PDF report', async () => {
      const req = {} as NextRequest;
      const params = { reportId: mockReportId };

      const response = await GET(req, { params: Promise.resolve(params) });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toContain('test-report.pdf');
      expect(vi.mocked(readReportFile)).toHaveBeenCalledWith('/path/to/report.pdf');
    });

    it('should download Excel report', async () => {
      const excelReport = {
        ...mockReport,
        format: ReportFormat.EXCEL,
        fileName: 'test-report.xlsx',
      };

      vi.mocked(prisma.reports.findUnique).mockResolvedValue(excelReport as any);

      const req = {} as NextRequest;
      const params = { reportId: mockReportId };

      const response = await GET(req, { params: Promise.resolve(params) });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(response.headers.get('Content-Disposition')).toContain('test-report.xlsx');
    });

    it('should allow ADMIN to download any report', async () => {
      const adminSession = {
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      };

      const otherUserReport = {
        ...mockReport,
        generatedBy: 'other-user-123',
      };

      vi.mocked(auth).mockResolvedValue(adminSession as any);
      vi.mocked(prisma.reports.findUnique).mockResolvedValue(otherUserReport as any);

      const req = {} as NextRequest;
      const params = { reportId: mockReportId };

      const response = await GET(req, { params: Promise.resolve(params) });

      expect(response.status).toBe(200);
    });

    it('should log audit trail on download', async () => {
      const req = {} as NextRequest;
      const params = { reportId: mockReportId };

      await GET(req, { params: Promise.resolve(params) });

      expect(vi.mocked(logAudit)).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DOWNLOAD_REPORT',
          userId: mockUserId,
          entityType: 'REPORT',
          entityId: mockReportId,
        })
      );
    });
  });

  describe('Error Cases', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const req = {} as NextRequest;
      const params = { reportId: mockReportId };

      const response = await GET(req, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 if report not found', async () => {
      vi.mocked(prisma.reports.findUnique).mockResolvedValue(null);

      const req = {} as NextRequest;
      const params = { reportId: mockReportId };

      const response = await GET(req, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.code).toBe('NOT_FOUND');
    });

    it('should return 410 if report expired', async () => {
      const expiredReport = {
        ...mockReport,
        expiresAt: new Date('2020-01-01'), // Past date
      };

      vi.mocked(prisma.reports.findUnique).mockResolvedValue(expiredReport as any);

      const req = {} as NextRequest;
      const params = { reportId: mockReportId };

      const response = await GET(req, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(410);
      expect(data.success).toBe(false);
      expect(data.code).toBe('EXPIRED');
    });

    it('should return 403 if user is not owner and not ADMIN', async () => {
      const otherUserReport = {
        ...mockReport,
        generatedBy: 'other-user-123',
      };

      vi.mocked(prisma.reports.findUnique).mockResolvedValue(otherUserReport as any);

      const req = {} as NextRequest;
      const params = { reportId: mockReportId };

      const response = await GET(req, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.code).toBe('FORBIDDEN');
    });

    it('should return 500 if file read fails', async () => {
      vi.mocked(readReportFile).mockRejectedValue(new Error('File not found'));

      const req = {} as NextRequest;
      const params = { reportId: mockReportId };

      const response = await GET(req, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });
});

