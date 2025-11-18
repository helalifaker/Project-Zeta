#!/usr/bin/env node
/**
 * Apply the reports table migration directly via PostgreSQL client
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  const envVars = envFile.split('\n').filter(line => line && !line.startsWith('#'));
  
  envVars.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      process.env[key.trim()] = value;
    }
  });
}

async function applyMigration() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Required for Supabase
    },
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    console.log('🔍 Checking if reports table already exists...\n');
    
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'reports'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (tableExists) {
      console.log('✅ Reports table already exists! No migration needed.');
      await client.end();
      return;
    }
    
    console.log('📝 Reports table does not exist. Creating it...\n');
    
    // Read the migration SQL
    const migrationPath = path.join(__dirname, '..', 'prisma', 'migrations', '20251115_add_reports_table', 'migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log(`📊 Executing migration SQL...\n`);
    
    // Execute migration SQL
    await client.query(migrationSQL);
    
    console.log('  ✓ Migration SQL executed successfully');
    
    console.log('\n✅ Reports table created successfully!');
    
    // Try to record migration in _prisma_migrations table (if it exists)
    try {
      console.log('\n📝 Recording migration in _prisma_migrations table...');
      await client.query(`
        INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
        VALUES (
          $1,
          'manual-migration',
          NOW(),
          '20251115_add_reports_table',
          NULL,
          NULL,
          NOW(),
          1
        )
        ON CONFLICT DO NOTHING;
      `, [`${Date.now()}-add-reports-table`]);
      console.log('✅ Migration recorded!');
    } catch (recordError) {
      console.log('⚠️  Could not record migration (table tracking not required)');
    }
    
    console.log('\n🎉 All done! The reports table is ready to use.');
    
  } catch (error) {
    console.error('\n❌ Error applying migration:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    console.error('\n   Stack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();

