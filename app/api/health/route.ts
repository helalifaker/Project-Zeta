import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * Health Check API
 * Tests database connection and returns system status
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: {
            status: 'connected',
          },
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Service unhealthy',
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          database: {
            status: 'disconnected',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        },
      },
      { status: 503 }
    );
  }
}

