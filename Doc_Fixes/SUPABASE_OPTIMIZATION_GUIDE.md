# Supabase Response Time Optimization Guide

**For Project Zeta - Financial Planning Application**

Based on Context7 documentation and your current codebase structure.

---

## 🎯 Quick Wins (Implement First)

### 1. **Optimize Connection Pooling Configuration**

**Current Status:** ✅ You have pgBouncer configured, but can optimize further.

**Update your `.env.local`:**

```env
# Current (good)
DATABASE_URL="postgresql://...?pgbouncer=true&sslmode=require"

# Optimized (add connection pool parameters)
DATABASE_URL="postgresql://...?pgbouncer=true&sslmode=require&connection_limit=10&pool_timeout=30"
DIRECT_URL="postgresql://...?sslmode=require"
```

**Update `prisma/schema.prisma`:**

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL") // pgBouncer with optimized pool settings
  directUrl = env("DIRECT_URL")   // Direct connection for migrations
}
```

**Why:**

- `connection_limit=10`: Allows 10 parallel queries (good for your use case)
- `pool_timeout=30`: Prevents "Timed out fetching connection" errors
- pgBouncer handles connection pooling efficiently

---

### 2. **Use Prisma Client Singleton (Already Done ✅)**

**Your current implementation in `lib/db/prisma.ts` is correct!**

✅ Single PrismaClient instance  
✅ Connection pool warmup  
✅ Development hot-reload handling

**Keep this pattern** - it prevents connection pool exhaustion.

---

### 3. **Optimize Query Patterns**

#### ❌ Avoid: Creating new PrismaClient per request

```typescript
// BAD - Don't do this
async function getVersion(id: string) {
  const prisma = new PrismaClient(); // ❌ Creates new connection pool
  return prisma.version.findUnique({ where: { id } });
}
```

#### ✅ Use: Singleton PrismaClient

```typescript
// GOOD - Your current pattern
import { prisma } from '@/lib/db/prisma';

async function getVersion(id: string) {
  return prisma.version.findUnique({ where: { id } });
}
```

---

## 📊 Query Optimization Strategies

### 1. **Use `select` Instead of `include` When Possible**

**Current Pattern (Check your services):**

```typescript
// ❌ BAD: Fetches all fields
const version = await prisma.version.findUnique({
  where: { id },
  include: {
    curriculumPlans: true,
    rentPlan: true,
    capexItems: true,
  },
});
```

**Optimized:**

```typescript
// ✅ GOOD: Select only needed fields
const version = await prisma.version.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    status: true,
    curriculumPlans: {
      select: {
        id: true,
        curriculumType: true,
        capacity: true,
        // Only fields you need
      },
    },
    rentPlan: {
      select: {
        rentModel: true,
        parameters: true,
      },
    },
  },
});
```

**Impact:** Reduces data transfer by 30-50% for large objects.

---

### 2. **Use Parallel Queries with Promise.all**

**For independent queries:**

```typescript
// ❌ BAD: Sequential (slow)
const version = await prisma.version.findUnique({ where: { id } });
const curriculumPlans = await prisma.curriculumPlan.findMany({ where: { versionId: id } });
const rentPlan = await prisma.rentPlan.findUnique({ where: { versionId: id } });

// ✅ GOOD: Parallel (fast)
const [version, curriculumPlans, rentPlan] = await Promise.all([
  prisma.version.findUnique({ where: { id } }),
  prisma.curriculumPlan.findMany({ where: { versionId: id } }),
  prisma.rentPlan.findUnique({ where: { versionId: id } }),
]);
```

**Impact:** 2-3x faster for multiple independent queries.

---

### 3. **Batch Operations with `createMany`**

**For bulk inserts:**

```typescript
// ❌ BAD: Multiple queries
for (const item of capexItems) {
  await prisma.capexItem.create({ data: item });
}

// ✅ GOOD: Single batch query
await prisma.capexItem.createMany({
  data: capexItems,
  skipDuplicates: true,
});
```

**Impact:** 10-100x faster for bulk operations.

---

### 4. **Use Transactions for Multi-Step Operations**

**Your current pattern (from codebase):**

```typescript
// ✅ GOOD: Already using transactions
await prisma.$transaction(async (tx) => {
  const version = await tx.version.create({ data: versionData });
  await tx.curriculumPlan.createMany({ data: curriculumData });
  await tx.rentPlan.create({ data: rentPlanData });
  return version;
});
```

**Keep this pattern** - it's optimal for atomic operations.

---

## 🔍 Database-Level Optimizations

### 1. **Add Missing Indexes**

**Check your schema for:**

```prisma
// ✅ You already have good indexes, but verify these:

