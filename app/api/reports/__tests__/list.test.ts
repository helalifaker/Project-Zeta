/**
 * Integration Tests: List Reports API Route
 * Tests GET /api/reports
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../../route';
import type { NextRequest } from 'next/server';
import { ReportType, ReportFormat } from '@prisma/client';

// Mock dependencies
vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    reports: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

describe('GET /api/reports', () => {
  const mockUserId = 'user-123';
  const mockSession = {
    user: {
      id: mockUserId,
      email: 'test@example.com',
      role: 'PLANNER',
    },
  };

  const mockReports = [
    {
      id: 'report-1',
      versionId: 'version-1',
      reportType: ReportType.EXECUTIVE_SUMMARY,
      format: ReportFormat.PDF,
      fileName: 'report-1.pdf',
      filePath: '/path/to/report-1.pdf',
      fileSize: 1024,
      downloadUrl: 'https://example.com/reports/report-1.pdf',
      expiresAt: new Date('2025-12-31'),
      generatedBy: mockUserId,
      generatedAt: new Date('2025-01-01'),
      metadata: null,
      deletedAt: null,
      versions: {
        id: 'version-1',
        name: 'Test Version',
      },
      users: {
        id: mockUserId,
        name: 'Test User',
        email: 'test@example.com',
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.reports.findMany).mockResolvedValue(mockReports as any);
    vi.mocked(prisma.reports.count).mockResolvedValue(1);
  });

  describe('Success Cases', () => {
    it('should list reports with default pagination', async () => {
      const req = {
        url: 'http://localhost:3000/api/reports',
      } as NextRequest;

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.reports).toHaveLength(1);
      expect(data.data.pagination.page).toBe(1);
      expect(data.data.pagination.limit).toBe(20);
      expect(data.data.pagination.total).toBe(1);
    });

    it('should filter reports by user (non-ADMIN)', async () => {
      const req = {
        url: 'http://localhost:3000/api/reports',
      } as NextRequest;

      await GET(req);

      expect(vi.mocked(prisma.reports.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            generatedBy: mockUserId,
            deletedAt: null,
          }),
        })
      );
    });

    it('should show all reports for ADMIN', async () => {
      const adminSession = {
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      };

      vi.mocked(auth).mockResolvedValue(adminSession as any);

      const req = {
        url: 'http://localhost:3000/api/reports',
      } as NextRequest;

      await GET(req);

      expect(vi.mocked(prisma.reports.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
            // Should NOT have generatedBy filter for ADMIN
          }),
        })
      );

      const whereClause = vi.mocked(prisma.reports.findMany).mock.calls[0][0].where;
      expect(whereClause.generatedBy).toBeUndefined();
    });

    it('should filter by versionId', async () => {
      const req = {
        url: 'http://localhost:3000/api/reports?versionId=version-1',
      } as NextRequest;

      await GET(req);

      expect(vi.mocked(prisma.reports.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            versionId: 'version-1',
          }),
        })
      );
    });

    it('should filter by reportType', async () => {
      const req = {
        url: 'http://localhost:3000/api/reports?reportType=EXECUTIVE_SUMMARY',
      } as NextRequest;

      await GET(req);

      expect(vi.mocked(prisma.reports.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            reportType: ReportType.EXECUTIVE_SUMMARY,
          }),
        })
      );
    });

    it('should filter by format', async () => {
      const req = {
        url: 'http://localhost:3000/api/reports?format=PDF',
      } as NextRequest;

      await GET(req);

      expect(vi.mocked(prisma.reports.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            format: ReportFormat.PDF,
          }),
        })
      );
    });

    it('should handle pagination', async () => {
      const req = {
        url: 'http://localhost:3000/api/reports?page=2&limit=10',
      } as NextRequest;

      vi.mocked(prisma.reports.count).mockResolvedValue(25);

      const response = await GET(req);
      const data = await response.json();

      expect(data.data.pagination.page).toBe(2);
      expect(data.data.pagination.limit).toBe(10);
      expect(data.data.pagination.total).toBe(25);
      expect(data.data.pagination.totalPages).toBe(3);

      expect(vi.mocked(prisma.reports.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page - 1) * limit = (2 - 1) * 10
          take: 10,
        })
      );
    });

    it('should map snake_case relations to camelCase', async () => {
      const req = {
        url: 'http://localhost:3000/api/reports',
      } as NextRequest;

      const response = await GET(req);
      const data = await response.json();

      expect(data.data.reports[0]).toHaveProperty('version');
      expect(data.data.reports[0]).toHaveProperty('generator');
      expect(data.data.reports[0]).not.toHaveProperty('versions');
      expect(data.data.reports[0]).not.toHaveProperty('users');
    });
  });

  describe('Error Cases', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const req = {
        url: 'http://localhost:3000/api/reports',
      } as NextRequest;

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 if validation fails', async () => {
      const req = {
        url: 'http://localhost:3000/api/reports?page=-1',
      } as NextRequest;

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should return 500 if database query fails', async () => {
      vi.mocked(prisma.reports.findMany).mockRejectedValue(new Error('Database error'));

      const req = {
        url: 'http://localhost:3000/api/reports',
      } as NextRequest;

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });
});

