/**
 * Admin Validation Schemas
 * Zod schemas for admin-related inputs
 */

import { z } from 'zod';
import { Role } from '@prisma/client';

/**
 * Admin Settings Update Schema
 * Partial updates allowed - only include fields to update
 */
export const UpdateAdminSettingsSchema = z.object({
  cpiRate: z.number().min(0).max(1).step(0.001).optional(),
  discountRate: z.number().min(0).max(1).step(0.001).optional(),
  taxRate: z.number().min(0).max(1).step(0.001).optional(),
  currency: z.enum(['SAR', 'USD', 'EUR']).optional(),
  timezone: z.string().optional(),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).optional(),
  numberFormat: z.enum(['1,000,000', '1.000.000']).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export type UpdateAdminSettingsInput = z.infer<typeof UpdateAdminSettingsSchema>;

/**
 * Create User Schema
 */
export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  role: z.nativeEnum(Role),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

/**
 * Update User Schema
 * Partial updates allowed - password optional
 */
export const UpdateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long').optional(),
  role: z.nativeEnum(Role).optional(),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

/**
 * Audit Log Filters Schema
 */
export const AuditLogFiltersSchema = z.object({
  page: z.number().int().min(1).default(1).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
  userId: z.string().uuid().optional(),
  entityType: z.enum(['VERSION', 'CURRICULUM', 'RENT', 'CAPEX', 'OPEX', 'USER', 'SETTING', 'REPORT']).optional(),
  action: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type AuditLogFiltersInput = z.infer<typeof AuditLogFiltersSchema>;

/**
 * User List Filters Schema
 */
export const UserListFiltersSchema = z.object({
  page: z.number().int().min(1).default(1).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
  role: z.nativeEnum(Role).optional(),
  search: z.string().optional(),
});

export type UserListFiltersInput = z.infer<typeof UserListFiltersSchema>;

