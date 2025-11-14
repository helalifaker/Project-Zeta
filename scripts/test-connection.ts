/**
 * Test Database Connection Script
 * Helps verify database credentials are correct
 */

import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const DIRECT_URL = process.env.DIRECT_URL;
const DATABASE_URL = process.env.DATABASE_URL;

console.log('🔍 Testing database connection...');
console.log('');

if (!DIRECT_URL) {
  console.error('❌ DIRECT_URL not found in .env.local');
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

// Mask password in output
const maskUrl = (url: string): string => {
  return url.replace(/:([^:@]+)@/, ':****@');
};

console.log('📋 Connection Strings:');
console.log(`   DIRECT_URL: ${maskUrl(DIRECT_URL)}`);
console.log(`   DATABASE_URL: ${maskUrl(DATABASE_URL)}`);
console.log('');

async function testConnection(): Promise<void> {
  const client = new Client({
    connectionString: DIRECT_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('🔄 Attempting to connect...');
    await client.connect();
    console.log('✅ Connection successful!');

    // Test query
    const result = await client.query('SELECT version(), current_database(), current_user;');
    console.log('✅ Query successful!');
    console.log('');
    console.log('📊 Database Info:');
    console.log(`   Database: ${result.rows[0]?.current_database}`);
    console.log(`   User: ${result.rows[0]?.current_user}`);
    console.log(`   Version: ${result.rows[0]?.version?.split(',')[0]}`);

    // Check if public schema exists
    const schemaCheck = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = 'public'
    `);

    if (schemaCheck.rows.length > 0) {
      console.log('');
      console.log('✅ Public schema exists');
    } else {
      console.log('');
      console.log('⚠️  Public schema does NOT exist');
      console.log('   This is the issue! Run: npx tsx scripts/fix-public-schema-pg.ts');
    }
  } catch (error) {
    console.error('');
    console.error('❌ Connection failed!');
    if (error instanceof Error) {
      console.error(`   Error Type: ${error.constructor.name}`);
      console.error(`   Error Message: ${error.message || '(no message)'}`);
      console.error(`   Error Code: ${(error as any).code || '(no code)'}`);
      
      if (error.message && error.message.includes('password authentication failed')) {
        console.error('');
        console.error('🔧 Troubleshooting:');
        console.error('   1. Verify password in Supabase: Settings → Database → Database password');
        console.error('   2. Check if password contains special characters that need URL encoding');
        console.error('   3. Try copying connection string again from Supabase dashboard');
        console.error('   4. Ensure project is not paused');
      } else {
        console.error('');
        console.error('🔧 Full Error Details:');
        console.error(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      }
    } else {
      console.error('   Unknown error:', error);
    }
    throw error;
  } finally {
    await client.end();
  }
}

testConnection()
  .then(() => {
    console.log('');
    console.log('🎉 Connection test completed!');
    process.exit(0);
  })
  .catch(() => {
    console.error('');
    console.error('❌ Connection test failed');
    process.exit(1);
  });

