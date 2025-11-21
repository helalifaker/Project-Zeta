/**
 * Fix Retained Earnings in Historical Data
 *
 * Root Cause Analysis:
 * - The retainedEarnings field in historical_actuals was imported with incorrect values
 * - In this case, Retained Earnings should equal Total Equity (since it's the only equity component)
 * - The equity field is accurate, so we update retainedEarnings to match equity
 *
 * This script:
 * 1. Finds all historical_actuals records (2023-2024)
 * 2. Updates retainedEarnings to match equity for each record
 * 3. Logs all changes made
 * 4. Verifies the fix
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { prisma } from '../lib/db/prisma';
import Decimal from 'decimal.js';

interface HistoricalRecord {
  id: string;
  versionId: string;
  year: number;
  retainedEarnings: Decimal;
  equity: Decimal;
}

async function fixRetainedEarnings(): Promise<void> {
  console.log('🔍 Investigating Retained Earnings issue...\n');

  try {
    // Step 1: Find all historical records
    const allRecords = await prisma.historical_actuals.findMany({
      where: {
        year: {
          in: [2023, 2024],
        },
      },
      select: {
        id: true,
        versionId: true,
        year: true,
        retainedEarnings: true,
        equity: true,
      },
      orderBy: [{ versionId: 'asc' }, { year: 'asc' }],
    });

    if (allRecords.length === 0) {
      console.log('⚠️  No historical records found (2023-2024)');
      return;
    }

    console.log(`📊 Found ${allRecords.length} historical record(s)\n`);

    // Step 2: Identify records that need fixing
    const recordsToFix: Array<{
      id: string;
      versionId: string;
      year: number;
      oldRetainedEarnings: Decimal;
      newRetainedEarnings: Decimal;
      equity: Decimal;
      difference: Decimal;
    }> = [];

    for (const record of allRecords) {
      const retainedEarnings = new Decimal(record.retainedEarnings.toString());
      const equity = new Decimal(record.equity.toString());
      const difference = equity.minus(retainedEarnings);

      // Check if they differ (with 0.01 SAR tolerance for rounding)
      if (difference.abs().greaterThan(0.01)) {
        recordsToFix.push({
          id: record.id,
          versionId: record.versionId,
          year: record.year,
          oldRetainedEarnings: retainedEarnings,
          newRetainedEarnings: equity,
          equity,
          difference,
        });
      }
    }

    if (recordsToFix.length === 0) {
      console.log('✅ All records already have correct Retained Earnings values!\n');

      // Show summary of all records
      console.log('📋 Current State Summary:');
      for (const record of allRecords) {
        const retainedEarnings = new Decimal(record.retainedEarnings.toString());
        const equity = new Decimal(record.equity.toString());
        console.log(
          `  Version ${record.versionId.substring(0, 8)}... | Year ${record.year} | Retained Earnings: ${retainedEarnings.toFixed(2)} | Equity: ${equity.toFixed(2)} | Match: ✅`
        );
      }
      return;
    }

    console.log(`🔧 Found ${recordsToFix.length} record(s) that need fixing:\n`);

    // Step 3: Display what will be fixed
    for (const fix of recordsToFix) {
      console.log(`  Version ${fix.versionId.substring(0, 8)}... | Year ${fix.year}:`);
      console.log(`    Current Retained Earnings: ${fix.oldRetainedEarnings.toFixed(2)} SAR`);
      console.log(`    Total Equity:              ${fix.equity.toFixed(2)} SAR`);
      console.log(`    Difference:               ${fix.difference.toFixed(2)} SAR`);
      console.log(`    → Will update to:         ${fix.newRetainedEarnings.toFixed(2)} SAR\n`);
    }

    // Step 4: Apply fixes in a transaction
    console.log('💾 Applying fixes...\n');

    await prisma.$transaction(
      recordsToFix.map((fix) =>
        prisma.historical_actuals.update({
          where: { id: fix.id },
          data: {
            retainedEarnings: fix.newRetainedEarnings.toFixed(2),
          },
        })
      )
    );

    console.log(`✅ Successfully updated ${recordsToFix.length} record(s)\n`);

    // Step 5: Verify the fix
    console.log('🔍 Verifying fix...\n');

    const verifyRecords = await prisma.historical_actuals.findMany({
      where: {
        id: {
          in: recordsToFix.map((f) => f.id),
        },
      },
      select: {
        id: true,
        versionId: true,
        year: true,
        retainedEarnings: true,
        equity: true,
      },
    });

    let allCorrect = true;
    for (const record of verifyRecords) {
      const retainedEarnings = new Decimal(record.retainedEarnings.toString());
      const equity = new Decimal(record.equity.toString());
      const difference = equity.minus(retainedEarnings);

      if (difference.abs().greaterThan(0.01)) {
        console.log(
          `  ❌ Version ${record.versionId.substring(0, 8)}... | Year ${record.year}: Still mismatched (difference: ${difference.toFixed(2)} SAR)`
        );
        allCorrect = false;
      } else {
        console.log(
          `  ✅ Version ${record.versionId.substring(0, 8)}... | Year ${record.year}: Retained Earnings = Equity (${equity.toFixed(2)} SAR)`
        );
      }
    }

    if (allCorrect) {
      console.log('\n✨ All fixes verified successfully!');
    } else {
      console.log('\n⚠️  Some records still have mismatches. Please investigate.');
    }

    // Step 6: Summary
    console.log('\n📊 Summary:');
    console.log(`  Total records checked: ${allRecords.length}`);
    console.log(`  Records fixed: ${recordsToFix.length}`);
    console.log(`  Records already correct: ${allRecords.length - recordsToFix.length}`);
  } catch (error) {
    console.error('❌ Error fixing retained earnings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixRetainedEarnings()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
