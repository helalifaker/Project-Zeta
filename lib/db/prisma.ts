/**
 * Prisma Client Singleton
 * Prevents multiple instances in development (hot reload)
 * Optimized for connection pooling with Supabase pgBouncer
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaWarmed: boolean | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn'] // Reduced logging for performance
        : ['error'],
    // Connection pool optimization for Supabase pgBouncer
    // When DATABASE_URL includes ?pgbouncer=true, Prisma automatically uses connection pooling
    // These settings help ensure connections are reused efficiently
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Warm up connection pool on first import (non-blocking)
// This helps reduce cold connection latency
// Skip warmup in Edge Runtime (middleware) - Prisma cannot run in Edge Runtime
const isEdgeRuntime = 
  typeof EdgeRuntime !== 'undefined' || 
  process.env.NEXT_RUNTIME === 'edge' ||
  (typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge');

if (!globalForPrisma.prismaWarmed && typeof window === 'undefined' && !isEdgeRuntime) {
  globalForPrisma.prismaWarmed = true;
  
  // Warm up connection asynchronously (don't block app startup)
  // Wrap in try-catch to handle Edge Runtime errors gracefully
  try {
    prisma.$queryRaw`SELECT 1 as warmup`
      .then(() => {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Database connection pool warmed up');
        }
      })
      .catch((error: unknown) => {
        // Silently fail - connection will be established on first real query
        // This catches Edge Runtime errors and other connection issues
        if (process.env.NODE_ENV === 'development' && error instanceof Error) {
          if (!error.message.includes('Edge Runtime')) {
            // Only log non-Edge Runtime errors
            console.warn('⚠️ Prisma warmup failed (non-critical):', error.message);
          }
        }
      });
  } catch (error: unknown) {
    // Catch synchronous errors (e.g., PrismaClient instantiation in Edge Runtime)
    if (process.env.NODE_ENV === 'development' && error instanceof Error) {
      if (!error.message.includes('Edge Runtime')) {
        console.warn('⚠️ Prisma warmup skipped (Edge Runtime detected)');
      }
    }
  }
}

