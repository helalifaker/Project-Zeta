/**
 * Create admin_settings record with transition base year values
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking admin_settings...\n');

  // Check if general settings exist
  let settings = await prisma.admin_settings.findFirst({
    where: { key: 'general' },
  });

  if (!settings) {
    console.log('❌ No general admin_settings found. Creating...\n');

    // Get 2024 historical data for base year values
    const historical2024 = await prisma.historical_actuals.findFirst({
      where: { year: 2024 },
      select: {
        salariesAndRelatedCosts: true,
        schoolRent: true,
      },
    });

    settings = await prisma.admin_settings.create({
      data: {
        key: 'general',
        value: {}, // JSON value (can store CPI, discount rate, etc.)
        transitionCapacityCap: 1850,
        transitionRentAdjustmentPercent: 10.0,
        transitionStaffCostBase2024: historical2024?.salariesAndRelatedCosts || 32000000,
        transitionRentBase2024: historical2024?.schoolRent || 12000000,
      },
    });

    console.log('✅ Created admin_settings:');
    console.log(`   Capacity Cap: ${settings.transitionCapacityCap}`);
    console.log(`   Rent Adjustment: ${settings.transitionRentAdjustmentPercent}%`);
    console.log(`   Staff Cost Base 2024: ${settings.transitionStaffCostBase2024?.toString()} SAR`);
    console.log(`   Rent Base 2024: ${settings.transitionRentBase2024?.toString()} SAR\n`);
  } else {
    console.log('✅ Found existing admin_settings\n');

    // Update with base year values if not set
    if (!settings.transitionStaffCostBase2024 || !settings.transitionRentBase2024) {
      console.log('📝 Updating base year values...\n');

      const historical2024 = await prisma.historical_actuals.findFirst({
        where: { year: 2024 },
        select: {
          salariesAndRelatedCosts: true,
          schoolRent: true,
        },
      });

      settings = await prisma.admin_settings.update({
        where: { id: settings.id },
        data: {
          transitionStaffCostBase2024: historical2024?.salariesAndRelatedCosts || 32000000,
          transitionRentBase2024: historical2024?.schoolRent || 12000000,
        },
      });

      console.log('✅ Updated admin_settings with base year values');
      console.log(
        `   Staff Cost Base 2024: ${settings.transitionStaffCostBase2024?.toString()} SAR`
      );
      console.log(`   Rent Base 2024: ${settings.transitionRentBase2024?.toString()} SAR\n`);
    } else {
      console.log('ℹ️  Base year values already set');
      console.log(
        `   Staff Cost Base 2024: ${settings.transitionStaffCostBase2024?.toString()} SAR`
      );
      console.log(`   Rent Base 2024: ${settings.transitionRentBase2024?.toString()} SAR\n`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
