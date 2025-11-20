# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Project Zeta is a sophisticated financial planning application for school relocation assessment (2028+), providing 30-year financial projections (2023-2052) with emphasis on long-term lease evaluation and multiple rent models.

**Tech Stack:**
- Next.js 15 (App Router) + React 18 + TypeScript 5.3+
- PostgreSQL 15+ (via Supabase) + Prisma 5.x ORM
- Tailwind CSS v3 + shadcn/ui components
- Decimal.js for financial precision
- Web Workers for heavy calculations
- Vitest for testing

## Critical Business Rules (NEVER VIOLATE)

1. **Rent & Tuition Independence** - Tuition is set manually by user, NOT calculated from rent
2. **Revenue = Tuition × Students** - Automatic calculation with CPI-based tuition growth
3. **Curriculum-Specific Ramp-Up** - FR (established, starts 60-80%) vs IB (new, starts 0-30%)
4. **NPV Period: 2028-2052** - 25-year post-relocation focus (primary decision metric)
5. **Money = Decimal.js** - NEVER use floating point for financial calculations
6. **Planning Periods Architecture**:
   - HISTORICAL (2023-2024): Use actual data from `historical_actuals` table
   - TRANSITION (2025-2027): Manual inputs (transition rent, capacity cap: 1850)
   - DYNAMIC (2028-2052): Calculated projections using rent models

## Development Commands

```bash
# Development
npm run dev                    # Start dev server (localhost:3000)
npm run build                  # Production build
npm run type-check             # TypeScript validation
npm run lint                   # ESLint

# Database
npx prisma studio              # Database GUI
npx prisma migrate dev         # Create & apply migration
npx prisma generate            # Generate Prisma Client
npx prisma db push             # Push schema (dev only)

# Testing
npm run test                   # Run all tests
npm run test:watch             # Watch mode
npm run test:coverage          # Coverage report
npm test -- <path-to-test>     # Run single test file

# Specific test examples
npm test -- lib/calculations/financial/__tests__/projection.test.ts
npm test -- lib/calculations/financial/__tests__/projection.test.ts --run

# Scripts
npx tsx scripts/<script-name>.ts  # Run TypeScript scripts
```

## High-Level Architecture

### Financial Calculation Pipeline

The core calculation engine (`lib/calculations/financial/projection.ts`) orchestrates a multi-step pipeline:

1. **Tuition Growth** (CPI-based) → FR + IB curricula separately
2. **Revenue Calculation** (tuition × students) → Sum FR + IB + Other Revenue
3. **Rent Calculation** → Period-aware:
   - HISTORICAL: Use `historical_actuals.schoolRent`
   - TRANSITION: Use `rent_plans.parameters.transitionRent`
   - DYNAMIC: Use rent model (FIXED_ESCALATION, REVENUE_SHARE, PARTNER_MODEL)
4. **Staff Costs** (with CPI growth) → Period-aware baseline year (2028 for RELOCATION, 2023 for HISTORICAL)
5. **OpEx Calculation** (% of revenue + fixed) → 30 years
6. **EBITDA** (Revenue - Staff - Rent - OpEx)
7. **Circular Solver** (`circular-solver.ts`) → Iterative calculation for:
   - Balance Sheet (Assets, Liabilities, Equity)
   - Cash Flow (Operating, Investing, Financing)
   - Circular dependencies: Interest Expense ↔ Debt ↔ Cash ↔ Net Result
8. **NPV Calculation** → Rent & Cash Flow (2028-2052 only)

### Circular Solver Details

**Purpose:** Resolves circular dependencies in financial statements (Interest → Debt → Cash → Net Income → Interest)

**Key Features:**
- Iterative solver with convergence check (typically 1-4 iterations)
- Performance: <100ms for 30-year projection
- Handles historical actuals integration for 2023-2024
- Fetches admin settings (zakat rate, interest rates, working capital rules)
- Full Balance Sheet + Cash Flow + P&L generation

**Location:** `lib/calculations/financial/circular-solver.ts`

### Service Layer Pattern

All business logic follows a consistent service pattern:

```
services/
├── version/           # Version CRUD (create, read, update, delete, duplicate)
├── admin/            # Admin operations (users, settings, audit logs, health)
├── report/           # Report generation (PDF, Excel, CSV)
├── other-revenue/    # Other revenue management
├── balance-sheet-settings/  # Balance sheet initial values
├── capex/            # CapEx calculations
└── audit.ts          # Global audit logging

Each service module exports: create, read, update, delete (as applicable)
All mutations MUST be audited via audit_logs table
```

### Web Workers for Performance

Heavy calculations run in Web Workers to avoid blocking UI:

**Location:** `workers/financial-engine.worker.ts`

