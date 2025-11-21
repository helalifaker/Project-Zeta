# Phase 0 Emergency Fixes - Quick Reference Card

**⚠️ CRITICAL: Read this before starting Phase 0 fixes**

---

## 🚨 PRE-FLIGHT CHECKLIST (DO NOT SKIP!)

### 1. Backup Database (MANDATORY)
```
1. Open Supabase Dashboard
2. Navigate to: Database → Backups
3. Click "Create Backup"
4. Name: "pre-migration-backup-2025-11-21"
5. Wait for completion (5-10 minutes)
6. ✅ Verify backup exists before proceeding
```

### 2. Verify Environment
```bash
cd "/Users/fakerhelali/Desktop/Project Zeta"

# Check migration status
npx prisma migrate status
# Expected: "11 migrations found, following migrations have not yet been applied"

# Check database connection
npx prisma db pull --print
# Expected: Schema output

# Check dev server is running
curl http://localhost:3000/api/health || echo "Start dev server: npm run dev"
```

---

## 🎯 PHASE 0.1: MISSING MIGRATIONS (30-60 MIN)

### Quick Start
```bash
cd "/Users/fakerhelali/Desktop/Project Zeta"

# 1. Apply all 11 pending migrations
npx prisma migrate deploy

# 2. Verify success
npx prisma migrate status
# Expected: "Database schema is up to date"

# 3. Regenerate Prisma Client
npx prisma generate

# 4. Restart dev server
# Ctrl+C to stop, then:
npm run dev

# 5. Check console output
# Expected: NO warnings about missing fields
```

### Success Criteria
- [ ] ✅ `npx prisma migrate status` shows "up to date"
- [ ] ✅ No console warnings (zakatRate, interest rates, etc.)
- [ ] ✅ Dev server starts without errors
- [ ] ✅ Type check passes: `npm run type-check`

### Rollback (If Failed)
```bash
# Via Supabase Dashboard:
# Database → Backups → Select backup → Restore
```

---

## 🚀 PHASE 0.2: DATABASE PERFORMANCE (6-9 HRS)

### Current vs Target Performance

| Endpoint | Current | Target | Fix |
|----------|---------|--------|-----|
| `/api/versions/[id]` | 3,822ms | <1000ms | Optimize queries + cache |
| `/api/versions` | 1,066ms | <100ms | Use lightweight mode |
| `/api/admin/settings` | 1,045ms | <100ms | Add caching |

### Key Changes

#### 1. Verify Indexes Exist (After Migrations)
```sql
-- Check in Supabase Dashboard → Database → Tables → versions → Indexes
-- Expected:
-- - versions_createdBy_idx
-- - versions_mode_idx
-- - versions_status_createdAt_idx
-- (Similar indexes for other tables)
```

#### 2. Optimize `/api/versions/[id]` (BIGGEST WIN)
**File:** `app/api/versions/[id]/route.ts`

**Change:** Combine query batches (lines 211-369)
- **Before:** 2 sequential batches (2 network round trips = 2000ms latency)
- **After:** 1 batch with nested includes (1 round trip = 1000ms latency)
- **Expected Improvement:** ~1000-2000ms faster

#### 3. Add Caching
**Create:** `lib/cache/version-cache.ts`
- Cache version metadata (5-minute TTL)
- Cache historical actuals (60-minute TTL)
- Invalidate on update

#### 4. Add Monitoring
**Create:** `lib/monitoring/query-logger.ts`
- Log slow queries (>500ms)
- Add endpoint: `/api/monitoring/slow-queries`

### Success Criteria
- [ ] ✅ `/api/versions/[id]` < 1000ms
- [ ] ✅ `/api/versions` < 100ms
- [ ] ✅ `/api/admin/settings` < 100ms
- [ ] ✅ Cache hit rate > 50%
- [ ] ✅ All tests pass: `npm test`

---

## 📦 PHASE 0.3: WEBPACK PERFORMANCE (2-3 HRS)

### Quick Start
```bash
# 1. Analyze bundle
ANALYZE=true npm run build
# Opens browser with bundle visualization

# 2. Identify large strings (185kiB, 139kiB)
# Look for:
# - Test data imports
# - Large JSON in components
# - Student projection arrays

# 3. Fix: Move to APIs or lazy load
# - Dynamic imports for heavy components
# - API routes for large data

# 4. Verify
npm run build
# Expected: No serialization warnings
```

### Success Criteria
- [ ] ✅ No webpack serialization warnings
- [ ] ✅ Build time improved by ≥5 seconds
- [ ] ✅ No chunks >500kB (except framework)

---

## 🔥 EMERGENCY ROLLBACK

### If Migrations Fail
```bash
# 1. Restore database from backup
# Supabase Dashboard → Database → Backups → Restore

# 2. Reset Prisma migrations table
# (Only if needed - consult DBA)

# 3. Revert code changes
git checkout HEAD -- prisma/
```

