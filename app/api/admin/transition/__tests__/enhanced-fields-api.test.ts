/**
 * API Endpoint Tests: Enhanced Transition Fields
 *
 * Tests API endpoints with the new transition year fields:
 * - averageTuitionPerStudent
 * - otherRevenue
 * - staffCostGrowthPercent
 * - rentGrowthPercent
 *
 * Tests:
 * - GET /api/admin/transition (includes new fields in response)
 * - PUT /api/admin/transition (updates new fields)
 * - Validation of new fields
 * - Backward compatibility
 * - Audit logging
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PUT } from '../route';
import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

// Mock auth module
vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(),
}));

const { auth } = await import('@/lib/auth/config');

// Mock admin session
const mockAdminSession = () => ({
  user: {
    id: 'test-admin-123',
    email: 'admin@test.com',
    name: 'Test Admin',
    role: 'ADMIN' as const,
  },
  expires: new Date(Date.now() + 86400000).toISOString(),
});

// Mock non-admin session
const mockViewerSession = () => ({
  user: {
    id: 'test-viewer-123',
    email: 'viewer@test.com',
    name: 'Test Viewer',
    role: 'VIEWER' as const,
  },
  expires: new Date(Date.now() + 86400000).toISOString(),
});

describe('Enhanced Transition Fields - API Tests', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.transition_year_data.deleteMany({});
    await prisma.admin_settings.deleteMany({ where: { key: 'general' } });
    await prisma.audit_logs.deleteMany({});

    // Seed admin settings
    await prisma.admin_settings.create({
      data: {
        key: 'general',
        cpiRate: new Decimal('0.03'),
        discountRate: new Decimal('0.08'),
        zakatRate: new Decimal('0.025'),
        transitionCapacityCap: 1850,
        transitionRentAdjustmentPercent: new Decimal('10.0'),
        transitionStaffCostBase2024: new Decimal('32000000'),
        transitionRentBase2024: new Decimal('12000000'),
      },
    });

    // Seed transition year data with NEW fields
    await prisma.transition_year_data.createMany({
      data: [
        {
          year: 2025,
          targetEnrollment: 1800,
          staffCostBase: new Decimal('33000000'),
          averageTuitionPerStudent: new Decimal('50000'),
          otherRevenue: new Decimal('2000000'),
          staffCostGrowthPercent: new Decimal('5.0'),
          rentGrowthPercent: new Decimal('10.0'),
          notes: 'Year 2025 with new fields',
        },
        {
          year: 2026,
          targetEnrollment: 1850,
          staffCostBase: new Decimal('34000000'),
          averageTuitionPerStudent: new Decimal('51500'),
          otherRevenue: new Decimal('2100000'),
          staffCostGrowthPercent: new Decimal('8.0'),
          rentGrowthPercent: new Decimal('15.0'),
          notes: 'Year 2026 with new fields',
        },
        {
          year: 2027,
          targetEnrollment: 1850,
          staffCostBase: new Decimal('35000000'),
          averageTuitionPerStudent: new Decimal('53000'),
          otherRevenue: new Decimal('2200000'),
          staffCostGrowthPercent: new Decimal('10.0'),
          rentGrowthPercent: new Decimal('18.0'),
          notes: 'Year 2027 with new fields',
        },
      ],
    });
  });

  afterEach(async () => {
    await prisma.transition_year_data.deleteMany({});
    await prisma.admin_settings.deleteMany({ where: { key: 'general' } });
    await prisma.audit_logs.deleteMany({});
    vi.clearAllMocks();
  });

  describe('GET /api/admin/transition - Enhanced Response', () => {
    it('should return yearData with all new fields', async () => {
      // @ts-ignore
      auth.mockResolvedValue(mockAdminSession());

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.yearData).toHaveLength(3);

      // Verify year 2025 has all new fields
      const year2025 = data.data.yearData.find((y: any) => y.year === 2025);
      expect(year2025).toBeDefined();
      expect(year2025.averageTuitionPerStudent).toBeDefined();
      expect(year2025.otherRevenue).toBeDefined();
      expect(year2025.staffCostGrowthPercent).toBeDefined();
      expect(year2025.rentGrowthPercent).toBeDefined();

      // Verify values
      expect(parseFloat(year2025.averageTuitionPerStudent)).toBe(50000);
      expect(parseFloat(year2025.otherRevenue)).toBe(2000000);
      expect(parseFloat(year2025.staffCostGrowthPercent)).toBe(5.0);
      expect(parseFloat(year2025.rentGrowthPercent)).toBe(10.0);
    });

    it('should return settings with base year 2024 values', async () => {
      // @ts-ignore
      auth.mockResolvedValue(mockAdminSession());

      const response = await GET();
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.settings.staffCostBase2024).toBeDefined();
      expect(data.data.settings.rentBase2024).toBeDefined();
      expect(parseFloat(data.data.settings.staffCostBase2024)).toBe(32000000);
      expect(parseFloat(data.data.settings.rentBase2024)).toBe(12000000);
    });

    it('should handle null new fields gracefully (backward compatibility)', async () => {
      // Update one year to have null new fields
      await prisma.transition_year_data.update({
        where: { year: 2025 },
        data: {
          averageTuitionPerStudent: null,
          otherRevenue: null,
          staffCostGrowthPercent: null,
          rentGrowthPercent: null,
        },
      });

      // @ts-ignore
      auth.mockResolvedValue(mockAdminSession());

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      const year2025 = data.data.yearData.find((y: any) => y.year === 2025);

      // Should return null for these fields
      expect(year2025.averageTuitionPerStudent).toBeNull();
      expect(year2025.otherRevenue).toBeNull();
      expect(year2025.staffCostGrowthPercent).toBeNull();
      expect(year2025.rentGrowthPercent).toBeNull();
    });

    it('should return 401 when not authenticated', async () => {
      // @ts-ignore
      auth.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should return 403 for non-admin users', async () => {
      // @ts-ignore
      auth.mockResolvedValue(mockViewerSession());

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });
  });

  describe('PUT /api/admin/transition - Update New Fields', () => {
    it('should update averageTuitionPerStudent for a year', async () => {
      // @ts-ignore
      auth.mockResolvedValue(mockAdminSession());

      const request = new NextRequest('http://localhost:3000/api/admin/transition', {
        method: 'PUT',
        body: JSON.stringify({
          yearData: [
            {
              year: 2025,
              averageTuitionPerStudent: 55000, // Update from 50K to 55K
            },
          ],
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify update
      const year2025 = data.data.yearData.find((y: any) => y.year === 2025);
      expect(parseFloat(year2025.averageTuitionPerStudent)).toBe(55000);
    });

    it('should update otherRevenue for a year', async () => {
      // @ts-ignore
      auth.mockResolvedValue(mockAdminSession());

      const request = new NextRequest('http://localhost:3000/api/admin/transition', {
        method: 'PUT',
        body: JSON.stringify({
          yearData: [
            {
              year: 2025,
              otherRevenue: 3000000, // Update from 2M to 3M
            },
          ],
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      const year2025 = data.data.yearData.find((y: any) => y.year === 2025);
      expect(parseFloat(year2025.otherRevenue)).toBe(3000000);
    });

    it('should update staffCostGrowthPercent for a year', async () => {
      // @ts-ignore
      auth.mockResolvedValue(mockAdminSession());

      const request = new NextRequest('http://localhost:3000/api/admin/transition', {
        method: 'PUT',
        body: JSON.stringify({
          yearData: [
            {
              year: 2025,
              staffCostGrowthPercent: 7.5, // Update from 5% to 7.5%
            },
          ],
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      const year2025 = data.data.yearData.find((y: any) => y.year === 2025);
      expect(parseFloat(year2025.staffCostGrowthPercent)).toBeCloseTo(7.5, 1);
    });

    it('should update rentGrowthPercent for a year', async () => {
      // @ts-ignore
      auth.mockResolvedValue(mockAdminSession());

      const request = new NextRequest('http://localhost:3000/api/admin/transition', {
        method: 'PUT',
        body: JSON.stringify({
          yearData: [
            {
              year: 2025,
              rentGrowthPercent: 12.0, // Update from 10% to 12%
            },
          ],
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      const year2025 = data.data.yearData.find((y: any) => y.year === 2025);
      expect(parseFloat(year2025.rentGrowthPercent)).toBeCloseTo(12.0, 1);
    });

    it('should update ALL new fields simultaneously', async () => {
      // @ts-ignore
      auth.mockResolvedValue(mockAdminSession());

      const request = new NextRequest('http://localhost:3000/api/admin/transition', {
        method: 'PUT',
        body: JSON.stringify({
          yearData: [
            {
              year: 2025,
              averageTuitionPerStudent: 60000,
              otherRevenue: 3500000,
              staffCostGrowthPercent: 9.0,
              rentGrowthPercent: 14.0,
            },
          ],
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      const year2025 = data.data.yearData.find((y: any) => y.year === 2025);

      expect(parseFloat(year2025.averageTuitionPerStudent)).toBe(60000);
      expect(parseFloat(year2025.otherRevenue)).toBe(3500000);
      expect(parseFloat(year2025.staffCostGrowthPercent)).toBeCloseTo(9.0, 1);
      expect(parseFloat(year2025.rentGrowthPercent)).toBeCloseTo(14.0, 1);
    });

    it('should update multiple years in one request', async () => {
      // @ts-ignore
      auth.mockResolvedValue(mockAdminSession());

      const request = new NextRequest('http://localhost:3000/api/admin/transition', {
        method: 'PUT',
        body: JSON.stringify({
          yearData: [
            {
              year: 2025,
              averageTuitionPerStudent: 55000,
            },
            {
              year: 2026,
              averageTuitionPerStudent: 56500,
            },
            {
              year: 2027,
              averageTuitionPerStudent: 58000,
            },
          ],
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      const year2025 = data.data.yearData.find((y: any) => y.year === 2025);
      const year2026 = data.data.yearData.find((y: any) => y.year === 2026);
      const year2027 = data.data.yearData.find((y: any) => y.year === 2027);

      expect(parseFloat(year2025.averageTuitionPerStudent)).toBe(55000);
      expect(parseFloat(year2026.averageTuitionPerStudent)).toBe(56500);
      expect(parseFloat(year2027.averageTuitionPerStudent)).toBe(58000);
    });

    it('should update base year 2024 values in settings', async () => {
      // @ts-ignore
      auth.mockResolvedValue(mockAdminSession());

      const request = new NextRequest('http://localhost:3000/api/admin/transition', {
        method: 'PUT',
        body: JSON.stringify({
          settings: {
            transitionStaffCostBase2024: 35000000, // Update from 32M to 35M
            transitionRentBase2024: 14000000, // Update from 12M to 14M
          },
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(parseFloat(data.data.settings.staffCostBase2024)).toBe(35000000);
      expect(parseFloat(data.data.settings.rentBase2024)).toBe(14000000);
    });
  });

  describe('Validation Tests', () => {
    it('should reject negative averageTuitionPerStudent', async () => {
      // @ts-ignore
      auth.mockResolvedValue(mockAdminSession());

      const request = new NextRequest('http://localhost:3000/api/admin/transition', {
        method: 'PUT',
        body: JSON.stringify({
          yearData: [
            {
              year: 2025,
              averageTuitionPerStudent: -5000, // Invalid
            },
          ],
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject zero averageTuitionPerStudent', async () => {
      // @ts-ignore
      auth.mockResolvedValue(mockAdminSession());

      const request = new NextRequest('http://localhost:3000/api/admin/transition', {
        method: 'PUT',
        body: JSON.stringify({
          yearData: [
            {
              year: 2025,
              averageTuitionPerStudent: 0, // Invalid
            },
          ],
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject negative otherRevenue', async () => {
      // @ts-ignore
      auth.mockResolvedValue(mockAdminSession());

      const request = new NextRequest('http://localhost:3000/api/admin/transition', {
        method: 'PUT',
        body: JSON.stringify({
          yearData: [
            {
              year: 2025,
              otherRevenue: -1000000, // Invalid
            },
          ],
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should accept zero otherRevenue', async () => {
      // @ts-ignore
      auth.mockResolvedValue(mockAdminSession());

      const request = new NextRequest('http://localhost:3000/api/admin/transition', {
        method: 'PUT',
        body: JSON.stringify({
          yearData: [
            {
              year: 2025,
              otherRevenue: 0, // Valid
            },
          ],
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject staffCostGrowthPercent below -50%', async () => {
      // @ts-ignore
      auth.mockResolvedValue(mockAdminSession());

      const request = new NextRequest('http://localhost:3000/api/admin/transition', {
        method: 'PUT',
        body: JSON.stringify({
          yearData: [
            {
              year: 2025,
              staffCostGrowthPercent: -51.0, // Invalid (< -50)
            },
          ],
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject staffCostGrowthPercent above 200%', async () => {
      // @ts-ignore
      auth.mockResolvedValue(mockAdminSession());

      const request = new NextRequest('http://localhost:3000/api/admin/transition', {
        method: 'PUT',
        body: JSON.stringify({
          yearData: [
            {
              year: 2025,
              staffCostGrowthPercent: 201.0, // Invalid (> 200)
            },
          ],
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should accept staffCostGrowthPercent at boundaries (-50% and 200%)', async () => {
      // @ts-ignore
      auth.mockResolvedValue(mockAdminSession());

      // Test -50%
      const request1 = new NextRequest('http://localhost:3000/api/admin/transition', {
        method: 'PUT',
        body: JSON.stringify({
          yearData: [
            {
              year: 2025,
              staffCostGrowthPercent: -50.0,
            },
          ],
        }),
      });

      const response1 = await PUT(request1);
      expect(response1.status).toBe(200);

      // Test 200%
      const request2 = new NextRequest('http://localhost:3000/api/admin/transition', {
        method: 'PUT',
        body: JSON.stringify({
          yearData: [
            {
              year: 2025,
              staffCostGrowthPercent: 200.0,
            },
          ],
        }),
      });

      const response2 = await PUT(request2);
      expect(response2.status).toBe(200);
    });

    it('should validate rentGrowthPercent range (-50% to 200%)', async () => {
      // @ts-ignore
      auth.mockResolvedValue(mockAdminSession());

      // Invalid: below -50%
      const request1 = new NextRequest('http://localhost:3000/api/admin/transition', {
        method: 'PUT',
        body: JSON.stringify({
          yearData: [{ year: 2025, rentGrowthPercent: -60.0 }],
        }),
      });
      const response1 = await PUT(request1);
      expect(response1.status).toBe(400);

      // Invalid: above 200%
      const request2 = new NextRequest('http://localhost:3000/api/admin/transition', {
        method: 'PUT',
        body: JSON.stringify({
          yearData: [{ year: 2025, rentGrowthPercent: 250.0 }],
        }),
      });
      const response2 = await PUT(request2);
      expect(response2.status).toBe(400);

      // Valid: within range
      const request3 = new NextRequest('http://localhost:3000/api/admin/transition', {
        method: 'PUT',
        body: JSON.stringify({
          yearData: [{ year: 2025, rentGrowthPercent: 15.0 }],
        }),
      });
      const response3 = await PUT(request3);
      expect(response3.status).toBe(200);
    });
  });

  describe('Audit Logging', () => {
    it('should create audit log when updating new fields', async () => {
      // @ts-ignore
      auth.mockResolvedValue(mockAdminSession());

      const request = new NextRequest('http://localhost:3000/api/admin/transition', {
        method: 'PUT',
        body: JSON.stringify({
          yearData: [
            {
              year: 2025,
              averageTuitionPerStudent: 60000,
              otherRevenue: 3000000,
            },
          ],
        }),
      });

      await PUT(request);

      // Verify audit log was created
      const auditLog = await prisma.audit_logs.findFirst({
        where: {
          action: 'UPDATE_TRANSITION_YEAR',
          userId: 'test-admin-123',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.metadata).toHaveProperty('oldValue');
      expect(auditLog?.metadata).toHaveProperty('newValue');
    });

    it('should include old and new values in audit log metadata', async () => {
      // @ts-ignore
      auth.mockResolvedValue(mockAdminSession());

      const request = new NextRequest('http://localhost:3000/api/admin/transition', {
        method: 'PUT',
        body: JSON.stringify({
          yearData: [
            {
              year: 2025,
              averageTuitionPerStudent: 60000, // Changed from 50000
            },
          ],
        }),
      });

      await PUT(request);

      const auditLog = await prisma.audit_logs.findFirst({
        where: { action: 'UPDATE_TRANSITION_YEAR' },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).toBeDefined();
      const metadata = auditLog?.metadata as any;
      expect(metadata.oldValue.averageTuitionPerStudent).toBe(50000);
      expect(metadata.newValue.averageTuitionPerStudent).toBe(60000);
    });
  });

  describe('Backward Compatibility', () => {
    it('should handle update request without new fields (only old fields)', async () => {
      // @ts-ignore
      auth.mockResolvedValue(mockAdminSession());

      const request = new NextRequest('http://localhost:3000/api/admin/transition', {
        method: 'PUT',
        body: JSON.stringify({
          yearData: [
            {
              year: 2025,
              targetEnrollment: 2000, // Old field
              notes: 'Updated old field only', // Old field
            },
          ],
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      const year2025 = data.data.yearData.find((y: any) => y.year === 2025);
      expect(year2025.targetEnrollment).toBe(2000);
      expect(year2025.notes).toBe('Updated old field only');

      // New fields should remain unchanged
      expect(parseFloat(year2025.averageTuitionPerStudent)).toBe(50000); // Original value
    });

    it('should handle mixed updates (old + new fields)', async () => {
      // @ts-ignore
      auth.mockResolvedValue(mockAdminSession());

      const request = new NextRequest('http://localhost:3000/api/admin/transition', {
        method: 'PUT',
        body: JSON.stringify({
          yearData: [
            {
              year: 2025,
              targetEnrollment: 2000, // Old field
              averageTuitionPerStudent: 58000, // New field
              notes: 'Mixed update', // Old field
            },
          ],
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      const year2025 = data.data.yearData.find((y: any) => y.year === 2025);

      expect(year2025.targetEnrollment).toBe(2000);
      expect(parseFloat(year2025.averageTuitionPerStudent)).toBe(58000);
      expect(year2025.notes).toBe('Mixed update');
    });
  });
});
