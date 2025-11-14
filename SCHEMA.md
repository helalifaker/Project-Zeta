# Project Zeta - Database Schema
## PostgreSQL Database Design (Prisma ORM)

**Version:** 1.0  
**Last Updated:** November 13, 2025  
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

### Database Tables (9 Core Tables)

| # | Table Name | Purpose | Relationships |
|---|------------|---------|---------------|
| 1 | `users` | User authentication and roles | → versions (created by) |
| 2 | `versions` | Financial scenario versions | ← curriculum_plans, rent_plans, capex_items, opex_sub_accounts |
| 3 | `curriculum_plans` | Curriculum configurations (FR, IB) | → versions |
| 4 | `rent_plans` | Rent model configurations | → versions |
| 5 | `capex_items` | Capital expenditure items | → versions |
| 6 | `opex_sub_accounts` | Operating expense sub-accounts | → versions |
| 7 | `tuition_simulations` | Saved tuition simulation scenarios | → versions |
| 8 | `audit_logs` | Audit trail for all mutations | → users |
| 9 | `admin_settings` | Global admin settings | - |

### Data Volume Estimates (Year 1)

- **Users:** 10-50 rows
- **Versions:** 100-500 rows
- **Curriculum Plans:** 200-1,000 rows (2 per version)
- **Rent Plans:** 100-500 rows (1 per version)
- **Capex Items:** 500-5,000 rows (avg 5-10 per version)
- **Opex Sub-Accounts:** 500-5,000 rows (avg 5-10 per version)
- **Tuition Simulations:** 200-1,000 rows (2-3 per version)
- **Audit Logs:** 10,000-100,000 rows (grows continuously)
- **Admin Settings:** 10-20 rows (key-value pairs)

**Total Estimated Size:** <1 GB (Year 1)

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
- `rentModel`: Type of rent model
- `parameters`: JSONB field with model-specific parameters
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Example JSON (parameters for FIXED_ESCALATION):**
```json
{
  "baseRent": 5000000.00,
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
- `year`: Year of capex (2023-2052)
- `category`: Capex category
- `amount`: Capex amount in SAR
- `description`: Optional description
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

---

### 3.6 Opex Sub-Accounts Table

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

### 3.7 Tuition Simulations Table

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

### 3.8 Audit Logs Table

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
    "tuitionBase": {"old": 50000, "new": 55000},
    "escalationRate": {"old": 0.04, "new": 0.045}
  }
}
```

---

### 3.9 Admin Settings Table

```prisma
model AdminSetting {
  id         String   @id @default(uuid())
  key        String   @unique
  value      Json     // JSONB field for flexible value types
  updatedAt  DateTime @updatedAt
  updatedBy  String?
  
  // Indexes
  @@index([key])
  @@map("admin_settings")
}
```

**Fields:**
- `id`: UUID primary key
- `key`: Setting key (unique, e.g., "cpiRate", "discountRate")
- `value`: JSONB field with setting value
- `updatedAt`: Last update timestamp
- `updatedBy`: User ID who last updated (nullable)

**Example Rows:**
```json
[
  {"key": "cpiRate", "value": 0.03},
  {"key": "discountRate", "value": 0.08},
  {"key": "taxRate", "value": 0.15},
  {"key": "currency", "value": "SAR"},
  {"key": "timezone", "value": "Asia/Riyadh"},
  {"key": "dateFormat", "value": "DD/MM/YYYY"}
]
```

---

## 4. Relationships

### One-to-Many Relationships

| Parent Table | Child Table | Foreign Key | On Delete |
|--------------|-------------|-------------|-----------|
| `users` | `versions` | `created_by` | Restrict |
| `users` | `tuition_simulations` | `created_by` | Restrict |
| `users` | `audit_logs` | `user_id` | Restrict |
| `versions` | `curriculum_plans` | `version_id` | Cascade |
| `versions` | `capex_items` | `version_id` | Cascade |
| `versions` | `opex_sub_accounts` | `version_id` | Cascade |
| `versions` | `tuition_simulations` | `version_id` | Cascade |

### One-to-One Relationships

| Parent Table | Child Table | Foreign Key | On Delete |
|--------------|-------------|-------------|-----------|
| `versions` | `rent_plans` | `version_id` (unique) | Cascade |

### Self-Referencing Relationships

| Table | Relationship | Foreign Key |
|-------|--------------|-------------|
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
- `opex_sub_accounts.version_id + sub_account_name` - Unique sub-account per version
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

### EntityType
```sql
CREATE TYPE EntityType AS ENUM ('VERSION', 'CURRICULUM', 'RENT', 'CAPEX', 'OPEX', 'USER', 'SETTING');
```

---

## 8. Migrations

### Initial Migration

```bash
npx prisma migrate dev --name init
```

This creates:
- All 9 tables
- All 7 enums
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

```prisma
// /prisma/schema.prisma

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

enum EntityType {
  VERSION
  CURRICULUM
  RENT
  CAPEX
  OPEX
  USER
  SETTING
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
  
  creator         User     @relation("UserCreatedVersions", fields: [createdBy], references: [id])
  basedOn         Version? @relation("VersionBasedOn", fields: [basedOnId], references: [id])
  derivatives     Version[] @relation("VersionBasedOn")
  
  curriculumPlans CurriculumPlan[]
  rentPlan        RentPlan?
  capexItems      CapexItem[]
  opexSubAccounts OpexSubAccount[]
  simulations     TuitionSimulation[]
  
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
  year        Int
  category    CapexCategory
  amount      Decimal  @db.Decimal(15, 2)
  description String?  @db.Text
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  version     Version  @relation(fields: [versionId], references: [id], onDelete: Cascade)
  
  @@index([versionId, year])
  @@check(year >= 2023 AND year <= 2052, name: "year_valid")
  @@check(amount >= 0, name: "amount_non_negative")
  @@map("capex_items")
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

model AdminSetting {
  id         String   @id @default(uuid())
  key        String   @unique
  value      Json
  updatedAt  DateTime @updatedAt
  updatedBy  String?
  
  @@index([key])
  @@map("admin_settings")
}
```

---

**Document Version:** 1.0  
**Last Updated:** November 13, 2025  
**Next Review:** After Phase 0.2 completion  
**Maintained By:** Dev Team

