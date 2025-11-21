/**
 * Transition Period Defaults Seed Script
 *
 * Purpose: Initialize or update transition year data (2025-2027) with smart defaults
 *
 * Business Logic:
 * - Staff costs deflated backward from 2028 baseline using CPI
 * - Enrollment at capacity (1,850 students) for all years
 * - Rent adjustment at +10% from 2024 historical baseline
 *
 * Usage:
 *   npx tsx prisma/seeds/transition-defaults.ts
 */

import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

const prisma = new PrismaClient();

// Constants
const CPI_ANNUAL_RATE = 0.03; // 3% annual CPI growth
const BASELINE_YEAR_2028_STAFF_COST = 10_000_000; // SAR
const TRANSITION_CAPACITY = 1850; // Max students during transition
const TRANSITION_RENT_ADJUSTMENT = 10.0; // +10% from 2024 historical rent

/**
 * Calculate staff cost for a given year by deflating from 2028 baseline
 *
 * Formula: staffCost(year) = baseline_2028 / (1 + CPI)^(2028 - year)
 *
 * @param year Target year (2025-2027)
 * @returns Deflated staff cost as Decimal
 */
function calculateStaffCostForYear(year: number): Decimal {
  const yearsDifference = 2028 - year;
  const growthFactor = new Decimal(1 + CPI_ANNUAL_RATE).pow(yearsDifference);
  const staffCost = new Decimal(BASELINE_YEAR_2028_STAFF_COST).dividedBy(growthFactor);

  return staffCost.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/**
 * Seed transition year data with smart defaults
 */
async function seedTransitionDefaults() {
  console.log('🌱 Seeding transition period defaults...\n');

  try {
    // Step 1: Update admin_settings with transition global parameters
    console.log('📝 Updating admin_settings with transition parameters...');

    // Check if admin_settings table has rows
    const settingsCount = await prisma.admin_settings.count();

    if (settingsCount > 0) {
      // Update all rows (in case there are multiple settings)
      const updated = await prisma.admin_settings.updateMany({
        data: {
          transitionCapacityCap: TRANSITION_CAPACITY,
          transitionRentAdjustmentPercent: new Decimal(TRANSITION_RENT_ADJUSTMENT),
        },
      });
      console.log(`✅ Updated ${updated.count} admin_settings record(s)`);
    } else {
      console.log('⚠️  No admin_settings records found - skipping update');
      console.log('   Note: Admin settings are usually managed through the admin UI');
    }

    // Step 2: Seed transition_year_data for years 2025-2027
    console.log('\n📅 Seeding transition year data (2025-2027)...');

    const transitionYears = [
      {
        year: 2025,
        targetEnrollment: TRANSITION_CAPACITY,
        staffCostBase: calculateStaffCostForYear(2025),
        notes: 'Full capacity - transition year 1 (deflated from 2028 baseline)',
      },
      {
        year: 2026,
        targetEnrollment: TRANSITION_CAPACITY,
        staffCostBase: calculateStaffCostForYear(2026),
        notes: 'Full capacity - transition year 2 (deflated from 2028 baseline)',
      },
      {
        year: 2027,
        targetEnrollment: TRANSITION_CAPACITY,
        staffCostBase: calculateStaffCostForYear(2027),
        notes: 'Full capacity - transition year 3 (deflated from 2028 baseline)',
      },
    ];

    for (const yearData of transitionYears) {
      const existing = await prisma.transition_year_data.findUnique({
        where: { year: yearData.year },
      });

      if (existing) {
        // Update existing record
        const updated = await prisma.transition_year_data.update({
          where: { year: yearData.year },
          data: {
            targetEnrollment: yearData.targetEnrollment,
            staffCostBase: yearData.staffCostBase,
            notes: yearData.notes,
          },
        });
        console.log(
          `✅ Updated year ${updated.year}: ${updated.targetEnrollment} students, ${updated.staffCostBase.toFixed(2)} SAR staff costs`
        );
      } else {
        // Create new record
        const created = await prisma.transition_year_data.create({
          data: yearData,
        });
        console.log(
          `✅ Created year ${created.year}: ${created.targetEnrollment} students, ${created.staffCostBase.toFixed(2)} SAR staff costs`
        );
      }
    }

    // Step 3: Verify seeded data
    console.log('\n🔍 Verifying seeded data...');
    const allTransitionData = await prisma.transition_year_data.findMany({
      orderBy: { year: 'asc' },
    });

    console.log('\nTransition Year Data Summary:');
    console.log(
      '┌──────┬─────────────┬──────────────────┬────────────────────────────────────────────┐'
    );
    console.log(
      '│ Year │ Enrollment  │ Staff Cost (SAR) │ Notes                                      │'
    );
    console.log(
      '├──────┼─────────────┼──────────────────┼────────────────────────────────────────────┤'
    );

    allTransitionData.forEach((data) => {
      const year = data.year.toString().padEnd(4);
      const enrollment = data.targetEnrollment.toString().padEnd(11);
      const staffCost = new Decimal(data.staffCostBase).toFixed(2).padEnd(16);
      const notes = (data.notes || '').substring(0, 42).padEnd(42);
      console.log(`│ ${year} │ ${enrollment} │ ${staffCost} │ ${notes} │`);
    });

    console.log(
      '└──────┴─────────────┴──────────────────┴────────────────────────────────────────────┘'
    );

    console.log('\n✅ Transition defaults seeded successfully!');
    console.log('\nNext steps:');
    console.log('  1. Review seeded data in Prisma Studio: npx prisma studio');
    console.log('  2. Update transition calculation logic to use this data');
    console.log('  3. Create admin UI for editing transition parameters');
  } catch (error) {
    console.error('❌ Error seeding transition defaults:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedTransitionDefaults()
  .then(() => {
    console.log('\n🎉 Seed script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seed script failed:', error);
    process.exit(1);
  });
