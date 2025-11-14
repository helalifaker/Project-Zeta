/**
 * Error Handling Utilities
 * Centralized error handling for API routes and services
 */

import { Prisma } from '@prisma/client';
import { Result, error } from '@/types/result';

/**
 * Check if error is a database timeout
 */
export function isDatabaseTimeout(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P1008: Operations timed out
    return err.code === 'P1008';
  }
  if (err instanceof Error) {
    const message = err.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('network') ||
      message.includes('econnrefused') ||
      message.includes('etimedout')
    );
  }
  return false;
}

/**
 * Check if error is a database connection error
 */
export function isDatabaseConnectionError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P1001: Can't reach database server
    // P1002: Database server doesn't exist
    return err.code === 'P1001' || err.code === 'P1002';
  }
  if (err instanceof Error) {
    const message = err.message.toLowerCase();
    return (
      message.includes('connection') ||
      message.includes('connect') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    );
  }
  return false;
}

/**
 * Check if error is a unique constraint violation
 */
export function isUniqueConstraintError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return err.code === 'P2002';
  }
  return false;
}

/**
 * Check if error is a record not found
 */
export function isRecordNotFoundError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return err.code === 'P2025';
  }
  return false;
}

/**
 * Check if error is a foreign key constraint violation
 */
export function isForeignKeyError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return err.code === 'P2003';
  }
  return false;
}

/**
 * Handle database errors and return user-friendly messages
 */
export function handleDatabaseError(err: unknown): Result<never> {
  if (isDatabaseTimeout(err)) {
    return error(
      'Database operation timed out. Please try again in a moment.',
      'DATABASE_TIMEOUT'
    );
  }

  if (isDatabaseConnectionError(err)) {
    return error(
      'Unable to connect to database. Please try again later.',
      'DATABASE_CONNECTION_ERROR'
    );
  }

  if (isUniqueConstraintError(err)) {
    return error(
      'A record with this information already exists.',
      'DUPLICATE_ERROR'
    );
  }

  if (isRecordNotFoundError(err)) {
    return error('Record not found.', 'NOT_FOUND');
  }

  if (isForeignKeyError(err)) {
    return error(
      'Cannot perform this operation due to related records.',
      'FOREIGN_KEY_ERROR'
    );
  }

  // Generic database error
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    console.error('Prisma error:', err.code, err.message);
    return error('Database operation failed.', 'DATABASE_ERROR');
  }

  // Unknown error
  console.error('Unknown error:', err);
  return error('An unexpected error occurred.', 'INTERNAL_ERROR');
}

/**
 * Handle network errors
 */
export function handleNetworkError(err: unknown): Result<never> {
  if (err instanceof Error) {
    const message = err.message.toLowerCase();
    if (message.includes('fetch') || message.includes('network')) {
      return error(
        'Network error. Please check your connection and try again.',
        'NETWORK_ERROR'
      );
    }
  }
  return handleDatabaseError(err);
}

/**
 * Get user-friendly error message from validation error
 */
export function getValidationErrorMessage(
  field: string,
  issue: { message: string; code: string }
): string {
  const fieldName = field
    .split('.')
    .pop()
    ?.replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase() || field;

  switch (issue.code) {
    case 'too_small':
      return `${fieldName} is too small. ${issue.message}`;
    case 'too_big':
      return `${fieldName} is too large. ${issue.message}`;
    case 'invalid_type':
      return `${fieldName} has an invalid type. ${issue.message}`;
    case 'invalid_string':
      return `${fieldName} is invalid. ${issue.message}`;
    case 'invalid_number':
      return `${fieldName} must be a valid number. ${issue.message}`;
    default:
      return issue.message || `${fieldName} is invalid`;
  }
}

