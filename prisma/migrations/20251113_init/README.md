# Migration SQL Files - Quick Reference

**IMPORTANT: Only paste PURE SQL into Supabase SQL Editor. No Markdown, no headings - just SQL statements.**

## Files in Order

1. **01-sanity-check.sql** (Optional)
   - Check what tables currently exist
   - Run first to see current state

2. **02-reset-destructive.sql** (Only if needed)
   - ⚠️ WARNING: Deletes all existing data!
   - Only run if you get "relation already exists" errors

3. **migration.sql** (Required)
   - Creates all tables, enums, indexes, and foreign keys
   - Run this to set up the database schema

4. **03-verify-tables.sql** (Verification)
   - Verify all tables were created successfully
   - Run after migration.sql

5. **seed.sql** (Required)
   - Creates default users (admin, planner, viewer)
   - Creates admin settings
   - Run after migration.sql succeeds

6. **04-verify-seed.sql** (Verification)
   - Verify users and settings were created
   - Run after seed.sql

7. **05-mark-migration-applied.sql** (Required)
   - Marks the migration as applied in Prisma's tracking table
   - Run after all migrations succeed

## Quick Start

1. Open Supabase SQL Editor
2. Run `01-sanity-check.sql` (optional)
3. Run `migration.sql`
4. Run `03-verify-tables.sql` (verify)
5. Run `seed.sql`
6. Run `04-verify-seed.sql` (verify)
7. Run `05-mark-migration-applied.sql`
8. Run `npx prisma generate` locally

## Default Users Created

- **Admin:** `admin@company.com` / `admin123`
- **Planner:** `planner@company.com` / `planner123`
- **Viewer:** `viewer@company.com` / `viewer123`

⚠️ **Change passwords immediately in production!**

