-- Step 1: Sanity Check - List current public tables
-- Run this FIRST to see what exists before migration

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

