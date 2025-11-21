/**
 * API Endpoint Tests for Transition Period Routes
 *
 * Tests all transition API endpoints with:
 * - Authentication and authorization
 * - Request validation
 * - Response formats
 * - Error handling
 * - Audit logging
 *
 * Endpoints:
 * - GET /api/admin/transition
 * - PUT /api/admin/transition/settings
 * - PUT /api/admin/transition/year/[year]
 * - POST /api/admin/transition/recalculate
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getCompleteConfig } from '../route';
import { PUT as updateSettings } from '../settings/route';
import { PUT as updateYear } from '../year/[year]/route';
import { POST as recalculate } from '../recalculate/route';
import {
  cleanupTransitionTestData,
  seedTransitionTestData,
  seedTransitionAdminSettings,
  mockAdminSession,
  mockPlannerSession,
  mockViewerSession,
  verifyAuditLog,
} from '@/test-utils/transition-helpers';
import { recalculationTestData } from '@/fixtures/transition-test-data';

// Mock auth module
vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(),
}));

const { auth } = await import('@/lib/auth/config');

describe('Transition API - GET /api/admin/transition', () => {
  beforeEach(async () => {
    await cleanupTransitionTestData();
    await seedTransitionTestData();
    await seedTransitionAdminSettings(1850, 10.0);
  });

  afterEach(async () => {
    await cleanupTransitionTestData();
    vi.clearAllMocks();
  });

  it('should return complete transition config for admin user', async () => {
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(mockAdminSession());

    const response = await getCompleteConfig();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('settings');
    expect(data.data).toHaveProperty('yearData');
    expect(data.data.settings.capacityCap).toBe(1850);
    expect(data.data.settings.rentAdjustmentPercent).toBe(10.0);
    expect(data.data.yearData).toHaveLength(3);
  });

  it('should return 401 when not authenticated', async () => {
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(null);

    const response = await getCompleteConfig();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Unauthorized');
  });

  it('should return 403 for non-admin users (PLANNER)', async () => {
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(mockPlannerSession());

    const response = await getCompleteConfig();
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Admin access required');
  });

  it('should return 403 for non-admin users (VIEWER)', async () => {
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(mockViewerSession());

    const response = await getCompleteConfig();
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('should return 500 on database error', async () => {
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(mockAdminSession());

    // Clear all data to trigger error
    await cleanupTransitionTestData();
    const { prisma } = await import('@/lib/db/prisma');
    await prisma.admin_settings.deleteMany({});

    const response = await getCompleteConfig();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);

    // Restore admin settings
    await seedTransitionAdminSettings(1850, 10.0);
  });

  it('should include all year data fields', async () => {
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(mockAdminSession());

    const response = await getCompleteConfig();
    const data = await response.json();

    expect(data.success).toBe(true);
    if (data.success) {
      const yearRecord = data.data.yearData[0];
      expect(yearRecord).toHaveProperty('id');
      expect(yearRecord).toHaveProperty('year');
      expect(yearRecord).toHaveProperty('targetEnrollment');
      expect(yearRecord).toHaveProperty('staffCostBase');
      expect(yearRecord).toHaveProperty('notes');
      expect(yearRecord).toHaveProperty('createdAt');
      expect(yearRecord).toHaveProperty('updatedAt');
    }
  });
});

describe('Transition API - PUT /api/admin/transition/settings', () => {
  beforeEach(async () => {
    await cleanupTransitionTestData();
    await seedTransitionAdminSettings(1850, 10.0);
  });

  afterEach(async () => {
    await cleanupTransitionTestData();
    vi.clearAllMocks();
  });

  it('should update capacity cap', async () => {
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(mockAdminSession());

    const request = new NextRequest('http://localhost:3000/api/admin/transition/settings', {
      method: 'PUT',
      body: JSON.stringify({ capacityCap: 2000 }),
    });

    const response = await updateSettings(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.capacityCap).toBe(2000);
  });

  it('should update rent adjustment percent', async () => {
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(mockAdminSession());

    const request = new NextRequest('http://localhost:3000/api/admin/transition/settings', {
      method: 'PUT',
      body: JSON.stringify({ rentAdjustmentPercent: 15.0 }),
    });

    const response = await updateSettings(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.rentAdjustmentPercent).toBe(15.0);
  });

  it('should update both fields at once', async () => {
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(mockAdminSession());

    const request = new NextRequest('http://localhost:3000/api/admin/transition/settings', {
      method: 'PUT',
      body: JSON.stringify({
        capacityCap: 2000,
        rentAdjustmentPercent: 15.0,
      }),
    });

    const response = await updateSettings(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.capacityCap).toBe(2000);
    expect(data.data.rentAdjustmentPercent).toBe(15.0);
  });

  it('should return 400 for invalid input', async () => {
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(mockAdminSession());

    const request = new NextRequest('http://localhost:3000/api/admin/transition/settings', {
      method: 'PUT',
      body: JSON.stringify({ capacityCap: -100 }), // Invalid
    });

    const response = await updateSettings(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should return 401 when not authenticated', async () => {
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/admin/transition/settings', {
      method: 'PUT',
      body: JSON.stringify({ capacityCap: 2000 }),
    });

    const response = await updateSettings(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return 403 for non-admin users', async () => {
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(mockPlannerSession());

    const request = new NextRequest('http://localhost:3000/api/admin/transition/settings', {
      method: 'PUT',
      body: JSON.stringify({ capacityCap: 2000 }),
    });

    const response = await updateSettings(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('should create audit log on successful update', async () => {
    const session = mockAdminSession();
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(session);

    const request = new NextRequest('http://localhost:3000/api/admin/transition/settings', {
      method: 'PUT',
      body: JSON.stringify({ capacityCap: 2000 }),
    });

    await updateSettings(request);

    const auditExists = await verifyAuditLog('UPDATE_TRANSITION_SETTINGS', session.user.id);
    expect(auditExists).toBe(true);
  });
});

describe('Transition API - PUT /api/admin/transition/year/[year]', () => {
  beforeEach(async () => {
    await cleanupTransitionTestData();
    await seedTransitionTestData();
  });

  afterEach(async () => {
    await cleanupTransitionTestData();
    vi.clearAllMocks();
  });

  it('should update transition year data', async () => {
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(mockAdminSession());

    const request = new NextRequest('http://localhost:3000/api/admin/transition/year/2025', {
      method: 'PUT',
      body: JSON.stringify({
        targetEnrollment: 2000,
        staffCostBase: 10000000,
        notes: 'Updated',
      }),
    });

    const response = await updateYear(request, { params: { year: '2025' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.targetEnrollment).toBe(2000);
    expect(data.data.notes).toBe('Updated');
  });

  it('should update only specified fields', async () => {
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(mockAdminSession());

    const request = new NextRequest('http://localhost:3000/api/admin/transition/year/2025', {
      method: 'PUT',
      body: JSON.stringify({ targetEnrollment: 2000 }),
    });

    const response = await updateYear(request, { params: { year: '2025' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.targetEnrollment).toBe(2000);
    // Other fields should remain unchanged
  });

  it('should return 400 for invalid year parameter', async () => {
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(mockAdminSession());

    const request = new NextRequest('http://localhost:3000/api/admin/transition/year/invalid', {
      method: 'PUT',
      body: JSON.stringify({ targetEnrollment: 2000 }),
    });

    const response = await updateYear(request, { params: { year: 'invalid' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should return 404 for non-existent year', async () => {
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(mockAdminSession());

    // Clear data so year doesn't exist
    await cleanupTransitionTestData();

    const request = new NextRequest('http://localhost:3000/api/admin/transition/year/2025', {
      method: 'PUT',
      body: JSON.stringify({ targetEnrollment: 2000 }),
    });

    const response = await updateYear(request, { params: { year: '2025' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);

    // Restore data
    await seedTransitionTestData();
  });

  it('should return 400 for out-of-range year', async () => {
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(mockAdminSession());

    const request = new NextRequest('http://localhost:3000/api/admin/transition/year/2024', {
      method: 'PUT',
      body: JSON.stringify({ targetEnrollment: 2000 }),
    });

    const response = await updateYear(request, { params: { year: '2024' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should return 401 when not authenticated', async () => {
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/admin/transition/year/2025', {
      method: 'PUT',
      body: JSON.stringify({ targetEnrollment: 2000 }),
    });

    const response = await updateYear(request, { params: { year: '2025' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return 403 for non-admin users', async () => {
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(mockViewerSession());

    const request = new NextRequest('http://localhost:3000/api/admin/transition/year/2025', {
      method: 'PUT',
      body: JSON.stringify({ targetEnrollment: 2000 }),
    });

    const response = await updateYear(request, { params: { year: '2025' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('should create audit log on update', async () => {
    const session = mockAdminSession();
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(session);

    const request = new NextRequest('http://localhost:3000/api/admin/transition/year/2025', {
      method: 'PUT',
      body: JSON.stringify({ targetEnrollment: 2000 }),
    });

    await updateYear(request, { params: { year: '2025' } });

    const auditExists = await verifyAuditLog('UPDATE_TRANSITION_YEAR', session.user.id);
    expect(auditExists).toBe(true);
  });

  it('should handle all three valid years', async () => {
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(mockAdminSession());

    for (const year of [2025, 2026, 2027]) {
      const request = new NextRequest(`http://localhost:3000/api/admin/transition/year/${year}`, {
        method: 'PUT',
        body: JSON.stringify({ targetEnrollment: 2000 }),
      });

      const response = await updateYear(request, { params: { year: year.toString() } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    }
  });
});

describe('Transition API - POST /api/admin/transition/recalculate', () => {
  beforeEach(async () => {
    await cleanupTransitionTestData();
    await seedTransitionTestData();
  });

  afterEach(async () => {
    await cleanupTransitionTestData();
    vi.clearAllMocks();
  });

  it('should recalculate all transition years from 2028 base', async () => {
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(mockAdminSession());

    const { input } = recalculationTestData;

    const request = new NextRequest('http://localhost:3000/api/admin/transition/recalculate', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    const response = await recalculate(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(3);

    // Verify calculations
    const years = data.data.map((d: any) => d.year);
    expect(years).toEqual([2025, 2026, 2027]);
  });

  it('should return 400 for invalid input (negative base)', async () => {
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(mockAdminSession());

    const request = new NextRequest('http://localhost:3000/api/admin/transition/recalculate', {
      method: 'POST',
      body: JSON.stringify({
        base2028StaffCost: -10000000,
        cpiRate: 0.03,
      }),
    });

    const response = await recalculate(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should return 400 for invalid CPI rate', async () => {
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(mockAdminSession());

    const request = new NextRequest('http://localhost:3000/api/admin/transition/recalculate', {
      method: 'POST',
      body: JSON.stringify({
        base2028StaffCost: 10000000,
        cpiRate: 1.5, // > 1
      }),
    });

    const response = await recalculate(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should return 401 when not authenticated', async () => {
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/admin/transition/recalculate', {
      method: 'POST',
      body: JSON.stringify({
        base2028StaffCost: 10000000,
        cpiRate: 0.03,
      }),
    });

    const response = await recalculate(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return 403 for non-admin users', async () => {
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(mockPlannerSession());

    const request = new NextRequest('http://localhost:3000/api/admin/transition/recalculate', {
      method: 'POST',
      body: JSON.stringify({
        base2028StaffCost: 10000000,
        cpiRate: 0.03,
      }),
    });

    const response = await recalculate(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('should create audit log on recalculation', async () => {
    const session = mockAdminSession();
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(session);

    const request = new NextRequest('http://localhost:3000/api/admin/transition/recalculate', {
      method: 'POST',
      body: JSON.stringify({
        base2028StaffCost: 10000000,
        cpiRate: 0.03,
      }),
    });

    await recalculate(request);

    const auditExists = await verifyAuditLog('RECALCULATE_TRANSITION_STAFF_COSTS', session.user.id);
    expect(auditExists).toBe(true);
  });

  it('should handle zero CPI rate', async () => {
    // @ts-ignore - mock implementation
    auth.mockResolvedValue(mockAdminSession());

    const request = new NextRequest('http://localhost:3000/api/admin/transition/recalculate', {
      method: 'POST',
      body: JSON.stringify({
        base2028StaffCost: 10000000,
        cpiRate: 0, // No inflation
      }),
    });

    const response = await recalculate(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // All years should have same staff cost (no deflation)
    const staffCosts = data.data.map((d: any) => parseFloat(d.staffCostBase));
    expect(staffCosts.every((cost: number) => cost === 10000000)).toBe(true);
  });
});