**Usage Pattern:**
```typescript
const worker = new Worker(
  new URL('@/workers/financial-engine.worker.ts', import.meta.url)
);
worker.postMessage({ type: 'FULL_PROJECTION', params });
worker.onmessage = (event) => setResult(event.data);
```

**Target:** <50ms for full 30-year projection

## Database Schema Key Points

**Core Models:**
- `versions` - Financial scenarios (RELOCATION_2028 or HISTORICAL_BASELINE mode)
- `curriculum_plans` - FR/IB enrollment and tuition settings (linked to version)
- `rent_plans` - Rent model configuration (one per version)
- `capex_items` + `capex_rules` - Capital expenditure planning
- `opex_sub_accounts` - Operating expense categories (% of revenue or fixed)
- `historical_actuals` - Actual financial data for 2023-2024 (P&L, Balance Sheet, Cash Flow)
- `other_revenue_items` - Non-tuition revenue by year
- `balance_sheet_settings` - Starting cash and opening equity per version
- `admin_settings` - Global settings (CPI, discount rate, zakat, working capital rules)
- `audit_logs` - Complete audit trail (all mutations)
- `reports` - Generated report metadata

**Important Relationships:**
- Version → Curriculum Plans (1:2, FR + IB required)
- Version → Rent Plan (1:1)
- Version → Historical Actuals (1:N, years 2023-2024)
- Version → Other Revenue Items (1:N, years 2023-2052)

**Key Constraints:**
- `@@unique([versionId, curriculumType])` - One plan per curriculum per version
- `@@unique([versionId, year])` - One historical record per year per version
- Enum validation for rent models, curriculum types, version modes, etc.

## File Organization

```
lib/
├── calculations/
│   ├── financial/          # Core financial engine
│   │   ├── projection.ts   # Main orchestrator (CRITICAL FILE)
│   │   ├── circular-solver.ts  # Balance Sheet + Cash Flow solver
│   │   ├── ebitda.ts       # EBITDA calculation
│   │   ├── cashflow.ts     # Legacy cash flow (deprecated, use solver)
│   │   ├── opex.ts         # Operating expenses
│   │   ├── staff-costs.ts  # Staff cost projection
│   │   └── npv.ts          # Net Present Value
│   ├── revenue/            # Revenue calculations
│   │   ├── revenue.ts      # Revenue = Tuition × Students
│   │   └── tuition-growth.ts  # CPI-based tuition growth
│   └── rent/               # Rent model calculations
│       ├── index.ts        # Rent calculation dispatcher
│       ├── fixed-escalation.ts
│       ├── revenue-share.ts
│       └── partner-model.ts
├── utils/
│   ├── period-detection.ts # Planning period helpers (HISTORICAL/TRANSITION/DYNAMIC)
│   └── admin-settings.ts   # Admin settings fetcher with caching

services/                   # Business logic layer (database operations)
workers/                    # Web Workers for heavy calculations
components/                 # React UI components
  ├── ui/                   # shadcn/ui base components
  ├── versions/             # Version management UI
  └── versions/financial-statements/  # Financial statement displays

app/                        # Next.js App Router pages
  ├── api/                  # API routes
  ├── versions/             # Version pages
  ├── dashboard/            # Main dashboard
  └── settings/             # Admin settings
```

## Important Implementation Details

### Period-Aware Calculations

All calculations MUST respect the planning period architecture:

```typescript
import { getPeriodForYear } from '@/lib/utils/period-detection';

const period = getPeriodForYear(year);
// Returns: 'HISTORICAL' | 'TRANSITION' | 'DYNAMIC'

// Example usage in projection.ts:
if (period === 'HISTORICAL') {
  // Use historical_actuals data from database
  const historical = await prisma.historical_actuals.findFirst({
    where: { versionId, year }
  });
  revenue = historical.totalRevenues;
} else if (period === 'TRANSITION') {
  // Use manual inputs (transitionRent from rent_plans.parameters)
  rent = transitionRent;
} else {
  // DYNAMIC: Calculate using rent model
  rent = calculateRent(rentModel, revenueByYear);
}
```

### Staff Cost Base Year Logic

**CRITICAL:** Staff cost base year depends on version mode:
- `RELOCATION_2028`: baseYear = 2028 (staffCostBase is for year 2028)
- `HISTORICAL_BASELINE`: baseYear = 2023 (staffCostBase is for year 2023)

This ensures CPI period 0 (no growth) aligns with the baseline year.

### Error Handling Pattern

**ALWAYS use Result<T> pattern:**

```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

// Import from types/result.ts
import { success, error } from '@/types/result';

async function createVersion(data: VersionInput): Promise<Result<Version>> {
  try {
    const version = await prisma.version.create({ data });
    await logAudit({ action: 'CREATE_VERSION', entityId: version.id });
    return success(version);
  } catch (err) {
    return error('Failed to create version');
  }
}
```

