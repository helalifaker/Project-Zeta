/**
 * Add missing tuitionGrowthRate column to curriculum_plans table
 * This script adds the column that was missing from the initial migration
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const key in envConfig) {
    process.env[key] = envConfig[key];
  }
  console.log('✅ Loaded .env.local');
} else {
  console.error('❌ .env.local not found at:', envPath);
  process.exit(1);
}

async function addTuitionGrowthRate() {
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) {
    console.error('❌ DIRECT_URL not found in environment variables');
    process.exit(1);
  }

  console.log('📝 Connecting to database...');
  
  const client = new Client({
    connectionString: directUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if curriculum_plans table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'curriculum_plans'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.error('❌ curriculum_plans table does not exist');
      process.exit(1);
    }

    console.log('✅ curriculum_plans table exists');

    // Check which columns already exist
    const columnsCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'curriculum_plans'
      AND column_name IN ('tuitionGrowthRate', 'teacherRatio', 'nonTeacherRatio', 'teacherMonthlySalary', 'nonTeacherMonthlySalary')
      ORDER BY column_name;
    `);

    const existingColumns = columnsCheck.rows.map(row => row.column_name);
    console.log('📋 Existing columns:', existingColumns.length > 0 ? existingColumns : 'none');

    const requiredColumns = [
      'tuitionGrowthRate',
      'teacherRatio',
      'nonTeacherRatio',
      'teacherMonthlySalary',
      'nonTeacherMonthlySalary',
    ];

    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length === 0) {
      console.log('✅ All required columns already exist!');
      return;
    }

    console.log('⚠️ Missing columns:', missingColumns);

    // Add missing columns
    for (const columnName of missingColumns) {
      let dataType = 'DECIMAL(5, 4)';
      if (columnName === 'teacherMonthlySalary' || columnName === 'nonTeacherMonthlySalary') {
        dataType = 'DECIMAL(12, 2)';
      }

      console.log(`📝 Adding column: ${columnName} (${dataType})...`);
      await client.query(`
        ALTER TABLE "curriculum_plans" 
        ADD COLUMN IF NOT EXISTS "${columnName}" ${dataType};
      `);
      console.log(`✅ Added column: ${columnName}`);
    }

    // Verify all columns were added
    const verifyCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'curriculum_plans'
      AND column_name IN ('tuitionGrowthRate', 'teacherRatio', 'nonTeacherRatio', 'teacherMonthlySalary', 'nonTeacherMonthlySalary')
      ORDER BY column_name;
    `);

    const addedColumns = verifyCheck.rows.map(row => row.column_name);
    console.log('✅ Verified columns:', addedColumns);

    if (addedColumns.length === 5) {
      console.log('✅ All 5 required columns are now present in the database!');
    } else {
      console.warn(`⚠️ Only ${addedColumns.length} of 5 columns found. Missing:`, 
        requiredColumns.filter(col => !addedColumns.includes(col)));
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('✅ Disconnected from database');
  }
}

addTuitionGrowthRate()
  .then(() => {
    console.log('✅ Migration completed successfully!');
    console.log('📝 Next step: Refresh your browser to test the page');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

