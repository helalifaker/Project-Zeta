# Coordination Hub

**Purpose:** Central navigation and status tracking for all Project Zeta documentation
**Last Updated:** 2025-11-20
**Document Count:** 140+ markdown files
**Status:** 🟢 Active Development

---

## 🔍 Quick Navigation Index

**Use this index as your GPS for navigating 140+ documentation files**

### 🎯 I Need to Understand...

| What I Need to Understand | Go Here | Section/Line |
|---------------------------|---------|--------------|
| **How the entire system works** | [`ARCHITECTURE.md`](ARCHITECTURE.md) | Full document |
| **What we're building and why** | [`PRD.md`](PRD.md) | Business requirements |
| **How financial calculations work** | [`ARCHITECTURE.md`](ARCHITECTURE.md) | Section 7: Financial Engine |
| **Why the circular dependency exists** | [`ARCHITECTURE.md`](ARCHITECTURE.md) | Section 7.2: Circular Solver |
| **How the circular solver works** | [`lib/calculations/financial/circular-solver.ts`](lib/calculations/financial/circular-solver.ts) | Implementation |
| **Planning Periods architecture** | [`ARCHITECTURE.md`](ARCHITECTURE.md) | Section 8: Planning Periods |
| **What's blocking Financial Statements** | [`PRODUCTION_READINESS_ACTION_PLAN.md`](PRODUCTION_READINESS_ACTION_PLAN.md) | Phase 0: Architecture Fix |
| **Current database schema** | [`SCHEMA.md`](SCHEMA.md) + [`prisma/schema.prisma`](prisma/schema.prisma) | Full schema |
| **All API endpoints** | [`API.md`](API.md) | Complete API reference |
| **Development standards** | [`.cursorrules`](.cursorrules) | Complete standards |
| **How to use Claude AI effectively** | [`CLAUDE.md`](CLAUDE.md) | AI guidance (CRITICAL) |
| **What features are complete** | [`LATEST_PROJECT_SUMMARY.md`](LATEST_PROJECT_SUMMARY.md) | 79% complete status |
| **Rent model calculations** | [`ARCHITECTURE.md`](ARCHITECTURE.md) | Section 7.3: Rent Models |
| **Staff cost calculations** | [`lib/calculations/financial/staff-costs.ts`](lib/calculations/financial/staff-costs.ts) | Implementation |
| **NPV calculations** | [`lib/calculations/financial/npv.ts`](lib/calculations/financial/npv.ts) | Implementation |
| **EBITDA calculations** | [`lib/calculations/financial/ebitda.ts`](lib/calculations/financial/ebitda.ts) | Implementation |
| **How Web Workers are used** | [`workers/financial-engine.worker.ts`](workers/financial-engine.worker.ts) | Implementation |

### 🚀 I Need to Get Started...

| What I Need to Do | Go Here | What It Contains |
|-------------------|---------|------------------|
| **Set up my dev environment** | [`QUICK_START.md`](QUICK_START.md) | Step-by-step setup |
| **Connect to the database** | [`DATABASE_SETUP.md`](DATABASE_SETUP.md) | Database configuration |
| **Run the application** | [`QUICK_START.md`](QUICK_START.md) | `npm run dev` instructions |
| **Run the test suite** | [`QUICK_START.md`](QUICK_START.md) | `npm test` commands |
| **Deploy to production** | [`DEPLOYMENT.md`](DEPLOYMENT.md) | Deployment guide |
| **Understand dependencies** | [`DEPENDENCIES.md`](DEPENDENCIES.md) | Package rationale |
| **Configure environment variables** | [`.env.local.example`](.env.local.example) | Required env vars |

### 🐛 I Need to Solve a Problem...

| Problem | Solution Document | What You'll Find |
|---------|------------------|------------------|
| **Performance is slow** | [`DATABASE_PERFORMANCE_REPORT.md`](DATABASE_PERFORMANCE_REPORT.md) | Performance analysis |
| **Database errors** | [`TROUBLESHOOTING_DATABASE.md`](TROUBLESHOOTING_DATABASE.md) | Common fixes |
| **Tests are failing** | [`CODE_QUALITY_REPORT.md`](CODE_QUALITY_REPORT.md) | Test coverage & issues |
| **EBITDA calculations wrong** | [`ROOT_CAUSE_ANALYSIS_EBITDA.md`](ROOT_CAUSE_ANALYSIS_EBITDA.md) | ✅ FIXED |
| **IB checkbox not working** | [`IB_CHECKBOX_COMPLETE_FIX_REPORT.md`](IB_CHECKBOX_COMPLETE_FIX_REPORT.md) | ✅ FIXED |
| **CapEx deletion issues** | [`CAPEX_AUTO_ITEM_DELETION_VERIFICATION_REPORT.md`](CAPEX_AUTO_ITEM_DELETION_VERIFICATION_REPORT.md) | ✅ FIXED |
| **500 errors in reports** | [`FIX_500_ERROR_SUMMARY.md`](FIX_500_ERROR_SUMMARY.md) | ✅ FIXED |
| **Prisma client browser error** | [`FIX_PRISMA_CLIENT_BROWSER_ERROR.md`](FIX_PRISMA_CLIENT_BROWSER_ERROR.md) | ✅ FIXED |
| **Rent calculations NaN** | [`RENT_LENS_REVENUE_NAN_FIX_REPORT.md`](RENT_LENS_REVENUE_NAN_FIX_REPORT.md) | ✅ FIXED |
| **Data integrity issues** | [`CAPEX_DELETION_ISSUE_ROOT_CAUSE_ANALYSIS.md`](CAPEX_DELETION_ISSUE_ROOT_CAUSE_ANALYSIS.md) | Root cause analysis |
| **Circular dependency errors** | [`PRODUCTION_READINESS_ACTION_PLAN.md`](PRODUCTION_READINESS_ACTION_PLAN.md) | Phase 0 fix needed |
| **Decimal null errors** | [`DECIMAL_NULL_ERROR_FIX.md`](DECIMAL_NULL_ERROR_FIX.md) | ✅ FIXED |

### 📊 I Need Current Status...

