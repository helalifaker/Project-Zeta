/**
 * Fix Public Schema Script (using pg library)
 * Creates the public schema if missing and sets proper permissions
 * Safe version - avoids modifying reserved roles
 */

import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const DIRECT_URL = process.env.DIRECT_URL;

if (!DIRECT_URL) {
  console.error('❌ DIRECT_URL not found in environment variables');
  process.exit(1);
}

// TypeScript type guard: after the check above, DIRECT_URL is definitely defined
const DIRECT_URL_CONST: string = DIRECT_URL;

async function fixPublicSchema(): Promise<void> {
  console.log('🔧 Fixing public schema (safe mode - avoids reserved roles)...');
  console.log(`   Connecting to: ${DIRECT_URL_CONST.replace(/:[^:@]+@/, ':****@')}`);

  const client = new Client({
    connectionString: DIRECT_URL_CONST,
    ssl: {
      rejectUnauthorized: false, // Supabase uses self-signed certificates
    },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read and execute safe SQL script
    const sqlPath = path.join(__dirname, 'fix-public-schema-safe.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Execute SQL (it handles errors gracefully with DO blocks)
    await client.query(sql);
    console.log('✅ Executed public schema repair SQL');

    // Verify schema exists and get info
    const result = await client.query(`
      SELECT 
        current_schema as "Current Schema",
        current_schemas(true) as "Search Path",
        current_user as "Current User"
    `);

    if (result.rows.length > 0) {
      console.log('');
      console.log('📊 Schema Status:');
      console.log(`   Current Schema: ${result.rows[0]?.['Current Schema']}`);
      console.log(`   Current User: ${result.rows[0]?.['Current User']}`);
      console.log(`   Search Path: ${result.rows[0]?.['Search Path']}`);
    }

    // Verify public schema exists
    const schemaCheck = await client.query(`
      SELECT schema_name, schema_owner 
      FROM information_schema.schemata 
      WHERE schema_name = 'public'
    `);

    if (schemaCheck.rows.length > 0) {
      console.log('');
      console.log('✅ Verification: public schema exists');
      console.log(`   Owner: ${schemaCheck.rows[0]?.schema_owner}`);
    } else {
      console.warn('⚠️  Warning: Could not verify public schema');
    }

    // Test creating a table
    await client.query('CREATE TABLE IF NOT EXISTS public._healthcheck(id int);');
    await client.query('DROP TABLE IF EXISTS public._healthcheck;');
    console.log('✅ Test: Can create/drop tables in public schema');
  } catch (error) {
    console.error('❌ Error fixing public schema:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Code:', (error as any).code);
    }
    throw error;
  } finally {
    await client.end();
  }
}

fixPublicSchema()
  .then(() => {
    console.log('');
    console.log('🎉 Public schema fix completed!');
    console.log('   You can now run: npx prisma migrate dev --name init');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to fix public schema:', error);
    process.exit(1);
  });