### Financial Precision

**ALWAYS use Decimal.js for money:**

```typescript
import Decimal from 'decimal.js';

// Configure precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

// NEVER do this:
const revenue = tuition * students; // ❌ Floating point error

// ALWAYS do this:
const revenue = new Decimal(tuition).times(students); // ✅ Precise
```

### Audit Logging

**ALL mutations MUST be audited:**

```typescript
// After any create/update/delete operation
await prisma.audit_logs.create({
  data: {
    action: 'UPDATE_TUITION',
    userId,
    entityType: 'CURRICULUM',
    entityId: versionId,
    metadata: { oldValue, newValue },
  },
});
```

## Testing Strategy

**Test Files Location:**
- Unit tests: `__tests__/` subdirectories next to source files
- Integration tests: `app/api/**/__tests__/`
- E2E tests: Root `tests/` directory (if exists)

**Running Tests:**
```bash
# All tests
npm run test

# Watch mode
npm run test:watch

# Single test file
npm test -- lib/calculations/financial/__tests__/projection.test.ts

# With coverage
npm run test:coverage
```

**Key Test Files:**
- `lib/calculations/financial/__tests__/projection.test.ts` - Main projection tests
- `lib/calculations/financial/__tests__/circular-solver.test.ts` - Solver validation
- `app/api/reports/__tests__/` - Report generation tests

## Performance Requirements

- Financial calculations: <50ms (use Web Workers if needed)
- Page loads: <2s (First Contentful Paint)
- Report generation: <5s
- API responses (p95): <200ms

## Common Development Tasks

### Running a Single Test

```bash
# Method 1: Use npm test with path
npm test -- lib/utils/__tests__/period-detection.test.ts

# Method 2: Use npx vitest
npx vitest lib/utils/__tests__/period-detection.test.ts

# Add --run to exit after running (no watch mode)
npm test -- lib/utils/__tests__/period-detection.test.ts --run
```

### Database Migrations

**ALWAYS cd into project directory first:**

```bash
cd /Users/fakerhelali/Desktop/Project\ Zeta
npx prisma migrate dev --name add_new_field
npx prisma generate
```

### Creating a New Financial Calculation

1. Create calculation function in `lib/calculations/`
2. Add TypeScript types with explicit return types
3. Use Decimal.js for all money operations
4. Write unit tests in `__tests__/` subdirectory
5. Integrate into `projection.ts` pipeline
6. Update documentation

### Adding a New Service

1. Create service module in `services/<entity>/`
2. Export CRUD functions (create, read, update, delete as needed)
3. Add audit logging to all mutations
4. Use Prisma transactions for multi-step operations
5. Follow Result<T> error handling pattern

## Important Files to Review

When making changes to financial calculations or core logic:

1. **`.cursorrules`** - Complete development standards and patterns
2. **`PRD.md`** - Product requirements and business context
3. **`ARCHITECTURE.md`** - System architecture and design decisions
4. **`lib/calculations/financial/projection.ts`** - Main calculation orchestrator
5. **`lib/calculations/financial/circular-solver.ts`** - Balance Sheet solver
6. **`prisma/schema.prisma`** - Database schema

## Key Settings from .cursorrules

- TypeScript strict mode (no `any`, explicit return types)
- All financial amounts use Decimal.js (never floating point)
- Input validation with Zod at API boundaries
- Database transactions for multi-step operations
- Mandatory audit logging for all mutations
- Performance target: <50ms for calculations
- Dark mode primary design system
- WCAG 2.1 AA+ accessibility compliance

## Environment Variables

Required in `.env.local`:

```bash
DATABASE_URL="postgresql://..."          # pgBouncer connection
DIRECT_URL="postgresql://..."            # Direct connection (migrations)
NEXTAUTH_SECRET="..."                    # Auth secret
NEXTAUTH_URL="http://localhost:3000"     # Auth URL
```

See `.env.local.example` for complete list and format.

## Additional Documentation

- **PRD.md** - Product requirements and features
- **ARCHITECTURE.md** - System design and data flow
- **SCHEMA.md** - Database schema reference
- **DEPLOYMENT.md** - Deployment guide
- **.cursorrules** - Complete development standards (comprehensive)
- **FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md** - Financial statements implementation details

## Notes

- Historical actuals (2023-2024) are stored in `historical_actuals` table with complete P&L, Balance Sheet, and Cash Flow fields
- Admin settings are cached for performance (see `lib/utils/admin-settings.ts`)
- Report generation creates temporary files with expiration timestamps
- Version locking prevents modifications (enforce via authorization checks)
- All user roles (ADMIN, PLANNER, VIEWER) have different permission levels
