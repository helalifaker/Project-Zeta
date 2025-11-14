-- Step 3: Verify Migration Results
-- Run this AFTER migration.sql to verify all tables were created

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected tables:
-- admin_settings, audit_logs, capex_items, curriculum_plans, 
-- opex_sub_accounts, rent_plans, tuition_simulations, users, versions

