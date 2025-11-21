import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectDatabaseSchema() {
  try {
    console.log('🔍 Inspecting database schema...\n');

    // Check if tables exist by attempting queries
    const checks = {
      'admin_settings table': async () => {
        const result = await prisma.$queryRaw<any[]>`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'admin_settings'
          ORDER BY ordinal_position;
        `;
        return result;
      },
      'transition_year_data table': async () => {
        const result = await prisma.$queryRaw<any[]>`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'transition_year_data'
          ORDER BY ordinal_position;
        `;
        return result;
      },
      'balance_sheet_settings table': async () => {
        const result = await prisma.$queryRaw<any[]>`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'balance_sheet_settings'
          ORDER BY ordinal_position;
        `;
        return result;
      },
      'other_revenue_items table': async () => {
        const result = await prisma.$queryRaw<any[]>`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'other_revenue_items'
          ORDER BY ordinal_position;
        `;
        return result;
      },
      'reports table': async () => {
        const result = await prisma.$queryRaw<any[]>`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'reports'
          ORDER BY ordinal_position;
        `;
        return result;
      },
      'historical_actuals table': async () => {
        const result = await prisma.$queryRaw<any[]>`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'historical_actuals'
          ORDER BY ordinal_position;
        `;
        return result;
      },
      'All tables': async () => {
        const result = await prisma.$queryRaw<any[]>`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `;
        return result;
      },
      '_prisma_migrations table': async () => {
        const result = await prisma.$queryRaw<any[]>`
          SELECT id, migration_name, finished_at, applied_steps_count
          FROM _prisma_migrations
          ORDER BY finished_at DESC;
        `;
        return result;
      },
    };

    for (const [checkName, checkFn] of Object.entries(checks)) {
      try {
        console.log(`\n✓ ${checkName}:`);
        const result = await checkFn();
        if (result.length === 0) {
          console.log('  ⚠️  No data found (table may not exist)');
        } else {
          console.log(`  Found ${result.length} rows/columns:`);
          result.forEach((row, index) => {
            if (index < 50) { // Limit output
              console.log('  -', JSON.stringify(row, null, 2));
            }
          });
          if (result.length > 50) {
            console.log(`  ... and ${result.length - 50} more`);
          }
        }
      } catch (error: any) {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }

    console.log('\n✅ Database schema inspection complete');
  } catch (error) {
    console.error('❌ Failed to inspect database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

inspectDatabaseSchema();