model versions {
  // ... fields
  @@index([status, createdAt]) // ✅ Good for filtering
  @@index([createdBy, createdAt]) // ✅ Good for user queries
}

model curriculum_plans {
  // ... fields
  @@index([versionId]) // ✅ Good
  @@unique([versionId, curriculumType]) // ✅ Good
}

// Add if missing:
model audit_logs {
  // ... fields
  @@index([userId, timestamp]) // ✅ You have this
  @@index([entityType, entityId]) // ✅ You have this
  // Consider adding for time-range queries:
  @@index([timestamp]) // If you query by time range
}
```

---

### 2. **Use EXPLAIN to Analyze Slow Queries**

**Add to your debugging toolkit:**

```typescript
// In development, analyze query plans
if (process.env.NODE_ENV === 'development') {
  const result = await prisma.$queryRaw`
    EXPLAIN ANALYZE
    SELECT * FROM versions
    WHERE created_by = ${userId}
    ORDER BY created_at DESC
    LIMIT 10
  `;
  console.log('Query Plan:', result);
}
```

**Or use Supabase's built-in query analyzer:**

```sql
-- Run in Supabase SQL Editor
SELECT
  auth.rolname,
  statements.query,
  statements.calls,
  statements.mean_exec_time,
  statements.max_exec_time,
  statements.total_exec_time
FROM pg_stat_statements as statements
INNER JOIN pg_authid as auth ON statements.userid = auth.oid
WHERE statements.calls > 50
  AND statements.mean_exec_time > 2.0
ORDER BY statements.total_exec_time DESC
LIMIT 20;
```

---

### 3. **Optimize JSONB Queries**

**Your schema uses JSONB for:**

- `curriculum_plans.studentsProjection`
- `rent_plans.parameters`
- `admin_settings.value`

**Optimize JSONB queries:**

```typescript
// ❌ BAD: Full table scan
const plans = await prisma.curriculumPlan.findMany({
  where: {
    studentsProjection: {
      path: ['$[*].year'],
      equals: 2028
    }
  }
})

// ✅ GOOD: Use GIN index on JSONB (add to schema)
// In schema.prisma:
model curriculum_plans {
  // ... fields
  studentsProjection Json

  @@index([studentsProjection(ops: JsonbPathOps)])
}
```

**Or extract frequently queried fields:**

```prisma
// Better: Extract to dedicated columns
model curriculum_plans {
  // ... existing fields
  studentsProjection Json // Keep for full data
  currentYearStudents Int // Extract for queries
  @@index([currentYearStudents])
}
```

---

## 🚀 Application-Level Optimizations

### 1. **Cache Admin Settings**

**Your current pattern in `lib/utils/admin-settings.ts`:**

```typescript
// ✅ GOOD: You have caching logic
// Consider adding TTL cache:

import NodeCache from 'node-cache';

const settingsCache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 60,
});

export async function getAdminSettings(): Promise<SettingsResult<AdminSettings>> {
  const cacheKey = 'admin_settings';

  // Check cache first
  const cached = settingsCache.get<AdminSettings>(cacheKey);
  if (cached) {
    return { success: true, data: cached };
  }

  // Fetch from database
  const result = await fetchFromDatabase();
  if (result.success) {
    settingsCache.set(cacheKey, result.data);
  }

  return result;
}
```

**Impact:** Reduces database queries for frequently accessed settings.

---

### 2. **Optimize Projection Calculations**

**Your `projection.ts` already uses:**

- ✅ Web Workers for heavy calculations
- ✅ Decimal.js for precision
- ✅ Memoization opportunities

**Additional optimization:**

```typescript
// Cache projection results per version
const projectionCache = new Map<
  string,
  {
    result: FullProjectionResult;
    timestamp: number;
  }
>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function calculateFullProjection(
  params: FullProjectionParams
): Promise<Result<FullProjectionResult>> {
  const cacheKey = `${params.versionId}-${params.startYear}-${params.endYear}`;

  const cached = projectionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return success(cached.result);
  }

  const result = await performCalculation(params);
  if (result.success) {
    projectionCache.set(cacheKey, {
      result: result.data,
      timestamp: Date.now(),
    });
  }

  return result;
}
```

---

### 3. **Optimize API Routes**

**Use Next.js caching:**

```typescript
// app/api/versions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const version = await prisma.version.findUnique({
    where: { id: params.id },
    select: {
      // Only select needed fields
      id: true,
      name: true,
      status: true,
    },
  });

  // Cache response
  return NextResponse.json(version, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
```

---

## 📈 Monitoring & Performance Analysis

### 1. **Track Query Performance**

**Add to your Prisma client:**

```typescript
// lib/db/prisma.ts
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? [{ emit: 'event', level: 'query' }] : ['error'],
});

