-- Step 4: Verify Seed Data
-- Run this AFTER seed.sql to verify users and settings were created

SELECT email, name, role FROM "users" LIMIT 20;
SELECT key, value FROM "admin_settings" LIMIT 20;

