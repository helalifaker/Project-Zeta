/**
 * Load Testing Script for API Performance
 * 
 * Purpose: Verify performance improvements for Phase 0.2 optimizations
 * Tests:
 * 1. GET /api/versions/[id] (target: <1000ms, was 3,822ms)
 * 2. GET /api/versions (target: <100ms, was 1,066ms)
 * 3. GET /api/admin/settings (target: <100ms, was 1,045ms)
 * 
 * Run: npx tsx scripts/load-test-api-performance.ts
 * 
 * Requirements:
 * - Dev server running on http://localhost:3000
 * - Test user in database (admin@company.com or create one)
 * - .env.local file with DATABASE_URL
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { prisma } from '../lib/db/prisma';

interface PerformanceMetrics {
  endpoint: string;
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
  responseTimes: number[];
}

interface TestResult {
  success: boolean;
  duration: number;
  status: number;
  error?: string;
}

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'admin@company.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'admin123';

// Performance targets from TODO.md
const TARGETS: Record<string, number> = {
  '/api/versions/[id]': 1000, // <1000ms (was 3,822ms)
  '/api/versions': 100, // <100ms (was 1,066ms)
  '/api/admin/settings': 100, // <100ms (was 1,045ms)
};

/**
 * Check if dev server is running
 */
async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Sign in and get session cookie
 * NextAuth v5 uses CSRF token and form-based authentication
 */
async function getSessionCookie(): Promise<string | null> {
  try {
    // First check if server is running
    const serverHealthy = await checkServerHealth();
    if (!serverHealthy) {
      console.error(`❌ Dev server is not running or not accessible at ${BASE_URL}`);
      console.error('   Please start the dev server first: npm run dev');
      return null;
    }

    // Step 1: Get CSRF token from the CSRF endpoint
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    });

    if (!csrfResponse.ok) {
      console.error('❌ Failed to get CSRF token:', csrfResponse.status);
      return null;
    }

    const csrfData = await csrfResponse.json().catch(() => null);
    const csrfToken = csrfData?.csrfToken || null;

    if (!csrfToken) {
      console.error('❌ Could not extract CSRF token from response');
      return null;
    }

    // Step 2: Sign in with credentials (NextAuth v5 expects form data)
    const formData = new URLSearchParams();
    formData.append('email', TEST_USER_EMAIL);
    formData.append('password', TEST_USER_PASSWORD);
    formData.append('csrfToken', csrfToken);
    formData.append('callbackUrl', '/dashboard');
    formData.append('json', 'true'); // Request JSON response

    const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      redirect: 'manual', // Don't follow redirects
      signal: AbortSignal.timeout(10000),
    });

    // Check all Set-Cookie headers
    const setCookieHeaders = response.headers.getSetCookie();
    
    // Extract session token from cookies
    for (const cookie of setCookieHeaders) {
      // NextAuth v5 might use different cookie names
      const match = cookie.match(/(?:authjs\.session-token|next-auth\.session-token|__Secure-authjs\.session-token)=([^;]+)/);
      if (match) {
        return match[1];
      }
    }

    // If no cookie in Set-Cookie, check response body for error
    if (response.status !== 200 && response.status !== 302) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('❌ Authentication failed');
      console.error('   Status:', response.status);
      console.error('   Response:', errorText.substring(0, 200));
      
      // Check if it's a redirect to signin page (common for auth failures)
      const location = response.headers.get('location');
      if (location?.includes('signin')) {
        console.error('\n   This usually means:');
        console.error('   - Invalid email or password');
        console.error('   - User does not exist in database');
        console.error(`   - Password mismatch for: ${TEST_USER_EMAIL}`);
      }
      return null;
    }

    // If we got a redirect (302), it might be successful but we need to follow it
    if (response.status === 302) {
      const location = response.headers.get('location');
      if (location?.includes('error')) {
        console.error('❌ Authentication error in redirect');
        console.error('   Location:', location);
        return null;
      }
      
      // Try to get cookies from the redirect response
      // Sometimes cookies are set on redirect
      for (const cookie of setCookieHeaders) {
        const match = cookie.match(/(?:authjs\.session-token|next-auth\.session-token|__Secure-authjs\.session-token)=([^;]+)/);
        if (match) {
          return match[1];
        }
      }
    }

    console.error('❌ No session cookie received');
    console.error('   Response status:', response.status);
    console.error('   Cookies received:', setCookieHeaders.length);
    console.error('\n   Troubleshooting:');
    console.error('   1. Verify user exists in database');
    console.error('   2. Check password is correct');
    console.error('   3. Try signing in via browser first to verify credentials');
    return null;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('❌ Request timed out. Is the dev server running?');
      console.error(`   Expected server at: ${BASE_URL}`);
    } else {
      console.error('❌ Error signing in:', error);
    }
    return null;
  }
}

