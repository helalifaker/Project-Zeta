/**
 * Fix Balance Sheet Imbalances
 *
 * This script fixes two separate issues:
 * 1. Historical data equity values (2023-2024) - recalculate to satisfy A = L + E
 * 2. Missing balance_sheet_settings for all versions - create with correct values
 */

import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

async function fixBalanceSheetImbalances() {
  console.log('='.repeat(80));
  console.log('FIX BALANCE SHEET IMBALANCES');
  console.log('='.repeat(80));
  console.log();

  // --- PART 1: Fix Historical Data Equity Values ---
  console.log('PART 1: Fixing Historical Data Equity Values');
  console.log('-'.repeat(80));
  console.log();

  const historicalRecords = await prisma.historical_actuals.findMany({
    where: {
      year: { in: [2023, 2024] },
    },
  });

  console.log(`Found ${historicalRecords.length} historical records to fix\n`);

  let historicalFixed = 0;

  for (const record of historicalRecords) {
    const totalAssets = new Decimal(record.totalAssets.toString());
    const totalLiabilities = new Decimal(record.totalLiabilities.toString());
    const currentEquity = new Decimal(record.equity.toString());

    // Calculate correct equity: Assets - Liabilities
    const correctEquity = totalAssets.minus(totalLiabilities);

    const difference = correctEquity.minus(currentEquity);

    if (difference.abs().greaterThan(0.01)) {
      console.log(`Year ${record.year}:`);
      console.log(`  Current Equity:  ${currentEquity.toFixed(2)}`);
      console.log(`  Correct Equity:  ${correctEquity.toFixed(2)}`);
      console.log(`  Adjustment:      ${difference.toFixed(2)}`);

      await prisma.historical_actuals.update({
        where: { id: record.id },
        data: {
          equity: correctEquity.toFixed(2),
        },
      });

      console.log(`  ✅ Updated\n`);
      historicalFixed++;
    } else {
      console.log(`Year ${record.year}: ✅ Already balanced\n`);
    }
  }

  console.log(`Fixed ${historicalFixed} historical records\n`);

  // --- PART 2: Create Missing Balance Sheet Settings ---
  console.log('='.repeat(80));
  console.log('PART 2: Creating Missing Balance Sheet Settings');
  console.log('-'.repeat(80));
  console.log();

  const versions = await prisma.versions.findMany({
    include: {
      balance_sheet_settings: true,
      historical_actuals: {
        where: { year: 2024 },
        orderBy: { year: 'desc' },
        take: 1,
      },
    },
  });

  console.log(`Found ${versions.length} versions to check\n`);

  let settingsCreated = 0;

  for (const version of versions) {
    if (version.balance_sheet_settings) {
      console.log(`Version ${version.name}: ✅ Already has settings\n`);
      continue;
    }

    console.log(`Version ${version.name}:`);

    // Determine startingCash and openingEquity based on historical data (if available)
    let startingCash = new Decimal(5_000_000); // Default: 5M SAR
    let openingEquity = new Decimal(55_000_000); // Default: 55M SAR

    // If we have 2024 historical data, use its ending cash and equity
    if (version.historical_actuals && version.historical_actuals.length > 0) {
      const historical2024 = version.historical_actuals[0];
      startingCash = new Decimal(historical2024.cashOnHandAndInBank.toString());

      // Opening equity for 2025+ should be the ending equity from 2024
      // Fetch the CORRECTED equity value
      const correctedRecord = await prisma.historical_actuals.findUnique({
        where: { id: historical2024.id },
      });

      if (correctedRecord) {
        openingEquity = new Decimal(correctedRecord.equity.toString());
        console.log(`  Using 2024 ending values as starting values:`);
      }
    } else {
      console.log(`  No historical data, using defaults:`);
    }

    console.log(`    Starting Cash:   ${startingCash.toFixed(2)}`);
    console.log(`    Opening Equity:  ${openingEquity.toFixed(2)}`);

    await prisma.balance_sheet_settings.create({
      data: {
        versionId: version.id,
        startingCash: startingCash.toFixed(2),
        openingEquity: openingEquity.toFixed(2),
      },
    });

    console.log(`  ✅ Created\n`);
    settingsCreated++;
  }

  console.log(`Created ${settingsCreated} balance sheet settings\n`);

  // --- PART 3: Verification ---
  console.log('='.repeat(80));
  console.log('PART 3: Verification');
  console.log('-'.repeat(80));
  console.log();

  // Verify historical data
  const verifyHistorical = await prisma.historical_actuals.findMany({
    where: { year: { in: [2023, 2024] } },
  });

  console.log('Historical Data Balance Check:');
  for (const record of verifyHistorical) {
    const assets = new Decimal(record.totalAssets.toString());
    const liabilities = new Decimal(record.totalLiabilities.toString());
    const equity = new Decimal(record.equity.toString());
    const balance = assets.minus(liabilities).minus(equity);
    const isBalanced = balance.abs().lessThan(0.01);

    console.log(
      `  ${record.year}: ${isBalanced ? '✅ BALANCED' : '❌ IMBALANCED'} (${balance.toFixed(2)})`
    );
  }
  console.log();

  // Verify balance sheet settings
  const verifySettings = await prisma.versions.findMany({
    include: {
      balance_sheet_settings: true,
    },
  });

  const versionsWithSettings = verifySettings.filter(
    (v) => v.balance_sheet_settings !== null
  ).length;
  const versionsWithoutSettings = verifySettings.filter(
    (v) => v.balance_sheet_settings === null
  ).length;

  console.log('Balance Sheet Settings Check:');
  console.log(`  ✅ Versions with settings:    ${versionsWithSettings}`);
  console.log(`  ❌ Versions without settings: ${versionsWithoutSettings}`);
  console.log();

  if (versionsWithoutSettings > 0) {
    console.log('⚠️  Some versions still missing settings - please run script again');
  } else {
    console.log('✅ All versions now have balance sheet settings');
  }

  console.log();
  console.log('='.repeat(80));
  console.log('FIX COMPLETE');
  console.log('='.repeat(80));
}

fixBalanceSheetImbalances()
  .then(() => {
    console.log('✅ Fix complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
