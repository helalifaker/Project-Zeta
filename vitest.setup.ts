/**
 * Vitest Setup File
 *
 * Runs BEFORE all test code and imports to ensure environment variables
 * are loaded before Prisma client initialization.
 *
 * This prevents PrismaClientInitializationError when DATABASE_URL is not found.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import '@testing-library/jest-dom/vitest';

// Load environment variables from .env.local using absolute path
const envPath = resolve(process.cwd(), '.env.local');

const result = config({ path: envPath });

if (result.error) {
  // Warn but don't fail - some tests might not need database
  console.warn(`⚠️  Warning: Could not load .env.local: ${result.error.message}`);
  console.warn('⚠️  Tests requiring DATABASE_URL may fail.');
} else {
  // Verify DATABASE_URL was loaded
  if (process.env.DATABASE_URL) {
    console.log('✅ Environment variables loaded from .env.local');
  } else {
    console.warn('⚠️  Warning: DATABASE_URL not found in .env.local');
  }
}

