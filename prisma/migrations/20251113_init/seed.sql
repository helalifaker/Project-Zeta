-- Seed Data for Project Zeta
-- Creates default users and admin settings
-- Run this AFTER the migration.sql

-- Insert default users
-- Passwords: admin123, planner123, viewer123 (change in production!)

INSERT INTO "users" ("id", "email", "name", "password", "role", "emailVerified", "createdAt", "updatedAt")
VALUES 
  (
    gen_random_uuid()::text,
    'admin@company.com',
    'Admin User',
    '$2a$10$IHDOYyrLqHNJiQQdG/FnCu410b3L2qj8gDbaGFdh4leLmZQetyP5i',
    'ADMIN',
    NOW(),
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid()::text,
    'planner@company.com',
    'Finance Planner',
    '$2a$10$hw1BznEGyU8kX6BEJOohQOvK5pLlOTmnv84AOkXN0iVXOlyQl4Vci',
    'PLANNER',
    NOW(),
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid()::text,
    'viewer@company.com',
    'Board Member',
    '$2a$10$IhGfXNnobtSoqLNqJbGfb..mYKE/Xm9eayDiv1es/CgJlvU5mTygC',
    'VIEWER',
    NOW(),
    NOW(),
    NOW()
  )
ON CONFLICT ("email") DO NOTHING;

-- Insert admin settings
-- Note: We need to get the admin user ID first, so we'll use a subquery

INSERT INTO "admin_settings" ("id", "key", "value", "updatedAt", "updatedBy")
VALUES
  (
    gen_random_uuid()::text,
    'cpiRate',
    '0.03'::jsonb,
    NOW(),
    (SELECT id FROM "users" WHERE email = 'admin@company.com' LIMIT 1)
  ),
  (
    gen_random_uuid()::text,
    'discountRate',
    '0.08'::jsonb,
    NOW(),
    (SELECT id FROM "users" WHERE email = 'admin@company.com' LIMIT 1)
  ),
  (
    gen_random_uuid()::text,
    'taxRate',
    '0.15'::jsonb,
    NOW(),
    (SELECT id FROM "users" WHERE email = 'admin@company.com' LIMIT 1)
  ),
  (
    gen_random_uuid()::text,
    'currency',
    '"SAR"'::jsonb,
    NOW(),
    (SELECT id FROM "users" WHERE email = 'admin@company.com' LIMIT 1)
  ),
  (
    gen_random_uuid()::text,
    'timezone',
    '"Asia/Riyadh"'::jsonb,
    NOW(),
    (SELECT id FROM "users" WHERE email = 'admin@company.com' LIMIT 1)
  ),
  (
    gen_random_uuid()::text,
    'dateFormat',
    '"DD/MM/YYYY"'::jsonb,
    NOW(),
    (SELECT id FROM "users" WHERE email = 'admin@company.com' LIMIT 1)
  ),
  (
    gen_random_uuid()::text,
    'numberFormat',
    '"1,000,000"'::jsonb,
    NOW(),
    (SELECT id FROM "users" WHERE email = 'admin@company.com' LIMIT 1)
  )
ON CONFLICT ("key") DO UPDATE SET
  "value" = EXCLUDED."value",
  "updatedAt" = NOW(),
  "updatedBy" = EXCLUDED."updatedBy";

-- Verify seed data
SELECT 'Users created:' as info;
SELECT email, name, role FROM "users";

SELECT 'Settings created:' as info;
SELECT key, value FROM "admin_settings";

