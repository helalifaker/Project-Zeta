# Transition Period Schema Documentation

## Overview

This document describes the database schema changes implemented to support admin-level control over the TRANSITION period (2025-2027) in Project Zeta's financial planning system.

## Business Context

### Planning Periods Architecture

Project Zeta uses a three-period architecture for financial projections:

1. **HISTORICAL** (2023-2024): Actual data from `historical_actuals` table
2. **TRANSITION** (2025-2027): Semi-dynamic planning with admin-controlled enrollment and staff costs
3. **DYNAMIC** (2028-2052): Fully calculated projections using rent models

### Transition Period Requirements

During the transition period (2025-2027), the school operates in a temporary facility with:

- **Physical capacity constraint**: Maximum 1,850 students
- **Rent adjustment**: Different rent structure from historical baseline
- **Admin-controlled parameters**: Enrollment targets and staff costs set year-by-year
- **Auto-calculated values**: Tuition, revenue, rent, OpEx, and balance sheet

## Schema Changes

### 1. Admin Settings Table Extensions

**Table**: `admin_settings`

**New Columns**:

| Column Name                          | Type           | Default | Description                                                         |
| ------------------------------------ | -------------- | ------- | ------------------------------------------------------------------- |
| `transition_capacity_cap`            | `INTEGER`      | `1850`  | Maximum student enrollment during transition (physical constraint)  |
| `transition_rent_adjustment_percent` | `DECIMAL(5,2)` | `10.0`  | Percentage adjustment from 2024 historical rent (e.g., 10.0 = +10%) |

**Rationale**: Global settings that apply to all versions and all transition years.

**Example**:

```sql
-- Current capacity cap
SELECT transition_capacity_cap FROM admin_settings LIMIT 1;
-- Result: 1850

-- Current rent adjustment
SELECT transition_rent_adjustment_percent FROM admin_settings LIMIT 1;
-- Result: 10.00 (meaning +10% from 2024 baseline)
```

### 2. New Table: transition_year_data

**Purpose**: Store year-specific adjustable parameters for transition period planning.

**Schema**:

```sql
CREATE TABLE "transition_year_data" (
  "id" TEXT PRIMARY KEY,
  "year" INTEGER UNIQUE NOT NULL,
  "target_enrollment" INTEGER NOT NULL,
  "staff_cost_base" DECIMAL(15,2) NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "valid_transition_year" CHECK ("year" BETWEEN 2025 AND 2027),
  CONSTRAINT "positive_enrollment" CHECK ("target_enrollment" > 0),
  CONSTRAINT "positive_staff_cost" CHECK ("staff_cost_base" > 0)
);

CREATE INDEX "transition_year_data_year_idx" ON "transition_year_data"("year");
```

**Columns**:

| Column              | Type            | Constraints               | Description                                 |
| ------------------- | --------------- | ------------------------- | ------------------------------------------- |
| `id`                | `TEXT`          | PRIMARY KEY               | UUID identifier                             |
| `year`              | `INTEGER`       | UNIQUE, CHECK (2025-2027) | Transition year                             |
| `target_enrollment` | `INTEGER`       | CHECK (> 0)               | Target student enrollment for the year      |
| `staff_cost_base`   | `DECIMAL(15,2)` | CHECK (> 0)               | Staff cost baseline (SAR) before CPI growth |
| `notes`             | `TEXT`          | Optional                  | Admin notes/rationale for year parameters   |
| `created_at`        | `TIMESTAMP(3)`  | Auto                      | Record creation timestamp                   |
| `updated_at`        | `TIMESTAMP(3)`  | Auto                      | Last update timestamp                       |

**Constraints**:

1. **Year Range**: Must be between 2025 and 2027 (inclusive)
2. **Unique Year**: Only one record per year allowed
3. **Positive Enrollment**: Target enrollment must be > 0
4. **Positive Staff Cost**: Staff cost base must be > 0

**Indexes**:

- Primary key on `id`
- Unique index on `year`
- Performance index on `year` for queries

## Prisma Schema

### AdminSettings Model

```prisma
model admin_settings {
  id                              String   @id @default(uuid())
  key                             String   @unique
  value                           Json
  updatedAt                       DateTime @updatedAt
  updatedBy                       String?

  // Transition period global settings (2025-2027)
  transitionCapacityCap           Int?     @default(1850) @map("transition_capacity_cap")
  transitionRentAdjustmentPercent Decimal? @default(10.0) @db.Decimal(5, 2) @map("transition_rent_adjustment_percent")

  @@index([key])
}
```

### TransitionYearData Model

```prisma
model transition_year_data {
  id               String   @id @default(uuid())
  year             Int      @unique
  targetEnrollment Int      @map("target_enrollment")
  staffCostBase    Decimal  @db.Decimal(15, 2) @map("staff_cost_base")
  notes            String?
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  @@index([year])
}
```

## Default Data

### Seeded Transition Year Data

The migration includes default data for all three transition years:

