-- Safe Public Schema Repair Script
-- Avoids modifying reserved roles (supabase_admin)
-- Non-destructive - safe to run multiple times

-- 1) Create schema if missing (no-op if it exists)
CREATE SCHEMA IF NOT EXISTS public;

-- 2) Set owner (may fail if insufficient privileges, but that's OK)
-- If this fails, schema still exists and can be used
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

