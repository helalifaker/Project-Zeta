/**
 * Apply curriculum fields migration
 * Adds tuitionGrowthRate, teacherRatio, nonTeacherRatio, teacherMonthlySalary, nonTeacherMonthlySalary to curriculum_plans
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

async function applyMigration() {
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

    // Check if columns already exist
    const columnsCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'curriculum_plans'
      AND column_name IN ('tuitionGrowthRate', 'teacherRatio', 'nonTeacherRatio', 'teacherMonthlySalary', 'nonTeacherMonthlySalary');
    `);

    const existingColumns = columnsCheck.rows.map(row => row.column_name);
    console.log('📋 Existing columns:', existingColumns.length > 0 ? existingColumns : 'none');

    if (existingColumns.length === 5) {
      console.log('✅ All columns already exist, skipping migration');
      return;
    }

    // Read migration SQL
    const migrationPath = path.join(__dirname, '..', 'prisma', 'migrations', '20251115_add_curriculum_fields', 'migration.sql');
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found at:', migrationPath);
      process.exit(1);
    }

    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    console.log('📝 Applying migration...');

    // Execute migration (each statement separately)
    const statements = migrationSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement) {
        console.log('  Executing:', statement.substring(0, 60) + '...');
        await client.query(statement);
      }
    }

    console.log('✅ Migration applied successfully');

    // Verify columns were added
    const verifyCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'curriculum_plans'
      AND column_name IN ('tuitionGrowthRate', 'teacherRatio', 'nonTeacherRatio', 'teacherMonthlySalary', 'nonTeacherMonthlySalary');
    `);

    const addedColumns = verifyCheck.rows.map(row => row.column_name);
    console.log('✅ Verified columns:', addedColumns);

    // Try to record in _prisma_migrations table
    try {
      const migrationName = '20251115_add_curriculum_fields';
      await client.query(`
        INSERT INTO "_prisma_migrations" (
          id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count
        ) VALUES (
          gen_random_uuid(), 
          'custom_migration', 
          NOW(), 
          $1, 
          'Applied via custom script', 
          NULL, 
          NOW(), 
          1
        )
        ON CONFLICT (migration_name) DO NOTHING;
      `, [migrationName]);
      console.log('✅ Recorded migration in _prisma_migrations');
    } catch (error) {
      console.warn('⚠️ Could not record in _prisma_migrations:', error.message);
      console.warn('   This is OK if the table does not exist');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('✅ Disconnected from database');
  }
}

applyMigration()
  .then(() => {
    console.log('✅ All done! Now run: npx prisma generate');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

