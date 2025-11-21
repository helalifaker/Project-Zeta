# Run Migration in Supabase SQL Editor

**IMPORTANT: Only paste PURE SQL into Supabase SQL Editor. No Markdown, no headings, no explanations - just SQL statements.**

Since we're experiencing network connection issues, we'll run the migration directly in Supabase SQL Editor.

## Step 1: Sanity Check (Optional)

Check what tables currently exist:

1. **Go to Supabase Dashboard:**
   - Navigate to: [https://supabase.com/dashboard/project/alcpcjfcbrkdmccpjgit](https://supabase.com/dashboard/project/alcpcjfcbrkdmccpjgit)

2. **Open SQL Editor:**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and paste:**
   - Open file: `prisma/migrations/20251113_init/01-sanity-check.sql`
   - Copy ONLY the SQL (no Markdown)
   - Paste into Supabase SQL Editor
   - Click "Run"

## Step 2: Reset (Only if needed)

**WARNING: This will DELETE all existing data!**

Only run this if you get "relation already exists" errors and want a clean start:

1. **Copy and paste:**
   - Open file: `prisma/migrations/20251113_init/02-reset-destructive.sql`
   - Copy ONLY the SQL statements
   - Paste into Supabase SQL Editor
   - Click "Run"

## Step 3: Run the Migration

1. **In SQL Editor:**
   - Create a new query (or clear the previous one)

2. **Copy and paste the migration SQL:**
   - Open file: `prisma/migrations/20251113_init/migration.sql`
   - **Copy ONLY the SQL content** (no Markdown headings)
   - Paste into Supabase SQL Editor

3. **Run the migration:**
   - Click "Run" (or press Cmd/Ctrl + Enter)
   - Wait for completion (should take 5-10 seconds)

4. **Verify success:**
   - You should see: "Success. No rows returned"
   - Run verification:
     - Open file: `prisma/migrations/20251113_init/03-verify-tables.sql`
     - Copy ONLY the SQL
     - Paste and run
   - Should show: `admin_settings`, `audit_logs`, `capex_items`, `curriculum_plans`, `opex_sub_accounts`, `rent_plans`, `tuition_simulations`, `users`, `versions`

## Step 4: Run the Seed Data

After migration succeeds, run the seed SQL to create default users and settings.

1. **In SQL Editor:**
   - Create a new query (or clear the previous one)

2. **Copy and paste the seed SQL:**
   - Open file: `prisma/migrations/20251113_init/seed.sql`
   - **Copy ONLY the SQL content** (no Markdown headings)
   - Paste into Supabase SQL Editor

3. **Run the seed:**
   - Click "Run"
   - Wait for completion

4. **Verify seed data:**
   - Open file: `prisma/migrations/20251113_init/04-verify-seed.sql`
   - Copy ONLY the SQL
   - Paste and run

## Step 5: Mark Prisma Migration as Applied

After running migrations in Supabase, we need to tell Prisma that the migration was applied:

1. **In SQL Editor:**
   - Create a new query (or clear the previous one)

2. **Copy and paste:**
   - Open file: `prisma/migrations/20251113_init/05-mark-migration-applied.sql`
   - **Copy ONLY the SQL content** (no Markdown headings)
   - Paste into Supabase SQL Editor
   - Click "Run"

   This creates the `_prisma_migrations` table and records that the migration was applied.

## Step 6: Generate Prisma Client

After migrations are applied, generate the Prisma client:

```bash
cd "/Users/fakerhelali/Desktop/Project Zeta"
npx prisma generate
```

This will create the TypeScript types based on your schema.

## Step 7: Test the Setup

Once everything is done, test the database connection from your app:

```bash
npm run dev
```

Then visit: `http://localhost:3000/api/health`

You should see a successful health check response.

---

## Troubleshooting

### If migration fails with "relation already exists":

- Some tables might already exist from previous attempts
- Drop existing tables first:

  ```sql
  DROP TABLE IF EXISTS "admin_settings" CASCADE;
  DROP TABLE IF EXISTS "audit_logs" CASCADE;
  DROP TABLE IF EXISTS "capex_items" CASCADE;
  DROP TABLE IF EXISTS "curriculum_plans" CASCADE;
  DROP TABLE IF EXISTS "opex_sub_accounts" CASCADE;
  DROP TABLE IF EXISTS "rent_plans" CASCADE;
  DROP TABLE IF EXISTS "tuition_simulations" CASCADE;
  DROP TABLE IF EXISTS "versions" CASCADE;
  DROP TABLE IF EXISTS "users" CASCADE;

  -- Drop enums if they exist
  DROP TYPE IF EXISTS "Role" CASCADE;
  DROP TYPE IF EXISTS "VersionMode" CASCADE;
  DROP TYPE IF EXISTS "VersionStatus" CASCADE;
  DROP TYPE IF EXISTS "CurriculumType" CASCADE;
  DROP TYPE IF EXISTS "RentModel" CASCADE;
  DROP TYPE IF EXISTS "CapexCategory" CASCADE;
  DROP TYPE IF EXISTS "EntityType" CASCADE;
  ```

- Then run the migration again

### If you see permission errors:

- Make sure you're running as a user with CREATE privileges
- In Supabase, you should have full access via SQL Editor

---

## Next Steps

After successful migration:

1. ✅ Database schema is ready
2. ✅ Default users and settings are created
3. ✅ Prisma client can be generated
4. ✅ You can proceed with Phase 0.3 (API Routes) from DELIVERY_PLAN.md