/**
 * Make a single API request
 */
async function makeRequest(
  url: string,
  sessionCookie: string,
  method: string = 'GET'
): Promise<TestResult> {
  const startTime = performance.now();

  try {
    // Try multiple cookie name formats (NextAuth v5 might use different names)
    const cookieHeaders = [
      `authjs.session-token=${sessionCookie}`,
      `next-auth.session-token=${sessionCookie}`,
      `__Secure-authjs.session-token=${sessionCookie}`,
    ].join('; ');

    const response = await fetch(url, {
      method,
      headers: {
        'Cookie': cookieHeaders,
        'Content-Type': 'application/json',
      },
    });

    const duration = performance.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        duration,
        status: response.status,
        error: `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      duration,
      status: response.status,
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    return {
      success: false,
      duration,
      status: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
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
 * Calculate performance metrics
 */
function calculateMetrics(
  endpoint: string,
  results: TestResult[]
): PerformanceMetrics {
  const responseTimes = results.map((r) => r.duration).sort((a, b) => a - b);
  const successes = results.filter((r) => r.success).length;
  const failures = results.length - successes;

  const sum = responseTimes.reduce((a, b) => a + b, 0);
  const avg = sum / responseTimes.length;

  return {
    endpoint,
    requests: results.length,
    successes,
    failures,
    min: responseTimes[0] || 0,
    max: responseTimes[responseTimes.length - 1] || 0,
    avg,
    p50: percentile(responseTimes, 50),
    p95: percentile(responseTimes, 95),
    p99: percentile(responseTimes, 99),
    target: TARGETS[endpoint] || 0,
    targetMet: percentile(responseTimes, 95) < (TARGETS[endpoint] || Infinity),
    responseTimes,
  };
}

/**
 * Run load test for a single endpoint
 */
async function testEndpoint(
  endpoint: string,
  sessionCookie: string,
  concurrent: number = 10,
  iterations: number = 20
): Promise<PerformanceMetrics> {
  console.log(`\n🧪 Testing ${endpoint}`);
  console.log(`   Concurrent requests: ${concurrent}`);
  console.log(`   Total requests: ${concurrent * iterations}`);

  const allResults: TestResult[] = [];

  // Run in batches
  for (let i = 0; i < iterations; i++) {
    // All requests use the same URL (endpoint already has version ID if needed)
    const url = `${BASE_URL}${endpoint}`;
    const urls = Array.from({ length: concurrent }, () => url);

    // Make concurrent requests
    const results = await Promise.all(
      urls.map((url) => makeRequest(url, sessionCookie))
    );

    allResults.push(...results);

    // Small delay between batches to avoid overwhelming the server
    if (i < iterations - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return calculateMetrics(endpoint, allResults);
}

/**
 * Print metrics in a formatted table
 */
function printMetrics(metrics: PerformanceMetrics): void {
  const targetStatus = metrics.targetMet ? '✅ PASS' : '❌ FAIL';
  const targetColor = metrics.targetMet ? '✅' : '❌';

  console.log('\n' + '='.repeat(70));
  console.log(`📊 ${metrics.endpoint}`);
  console.log('='.repeat(70));
  console.log(`Total Requests:      ${metrics.requests}`);
  console.log(`Successes:            ${metrics.successes} (${((metrics.successes / metrics.requests) * 100).toFixed(1)}%)`);
  console.log(`Failures:             ${metrics.failures} (${((metrics.failures / metrics.requests) * 100).toFixed(1)}%)`);
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
  console.log(`Status:               ${targetColor} ${targetStatus}`);
  console.log('='.repeat(70));
}

/**
 * Main test function
 */
async function main(): Promise<void> {
  console.log('🚀 Starting API Performance Load Test');
  console.log('='.repeat(70));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test User: ${TEST_USER_EMAIL}`);
  console.log('='.repeat(70));

  // Step 0: Check if server is running
  console.log('\n0️⃣ Checking server health...');
  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    console.error('\n❌ Dev server is not running or not accessible.');
    console.error(`   Expected server at: ${BASE_URL}`);
    console.error('\n   To start the dev server, run:');
    console.error('   npm run dev');
    console.error('\n   Then run this script again in another terminal.');
    process.exit(1);
  }
  console.log('✅ Server is running');

  // Step 1: Get session cookie
  console.log('\n1️⃣ Authenticating...');
  const sessionCookie = await getSessionCookie();

  if (!sessionCookie) {
    console.error('\n❌ Failed to authenticate. Cannot proceed with tests.');
    console.error('\n   Troubleshooting:');
    console.error(`   1. Ensure dev server is running: npm run dev`);
    console.error(`   2. Check test user exists: ${TEST_USER_EMAIL}`);
    console.error(`   3. Verify password in .env.local: TEST_USER_PASSWORD`);
    console.error('   4. Check database connection');
    console.error('\n   To create a test user, run:');
    console.error('   npx prisma db seed');
    process.exit(1);
  }

  console.log('✅ Authentication successful');

  // Step 2: Get a version ID for testing /api/versions/[id]
  console.log('\n2️⃣ Preparing test data...');
  const testVersion = await prisma.version.findFirst({
    select: { id: true, name: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!testVersion) {
    console.error('\n❌ No versions found in database.');
    console.error('   Please create at least one version before running load tests.');
    process.exit(1);
  }

  console.log(`✅ Using version: ${testVersion.name} (${testVersion.id})`);

  // Step 3: Run load tests
  console.log('\n3️⃣ Running load tests...');
  console.log('   This may take a few minutes...\n');

  const allMetrics: PerformanceMetrics[] = [];

  // Test 1: GET /api/versions
  const versionsMetrics = await testEndpoint('/api/versions', sessionCookie, 10, 20);
  allMetrics.push(versionsMetrics);
  printMetrics(versionsMetrics);

  // Test 2: GET /api/versions/[id]
  const versionDetailEndpoint = `/api/versions/${testVersion.id}`;
  const versionDetailMetrics = await testEndpoint(
    versionDetailEndpoint,
    sessionCookie,
    10,
    20
  );
  // Update endpoint name for metrics
  versionDetailMetrics.endpoint = '/api/versions/[id]';
  allMetrics.push(versionDetailMetrics);
  printMetrics(versionDetailMetrics);

  // Test 3: GET /api/admin/settings (requires ADMIN role)
  const adminSettingsMetrics = await testEndpoint(
    '/api/admin/settings',
    sessionCookie,
    10,
    20
  );
  allMetrics.push(adminSettingsMetrics);
  printMetrics(adminSettingsMetrics);

  // Step 4: Summary report
  console.log('\n\n' + '='.repeat(70));
  console.log('📈 PERFORMANCE TEST SUMMARY');
  console.log('='.repeat(70));

  let allTargetsMet = true;

  for (const metrics of allMetrics) {
    const status = metrics.targetMet ? '✅ PASS' : '❌ FAIL';
    const icon = metrics.targetMet ? '✅' : '❌';
    console.log(`${icon} ${metrics.endpoint.padEnd(30)} p95: ${metrics.p95.toFixed(2).padStart(8)}ms / target: <${metrics.target}ms ${status}`);
    if (!metrics.targetMet) {
      allTargetsMet = false;
    }
  }

  console.log('='.repeat(70));

  // Overall result
  if (allTargetsMet) {
    console.log('\n✅ SUCCESS: All performance targets met!');
    console.log('   Phase 0.2 optimizations are working correctly.');
  } else {
    console.log('\n⚠️  WARNING: Some performance targets not met.');
    console.log('   Review the detailed metrics above.');
    console.log('   Consider:');
    console.log('   - Checking database indexes');
    console.log('   - Verifying cache is working');
    console.log('   - Reviewing query optimization');
  }

  // Performance comparison (if we have baseline data)
  console.log('\n📊 Performance Comparison:');
  console.log('   Before optimization:');
  console.log('   - /api/versions/[id]:     3,822ms');
  console.log('   - /api/versions:           1,066ms');
  console.log('   - /api/admin/settings:     1,045ms');
  console.log('\n   After optimization (current):');
  for (const metrics of allMetrics) {
    const improvement = metrics.endpoint.includes('[id]')
      ? ((3822 - metrics.p95) / 3822 * 100).toFixed(1)
      : metrics.endpoint.includes('admin/settings')
      ? ((1045 - metrics.p95) / 1045 * 100).toFixed(1)
      : ((1066 - metrics.p95) / 1066 * 100).toFixed(1);
    console.log(`   - ${metrics.endpoint.padEnd(30)} p95: ${metrics.p95.toFixed(2)}ms (${improvement}% improvement)`);
  }

  await prisma.$disconnect();
  process.exit(allTargetsMet ? 0 : 1);
}

// Run tests
main().catch((error) => {
  console.error('\n❌ Fatal error during load testing:', error);
  process.exit(1);
});

