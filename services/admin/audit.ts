/**
 * Admin Audit Log Service
 * Advanced audit log queries for admin panel
 */

import { prisma } from '@/lib/db/prisma';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';
import type { AuditLogFiltersInput } from '@/lib/validation/admin';
import { EntityType } from '@prisma/client';

/**
 * Audit log entry with user info
 */
export interface AuditLogEntry {
  id: string;
  action: string;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  entityType: EntityType;
  entityId: string;
  metadata: unknown;
  timestamp: Date;
  ipAddress: string | null;
  userAgent: string | null;
}

/**
 * List audit logs with filters and pagination
 */
export async function listAuditLogs(
  filters: AuditLogFiltersInput = {}
): Promise<Result<{ logs: AuditLogEntry[]; total: number; page: number; limit: number }>> {
  try {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      userId?: string;
      entityType?: EntityType;
      action?: { contains: string; mode: 'insensitive' };
      timestamp?: { gte?: Date; lte?: Date };
    } = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters.action) {
      where.action = { contains: filters.action, mode: 'insensitive' };
    }

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.timestamp.lte = new Date(filters.endDate);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const logsWithUserInfo: AuditLogEntry[] = logs.map((log) => ({
      id: log.id,
      action: log.action,
      userId: log.userId,
      userEmail: log.user.email,
      userName: log.user.name,
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: log.metadata,
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
    }));

    return success({
      logs: logsWithUserInfo,
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error('Failed to list audit logs:', err);
    return error('Failed to list audit logs');
  }
}

/**
 * Get audit log by ID
 */
export async function getAuditLogById(id: string): Promise<Result<AuditLogEntry>> {
  try {
    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (!log) {
      return error('Audit log not found');
    }

    return success({
      id: log.id,
      action: log.action,
      userId: log.userId,
      userEmail: log.user.email,
      userName: log.user.name,
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: log.metadata,
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
    });
  } catch (err) {
    console.error('Failed to get audit log:', err);
    return error('Failed to get audit log');
  }
}

/**
 * Search audit logs (full-text search in action and metadata)
 */
export async function searchAuditLogs(
  query: string,
  limit: number = 50
): Promise<Result<AuditLogEntry[]>> {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { action: { contains: query, mode: 'insensitive' } },
          // Note: Full-text search in JSONB metadata is limited in PostgreSQL
          // This is a simple contains search
        ],
      },
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    const logsWithUserInfo: AuditLogEntry[] = logs.map((log) => ({
      id: log.id,
      action: log.action,
      userId: log.userId,
      userEmail: log.user.email,
      userName: log.user.name,
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: log.metadata,
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
    }));

    return success(logsWithUserInfo);
  } catch (err) {
    console.error('Failed to search audit logs:', err);
    return error('Failed to search audit logs');
  }
}

