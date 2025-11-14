/**
 * Fix Public Schema Script
 * Creates the public schema if missing and sets proper permissions
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPublicSchema(): Promise<void> {
  console.log('🔧 Fixing public schema...');

  try {
    // Create public schema if it doesn't exist
    await prisma.$executeRawUnsafe(`
      CREATE SCHEMA IF NOT EXISTS public;
    `);
    console.log('✅ Created public schema');

    // Grant usage on schema to standard roles
    await prisma.$executeRawUnsafe(`
      GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
    `);
    console.log('✅ Granted usage permissions');

    // Grant all privileges on schema to postgres
    await prisma.$executeRawUnsafe(`
      GRANT ALL ON SCHEMA public TO postgres;
    `);

    // Grant create privileges
    await prisma.$executeRawUnsafe(`
      GRANT CREATE ON SCHEMA public TO authenticated, service_role;
    `);
    console.log('✅ Granted create permissions');

    // Set default privileges for future tables
    await prisma.$executeRawUnsafe(`
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
    `);

    // Set default privileges for sequences
    await prisma.$executeRawUnsafe(`
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
    `);
    console.log('✅ Set default privileges');

    // Set search_path
    await prisma.$executeRawUnsafe(`
      ALTER DATABASE postgres SET search_path TO public, extensions;
    `);
    console.log('✅ Set search_path');

    // Verify schema exists
    const result = await prisma.$queryRawUnsafe<Array<{ schema_name: string; schema_owner: string }>>(
      `SELECT schema_name, schema_owner 
       FROM information_schema.schemata 
       WHERE schema_name = 'public'`
    );

    if (result.length > 0) {
      console.log('✅ Verification: public schema exists');
      console.log(`   Owner: ${result[0]?.schema_owner}`);
    } else {
      console.warn('⚠️  Warning: Could not verify public schema');
    }
  } catch (error) {
    console.error('❌ Error fixing public schema:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
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
