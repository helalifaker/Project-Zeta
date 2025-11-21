# Project Zeta - Database Schema

## PostgreSQL Database Design (Prisma ORM)

**Version:** 2.0  
**Last Updated:** November 21, 2025  
**Database:** PostgreSQL 15+ (Supabase)  
**ORM:** Prisma 5.x

---

## 📋 Table of Contents

1. [Schema Overview](#schema-overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Table Definitions](#table-definitions)
4. [Relationships](#relationships)
5. [Indexes](#indexes)
6. [Constraints](#constraints)
7. [Enums](#enums)
8. [Migrations](#migrations)

---

## 1. Schema Overview

### Database Tables (15 Core Tables)

| #   | Table Name               | Purpose                            | Relationships                                                                                                                                                              |
| --- | ------------------------ | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `users`                  | User authentication and roles      | → versions, reports, tuition_simulations, audit_logs                                                                                                                       |
| 2   | `versions`               | Financial scenario versions        | ← curriculum_plans, rent_plans, capex_items, capex_rules, opex_sub_accounts, reports, tuition_simulations, other_revenue_items, balance_sheet_settings, historical_actuals |
| 3   | `curriculum_plans`       | Curriculum configurations (FR, IB) | → versions                                                                                                                                                                 |
| 4   | `rent_plans`             | Rent model configurations          | → versions                                                                                                                                                                 |
| 5   | `capex_items`            | Capital expenditure items          | → versions, capex_rules                                                                                                                                                    |
| 6   | `capex_rules`            | Recurring capex rules              | → versions, ← capex_items                                                                                                                                                  |
| 7   | `opex_sub_accounts`      | Operating expense sub-accounts     | → versions                                                                                                                                                                 |
| 8   | `tuition_simulations`    | Saved tuition simulation scenarios | → versions, users                                                                                                                                                          |
| 9   | `reports`                | Generated report metadata          | → versions (optional), users                                                                                                                                               |
| 10  | `other_revenue_items`    | Non-tuition revenue by year        | → versions                                                                                                                                                                 |
| 11  | `balance_sheet_settings` | Starting cash and opening equity   | → versions                                                                                                                                                                 |
| 12  | `historical_actuals`     | Actual financial data (2023-2024)  | → versions                                                                                                                                                                 |
| 13  | `transition_year_data`   | Transition period data (2025-2027) | - (global settings)                                                                                                                                                        |
| 14  | `audit_logs`             | Audit trail for all mutations      | → users                                                                                                                                                                    |
| 15  | `admin_settings`         | Global admin settings              | -                                                                                                                                                                          |

### Data Volume Estimates (Year 1)

- **Users:** 10-50 rows
- **Versions:** 100-500 rows
- **Curriculum Plans:** 200-1,000 rows (2 per version)
- **Rent Plans:** 100-500 rows (1 per version)
- **Capex Items:** 500-5,000 rows (avg 5-10 per version)
- **Capex Rules:** 50-500 rows (avg 1-5 per version)
- **Opex Sub-Accounts:** 500-5,000 rows (avg 5-10 per version)
- **Tuition Simulations:** 200-1,000 rows (2-3 per version)
- **Reports:** 500-2,000 rows (generated reports)
- **Other Revenue Items:** 3,000-15,000 rows (30 years × versions)
- **Balance Sheet Settings:** 100-500 rows (1 per version)
- **Historical Actuals:** 200-1,000 rows (2 years × versions)
- **Transition Year Data:** 3 rows (2025, 2026, 2027)
- **Audit Logs:** 10,000-100,000 rows (grows continuously)
- **Admin Settings:** 15-30 rows (key-value pairs)

**Total Estimated Size:** <2 GB (Year 1)

---

## 2. Entity Relationship Diagram

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK)         │
│ email           │
│ name            │
│ role            │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │
         │ created_by (FK)
         ↓
┌──────────────────────────────────────────────────────────────────┐
│                          versions                                │
│──────────────────────────────────────────────────────────────────│
│ id (PK)                                                          │
│ name                                                             │
│ description                                                      │
│ mode (ENUM)                                                      │
│ status (ENUM)                                                    │
│ created_by (FK → users.id)                                      │
│ based_on_id (FK → versions.id, self-reference)                 │
│ created_at                                                       │
│ updated_at                                                       │
└────┬──────┬──────┬──────┬──────────────────────────────────────┘
     │      │      │      │
     │      │      │      └──────────────────────────┐
     │      │      │                                  │
     │      │      │ version_id (FK)                 │ version_id (FK)
     ↓      ↓      ↓                                  ↓
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────────────┐
│curriculum│ │   rent   │ │  capex   │ │   opex_sub_accounts     │
│  _plans  │ │  _plans  │ │  _items  │ │─────────────────────────│
│──────────│ │──────────│ │──────────│ │ id (PK)                 │
│ id (PK)  │ │ id (PK)  │ │ id (PK)  │ │ version_id (FK)         │
│ version_ │ │ version_ │ │ version_ │ │ sub_account_name        │
│ id (FK)  │ │ id (FK)  │ │ id (FK)  │ │ percent_of_revenue      │
│ curricul │ │ rent_    │ │ year     │ │ is_fixed                │
│ um_type  │ │ model    │ │ category │ │ fixed_amount            │
│ capacity │ │ parame   │ │ amount   │ │ created_at              │
│ tuition_ │ │ ters     │ │ descript │ │ updated_at              │
│ base     │ │ (JSONB)  │ │ ion      │ └─────────────────────────┘
│ cpi_freq │ │ created_ │ │ created_ │
│ uency    │ │ at       │ │ at       │
│ students │ │ updated_ │ │ updated_ │
│ _project │ │ at       │ │ at       │
│ ion      │ └──────────┘ └──────────┘
│ (JSONB)  │
│ created_ │
│ at       │
│ updated_ │
│ at       │
└──────────┘

     ↓ version_id (FK)
┌────────────────────────┐
│  tuition_simulations   │
│────────────────────────│
│ id (PK)                │
│ version_id (FK)        │
│ name                   │
│ adjustments (JSONB)    │
│ created_by (FK)        │
│ created_at             │
└────────────────────────┘

┌─────────────────┐              ┌─────────────────┐
│  audit_logs     │              │ admin_settings  │
│─────────────────│              │─────────────────│
│ id (PK)         │              │ id (PK)         │
│ action          │              │ key (UNIQUE)    │
│ user_id (FK)    │              │ value (JSONB)   │
│ entity_type     │              │ updated_at      │
│ entity_id       │              │ updated_by (FK) │
│ metadata (JSONB)│              └─────────────────┘
│ timestamp       │
│ ip_address      │
│ user_agent      │
└─────────────────┘
```

---

## 3. Table Definitions

### 3.1 Users Table

```prisma
model User {
  id              String   @id @default(uuid())
  email           String   @unique
  emailVerified   DateTime?
  name            String?
  password        String?  // Hashed (bcrypt)
  role            Role     @default(VIEWER)
  image           String?  // Profile picture URL
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  lastLoginAt     DateTime?

  // Relationships
  versions        Version[]         @relation("UserCreatedVersions")
  simulations     TuitionSimulation[] @relation("UserCreatedSimulations")
  auditLogs       AuditLog[]

  // Indexes
  @@index([email])
  @@index([role])
  @@map("users")
}

enum Role {
  ADMIN
  PLANNER
  VIEWER
}
```

**Fields:**

- `id`: UUID primary key
- `email`: Unique email address (login credential)
- `emailVerified`: Email verification timestamp (NextAuth.js)
- `name`: Full name
- `password`: Hashed password (bcrypt, null for OAuth users)
- `role`: User role (ADMIN, PLANNER, VIEWER)
- `image`: Profile picture URL (optional)
- `createdAt`: Account creation timestamp
- `updatedAt`: Last profile update timestamp
- `lastLoginAt`: Last successful login timestamp

---

### 3.2 Versions Table

```prisma
model Version {
  id              String   @id @default(uuid())
  name            String
  description     String?  @db.Text
  mode            VersionMode
  status          VersionStatus @default(DRAFT)
  createdBy       String
  basedOnId       String?  // Self-reference for duplicates

  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  lockedAt        DateTime?
  lockedBy        String?
  lockReason      String?  @db.Text

  // Relationships
  creator         User     @relation("UserCreatedVersions", fields: [createdBy], references: [id])
  basedOn         Version? @relation("VersionBasedOn", fields: [basedOnId], references: [id])
  derivatives     Version[] @relation("VersionBasedOn")

  curriculumPlans CurriculumPlan[]
  rentPlan        RentPlan?
  capexItems      CapexItem[]
  opexSubAccounts OpexSubAccount[]
  simulations     TuitionSimulation[]

  // Constraints & Indexes
  @@unique([name, createdBy])  // Unique name per user
  @@index([createdBy])
  @@index([status, createdAt])
  @@index([mode])
  @@map("versions")
}

enum VersionMode {
  RELOCATION_2028
  HISTORICAL_BASELINE
}

enum VersionStatus {
  DRAFT
  READY
  APPROVED
  LOCKED
}
```

**Fields:**

- `id`: UUID primary key
- `name`: Version name (unique per user)
- `description`: Optional description
- `mode`: Version mode (RELOCATION_2028 or HISTORICAL_BASELINE)
- `status`: Version status (DRAFT → READY → APPROVED → LOCKED)
- `createdBy`: User ID who created this version
- `basedOnId`: Version ID this was duplicated from (nullable)
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `lockedAt`: When version was locked (nullable)
- `lockedBy`: User ID who locked the version (nullable)
- `lockReason`: Reason for locking (nullable)
- `transitionCapacity`: Capacity cap for transition period (nullable, default: 1850)

---

### 3.3 Curriculum Plans Table

```prisma
model CurriculumPlan {
  id                 String   @id @default(uuid())
  versionId          String
  curriculumType     CurriculumType
  capacity           Int
  tuitionBase        Decimal  @db.Decimal(15, 2)
  cpiFrequency       Int      // 1, 2, or 3 years
  studentsProjection Json     // [{year: 2023, students: 300}, ...]

  // Timestamps
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  // Relationships
  version            Version  @relation(fields: [versionId], references: [id], onDelete: Cascade)

  // Constraints & Indexes
  @@unique([versionId, curriculumType])  // One plan per curriculum per version
  @@index([versionId])
  @@check(capacity > 0, name: "capacity_positive")
  @@check(tuitionBase > 0, name: "tuition_positive")
  @@check(cpiFrequency >= 1 AND cpiFrequency <= 3, name: "cpi_frequency_valid")
  @@map("curriculum_plans")
}

enum CurriculumType {
  FR  // French Curriculum
  IB  // International Baccalaureate
}
```

**Fields:**

- `id`: UUID primary key
- `versionId`: Foreign key to versions table
- `curriculumType`: FR or IB
- `capacity`: Maximum students (e.g., 400 for FR, 200 for IB)
- `tuitionBase`: Base tuition amount in SAR (e.g., 50000.00)
- `cpiFrequency`: Apply CPI every N years (1, 2, or 3)
- `studentsProjection`: JSON array of {year, students} for 30 years
- `teacherRatio`: Teacher-to-student ratio (optional, e.g., 0.0714 for 1:14)
- `nonTeacherRatio`: Non-teacher-to-student ratio (optional)
- `teacherMonthlySalary`: Average monthly teacher salary in SAR (optional)
- `nonTeacherMonthlySalary`: Average monthly non-teacher salary in SAR (optional)
- `tuitionGrowthRate`: Custom tuition growth rate override (optional, overrides CPI)
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Example JSON (studentsProjection):**

```json
[
  {"year": 2023, "students": 0},
  {"year": 2024, "students": 0},
  {"year": 2025, "students": 0},
  {"year": 2026, "students": 0},
  {"year": 2027, "students": 0},
  {"year": 2028, "students": 300},
  {"year": 2029, "students": 350},
  ...
  {"year": 2052, "students": 400}
]
```

---

### 3.4 Rent Plans Table

```prisma
model RentPlan {
  id         String   @id @default(uuid())
  versionId  String   @unique  // One rent plan per version
  rentModel  RentModel
  parameters Json     // Model-specific parameters

  // Timestamps
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  // Relationships
  version    Version  @relation(fields: [versionId], references: [id], onDelete: Cascade)

  // Indexes
  @@index([rentModel])
  @@map("rent_plans")
}

enum RentModel {
  FIXED_ESCALATION
  REVENUE_SHARE
  PARTNER_MODEL
}
```

**Fields:**

- `id`: UUID primary key
- `versionId`: Foreign key to versions table (unique)
- `rentModel`: Type of rent model (FIXED_ESCALATION, REVENUE_SHARE, PARTNER_MODEL)
- `parameters`: JSONB field with model-specific parameters
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Example JSON (parameters for FIXED_ESCALATION):**

```json
{
  "baseRent": 5000000.0,
  "escalationRate": 0.04
}
```

**Example JSON (parameters for REVENUE_SHARE):**

```json
{
  "revenueSharePercent": 0.08
}
```

**Example JSON (parameters for PARTNER_MODEL):**

```json
{
  "landSize": 10000,
  "landPricePerSqm": 5000,
  "buaSize": 8000,
  "constructionCostPerSqm": 3000,
  "yieldBase": 0.045
}
```

---

### 3.5 Capex Items Table

```prisma
model CapexItem {
  id          String   @id @default(uuid())
  versionId   String
  year        Int
  category    CapexCategory
  amount      Decimal  @db.Decimal(15, 2)
  description String?  @db.Text

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  version     Version  @relation(fields: [versionId], references: [id], onDelete: Cascade)

  // Constraints & Indexes
  @@index([versionId, year])
  @@check(year >= 2023 AND year <= 2052, name: "year_valid")
  @@check(amount >= 0, name: "amount_non_negative")
  @@map("capex_items")
}

enum CapexCategory {
  BUILDING
  TECHNOLOGY
  EQUIPMENT
  FURNITURE
  VEHICLES
  OTHER
}
```

**Fields:**

- `id`: UUID primary key
- `versionId`: Foreign key to versions table
- `ruleId`: Foreign key to capex_rules table (nullable, if generated from rule)
- `year`: Year of capex (2023-2052)
- `category`: Capex category
- `amount`: Capex amount in SAR
- `description`: Optional description
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

---

### 3.6 Capex Rules Table

```prisma
model capex_rules {
  id            String        @id @default(uuid())
  versionId     String
  category      CapexCategory
  cycleYears    Int
  baseCost      Decimal       @db.Decimal(15, 2)
  startingYear  Int
  inflationIndex String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  versions      versions      @relation(fields: [versionId], references: [id], onDelete: Cascade)
  capex_items   capex_items[]

  @@index([versionId])
  @@map("capex_rules")
}
```

**Fields:**

- `id`: UUID primary key
- `versionId`: Foreign key to versions table
- `category`: Capex category (matches CapexCategory enum)
- `cycleYears`: Recurrence cycle in years (e.g., 5 for every 5 years)
- `baseCost`: Base cost amount in SAR
- `startingYear`: First year when this rule applies
- `inflationIndex`: Optional inflation index name (e.g., "CPI")
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Purpose:** Defines recurring capex rules that automatically generate capex items at specified intervals with optional inflation adjustments.

**Example:** A rule for "Technology Refresh" every 3 years starting in 2028 with base cost of 500,000 SAR would generate capex items in 2028, 2031, 2034, etc.

---

### 3.7 Opex Sub-Accounts Table

```prisma
model OpexSubAccount {
  id                String   @id @default(uuid())
  versionId         String
  subAccountName    String
  percentOfRevenue  Decimal? @db.Decimal(5, 2)  // e.g., 3.00 for 3%
  isFixed           Boolean
  fixedAmount       Decimal? @db.Decimal(15, 2)

  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relationships
  version           Version  @relation(fields: [versionId], references: [id], onDelete: Cascade)

  // Constraints & Indexes
  @@unique([versionId, subAccountName])  // Unique sub-account per version
  @@index([versionId])
  @@check(
    (isFixed = true AND fixedAmount IS NOT NULL) OR
    (isFixed = false AND percentOfRevenue IS NOT NULL),
    name: "opex_valid"
  )
  @@map("opex_sub_accounts")
}
```

**Fields:**

- `id`: UUID primary key
- `versionId`: Foreign key to versions table
- `subAccountName`: Name of sub-account (e.g., "Marketing", "Utilities")
- `percentOfRevenue`: Percentage of revenue (nullable if fixed)
- `isFixed`: Boolean flag (true = fixed amount, false = % of revenue)
- `fixedAmount`: Fixed amount in SAR (nullable if % of revenue)
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Examples:**

- Variable: `{subAccountName: "Marketing", percentOfRevenue: 3.00, isFixed: false, fixedAmount: null}`
- Fixed: `{subAccountName: "Utilities", percentOfRevenue: null, isFixed: true, fixedAmount: 200000.00}`

---

### 3.8 Tuition Simulations Table

```prisma
model TuitionSimulation {
  id          String   @id @default(uuid())
  versionId   String
  name        String
  adjustments Json     // {FR: {tuitionBase: 55000, ...}, IB: {...}}
  createdBy   String

  // Timestamps
  createdAt   DateTime @default(now())

  // Relationships
  version     Version  @relation(fields: [versionId], references: [id], onDelete: Cascade)
  creator     User     @relation("UserCreatedSimulations", fields: [createdBy], references: [id])

  // Indexes
  @@index([versionId])
  @@index([createdBy])
  @@map("tuition_simulations")
}
```

**Fields:**

- `id`: UUID primary key
- `versionId`: Foreign key to versions table
- `name`: Simulation name (e.g., "Higher Tuition Scenario")
- `adjustments`: JSONB field with tuition adjustments
- `createdBy`: User ID who created this simulation
- `createdAt`: Creation timestamp

**Example JSON (adjustments):**

```json
{
  "FR": {
    "tuitionBase": 55000.00,
    "studentsProjection": [
      {"year": 2028, "students": 320},
      {"year": 2029, "students": 370},
      ...
    ]
  },
  "IB": {
    "tuitionBase": 67000.00,
    "studentsProjection": [
      {"year": 2028, "students": 35},
      {"year": 2029, "students": 70},
      ...
    ]
  }
}
```

---

### 3.9 Reports Table

```prisma
model reports {
  id          String       @id @default(uuid())
  versionId   String?
  reportType  ReportType
  format      ReportFormat
  fileName    String
  filePath    String
  fileSize    Int
  downloadUrl String
  expiresAt   DateTime
  generatedBy String
  generatedAt DateTime     @default(now())
  metadata    Json?
  deletedAt   DateTime?
  users       users        @relation(fields: [generatedBy], references: [id])
  versions    versions?    @relation(fields: [versionId], references: [id])

  @@index([expiresAt])
  @@index([format])
  @@index([generatedAt])
  @@index([generatedBy])
  @@index([reportType])
  @@index([versionId])
  @@map("reports")
}
```

**Fields:**

- `id`: UUID primary key
- `versionId`: Foreign key to versions table (nullable, for version-specific reports)
- `reportType`: Type of report (EXECUTIVE_SUMMARY, FINANCIAL_DETAIL, COMPARISON)
- `format`: File format (PDF, EXCEL, CSV)
- `fileName`: Original file name
- `filePath`: Storage path in blob storage
- `fileSize`: File size in bytes
- `downloadUrl`: Temporary download URL
- `expiresAt`: URL expiration timestamp
- `generatedBy`: User ID who generated the report
- `generatedAt`: Generation timestamp
- `metadata`: Additional report metadata (JSONB)
- `deletedAt`: Soft delete timestamp (nullable)

**Purpose:** Stores metadata for generated reports (PDF, Excel, CSV) with automatic expiration for download URLs.

---

### 3.10 Other Revenue Items Table

```prisma
model other_revenue_items {
  id        String   @id @default(uuid())
  versionId String
  year      Int
  amount    Decimal  @default(0) @db.Decimal(15, 2)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  versions  versions @relation(fields: [versionId], references: [id], onDelete: Cascade)

  @@unique([versionId, year])
  @@index([versionId, year])
  @@map("other_revenue_items")
}
```

**Fields:**

- `id`: UUID primary key
- `versionId`: Foreign key to versions table
- `year`: Year for this revenue item (2023-2052)
- `amount`: Other revenue amount in SAR (non-tuition revenue)
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Purpose:** Stores non-tuition revenue items by year (e.g., transportation fees, meal plans, activities).

**Note:** One entry per year per version (unique constraint on versionId + year).

---

### 3.11 Balance Sheet Settings Table

```prisma
model balance_sheet_settings {
  id            String   @id @default(uuid())
  versionId     String   @unique
  startingCash  Decimal  @default(0) @db.Decimal(15, 2)
  openingEquity Decimal  @default(0) @db.Decimal(15, 2)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  versions      versions @relation(fields: [versionId], references: [id], onDelete: Cascade)

  @@index([versionId])
  @@map("balance_sheet_settings")
}
```

**Fields:**

- `id`: UUID primary key
- `versionId`: Foreign key to versions table (unique, one per version)
- `startingCash`: Starting cash balance in SAR for projections
- `openingEquity`: Opening equity balance in SAR for projections
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Purpose:** Defines initial balance sheet values for financial projections (used by circular solver).

---

### 3.12 Historical Actuals Table

```prisma
model historical_actuals {
  id        String   @id @default(uuid())
  versionId String
  year      Int

  // P&L - Revenue
  tuitionFrenchCurriculum Decimal @default(0) @db.Decimal(15, 2)
  tuitionIB               Decimal @default(0) @db.Decimal(15, 2)
  otherIncome             Decimal @default(0) @db.Decimal(15, 2)
  totalRevenues           Decimal @default(0) @db.Decimal(15, 2)

  // P&L - Expenses
  salariesAndRelatedCosts Decimal @default(0) @db.Decimal(15, 2)
  schoolRent              Decimal @default(0) @db.Decimal(15, 2)
  otherExpenses           Decimal @default(0) @db.Decimal(15, 2)
  totalOperatingExpenses  Decimal @default(0) @db.Decimal(15, 2)

  // P&L - Other
  depreciationAmortization Decimal @default(0) @db.Decimal(15, 2)
  interestIncome           Decimal @default(0) @db.Decimal(15, 2)
  interestExpenses         Decimal @default(0) @db.Decimal(15, 2)
  netResult                Decimal @default(0) @db.Decimal(15, 2)

  // Balance Sheet - Assets
  cashOnHandAndInBank              Decimal @default(0) @db.Decimal(15, 2)
  accountsReceivableAndOthers      Decimal @default(0) @db.Decimal(15, 2)
  totalCurrentAssets               Decimal @default(0) @db.Decimal(15, 2)
  tangibleIntangibleAssetsGross    Decimal @default(0) @db.Decimal(15, 2)
  accumulatedDepreciationAmort     Decimal @default(0) @db.Decimal(15, 2)
  nonCurrentAssets                 Decimal @default(0) @db.Decimal(15, 2)
  totalAssets                      Decimal @default(0) @db.Decimal(15, 2)

  // Balance Sheet - Liabilities
  accountsPayable         Decimal @default(0) @db.Decimal(15, 2)
  deferredIncome          Decimal @default(0) @db.Decimal(15, 2)
  totalCurrentLiabilities Decimal @default(0) @db.Decimal(15, 2)
  provisions              Decimal @default(0) @db.Decimal(15, 2)
  totalLiabilities        Decimal @default(0) @db.Decimal(15, 2)

  // Balance Sheet - Equity
  retainedEarnings Decimal @default(0) @db.Decimal(15, 2)
  equity           Decimal @default(0) @db.Decimal(15, 2)

  // Cash Flow - Operating Activities
  cfNetResult                    Decimal @default(0) @db.Decimal(15, 2)
  cfAccountsReceivable           Decimal @default(0) @db.Decimal(15, 2)
  cfPrepaidExpenses              Decimal @default(0) @db.Decimal(15, 2)
  cfLoans                        Decimal @default(0) @db.Decimal(15, 2)
  cfIntangibleAssets             Decimal @default(0) @db.Decimal(15, 2)
  cfAccountsPayable              Decimal @default(0) @db.Decimal(15, 2)
  cfAccruedExpenses              Decimal @default(0) @db.Decimal(15, 2)
  cfDeferredIncome               Decimal @default(0) @db.Decimal(15, 2)
  cfProvisions                   Decimal @default(0) @db.Decimal(15, 2)
  cfDepreciation                 Decimal @default(0) @db.Decimal(15, 2)
  netCashFromOperatingActivities Decimal @default(0) @db.Decimal(15, 2)

  // Cash Flow - Investing Activities
  cfAdditionsFixedAssets         Decimal @default(0) @db.Decimal(15, 2)
  netCashFromInvestingActivities Decimal @default(0) @db.Decimal(15, 2)

  // Cash Flow - Financing Activities
  cfChangesInFundBalance         Decimal @default(0) @db.Decimal(15, 2)
  netCashFromFinancingActivities Decimal @default(0) @db.Decimal(15, 2)

  // Cash Flow - Summary
  netIncreaseDecreaseCash Decimal @default(0) @db.Decimal(15, 2)
  cashBeginningOfPeriod   Decimal @default(0) @db.Decimal(15, 2)
  cashEndOfPeriod         Decimal @default(0) @db.Decimal(15, 2)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  versions  versions @relation(fields: [versionId], references: [id], onDelete: Cascade)

  @@unique([versionId, year])
  @@index([versionId])
  @@map("historical_actuals")
}
```

**Fields:**

- `id`: UUID primary key
- `versionId`: Foreign key to versions table
- `year`: Year of historical data (typically 2023-2024)

**P&L Fields:**

- Revenue: `tuitionFrenchCurriculum`, `tuitionIB`, `otherIncome`, `totalRevenues`
- Expenses: `salariesAndRelatedCosts`, `schoolRent`, `otherExpenses`, `totalOperatingExpenses`
- Other: `depreciationAmortization`, `interestIncome`, `interestExpenses`, `netResult`

**Balance Sheet Fields:**

- Assets: `cashOnHandAndInBank`, `accountsReceivableAndOthers`, `totalCurrentAssets`, `tangibleIntangibleAssetsGross`, `accumulatedDepreciationAmort`, `nonCurrentAssets`, `totalAssets`
- Liabilities: `accountsPayable`, `deferredIncome`, `totalCurrentLiabilities`, `provisions`, `totalLiabilities`
- Equity: `retainedEarnings`, `equity`

**Cash Flow Fields:**

- Operating: Multiple `cf*` fields and `netCashFromOperatingActivities`
- Investing: `cfAdditionsFixedAssets`, `netCashFromInvestingActivities`
- Financing: `cfChangesInFundBalance`, `netCashFromFinancingActivities`
- Summary: `netIncreaseDecreaseCash`, `cashBeginningOfPeriod`, `cashEndOfPeriod`

**Purpose:** Stores complete historical financial statements (P&L, Balance Sheet, Cash Flow) for years 2023-2024. Used as baseline data for projections and transition period calculations.

**Note:** One entry per year per version (unique constraint on versionId + year).

---

### 3.13 Transition Year Data Table

```prisma
model transition_year_data {
  id               String   @id @default(uuid())
  year             Int      @unique
  targetEnrollment Int      @map("target_enrollment")
  staffCostBase    Decimal  @db.Decimal(15, 2) @map("staff_cost_base")
  notes            String?

  // Revenue components
  averageTuitionPerStudent Decimal? @db.Decimal(15, 2) @map("average_tuition_per_student")
  otherRevenue            Decimal? @default(0) @db.Decimal(15, 2) @map("other_revenue")

  // Operating expenses
  opex                    Decimal? @db.Decimal(15, 2) @map("opex")

  // Growth percentages (from 2024 base year)
  staffCostGrowthPercent  Decimal? @db.Decimal(5, 2) @map("staff_cost_growth_percent")
  rentGrowthPercent       Decimal? @db.Decimal(5, 2) @map("rent_growth_percent")

  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  @@index([year])
  @@map("transition_year_data")
}
```

**Fields:**

- `id`: UUID primary key
- `year`: Year (unique, typically 2025, 2026, or 2027)
- `targetEnrollment`: Target student enrollment for this year (subject to capacity cap)
- `staffCostBase`: Base staff costs in SAR for this year
- `notes`: Optional notes about this transition year
- `averageTuitionPerStudent`: Average tuition per student (FR curriculum only)
- `otherRevenue`: Other non-tuition revenue
- `opex`: Operating expenses
- `staffCostGrowthPercent`: Staff cost growth percentage from 2024 baseline
- `rentGrowthPercent`: Rent growth percentage from 2024 baseline
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Purpose:** Stores admin-adjustable parameters for transition period planning (2025-2027). Only FR curriculum operates during transition (IB is not active).

**Business Rules:**

- IB curriculum is NOT active during transition (2025-2027)
- `averageTuitionPerStudent` represents FR curriculum tuition only
- Total enrollment per year (no FR/IB split needed)
- Revenue calculation: `targetEnrollment × averageTuitionPerStudent + otherRevenue`

---

### 3.14 Audit Logs Table

```prisma
model AuditLog {
  id          String   @id @default(uuid())
  action      String   // e.g., "CREATE_VERSION", "UPDATE_TUITION", "LOCK_VERSION"
  userId      String
  entityType  EntityType
  entityId    String
  metadata    Json?    // Additional context
  timestamp   DateTime @default(now())
  ipAddress   String?
  userAgent   String?  @db.Text

  // Relationships
  user        User     @relation(fields: [userId], references: [id])

  // Indexes
  @@index([userId, timestamp])
  @@index([entityType, entityId])
  @@index([action, timestamp])
  @@map("audit_logs")
}

enum EntityType {
  VERSION
  CURRICULUM
  RENT
  CAPEX
  OPEX
  USER
  SETTING
  REPORT
  TRANSITION_YEAR
}
```

**Fields:**

- `id`: UUID primary key
- `action`: Action performed (e.g., "CREATE_VERSION")
- `userId`: User ID who performed the action
- `entityType`: Type of entity modified
- `entityId`: ID of entity modified
- `metadata`: JSONB field with additional context
- `timestamp`: When action was performed
- `ipAddress`: IP address of user (nullable)
- `userAgent`: User agent string (nullable)

**Example JSON (metadata):**

```json
{
  "versionName": "V2 - Fixed Escalation 4%",
  "changes": {
    "tuitionBase": { "old": 50000, "new": 55000 },
    "escalationRate": { "old": 0.04, "new": 0.045 }
  }
}
```

---

### 3.15 Admin Settings Table

```prisma
model admin_settings {
  id                              String   @id @default(uuid())
  key                             String   @unique
  value                           Json     // JSONB field for flexible value types
  updatedAt                       DateTime @updatedAt
  updatedBy                       String?

  // Transition period global settings (2025-2027)
  transitionCapacityCap           Int?     @default(1850) @map("transition_capacity_cap")
  transitionRentAdjustmentPercent Decimal? @default(10.0) @db.Decimal(5, 2) @map("transition_rent_adjustment_percent")

  // Base year values for transition calculations (fetched from historical_actuals year 2024)
  transitionStaffCostBase2024     Decimal? @db.Decimal(15, 2) @map("transition_staff_cost_base_2024")
  transitionRentBase2024          Decimal? @db.Decimal(15, 2) @map("transition_rent_base_2024")

  @@index([key])
  @@map("admin_settings")
}
```

**Fields:**

- `id`: UUID primary key
- `key`: Setting key (unique, e.g., "cpiRate", "discountRate", "teacherStudentRatio")
- `value`: JSONB field with setting value
- `updatedAt`: Last update timestamp
- `updatedBy`: User ID who last updated (nullable)

**Transition Period Settings (2025-2027):**

- `transitionCapacityCap`: Maximum student enrollment during transition (physical constraint, default: 1850)
- `transitionRentAdjustmentPercent`: Rent adjustment from 2024 baseline (e.g., 10.0 = +10%, default: 10.0)
- `transitionStaffCostBase2024`: Base year (2024) staff costs for growth calculations (fetched from historical_actuals)
- `transitionRentBase2024`: Base year (2024) rent for growth calculations (fetched from historical_actuals)

**Important Notes:**

- FORMULA-001: `teacherStudentRatio` MUST be stored as DECIMAL between 0 and 1 (e.g., 0.0714 for 7.14%)
- Valid range: 0.0-1.0
- Example: 0.0714 means 1 teacher per 14 students (1 / 14 = 0.0714)
- INVALID: 7.14 (percentage format - must be converted to decimal)

**Example Rows:**

```json
[
  { "key": "cpiRate", "value": 0.03 },
  { "key": "discountRate", "value": 0.08 },
  { "key": "taxRate", "value": 0.15 },
  { "key": "currency", "value": "SAR" },
  { "key": "timezone", "value": "Asia/Riyadh" },
  { "key": "dateFormat", "value": "DD/MM/YYYY" }
]
```

---

## 4. Relationships

### One-to-Many Relationships

| Parent Table  | Child Table              | Foreign Key    | On Delete           |
| ------------- | ------------------------ | -------------- | ------------------- |
| `users`       | `versions`               | `created_by`   | Restrict            |
| `users`       | `tuition_simulations`    | `created_by`   | Restrict            |
| `users`       | `reports`                | `generated_by` | Restrict            |
| `users`       | `audit_logs`             | `user_id`      | Restrict            |
| `versions`    | `curriculum_plans`       | `version_id`   | Cascade             |
| `versions`    | `capex_items`            | `version_id`   | Cascade             |
| `versions`    | `capex_rules`            | `version_id`   | Cascade             |
| `versions`    | `opex_sub_accounts`      | `version_id`   | Cascade             |
| `versions`    | `tuition_simulations`    | `version_id`   | Cascade             |
| `versions`    | `reports`                | `version_id`   | Set Null (nullable) |
| `versions`    | `other_revenue_items`    | `version_id`   | Cascade             |
| `versions`    | `balance_sheet_settings` | `version_id`   | Cascade             |
| `versions`    | `historical_actuals`     | `version_id`   | Cascade             |
| `capex_rules` | `capex_items`            | `rule_id`      | Set Null (nullable) |

### One-to-One Relationships

| Parent Table | Child Table              | Foreign Key           | On Delete |
| ------------ | ------------------------ | --------------------- | --------- |
| `versions`   | `rent_plans`             | `version_id` (unique) | Cascade   |
| `versions`   | `balance_sheet_settings` | `version_id` (unique) | Cascade   |

### Self-Referencing Relationships

| Table      | Relationship         | Foreign Key              |
| ---------- | -------------------- | ------------------------ |
| `versions` | `based_on_id` → `id` | `based_on_id` (nullable) |

**Example:** V2 duplicated from V1

- V1: `{id: "uuid-1", basedOnId: null}`
- V2: `{id: "uuid-2", basedOnId: "uuid-1"}`

---

## 5. Indexes

### Primary Indexes (Automatic)

- All `id` fields are primary keys with automatic B-tree indexes

### Secondary Indexes (Performance)

**users table:**

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**versions table:**

```sql
CREATE INDEX idx_versions_created_by ON versions(created_by);
CREATE INDEX idx_versions_status_created_at ON versions(status, created_at);
CREATE INDEX idx_versions_mode ON versions(mode);
CREATE UNIQUE INDEX idx_versions_name_created_by ON versions(name, created_by);
```

**curriculum_plans table:**

```sql
CREATE INDEX idx_curriculum_plans_version_id ON curriculum_plans(version_id);
CREATE UNIQUE INDEX idx_curriculum_plans_version_curriculum ON curriculum_plans(version_id, curriculum_type);
```

**rent_plans table:**

```sql
CREATE INDEX idx_rent_plans_rent_model ON rent_plans(rent_model);
CREATE UNIQUE INDEX idx_rent_plans_version_id ON rent_plans(version_id);
```

**capex_items table:**

```sql
CREATE INDEX idx_capex_items_version_year ON capex_items(version_id, year);
```

**capex_rules table:**

```sql
CREATE INDEX idx_capex_rules_version_id ON capex_rules(version_id);
```

**opex_sub_accounts table:**

```sql
CREATE INDEX idx_opex_sub_accounts_version_id ON opex_sub_accounts(version_id);
CREATE UNIQUE INDEX idx_opex_version_name ON opex_sub_accounts(version_id, sub_account_name);
```

**tuition_simulations table:**

```sql
CREATE INDEX idx_tuition_simulations_version_id ON tuition_simulations(version_id);
CREATE INDEX idx_tuition_simulations_created_by ON tuition_simulations(created_by);
```

**audit_logs table:**

```sql
CREATE INDEX idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action_timestamp ON audit_logs(action, timestamp);
```

**reports table:**

```sql
CREATE INDEX idx_reports_expires_at ON reports(expires_at);
CREATE INDEX idx_reports_format ON reports(format);
CREATE INDEX idx_reports_generated_at ON reports(generated_at);
CREATE INDEX idx_reports_generated_by ON reports(generated_by);
CREATE INDEX idx_reports_report_type ON reports(report_type);
CREATE INDEX idx_reports_version_id ON reports(version_id);
```

**other_revenue_items table:**

```sql
CREATE UNIQUE INDEX idx_other_revenue_items_version_year ON other_revenue_items(version_id, year);
CREATE INDEX idx_other_revenue_items_version_year_idx ON other_revenue_items(version_id, year);
```

**balance_sheet_settings table:**

```sql
CREATE INDEX idx_balance_sheet_settings_version_id ON balance_sheet_settings(version_id);
CREATE UNIQUE INDEX idx_balance_sheet_settings_version_id_unique ON balance_sheet_settings(version_id);
```

**historical_actuals table:**

```sql
CREATE UNIQUE INDEX idx_historical_actuals_version_year ON historical_actuals(version_id, year);
CREATE INDEX idx_historical_actuals_version_id ON historical_actuals(version_id);
```

**transition_year_data table:**

```sql
CREATE UNIQUE INDEX idx_transition_year_data_year_unique ON transition_year_data(year);
CREATE INDEX idx_transition_year_data_year ON transition_year_data(year);
```

**admin_settings table:**

```sql
CREATE INDEX idx_admin_settings_key ON admin_settings(key);
CREATE UNIQUE INDEX idx_admin_settings_key_unique ON admin_settings(key);
```

---

## 6. Constraints

### Check Constraints

**curriculum_plans:**

```sql
ALTER TABLE curriculum_plans ADD CONSTRAINT capacity_positive CHECK (capacity > 0);
ALTER TABLE curriculum_plans ADD CONSTRAINT tuition_positive CHECK (tuition_base > 0);
ALTER TABLE curriculum_plans ADD CONSTRAINT cpi_frequency_valid CHECK (cpi_frequency >= 1 AND cpi_frequency <= 3);
```

**capex_items:**

```sql
ALTER TABLE capex_items ADD CONSTRAINT year_valid CHECK (year >= 2023 AND year <= 2052);
ALTER TABLE capex_items ADD CONSTRAINT amount_non_negative CHECK (amount >= 0);
```

**opex_sub_accounts:**

```sql
ALTER TABLE opex_sub_accounts ADD CONSTRAINT opex_valid CHECK (
  (is_fixed = true AND fixed_amount IS NOT NULL) OR
  (is_fixed = false AND percent_of_revenue IS NOT NULL)
);
```

### Unique Constraints

- `users.email` - Unique email address
- `versions.name + created_by` - Unique version name per user
- `curriculum_plans.version_id + curriculum_type` - One plan per curriculum per version
- `rent_plans.version_id` - One rent plan per version
- `balance_sheet_settings.version_id` - One balance sheet settings per version
- `opex_sub_accounts.version_id + sub_account_name` - Unique sub-account per version
- `other_revenue_items.version_id + year` - One revenue item per year per version
- `historical_actuals.version_id + year` - One historical record per year per version
- `transition_year_data.year` - One transition year record per year (2025-2027)
- `admin_settings.key` - Unique setting key

### Foreign Key Constraints

All foreign key constraints use `ON DELETE` behavior:

- **CASCADE:** Delete children when parent is deleted (version → curriculum, rent, capex, opex)
- **RESTRICT:** Prevent deletion if children exist (user → versions)

---

## 7. Enums

### Role

```sql
CREATE TYPE Role AS ENUM ('ADMIN', 'PLANNER', 'VIEWER');
```

### VersionMode

```sql
CREATE TYPE VersionMode AS ENUM ('RELOCATION_2028', 'HISTORICAL_BASELINE');
```

### VersionStatus

```sql
CREATE TYPE VersionStatus AS ENUM ('DRAFT', 'READY', 'APPROVED', 'LOCKED');
```

### CurriculumType

```sql
CREATE TYPE CurriculumType AS ENUM ('FR', 'IB');
```

### RentModel

```sql
CREATE TYPE RentModel AS ENUM ('FIXED_ESCALATION', 'REVENUE_SHARE', 'PARTNER_MODEL');
```

### CapexCategory

```sql
CREATE TYPE CapexCategory AS ENUM ('BUILDING', 'TECHNOLOGY', 'EQUIPMENT', 'FURNITURE', 'VEHICLES', 'OTHER');
```

### ReportFormat

```sql
CREATE TYPE ReportFormat AS ENUM ('PDF', 'EXCEL', 'CSV');
```

### ReportType

```sql
CREATE TYPE ReportType AS ENUM ('EXECUTIVE_SUMMARY', 'FINANCIAL_DETAIL', 'COMPARISON');
```

### EntityType

```sql
CREATE TYPE EntityType AS ENUM ('VERSION', 'CURRICULUM', 'RENT', 'CAPEX', 'OPEX', 'USER', 'SETTING', 'REPORT', 'TRANSITION_YEAR');
```

---

## 8. Migrations

### Initial Migration

```bash
npx prisma migrate dev --name init
```

This creates:

- All 15 tables
- All 10 enums (Role, VersionMode, VersionStatus, CurriculumType, RentModel, CapexCategory, EntityType, ReportFormat, ReportType, plus table-specific enums)
- All indexes
- All constraints
- All relationships

### Adding New Fields (Example)

```bash
npx prisma migrate dev --name add_version_metadata
```

```prisma
// Add new field to Version model
model Version {
  // ... existing fields
  metadata Json? // Add metadata field
}
```

### Rollback Migration

```bash
# Rollback last migration
npx prisma migrate reset

# Apply specific migration
npx prisma migrate deploy
```

---

## Complete Prisma Schema

**Note:** This is a simplified reference. The actual source of truth is `/prisma/schema.prisma`. The complete schema includes all 15 tables, 10 enums, and relationships as documented above.

```prisma
// /prisma/schema.prisma (Simplified Reference)

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ============================================================================
// ENUMS
// ============================================================================

enum Role {
  ADMIN
  PLANNER
  VIEWER
}

enum VersionMode {
  RELOCATION_2028
  HISTORICAL_BASELINE
}

enum VersionStatus {
  DRAFT
  READY
  APPROVED
  LOCKED
}

enum CurriculumType {
  FR
  IB
}

enum RentModel {
  FIXED_ESCALATION
  REVENUE_SHARE
  PARTNER_MODEL
}

enum CapexCategory {
  BUILDING
  TECHNOLOGY
  EQUIPMENT
  FURNITURE
  VEHICLES
  OTHER
}

enum ReportFormat {
  PDF
  EXCEL
  CSV
}

enum ReportType {
  EXECUTIVE_SUMMARY
  FINANCIAL_DETAIL
  COMPARISON
}

enum EntityType {
  VERSION
  CURRICULUM
  RENT
  CAPEX
  OPEX
  USER
  SETTING
  REPORT
  TRANSITION_YEAR
}

// ============================================================================
// MODELS
// ============================================================================

model User {
  id              String   @id @default(uuid())
  email           String   @unique
  emailVerified   DateTime?
  name            String?
  password        String?
  role            Role     @default(VIEWER)
  image           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  lastLoginAt     DateTime?

  versions        Version[]         @relation("UserCreatedVersions")
  simulations     TuitionSimulation[] @relation("UserCreatedSimulations")
  reports         Report[]
  auditLogs       AuditLog[]

  @@index([email])
  @@index([role])
  @@map("users")
}

model Version {
  id              String   @id @default(uuid())
  name            String
  description     String?  @db.Text
  mode            VersionMode
  status          VersionStatus @default(DRAFT)
  createdBy       String
  basedOnId       String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  lockedAt        DateTime?
  lockedBy        String?
  lockReason      String?  @db.Text
  transitionCapacity Int?   @default(1850)

  creator         User     @relation("UserCreatedVersions", fields: [createdBy], references: [id])
  basedOn         Version? @relation("VersionBasedOn", fields: [basedOnId], references: [id])
  derivatives     Version[] @relation("VersionBasedOn")

  curriculumPlans CurriculumPlan[]
  rentPlan        RentPlan?
  capexItems      CapexItem[]
  capexRules      CapexRule[]
  opexSubAccounts OpexSubAccount[]
  simulations     TuitionSimulation[]
  reports         Report[]
  otherRevenueItems OtherRevenueItem[]
  balanceSheetSettings BalanceSheetSettings?
  historicalActuals HistoricalActual[]

  @@unique([name, createdBy])
  @@index([createdBy])
  @@index([status, createdAt])
  @@index([mode])
  @@map("versions")
}

model CurriculumPlan {
  id                 String   @id @default(uuid())
  versionId          String
  curriculumType     CurriculumType
  capacity           Int
  tuitionBase        Decimal  @db.Decimal(15, 2)
  cpiFrequency       Int
  studentsProjection Json
  teacherRatio       Decimal? @db.Decimal(5, 4)
  nonTeacherRatio    Decimal? @db.Decimal(5, 4)
  teacherMonthlySalary Decimal? @db.Decimal(12, 2)
  nonTeacherMonthlySalary Decimal? @db.Decimal(12, 2)
  tuitionGrowthRate  Decimal? @db.Decimal(5, 4)

  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  version            Version  @relation(fields: [versionId], references: [id], onDelete: Cascade)

  @@unique([versionId, curriculumType])
  @@index([versionId])
  @@check(capacity > 0, name: "capacity_positive")
  @@check(tuitionBase > 0, name: "tuition_positive")
  @@check(cpiFrequency >= 1 AND cpiFrequency <= 3, name: "cpi_frequency_valid")
  @@map("curriculum_plans")
}

model RentPlan {
  id         String   @id @default(uuid())
  versionId  String   @unique
  rentModel  RentModel
  parameters Json

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  version    Version  @relation(fields: [versionId], references: [id], onDelete: Cascade)

  @@index([rentModel])
  @@map("rent_plans")
}

model CapexItem {
  id          String   @id @default(uuid())
  versionId   String
  ruleId      String?
  year        Int
  category    CapexCategory
  amount      Decimal  @db.Decimal(15, 2)
  description String?  @db.Text

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  version     Version  @relation(fields: [versionId], references: [id], onDelete: Cascade)
  rule        CapexRule? @relation(fields: [ruleId], references: [id])

  @@index([versionId, year])
  @@check(year >= 2023 AND year <= 2052, name: "year_valid")
  @@check(amount >= 0, name: "amount_non_negative")
  @@map("capex_items")
}

model CapexRule {
  id            String   @id @default(uuid())
  versionId     String
  category      CapexCategory
  cycleYears    Int
  baseCost      Decimal  @db.Decimal(15, 2)
  startingYear  Int
  inflationIndex String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  version       Version  @relation(fields: [versionId], references: [id], onDelete: Cascade)
  capexItems    CapexItem[]

  @@index([versionId])
  @@map("capex_rules")
}

model OpexSubAccount {
  id                String   @id @default(uuid())
  versionId         String
  subAccountName    String
  percentOfRevenue  Decimal? @db.Decimal(5, 2)
  isFixed           Boolean
  fixedAmount       Decimal? @db.Decimal(15, 2)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  version           Version  @relation(fields: [versionId], references: [id], onDelete: Cascade)

  @@unique([versionId, subAccountName])
  @@index([versionId])
  @@map("opex_sub_accounts")
}

model TuitionSimulation {
  id          String   @id @default(uuid())
  versionId   String
  name        String
  adjustments Json
  createdBy   String

  createdAt   DateTime @default(now())

  version     Version  @relation(fields: [versionId], references: [id], onDelete: Cascade)
  creator     User     @relation("UserCreatedSimulations", fields: [createdBy], references: [id])

  @@index([versionId])
  @@index([createdBy])
  @@map("tuition_simulations")
}

model AuditLog {
  id          String   @id @default(uuid())
  action      String
  userId      String
  entityType  EntityType
  entityId    String
  metadata    Json?
  timestamp   DateTime @default(now())
  ipAddress   String?
  userAgent   String?  @db.Text

  user        User     @relation(fields: [userId], references: [id])

  @@index([userId, timestamp])
  @@index([entityType, entityId])
  @@index([action, timestamp])
  @@map("audit_logs")
}

model Report {
  id          String       @id @default(uuid())
  versionId   String?
  reportType  ReportType
  format      ReportFormat
  fileName    String
  filePath    String
  fileSize    Int
  downloadUrl String
  expiresAt   DateTime
  generatedBy String
  generatedAt DateTime     @default(now())
  metadata    Json?
  deletedAt   DateTime?

  user        User         @relation(fields: [generatedBy], references: [id])
  version     Version?     @relation(fields: [versionId], references: [id])

  @@index([expiresAt])
  @@index([format])
  @@index([generatedAt])
  @@index([generatedBy])
  @@index([reportType])
  @@index([versionId])
  @@map("reports")
}

model OtherRevenueItem {
  id        String   @id @default(uuid())
  versionId String
  year      Int
  amount    Decimal  @default(0) @db.Decimal(15, 2)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  version   Version  @relation(fields: [versionId], references: [id], onDelete: Cascade)

  @@unique([versionId, year])
  @@index([versionId, year])
  @@map("other_revenue_items")
}

model BalanceSheetSettings {
  id            String   @id @default(uuid())
  versionId     String   @unique
  startingCash  Decimal  @default(0) @db.Decimal(15, 2)
  openingEquity Decimal  @default(0) @db.Decimal(15, 2)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  version       Version  @relation(fields: [versionId], references: [id], onDelete: Cascade)

  @@index([versionId])
  @@map("balance_sheet_settings")
}

model HistoricalActual {
  id        String   @id @default(uuid())
  versionId String
  year      Int
  // ... (see full schema.prisma for all P&L, Balance Sheet, Cash Flow fields)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  version   Version  @relation(fields: [versionId], references: [id], onDelete: Cascade)

  @@unique([versionId, year])
  @@index([versionId])
  @@map("historical_actuals")
}

model TransitionYearData {
  id               String   @id @default(uuid())
  year             Int      @unique
  targetEnrollment Int
  staffCostBase    Decimal  @db.Decimal(15, 2)
  notes            String?
  averageTuitionPerStudent Decimal? @db.Decimal(15, 2)
  otherRevenue     Decimal? @default(0) @db.Decimal(15, 2)
  opex             Decimal? @db.Decimal(15, 2)
  staffCostGrowthPercent Decimal? @db.Decimal(5, 2)
  rentGrowthPercent Decimal? @db.Decimal(5, 2)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([year])
  @@map("transition_year_data")
}

model AdminSetting {
  id                              String   @id @default(uuid())
  key                             String   @unique
  value                           Json
  updatedAt                       DateTime @updatedAt
  updatedBy                       String?
  transitionCapacityCap           Int?     @default(1850)
  transitionRentAdjustmentPercent Decimal? @default(10.0) @db.Decimal(5, 2)
  transitionStaffCostBase2024     Decimal? @db.Decimal(15, 2)
  transitionRentBase2024          Decimal? @db.Decimal(15, 2)

  @@index([key])
  @@map("admin_settings")
}
```

**Note:** The `historical_actuals` table contains many fields for P&L, Balance Sheet, and Cash Flow statements. See `/prisma/schema.prisma` for the complete field list (68+ fields total).

---

**Document Version:** 2.0  
**Last Updated:** November 21, 2025  
**Next Review:** After Phase 0.2 completion  
**Maintained By:** Dev Team
