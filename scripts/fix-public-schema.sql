-- Fix Public Schema for Supabase
-- This script creates the public schema if it doesn't exist and sets proper permissions

-- Create public schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS public;

-- Grant usage on schema to standard roles
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant all privileges on schema to postgres (owner)
GRANT ALL ON SCHEMA public TO postgres;

-- Grant create privileges to authenticated users
GRANT CREATE ON SCHEMA public TO authenticated, service_role;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;

-- Set default privileges for future sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

-- Ensure search_path includes public
ALTER DATABASE postgres SET search_path TO public, extensions;

-- Verify schema exists
SELECT 
    schema_name,
    schema_owner
FROM information_schema.schemata
WHERE schema_name = 'public';

