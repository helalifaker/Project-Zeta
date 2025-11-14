/**
 * User Management Service
 * CRUD operations for user management (ADMIN only)
 */

import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import type { Result } from '@/types/result';
import { success, error } from '@/types/result';
import { logAudit } from '@/services/audit';
import bcrypt from 'bcryptjs';
import type { CreateUserInput, UpdateUserInput, UserListFiltersInput } from '@/lib/validation/admin';
import type { Role } from '@prisma/client';

/**
 * User with metadata
 */
export interface UserWithMetadata {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: Date;
  lastLoginAt: Date | null;
  versionsCount?: number;
}

/**
 * List users with filters and pagination
 */
export async function listUsers(
  filters: UserListFiltersInput = {},
  _adminId: string
): Promise<Result<{ users: UserWithMetadata[]; total: number; page: number; limit: number }>> {
  try {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      role?: Role;
      OR?: Array<{ email?: { contains: string; mode: 'insensitive' }; name?: { contains: string; mode: 'insensitive' } }>;
    } = {};

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: { versions: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const usersWithMetadata: UserWithMetadata[] = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      versionsCount: user._count.versions,
    }));

    return success({
      users: usersWithMetadata,
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error('Failed to list users:', err);
    return error('Failed to list users');
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<Result<UserWithMetadata>> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: { versions: true },
        },
      },
    });

    if (!user) {
      return error('User not found');
    }

    return success({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      versionsCount: user._count.versions,
    });
  } catch (err) {
    console.error('Failed to get user:', err);
    return error('Failed to get user');
  }
}

/**
 * Create new user
 */
export async function createUser(
  data: CreateUserInput,
  adminId: string
): Promise<Result<UserWithMetadata>> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: { versions: true },
        },
      },
    });

    // Audit log
    await logAudit({
      action: 'CREATE_USER',
      userId: adminId,
      entityType: 'USER',
      entityId: user.id,
      metadata: {
        email: user.email,
        role: user.role,
      },
    });

    return success({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      versionsCount: user._count.versions,
    });
  } catch (err) {
    console.error('Failed to create user:', err);
    return error('Failed to create user');
  }
}

/**
 * Update user
 */
export async function updateUser(
  userId: string,
  data: UpdateUserInput,
  adminId: string
): Promise<Result<UserWithMetadata>> {
  try {
    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return error('User not found');
    }

    // Prepare update data
    const updateData: {
      name?: string;
      role?: Role;
      email?: string;
      password?: string;
    } = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.role !== undefined) {
      updateData.role = data.role;
    }
    if (data.email !== undefined) {
      // Check if email is already taken
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (emailExists && emailExists.id !== userId) {
        return error('Email already in use');
      }
      updateData.email = data.email;
    }
    if (data.password !== undefined) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: { versions: true },
        },
      },
    });

    // Audit log (especially for role changes)
    const metadata: Record<string, unknown> = {};
    if (data.role !== undefined && data.role !== currentUser.role) {
      metadata.oldRole = currentUser.role;
      metadata.newRole = data.role;
    }
    if (data.email !== undefined && data.email !== currentUser.email) {
      metadata.oldEmail = currentUser.email;
      metadata.newEmail = data.email;
    }

    await logAudit({
      action: 'UPDATE_USER',
      userId: adminId,
      entityType: 'USER',
      entityId: user.id,
      metadata: (Object.keys(metadata).length > 0 ? metadata : { updated: Object.keys(updateData) }) as Prisma.InputJsonValue,
    });

    return success({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      versionsCount: user._count.versions,
    });
  } catch (err) {
    console.error('Failed to update user:', err);
    return error('Failed to update user');
  }
}

/**
 * Delete user (soft delete - preserve audit logs)
 */
export async function deleteUser(userId: string, adminId: string): Promise<Result<void>> {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return error('User not found');
    }

    // Prevent deleting yourself
    if (userId === adminId) {
      return error('Cannot delete your own account');
    }

    // Delete user (cascade will handle related data)
    await prisma.user.delete({
      where: { id: userId },
    });

    // Audit log
    await logAudit({
      action: 'DELETE_USER',
      userId: adminId,
      entityType: 'USER',
      entityId: userId,
      metadata: {
        email: user.email,
        role: user.role,
      },
    });

    return success(undefined);
  } catch (err) {
    console.error('Failed to delete user:', err);
    return error('Failed to delete user');
  }
}

