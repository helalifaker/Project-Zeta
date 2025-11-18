/**
 * Check if capex_rules table exists in database
 */

require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

async function checkTable() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if table exists
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'capex_rules'
      );
    `);

    const exists = result.rows[0].exists;
    console.log(`\n📊 capex_rules table exists: ${exists ? '✅ YES' : '❌ NO'}`);

    if (exists) {
      // Get table structure
      const structure = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'capex_rules'
        ORDER BY ordinal_position;
      `);
      console.log('\n📋 Table structure:');
      console.table(structure.rows);

      // Check if there are any records
      const count = await client.query('SELECT COUNT(*) FROM capex_rules');
      console.log(`\n📊 Total records: ${count.rows[0].count}`);
    } else {
      console.log('\n⚠️  Table does not exist. Migration needs to be applied.');
      console.log('Run: npx prisma migrate deploy');
    }

    process.exit(exists ? 0 : 1);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkTable();

