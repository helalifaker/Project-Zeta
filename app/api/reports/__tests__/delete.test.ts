/**
 * Integration Tests: Delete Report API Route
 * Tests DELETE /api/reports/[reportId]
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE } from '../../[reportId]/route';
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
      update: vi.fn(),
    },
  },
}));

vi.mock('@/services/report/storage', () => ({
  deleteReport: vi.fn(),
}));

vi.mock('@/services/audit', () => ({
  logAudit: vi.fn(),
}));

import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { deleteReport } from '@/services/report/storage';
import { logAudit } from '@/services/audit';

describe('DELETE /api/reports/[reportId]', () => {
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
    vi.mocked(prisma.reports.update).mockResolvedValue({} as any);
    vi.mocked(deleteReport).mockResolvedValue(undefined);
    vi.mocked(logAudit).mockResolvedValue(undefined);
  });

  describe('Success Cases', () => {
    it('should delete report (soft delete)', async () => {
      const req = {} as NextRequest;
      const params = { reportId: mockReportId };

      const response = await DELETE(req, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.message).toContain('deleted successfully');

      // Should soft delete (set deletedAt)
      expect(vi.mocked(prisma.reports.update)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockReportId },
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
          }),
        })
      );

      // Should delete file from storage
      expect(vi.mocked(deleteReport)).toHaveBeenCalledWith('/path/to/report.pdf');
    });

    it('should allow ADMIN to delete any report', async () => {
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

      const response = await DELETE(req, { params: Promise.resolve(params) });

      expect(response.status).toBe(200);
    });

    it('should log audit trail on delete', async () => {
      const req = {} as NextRequest;
      const params = { reportId: mockReportId };

      await DELETE(req, { params: Promise.resolve(params) });

      expect(vi.mocked(logAudit)).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DELETE_REPORT',
          userId: mockUserId,
          entityType: 'REPORT',
          entityId: mockReportId,
          metadata: expect.objectContaining({
            fileName: 'test-report.pdf',
            reportType: ReportType.EXECUTIVE_SUMMARY,
            format: ReportFormat.PDF,
          }),
        })
      );
    });
  });

  describe('Error Cases', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const req = {} as NextRequest;
      const params = { reportId: mockReportId };

      const response = await DELETE(req, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 if report not found', async () => {
      vi.mocked(prisma.reports.findUnique).mockResolvedValue(null);

      const req = {} as NextRequest;
      const params = { reportId: mockReportId };

      const response = await DELETE(req, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.code).toBe('NOT_FOUND');
    });

    it('should return 403 if user is not owner and not ADMIN', async () => {
      const otherUserReport = {
        ...mockReport,
        generatedBy: 'other-user-123',
      };

      vi.mocked(prisma.reports.findUnique).mockResolvedValue(otherUserReport as any);

      const req = {} as NextRequest;
      const params = { reportId: mockReportId };

      const response = await DELETE(req, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.code).toBe('FORBIDDEN');
    });

    it('should return 500 if database update fails', async () => {
      vi.mocked(prisma.reports.update).mockRejectedValue(new Error('Database error'));

      const req = {} as NextRequest;
      const params = { reportId: mockReportId };

      const response = await DELETE(req, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.code).toBe('INTERNAL_ERROR');
    });

    it('should return 500 if file deletion fails', async () => {
      vi.mocked(deleteReport).mockRejectedValue(new Error('File deletion failed'));

      const req = {} as NextRequest;
      const params = { reportId: mockReportId };

      const response = await DELETE(req, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });
});

