# Transition Schema Quick Start Guide

**Quick reference for developers integrating transition period database schema**

---

## TL;DR

New database tables for transition period (2025-2027) planning:

- **admin_settings**: Added capacity cap and rent adjustment fields
- **transition_year_data**: Year-specific enrollment and staff cost targets

---

## Installation (When DB is Available)

```bash
cd /Users/fakerhelali/Desktop/Project\ Zeta

# 1. Apply migration
npx prisma migrate deploy

# 2. Seed default data
npx tsx prisma/seeds/transition-defaults.ts

# 3. Verify
npx tsx scripts/test-transition-schema.ts

# 4. View in Prisma Studio
npx prisma studio
```

---

## Quick Usage Examples

### Get Transition Year Data

```typescript
import { prisma } from '@/lib/db/prisma';

// Single year
const data2025 = await prisma.transition_year_data.findUnique({
  where: { year: 2025 },
});

console.log(`Enrollment: ${data2025?.targetEnrollment}`); // 1850
console.log(`Staff Cost: ${data2025?.staffCostBase}`); // 8500000

// All years
const allYears = await prisma.transition_year_data.findMany({
  orderBy: { year: 'asc' },
});
```

### Get Transition Settings

```typescript
import { prisma } from '@/lib/db/prisma';

const settings = await prisma.admin_settings.findFirst();

const capacityCap = settings?.transitionCapacityCap ?? 1850;
const rentAdjustment = settings?.transitionRentAdjustmentPercent ?? 10.0;

console.log(`Max capacity: ${capacityCap} students`);
console.log(`Rent adjustment: +${rentAdjustment}%`);
```

### Update Transition Parameters

```typescript
import { prisma } from '@/lib/db/prisma';

// Update enrollment target
await prisma.transition_year_data.update({
  where: { year: 2026 },
  data: {
    targetEnrollment: 1700,
    notes: 'Adjusted based on registration',
  },
});

// Update global settings
await prisma.admin_settings.updateMany({
  data: {
    transitionCapacityCap: 1800,
    transitionRentAdjustmentPercent: 12.0,
  },
});
```

---

## Integration with Calculations

### In projection.ts

```typescript
import { prisma } from '@/lib/db/prisma';
import { getPeriodForYear } from '@/lib/utils/period-detection';

async function calculateYearProjection(year: number, versionId: string) {
  const period = getPeriodForYear(year);

  if (period === 'TRANSITION') {
    // Fetch transition data
    const transitionData = await prisma.transition_year_data.findUnique({
      where: { year },
    });

    if (!transitionData) {
      throw new Error(`No transition data for year ${year}`);
    }

    // Use transition parameters
    const enrollment = transitionData.targetEnrollment;
    const staffCostBase = transitionData.staffCostBase;

    // Get global settings
    const settings = await prisma.admin_settings.findFirst();
    const capacityCap = settings?.transitionCapacityCap ?? 1850;
    const rentAdjustment = settings?.transitionRentAdjustmentPercent ?? 10.0;

    // Validate enrollment doesn't exceed capacity
    if (enrollment > capacityCap) {
      console.warn(`Enrollment ${enrollment} exceeds capacity ${capacityCap}`);
    }

    // Calculate rent with adjustment
    const historical2024Rent = await getHistoricalRent(2024, versionId);
    const transitionRent = historical2024Rent * (1 + rentAdjustment / 100);

    // Continue with normal calculations...
    return {
      enrollment,
      staffCostBase,
      rent: transitionRent,
      // ... other values
    };
  }

  // Handle HISTORICAL and DYNAMIC periods as before
  // ...
}
```

---

## Default Data

| Year | Enrollment | Staff Cost (SAR) | Notes                       |
| ---- | ---------- | ---------------- | --------------------------- |
| 2025 | 1,850      | 8,500,000        | Deflated from 2028 baseline |
| 2026 | 1,850      | 8,755,000        | Deflated from 2028 baseline |
| 2027 | 1,850      | 9,017,650        | Deflated from 2028 baseline |

**Global Settings**:

- Capacity Cap: 1,850 students
- Rent Adjustment: +10% from 2024 historical rent

---

## Constraints

Database enforces these rules:

1. **Year Range**: Must be 2025-2027
2. **Unique Year**: Only one record per year
3. **Positive Enrollment**: Must be > 0
4. **Positive Staff Cost**: Must be > 0

```typescript
// This will fail:
await prisma.transition_year_data.create({
  data: {
    year: 2024, // ❌ Out of range
    targetEnrollment: 1500,
    staffCostBase: 8000000,
  },
});

// This will succeed:
await prisma.transition_year_data.create({
  data: {
    year: 2025, // ✅ Valid
    targetEnrollment: 1500,
    staffCostBase: 8000000,
  },
});
```

---

## TypeScript Types