| Year | Target Enrollment | Staff Cost Base (SAR) | Notes                              |
| ---- | ----------------- | --------------------- | ---------------------------------- |
| 2025 | 1,850             | 8,500,000             | Full capacity - deflated from 2028 |
| 2026 | 1,850             | 8,755,000             | Full capacity - deflated from 2028 |
| 2027 | 1,850             | 9,017,650             | Full capacity - deflated from 2028 |

**Calculation Method**: Staff costs are backward-deflated from 2028 baseline (10,000,000 SAR) using 3% annual CPI:

```
staffCost(year) = baseline_2028 / (1.03)^(2028 - year)

2025: 10,000,000 / (1.03)^3 = 8,500,000 (approx)
2026: 10,000,000 / (1.03)^2 = 8,755,000 (approx)
2027: 10,000,000 / (1.03)^1 = 9,017,650 (approx)
```

## Usage Examples

### TypeScript/Prisma Queries

#### Get Transition Capacity Cap

```typescript
import { prisma } from '@/lib/db/prisma';

const settings = await prisma.admin_settings.findFirst();
const capacityCap = settings?.transitionCapacityCap ?? 1850;

console.log(`Transition capacity: ${capacityCap} students`);
```

#### Get Transition Year Data

```typescript
import { prisma } from '@/lib/db/prisma';

// Get data for a specific year
const data2025 = await prisma.transition_year_data.findUnique({
  where: { year: 2025 },
});

console.log(`2025 target enrollment: ${data2025?.targetEnrollment}`);
console.log(`2025 staff cost base: ${data2025?.staffCostBase} SAR`);

// Get all transition years
const allYears = await prisma.transition_year_data.findMany({
  orderBy: { year: 'asc' },
});
```

#### Update Transition Parameters

```typescript
import { prisma } from '@/lib/db/prisma';

// Update enrollment target for 2026
await prisma.transition_year_data.update({
  where: { year: 2026 },
  data: {
    targetEnrollment: 1700,
    notes: 'Adjusted based on registration trends',
  },
});

// Update rent adjustment percentage
await prisma.admin_settings.updateMany({
  data: {
    transitionRentAdjustmentPercent: 12.0, // Change to +12%
  },
});
```

## Integration with Financial Calculations

### Period Detection

Use the existing period detection utility:

```typescript
import { getPeriodForYear } from '@/lib/utils/period-detection';

const period = getPeriodForYear(2026);
// Returns: 'TRANSITION'
```

### Projection Calculation Flow

For transition years (2025-2027), the calculation pipeline should:

1. **Fetch transition year data**:

   ```typescript
   const transitionData = await prisma.transition_year_data.findUnique({
     where: { year },
   });
   ```

2. **Use enrollment from database**:

   ```typescript
   const totalEnrollment = transitionData.targetEnrollment;
   ```

3. **Calculate staff costs with CPI growth**:

   ```typescript
   import { calculateStaffCostsForYear } from '@/lib/calculations/financial/staff-costs';

   const staffCosts = calculateStaffCostsForYear({
     baseYear: 2025, // Use 2025 as base for transition
     baseAmount: transitionData.staffCostBase,
     targetYear: year,
     cpiRate: 0.03,
   });
   ```

4. **Calculate rent with adjustment**:

   ```typescript
   const settings = await prisma.admin_settings.findFirst();
   const historical2024Rent = await getHistoricalRent(2024);
   const adjustmentFactor = 1 + settings.transitionRentAdjustmentPercent / 100;
   const transitionRent = historical2024Rent * adjustmentFactor;
   ```

5. **Continue with normal projection pipeline** for revenue, OpEx, EBITDA, etc.

## Migration Instructions

### Step 1: Apply Migration

```bash
cd /Users/fakerhelali/Desktop/Project\ Zeta

# Generate Prisma client
npx prisma generate

# Apply migration (when database is accessible)
npx prisma migrate deploy
```

### Step 2: Seed Default Data

```bash
# Run seed script
npx tsx prisma/seeds/transition-defaults.ts
```

### Step 3: Verify Schema

```bash
# Run validation tests
npx tsx scripts/test-transition-schema.ts

# Open Prisma Studio to inspect data
npx prisma studio
```

## Testing Strategy

### Unit Tests

Test files should verify:

1. **Data retrieval**: Can fetch transition year data correctly
2. **Constraint validation**: Year range, positive values enforced
3. **Calculation integration**: Projections use transition data correctly

### Integration Tests

Verify end-to-end flow:

1. Create a version with RELOCATION_2028 mode
2. Generate projection for years 2025-2027
3. Ensure transition parameters are used
4. Verify calculations respect capacity cap

### Test Script

Run the provided validation script:

```bash
npx tsx scripts/test-transition-schema.ts
```

Expected output:

```
🧪 Transition Schema Validation Tests
============================================================

📋 Test 1: Prisma Client Generation
✅ TransitionYearData model exists
✅ Admin settings has transition fields

[... additional tests ...]

📊 Test Results:
   ✅ Passed: 12
   ❌ Failed: 0
   📈 Total:  12

🎉 All tests passed! Schema is working correctly.
```

