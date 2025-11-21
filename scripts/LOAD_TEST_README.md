# Load Testing Script - API Performance

## Overview

This script tests the performance improvements made in Phase 0.2 optimizations. It performs load testing on three critical API endpoints to verify they meet performance targets.

## Endpoints Tested

1. **GET /api/versions/[id]** 
   - Target: <1000ms (p95)
   - Previous: 3,822ms
   - Tests: 200 concurrent requests (10 concurrent × 20 iterations)

2. **GET /api/versions**
   - Target: <100ms (p95)
   - Previous: 1,066ms
   - Tests: 200 concurrent requests (10 concurrent × 20 iterations)

3. **GET /api/admin/settings**
   - Target: <100ms (p95)
   - Previous: 1,045ms
   - Tests: 200 concurrent requests (10 concurrent × 20 iterations)

## Prerequisites

1. **Dev server running**
   ```bash
   npm run dev
   ```
   Server should be accessible at `http://localhost:3000`

2. **Database connection**
   - `.env.local` file with `DATABASE_URL` configured
   - At least one version exists in the database

3. **Test user**
   - Default: `admin@company.com` (from seed data)
   - Password: Set in `.env.local` as `TEST_USER_PASSWORD` (default: `admin123`)
   - Or create a user with ADMIN role

## Usage

### Basic Usage

```bash
npm run test:load
```

### With Custom Configuration

```bash
# Set custom base URL
NEXTAUTH_URL=http://localhost:3000 npm run test:load

# Set custom test user
TEST_USER_EMAIL=your-email@example.com TEST_USER_PASSWORD=your-password npm run test:load
```

### Direct Script Execution

```bash
npx tsx scripts/load-test-api-performance.ts
```

## Output

The script provides:

1. **Per-endpoint metrics:**
   - Total requests, successes, failures
   - Response time statistics (min, max, avg, p50, p95, p99)
   - Target status (PASS/FAIL)

2. **Summary report:**
   - Overall status (all targets met or not)
   - Performance comparison (before vs after optimization)
   - Percentage improvement

## Example Output

```
🚀 Starting API Performance Load Test
======================================================================
Base URL: http://localhost:3000
Test User: admin@company.com
======================================================================

0️⃣ Checking server health...
✅ Server is running

1️⃣ Authenticating...
✅ Authentication successful

2️⃣ Preparing test data...
✅ Using version: Test Version (abc123...)

3️⃣ Running load tests...
   This may take a few minutes...

🧪 Testing /api/versions
   Concurrent requests: 10
   Total requests: 200

======================================================================
📊 /api/versions
======================================================================
Total Requests:      200
Successes:            200 (100.0%)
Failures:             0 (0.0%)

Response Times (ms):
  Min:                45.23
  Max:                125.67
  Average:            67.89
  Median (p50):       65.12
  95th percentile:    98.45
  99th percentile:    115.23

Target (p95):         <100ms
Status:               ✅ PASS
======================================================================

...

📈 PERFORMANCE TEST SUMMARY
======================================================================
✅ /api/versions                      p95:    98.45ms / target: <100ms ✅ PASS
✅ /api/versions/[id]                p95:   856.23ms / target: <1000ms ✅ PASS
✅ /api/admin/settings                p95:    45.67ms / target: <100ms ✅ PASS
======================================================================

✅ SUCCESS: All performance targets met!
   Phase 0.2 optimizations are working correctly.

📊 Performance Comparison:
   Before optimization:
   - /api/versions/[id]:     3,822ms
   - /api/versions:           1,066ms
   - /api/admin/settings:     1,045ms

   After optimization (current):
   - /api/versions                      p95:    98.45ms (90.8% improvement)
   - /api/versions/[id]                p95:   856.23ms (77.6% improvement)
   - /api/admin/settings                p95:    45.67ms (95.6% improvement)
```

## Troubleshooting

### Server Not Running

```
❌ Dev server is not running or not accessible.
   Expected server at: http://localhost:3000

   To start the dev server, run:
   npm run dev
```

**Solution:** Start the dev server in a separate terminal window.

### Authentication Failed

```
❌ Failed to authenticate. Cannot proceed with tests.

   Troubleshooting:
   1. Ensure dev server is running: npm run dev
   2. Check test user exists: admin@company.com
   3. Verify password in .env.local: TEST_USER_PASSWORD
   4. Check database connection

   To create a test user, run:
   npx prisma db seed
```

**Solution:** 
- Ensure the test user exists in the database
- Check password in `.env.local`
- Run seed script if needed: `npx prisma db seed`

### No Versions Found

```
❌ No versions found in database.
   Please create at least one version before running load tests.
```

**Solution:** Create a version through the UI or API before running the test.

### Database Connection Error

```
error: Environment variable not found: DATABASE_URL.
```

**Solution:** Ensure `.env.local` exists with `DATABASE_URL` configured.

## Performance Targets

The script verifies that the 95th percentile response time meets these targets:

| Endpoint | Target (p95) | Previous | Improvement Goal |
|----------|--------------|----------|-------------------|
| `/api/versions/[id]` | <1000ms | 3,822ms | 73.8% faster |
| `/api/versions` | <100ms | 1,066ms | 90.6% faster |
| `/api/admin/settings` | <100ms | 1,045ms | 90.4% faster |

## Notes

- The script uses concurrent requests to simulate real-world load
- Response times are measured from client perspective (includes network latency)
- For more accurate server-side metrics, check server logs
- Cache warming may affect first request times
- Results may vary based on system load and database state

## Related Documentation

- [TODO.md](../TODO.md) - Phase 0.2 performance optimizations
- [PHASE_0_2_FINAL_VERIFICATION.md](../PHASE_0_2_FINAL_VERIFICATION.md) - Verification report
- [API.md](../API.md) - API documentation

