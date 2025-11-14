/**
 * Audit Logging Service
 * Logs all financial mutations and important actions
 */

import { prisma } from '@/lib/db/prisma';
import { EntityType, Prisma } from '@prisma/client';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';

export interface AuditLogEntry {
  action: string;
  userId: string;
  entityType: EntityType;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit entry
 * MANDATORY for all financial mutations per .cursorrules
 */
export async function logAudit(entry: AuditLogEntry): Promise<Result<void>> {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        userId: entry.userId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: (entry.metadata || {}) as Prisma.InputJsonValue,
        ...(entry.ipAddress !== undefined && { ipAddress: entry.ipAddress }),
        ...(entry.userAgent !== undefined && { userAgent: entry.userAgent }),
      },
    });

    return success(undefined);
  } catch (err) {
    console.error('Failed to create audit log:', err);
    // Don't fail the operation if audit logging fails
    // But log the error for monitoring
    return error('Audit logging failed');
  }
}

/**
 * Get audit logs for an entity
 */
export async function getAuditLogs(
  entityType: EntityType,
  entityId: string,
  limit: number = 50
): Promise<Result<Array<{
  id: string;
  action: string;
  userId: string;
  timestamp: Date;
  metadata: unknown;
}>>> {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
      select: {
        id: true,
        action: true,
        userId: true,
        timestamp: true,
        metadata: true,
      },
    });

    return success(logs);
  } catch (err) {
    console.error('Failed to fetch audit logs:', err);
    return error('Failed to fetch audit logs');
  }
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 50
): Promise<Result<Array<{
  id: string;
  action: string;
  entityType: EntityType;
  entityId: string;
  timestamp: Date;
  metadata: unknown;
}>>> {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        userId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        timestamp: true,
        metadata: true,
      },
    });

    return success(logs);
  } catch (err) {
    console.error('Failed to fetch user audit logs:', err);
    return error('Failed to fetch user audit logs');
  }
}