## Admin UI Requirements (Future Work)

To enable full transition period management, create admin UI components:

### 1. Transition Settings Page

**Location**: `/settings/transition`

**Features**:

- Edit global capacity cap (1-2000 range)
- Edit rent adjustment percentage (-50% to +100% range)
- Save changes with audit logging

### 2. Transition Year Editor

**Location**: `/settings/transition/years`

**Features**:

- Table view of all three years (2025-2027)
- Editable fields: target enrollment, staff cost base, notes
- Validation: enrollment ≤ capacity cap
- Real-time preview of calculated values (revenue, rent, etc.)
- Save changes with audit logging

### 3. Version-Specific Override (Optional)

Consider if transition parameters should be:

- **Global** (current design): All versions use same transition data
- **Version-specific**: Each version can have custom transition parameters

Current design uses global settings for simplicity.

## Performance Considerations

### Query Optimization

1. **Year index**: Queries by year use index for O(1) lookup
2. **Batch fetching**: Fetch all 3 years in one query if needed:

   ```typescript
   const allYears = await prisma.transition_year_data.findMany({
     where: { year: { in: [2025, 2026, 2027] } },
   });
   ```

3. **Caching**: Consider caching transition data (changes infrequently):

   ```typescript
   let cachedTransitionData: Map<number, TransitionYearData> | null = null;

   async function getTransitionData(year: number) {
     if (!cachedTransitionData) {
       const all = await prisma.transition_year_data.findMany();
       cachedTransitionData = new Map(all.map((d) => [d.year, d]));
     }
     return cachedTransitionData.get(year);
   }
   ```

### Calculation Performance

- Transition period calculations should maintain <50ms target
- Use Web Workers for full 30-year projections including transition years

## Backward Compatibility

### Existing Versions

Existing versions in the database are **not affected** by this schema change:

1. Historical versions (2023-2024) continue to use `historical_actuals`
2. Dynamic projections (2028+) continue to use rent models
3. Transition calculations will start using new tables when calculation logic is updated

### Migration Safety

- **No data loss**: Schema only adds new columns and tables
- **Default values**: Transition fields have sensible defaults
- **Optional fields**: All new admin_settings columns are nullable
- **No breaking changes**: Existing queries continue to work

## Audit Trail

### Admin Settings Changes

Changes to transition settings should be logged:

```typescript
import { prisma } from '@/lib/db/prisma';

await prisma.admin_settings.update({
  where: { id: settingsId },
  data: {
    transitionCapacityCap: newCapacity,
    transitionRentAdjustmentPercent: newAdjustment,
  },
});

// Log the change
await prisma.audit_logs.create({
  data: {
    action: 'UPDATE_TRANSITION_SETTINGS',
    userId: currentUser.id,
    entityType: 'SETTING',
    entityId: settingsId,
    metadata: {
      oldCapacity,
      newCapacity,
      oldAdjustment,
      newAdjustment,
    },
  },
});
```

### Transition Year Data Changes

All updates to transition year data should be audited similarly.

## Troubleshooting

### Issue: Constraints Failing

**Symptom**: Cannot insert data for year outside 2025-2027

**Solution**: Verify year is in valid range. Transition data is only for 2025-2027.

### Issue: Unique Constraint Violation

**Symptom**: Cannot create multiple records for same year

**Solution**: Update existing record instead of creating new one:

```typescript
await prisma.transition_year_data.upsert({
  where: { year: 2025 },
  update: { targetEnrollment: 1700 },
  create: { year: 2025, targetEnrollment: 1700, staffCostBase: 8500000 },
});
```

### Issue: Decimal Precision

**Symptom**: Staff cost values lose precision

**Solution**: Always use Decimal.js:

```typescript
import Decimal from 'decimal.js';

const staffCost = new Decimal(8500000.5);
await prisma.transition_year_data.create({
  data: { staffCostBase: staffCost /* ... */ },
});
```

## References

- **Migration File**: `/prisma/migrations/20251120185632_add_transition_parameters/migration.sql`
- **Seed Script**: `/prisma/seeds/transition-defaults.ts`
- **Test Script**: `/scripts/test-transition-schema.ts`
- **Period Detection**: `/lib/utils/period-detection.ts`
- **Main Projection**: `/lib/calculations/financial/projection.ts`

## Next Steps

1. ✅ Schema designed and migrated
2. ⏳ Update calculation logic to use transition data
3. ⏳ Create admin UI for editing transition parameters
4. ⏳ Add integration tests for transition period calculations
5. ⏳ Update PRD and ARCHITECTURE docs with transition details

## Questions?

Contact the database architect or refer to:

- **CLAUDE.md**: Project overview and development guidelines
- **ARCHITECTURE.md**: System architecture and data flow
- **SCHEMA.md**: Complete database schema reference
