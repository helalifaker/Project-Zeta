#!/usr/bin/env node
/**
 * Apply capex_rules migration
 * This script applies the migration to add the capex_rules table
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function applyMigration() {
  const directUrl = process.env.DIRECT_URL;
  
  if (!directUrl) {
    console.error('❌ DIRECT_URL environment variable not found');
    process.exit(1);
  }

  // Set environment variable to allow self-signed certificates
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  const client = new Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read migration file
    const migrationPath = path.resolve(__dirname, '../prisma/migrations/20251115232139_add_capex_rules/migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Applying capex_rules migration...');
    
    // Execute migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration applied successfully');

    // Record migration in _prisma_migrations table
    try {
      await client.query(`
        INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
        VALUES (
          gen_random_uuid(),
          '',
          NOW(),
          '20251115232139_add_capex_rules',
          '',
          NULL,
          NOW(),
          1
        )
        ON CONFLICT DO NOTHING;
      `);
      console.log('✅ Migration recorded in _prisma_migrations');
    } catch (err) {
      console.warn('⚠️ Could not record migration (table may not exist):', err.message);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();

