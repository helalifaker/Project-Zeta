-- Step 5: Mark Prisma Migration as Applied
-- Run this AFTER successful migration to tell Prisma the migration was applied
-- This allows Prisma to track migration state even if run manually

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id" TEXT PRIMARY KEY,
  "checksum" TEXT NOT NULL,
  "finished_at" TIMESTAMP,
  "migration_name" TEXT NOT NULL,
  "logs" TEXT,
  "rolled_back_at" TIMESTAMP,
  "started_at" TIMESTAMP NOT NULL DEFAULT now(),
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);

INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
VALUES (
  gen_random_uuid()::text,
  'init_migration',
  now(),
  '20251113_init',
  now(),
  1
)
ON CONFLICT (id) DO NOTHING;

