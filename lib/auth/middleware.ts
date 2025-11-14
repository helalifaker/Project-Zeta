/**
 * Authentication Middleware
 * Role-based access control helpers
 */

import type { Role } from '@prisma/client';
import { auth } from './config';
import { error } from '@/types/result';
import type { Result } from '@/types/result';

/**
 * Get current session (server-side)
 */
export async function getSession() {
  return await auth();
}

/**
 * Require authentication
 * Returns error if user is not authenticated
 */
export async function requireAuth(): Promise<
  Result<{ id: string; email: string; role: Role }>
> {
  const session = await getSession();

  if (!session?.user) {
    return error('Unauthorized', 'UNAUTHORIZED');
  }

  return {
    success: true,
    data: {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    },
  };
}

/**
 * Require specific role(s)
 * Returns error if user doesn't have required role
 */
export async function requireRole(
  allowedRoles: Role[]
): Promise<Result<{ id: string; email: string; role: Role }>> {
  const authResult = await requireAuth();

  if (!authResult.success) {
    return authResult;
  }

  const user = authResult.data;

  if (!allowedRoles.includes(user.role)) {
    return error('Forbidden', 'FORBIDDEN');
  }

  return { success: true, data: user };
}

/**
 * Check if user has specific role
 */
export async function hasRole(role: Role): Promise<boolean> {
  const session = await getSession();
  return session?.user?.role === role;
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('ADMIN');
}

/**
 * Check if user is planner or admin
 */
export async function canEdit(): Promise<boolean> {
  const session = await getSession();
  const role = session?.user?.role;
  return role === 'ADMIN' || role === 'PLANNER';
}