// Track slow queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    if (e.duration > 100) {
      // Log queries > 100ms
      console.warn(`⚠️ Slow query (${e.duration}ms):`, e.query);
    }
  });
}
```

---

### 2. **Use Supabase Dashboard**

**Monitor in Supabase Dashboard:**

1. **Database → Performance:**
   - View slow queries
   - Check connection pool usage
   - Monitor query execution times

2. **Database → Connection Pooling:**
   - Check active connections
   - Monitor pool utilization
   - Identify connection leaks

3. **Logs → API Logs:**
   - Track API response times
   - Identify slow endpoints
   - Monitor error rates

---

### 3. **Add Performance Metrics**

**Create performance monitoring:**

```typescript
// lib/monitoring/performance.ts
export async function trackQueryPerformance<T>(
  operation: string,
  query: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await query();
    const duration = performance.now() - startTime;

    if (duration > 200) {
      console.warn(`⚠️ Slow ${operation}: ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`❌ Failed ${operation} after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
}

// Usage:
const version = await trackQueryPerformance('getVersion', () =>
  prisma.version.findUnique({ where: { id } })
);
```

---

## 🎯 Specific Optimizations for Your Codebase

### 1. **Optimize `calculateFullProjection`**

**Current:** Fetches historical actuals per call  
**Optimized:** Cache or batch fetch

```typescript
// In projection.ts
// Instead of fetching per call:
const historicalData = await prisma.historical_actuals.findMany({
  where: { versionId: params.versionId, year: { in: [2023, 2024] } },
});

// Consider: Pre-fetch in API route and pass as param
// Or: Cache with versionId as key
```

---

### 2. **Optimize Admin Settings Fetching**

**Your `lib/utils/admin-settings.ts` already has caching logic ✅**

**Consider adding:**

- TTL-based cache (5 minutes)
- Invalidation on updates
- Batch fetching for multiple settings

---

### 3. **Optimize CircularSolver API Calls**

**In `circular-solver.ts` line 406:**

```typescript
// Current: Fetches settings via API
const response = await fetch(`${baseUrl}/api/admin/financial-settings`);

// Optimized: Cache settings response
const settingsCache = new Map<string, { data: any; timestamp: number }>();

async function getFinancialSettings() {
  const cacheKey = 'financial_settings';
  const cached = settingsCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 300000) {
    // 5 min
    return cached.data;
  }

  const response = await fetch(`${baseUrl}/api/admin/financial-settings`);
  const data = await response.json();

  settingsCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}
```

---

## 📋 Checklist: Implement These Optimizations

### Immediate (This Week)

- [ ] Add `connection_limit` and `pool_timeout` to DATABASE_URL
- [ ] Review and optimize `select` vs `include` in service files
- [ ] Add `Promise.all` for parallel independent queries
- [ ] Enable query logging in development to identify slow queries

### Short-Term (This Month)

- [ ] Add TTL cache for admin settings
- [ ] Optimize JSONB queries (add GIN indexes or extract fields)
- [ ] Add performance monitoring/tracking
- [ ] Review and optimize projection calculation caching

### Long-Term (Ongoing)

- [ ] Monitor Supabase dashboard for slow queries
- [ ] Regularly run `pg_stat_statements` analysis
- [ ] Optimize based on real-world usage patterns
- [ ] Consider Prisma Accelerate for connection pooling (if needed)

---

## 🔗 Resources

- **Supabase Performance Docs:** https://supabase.com/docs/guides/database/query-optimization
- **Prisma Performance:** https://www.prisma.io/docs/guides/performance-and-optimization
- **PostgreSQL Indexing:** https://www.postgresql.org/docs/current/indexes.html

---

## 📊 Expected Performance Improvements

| Optimization                | Expected Improvement                | Effort |
| --------------------------- | ----------------------------------- | ------ |
| Connection pool tuning      | 20-30% faster                       | Low    |
| Query `select` optimization | 30-50% less data transfer           | Medium |
| Parallel queries            | 2-3x faster for multi-query         | Low    |
| Admin settings caching      | 90% reduction in queries            | Low    |
| JSONB index optimization    | 5-10x faster JSONB queries          | Medium |
| Projection result caching   | 80-90% faster repeated calculations | Medium |

**Total Expected Improvement:** 40-60% faster response times overall.

---

**Next Steps:** Start with connection pool tuning and query optimization - these provide the biggest impact with minimal effort!
