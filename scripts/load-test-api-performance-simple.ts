/**
 * Simplified Load Testing Script - Uses Direct Database Access
 * 
 * This version bypasses authentication by using Prisma directly
 * to test the database query performance, which is the main concern.
 * 
 * Run: npx tsx scripts/load-test-api-performance-simple.ts
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { prisma } from '../lib/db/prisma';

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'admin@company.com';

interface PerformanceMetrics {
  operation: string;
  requests: number;
  successes: number;
  failures: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  target: number;
  targetMet: boolean;
}

/**
 * Calculate percentile from sorted array
 */
function percentile(sortedArray: number[], p: number): number {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, index)] || 0;
}

/**
 * Test database query performance (simulates what API endpoints do)
 */
async function testDatabaseQuery(
  name: string,
  queryFn: () => Promise<unknown>,
  target: number,
  iterations: number = 50
): Promise<PerformanceMetrics> {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   Iterations: ${iterations}`);
  console.log(`   Target: <${target}ms (p95)`);

  const durations: number[] = [];
  let successes = 0;
  let failures = 0;

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      await queryFn();
      const duration = performance.now() - start;
      durations.push(duration);
      successes++;
    } catch (error) {
      const duration = performance.now() - start;
      durations.push(duration);
      failures++;
      if (i === 0) {
        console.error(`   Error on first attempt:`, error);
      }
    }
  }

  const sorted = durations.sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = sum / sorted.length;

  return {
    operation: name,
    requests: iterations,
    successes,
    failures,
    min: sorted[0] || 0,
    max: sorted[sorted.length - 1] || 0,
    avg,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    target,
    targetMet: percentile(sorted, 95) < target,
  };
}

/**
 * Print metrics
 */
function printMetrics(metrics: PerformanceMetrics): void {
  const status = metrics.targetMet ? '✅ PASS' : '❌ FAIL';
  const icon = metrics.targetMet ? '✅' : '❌';

  console.log('\n' + '='.repeat(70));
  console.log(`📊 ${metrics.operation}`);
  console.log('='.repeat(70));
  console.log(`Total Requests:      ${metrics.requests}`);
  console.log(`Successes:           ${metrics.successes} (${((metrics.successes / metrics.requests) * 100).toFixed(1)}%)`);
  console.log(`Failures:            ${metrics.failures} (${((metrics.failures / metrics.requests) * 100).toFixed(1)}%)`);
  console.log('');
  console.log('Response Times (ms):');
  console.log(`  Min:                ${metrics.min.toFixed(2)}`);
  console.log(`  Max:                ${metrics.max.toFixed(2)}`);
  console.log(`  Average:            ${metrics.avg.toFixed(2)}`);
  console.log(`  Median (p50):       ${metrics.p50.toFixed(2)}`);
  console.log(`  95th percentile:    ${metrics.p95.toFixed(2)}`);
  console.log(`  99th percentile:    ${metrics.p99.toFixed(2)}`);
  console.log('');
  console.log(`Target (p95):         <${metrics.target}ms`);
  console.log(`Status:               ${icon} ${status}`);
  console.log('='.repeat(70));
}

/**
 * Main test function
 */
async function main(): Promise<void> {
  console.log('🚀 Starting Database Performance Test');
  console.log('='.repeat(70));
  console.log('This test measures database query performance directly');
  console.log('(simulating what the API endpoints do)');
  console.log('='.repeat(70));

  // Get a test version ID
  const testVersion = await prisma.versions.findFirst({
    select: { id: true, name: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!testVersion) {
    console.error('\n❌ No versions found in database.');
    console.error('   Please create at least one version before running tests.');
    process.exit(1);
  }

  console.log(`\n✅ Using version: ${testVersion.name} (${testVersion.id.substring(0, 8)}...)`);

  const allMetrics: PerformanceMetrics[] = [];

  // Get a test user ID for filtering (simulates actual API behavior)
  const testUser = await prisma.users.findFirst({
    where: { email: TEST_USER_EMAIL || 'admin@company.com' },
    select: { id: true },
  });

  if (!testUser) {
    console.error('\n❌ Test user not found in database.');
    console.error('   Please ensure test user exists or run: npx prisma db seed');
    process.exit(1);
  }

  // Test 1: List versions (simulates GET /api/versions with createdBy filter)
  const versionsMetrics = await testDatabaseQuery(
    'GET /api/versions (database query with createdBy filter)',
    async () => {
      await prisma.versions.findMany({
        where: {
          createdBy: testUser.id, // Filter by user (uses index)
        },
        select: {
          id: true,
          name: true,
          status: true,
          mode: true,
          createdAt: true,
          updatedAt: true,
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    },
    100, // Target: <100ms
    50
  );
  allMetrics.push(versionsMetrics);
  printMetrics(versionsMetrics);

  // Test 2: Get version detail (simulates GET /api/versions/[id])
  const versionDetailMetrics = await testDatabaseQuery(
    'GET /api/versions/[id] (database query)',
    async () => {
      await prisma.versions.findUnique({
        where: { id: testVersion.id },
        include: {
          curriculum_plans: true,
          rent_plans: true,
        },
      });
    },
    1000, // Target: <1000ms
    50
  );
  allMetrics.push(versionDetailMetrics);
  printMetrics(versionDetailMetrics);

  // Test 3: Get admin settings (simulates GET /api/admin/settings)
  const adminSettingsMetrics = await testDatabaseQuery(
    'GET /api/admin/settings (database query)',
    async () => {
      await prisma.admin_settings.findMany({
        select: {
          id: true,
          key: true,
          value: true,
        },
        take: 10, // Get first 10 settings
      });
    },
    100, // Target: <100ms
    50
  );
  allMetrics.push(adminSettingsMetrics);
  printMetrics(adminSettingsMetrics);

  // Summary
  console.log('\n\n' + '='.repeat(70));
  console.log('📈 PERFORMANCE TEST SUMMARY');
  console.log('='.repeat(70));

  let allTargetsMet = true;

  for (const metrics of allMetrics) {
    const status = metrics.targetMet ? '✅ PASS' : '❌ FAIL';
    const icon = metrics.targetMet ? '✅' : '❌';
    console.log(`${icon} ${metrics.operation.padEnd(45)} p95: ${metrics.p95.toFixed(2).padStart(8)}ms / target: <${metrics.target}ms ${status}`);
    if (!metrics.targetMet) {
      allTargetsMet = false;
    }
  }

  console.log('='.repeat(70));

  if (allTargetsMet) {
    console.log('\n✅ SUCCESS: All database query performance targets met!');
    console.log('   Note: This tests database queries only.');
    console.log('   For full API testing (including auth overhead),');
    console.log('   use: npm run test:load (requires authentication setup)');
  } else {
    console.log('\n⚠️  WARNING: Some performance targets not met.');
    console.log('   Review the detailed metrics above.');
  }

  await prisma.$disconnect();
  process.exit(allTargetsMet ? 0 : 1);
}

main().catch((error) => {
  console.error('\n❌ Fatal error during testing:', error);
  process.exit(1);
});