```typescript
import { TransitionYearData, Prisma } from '@prisma/client';

// Type for transition year data
type TransitionYear = TransitionYearData;

// Type for create input
type TransitionYearCreate = Prisma.TransitionYearDataCreateInput;

// Type for update input
type TransitionYearUpdate = Prisma.TransitionYearDataUpdateInput;

// Example usage
const year: TransitionYear = {
  id: 'uuid',
  year: 2025,
  targetEnrollment: 1850,
  staffCostBase: new Prisma.Decimal(8500000),
  notes: 'Full capacity',
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

---

## Service Layer Pattern

Create service module for transition operations:

```typescript
// services/transition/read.ts
import { prisma } from '@/lib/db/prisma';
import { success, error } from '@/types/result';

export async function getTransitionYearData(year: number) {
  try {
    if (year < 2025 || year > 2027) {
      return error('Year must be between 2025 and 2027', 'INVALID_YEAR');
    }

    const data = await prisma.transition_year_data.findUnique({
      where: { year },
    });

    if (!data) {
      return error(`No transition data for year ${year}`, 'NOT_FOUND');
    }

    return success(data);
  } catch (err) {
    return error('Failed to fetch transition data', 'DATABASE_ERROR');
  }
}

export async function getAllTransitionYears() {
  try {
    const data = await prisma.transition_year_data.findMany({
      orderBy: { year: 'asc' },
    });
    return success(data);
  } catch (err) {
    return error('Failed to fetch transition data', 'DATABASE_ERROR');
  }
}
```

```typescript
// services/transition/update.ts
import { prisma } from '@/lib/db/prisma';
import { success, error } from '@/types/result';
import Decimal from 'decimal.js';

export async function updateTransitionYearData(
  year: number,
  data: {
    targetEnrollment?: number;
    staffCostBase?: Decimal;
    notes?: string;
  },
  userId: string
) {
  try {
    // Validate
    const settings = await prisma.admin_settings.findFirst();
    const capacityCap = settings?.transitionCapacityCap ?? 1850;

    if (data.targetEnrollment && data.targetEnrollment > capacityCap) {
      return error(
        `Enrollment ${data.targetEnrollment} exceeds capacity ${capacityCap}`,
        'CAPACITY_EXCEEDED'
      );
    }

    // Update
    const updated = await prisma.transition_year_data.update({
      where: { year },
      data,
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        action: 'UPDATE_TRANSITION_YEAR',
        userId,
        entityType: 'SETTING',
        entityId: updated.id,
        metadata: { year, changes: data },
      },
    });

    return success(updated);
  } catch (err) {
    return error('Failed to update transition data', 'DATABASE_ERROR');
  }
}
```

---

## API Route Example

```typescript
// app/api/admin/transition/[year]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getTransitionYearData, updateTransitionYearData } from '@/services/transition';
import { z } from 'zod';

const updateSchema = z.object({
  targetEnrollment: z.number().int().positive().optional(),
  staffCostBase: z.number().positive().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { year: string } }) {
  const year = parseInt(params.year);

  const result = await getTransitionYearData(year);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json(result.data);
}

export async function PUT(req: NextRequest, { params }: { params: { year: string } }) {
  // Auth check
  const session = await getServerSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const year = parseInt(params.year);
  const body = await req.json();

  // Validate input
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // Update
  const result = await updateTransitionYearData(year, parsed.data, session.user.id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.data);
}
```

---

## Testing

```bash
# Run validation tests
npx tsx scripts/test-transition-schema.ts

# Expected output:
# 🧪 Transition Schema Validation Tests
# ...
# ✅ Passed: 12
# ❌ Failed: 0
```

---

## Troubleshooting

### Issue: TransitionYearData not found

**Solution**: Regenerate Prisma client

```bash
npx prisma generate
```

### Issue: Constraint violation

**Solution**: Check year range (2025-2027) and positive values

### Issue: Migration not applied

**Solution**: Check migration status

```bash
npx prisma migrate status
npx prisma migrate deploy
```

---

## Files Reference

- **Schema**: `/prisma/schema.prisma`
- **Migration**: `/prisma/migrations/20251120185632_add_transition_parameters/migration.sql`
- **Seed**: `/prisma/seeds/transition-defaults.ts`
- **Tests**: `/scripts/test-transition-schema.ts`
- **Full Docs**: `/TRANSITION_SCHEMA_DOCUMENTATION.md`
- **Summary**: `/TRANSITION_SCHEMA_IMPLEMENTATION_SUMMARY.md`

---

## Next Steps

1. Apply migration: `npx prisma migrate deploy`
2. Run seed script: `npx tsx prisma/seeds/transition-defaults.ts`
3. Update calculation logic to use transition data
4. Create admin UI for editing parameters
5. Add integration tests

---

**Need more details?** See `/TRANSITION_SCHEMA_DOCUMENTATION.md` (full technical reference)
