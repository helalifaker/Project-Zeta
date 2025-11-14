# Fix Public Schema in Supabase SQL Editor

Since password authentication is failing from the command line, you can fix the public schema directly in Supabase SQL Editor (no password needed).

---

## Step 1: Open Supabase SQL Editor

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `alcpcjfcbrkdmccpjgit`
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**

---

## Step 2: Run This SQL Script

Copy and paste this entire SQL script into the SQL Editor, then click **"Run"**:

```sql
-- Safe Public Schema Repair Script
-- Non-destructive - safe to run multiple times

-- 1) Create schema if missing (no-op if it exists)
CREATE SCHEMA IF NOT EXISTS public;

-- 2) Set owner (may fail if insufficient privileges, but that's OK)
DO $$
BEGIN
    ALTER SCHEMA public OWNER TO postgres;
EXCEPTION WHEN insufficient_privilege THEN
    -- Owner change failed, but schema exists - continue
    RAISE NOTICE 'Could not change schema owner (insufficient privileges) - continuing anyway';
END $$;

-- 3) Grant permissions to standard roles
GRANT USAGE ON SCHEMA public TO PUBLIC;
GRANT CREATE ON SCHEMA public TO PUBLIC;

-- Grant to specific Supabase roles (if they exist)
DO $$
BEGIN
    GRANT USAGE ON SCHEMA public TO anon;
    GRANT USAGE ON SCHEMA public TO authenticated;
    GRANT USAGE ON SCHEMA public TO service_role;
    GRANT CREATE ON SCHEMA public TO authenticated;
    GRANT CREATE ON SCHEMA public TO service_role;
EXCEPTION WHEN undefined_object THEN
    -- Roles don't exist, skip
    RAISE NOTICE 'Some Supabase roles not found - continuing';
END $$;

-- 4) Set database-level search_path (affects all future sessions)
ALTER DATABASE postgres SET search_path = "$user", public, extensions;

-- 5) Set search_path for postgres role (if we have permission)
DO $$
BEGIN
    ALTER ROLE postgres SET search_path = "$user", public, extensions;
EXCEPTION WHEN insufficient_privilege THEN
    -- Can't modify role, but database-level setting will work
    RAISE NOTICE 'Could not set role-level search_path - database-level setting will apply';
END $$;

-- 6) Validate
SELECT 
    current_schema as "Current Schema",
    current_schemas(true) as "Search Path",
    current_user as "Current User",
    current_database() as "Current Database";

-- 7) Test creating a table in public schema
CREATE TABLE IF NOT EXISTS public._healthcheck(id int);
DROP TABLE IF EXISTS public._healthcheck;

SELECT 'Public schema restored successfully!' as status;
```

---

## Step 3: Verify Success

After running the script, you should see:

**Expected Output:**
```
✅ Query executed successfully
✅ Results showing:
   - Current Schema: public
   - Search Path: {public,extensions}
   - Status: "Public schema restored successfully!"
```

---

## Step 4: Fix Password (If Needed)

While you're in Supabase:

1. Go to **Settings → Database**
2. Scroll to **"Database password"**
3. **Verify** the password is `Fakfak-20`
4. If different, either:
   - Update `.env.local` with the correct password, OR
   - Reset the password and update `.env.local`

---

## Step 5: Test Connection Again

After fixing the schema and verifying the password:

```bash
# Test connection
npm run test:db

# Should now show:
# ✅ Connection successful!
# ✅ Public schema exists
```

---

## Step 6: Run Migrations

Once connection works:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database
npx prisma db seed
```

---

## Alternative: If SQL Editor Also Fails

If you get permission errors in SQL Editor:

1. **Check project status** - Ensure project is not paused
2. **Try as different user** - Some operations require superuser
3. **Contact Supabase support** - They can restore the public schema

---

**After running the SQL in Supabase SQL Editor, the public schema will be fixed and you can proceed with migrations!**