### If Performance Fix Breaks Functionality
```bash
# 1. Identify breaking change
git diff HEAD

# 2. Revert specific files
git checkout HEAD -- app/api/versions/[id]/route.ts
git checkout HEAD -- app/api/versions/route.ts

# 3. Keep migrations (safe)
# DO NOT revert migrations - indexes are safe

# 4. Restart dev server
npm run dev
```

---

## 📊 PERFORMANCE MEASUREMENT

### Before Starting
```bash
# Create baseline
cat > performance-baseline.txt <<EOF
Baseline Performance (Before Fixes)
Date: $(date)

/api/versions/[id]: 3,822ms
/api/versions: 1,066ms
/api/admin/settings: 1,045ms
EOF
```

### After Each Phase
```bash
# Measure performance
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3000/api/versions/[id]"
# Record time_total

# Or use performance test suite
npx tsx scripts/performance-tests.ts
```

---

## 🎯 SUCCESS METRICS

### Phase 0.1 Complete When:
✅ No console warnings
✅ All migrations applied
✅ Type check passes

### Phase 0.2 Complete When:
✅ All API endpoints meet targets (<1000ms, <100ms)
✅ Cache implemented and working
✅ Monitoring active

### Phase 0.3 Complete When:
✅ No webpack warnings
✅ Build faster by ≥5s
✅ Lighthouse score ≥85

### ALL PHASES COMPLETE When:
✅ All Phase 0 tasks in TODO.md marked complete
✅ Documentation updated
✅ All tests pass
✅ Smoke tests pass

---

## 📞 WHEN TO ASK FOR HELP

### Ask if:
- ❌ Migrations fail to apply
- ❌ Database connection errors
- ❌ Type errors after Prisma regeneration
- ❌ Performance targets not met after fixes
- ❌ Tests fail after changes
- ❌ Build errors after webpack changes

### Don't Ask if:
- ✅ Console shows normal Prisma logs (not errors)
- ✅ Build takes a few minutes (normal)
- ✅ First request slower than cache hits (expected)

---

## 📚 REFERENCE DOCUMENTS

| Document | Purpose |
|----------|---------|
| `PHASE_0_EXECUTIVE_SUMMARY.md` | High-level overview |
| `PHASE_0_EMERGENCY_FIXES_IMPLEMENTATION_PLAN.md` | Detailed step-by-step guide |
| `SCHEMA.md` | Database schema reference |
| `CLAUDE.md` | Project context & guidelines |
| `TODO.md` | Task tracking |

---

## ⏱️ TIME ALLOCATION

### Day 1 (4-5 hours)
- ✅ Phase 0.1: Migrations (1 hour)
- ✅ Phase 0.2: Start performance (3-4 hours)

### Day 2 (4-5 hours)
- ✅ Phase 0.2: Complete performance (3 hours)
- ✅ Phase 0.3: Webpack (2 hours)

**Total: 8-10 hours (1.5-2 days)**

---

## 🚦 STATUS INDICATORS

### 🟢 GREEN - Proceed
- All pre-flight checks pass
- Backup created successfully
- Tests passing
- Performance improving

### 🟡 YELLOW - Caution
- Some tests failing (investigate)
- Performance not meeting targets (adjust approach)
- Cache hit rate low (review TTL)

### 🔴 RED - STOP
- Migrations failing
- Data loss detected
- Critical functionality broken
- Production database at risk

**If RED: STOP, ROLLBACK, ASK FOR HELP**

---

## 🎉 COMPLETION CHECKLIST

When ALL items checked, Phase 0 is COMPLETE:

### Phase 0.1 (Migrations)
- [ ] ✅ Backup created
- [ ] ✅ 11 migrations applied
- [ ] ✅ No console warnings
- [ ] ✅ Type check passes

### Phase 0.2 (Performance)
- [ ] ✅ Indexes verified
- [ ] ✅ `/api/versions/[id]` < 1000ms
- [ ] ✅ `/api/versions` < 100ms
- [ ] ✅ Caching implemented
- [ ] ✅ Monitoring active

### Phase 0.3 (Webpack)
- [ ] ✅ No webpack warnings
- [ ] ✅ Build time improved
- [ ] ✅ Bundle size optimized

### Final Validation
- [ ] ✅ All tests pass: `npm test`
- [ ] ✅ Type check: `npm run type-check`
- [ ] ✅ Build: `npm run build`
- [ ] ✅ Smoke tests pass (manual UI testing)
- [ ] ✅ Documentation updated
- [ ] ✅ TODO.md updated

---

**Ready to Start?**

1. ✅ Read this entire card
2. ✅ Create database backup
3. ✅ Start with Phase 0.1
4. ✅ Proceed sequentially through phases
5. ✅ Validate after each phase

**Good luck! 🚀**

---

**Last Updated:** 2025-11-21
**Version:** 1.0
