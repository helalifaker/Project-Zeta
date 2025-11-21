/**
 * Check if 2024 historical data exists
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking for 2024 historical actuals data...\n');

  const historical2024 = await prisma.historical_actuals.findMany({
    where: { year: 2024 },
    select: {
      versionId: true,
      year: true,
      salariesAndRelatedCosts: true,
      schoolRent: true,
    },
  });

  if (historical2024.length === 0) {
    console.log('❌ No 2024 historical actuals found!\n');
    console.log('Creating sample 2024 data...\n');

    // Get first version
    const version = await prisma.versions.findFirst({
      select: { id: true, name: true },
    });

    if (!version) {
      console.log('❌ No versions found. Please create a version first.');
      return;
    }

    // Create 2024 historical data
    const created = await prisma.historical_actuals.create({
      data: {
        versionId: version.id,
        year: 2024,
        salariesAndRelatedCosts: 32000000, // 32M SAR
        schoolRent: 12000000, // 12M SAR
        totalRevenues: 45000000,
        totalOperatingExpenses: 50000000,
        netResult: -5000000,
      },
    });

    console.log('✅ Created 2024 historical data:');
    console.log(`   Version: ${version.name}`);
    console.log(`   Staff Costs: ${created.salariesAndRelatedCosts.toString()} SAR`);
    console.log(`   Rent: ${created.schoolRent.toString()} SAR\n`);
  } else {
    console.log(`✅ Found ${historical2024.length} record(s) for 2024:\n`);
    historical2024.forEach((record, i) => {
      console.log(`   Record ${i + 1}:`);
      console.log(`   Staff Costs: ${record.salariesAndRelatedCosts.toString()} SAR`);
      console.log(`   Rent: ${record.schoolRent.toString()} SAR\n`);
    });
  }

  // Check admin_settings
  const settings = await prisma.admin_settings.findFirst({
    where: { key: 'general' },
    select: {
      transitionStaffCostBase2024: true,
      transitionRentBase2024: true,
    },
  });

  console.log('📋 Admin Settings:');
  if (settings) {
    console.log(
      `   Staff Cost Base 2024: ${settings.transitionStaffCostBase2024?.toString() || 'Not set'}`
    );
    console.log(`   Rent Base 2024: ${settings.transitionRentBase2024?.toString() || 'Not set'}`);
  } else {
    console.log('   ❌ No admin_settings found');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
