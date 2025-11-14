# Project Zeta - System Architecture
## Financial Planning Application - Technical Design

**Version:** 1.0  
**Last Updated:** November 13, 2025  
**Status:** Design Complete, Implementation Pending

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [Technology Stack](#technology-stack)
4. [System Components](#system-components)
5. [Data Flow](#data-flow)
6. [Component Hierarchy](#component-hierarchy)
7. [State Management](#state-management)
8. [Calculation Engine](#calculation-engine)
9. [Security Architecture](#security-architecture)
10. [Performance Optimization](#performance-optimization)
11. [Deployment Architecture](#deployment-architecture)
12. [Scalability Considerations](#scalability-considerations)

---

## 1. System Overview

### Purpose
Project Zeta is a financial planning application for evaluating school relocation scenarios (2028+). It simulates 30-year financial projections (2023-2052) with focus on rent model evaluation and long-term lease assessment.

### Core Capabilities
- **Version Management:** Create, compare, and lock financial scenarios
- **Financial Calculations:** Real-time projections with <50ms performance
- **Rent Model Evaluation:** Compare FixedEscalation, RevenueShare, PartnerModel
- **Tuition Planning:** Simulate tuition and enrollment strategies
- **Report Generation:** Export professional PDFs and Excel reports
- **Audit Logging:** Complete traceability of all financial decisions

### Key Metrics
- **Timeline:** 30-year projections (2023-2052)
- **NPV Focus:** 25-year post-relocation period (2028-2052)
- **Dual-Curriculum:** French (FR) and International Baccalaureate (IB)
- **Performance Target:** <50ms calculations, <2s page loads, <5s reports

---

## 2. Architecture Principles

### 2.1 Design Principles

**1. Separation of Concerns**
```
Presentation Layer (UI) → Business Logic (Services) → Data Layer (Database)
```

**2. Financial Precision**
- All money calculations use Decimal.js (never floating point)
- All amounts stored as integers (halalas) or Decimal types
- Rounding: ROUND_HALF_UP for consistency

**3. Type Safety First**
- TypeScript strict mode enabled
- Explicit return types on all functions
- No `any` types (use `unknown` with type guards)
- Zod for runtime validation at boundaries

**4. Error Handling**
- Result<T> pattern for all operations
- Never throw in business logic
- Audit all mutations
- User-friendly error messages

**5. Performance by Design**
- Web Workers for heavy calculations
- Memoization for expensive operations
- Debouncing for user inputs
- Code splitting for faster page loads

**6. Accessibility First**
- WCAG 2.1 AA+ compliance
- Keyboard navigation support
- Screen reader support
- Color + icon (not color alone)

---

## 3. Technology Stack

### 3.1 Core Framework

```yaml
Frontend:
  Framework: Next.js 16 (App Router)
  Language: TypeScript 5.3+
  UI Library: React 18+
  Rendering: React Server Components + Client Components

Backend:
  API: Next.js API Routes
  Runtime: Node.js 20 LTS
  Database ORM: Prisma 5.x

Database:
  Type: PostgreSQL 15+
  Hosting: Supabase
  Connection Pooling: pgBouncer
```

### 3.2 UI & Styling

```yaml
Styling:
  Framework: Tailwind CSS v4
  Component Library: shadcn/ui
  Design System: Custom (dark mode primary)
  Icons: Lucide React

Charts:
  Library: Recharts (or Tremor)
  Custom: Financial chart components

Animation:
  Library: Framer Motion
  Strategy: Micro-interactions, smooth transitions
```

### 3.3 State Management

```yaml
Global State:
  Library: Zustand
  Usage: User session, app settings, navigation

Local State:
  Library: React useState, useReducer
  Usage: Form inputs, UI toggles

Server State:
  Library: React Server Components (RSC)
  Usage: Data fetching, API calls

In-Memory Simulation:
  Library: React Context
  Usage: Temporary simulation state (non-persisted)
```

### 3.4 Data & Calculations

```yaml
Calculations:
  Precision: Decimal.js (20 digits)
  Workers: Web Workers for heavy computations
  Caching: Memoization (React.memo, useMemo)

Validation:
  Runtime: Zod schemas
  Compile-time: TypeScript types
  Database: Prisma constraints
```

### 3.5 Authentication & Security

```yaml
Authentication:
  Library: NextAuth.js v5
  Providers: Email, Google OAuth (optional)
  Session: JWT-based

Authorization:
  Roles: ADMIN, PLANNER, VIEWER
  Strategy: Role-based access control (RBAC)
  API: Middleware on protected routes
```

### 3.6 Deployment

```yaml
Hosting:
  Platform: Vercel (Serverless)
  Region: Auto (closest to users)
  CDN: Vercel Edge Network

Database:
  Platform: Supabase (managed PostgreSQL)
  Backups: Automatic daily backups
  Replication: Multi-region (if needed)

Monitoring:
  Analytics: Vercel Analytics
  Errors: Sentry
  Logs: Vercel Logs
```

---

## 4. System Components

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│  React Components (UI)                                          │
│  ├─ Pages (Next.js App Router)                                 │
│  ├─ Components (Reusable UI)                                    │
│  ├─ Charts (Recharts)                                           │
│  └─ Forms (React Hook Form + Zod)                              │
├─────────────────────────────────────────────────────────────────┤
│  State Management                                               │
│  ├─ Zustand (Global state)                                     │
│  ├─ React Context (Simulation state)                           │
│  └─ React Server Components (Server state)                     │
├─────────────────────────────────────────────────────────────────┤
│  Web Workers                                                    │
│  └─ Financial Calculation Engine                               │
│     (Runs in background thread for performance)                │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                   Next.js Server (Vercel)                       │
├─────────────────────────────────────────────────────────────────┤
│  API Routes (RESTful)                                           │
│  ├─ /api/versions (CRUD)                                       │
│  ├─ /api/reports (PDF/Excel generation)                        │
│  ├─ /api/auth (NextAuth.js)                                    │
│  └─ /api/admin (Settings, users)                               │
├─────────────────────────────────────────────────────────────────┤
│  Services (Business Logic)                                      │
│  ├─ Version Service                                            │
│  ├─ Curriculum Service                                         │
│  ├─ Rent Service                                               │
│  ├─ Financial Service                                          │
│  └─ Audit Service                                              │
├─────────────────────────────────────────────────────────────────┤
│  Utilities                                                      │
│  ├─ Decimal Helpers (Decimal.js)                               │
│  ├─ Validation (Zod)                                           │
│  ├─ Error Handling (Result<T>)                                 │
│  └─ Date/Currency Formatters                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↕ PostgreSQL Protocol
┌─────────────────────────────────────────────────────────────────┐
│              PostgreSQL Database (Supabase)                     │
├─────────────────────────────────────────────────────────────────┤
│  Tables                                                         │
│  ├─ users                                                       │
│  ├─ versions                                                    │
│  ├─ curriculum_plans                                            │
│  ├─ rent_plans                                                  │
│  ├─ capex_items                                                 │
│  ├─ opex_sub_accounts                                           │
│  ├─ tuition_simulations                                         │
│  ├─ audit_logs                                                  │
│  └─ admin_settings                                              │
├─────────────────────────────────────────────────────────────────┤
│  pgBouncer (Connection Pooling)                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Folder Structure

```
/project-zeta
├── /src
│   ├── /app                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (auth, providers)
│   │   ├── page.tsx                  # Home page (redirect to /dashboard)
│   │   ├── /dashboard                # Main dashboard
│   │   │   └── page.tsx
│   │   ├── /versions                 # Version management
│   │   │   ├── page.tsx              # List versions
│   │   │   ├── new/page.tsx          # Create version
│   │   │   └── [id]/page.tsx         # Version detail
│   │   ├── /tuition-simulator        # Tuition planning tool
│   │   │   └── page.tsx
│   │   ├── /simulation               # Full sandbox
│   │   │   └── page.tsx
│   │   ├── /compare                  # Version comparison
│   │   │   └── page.tsx
│   │   ├── /reports                  # Report generation
│   │   │   └── page.tsx
│   │   ├── /settings                 # Admin settings
│   │   │   └── page.tsx
│   │   └── /api                      # API routes
│   │       ├── /versions             # Version CRUD
│   │       ├── /reports              # PDF/Excel generation
│   │       ├── /auth                 # NextAuth.js
│   │       └── /admin                # Admin endpoints
│   │
│   ├── /components                   # Reusable UI components
│   │   ├── /ui                       # shadcn/ui base components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   ├── /charts                   # Chart components
│   │   │   ├── RevenueRentChart.tsx
│   │   │   ├── EBITDATrendChart.tsx
│   │   │   └── RentLoadChart.tsx
│   │   ├── /forms                    # Form components
│   │   │   ├── VersionForm.tsx
│   │   │   ├── CurriculumForm.tsx
│   │   │   └── RentPlanForm.tsx
│   │   └── /layouts                  # Layout components
│   │       ├── Sidebar.tsx
│   │       ├── Header.tsx
│   │       └── ThreeColumnLayout.tsx
│   │
│   ├── /lib                          # Core utilities
│   │   ├── /calculations             # Financial calculation engine
│   │   │   ├── /rent                 # Rent models
│   │   │   │   ├── fixed-escalation.ts
│   │   │   │   ├── revenue-share.ts
│   │   │   │   ├── partner-model.ts
│   │   │   │   └── index.ts
│   │   │   ├── /revenue              # Revenue calculations
│   │   │   │   ├── tuition-growth.ts
│   │   │   │   └── revenue.ts
│   │   │   ├── /financial            # Financial metrics
│   │   │   │   ├── ebitda.ts
│   │   │   │   ├── cashflow.ts
│   │   │   │   └── npv.ts
│   │   │   └── /decimal-helpers.ts   # Decimal.js utilities
│   │   ├── /db                       # Database client
│   │   │   └── prisma.ts
│   │   ├── /validation               # Zod schemas
│   │   │   ├── version.ts
│   │   │   ├── curriculum.ts
│   │   │   └── rent.ts
│   │   └── /utils                    # Helper functions
│   │       ├── formatters.ts
│   │       └── date-utils.ts
│   │
│   ├── /services                     # Business logic layer
│   │   ├── /version                  # Version operations
│   │   │   ├── create.ts
│   │   │   ├── read.ts
│   │   │   ├── update.ts
│   │   │   ├── delete.ts
│   │   │   └── duplicate.ts
│   │   ├── /curriculum               # Curriculum logic
│   │   │   └── index.ts
│   │   ├── /rent                     # Rent calculations
│   │   │   └── index.ts
│   │   ├── /financial                # Financial calculations
│   │   │   └── index.ts
│   │   └── /audit                    # Audit logging
│   │       └── index.ts
│   │
│   ├── /workers                      # Web Workers
│   │   └── financial-engine.worker.ts
│   │
│   ├── /hooks                        # Custom React hooks
│   │   ├── useFinancialCalculation.ts
│   │   ├── useVersions.ts
│   │   └── useSimulation.ts
│   │
│   ├── /types                        # TypeScript definitions
│   │   ├── database.ts               # Prisma types
│   │   ├── financial.ts              # Calculation types
│   │   ├── api.ts                    # API types
│   │   └── result.ts                 # Result<T> type
│   │
│   └── /config                       # Configuration
│       ├── constants.ts              # App constants
│       └── design-system.ts          # Design tokens
│
├── /prisma
│   ├── schema.prisma                 # Database schema
│   ├── /migrations                   # Migration files
│   └── seed.ts                       # Seed data
│
├── /public                           # Static assets
│   ├── /images
│   └── /icons
│
├── .env.local                        # Local environment variables
├── .env.local.example                # Environment variable template
├── .cursorrules                      # Development rules
├── PRD.md                            # Product requirements
├── ARCHITECTURE.md                   # This file
├── API.md                            # API documentation
├── SCHEMA.md                         # Database schema
├── DELIVERY_PLAN.md                  # Implementation plan
└── README.md                         # Setup instructions
```

---

## 5. Data Flow

### 5.1 User Creates Version (Main Flow)

```
┌──────────┐
│  User    │
└────┬─────┘
     │ 1. Fill version form
     ↓
┌──────────────────┐
│  VersionForm.tsx │
└────┬─────────────┘
     │ 2. Submit form
     ↓
┌─────────────────────────┐
│  Zod Validation         │
│  (CreateVersionSchema)  │
└────┬────────────────────┘
     │ 3. Valid data
     ↓
┌──────────────────────────┐
│  API Route               │
│  POST /api/versions      │
└────┬─────────────────────┘
     │ 4. Check authentication
     ↓
┌──────────────────────────┐
│  NextAuth.js             │
│  (requireAuth)           │
└────┬─────────────────────┘
     │ 5. Authenticated user
     ↓
┌──────────────────────────┐
│  Version Service         │
│  createVersion()         │
└────┬─────────────────────┘
     │ 6. Database transaction
     ↓
┌──────────────────────────┐
│  Prisma                  │
│  (PostgreSQL)            │
├──────────────────────────┤
│  1. Create version       │
│  2. Create curriculum    │
│  3. Create rent plan     │
│  4. Create audit log     │
└────┬─────────────────────┘
     │ 7. Return version
     ↓
┌──────────────────────────┐
│  API Response            │
│  { success: true, ... }  │
└────┬─────────────────────┘
     │ 8. Show success toast
     ↓
┌──────────────────────────┐
│  UI Update               │
│  Redirect to version     │
└──────────────────────────┘
```

### 5.2 Financial Calculation Flow (Web Worker)

```
┌──────────┐
│  User    │
└────┬─────┘
     │ 1. Adjust tuition slider
     ↓
┌──────────────────────────┐
│  TuitionSimulator.tsx    │
└────┬─────────────────────┘
     │ 2. Debounced input (300ms)
     ↓
┌──────────────────────────┐
│  useFinancialCalc hook   │
└────┬─────────────────────┘
     │ 3. Post message to worker
     ↓
┌────────────────────────────────┐
│  Web Worker                    │
│  financial-engine.worker.ts    │
├────────────────────────────────┤
│  1. Calculate tuition growth   │
│  2. Calculate revenue          │
│  3. Calculate rent             │
│  4. Calculate EBITDA           │
│  5. Calculate cash flow        │
│  6. Calculate NPV              │
└────┬───────────────────────────┘
     │ 4. Return result (<50ms)
     ↓
┌──────────────────────────┐
│  useFinancialCalc hook   │
│  (receive message)       │
└────┬─────────────────────┘
     │ 5. Update state
     ↓
┌──────────────────────────┐
│  React Re-render         │
├──────────────────────────┤
│  - Update KPI cards      │
│  - Update charts         │
│  - Update table          │
└──────────────────────────┘
```

### 5.3 Report Generation Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │ 1. Click "Generate Report"
     ↓
┌──────────────────────────┐
│  Reports Page            │
└────┬─────────────────────┘
     │ 2. POST /api/reports/[versionId]
     ↓
┌──────────────────────────┐
│  API Route               │
│  POST /api/reports/...   │
└────┬─────────────────────┘
     │ 3. Fetch version data
     ↓
┌──────────────────────────┐
│  Prisma                  │
│  (Get version + related) │
└────┬─────────────────────┘
     │ 4. Calculate full projection
     ↓
┌──────────────────────────┐
│  Financial Service       │
│  calculateFullProjection │
└────┬─────────────────────┘
     │ 5. Generate PDF
     ↓
┌──────────────────────────┐
│  @react-pdf/renderer     │
│  (Render PDF template)   │
└────┬─────────────────────┘
     │ 6. Store PDF in temp storage
     ↓
┌──────────────────────────┐
│  Vercel Blob Storage     │
│  (24-hour expiry)        │
└────┬─────────────────────┘
     │ 7. Return download URL
     ↓
┌──────────────────────────┐
│  API Response            │
│  { downloadUrl: "..." }  │
└────┬─────────────────────┘
     │ 8. Download PDF
     ↓
┌──────────────────────────┐
│  Browser Download        │
└──────────────────────────┘
```

---

## 6. Component Hierarchy

### 6.1 Page Component Structure

```typescript
// Example: Dashboard Page
<DashboardLayout>
  <Sidebar>
    <UserProfile />
    <Navigation />
    <VersionSelector />
  </Sidebar>
  
  <MainContent>
    <Header>
      <BreadcrumbNav />
      <ActionButtons />
    </Header>
    
    <KPICards>
      <NPVCard />
      <EBITDAMarginCard />
      <RentLoadCard />
      <BreakevenYearCard />
    </KPICards>
    
    <ChartsGrid>
      <RevenueRentChart />
      <EBITDATrendChart />
      <RentLoadChart />
      <EnrollmentChart />
    </ChartsGrid>
    
    <DataTable>
      <YearByYearTable />
    </DataTable>
  </MainContent>
</DashboardLayout>
```

### 6.2 Component Responsibilities

**Presentation Components (UI)**
- Render UI elements
- Handle user interactions
- No business logic
- Receive data via props
- Example: `Button`, `Input`, `Card`

**Container Components (Smart)**
- Fetch data from API
- Manage local state
- Call services/hooks
- Pass data to presentation components
- Example: `VersionListContainer`, `DashboardContainer`

**Chart Components**
- Receive calculated data
- Render visualizations
- Handle tooltips, legends
- Responsive design
- Example: `RevenueRentChart`, `EBITDATrendChart`

**Form Components**
- Manage form state (React Hook Form)
- Validate inputs (Zod)
- Submit to API
- Handle errors
- Example: `VersionForm`, `CurriculumForm`

**Layout Components**
- Define page structure
- Handle responsive layout
- Provide context (auth, theme)
- Example: `DashboardLayout`, `ThreeColumnLayout`

---

## 7. State Management

### 7.1 State Architecture

```typescript
// Global State (Zustand)
interface AppStore {
  // User session
  user: User | null;
  isAuthenticated: boolean;
  role: 'ADMIN' | 'PLANNER' | 'VIEWER';
  
  // App settings
  theme: 'dark' | 'light';
  currency: 'SAR';
  language: 'en';
  
  // Navigation
  selectedVersionId: string | null;
  sidebarOpen: boolean;
  
  // Actions
  setUser: (user: User) => void;
  logout: () => void;
  selectVersion: (id: string) => void;
  toggleSidebar: () => void;
}

// Simulation State (React Context)
interface SimulationContext {
  // Base version
  baseVersion: Version | null;
  
  // Modified parameters (in-memory, non-persisted)
  curriculumPlans: CurriculumPlan[];
  rentPlan: RentPlan;
  capexItems: CapexItem[];
  opexSubAccounts: OpexSubAccount[];
  
  // Calculated results
  projection: FinancialProjection | null;
  isCalculating: boolean;
  
  // Actions
  updateCurriculum: (plan: CurriculumPlan) => void;
  updateRentPlan: (plan: RentPlan) => void;
  resetToBase: () => void;
  saveAsVersion: () => Promise<void>;
}

// Server State (React Server Components)
// - Fetched on server
// - Passed to client components as props
// - No client-side caching needed (RSC handles it)
```

### 7.2 State Flow Diagram

```
┌─────────────────────┐
│  Server Components  │
│  (RSC)              │
├─────────────────────┤
│ - Fetch from DB     │
│ - Initial data load │
│ - No re-fetch       │
└──────┬──────────────┘
       │ Props
       ↓
┌─────────────────────┐
│  Client Components  │
├─────────────────────┤
│ Zustand (Global)    │
│ - User session      │
│ - App settings      │
│ - Navigation        │
├─────────────────────┤
│ Context (Local)     │
│ - Simulation state  │
│ - In-memory changes │
├─────────────────────┤
│ useState (Ephemeral)│
│ - Form inputs       │
│ - UI toggles        │
└─────────────────────┘
```

---

## 8. Calculation Engine

### 8.1 Calculation Architecture

```typescript
// /src/workers/financial-engine.worker.ts
// Runs in separate thread (non-blocking UI)

interface CalculationRequest {
  type: 'FULL_PROJECTION' | 'PARTIAL_UPDATE';
  params: {
    curriculumPlans: CurriculumPlan[];
    rentPlan: RentPlan;
    capexItems: CapexItem[];
    opexSubAccounts: OpexSubAccount[];
    adminSettings: AdminSettings;
  };
}

interface CalculationResult {
  success: boolean;
  data: FinancialProjection;
  duration: number; // milliseconds
}

// Calculation Pipeline:
// 1. Tuition Growth (CPI-based) → 30 years × 2 curricula
// 2. Revenue Calculation (tuition × students) → 30 years × 2 curricula
// 3. Rent Calculation (based on model) → 30 years
// 4. Staff Costs (with CPI) → 30 years
// 5. Opex (% of revenue + fixed) → 30 years
// 6. EBITDA (revenue - costs) → 30 years
// 7. Cash Flow (EBITDA - capex - taxes) → 30 years
// 8. NPV (2028-2052, 25 years) → 1 value
```

### 8.2 Performance Optimizations

**1. Memoization**
```typescript
// Cache expensive calculations
const memoizedCalculation = useMemo(() => {
  return calculateNPV(cashFlows, discountRate);
}, [cashFlows, discountRate]); // Only recalculate if inputs change
```

**2. Debouncing**
```typescript
// Wait 300ms after user stops typing before recalculating
const debouncedTuition = useDebounce(tuitionInput, 300);

useEffect(() => {
  recalculateFinancials(debouncedTuition);
}, [debouncedTuition]);
```

**3. Web Workers**
```typescript
// Offload heavy calculations to background thread
const worker = new Worker(new URL('@/workers/financial-engine.worker.ts', import.meta.url));

worker.postMessage({ type: 'FULL_PROJECTION', params });

worker.onmessage = (event) => {
  const { data, duration } = event.data;
  console.log(`Calculated in ${duration}ms`); // Target: <50ms
  setProjection(data);
};
```

**4. Progressive Rendering**
```typescript
// Render KPIs first, then charts
<Suspense fallback={<KPICardsSkeleton />}>
  <KPICards data={projection} />
</Suspense>

<Suspense fallback={<ChartsGridSkeleton />}>
  <ChartsGrid data={projection} />
</Suspense>
```

---

## 9. Security Architecture

### 9.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  User attempts to access protected page                         │
└────┬────────────────────────────────────────────────────────────┘
     │
     ↓
┌──────────────────────────┐
│  Middleware              │
│  (Check session)         │
└────┬─────────────────────┘
     │
     ├─ Not authenticated ──────→ Redirect to /auth/signin
     │
     ├─ Authenticated ──────────→ Check role
     │                             │
     │                             ├─ VIEWER → Allow read-only
     │                             ├─ PLANNER → Allow create/edit
     │                             └─ ADMIN → Allow all operations
     │
     ↓
┌──────────────────────────┐
│  Render page             │
└──────────────────────────┘
```

### 9.2 Authorization Matrix

| Resource | VIEWER | PLANNER | ADMIN |
|----------|--------|---------|-------|
| **Versions** |
| List versions | ✅ Read | ✅ Read | ✅ Read |
| View version details | ✅ Read | ✅ Read | ✅ Read |
| Create version | ❌ | ✅ Create | ✅ Create |
| Edit version (DRAFT) | ❌ | ✅ Edit | ✅ Edit |
| Edit version (LOCKED) | ❌ | ❌ | ✅ Edit |
| Duplicate version | ❌ | ✅ Create | ✅ Create |
| Delete version | ❌ | ❌ | ✅ Delete |
| Lock version | ❌ | ❌ | ✅ Update |
| **Reports** |
| View reports | ✅ Read | ✅ Read | ✅ Read |
| Generate report | ✅ Create | ✅ Create | ✅ Create |
| **Admin** |
| View settings | ❌ | ❌ | ✅ Read |
| Edit settings | ❌ | ❌ | ✅ Edit |
| Manage users | ❌ | ❌ | ✅ Manage |
| View audit logs | ❌ | ❌ | ✅ Read |

### 9.3 Data Security

**1. Sensitive Data Protection**
- Environment variables never committed (use `.env.local`)
- API keys stored in Vercel environment variables
- Database credentials stored in Supabase (never exposed)

**2. SQL Injection Prevention**
- All queries use Prisma (parameterized queries)
- No raw SQL unless absolutely necessary
- Input validation with Zod before database operations

**3. XSS Prevention**
- React escapes all user input by default
- Use `dangerouslySetInnerHTML` only with sanitized HTML
- Content Security Policy (CSP) headers

**4. CSRF Prevention**
- NextAuth.js includes CSRF tokens
- API routes verify origin header
- SameSite cookies enabled

---

## 10. Performance Optimization

### 10.1 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Financial Calculation | <50ms | Web Worker execution time |
| Page Load (FCP) | <2s | Lighthouse, Vercel Analytics |
| Report Generation | <5s | API route execution time |
| API Response (p95) | <200ms | Vercel Analytics |
| Bundle Size (Initial) | <500KB | Next.js build output |
| Lighthouse Score | >90 | Chrome DevTools |

### 10.2 Optimization Strategies

**1. Code Splitting**
```typescript
// Dynamic imports for heavy components
const ReportViewer = dynamic(() => import('@/components/reports/ReportViewer'), {
  loading: () => <ReportViewerSkeleton />,
  ssr: false, // Client-side only
});
```

**2. Image Optimization**
```typescript
// Use Next.js Image component (automatic optimization)
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Project Zeta"
  width={200}
  height={50}
  priority // Load immediately (above fold)
/>
```

**3. Database Query Optimization**
```typescript
// Add indexes on frequently queried columns
@@index([createdBy])
@@index([status, createdAt])
@@index([versionId, curriculumType])

// Use select to fetch only needed fields
const versions = await prisma.version.findMany({
  select: {
    id: true,
    name: true,
    status: true,
    createdAt: true,
    // Omit large fields like metadata
  },
});
```

**4. Caching Strategy**
```typescript
// React Server Components (RSC) - automatic caching
export default async function DashboardPage() {
  const versions = await prisma.version.findMany(); // Cached by Next.js
  return <Dashboard versions={versions} />;
}

// Revalidation (refresh cache every 60 seconds)
export const revalidate = 60;
```

---

## 11. Deployment Architecture

### 11.1 Production Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vercel Edge Network                      │
│                        (Global CDN)                             │
└────┬────────────────────────────────────────────────────────────┘
     │ HTTPS (SSL/TLS)
     ↓
┌──────────────────────────┐
│  Vercel Serverless       │
│  (US East)               │
├──────────────────────────┤
│  Next.js Server          │
│  - SSR (Server-side)     │
│  - API Routes            │
│  - Static Generation     │
└────┬─────────────────────┘
     │ PostgreSQL Protocol
     ↓
┌──────────────────────────┐
│  Supabase                │
│  (US East)               │
├──────────────────────────┤
│  PostgreSQL Database     │
│  - Connection Pooling    │
│  - Automatic Backups     │
│  - Multi-region Replica  │
└──────────────────────────┘
```

### 11.2 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      1. Checkout code
      2. Install dependencies (npm ci)
      3. Run type check (npm run type-check)
      4. Run linter (npm run lint)
      5. Run unit tests (npm run test)
      6. Run build (npm run build)
      7. Deploy to Vercel (automatic)
      8. Run smoke tests (production)
      9. Notify team (Slack)
```

### 11.3 Environment Variables

**Development (.env.local)**
```bash
DATABASE_URL=postgresql://dev_user:dev_pass@localhost:5432/dev_db?pgbouncer=true
DIRECT_URL=postgresql://dev_user:dev_pass@localhost:5432/dev_db
NEXTAUTH_URL=http://localhost:3000
```

**Production (Vercel Dashboard)**
```bash
DATABASE_URL=postgresql://prod_user:***@supabase.com/prod_db?pgbouncer=true&sslmode=require
DIRECT_URL=postgresql://prod_user:***@supabase.com/prod_db?sslmode=require
NEXTAUTH_URL=https://projectzeta.yourcompany.com
NEXTAUTH_SECRET=*** (generated with openssl rand -base64 32)
```

---

## 12. Scalability Considerations

### 12.1 Current Scale (MVP)

- **Users:** 10-50 concurrent users
- **Versions:** 100-500 versions
- **Calculations:** 10-50 per minute
- **Reports:** 5-20 per day
- **Database Size:** <1 GB

### 12.2 Growth Strategy (Year 1-2)

**If User Count Grows (100-500 users):**
- ✅ Vercel scales automatically (serverless)
- ✅ Supabase handles increased connections (pgBouncer)
- ⚠️ Consider read replicas for analytics queries

**If Version Count Grows (1,000-10,000):**
- ✅ Database indexes handle scale
- ⚠️ Implement pagination on all lists (already planned)
- ⚠️ Add search functionality (full-text search)

**If Calculation Load Grows:**
- ✅ Web Workers prevent UI blocking
- ⚠️ Consider server-side calculation queue
- ⚠️ Implement calculation result caching

**If Report Generation Grows (100+ per day):**
- ✅ Background job queue (Vercel Cron or Queue)
- ✅ Store generated reports in Vercel Blob Storage
- ⚠️ Email reports instead of real-time generation

### 12.3 Future Enhancements

**Phase 2 (If Needed):**
- Multi-tenancy (separate data per school)
- Advanced analytics (BI dashboards)
- Real-time collaboration (multiple users editing same version)
- Mobile apps (React Native)
- AI-powered recommendations (optimal rent model suggestions)

---

## 📊 Architecture Decision Records (ADRs)

### ADR-001: Why Next.js 16 App Router?

**Decision:** Use Next.js 16 with App Router instead of Pages Router

**Reasoning:**
- Server Components reduce bundle size (less JavaScript to client)
- Built-in data fetching patterns (no need for getServerSideProps)
- Improved performance with streaming and Suspense
- Better TypeScript support
- Future-proof (App Router is the future of Next.js)

**Trade-offs:**
- Learning curve for team (new paradigm)
- Some libraries not yet compatible with App Router
- Breaking changes from Pages Router

**Status:** ✅ Accepted

---

### ADR-002: Why Decimal.js for Financial Calculations?

**Decision:** Use Decimal.js for all money calculations instead of native JavaScript numbers

**Reasoning:**
- JavaScript numbers are floating point (0.1 + 0.2 = 0.30000000000000004)
- Financial calculations require exact precision
- Decimal.js provides arbitrary precision arithmetic
- Industry standard for financial applications

**Trade-offs:**
- Slightly slower than native numbers (acceptable for our scale)
- More verbose syntax (`.times()` instead of `*`)
- Additional dependency (14 KB)

**Status:** ✅ Accepted (MANDATORY for financial apps)

---

### ADR-003: Why Web Workers for Calculations?

**Decision:** Use Web Workers for heavy financial calculations instead of running on main thread

**Reasoning:**
- 30-year projections with 15+ columns = 450+ data points to calculate
- Main thread calculations block UI (poor user experience)
- Web Workers run in background (non-blocking)
- Achieves <50ms performance target

**Trade-offs:**
- More complex code (message passing)
- Cannot access DOM from worker
- Debugging is harder

**Status:** ✅ Accepted (required for performance)

---

### ADR-004: Why Prisma ORM?

**Decision:** Use Prisma as database ORM instead of raw SQL or other ORMs

**Reasoning:**
- Type-safe database queries (TypeScript integration)
- Automatic migrations (schema version control)
- Built-in connection pooling (pgBouncer)
- Excellent developer experience (Prisma Studio)
- Active community and documentation

**Trade-offs:**
- Generates large TypeScript types file
- Some complex queries require raw SQL
- Vendor lock-in (Prisma-specific schema)

**Status:** ✅ Accepted

---

## 🔗 Related Documentation

- **PRD.md** - Product Requirements Document
- **.cursorrules** - Development standards and code patterns
- **DELIVERY_PLAN.md** - Phased implementation plan
- **API.md** - API endpoint documentation
- **SCHEMA.md** - Database schema reference
- **README.md** - Setup and quick start guide

---

**Document Version:** 1.0  
**Last Updated:** November 13, 2025  
**Next Review:** After Phase 1 completion  
**Maintained By:** Dev Team

