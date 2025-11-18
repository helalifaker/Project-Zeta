# Fix Missing `capex_rules` Table

## Problem

The application is crashing with this error:
```
Invalid `prisma.capex_rules.deleteMany()` invocation:
The table `public.capex_rules` does not exist in the current database.
```

## Root Cause

The migration `20251115232139_add_capex_rules` exists but has **NOT been applied** to the database.

## Solution

### Option 1: Apply Migration via Prisma CLI (Recommended)

```bash
cd "/Users/fakerhelali/Desktop/Project Zeta"

# Check migration status
npx prisma migrate status

# Apply pending migrations
npx prisma migrate deploy

# Regenerate Prisma Client
npx prisma generate

# Restart dev server
```

### Option 2: Apply Migration Manually in Supabase

1. **Go to Supabase Dashboard:**
   - Navigate to your project
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

2. **Copy the migration SQL:**
   - Open file: `prisma/migrations/20251115232139_add_capex_rules/migration.sql`
   - Copy **ONLY the SQL content** (no Markdown)
   - Paste into Supabase SQL Editor

3. **Execute the migration:**
   - Click "Run" (or press Cmd/Ctrl + Enter)
   - Wait for completion

4. **Verify the table was created:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'capex_rules';
   ```
   Should return: `capex_rules`

5. **Regenerate Prisma Client:**
   ```bash
   npx prisma generate
   ```

6. **Restart your dev server**

## Migration SQL Content

The migration creates:
- `capex_rules` table with all required columns
- Foreign key to `versions` table
- Indexes on `versionId` and unique constraint on `(versionId, category)`
- Check constraints for `cycleYears > 0` and `startingYear` in range [2023, 2052]
- Adds `ruleId` column to `capex_items` table
- Foreign key from `capex_items` to `capex_rules`

## Verification

After applying the migration, test that capex rules can be saved:

1. Navigate to a version detail page
2. Try to create/edit a capex rule
3. Should save successfully without errors

## If Migration Fails

If you see "relation already exists" errors:
- The table might already exist but Prisma doesn't know about it
- Check if table exists: `SELECT * FROM capex_rules LIMIT 1;`
- If it exists, mark migration as applied:
  ```bash
  npx prisma migrate resolve --applied 20251115232139_add_capex_rules
  ```

If you see permission errors:
- Make sure you're using the correct database connection
- Verify `DATABASE_URL` and `DIRECT_URL` in `.env.local`
- In Supabase, you should have full access via SQL Editor

