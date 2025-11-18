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
    const overallStartTime = Date.now();

    // Test database connection with timeout protection
    let dbStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
    let dbResponseTime = 0;

    try {
      // Use Promise.race with timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database health check timeout')), 5000);
      });
      
      // Measure ONLY query time (not connection establishment)
      // Run query twice: first to warm connection, second to measure actual query time
      const warmupStart = Date.now();
      try {
        await Promise.race([
          prisma.$queryRaw`SELECT 1 as warmup`,
          timeoutPromise
        ]);
      } catch {
        // Ignore warmup errors
      }
      const warmupTime = Date.now() - warmupStart;
      
      // Now measure actual query performance (should use warm connection)
      const queryStartTime = Date.now();
      await Promise.race([
        prisma.$queryRaw`SELECT 1 as health_check`,
        timeoutPromise
      ]);
      dbResponseTime = Date.now() - queryStartTime;
      
      // Realistic thresholds based on diagnostic findings
      // Root cause: Network latency to Supabase (ap-southeast-2 region)
      // Expected latency: 1100-1500ms for cross-region connections
      // Query execution itself is fast (< 50ms), but network adds 1000-1500ms
      // 
      // Thresholds adjusted for geographic distance:
      // Healthy: < 2000ms (acceptable for cross-region cloud DB)
      // Degraded: 2000ms - 3000ms (slow, may indicate network issues)
      // Down: > 3000ms or timeout (unacceptable)
      //
      // Note: To improve, change Supabase region to be closer to users
      if (dbResponseTime > 3000) {
        console.error(`❌ Database query time too high: ${dbResponseTime}ms (warmup: ${warmupTime}ms)`);
        dbStatus = 'down';
      } else if (dbResponseTime > 2000) {
        console.warn(`⚠️ Database query time: ${dbResponseTime}ms (warmup: ${warmupTime}ms) - consider changing Supabase region`);
        dbStatus = 'degraded';
      } else {
        // Healthy: < 2000ms (acceptable for cross-region cloud database)
        // This accounts for network latency to Supabase (ap-southeast-2)
        dbStatus = 'healthy';
      }
    } catch (err) {
      dbStatus = 'down';
      dbResponseTime = Date.now() - overallStartTime;
      if (err instanceof Error && err.message.includes('timeout')) {
        console.error(`❌ Database health check timed out after ${dbResponseTime}ms`);
      } else {
        console.error('Database health check failed:', err);
      }
    }

    // Get all counts in parallel (optimized)
    const countsStartTime = Date.now();
    const [
      totalUsers,
      active24h,
      active7d,
      totalVersions,
      draftVersions,
      readyVersions,
      approvedVersions,
      lockedVersions,
      totalReports,
      expiredReports,
    ] = await Promise.all([
      prisma.users.count(),
      prisma.users.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.users.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.versions.count(),
      prisma.versions.count({ where: { status: 'DRAFT' } }),
      prisma.versions.count({ where: { status: 'READY' } }),
      prisma.versions.count({ where: { status: 'APPROVED' } }),
      prisma.versions.count({ where: { status: 'LOCKED' } }),
      prisma.reports.count(),
      prisma.reports.count({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      }),
    ]);
    
    const countsTime = Date.now() - countsStartTime;
    const totalTime = Date.now() - overallStartTime;
    
    if (totalTime > 1000) {
      console.warn(`⚠️ System health check took ${totalTime}ms (db: ${dbResponseTime}ms, counts: ${countsTime}ms)`);
    }

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
      users: await prisma.users.count(),
      versions: await prisma.versions.count(),
      curriculumPlans: await prisma.curriculum_plans.count(),
      rentPlans: await prisma.rent_plans.count(),
      capexItems: await prisma.capex_items.count(),
      opexSubAccounts: await prisma.opex_sub_accounts.count(),
      auditLogs: await prisma.audit_logs.count(),
      reports: await prisma.reports.count(),
      adminSettings: await prisma.admin_settings.count(),
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
    const count = await prisma.users.count({
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

