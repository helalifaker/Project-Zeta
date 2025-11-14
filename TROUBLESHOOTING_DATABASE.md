# Database Connection Troubleshooting Guide

## Current Issue: Password Authentication Failed

Based on the error and Supabase logs analysis, we have two potential issues:

1. **Missing Public Schema** (confirmed from logs)
2. **Password Authentication** (needs verification)

---

## Step 1: Verify Database Password

The password authentication is failing. Please verify:

### Option A: Check Password in Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `alcpcjfcbrkdmccpjgit`
3. Go to **Settings → Database**
4. Scroll to **"Database password"**
5. **Verify the password is exactly:** `Fakfak-20`
6. If different, update `.env.local` with the correct password

### Option B: Reset Database Password

If you're unsure of the password:

1. Go to **Settings → Database**
2. Click **"Reset database password"**
3. Copy the new password
4. Update `.env.local` with the new password

---

## Step 2: Get Fresh Connection Strings

1. Go to **Settings → Database**
2. Scroll to **"Connection string"**
3. Copy **Session mode (pgBouncer):**
   ```
   postgresql://postgres.alcpcjfcbrkdmccpjgit:[YOUR-PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
4. Copy **Direct connection:**
   ```
   postgresql://postgres.alcpcjfcbrkdmccpjgit:[YOUR-PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your actual password
6. Update `.env.local` with these exact strings

---

## Step 3: Test Connection

Run the test script to verify connection:

```bash
npx tsx scripts/test-connection.ts
```

**Expected output if successful:**
```
✅ Connection successful!
✅ Query successful!
✅ Public schema exists (or warning if missing)
```

**If it fails:**
- Check the error message
- Verify password is correct
- Ensure project is not paused

---

## Step 4: Fix Public Schema (After Connection Works)

Once connection is verified, run:

```bash
npx tsx scripts/fix-public-schema-pg.ts
```

This will:
- Create the `public` schema if missing
- Set proper permissions
- Configure search_path

---

## Step 5: Run Migrations

After public schema is fixed:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database
npx prisma db seed
```

---

## Common Issues & Solutions

### Issue: "password authentication failed"

**Solutions:**
1. Verify password in Supabase dashboard
2. Check for typos in `.env.local`
3. Ensure password doesn't have extra spaces
4. Try resetting database password in Supabase

### Issue: "schema public does not exist"

**Solution:**
- Run: `npx tsx scripts/fix-public-schema-pg.ts`
- This creates the schema and sets permissions

### Issue: "Connection timeout"

**Solutions:**
1. Check if Supabase project is paused (unpause it)
2. Verify network connection
3. Check firewall settings

### Issue: "SSL connection required"

**Solutions:**
- Ensure connection strings include `?sslmode=require` (for DATABASE_URL)
- Or use connection without sslmode for DIRECT_URL (as Supabase provides)

---

## Manual SQL Fix (Alternative)

If scripts don't work, you can run SQL directly in Supabase:

1. Go to **SQL Editor** in Supabase dashboard
2. Run this SQL:

```sql
-- Create public schema
CREATE SCHEMA IF NOT EXISTS public;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres;
GRANT CREATE ON SCHEMA public TO authenticated, service_role;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;

-- Set search_path
ALTER DATABASE postgres SET search_path TO public, extensions;
```

3. Then run migrations: `npx prisma migrate dev --name init`

---

## Next Steps

Once connection works and public schema is fixed:

1. ✅ Run migrations: `npx prisma migrate dev --name init`
2. ✅ Seed database: `npx prisma db seed`
3. ✅ Verify: `npx prisma studio`
4. ✅ Test API: `curl http://localhost:3000/api/health`

---

**Need more help?** Check [DATABASE_SETUP.md](DATABASE_SETUP.md) or [QUICK_START.md](QUICK_START.md)

