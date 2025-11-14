-- Step 2: Destructive Reset (ONLY run if you want to drop existing objects)
-- WARNING: This will DELETE all existing data!
-- Run this ONLY if you get "relation already exists" errors and want a clean start

DROP TABLE IF EXISTS "admin_settings" CASCADE;
DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "capex_items" CASCADE;
DROP TABLE IF EXISTS "curriculum_plans" CASCADE;
DROP TABLE IF EXISTS "opex_sub_accounts" CASCADE;
DROP TABLE IF EXISTS "rent_plans" CASCADE;
DROP TABLE IF EXISTS "tuition_simulations" CASCADE;
DROP TABLE IF EXISTS "versions" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

DROP TYPE IF EXISTS "Role" CASCADE;
DROP TYPE IF EXISTS "VersionMode" CASCADE;
DROP TYPE IF EXISTS "VersionStatus" CASCADE;
DROP TYPE IF EXISTS "CurriculumType" CASCADE;
DROP TYPE IF EXISTS "RentModel" CASCADE;
DROP TYPE IF EXISTS "CapexCategory" CASCADE;
DROP TYPE IF EXISTS "EntityType" CASCADE;

