/**
 * Database Connection Test Utility
 * Tests if the database is accessible
 */

import { prisma } from './prisma';

/**
 * Test database connection
 * @returns true if connection is successful, false otherwise
 */
export async function testDatabaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`;
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Database connection test failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

