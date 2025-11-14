/**
 * System Health Service
 * Monitor system health and performance metrics
 */

import { prisma } from '@/lib/db/prisma';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';

/**
 * System health metrics
 */
export interface SystemHealth {
  database: {
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number; // milliseconds
    connectionCount?: number;
  };
  users: {
    total: number;
    active24h: number;
    active7d: number;
  };
  versions: {
    total: number;
    draft: number;
    ready: number;
    approved: number;
    locked: number;
  };
  reports: {
    total: number;
    expired: number;
  };
  timestamp: Date;
}

/**
 * Get system health metrics
 */
export async function getSystemHealth(): Promise<Result<SystemHealth>> {
  try {
    const startTime = Date.now();

    // Test database connection
    let dbStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
    let dbResponseTime = 0;

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - startTime;
      
      if (dbResponseTime > 1000) {
        dbStatus = 'degraded';
      }
    } catch (err) {
      dbStatus = 'down';
      dbResponseTime = Date.now() - startTime;
      console.error('Database health check failed:', err);
    }

    // Get user counts
    const [totalUsers, active24h, active7d] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Get version counts
    const [totalVersions, draftVersions, readyVersions, approvedVersions, lockedVersions] = await Promise.all([
      prisma.version.count(),
      prisma.version.count({ where: { status: 'DRAFT' } }),
      prisma.version.count({ where: { status: 'READY' } }),
      prisma.version.count({ where: { status: 'APPROVED' } }),
      prisma.version.count({ where: { status: 'LOCKED' } }),
    ]);

    // Get report counts
    const [totalReports, expiredReports] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      }),
    ]);

    return success({
      database: {
        status: dbStatus,
        responseTime: dbResponseTime,
      },
      users: {
        total: totalUsers,
        active24h,
        active7d,
      },
      versions: {
        total: totalVersions,
        draft: draftVersions,
        ready: readyVersions,
        approved: approvedVersions,
        locked: lockedVersions,
      },
      reports: {
        total: totalReports,
        expired: expiredReports,
      },
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('Failed to get system health:', err);
    return error('Failed to get system health');
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<Result<{
  tableCounts: Record<string, number>;
  totalSize?: string;
}>> {
  try {
    // Get table counts
    const tableCounts: Record<string, number> = {
      users: await prisma.user.count(),
      versions: await prisma.version.count(),
      curriculumPlans: await prisma.curriculumPlan.count(),
      rentPlans: await prisma.rentPlan.count(),
      capexItems: await prisma.capexItem.count(),
      opexSubAccounts: await prisma.opexSubAccount.count(),
      auditLogs: await prisma.auditLog.count(),
      reports: await prisma.report.count(),
      adminSettings: await prisma.adminSetting.count(),
    };

    // Get database size (PostgreSQL specific)
    let totalSize: string | undefined;
    try {
      const result = await prisma.$queryRaw<Array<{ size: string }>>`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `;
      if (result && result[0]) {
        totalSize = result[0].size;
      }
    } catch (err) {
      // Database size query may not work in all environments
      console.warn('Could not fetch database size:', err);
    }

    return success({
      tableCounts,
      ...(totalSize && { totalSize }),
    });
  } catch (err) {
    console.error('Failed to get database stats:', err);
    return error('Failed to get database stats');
  }
}

/**
 * Get active users count (last 24 hours)
 */
export async function getActiveUsersCount(): Promise<Result<number>> {
  try {
    const count = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    return success(count);
  } catch (err) {
    console.error('Failed to get active users count:', err);
    return error('Failed to get active users count');
  }
}