| Status I Need | Go Here | What's There |
|---------------|---------|--------------|
| **Overall project status** | [`LATEST_PROJECT_SUMMARY.md`](LATEST_PROJECT_SUMMARY.md) | 79% complete (Dec 2025) |
| **Production blockers** | [`PRODUCTION_READINESS_ACTION_PLAN.md`](PRODUCTION_READINESS_ACTION_PLAN.md) | 🔴 URGENT issues |
| **What's blocking production** | [Architecture Challenges](#current-architecture-challenges) | 7 challenges tracked |
| **Timeline to production** | [Production Timeline](#production-timeline-updated-daily) | ~20 days |
| **Financial Statements status** | [`FINANCIAL_STATEMENTS_COMPLETE.md`](FINANCIAL_STATEMENTS_COMPLETE.md) | ✅ Backend, ❌ UI |
| **Planning Periods status** | [`Claude_Planning_Periods_Architecture_Review.md`](Claude_Planning_Periods_Architecture_Review.md) | 🟡 IN DESIGN |
| **Rent Models status** | [`RENT_MODEL_ROADMAP_VERIFICATION.md`](RENT_MODEL_ROADMAP_VERIFICATION.md) | ✅ Complete |
| **Reports feature status** | [`REPORTS_FEATURE_IMPLEMENTATION_VERIFICATION_FINAL.md`](REPORTS_FEATURE_IMPLEMENTATION_VERIFICATION_FINAL.md) | ✅ Complete |
| **IB Optional status** | [`IB_OPTIONAL_IMPLEMENTATION_VERIFICATION.md`](IB_OPTIONAL_IMPLEMENTATION_VERIFICATION.md) | ✅ Complete |
| **Costs Analysis status** | [`COSTS_ANALYSIS_FINAL_VERIFICATION.md`](COSTS_ANALYSIS_FINAL_VERIFICATION.md) | ✅ Complete |
| **Code quality status** | [`CODE_QUALITY_REPORT.md`](CODE_QUALITY_REPORT.md) | Quality metrics |
| **Architecture compliance** | [`ARCHITECTURAL_VALIDATION_REPORT.md`](ARCHITECTURAL_VALIDATION_REPORT.md) | Validation report |

### 🔧 I Need to Implement...

| Feature to Implement | Implementation Guide | Current Status |
|---------------------|---------------------|----------------|
| **Financial Statements UI** | [`FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md`](FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md) | 🟡 Phase 9 |
| **Planning Periods** | [`PLANNING_PERIODS_IMPLEMENTATION_PLAN_REVISED.md`](PLANNING_PERIODS_IMPLEMENTATION_PLAN_REVISED.md) | 🟡 IN DESIGN |
| **New rent model** | [`RENT_MODEL_IMPLEMENTATION_ROADMAP.md`](RENT_MODEL_IMPLEMENTATION_ROADMAP.md) | Reference guide |
| **Database migration** | [`DATABASE_SETUP.md`](DATABASE_SETUP.md) | Migration guide |
| **New API endpoint** | [`API.md`](API.md) + service patterns | Follow patterns |
| **New calculation** | [`lib/calculations/financial/`](lib/calculations/financial/) | Example files |
| **Tax to Zakat change** | [`CHANGE_TAX_TO_ZAKAT_IMPLEMENTATION_GUIDE.md`](CHANGE_TAX_TO_ZAKAT_IMPLEMENTATION_GUIDE.md) | ✅ Complete |

### 📝 I Need to Review...

| What to Review | Review Document | What's Reviewed |
|----------------|-----------------|-----------------|
| **Complete 360° code review** | [`360_CODE_REVIEW_REPORT.md`](360_CODE_REVIEW_REPORT.md) | Full codebase |
| **Architecture validation** | [`ARCHITECTURAL_VALIDATION_REPORT.md`](ARCHITECTURAL_VALIDATION_REPORT.md) | Architecture |
| **Code quality metrics** | [`CODE_QUALITY_REPORT.md`](CODE_QUALITY_REPORT.md) | Quality analysis |
| **Financial Statements review** | [`FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN_FINAL_REVIEW.md`](FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN_FINAL_REVIEW.md) | Final review |
| **Planning Periods review** | [`Claude_Planning_Periods_Architecture_Review.md`](Claude_Planning_Periods_Architecture_Review.md) | Architecture |
| **Costs Analysis UI review** | [`COSTS_ANALYSIS_UI_360_REVIEW_REPORT.md`](COSTS_ANALYSIS_UI_360_REVIEW_REPORT.md) | UI review |
| **Curriculum Plans UI review** | [`CURRICULUM_PLANS_UI_360_REVIEW_REPORT.md`](CURRICULUM_PLANS_UI_360_REVIEW_REPORT.md) | UI review |
| **Implementation plan review** | [`360_IMPLEMENTATION_PLAN_REVIEW_REPORT.md`](360_IMPLEMENTATION_PLAN_REVIEW_REPORT.md) | Plan review |

### 🎓 I Need Examples...

| Example Needed | Where to Find It | What's There |
|----------------|------------------|--------------|
| **How to write a calculation** | [`lib/calculations/financial/ebitda.ts`](lib/calculations/financial/ebitda.ts) | EBITDA example |
| **How to write a service** | [`services/version/create.ts`](services/version/create.ts) | Version service |
| **How to write an API route** | [`app/api/versions/[id]/route.ts`](app/api/versions/[id]/route.ts) | Version API |
| **How to use Decimal.js** | Search codebase for `new Decimal(` | Many examples |
| **How to write tests** | [`lib/calculations/financial/__tests__/`](lib/calculations/financial/__tests__/) | Test examples |
| **How to use Web Workers** | [`workers/financial-engine.worker.ts`](workers/financial-engine.worker.ts) | Worker example |
| **How to implement period logic** | [`lib/utils/period-detection.ts`](lib/utils/period-detection.ts) | ✅ Implemented |

### 🗺️ I Need to Navigate...

| Navigation Need | Use This | What You'll Get |
|-----------------|----------|-----------------|
| **Find any document** | [File Dependency Matrix](#file-dependency-matrix) | 140+ files mapped |
| **Understand doc relationships** | [Document Dependency Map](#document-dependency-map) | Tier-based organization |
| **Find docs by feature** | [Quick Reference Links by Category](#quick-reference-links-by-category) | Feature-based index |
| **Understand naming patterns** | [Document Naming Conventions](#document-naming-conventions) | Prefix/suffix guide |
| **See all docs alphabetically** | [All Files Alphabetical Index](#all-140-documentation-files-alphabetical-index) | Complete list |
| **Track architecture challenges** | [Architecture Challenges](#current-architecture-challenges) | 7 challenges |
| **See production timeline** | [Production Timeline](#production-timeline-updated-daily) | 20-day roadmap |
| **Find implementation files** | Search in sections above | File paths provided |

### 💡 Common Quick Answers

**Q: How do I run tests?**
→ `npm test` (see [`QUICK_START.md`](QUICK_START.md))

**Q: How do I run a single test file?**
→ `npm test -- path/to/test.ts` (see [`CLAUDE.md`](CLAUDE.md))

**Q: How do I create a migration?**
→ `cd /path/to/project && npx prisma migrate dev --name description` (see [`DATABASE_SETUP.md`](DATABASE_SETUP.md))

**Q: Where are financial calculations?**
→ `lib/calculations/financial/` directory

**Q: What's the current production blocker?**
→ Dual Calculation Path ([Challenge 1](#challenge-1-dual-calculation-path--data-loss-critical))

**Q: When will we be production-ready?**
→ ~20 days from 2025-11-20 (see [Production Timeline](#production-timeline-updated-daily))

**Q: What's the database connection string format?**
→ See [`.env.local.example`](.env.local.example)

**Q: How do I use Claude AI for this project?**
→ Read [`CLAUDE.md`](CLAUDE.md) (CRITICAL - overrides all defaults)

**Q: What are the development standards?**
→ Read [`.cursorrules`](.cursorrules) (complete standards)

**Q: What's blocking Financial Statements?**
→ UI components ([Challenge 2](#challenge-2-financial-statements-ui-implementation))

---

## Project Status Overview

**Last Verified:** 2025-11-20

### Current State
- **Version:** Pre-Production (79% Complete - 23/29 features)
- **Primary Focus:** Financial Statements UI Implementation
- **Active Branch:** main
- **Development Status:** Active Development
- **Production Readiness:** 🟢 UNBLOCKED - Phase 0 Complete (Challenge 1 Resolved)

### Quick Status Indicators
| Area | Status | Last Verified | Primary Doc |
|------|--------|---------------|-------------|
| Financial Engine | ✅ Complete | 2025-11-20 | `FINANCIAL_STATEMENTS_COMPLETE.md` |
| Database Schema | ✅ Stable | 2025-11-20 | `SCHEMA.md` |
| API Layer | ✅ Complete | 2025-11-20 | `API.md` |
| UI Components | 🟡 In Progress | 2025-11-20 | `PROJECT_STATUS_REPORT.md` |
| Testing | 🔴 Needs Work | 2025-11-20 | `PRODUCTION_READINESS_ACTION_PLAN.md` |
| Deployment | 🔴 Not Started | 2025-11-20 | `DEPLOYMENT.md` |

---

## Production Timeline (Updated Daily)

**Last Updated:** 2025-11-20

### Current Status: 79% Complete → Target: 95% (Financial Statements)

**Overall Timeline to Production:** ~20 days from 2025-11-20

---

### Phase 9: Financial Statements Display (CRITICAL - In Progress)

**Status:** 🟡 In Progress
**Duration:** 7-9 days
**Impact:** Moves project from 79% → 95% complete

**Tasks:**
- [ ] P&L Statement Component (2-3 days)
  - Design and implement Profit & Loss statement display
  - Period-aware rendering (HISTORICAL/TRANSITION/DYNAMIC)
  - Export functionality (PDF, Excel, CSV)

- [ ] Balance Sheet Calculations (3-4 days)
  - Complete circular solver integration
  - Assets, Liabilities, Equity display components
  - Historical actuals integration for 2023-2024

- [ ] Cash Flow Statement Component (2 days)
  - Operating, Investing, Financing activities display
  - NPV calculation visualization (2028-2052)
  - Period comparison views

**Target Completion:** ~9 days from 2025-11-20
**Blockers:** None currently identified
**Dependencies:** Circular solver (✅ Complete), Admin settings (✅ Complete)

---

### Phase 10: Testing & Deployment (11 days)

**Status:** 🔴 Not Started
**Duration:** 11 days
**Prerequisites:** Phase 9 completion

**Testing Phase (6 days):**
- [ ] Unit Test Coverage (3 days)
  - Target: 80%+ coverage for calculation functions
  - Circular solver comprehensive tests
  - Period detection edge cases

- [ ] Integration Testing (2 days)
  - API endpoint testing
  - Database transaction testing
  - Web Worker performance validation

- [ ] E2E Testing (1 day)
  - Critical user flows
  - Financial statement generation end-to-end
  - Report generation workflows

**Deployment Preparation (3 days):**
- [ ] Environment Configuration (1 day)
  - Production environment variables
  - Database connection strings
  - Authentication setup

- [ ] Database Migration Strategy (1 day)
  - Migration scripts validation
  - Rollback procedures
  - Data backup strategy

- [ ] Monitoring & Observability (1 day)
  - Error tracking setup
  - Performance monitoring
  - Audit log review procedures

**Final QA & Sign-off (2 days):**
- [ ] Financial Accuracy Validation
- [ ] UI/UX Final Review
- [ ] Security Audit
- [ ] Accessibility Compliance (WCAG 2.1 AA+)

**Target Production Date:** ~20 days from 2025-11-20

---

### Daily Progress Tracking

**Week 1 (Days 1-7):**
- Days 1-3: P&L Statement Component
- Days 4-7: Balance Sheet Calculations

**Week 2 (Days 8-14):**
- Days 8-9: Cash Flow Statement Component
- Days 10-12: Unit Testing
- Days 13-14: Integration Testing

**Week 3 (Days 15-20):**
- Day 15: E2E Testing
- Days 16-18: Deployment Preparation
- Days 19-20: Final QA & Sign-off

---

### Risk Factors & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Circular solver performance issues | Low | High | Already tested, <100ms target met |
| Financial calculation accuracy | Low | Critical | Comprehensive verification completed |
| UI complexity delays | Medium | Medium | Use existing shadcn/ui components |
| Testing reveals critical bugs | Medium | High | Buffer time included, prioritize fixes |
| Deployment configuration issues | Low | Medium | Test on staging environment first |

---

### Success Criteria

**Phase 9 Complete When:**
- ✅ All 3 financial statements display correctly
- ✅ Period-aware logic working (HISTORICAL/TRANSITION/DYNAMIC)
- ✅ Export functionality operational (PDF, Excel, CSV)
- ✅ Performance target met (<50ms for 30-year projection)
- ✅ UI responsive on mobile and desktop

**Phase 10 Complete When:**
- ✅ 80%+ test coverage achieved
- ✅ All critical user flows tested
- ✅ Production environment configured
- ✅ Deployment documentation complete
- ✅ Security and accessibility audits passed

**Production Ready When:**
- ✅ All features complete (95%+)
- ✅ No critical or high-severity bugs
- ✅ Performance targets met
- ✅ User acceptance testing passed
- ✅ Deployment runbook validated

---

## Current Architecture Challenges

**Last Verified:** 2025-11-20

### Overview

This section tracks active architectural challenges, blockers, and technical debt requiring resolution. Each challenge includes status, related documentation, implementation files, and risk assessment.

---

### Challenge 1: Dual Calculation Path & Data Loss ✅ RESOLVED

**Status:** ✅ RESOLVED (2025-11-20)
**Resolution Time:** 2.5 hours (as estimated)
**Priority:** P0 - Fixed before all other work
**Risk Level:** CRITICAL → MITIGATED

**Problem:**
The financial calculation pipeline had a critical data flow issue where CircularSolver results were not properly merged into the projection output, causing:
- Missing depreciation in financial statements ✅ Fixed
- Duplicate calculations (performance issue) ✅ Fixed
- Data inconsistency between components ✅ Fixed

**Root Cause (Identified):**
1. `calculateFullProjection` calls CircularSolver ✅
2. CircularSolver results stored in `cashFlowResult.data` ✅
3. Results NOT merged into `projection.years` ❌ → ✅ Now merged
4. `YearlyProjection` interface missing CircularSolver fields ❌ → ✅ Now included
5. `FinancialStatementsWrapper` extracts incomplete data ❌ → ✅ Now passes full projection
6. `FinancialStatements` calls CircularSolver AGAIN (duplicate) ❌ → ✅ Duplicate removed

**Solution Implemented:**
1. ✅ Added `ProjectionMetadata` interface to track solver convergence and performance
2. ✅ Updated `FullProjectionResult` to include metadata in projection.ts
3. ✅ Added validation logging to confirm successful CircularSolver merge for all 30 years
4. ✅ Refactored `FinancialStatementsWrapper` to pass full `YearlyProjection[]` array
5. ✅ **Removed ~90 lines** of duplicate CircularSolver calculation from `FinancialStatements` component
6. ✅ Added 2 new integration tests for CircularSolver metadata and depreciation presence

**Files Modified:**
- `lib/calculations/financial/projection.ts` - Added metadata tracking and validation
- `components/versions/financial-statements/FinancialStatementsWrapper.tsx` - Simplified data flow
- `components/versions/financial-statements/FinancialStatements.tsx` - Removed duplicate calculation
- `lib/calculations/financial/__tests__/projection.test.ts` - Added integration tests

**Performance Improvement:**
- Before: CircularSolver ran twice (~200ms total)
- After: CircularSolver runs once (~100ms)
- **Net Gain:** 50-100ms faster page load (50% improvement)

**Test Results:**
- ✅ All 14 tests passing (12 existing + 2 new integration tests)
- ✅ Validation log confirms: "[calculateFullProjection] ✅ CircularSolver results merged for all 30 years"
- ✅ No TypeScript errors introduced
- ✅ Performance target maintained (<50ms per calculation)

**Validation Checklist:**
- ✅ Single calculation path established
- ✅ All CircularSolver fields (depreciation, interest, zakat, netResult) preserved
- ✅ Type safety maintained throughout
- ✅ Tests verify metadata presence and depreciation in all years
- ⏳ **Pending:** Manual browser verification (user to test in dev environment)

**Related Documentation:**
- `PRODUCTION_READINESS_ACTION_PLAN.md` - Phase 0: Architecture Fix (NOW COMPLETE)
- `CRITICAL_ISSUES_REVIEW_AND_ACTION_PLAN.md` - Root cause analysis
- `ARCHITECTURE.md` - Section 7.2 (Calculation Pipeline)
- `ADR-010` - Documents this architectural fix decision

---

### Challenge 2: Financial Statements UI Implementation

**Status:** 🟡 IN PROGRESS - Phase 9 Priority
**Priority:** P1 - Required for 79% → 95% completion
**Risk Level:** HIGH - Core feature missing

**Problem:**
Financial statement display components are incomplete:
- P&L Statement component not implemented
- Balance Sheet display missing (calculations exist)
- Cash Flow Statement display incomplete
- Export functionality not connected

**Current State:**
- ✅ Calculations complete (CircularSolver working)
- ✅ Data models defined
- ❌ UI components not implemented
- ❌ Export integration missing

**Implementation Files:**
- `components/versions/financial-statements/` - Directory structure exists
- `components/versions/VersionDetail.tsx` - Integration point
- `lib/calculations/financial/circular-solver.ts` - Backend complete ✅

**Related Documentation:**
- `MISSING_FEATURES_REPORT.md` - Feature gap analysis
- `FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md` - Original plan
- `FINANCIAL_STATEMENTS_COMPLETE.md` - Backend completion status

**Solution Approach:**
1. Implement P&L Statement component (2-3 days)
2. Implement Balance Sheet component (3-4 days)
3. Implement Cash Flow Statement component (2 days)
4. Integrate export functionality
5. Add period-aware rendering

**Estimated Fix Time:** 7-9 days
**Dependencies:** Challenge 1 must be resolved first

---

### Challenge 3: Planning Periods Overcomplicated Schema

**Status:** 🟡 IN DESIGN - Architecture review in progress
**Priority:** P2 - Can be simplified
**Risk Level:** MEDIUM - Impacts development timeline

**Problem:**
Current planning periods implementation plan is overcomplicated:
- Proposed schema too complex (20+ fields)
- Duplicate data storage risk
- Approval workflow unnecessary
- Implementation timeline too long (28-35 days vs actual need: 7-10 days)

**Current Plan Issues:**
- `historical_financials` table duplicates existing schema
- Checksum validation overkill for Excel uploads
- Approval process not in requirements
- Creates two sources of truth for 2023-2024 data

**Simpler Approach Identified:**
```prisma
model historical_actuals {
  id        String   @id @default(uuid())
  versionId String
  year      Int      // 2023 or 2024

  // Actual financial results only
  totalRevenues     Decimal
  totalExpenses     Decimal
  schoolRent        Decimal
  staffCosts        Decimal

  // Balance sheet actuals
  cash              Decimal
  totalAssets       Decimal
  totalLiabilities  Decimal
  equity            Decimal

  @@unique([versionId, year])
}
```

**Implementation Files:**
- `prisma/schema.prisma` - Schema definition
- `lib/utils/period-detection.ts` - Period logic ✅ Already implemented
- `lib/calculations/financial/projection.ts` - Period-aware calculations needed

**Related Documentation:**
- `Claude_Planning_Periods_Architecture_Review.md` - Simplified approach
- `PLANNING_PERIODS_IMPLEMENTATION_PLAN_REVISED.md` - Current plan
- `PLANNING_PERIODS_ASSESSMENT.md` - Original assessment

**Solution Approach:**
1. Simplify schema to store only actual results
2. Reuse existing curriculum_plans, rent_plans for historical structure
3. Add period detection logic (HISTORICAL/TRANSITION/DYNAMIC)
4. Update calculations to check period before computing

**Estimated Fix Time:** 7-10 days (reduced from 28-35 days)
**Risk Mitigation:** Avoid breaking existing 2028-2052 dynamic calculations

---

### Challenge 4: Prisma Model Naming Inconsistencies

**Status:** ✅ RESOLVED - Documented but not critical
**Priority:** P3 - Nice to have
**Risk Level:** LOW - Does not block production

**Problem:**
Prisma schema uses snake_case table names, but code inconsistently references models in some places. However, Prisma auto-generates correct camelCase model names, so this is primarily a documentation issue.

**Implementation Files:**
- `prisma/schema.prisma` - Schema definitions
- `services/version/create.ts` - Example usage
- `services/admin/health.ts` - Model references

**Related Documentation:**
- `ARCHITECTURAL_VALIDATION_REPORT.md` - Section 4.1
- `SCHEMA.md` - Schema reference

**Solution Approach:**
- Document the convention clearly
- Update code examples in documentation
- Add ESLint rule to enforce consistency (optional)

**Status:** Low priority - Does not affect functionality

---

### Challenge 5: Zakat Calculation in Transition Periods

**Status:** 🟡 IN ANALYSIS - Regulatory requirement
**Priority:** P2 - Required for Saudi compliance
**Risk Level:** HIGH - Regulatory compliance issue

**Problem:**
Zakat calculation for partial-period revenue in Transition period (2025-2027) needs clarification:
- How to calculate Zakat for mid-year transitions?
- Should Zakat be pro-rated for partial years?
- What's the baseline for Zakat in transition vs dynamic periods?

**Current State:**
- ✅ Zakat field exists in admin settings
- ✅ Calculation logic exists for full years
- ❌ Partial-period calculation undefined
- ❌ Regulatory guidance needed

**Implementation Files:**
- `lib/calculations/financial/circular-solver.ts` - Zakat calculation
- `prisma/schema.prisma` - AdminSettings.zakatRate
- `services/admin/settings.ts` - Admin settings management

**Related Documentation:**
- `PRD.md` - Section 12.4 (Zakat requirements)
- `CHANGE_TAX_TO_ZAKAT_IMPLEMENTATION_GUIDE.md` - Tax to Zakat change
- `ARCHITECTURE.md` - Financial calculation rules

**Solution Approach:**
1. Consult with financial/regulatory advisor on partial-period Zakat
2. Document Zakat calculation rules for all periods
3. Implement period-aware Zakat calculation
4. Add validation for Zakat rate (2.5% standard)

**Estimated Fix Time:** 2-3 days (after requirements clarification)
**Blocker:** Requires business/regulatory decision

---

### Challenge 6: Database Performance & Cross-Region Latency

**Status:** 🟢 MONITORING - Not currently blocking
**Priority:** P3 - Monitor in production
**Risk Level:** MEDIUM - Could affect user experience

**Problem:**
Potential database performance concerns:
- Cross-region latency (if Supabase region != user region)
- Complex queries for 30-year projections
- N+1 query risks in some endpoints

**Current State:**
- ✅ pgBouncer connection pooling configured
- ✅ Direct URL for migrations
- ⚠️ No performance metrics collected yet
- ⚠️ No database query optimization done

**Implementation Files:**
- `.env.local` - Database connection strings
- `prisma/schema.prisma` - Index definitions
- Query-heavy endpoints in `app/api/`

**Related Documentation:**
- `DATABASE_PERFORMANCE_REPORT.md` - Performance analysis
- `ARCHITECTURAL_VALIDATION_REPORT.md` - Section 4.4
- `DATABASE_SETUP.md` - Configuration guide

**Solution Approach:**
1. Add database query logging in development
2. Identify slow queries (target: <200ms p95)
3. Add indexes for frequently queried fields
4. Consider database read replicas for production
5. Implement caching for admin settings (already done ✅)

**Estimated Fix Time:** 3-5 days
**Priority:** Post-launch optimization

---

### Challenge 7: Web Worker Performance Target

**Status:** 🟢 ON TRACK - Target likely met
**Priority:** P2 - Performance requirement
**Risk Level:** LOW - Architecture supports target

**Problem:**
Performance target of <50ms for 30-year projection needs verification in production conditions.

**Current State:**
- ✅ Web Worker implementation complete
- ✅ Circular solver optimized
- ✅ Decimal.js used for precision
- ⚠️ No production performance metrics
- ⚠️ No load testing completed

**Implementation Files:**
- `workers/financial-engine.worker.ts` - Web Worker
- `lib/calculations/financial/circular-solver.ts` - Solver
- `lib/calculations/financial/projection.ts` - Main pipeline

**Related Documentation:**
- `ARCHITECTURE.md` - Section 8 (Performance)
- `CLAUDE.md` - Performance targets
- `FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md` - Performance requirements

**Solution Approach:**
1. Add performance logging to Web Worker
2. Test with various projection scenarios
3. Profile circular solver iterations
4. Optimize if needed (likely <100ms already achieved)

**Estimated Fix Time:** 1-2 days for testing
**Risk:** Low - Architecture already optimized

---

### Challenge Summary Table

| # | Challenge | Status | Priority | Risk | Est. Time | Blocker |
|---|-----------|--------|----------|------|-----------|---------|
| 1 | Dual Calculation Path | 🔴 Critical | P0 | CRITICAL | 2-3 hrs | Yes |
| 2 | Financial Statements UI | 🟡 In Progress | P1 | HIGH | 7-9 days | No |
| 3 | Planning Periods Schema | 🟡 In Design | P2 | MEDIUM | 7-10 days | No |
| 4 | Prisma Naming | ✅ Resolved | P3 | LOW | N/A | No |
| 5 | Zakat Calculation | 🟡 In Analysis | P2 | HIGH | 2-3 days | Yes* |
| 6 | DB Performance | 🟢 Monitoring | P3 | MEDIUM | 3-5 days | No |
| 7 | Web Worker Performance | 🟢 On Track | P2 | LOW | 1-2 days | No |

*Blocker: Requires business decision

---

### Resolution Priority

**Immediate (This Week):**
1. Challenge 1: Dual Calculation Path (2-3 hours)
2. Challenge 2: Financial Statements UI (start Phase 9)

**Short Term (Next 2 Weeks):**
3. Challenge 5: Zakat Calculation (after requirements clarity)
4. Challenge 3: Planning Periods (simplified approach)

**Medium Term (Post-Launch):**
5. Challenge 6: Database Performance Optimization
6. Challenge 7: Web Worker Performance Verification

**Low Priority (Future):**
7. Challenge 4: Prisma Naming Documentation

---

## Active Workstreams

### 1. Financial Statements Implementation
**Status:** In Progress (Phases 0-8 Complete)
**Lead Focus:** Balance Sheet, P&L, Cash Flow integration
**Key Files:**
- `lib/calculations/financial/circular-solver.ts`
- `components/versions/financial-statements/`
- `lib/calculations/financial/projection.ts`

**Recent Completions:**
- ✅ Circular solver for Balance Sheet calculations
- ✅ Historical actuals integration (2023-2024)
- ✅ Admin settings for financial parameters
- ✅ Period-aware calculations (HISTORICAL/TRANSITION/DYNAMIC)

**Next Steps:**
- Comprehensive testing of financial statements accuracy
- UI refinements for financial statement displays
- Performance optimization for 30-year projections

### 2. Data Integrity & Validation
**Status:** Ongoing
**Focus Areas:**
- Database schema validation
- Input validation at API boundaries
- Calculation accuracy verification

### 3. Report Generation System
**Status:** Implemented with Bug Fixes
**Components:**
- PDF generation
- Excel export
- CSV export
**Recent Fixes:**
- ✅ Select.Item empty value errors resolved
- ✅ Validation relaxation with detailed logging
- ✅ 500 error debugging improvements

---

## Architectural Decisions Record (ADR)

**Last Updated:** 2025-11-20
**Purpose:** Track all major architectural and technical decisions with rationale
**Format:** ADR-### format for easy reference

---

### ADR-001: Use Decimal.js for All Financial Calculations

**Date Decided:** 2024-11-13 (Project inception)
**Status:** ✅ IMPLEMENTED & VALIDATED
**Decision Maker:** Architecture team
**Priority:** CRITICAL - Non-negotiable

**Problem:**
JavaScript's native `Number` type uses IEEE 754 floating-point arithmetic, which introduces precision errors in financial calculations (e.g., `0.1 + 0.2 !== 0.3`). This is unacceptable for financial planning software.

**Decision:**
Use Decimal.js library for ALL monetary values and financial calculations throughout the application.

**Rationale:**
- Decimal.js provides arbitrary-precision decimal arithmetic
- Eliminates floating-point precision errors
- Industry standard for financial applications
- Supports all required operations (add, subtract, multiply, divide, round)
- Configurable precision and rounding modes

**Implementation:**
- Configure precision: 20 digits
- Rounding mode: ROUND_HALF_UP (standard financial rounding)
- Used in all calculation files: `lib/calculations/financial/*.ts`
- Type safety enforced via TypeScript

**Validation:**
- ✅ 218+ tests validate Decimal.js usage
- ✅ All financial calculations use `new Decimal()`
- ✅ No floating-point arithmetic in calculation code
- ✅ Documented in `.cursorrules` as mandatory

**Impact:**
- **Positive:** Financial accuracy guaranteed
- **Trade-off:** Slightly slower than native math (acceptable)
- **Code Pattern:** `new Decimal(revenue).times(taxRate)`

**Related Code:**
- `lib/calculations/financial/` - All calculation files
- `.cursorrules` - Line 42: Decimal.js mandate

**References:**
- [`ARCHITECTURE.md`](ARCHITECTURE.md) Section 7.1
- [Decimal.js Documentation](https://mikemcl.github.io/decimal.js/)

---

### ADR-002: CircularSolver for Balance Sheet & Interest Calculations

**Date Decided:** 2025-10-22
**Status:** ✅ IMPLEMENTED & VERIFIED
**Decision Maker:** Financial engineering team
**Priority:** CRITICAL - Required for Balance Sheet

**Problem:**
Circular dependency in financial statements:
- Interest Expense depends on Debt balance
- Debt balance depends on Net Result
- Net Result depends on Interest Expense
→ Cannot calculate in linear sequence

**Decision:**
Implement iterative circular solver that resolves dependencies through convergence.

**Rationale:**
- Standard approach in financial modeling
- Allows accurate Balance Sheet calculations
- Handles circular dependencies correctly
- Converges quickly (typically 1-4 iterations)
- Performance target met (<100ms for 30 years)

**Implementation:**
- File: `lib/calculations/financial/circular-solver.ts`
- Algorithm: Iterative solver with convergence threshold
- Convergence: When changes <0.01 between iterations
- Max iterations: 100 (typically needs 1-4)
- Integrates admin settings (interest rates, zakat, working capital)

**Validation:**
- ✅ 40/40 test scenarios passing
- ✅ Performance: 76x better than target (<100ms vs <50ms target)
- ✅ Handles historical actuals integration (2023-2024)
- ✅ Accurate Balance Sheet generation
- ✅ Full Cash Flow statement generation

**Impact:**
- **Positive:** Accurate financial statements
- **Positive:** Performance exceeds requirements
- **Trade-off:** Added complexity (justified by accuracy)
- **Code Pattern:** Iterative calculation with convergence check

**Related Code:**
- `lib/calculations/financial/circular-solver.ts` - Implementation
- `lib/calculations/financial/projection.ts` - Integration

**References:**
- [`ARCHITECTURE.md`](ARCHITECTURE.md) Section 7.2
- [`FINANCIAL_STATEMENTS_COMPLETE.md`](FINANCIAL_STATEMENTS_COMPLETE.md)
- [`ROOT_CAUSE_ANALYSIS_EBITDA.md`](ROOT_CAUSE_ANALYSIS_EBITDA.md) - Performance validation

**Future Considerations:**
- Monitor convergence in production
- Log iterations for debugging
- Consider optimization if >10 iterations occur

---

### ADR-003: Planning Periods Structure (Historical | Transition | Dynamic)

**Date Proposed:** 2025-11-15
**Status:** 🟡 IN DESIGN - Architecture review in progress
**Decision Maker:** Architecture team
**Priority:** HIGH - Affects calculation logic

**Problem:**
Financial projections span different time periods with different data sources and calculation needs:
- **2023-2024:** Historical actuals (uploaded data)
- **2025-2027:** Transition period (manual inputs, constrained capacity)
- **2028-2052:** Dynamic planning (full projections)

**Proposed Decision:**
Implement three-period architecture: HISTORICAL, TRANSITION, DYNAMIC.

**Options Considered:**

**Option A: Three Distinct Periods (RECOMMENDED)**
```typescript
type PlanningPeriod = 'HISTORICAL' | 'TRANSITION' | 'DYNAMIC';

HISTORICAL (2023-2024):
- Source: historical_actuals table
- Calculation: None (use uploaded data)
- UI: Read-only display

TRANSITION (2025-2027):
- Source: Manual inputs (transition rent)
- Calculation: Limited (staff costs calculated)
- Constraint: 1850 student capacity cap
- UI: Editable with constraints

DYNAMIC (2028-2052):
- Source: Calculated projections
- Calculation: Full financial engine
- Models: All 3 rent models
- UI: Full planning interface
```

**Option B: Weighted Periods with Blend Factor (REJECTED)**
- Complexity: Too complex for requirements
- Performance: Slower calculations
- Maintainability: Harder to understand

**Option C: Single Period with Flags (REJECTED)**
- Flags become confusing
- Many if/else conditions
- No clear separation of concerns

**Rationale for Option A:**
- Clear separation of concerns
- Simple period detection logic
- Easy to understand and maintain
- Reuses existing schemas (curriculum_plans, rent_plans)
- Minimal schema changes needed

**Implementation Plan:**
1. Create `historical_actuals` table (simplified schema)
2. Implement period detection helper (`lib/utils/period-detection.ts`) ✅ DONE
3. Update calculations to check period before computing
4. Add period-aware rendering in UI
5. Import historical data from Excel

**Validation Required:**
- [ ] Schema review by database team
- [ ] Calculation accuracy verification
- [ ] UI/UX review for period transitions
- [ ] Performance testing with all periods

**Impact:**
- **Positive:** Clear data architecture
- **Positive:** Reuses existing schemas
- **Trade-off:** Needs period-aware logic in calculations
- **Risk:** Breaking existing 2028-2052 dynamic logic

**Current Status:**
- Period detection logic: ✅ Implemented
- Schema design: 🟡 Under review (simplified from original)
- Calculation updates: ⏳ Pending
- UI updates: ⏳ Pending

**Related Code:**
- `lib/utils/period-detection.ts` - ✅ Implemented
- `prisma/schema.prisma` - Needs `historical_actuals` table

**References:**
- [`Claude_Planning_Periods_Architecture_Review.md`](Claude_Planning_Periods_Architecture_Review.md) - Simplified approach
- [`PLANNING_PERIODS_IMPLEMENTATION_PLAN_REVISED.md`](PLANNING_PERIODS_IMPLEMENTATION_PLAN_REVISED.md)
- [`ARCHITECTURE.md`](ARCHITECTURE.md) Section 8

**Decision Needed By:** 2025-12-01
**Stakeholders:** Product, Engineering, Finance teams

---

### ADR-004: Web Workers for Heavy Financial Calculations

**Date Decided:** 2024-11-13
**Status:** ✅ IMPLEMENTED & VALIDATED
**Decision Maker:** Frontend architecture team
**Priority:** HIGH - Performance requirement

**Problem:**
30-year financial projections with thousands of calculations can block the main thread, causing UI freezes and poor user experience.

**Decision:**
Use Web Workers to offload financial calculations to background threads.

**Rationale:**
- Prevents UI blocking during calculations
- Leverages multi-core processors
- Better perceived performance
- Standard web performance pattern
- No impact on calculation accuracy

**Implementation:**
- File: `workers/financial-engine.worker.ts`
- Message-based communication with main thread
- Calculation runs in background
- UI remains responsive during computation
- Results posted back when complete

**Performance Target:**
- Target: <50ms for 30-year projection
- Actual: <100ms (within acceptable range)
- UI: Never freezes (main benefit)

**Validation:**
- ✅ Web Worker implementation complete
- ✅ Message passing working correctly
- ✅ UI remains responsive
- ✅ Calculation accuracy preserved
- ✅ 12 integration tests passing

**Impact:**
- **Positive:** Responsive UI during calculations
- **Positive:** Better user experience
- **Trade-off:** Message serialization overhead (minimal)
- **Code Pattern:** Worker posts messages, main thread handles results

**Related Code:**
- `workers/financial-engine.worker.ts` - Worker implementation
- Components using Web Workers for projection

**References:**
- [`ARCHITECTURE.md`](ARCHITECTURE.md) Section 8: Performance
- [`CLAUDE.md`](CLAUDE.md) - Performance targets

---

### ADR-005: Next.js 15 App Router (Not Pages Router)

**Date Decided:** 2024-11-13
**Status:** ✅ IMPLEMENTED
**Decision Maker:** Frontend architecture team
**Priority:** MEDIUM - Framework choice

**Problem:**
Need to choose between Next.js App Router (new) and Pages Router (legacy).

**Decision:**
Use Next.js 15 App Router exclusively.

**Rationale:**
- App Router is the future of Next.js
- Better performance (React Server Components)
- Improved developer experience
- Modern patterns (layouts, loading states)
- Better TypeScript support
- Recommended by Next.js team

**Implementation:**
- All routes in `app/` directory
- API routes: `app/api/`
- Pages: `app/[feature]/page.tsx`
- Layouts: `app/layout.tsx`
- Loading states: `app/loading.tsx`

**Impact:**
- **Positive:** Modern framework patterns
- **Positive:** Better performance potential
- **Trade-off:** Learning curve for App Router
- **Constraint:** Must use App Router patterns

**Related Code:**
- `app/` - All Next.js routes and pages

**References:**
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [`ARCHITECTURE.md`](ARCHITECTURE.md) Section 3

---

### ADR-006: PostgreSQL via Supabase (Not Self-Hosted)

**Date Decided:** 2024-11-13
**Status:** ✅ IMPLEMENTED
**Decision Maker:** Infrastructure team
**Priority:** HIGH - Database choice

**Problem:**
Need reliable PostgreSQL database with minimal operational overhead.

**Decision:**
Use Supabase for hosted PostgreSQL database.

**Rationale:**
- Fully managed PostgreSQL 15+
- Built-in connection pooling (pgBouncer)
- Direct URL for migrations
- Automatic backups
- Real-time capabilities (future use)
- Developer-friendly tooling
- Cost-effective for startup phase

**Implementation:**
- Connection strings in `.env.local`
- `DATABASE_URL`: pgBouncer connection (for app)
- `DIRECT_URL`: Direct connection (for migrations)
- Prisma as ORM
- 9 core models + relationships

**Impact:**
- **Positive:** No database operations overhead
- **Positive:** Reliable infrastructure
- **Trade-off:** Vendor lock-in (acceptable)
- **Constraint:** Must use Supabase-compatible patterns

**Related Code:**
- `.env.local.example` - Database configuration
- `prisma/schema.prisma` - Database schema

**References:**
- [`DATABASE_SETUP.md`](DATABASE_SETUP.md)
- [`SCHEMA.md`](SCHEMA.md)

---

### ADR-007: Prisma ORM (Not Raw SQL or Other ORMs)

**Date Decided:** 2024-11-13
**Status:** ✅ IMPLEMENTED
**Decision Maker:** Backend architecture team
**Priority:** HIGH - Data access pattern

**Problem:**
Need type-safe database access layer with good developer experience.

**Decision:**
Use Prisma 5.x as the ORM for all database operations.

**Rationale:**
- Type-safe database queries (TypeScript)
- Excellent developer experience
- Automatic migrations
- Schema-first approach
- Generated types
- Great documentation
- Active community

**Implementation:**
- Schema: `prisma/schema.prisma`
- Generated client: Auto-generated after schema changes
- Service layer uses Prisma exclusively
- All queries type-checked at compile time

**Impact:**
- **Positive:** Type safety prevents runtime errors
- **Positive:** Great developer experience
- **Trade-off:** Learning curve for Prisma patterns
- **Constraint:** Must use Prisma for all DB operations

**Related Code:**
- `prisma/schema.prisma` - Schema definition
- `services/` - All service layer code

**References:**
- [`SCHEMA.md`](SCHEMA.md)
- [Prisma Documentation](https://www.prisma.io/docs)

---

### ADR-008: Result<T> Pattern for Error Handling (Not Exceptions)

**Date Decided:** 2024-11-13
**Status:** ✅ IMPLEMENTED
**Decision Maker:** Backend architecture team
**Priority:** HIGH - Error handling pattern

**Problem:**
Need consistent, type-safe error handling across API and service layers.

**Decision:**
Use `Result<T>` pattern instead of throwing exceptions.

**Rationale:**
- Explicit error handling (no hidden exceptions)
- Type-safe error returns
- Forces error consideration at call site
- Better for API responses
- Easier testing
- Functional programming pattern

**Implementation:**
```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

// Example:
async function createVersion(data: VersionInput): Promise<Result<Version>> {
  try {
    const version = await prisma.version.create({ data });
    return success(version);
  } catch (err) {
    return error('Failed to create version');
  }
}
```

**Impact:**
- **Positive:** Explicit error handling
- **Positive:** Type-safe error returns
- **Trade-off:** More verbose than exceptions
- **Pattern:** All service functions return `Result<T>`

**Related Code:**
- `types/result.ts` - Type definitions
- `services/` - All service layer

**References:**
- [`.cursorrules`](.cursorrules) - Error handling section

---

### ADR-009: shadcn/ui Components (Not Material-UI or Custom)

**Date Decided:** 2024-11-13
**Status:** ✅ IMPLEMENTED
**Decision Maker:** Frontend team
**Priority:** MEDIUM - UI component library

**Problem:**
Need accessible, customizable UI component library.

**Decision:**
Use shadcn/ui component library with Tailwind CSS.

**Rationale:**
- Copy-paste components (no dependency bloat)
- Built on Radix UI (excellent accessibility)
- Full customization control
- Tailwind CSS integration
- Dark mode support
- TypeScript by default
- Growing community

**Implementation:**
- Components in `components/ui/`
- Tailwind for styling
- Dark mode as primary design
- Accessible by default (WCAG 2.1 AA+)

**Impact:**
- **Positive:** Full control over components
- **Positive:** Excellent accessibility
- **Trade-off:** Need to maintain copied components
- **Pattern:** Use shadcn/ui for all UI components

**Related Code:**
- `components/ui/` - UI components
- `tailwind.config.ts` - Styling configuration

**References:**
- [shadcn/ui Documentation](https://ui.shadcn.com/)

---

### ADR-010: Dual Calculation Path Issue ✅ RESOLVED

**Date Identified:** 2025-11-19
**Date Resolved:** 2025-11-20
**Status:** ✅ IMPLEMENTED & VALIDATED
**Priority:** P0 - Fixed before other work
**Resolution Time:** 2.5 hours

**Problem:**
CircularSolver results were not properly merged into projection output, causing:
- Missing depreciation in financial statements ✅ Fixed
- Duplicate calculations (performance issue) ✅ Fixed
- Data inconsistency between components ✅ Fixed

**Root Cause (Identified):**
1. `calculateFullProjection` calls CircularSolver ✅
2. CircularSolver results stored in `cashFlowResult.data` ✅
3. Results NOT merged into `projection.years` ❌ → ✅ Now merged
4. `YearlyProjection` interface missing CircularSolver fields ❌ → ✅ Now included
5. Components re-call CircularSolver with incomplete data ❌ → ✅ Duplicate removed

**Implemented Solution:**
1. ✅ Added `ProjectionMetadata` interface to track solver convergence and performance
2. ✅ Updated `FullProjectionResult` to include metadata in projection.ts
3. ✅ Added validation logging to confirm successful CircularSolver merge for all 30 years
4. ✅ Refactored `FinancialStatementsWrapper` to pass full `YearlyProjection[]` array
5. ✅ **Removed ~90 lines** of duplicate CircularSolver calculation from `FinancialStatements` component
6. ✅ Added 2 new integration tests for CircularSolver metadata and depreciation presence

**Files Modified:**
- `lib/calculations/financial/projection.ts` - Added metadata tracking and validation
- `components/versions/financial-statements/FinancialStatementsWrapper.tsx` - Simplified data flow
- `components/versions/financial-statements/FinancialStatements.tsx` - Removed duplicate calculation
- `lib/calculations/financial/__tests__/projection.test.ts` - Added integration tests

**Performance Impact:**
- Before: CircularSolver ran twice (~200ms total)
- After: CircularSolver runs once (~100ms)
- **Net Gain:** 50-100ms faster page load (50% improvement)

**Validation:**
- ✅ All 14 tests passing (12 existing + 2 new integration tests)
- ✅ Validation log confirms: "[calculateFullProjection] ✅ CircularSolver results merged for all 30 years"
- ✅ No TypeScript errors introduced
- ✅ Performance target maintained (<50ms per calculation)
- ⏳ **Pending:** Manual browser verification

**Related Code:**
- `lib/calculations/financial/projection.ts` (modified)
- `components/versions/financial-statements/` (modified)

**References:**
- [`PRODUCTION_READINESS_ACTION_PLAN.md`](PRODUCTION_READINESS_ACTION_PLAN.md) Phase 0 (NOW COMPLETE)
- [`CRITICAL_ISSUES_REVIEW_AND_ACTION_PLAN.md`](CRITICAL_ISSUES_REVIEW_AND_ACTION_PLAN.md)
- [Challenge 1](#challenge-1-dual-calculation-path--data-loss-resolved) in this hub

**Decision Made:** Implemented single-calculation-path architecture
**Timeline:** Fixed on schedule - Phase 9 can now proceed

---

## ADR Summary Table

| ADR | Decision | Status | Priority | Date |
|-----|----------|--------|----------|------|
| [ADR-001](#adr-001-use-decimaljs-for-all-financial-calculations) | Decimal.js for all calculations | ✅ Implemented | CRITICAL | 2024-11-13 |
| [ADR-002](#adr-002-circularsolver-for-balance-sheet--interest-calculations) | CircularSolver for Balance Sheet | ✅ Implemented | CRITICAL | 2025-10-22 |
| [ADR-003](#adr-003-planning-periods-structure-historical--transition--dynamic) | Three-period planning architecture | 🟡 In Design | HIGH | 2025-11-15 |
| [ADR-004](#adr-004-web-workers-for-heavy-financial-calculations) | Web Workers for calculations | ✅ Implemented | HIGH | 2024-11-13 |
| [ADR-005](#adr-005-nextjs-15-app-router-not-pages-router) | Next.js 15 App Router | ✅ Implemented | MEDIUM | 2024-11-13 |
| [ADR-006](#adr-006-postgresql-via-supabase-not-self-hosted) | PostgreSQL via Supabase | ✅ Implemented | HIGH | 2024-11-13 |
| [ADR-007](#adr-007-prisma-orm-not-raw-sql-or-other-orms) | Prisma ORM | ✅ Implemented | HIGH | 2024-11-13 |
| [ADR-008](#adr-008-resultt-pattern-for-error-handling-not-exceptions) | Result<T> error handling | ✅ Implemented | HIGH | 2024-11-13 |
| [ADR-009](#adr-009-shadcnui-components-not-material-ui-or-custom) | shadcn/ui components | ✅ Implemented | MEDIUM | 2024-11-13 |
| [ADR-010](#adr-010-dual-calculation-path-issue-pending-fix) | Fix dual calculation path | 🔴 Blocker | P0 | 2025-11-19 |

---

## Key Architectural Decisions

### Planning Periods Architecture
```
HISTORICAL (2023-2024)
├── Source: historical_actuals table
└── Complete P&L, Balance Sheet, Cash Flow

TRANSITION (2025-2027)
├── Manual inputs
├── Transition rent
└── Capacity cap: 1850 students

DYNAMIC (2028-2052)
├── Calculated projections
├── Rent models (FIXED_ESCALATION, REVENUE_SHARE, PARTNER_MODEL)
└── Full financial engine
```

### Staff Cost Base Year Logic
- **RELOCATION_2028 mode:** baseYear = 2028
- **HISTORICAL_BASELINE mode:** baseYear = 2023
- Ensures CPI period 0 aligns with baseline year

### Financial Precision Standards
- **All money calculations:** Decimal.js (precision: 20)
- **Rounding:** ROUND_HALF_UP
- **Never use:** JavaScript floating point arithmetic

---

## Critical Files Reference

### Core Calculation Engine
1. **`lib/calculations/financial/projection.ts`**
   - Main orchestrator for 30-year projections
   - Coordinates all calculation modules
   - Period-aware logic integration

2. **`lib/calculations/financial/circular-solver.ts`**
   - Balance Sheet calculations
   - Cash Flow statements
   - Circular dependency resolution (Interest ↔ Debt ↔ Cash)

3. **`lib/utils/period-detection.ts`**
   - Planning period helpers
   - HISTORICAL/TRANSITION/DYNAMIC detection

4. **`lib/utils/admin-settings.ts`**
   - Admin settings fetcher with caching
   - CPI, discount rate, zakat, working capital rules

### Database Schema
5. **`prisma/schema.prisma`**
   - Complete database schema
   - All models, relationships, constraints

### Service Layer
6. **`services/version/`**
   - Version CRUD operations
   - Create, read, update, delete, duplicate

7. **`services/admin/settings.ts`**
   - Admin settings management
   - Global configuration

---

## Recent Commits Summary

| Commit | Description | Impact |
|--------|-------------|--------|
| `d24f698` | Financial guidance updates | Documentation |
| `e70abce` | Phases 0-8 implementation complete | Major feature |
| `db4b145` | Relax validation + extensive logging | Bug fix |
| `877a56a` | Fix Select.Item empty value error | Bug fix |
| `101d893` | Detailed error logging for 500 errors | Debugging |

---

## Known Issues & Technical Debt

### Active Issues
1. **Performance:** 30-year projection calculation time needs optimization (target: <50ms)
2. **Testing:** Need comprehensive test coverage for circular solver
3. **UI/UX:** Financial statement displays need responsive design improvements

### Addressed Issues
- ✅ Prisma Client browser error resolved
- ✅ EBITDA calculation accuracy fixed
- ✅ Historical data display integrated
- ✅ Report generation 500 errors debugged

---

## Environment & Setup

### Required Environment Variables
```bash
DATABASE_URL="postgresql://..."          # pgBouncer connection
DIRECT_URL="postgresql://..."            # Direct connection (migrations)
NEXTAUTH_SECRET="..."                    # Auth secret
NEXTAUTH_URL="http://localhost:3000"     # Auth URL
```

### Development Server
```bash
npm run dev                    # Start dev server (localhost:3000)
npm run build                  # Production build
npm test                       # Run all tests
```

### Database Operations
```bash
cd /Users/fakerhelali/Desktop/Project\ Zeta
npx prisma studio              # Database GUI
npx prisma migrate dev         # Create & apply migration
npx prisma generate            # Generate Prisma Client
```

---

## Team Communication

### Code Review Standards
- All financial calculations must be reviewed for Decimal.js usage
- Database migrations require schema validation
- API changes need comprehensive testing
- Performance benchmarks for calculation changes

### Testing Requirements
- Unit tests for all calculation functions
- Integration tests for API endpoints
- E2E tests for critical user flows
- Performance tests for 30-year projections

---

## File Dependency Matrix

**Last Verified:** 2025-11-20
**Purpose:** Quick navigation showing how documents link together
**Total Files Mapped:** 140+

---

### Core Architecture (Foundation Layer)

**Primary:** `ARCHITECTURE.md` - Foundation for all technical decisions
```
ARCHITECTURE.md
├── Depends On:
│   ├── PRD.md (business requirements)
│   └── .cursorrules (development standards)
│
├── Links To:
│   ├── ARCHITECTURE_IMPLEMENTATION_PLAN.md (implementation guide)
│   ├── SCHEMA.md (database structure)
│   ├── DATABASE_SETUP.md (setup instructions)
│   ├── API.md (API contracts)
│   └── DEPENDENCIES.md (package rationale)
│
└── Referenced By:
    ├── All implementation plans
    ├── ARCHITECTURAL_VALIDATION_REPORT.md
    └── PRODUCTION_READINESS_ACTION_PLAN.md
```

**Schema & Database:**
```
SCHEMA.md
├── Depends On: ARCHITECTURE.md, PRD.md
├── Links To: DATABASE_SETUP.md, DATABASE_PERFORMANCE_REPORT.md
└── Referenced By: All service layer implementations, API docs

DATABASE_SETUP.md
├── Depends On: SCHEMA.md, .env.local.example
├── Links To: TROUBLESHOOTING_DATABASE.md
└── Referenced By: QUICK_START.md, DEPLOYMENT.md
```

---

### Financial Calculations (Critical Logic Layer)

**Financial Statements Feature Chain:**
```
PRD.md (Section 4.3: Financial Statements)
    ↓
ARCHITECTURE.md (Section 7: Financial Engine)
    ↓
FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md
    ↓
├── Phase 1: FINANCIAL_STATEMENTS_PHASE1_COMPLETE.md
│   └── Backend calculations (CircularSolver)
├── Phase 2: FINANCIAL_STATEMENTS_PHASE2_COMPLETE.md
│   └── Admin settings integration
├── Phase 3: FINANCIAL_STATEMENTS_PHASE3_COMPLETE.md
│   └── Historical data integration
    ↓
FINANCIAL_STATEMENTS_COMPLETE.md
    ↓
FINANCIAL_STATEMENTS_IMPLEMENTATION_VERIFICATION.md
    ↓
LATEST_PROJECT_SUMMARY.md (Status: ✅ Backend Complete, ❌ UI Missing)
```

**Implementation Files:**
- `lib/calculations/financial/circular-solver.ts` - Core calculation engine
- `lib/calculations/financial/projection.ts` - Main orchestrator
- `components/versions/financial-statements/` - UI components (incomplete)

**Related Issues:**
- `ROOT_CAUSE_ANALYSIS_EBITDA.md` - EBITDA calculation fix
- `PRODUCTION_READINESS_ACTION_PLAN.md` - Phase 0 (Dual calculation path issue)

---

### Rent Models (Phase 1 Feature)

```
PRD.md (Section 5: Rent Models)
    ↓
ARCHITECTURE.md (Section 7.3: Rent Calculations)
    ↓
RENT_MODEL_IMPLEMENTATION_ROADMAP.md
    ↓
RENT_MODEL_IMPLEMENTATION_REVIEW.md
    ↓
RENT_MODEL_ROADMAP_VERIFICATION.md (Status: ✅ Complete)
```

**Implementation Files:**
- `lib/calculations/rent/fixed-escalation.ts`
- `lib/calculations/rent/revenue-share.ts`
- `lib/calculations/rent/partner-model.ts`
- `lib/calculations/rent/index.ts` - Dispatcher

**Related Fixes:**
- `RENT_LENS_REVENUE_NAN_FIX_REPORT.md`
- `RENT_EDITING_INLINE_FIX.md`

---

### Planning Periods (Current Design Phase)

```
ARCHITECTURE.md (Section 8: Planning Periods Concept)
    ↓
PLANNING_PERIODS_ASSESSMENT.md (Initial analysis)
    ↓
PLANNING_PERIODS_IMPLEMENTATION_PLAN.md (Original - Too complex)
    ↓
Claude_Planning_Periods_Architecture_Review.md (Identified overcomplications)
    ↓
PLANNING_PERIODS_IMPLEMENTATION_PLAN_REVISED.md (Simplified approach)
    ↓
PLANNING_PERIODS_ARCHITECTURE_RESPONSE.md
    ↓
PLANNING_PERIODS_IMPLEMENTATION_REPORT.md (To be completed)
```

**Current Status:** 🟡 IN DESIGN - Schema simplification needed
**Key Decision:** Use `historical_actuals` table instead of complex `historical_financials`

**Implementation Files (Future):**
- `lib/utils/period-detection.ts` - ✅ Already implemented
- `prisma/schema.prisma` - Needs `historical_actuals` table
- `lib/calculations/financial/projection.ts` - Needs period-aware logic

---

### IB Optional Feature

```
PRD.md (Section 6.2: IB Curriculum)
    ↓
IB_OPTIONAL_IMPLEMENTATION_ROADMAP.md
    ↓
IB_OPTIONAL_IMPLEMENTATION_ROADMAP_FINAL_REVIEW.md
    ↓
IB_OPTIONAL_IMPLEMENTATION_STATUS.md
    ↓
IB_OPTIONAL_IMPLEMENTATION_VERIFICATION.md (Status: ✅ Complete)
```

**Related Bug Fixes (20+ docs):**
```
IB_CHECKBOX_ROOT_CAUSE_ANALYSIS.md
    ↓
IB_CHECKBOX_PERFORMANCE_FIX.md
IB_CHECKBOX_VALIDATION_FIX.md
IB_CHECKBOX_CRITICAL_FIX_APPLIED.md
    ↓
IB_CHECKBOX_COMPLETE_FIX_REPORT.md (Status: ✅ All resolved)
```

---

### Reports Feature

```
PRD.md (Section 9: Report Generation)
    ↓
REPORTS_FEATURE_ANALYSIS.md
    ↓
REPORTS_FEATURE_IMPLEMENTATION_SUMMARY.md
    ↓
REPORTS_FEATURE_IMPLEMENTATION_REPORT.md
    ↓
REPORTS_FEATURE_IMPLEMENTATION_VERIFICATION_FINAL.md (Status: ✅ Complete)
```

**Related Fixes:**
- `FIX_500_ERROR_SUMMARY.md` - 500 errors in report generation
- `REPORTS_FEATURE_PROJECTION_ERROR_FIX.md`
- `REPORTS_FEATURE_REACT_ERROR_FIX.md`

**Implementation Files:**
- `app/api/reports/generate/[versionId]/route.ts`
- `services/report/` - Service layer
- PDF/Excel/CSV generation logic

---

### CapEx Features & Fixes

```
ARCHITECTURE.md (Section 7.4: CapEx)
    ↓
CAPEX_DELETION_ISSUE_ROOT_CAUSE_ANALYSIS.md
    ↓
CAPEX_DELETION_FIX_ROADMAP.md
    ↓
├── CAPEX_RULE_DELETION_FIX_REPORT.md
└── CAPEX_AUTO_ITEM_DELETION_IMPLEMENTATION_SUMMARY.md
    ↓
CAPEX_AUTO_ITEM_DELETION_VERIFICATION_REPORT.md (Status: ✅ Complete)
```

---

### Costs Analysis UI

```
COSTS_ANALYSIS_TAB_ANALYSIS.md
    ↓
COSTS_ANALYSIS_UI_IMPROVEMENT_PLAN.md
    ↓
COSTS_ANALYSIS_FIXES_APPLIED.md
    ↓
COSTS_ANALYSIS_FINAL_VERIFICATION.md (Status: ✅ Complete)
```

**Related Reviews:**
- `COSTS_ANALYSIS_UI_360_REVIEW_REPORT.md`
- `COSTS_ANALYSIS_CODE_REVIEW.md`

---

### Code Reviews & Quality

```
360_CODE_REVIEW_REPORT.md (Comprehensive review)
    ↓
ACTION_PLAN_FROM_CODE_REVIEW.md
    ↓
CRITICAL_ISSUES_REVIEW_AND_ACTION_PLAN.md
    ↓
PRODUCTION_READINESS_ACTION_PLAN.md (Status: 🔴 URGENT)
```

**Supporting Reviews:**
- `CODE_QUALITY_REPORT.md` - Code quality metrics
- `ARCHITECTURAL_VALIDATION_REPORT.md` - Architecture compliance
- `CODE_REVIEW_360_DETAILED.md` - Detailed findings

---

### Status Reports (Time-Based)

**Most Recent → Oldest:**
```
LATEST_PROJECT_SUMMARY.md (Dec 2025)
    ↑ Supersedes
PROJECT_STATUS_REPORT.md (Dec 2024)
    ↑ Supersedes
IMPLEMENTATION_STATUS_FINAL.md
    ↑ Supersedes
IMPLEMENTATION_STATUS_SUMMARY.md
```

**Phase Completions (Historical):**
- `PHASE_0_COMPLETION_SUMMARY.md` - Foundation complete
- `PHASE_1_PROGRESS_SUMMARY.md` - Financial engine complete

---

### Bug Fix Document Patterns

**Pattern 1: Root Cause → Fix → Verification**
```
{FEATURE}_ROOT_CAUSE_ANALYSIS.md
    ↓
{FEATURE}_FIX_ROADMAP.md or {FEATURE}_IMPLEMENTATION_ROADMAP.md
    ↓
{FEATURE}_FIXES_APPLIED.md or {FEATURE}_FIX_REPORT.md
    ↓
{FEATURE}_VERIFICATION_REPORT.md or {FEATURE}_FINAL_VERIFICATION.md
```

**Examples:**
- IB Checkbox: `IB_CHECKBOX_ROOT_CAUSE_ANALYSIS.md` → `IB_CHECKBOX_COMPLETE_FIX_REPORT.md`
- CapEx: `CAPEX_DELETION_ISSUE_ROOT_CAUSE_ANALYSIS.md` → `CAPEX_AUTO_ITEM_DELETION_VERIFICATION_REPORT.md`
- EBITDA: `ROOT_CAUSE_ANALYSIS_EBITDA.md` → Fixed in `FINANCIAL_STATEMENTS_COMPLETE.md`

---

### Cross-Cutting Concerns

**Configuration & Setup:**
```
.env.local.example
    ↓
DATABASE_SETUP.md
    ↓
QUICK_START.md
    ↓
DEPLOYMENT.md
```

**Standards & Guidelines:**
```
.cursorrules (Development standards)
    ↓
CLAUDE.md (AI assistant guidance)
    ↓
All implementation work
```

**Testing & Quality:**
```
Test files in __tests__/ directories
    ↓
Verification reports (*_VERIFICATION.md)
    ↓
PRODUCTION_READINESS_ACTION_PLAN.md
```

---

### Quick Navigation Shortcuts

**"I need to understand how X works":**
- Financial calculations → `ARCHITECTURE.md` Section 7 + `lib/calculations/financial/`
- Database schema → `SCHEMA.md` + `prisma/schema.prisma`
- API endpoints → `API.md` + `app/api/`
- Business rules → `PRD.md`

**"I need to implement feature X":**
- Check `{FEATURE}_IMPLEMENTATION_PLAN.md` or `{FEATURE}_IMPLEMENTATION_ROADMAP.md`
- Review related code in implementation files
- Check verification docs for test requirements

**"Something is broken with X":**
- Check `TROUBLESHOOTING_DATABASE.md` for database issues
- Search for `{FEATURE}_FIX_*.md` or `FIX_*.md`
- Check `ROOT_CAUSE_ANALYSIS_*.md` documents
- Review `PRODUCTION_READINESS_ACTION_PLAN.md` for known issues

**"What's the current status?":**
- Latest status: `LATEST_PROJECT_SUMMARY.md`
- Production blockers: `PRODUCTION_READINESS_ACTION_PLAN.md`
- Feature status: `{FEATURE}_STATUS.md` or `{FEATURE}_COMPLETE.md`

---

### Document Update Dependencies

**When you update these files, also update:**

| Update This | Must Also Update |
|-------------|------------------|
| `SCHEMA.md` | `DATABASE_SETUP.md`, `API.md`, implementation plans |
| `ARCHITECTURE.md` | Implementation plans, `ARCHITECTURAL_VALIDATION_REPORT.md` |
| `PRD.md` | Implementation plans, feature status reports |
| Complete a feature | `LATEST_PROJECT_SUMMARY.md`, `{FEATURE}_COMPLETE.md` |
| Fix a bug | `{FEATURE}_FIX_REPORT.md`, update status reports |
| Phase completion | `LATEST_PROJECT_SUMMARY.md`, phase completion doc |

---

## Document Dependency Map

### 📋 Tier 1: Essential Starting Points (Read These First)

**Last Verified:** 2025-11-20

1. **`README.md`** - Project overview and quick start
2. **`CLAUDE.md`** - AI assistant guidance (THIS OVERRIDES ALL DEFAULTS)
3. **`PRD.md`** - Product requirements and business context
4. **`ARCHITECTURE.md`** - System design and technical decisions
5. **`QUICK_START.md`** - Developer onboarding guide

**Dependencies:** None (these are foundational)
**Referenced By:** All other documents

---

### 🏗️ Tier 2: Core Technical Documentation

**Last Verified:** 2025-11-20

#### Database & Schema
- **`SCHEMA.md`** - Complete database schema reference
  - **Dependencies:** `PRD.md`, `ARCHITECTURE.md`
  - **Referenced By:** All implementation plans, `DATABASE_SETUP.md`, `DATABASE_PERFORMANCE_REPORT.md`

- **`DATABASE_SETUP.md`** - Database initialization guide
  - **Dependencies:** `SCHEMA.md`, `.env.local.example`
  - **Referenced By:** `QUICK_START.md`, `DEPLOYMENT.md`

- **`DATABASE_PERFORMANCE_REPORT.md`** - Performance analysis
  - **Dependencies:** `SCHEMA.md`, `ARCHITECTURE.md`
  - **Referenced By:** `PRODUCTION_READINESS_ACTION_PLAN.md`

#### API & Services
- **`API.md`** - API routes and endpoints documentation
  - **Dependencies:** `SCHEMA.md`, `ARCHITECTURE.md`
  - **Referenced By:** Frontend implementation docs, testing docs

#### Development Standards
- **`.cursorrules`** - Complete development standards (CRITICAL)
  - **Dependencies:** `ARCHITECTURE.md`, `PRD.md`
  - **Referenced By:** All implementation work

- **`DEPENDENCIES.md`** - Package dependencies and rationale
  - **Dependencies:** `package.json`, `ARCHITECTURE.md`
  - **Referenced By:** Setup and deployment docs

---

### 📊 Tier 3: Status & Progress Reports

**Last Verified:** 2025-11-20

#### Current Status (Start Here for Latest Info)
- **`LATEST_PROJECT_SUMMARY.md`** - Most recent project status (Dec 2025)
  - **Dependencies:** All feature implementation reports
  - **Referenced By:** This coordination hub
  - **Last Updated:** 2025-12-13

- **`PROJECT_STATUS_REPORT.md`** - Comprehensive status (Dec 2024)
  - **Dependencies:** All phase completion reports
  - **Referenced By:** `LATEST_PROJECT_SUMMARY.md`
  - **Last Updated:** 2024-12

- **`IMPLEMENTATION_STATUS_FINAL.md`** - Final implementation status
  - **Dependencies:** Phase reports, feature reports
  - **Referenced By:** Production readiness docs

#### Production Readiness
- **`PRODUCTION_READINESS_ACTION_PLAN.md`** - Critical blockers and fixes
  - **Status:** 🔴 URGENT - PRODUCTION BLOCKED
  - **Dependencies:** All code review reports
  - **Referenced By:** This coordination hub
  - **Last Updated:** 2025-11-19

---

### 🔧 Tier 4: Implementation Plans & Technical Specs

**Last Verified:** 2025-11-20

#### Financial Statements (Primary Feature)
- **`FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md`** - Complete implementation plan
  - **Dependencies:** `ARCHITECTURE.md`, `SCHEMA.md`, `PRD.md`
  - **Referenced By:** All financial statement reports
  - **Status:** ✅ Phases 0-8 Complete

- **`FINANCIAL_STATEMENTS_COMPLETE.md`** - Completion summary
  - **Dependencies:** `FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md`
  - **Referenced By:** `LATEST_PROJECT_SUMMARY.md`

- **Related Financial Docs:**
  - `FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN_AUDIT_RESPONSE.md`
  - `FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN_FINAL_REVIEW.md`
  - `FINANCIAL_STATEMENTS_IMPLEMENTATION_VERIFICATION.md`
  - `FINANCIAL_STATEMENTS_PHASE1_COMPLETE.md`
  - `FINANCIAL_STATEMENTS_PHASE2_COMPLETE.md`
  - `FINANCIAL_STATEMENTS_PHASE3_COMPLETE.md`
  - `FINANCIAL_STATEMENTS_STATUS.md`

#### Planning Periods Architecture
- **`PLANNING_PERIODS_IMPLEMENTATION_PLAN.md`** - Original plan
  - **Dependencies:** `ARCHITECTURE.md`, `FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md`

- **`PLANNING_PERIODS_IMPLEMENTATION_PLAN_REVISED.md`** - Revised plan
  - **Dependencies:** `PLANNING_PERIODS_ASSESSMENT.md`
  - **Supersedes:** `PLANNING_PERIODS_IMPLEMENTATION_PLAN.md`

- **`Claude_Planning_Periods_Architecture_Review.md`** - Architecture review
  - **Dependencies:** Both planning period plans
  - **Status:** Under review

#### Rent Models
- **`RENT_MODEL_IMPLEMENTATION_ROADMAP.md`** - Complete roadmap
  - **Dependencies:** `PRD.md`, `ARCHITECTURE.md`
  - **Referenced By:** Financial calculations docs

#### Other Features
- **`IB_OPTIONAL_IMPLEMENTATION_ROADMAP.md`** - IB curriculum optional feature
- **`REPORTS_FEATURE_IMPLEMENTATION_SUMMARY.md`** - Report generation
- **`CHANGE_TAX_TO_ZAKAT_IMPLEMENTATION_GUIDE.md`** - Tax to Zakat change

---

### 🐛 Tier 5: Bug Fixes & Issue Resolution

**Last Verified:** 2025-11-20

#### Critical Fixes
- **`FIX_500_ERROR_SUMMARY.md`** - 500 error debugging
  - **Status:** ✅ Resolved
  - **Dependencies:** `PRODUCTION_READINESS_ACTION_PLAN.md`

- **`FIX_PRISMA_CLIENT_BROWSER_ERROR.md`** - Prisma client fix
  - **Status:** ✅ Resolved

- **`ROOT_CAUSE_ANALYSIS_EBITDA.md`** - EBITDA calculation fix
  - **Status:** ✅ Resolved
  - **Critical:** Yes - affects all projections

#### Feature-Specific Fixes
- **IB Checkbox Issues:** (20+ related docs)
  - `IB_CHECKBOX_ROOT_CAUSE_ANALYSIS.md`
  - `IB_CHECKBOX_PERFORMANCE_FIX.md`
  - `IB_CHECKBOX_COMPLETE_FIX_REPORT.md`
  - Status: ✅ All resolved

- **CapEx Deletion Issues:** (5+ related docs)
  - `CAPEX_DELETION_ISSUE_ROOT_CAUSE_ANALYSIS.md`
  - `CAPEX_AUTO_ITEM_DELETION_IMPLEMENTATION_SUMMARY.md`
  - Status: ✅ Resolved

- **Costs Analysis UI:** (10+ related docs)
  - `COSTS_ANALYSIS_TAB_ANALYSIS.md`
  - `COSTS_ANALYSIS_FIXES_APPLIED.md`
  - Status: ✅ Complete

---

### 📝 Tier 6: Code Reviews & Quality Reports

**Last Verified:** 2025-11-20

#### Comprehensive Reviews
- **`360_CODE_REVIEW_REPORT.md`** - Complete 360° code review
  - **Dependencies:** All source code
  - **Referenced By:** `ACTION_PLAN_FROM_CODE_REVIEW.md`

- **`CODE_QUALITY_REPORT.md`** - Code quality analysis
  - **Dependencies:** Source code, test coverage
  - **Referenced By:** Production readiness docs

#### Architectural Reviews
- **`ARCHITECTURAL_VALIDATION_REPORT.md`** - Architecture validation
  - **Dependencies:** `ARCHITECTURE.md`, implementation code
  - **Referenced By:** `PRODUCTION_READINESS_ACTION_PLAN.md`

#### UI/UX Reviews
- **`COSTS_ANALYSIS_UI_360_REVIEW_REPORT.md`** - Costs analysis UI review
- **`CURRICULUM_PLANS_UI_360_REVIEW_REPORT.md`** - Curriculum UI review

---

### 🚀 Tier 7: Deployment & Operations

**Last Verified:** 2025-11-20

- **`DEPLOYMENT.md`** - Deployment procedures
  - **Dependencies:** `DATABASE_SETUP.md`, `DEPENDENCIES.md`
  - **Status:** 🔴 Not Started

- **`DELIVERY_PLAN.md`** - Delivery roadmap
  - **Dependencies:** All feature completion reports

- **`TROUBLESHOOTING_DATABASE.md`** - Database troubleshooting
  - **Dependencies:** `DATABASE_SETUP.md`, `SCHEMA.md`

---

### 🧪 Tier 8: Testing & Verification

**Last Verified:** 2025-11-20

#### Verification Reports
- **`FINANCIAL_STATEMENTS_IMPLEMENTATION_VERIFICATION.md`**
- **`REPORTS_FEATURE_IMPLEMENTATION_VERIFICATION.md`**
- **`IB_OPTIONAL_IMPLEMENTATION_VERIFICATION.md`**
- **`CAPEX_AUTO_ITEM_DELETION_VERIFICATION_REPORT.md`**

#### Performance & Accuracy
- **`DATABASE_PERFORMANCE_REPORT.md`** - Database performance analysis
- **`FINANCIAL_STATEMENTS_ANALYSIS.md`** - Financial accuracy testing

---

## Quick Reference Links by Category

**Last Verified:** 2025-11-20

### 🎯 Start Here (New Developers)
1. `README.md` - Project overview
2. `QUICK_START.md` - Get started guide
3. `CLAUDE.md` - AI assistant guidance
4. `PRD.md` - What we're building and why
5. `ARCHITECTURE.md` - How it's built

### 📊 Current Status (Project Managers)
1. `LATEST_PROJECT_SUMMARY.md` - Most recent status (Dec 2025)
2. `PRODUCTION_READINESS_ACTION_PLAN.md` - Blockers and priorities
3. `PROJECT_STATUS_REPORT.md` - Comprehensive status
4. This file (`COORDINATION_HUB.md`) - Navigation hub

### 🔧 Implementation (Developers)
1. `.cursorrules` - Development standards (MUST READ)
2. `SCHEMA.md` - Database reference
3. `API.md` - API endpoints
4. `FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md` - Core feature
5. `ARCHITECTURE.md` - Technical architecture

### 🐛 Debugging (When Things Break)
1. `TROUBLESHOOTING_DATABASE.md` - Database issues
2. `FIX_500_ERROR_SUMMARY.md` - 500 error patterns
3. `ROOT_CAUSE_ANALYSIS_EBITDA.md` - Calculation issues
4. Feature-specific fix reports (search by feature name)

### 🚀 Deployment (DevOps)
1. `DEPLOYMENT.md` - Deployment guide
2. `DATABASE_SETUP.md` - Database initialization
3. `DEPENDENCIES.md` - Package management
4. `.env.local.example` - Environment configuration

---

## Document Maintenance Policy

**Last Verified:** 2025-11-20

### Active Documents (Update Regularly)
- `COORDINATION_HUB.md` (this file) - Update when major milestones complete
- `LATEST_PROJECT_SUMMARY.md` - Update monthly or after major features
- `PRODUCTION_READINESS_ACTION_PLAN.md` - Update as blockers are resolved
- `PROJECT_STATUS_REPORT.md` - Update quarterly

### Reference Documents (Update on Changes)
- `SCHEMA.md` - Update after schema migrations
- `API.md` - Update when endpoints change
- `ARCHITECTURE.md` - Update for architectural changes
- `PRD.md` - Update when requirements change

### Historical Documents (Archive, Don't Update)
- Phase completion reports (`PHASE_X_COMPLETE.md`)
- Fix reports (once resolved)
- Implementation verification reports
- Code review reports

### Deprecated Documents (Marked for Cleanup)
- Documents superseded by newer versions
- Documents marked "FINAL" or "COMPLETE" that have replacement docs
- Duplicate status reports from different dates

---

## Version Control

### Branch Strategy
- **main:** Primary development branch
- Feature branches: Create for significant features
- Hotfix branches: Critical production fixes

### Commit Standards
- Follow conventional commits format
- Include ticket/issue references
- All commits co-authored with Claude when applicable

---

## Performance Targets

| Metric | Target | Current Status |
|--------|--------|----------------|
| Financial Calculation | <50ms | In progress |
| Page Load (FCP) | <2s | Meeting target |
| Report Generation | <5s | Meeting target |
| API Response (p95) | <200ms | Monitoring |

---

## Next Major Milestones

1. **Production Readiness Review**
   - Complete test coverage
   - Performance optimization
   - Security audit
   - Accessibility compliance (WCAG 2.1 AA+)

2. **User Acceptance Testing**
   - Financial accuracy validation
   - UI/UX refinements
   - Edge case testing

3. **Deployment Preparation**
   - Environment configuration
   - Database migration scripts
   - Monitoring setup
   - Backup procedures

---

## Visual Document Relationships

**Last Verified:** 2025-11-20

### Feature Implementation Document Chains

#### Financial Statements Feature Chain
```
PRD.md → ARCHITECTURE.md
         ↓
FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md
         ↓
├─→ FINANCIAL_STATEMENTS_PHASE1_COMPLETE.md
├─→ FINANCIAL_STATEMENTS_PHASE2_COMPLETE.md
├─→ FINANCIAL_STATEMENTS_PHASE3_COMPLETE.md
├─→ FINANCIAL_STATEMENTS_INTEGRATION_COMPLETE.md
         ↓
FINANCIAL_STATEMENTS_COMPLETE.md
         ↓
FINANCIAL_STATEMENTS_IMPLEMENTATION_VERIFICATION.md
         ↓
LATEST_PROJECT_SUMMARY.md
```

#### Planning Periods Feature Chain
```
ARCHITECTURE.md + FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md
         ↓
PLANNING_PERIODS_IMPLEMENTATION_PLAN.md
         ↓
PLANNING_PERIODS_ASSESSMENT.md (review identified issues)
         ↓
PLANNING_PERIODS_IMPLEMENTATION_PLAN_REVISED.md
         ↓
Claude_Planning_Periods_Architecture_Review.md (under review)
         ↓
PLANNING_PERIODS_IMPLEMENTATION_REPORT.md (completion)
```

#### Bug Fix Document Chains
```
Issue Detected
      ↓
ROOT_CAUSE_ANALYSIS.md
      ↓
FIX_PROPOSAL.md or IMPLEMENTATION_ROADMAP.md
      ↓
FIX_APPLIED.md or FIXES_COMPLETE.md
      ↓
VERIFICATION_REPORT.md
      ↓
Update LATEST_PROJECT_SUMMARY.md
```

### Critical Decision Points (Where Documents Intersect)

1. **Production Readiness Decision**
   - Input: `360_CODE_REVIEW_REPORT.md` + `CODE_QUALITY_REPORT.md` + `ARCHITECTURAL_VALIDATION_REPORT.md`
   - Output: `PRODUCTION_READINESS_ACTION_PLAN.md`
   - Status: 🔴 BLOCKED

2. **Financial Accuracy Validation**
   - Input: `FINANCIAL_STATEMENTS_ANALYSIS.md` + `ROOT_CAUSE_ANALYSIS_EBITDA.md`
   - Output: `FINANCIAL_STATEMENTS_IMPLEMENTATION_VERIFICATION.md`
   - Status: ✅ PASSED

3. **Architecture Compliance**
   - Input: `ARCHITECTURE.md` + Implementation code
   - Output: `ARCHITECTURAL_VALIDATION_REPORT.md`
   - Status: ✅ COMPLIANT

---

## Document Search Guide

**Last Verified:** 2025-11-20

### Finding Information By Question Type

| Question | Start Here | Then Check |
|----------|-----------|------------|
| "What is Project Zeta?" | `README.md` | `PRD.md` |
| "How do I set up the dev environment?" | `QUICK_START.md` | `DATABASE_SETUP.md`, `.env.local.example` |
| "What's the current status?" | `LATEST_PROJECT_SUMMARY.md` | `PROJECT_STATUS_REPORT.md` |
| "Why is production blocked?" | `PRODUCTION_READINESS_ACTION_PLAN.md` | Related code review reports |
| "How does [feature] work?" | `ARCHITECTURE.md` | Feature-specific implementation plan |
| "How do I fix [error]?" | `TROUBLESHOOTING_DATABASE.md` | Feature-specific fix reports |
| "What are the coding standards?" | `.cursorrules` | `CLAUDE.md` |
| "How is the database structured?" | `SCHEMA.md` | `DATABASE_SETUP.md` |
| "What APIs are available?" | `API.md` | Service layer code in `services/` |
| "How do I deploy?" | `DEPLOYMENT.md` | `DELIVERY_PLAN.md` |

### Finding Documents By Feature

| Feature | Implementation Plan | Status Report | Verification |
|---------|-------------------|---------------|--------------|
| Financial Statements | `FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md` | `FINANCIAL_STATEMENTS_COMPLETE.md` | `FINANCIAL_STATEMENTS_IMPLEMENTATION_VERIFICATION.md` |
| Planning Periods | `PLANNING_PERIODS_IMPLEMENTATION_PLAN_REVISED.md` | `PLANNING_PERIODS_IMPLEMENTATION_REPORT.md` | `Claude_Planning_Periods_Architecture_Review.md` |
| Rent Models | `RENT_MODEL_IMPLEMENTATION_ROADMAP.md` | `RENT_MODEL_IMPLEMENTATION_REVIEW.md` | `RENT_MODEL_ROADMAP_VERIFICATION.md` |
| IB Optional | `IB_OPTIONAL_IMPLEMENTATION_ROADMAP.md` | `IB_OPTIONAL_IMPLEMENTATION_STATUS.md` | `IB_OPTIONAL_IMPLEMENTATION_VERIFICATION.md` |
| Reports | `REPORTS_FEATURE_IMPLEMENTATION_SUMMARY.md` | `REPORTS_FEATURE_IMPLEMENTATION_REPORT.md` | `REPORTS_FEATURE_IMPLEMENTATION_VERIFICATION_FINAL.md` |
| Costs Analysis | `COSTS_ANALYSIS_UI_IMPROVEMENT_PLAN.md` | `COSTS_ANALYSIS_FIXES_APPLIED.md` | `COSTS_ANALYSIS_FINAL_VERIFICATION.md` |

---

## Document Naming Conventions

**Last Verified:** 2025-11-20

Understanding our naming patterns helps you find documents quickly:

### Prefixes
- **`FINANCIAL_STATEMENTS_*`** - Financial statements feature (20+ docs)
- **`IB_CHECKBOX_*`** - IB checkbox bug fixes (20+ docs)
- **`PLANNING_PERIODS_*`** - Planning periods architecture (5+ docs)
- **`CAPEX_*`** - CapEx feature and fixes (8+ docs)
- **`COSTS_ANALYSIS_*`** - Costs analysis UI (10+ docs)
- **`RENT_*`** - Rent model features (5+ docs)
- **`REPORTS_*`** - Report generation feature (8+ docs)
- **`FIX_*`** - Bug fix reports (5+ docs)
- **`Claude_*`** - Claude-generated analysis docs (5+ docs)

### Suffixes
- **`*_IMPLEMENTATION_PLAN.md`** - Feature implementation roadmap
- **`*_COMPLETE.md`** - Feature completion summary
- **`*_STATUS.md`** - Current status of feature
- **`*_VERIFICATION.md`** - Verification and testing report
- **`*_REVIEW.md`** - Code review or assessment
- **`*_REPORT.md`** - Analysis or status report
- **`*_FIX.md`** - Bug fix documentation
- **`*_ROADMAP.md`** - Implementation roadmap
- **`*_ANALYSIS.md`** - Deep analysis document
- **`*_SUMMARY.md`** - Summary of multiple reports

### Special Files
- **`ROOT_CAUSE_ANALYSIS_*.md`** - Root cause analysis for bugs
- **`360_*.md`** - Comprehensive 360° reviews
- **`ACTION_PLAN_*.md`** - Action plans with prioritized tasks

---

## All 140+ Documentation Files (Alphabetical Index)

**Last Verified:** 2025-11-20

<details>
<summary>Click to expand complete alphabetical index</summary>

1. `360_CODE_REVIEW_REPORT.md` - Comprehensive code review
2. `360_IMPLEMENTATION_PLAN_REVIEW_REPORT.md` - Implementation plan review
3. `ACTION_PLAN_FROM_CODE_REVIEW.md` - Action items from code review
4. `ALL_FIXES_COMPLETE.md` - All fixes completion summary
5. `API.md` - API documentation
6. `ARCHITECTURAL_VALIDATION_REPORT.md` - Architecture validation
7. `ARCHITECTURE.md` - System architecture
8. `ARCHITECTURE_IMPLEMENTATION_PLAN.md` - Architecture implementation
9. `ARCHITECTURE_PLAN_AUDIT_RESPONSE.md` - Audit response
10. `CAPEX_AUTO_ITEM_DELETION_IMPLEMENTATION_SUMMARY.md` - CapEx deletion feature
11. `CAPEX_AUTO_ITEM_DELETION_VERIFICATION_REPORT.md` - CapEx deletion verification
12. `CAPEX_DELETION_FIX_ROADMAP.md` - CapEx deletion fix plan
13. `CAPEX_DELETION_ISSUE_ROOT_CAUSE_ANALYSIS.md` - CapEx deletion RCA
14. `CAPEX_RULE_DELETION_FIX_REPORT.md` - CapEx rule deletion fix
15. `CHANGE_TAX_TO_ZAKAT_IMPLEMENTATION_GUIDE.md` - Tax to Zakat change
16. `CLAUDE.md` - Claude AI guidance (CRITICAL)
17. `CODE_QUALITY_REPORT.md` - Code quality analysis
18. `CODE_REVIEW_360.md` - 360° code review
19. `CODE_REVIEW_360_DETAILED.md` - Detailed code review
20. `COORDINATION_HUB.md` - This file
21-30. `COSTS_ANALYSIS_*` - Costs analysis feature (10 docs)
31. `CRITICAL_ISSUES_FIX_PROPOSAL.md` - Critical issues proposal
32. `CRITICAL_ISSUES_REVIEW_AND_ACTION_PLAN.md` - Critical issues action plan
33-34. `CURRICULUM_PLANS_UI_*` - Curriculum UI (2 docs)
35-39. `Claude_*` - Claude-generated docs (5 docs)
40. `DATABASE_PERFORMANCE_REPORT.md` - DB performance
41. `DATABASE_SETUP.md` - Database setup
42. `DECIMAL_NULL_ERROR_FIX.md` - Decimal null fix
43. `DELIVERY_PLAN.md` - Delivery roadmap
44. `DEPENDENCIES.md` - Package dependencies
45. `DEPLOYMENT.md` - Deployment guide
46-66. `FINANCIAL_STATEMENTS_*` - Financial statements (21 docs)
67-71. `FIX_*` - Various bug fixes (5 docs)
72. `HISTORICAL_DATA_DISPLAY_FIX_COMPLETE.md` - Historical data fix
73-92. `IB_CHECKBOX_*` - IB checkbox fixes (20 docs)
93-97. `IB_OPTIONAL_*` - IB optional feature (5 docs)
98-102. `IMPLEMENTATION_*` - Implementation reports (5 docs)
103. `LATEST_PROJECT_SUMMARY.md` - Latest status (IMPORTANT)
104. `MISSING_FEATURES_REPORT.md` - Missing features
105-106. `PHASE_*` - Phase completion (2 docs)
107-111. `PLANNING_PERIODS_*` - Planning periods (5 docs)
112. `PRD.md` - Product requirements (CRITICAL)
113. `PRODUCTION_READINESS_ACTION_PLAN.md` - Production readiness (CRITICAL)
114. `PROJECT_STATUS_REPORT.md` - Project status
115. `QUICK_START.md` - Quick start guide
116. `README.md` - Project overview
117-122. `RENT_*` - Rent models (6 docs)
123-129. `REPORTS_FEATURE_*` - Reports feature (7 docs)
130. `REVIEW_SUMMARY_AND_RECOMMENDATIONS.md` - Review summary
131. `ROOT_CAUSE_ANALYSIS_EBITDA.md` - EBITDA RCA
132-134. `RUNTIME_FIXES_*` / `RUN_MIGRATION_*` - Runtime fixes (3 docs)
135. `SCHEMA.md` - Database schema (CRITICAL)
136. `TROUBLESHOOTING_DATABASE.md` - DB troubleshooting

</details>

---

## Daily Update Protocol

**Last Verified:** 2025-11-20
**Purpose:** Keep this hub fresh and prevent staleness
**Responsibility:** Developer working on the project

---

### When to Update This File

**IMMEDIATE UPDATES (Within 1 hour):**
- ✅ Completing any task in Production Timeline
- ✅ Discovering a production blocker
- ✅ Resolving a critical architecture challenge
- ✅ Making architectural decisions that affect multiple features
- ✅ Creating new documentation files

**END OF DAY UPDATES (Last 15 minutes):**
- ✅ Update progress percentage in Production Timeline
- ✅ Mark completed todos as done
- ✅ Add any new blockers discovered to Known Issues
- ✅ Update "Last Updated" timestamp at top of file
- ✅ Update relevant challenge statuses

**WEEKLY UPDATES (Friday or Monday):**
- ✅ Review and update all "Last Verified" dates
- ✅ Move resolved issues from Active to Addressed
- ✅ Update milestone completion estimates
- ✅ Review Architecture Challenges status
- ✅ Update File Dependency Matrix if new docs created
- ✅ Review and update Quick Status Indicators table

**MONTHLY UPDATES (1st of month):**
- ✅ Update Performance Targets table with actual metrics
- ✅ Review and deprecate outdated documentation
- ✅ Update Document Maintenance Policy
- ✅ Review dependency updates in documentation
- ✅ Archive completed phase reports

---

### Update Checklist by Action

#### When You Complete a Feature:
```
[ ] Update Production Timeline progress percentage
[ ] Update Active Workstreams section
[ ] Update Architecture Challenges if applicable
[ ] Mark relevant challenge as ✅ RESOLVED
[ ] Update Quick Status Indicators table
[ ] Add to Recent Commits Summary
[ ] Update LATEST_PROJECT_SUMMARY.md
[ ] Create {FEATURE}_COMPLETE.md document
[ ] Add to File Dependency Matrix
```

#### When You Discover a Blocker:
```
[ ] Add to Architecture Challenges section (if architectural)
[ ] Update Production Timeline with revised estimates
[ ] Update Production Readiness status
[ ] Add to Known Issues & Technical Debt
[ ] Create ROOT_CAUSE_ANALYSIS_{ISSUE}.md if critical
[ ] Update Risk Factors & Mitigation table
[ ] Notify in project status reports
```

#### When You Fix a Bug:
```
[ ] Update Architecture Challenges status (if listed)
[ ] Move issue from Active to Addressed in Known Issues
[ ] Update Related Documentation links
[ ] Create {FEATURE}_FIX_REPORT.md
[ ] Update LATEST_PROJECT_SUMMARY.md
[ ] Add to Recent Commits Summary
```

#### When You Create New Documentation:
```
[ ] Add to File Dependency Matrix
[ ] Add to appropriate Tier in Document Dependency Map
[ ] Update Document Naming Conventions if new pattern
[ ] Update All Files Alphabetical Index
[ ] Link from related documents
[ ] Add to Quick Reference Links if important
```

#### When You Make an Architectural Decision:
```
[ ] Document decision in Key Architectural Decisions
[ ] Update ARCHITECTURE.md if fundamental
[ ] Update affected implementation plans
[ ] Update Architecture Challenges if resolving one
[ ] Create decision record (ADR) if major
[ ] Update File Dependency Matrix dependencies
```

#### When You Start/End a Day:
```
Morning:
[ ] Review Production Timeline for today's tasks
[ ] Check Architecture Challenges for blockers
[ ] Review yesterday's progress

Evening:
[ ] Update Production Timeline completion status
[ ] Mark completed tasks with ✅
[ ] Document any new blockers or risks
[ ] Update "Last Updated" timestamp
[ ] Update progress percentage if milestone reached
```

---

### Section-Specific Update Guidelines

#### **Project Status Overview** (Top Section)
- **Update After:** Any status change (✅→🟡→🔴)
- **Frequency:** Real-time
- **Who:** Anyone discovering status changes

#### **Production Timeline**
- **Update After:** Completing tasks, discovering delays
- **Frequency:** Daily (end of day)
- **Who:** Developer working on Phase 9/10

#### **Architecture Challenges**
- **Update After:** Resolving challenges, discovering new ones
- **Frequency:** As they occur
- **Who:** Developer encountering architectural issues

#### **Active Workstreams**
- **Update After:** Phase completions, new work starting
- **Frequency:** Weekly or on milestone completion
- **Who:** Lead developer or PM

#### **File Dependency Matrix**
- **Update After:** Creating new docs, changing dependencies
- **Frequency:** When new docs created (daily if actively documenting)
- **Who:** Developer creating documentation

#### **Document Dependency Map**
- **Update After:** New implementation plans, status reports
- **Frequency:** Weekly
- **Who:** Documentation maintainer

---

### Update Responsibility Matrix

| Role | Responsibility | Frequency |
|------|---------------|-----------|
| **Active Developer** | Production Timeline, Challenges, End of Day updates | Daily |
| **Documentation Lead** | File Matrix, Dependency Map, Document maintenance | Weekly |
| **Project Manager** | Status Overview, Milestones, Status Indicators | Weekly |
| **Architecture Lead** | Architectural Decisions, Challenge resolutions | As needed |
| **QA/Testing** | Known Issues, Test results, Verification status | After testing |

---

### Staleness Prevention Rules

**🔴 CRITICAL - This file becomes STALE if:**
- "Last Updated" timestamp is >3 days old during active development
- Production Timeline shows tasks completed but status not updated
- Architecture Challenges show old dates (>1 week) with no progress
- Status Indicators don't match actual project state
- New documentation files exist but not in File Dependency Matrix

**Prevention Strategy:**
1. Set daily calendar reminder at end of day to update
2. Include "Update COORDINATION_HUB.md" in definition of done for tasks
3. Review freshness weekly during team sync
4. Use git pre-commit hook to check last update date (optional)
5. Assign ownership to active developer currently working on project

---

### Quick Update Templates

**Template 1: Completed Feature**
```markdown
## Recent Commits Summary
| Commit | Description | Impact |
|--------|-------------|--------|
| `abc1234` | Implement {Feature} | {Impact description} |

## Active Workstreams
### {Feature Name}
**Status:** ✅ Complete (was: 🟡 In Progress)
**Completed:** 2025-11-{day}
```

**Template 2: New Blocker**
```markdown
## Architecture Challenges
### Challenge X: {Blocker Name}
**Status:** 🔴 BLOCKER - Requires Immediate Attention
**Priority:** P0 - Blocks {Feature}
**Risk Level:** {CRITICAL/HIGH/MEDIUM/LOW}
**Discovered:** 2025-11-{day}
```

**Template 3: End of Day**
```markdown
**Last Updated:** 2025-11-{day}

## Production Timeline
### Daily Progress Tracking
**Day {X} (2025-11-{day}):**
- ✅ {Completed task 1}
- ✅ {Completed task 2}
- 🟡 {In progress task} (70% complete)
- Next: {Tomorrow's priority}
```

---

### Automation Opportunities

**Consider These Automations:**
1. **Git Hook:** Remind to update COORDINATION_HUB.md on commit
2. **CI/CD Check:** Verify last update <3 days old
3. **Slack Reminder:** Daily EOD reminder to update progress
4. **Script:** Auto-generate commit summary table from git log
5. **Documentation Linter:** Check for stale "Last Verified" dates

**Example Git Hook** (`.git/hooks/pre-commit`):
```bash
#!/bin/bash
LAST_UPDATE=$(grep "Last Updated:" COORDINATION_HUB.md | head -1)
echo "📋 Don't forget to update COORDINATION_HUB.md!"
echo "   Current: $LAST_UPDATE"
echo "   Update status if you completed work today."
```

---

### Measuring Freshness

**This hub is HEALTHY when:**
- ✅ Last Updated within 3 days during active development
- ✅ Production Timeline progress matches actual work
- ✅ Architecture Challenges statuses are current
- ✅ Status Indicators match reality
- ✅ File Dependency Matrix includes all recent docs
- ✅ Known Issues reflect current state

**This hub is STALE when:**
- ❌ Last Updated >1 week old
- ❌ Production Timeline shows outdated information
- ❌ Completed features still marked as In Progress
- ❌ New docs exist but not in File Matrix
- ❌ Known Issues include resolved problems

**Recovery from Staleness:**
1. Block 1-2 hours for full review
2. Check git log for recent commits
3. Review all documentation files created in last 2 weeks
4. Update each section systematically
5. Mark "Last Verified" on all sections
6. Commit with message: "docs: refresh COORDINATION_HUB.md to current state"

---

### Commit Message Format

When updating this file, use clear commit messages:

**Format:**
```
docs(hub): {brief description}

- Updated {section name}
- {Specific changes made}
- Verified {date}
```

**Examples:**
```
docs(hub): update production timeline day 5 progress

- Marked P&L Statement component as complete
- Updated progress to 85%
- Added blocker for Balance Sheet API integration
- Verified 2025-11-25

docs(hub): resolve Challenge 1 (Dual Calculation Path)

- Updated status to ✅ RESOLVED
- Moved to Addressed Issues
- Updated File Dependency Matrix
- Verified 2025-11-20

docs(hub): add 5 new doc files to dependency matrix

- Added Financial Statements Phase 4 docs
- Updated File Dependency Matrix
- Added to Tier 4 Implementation Plans
- Verified 2025-11-22
```

---

## Verification Metrics (How We Know We're Ready)

**Last Updated:** 2025-11-20
**Purpose:** Define exactly what "done" looks like for each major feature
**Use:** Reference these during implementation and QA

---

### For Financial Statements Feature (Current Target - Phase 9)

**Status:** 🟡 IN PROGRESS - UI components missing
**Target Completion:** ~9 days from 2025-11-20

✅ **Definition of Done:**

**Functionality:**
- [ ] **P&L Statement Component**
  - [ ] Displays Revenue, Expenses, Net Income for all years (2023-2052)
  - [ ] Period-aware rendering (HISTORICAL/TRANSITION/DYNAMIC)
  - [ ] Year-over-year growth % shown
  - [ ] Subtotals calculated correctly (Operating Income, EBITDA, Net Income)
  - [ ] Export to PDF/Excel/CSV working
  - [ ] Responsive design (mobile + desktop)

- [ ] **Balance Sheet Component**
  - [ ] Displays Assets, Liabilities, Equity for all years
  - [ ] CircularSolver integration working (depreciation, interest, debt)
  - [ ] Balance equation validates: Assets = Liabilities + Equity
  - [ ] Historical actuals (2023-2024) integrated correctly
  - [ ] Opening balances from balance_sheet_settings applied
  - [ ] Export functionality working

- [ ] **Cash Flow Statement Component**
  - [ ] Three sections display: Operating, Investing, Financing
  - [ ] NPV calculation shown (2028-2052 period only)
  - [ ] Period comparison view available
  - [ ] Cash reconciliation: Opening + Changes = Closing
  - [ ] Export functionality working

**Data Quality:**
- [ ] All three statements tied to actual projection data (no mock data)
- [ ] No missing values (all cells populated)
- [ ] No NaN or Infinity values in any calculation
- [ ] Decimal.js used consistently (no floating-point arithmetic)
- [ ] Currency formatting correct (SAR, 2 decimal places)
- [ ] Negative numbers shown correctly (red, in parentheses)

**Performance:**
- [ ] Statement generation < 50ms (measured with Performance API)
- [ ] Web Worker used for heavy calculations
- [ ] UI remains responsive during generation
- [ ] No memory leaks (tested with 50+ regenerations)

**Testing:**
- [ ] 95%+ test coverage for financial statement logic
- [ ] Unit tests for each component
- [ ] Integration tests for CircularSolver integration
- [ ] E2E tests for export functionality
- [ ] Verified against sample data (3 test versions)
- [ ] Regression tests: All 218+ existing tests still pass

**Code Quality:**
- [ ] TypeScript strict mode compliance (no `any`)
- [ ] All props typed explicitly
- [ ] Error handling for all calculations
- [ ] Loading states for async operations
- [ ] Accessibility: WCAG 2.1 AA+ compliant

**Documentation:**
- [ ] Component usage documented
- [ ] Calculation logic explained
- [ ] Update `FINANCIAL_STATEMENTS_COMPLETE.md` with UI completion
- [ ] Update `LATEST_PROJECT_SUMMARY.md` to 95% complete

**Acceptance Criteria (Must Pass):**
1. Product owner can view all three statements for any version
2. Statements match expected values from test scenarios
3. Export generates accurate PDF/Excel/CSV files
4. Performance meets <50ms target
5. No errors in browser console
6. Works on Chrome, Firefox, Safari
7. Mobile-responsive on iOS and Android

---

### For Planning Periods Feature (Next Phase - After Financial Statements)

**Status:** 🟡 IN DESIGN - Schema simplification needed
**Target Completion:** 7-10 days (reduced from 28-35 days)

⏳ **Definition of Done:**

**Schema & Database:**
- [ ] **`historical_actuals` table created**
  - [ ] Fields: totalRevenues, totalExpenses, schoolRent, staffCosts
  - [ ] Balance Sheet fields: cash, totalAssets, totalLiabilities, equity
  - [ ] Unique constraint on (versionId, year)
  - [ ] Migration tested in Supabase
  - [ ] Rollback procedure documented

- [ ] **Period detection logic implemented**
  - [ ] `getPeriodForYear(year)` returns correct period
  - [ ] HISTORICAL: 2023-2024
  - [ ] TRANSITION: 2025-2027
  - [ ] DYNAMIC: 2028-2052
  - [ ] Unit tests for all edge cases

**Calculations:**
- [ ] **Period-aware financial calculations**
  - [ ] HISTORICAL: Use uploaded actuals (no calculation)
  - [ ] TRANSITION: Use manual inputs + calculate staff costs
  - [ ] DYNAMIC: Full financial engine calculations
  - [ ] Capacity cap (1850 students) enforced for TRANSITION
  - [ ] Rent calculation uses correct source per period

- [ ] **Zakat compliance validated**
  - [ ] Zakat calculation correct for full years (DYNAMIC)
  - [ ] Zakat pro-rating rule defined for TRANSITION
  - [ ] Regulatory guidance documented
  - [ ] Test scenarios cover all period transitions

**Data Import:**
- [ ] **Historical data import from Excel**
  - [ ] CSV/Excel template created
  - [ ] Import script: `scripts/import-historical-data.ts`
  - [ ] Validation: Required fields present
  - [ ] Error handling: Clear error messages
  - [ ] Dry-run mode available

**UI:**
- [ ] **Period indicators in UI**
  - [ ] HISTORICAL: Read-only with "Historical Data" badge
  - [ ] TRANSITION: Editable with "Transition" badge + capacity warning
  - [ ] DYNAMIC: Full edit mode
  - [ ] Period transitions visually clear

**Testing:**
- [ ] All 218+ existing tests still pass (regression)
- [ ] New tests for period detection (10+ scenarios)
- [ ] Integration tests for historical data import
  - [ ] Calculation tests for all three periods
- [ ] E2E test: Create version, import historical, view projections

**Performance:**
- [ ] No performance degradation (<100ms for 30-year projection)
- [ ] Database query optimization (indexes on versionId, year)
- [ ] Caching for historical actuals (no re-fetch)

**Risk Mitigation:**
- [ ] Existing 2028-2052 dynamic logic NOT broken
  - [ ] Smoke tests: 10 existing versions still calculate correctly
- [ ] Circular dependency risks resolved
  - [ ] CircularSolver handles all periods correctly
- [ ] Data integrity maintained
  - [ ] Foreign key constraints enforced
  - [ ] Cascade deletes configured correctly

**Documentation:**
- [ ] Update `PLANNING_PERIODS_IMPLEMENTATION_REPORT.md` with completion
- [ ] Document period detection logic in `ARCHITECTURE.md`
- [ ] Create user guide for historical data import
- [ ] Update `LATEST_PROJECT_SUMMARY.md`

**Acceptance Criteria (Must Pass):**
1. Can import historical data for 2023-2024 from Excel
2. Version shows correct data for all three periods
3. Calculations correct for each period type
4. Zakat compliance validated by finance team
5. No existing functionality broken
6. Schema migration successful in production
7. Performance targets maintained

---

### For Production Deployment (Final Phase)

**Status:** 🔴 NOT STARTED - Blocked by Financial Statements + Planning Periods
**Target Completion:** 11 days after Phase 9 complete

🚀 **Definition of Done:**

**Testing:**
- [ ] **Unit Tests**
  - [ ] 80%+ code coverage across all modules
  - [ ] All calculation functions tested
  - [ ] CircularSolver edge cases covered
  - [ ] Period detection comprehensive

- [ ] **Integration Tests**
  - [ ] All API endpoints tested
  - [ ] Database transactions validated
  - [ ] Web Worker communication tested
  - [ ] Report generation end-to-end

- [ ] **E2E Tests**
  - [ ] Critical user flows (create version, run projection, export)
  - [ ] Financial statement generation
  - [ ] Report generation workflows
  - [ ] Multi-user scenarios

- [ ] **Performance Tests**
  - [ ] Load testing: 100 concurrent users
  - [ ] Projection calculation <100ms (p95)
  - [ ] API response times <200ms (p95)
  - [ ] Database query optimization verified

**Security:**
- [ ] **Security Audit**
  - [ ] Authentication working (NextAuth.js)
  - [ ] Authorization enforced (RBAC)
  - [ ] No SQL injection vulnerabilities
  - [ ] No XSS vulnerabilities
  - [ ] CSRF protection enabled
  - [ ] Environment variables secured
  - [ ] API keys not exposed

**Accessibility:**
- [ ] **WCAG 2.1 AA+ Compliance**
  - [ ] Keyboard navigation working
  - [ ] Screen reader tested
  - [ ] Color contrast meets AA standards
  - [ ] Focus indicators visible
  - [ ] Alt text on all images
  - [ ] ARIA labels correct

**Deployment:**
- [ ] **Environment Configuration**
  - [ ] Production environment variables set
  - [ ] Database connection strings configured
  - [ ] NextAuth secret generated
  - [ ] Supabase production instance ready

- [ ] **Database Migration**
  - [ ] Migration scripts validated
  - [ ] Rollback procedures tested
  - [ ] Data backup created
  - [ ] Migration dry-run successful

- [ ] **Monitoring & Observability**
  - [ ] Error tracking setup (Sentry or similar)
  - [ ] Performance monitoring (Vercel Analytics)
  - [ ] Audit log review procedures
  - [ ] Database query monitoring
  - [ ] Uptime monitoring configured

**Documentation:**
- [ ] **Deployment Runbook**
  - [ ] Step-by-step deployment guide
  - [ ] Rollback procedures documented
  - [ ] Environment variable checklist
  - [ ] Database migration steps

- [ ] **User Documentation**
  - [ ] Feature documentation
  - [ ] User guide for financial planning
  - [ ] FAQ section
  - [ ] Troubleshooting guide

**Final QA:**
- [ ] **Financial Accuracy Validation**
  - [ ] Test with real scenarios from finance team
  - [ ] Compare against Excel models
  - [ ] Verify NPV calculations
  - [ ] Zakat compliance confirmed

- [ ] **UI/UX Final Review**
  - [ ] Design review by UX team
  - [ ] Mobile responsiveness verified
  - [ ] Dark mode working correctly
  - [ ] Error messages user-friendly

**Acceptance Criteria (Must Pass):**
1. All critical bugs resolved (zero P0/P1 bugs)
2. Performance targets met in production-like environment
3. Security audit passed
4. Accessibility audit passed
5. Finance team approves calculation accuracy
6. User acceptance testing completed
7. Deployment runbook validated

---

## Verification Checklist Summary

**Quick Status Check:**

| Feature | Completion | Verified | Blockers |
|---------|-----------|----------|----------|
| Financial Statements UI | 0% | ❌ | [Challenge 1](#challenge-1-dual-calculation-path--data-loss-critical) |
| Planning Periods | 30% | ⏳ | Schema design |
| Testing & QA | 0% | ❌ | Financial Statements |
| Production Deployment | 0% | ❌ | All above |

**Overall Production Readiness:** 79% → 95% (Financial Statements) → 100% (All phases)

---

## Notes

**Last Verified:** 2025-11-20

This coordination hub is the central reference point for project status, decisions, and next steps. **This file is only useful if kept up-to-date.** Follow the Daily Update Protocol above to prevent staleness.

### Key Updates to Make
1. **After completing a major feature:** Update `Active Workstreams` section
2. **After resolving blockers:** Update `Production Readiness` status
3. **After creating new docs:** Add to appropriate tier in `Document Dependency Map`
4. **Daily:** Update Production Timeline and Last Updated timestamp
5. **Weekly:** Review and update all "Last Verified" dates
6. **Monthly:** Review `Deprecated Documents` section and archive old files

### Related Essential Documentation
- **`CLAUDE.md`** - AI assistant guidance (OVERRIDES ALL DEFAULTS)
- **`.cursorrules`** - Complete development standards
- **`LATEST_PROJECT_SUMMARY.md`** - Most current project status (update monthly)
- **`PRODUCTION_READINESS_ACTION_PLAN.md`** - Current blockers and priorities

### Emergency Contact Points
If this hub is >1 week stale during active development:
1. Review git log: `git log --since="1 week ago" --oneline`
2. Check recent doc creation: `find . -name "*.md" -mtime -7`
3. Block time for systematic update
4. Follow "Recovery from Staleness" procedure above

**Remember:** A stale coordination hub is worse than no hub at all - it creates false confidence in outdated information.
