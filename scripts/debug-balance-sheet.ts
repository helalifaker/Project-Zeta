/**
 * Debug Balance Sheet Imbalance
 *
 * This script investigates the balance sheet imbalance issues for both
 * historical (2023-2024) and projection years (2025-2052).
 */

import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

async function debugBalanceSheet() {
  console.log('='.repeat(80));
  console.log('BALANCE SHEET IMBALANCE DIAGNOSTIC REPORT');
  console.log('='.repeat(80));
  console.log();

  // Find the first version to analyze
  const version = await prisma.versions.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      balance_sheet_settings: true,
    },
  });

  if (!version) {
    console.error('❌ No versions found in database');
    return;
  }

  console.log(`📋 Analyzing Version: ${version.name} (${version.id})`);
  console.log(`   Mode: ${version.mode}`);
  console.log();

  // --- PART 1: Historical Years (2023-2024) ---
  console.log('='.repeat(80));
  console.log('PART 1: HISTORICAL YEARS (2023-2024)');
  console.log('='.repeat(80));
  console.log();

  const historicalData = await prisma.historical_actuals.findMany({
    where: {
      versionId: version.id,
      year: { in: [2023, 2024] },
    },
    orderBy: { year: 'asc' },
  });

  console.log(`Found ${historicalData.length} historical records\n`);

  for (const h of historicalData) {
    console.log(`--- Year ${h.year} (Actual Data) ---`);
    console.log();

    // Assets
    const cash = new Decimal(h.cashOnHandAndInBank.toString());
    const ar = new Decimal(h.accountsReceivableAndOthers.toString());
    const fixedAssetsGross = new Decimal(h.tangibleIntangibleAssetsGross.toString());
    const accumulatedDepr = new Decimal(h.accumulatedDepreciationAmort.toString());
    const fixedAssetsNet = fixedAssetsGross.minus(accumulatedDepr);
    const totalAssets = new Decimal(h.totalAssets.toString());

    console.log('Assets:');
    console.log(`  Cash:                    ${cash.toFixed(2)}`);
    console.log(`  Accounts Receivable:     ${ar.toFixed(2)}`);
    console.log(`  Fixed Assets (Gross):    ${fixedAssetsGross.toFixed(2)}`);
    console.log(`  Accumulated Depr:        ${accumulatedDepr.toFixed(2)}`);
    console.log(`  Fixed Assets (Net):      ${fixedAssetsNet.toFixed(2)}`);
    console.log(`  ---`);
    console.log(`  Total Assets (DB):       ${totalAssets.toFixed(2)}`);

    const calculatedAssets = cash.plus(ar).plus(fixedAssetsNet);
    console.log(`  Total Assets (Calc):     ${calculatedAssets.toFixed(2)}`);
    console.log(`  Difference:              ${calculatedAssets.minus(totalAssets).toFixed(2)}`);
    console.log();

    // Liabilities
    const ap = new Decimal(h.accountsPayable.toString());
    const deferred = new Decimal(h.deferredIncome.toString());
    const provisions = new Decimal(h.provisions.toString());
    const totalLiabilities = new Decimal(h.totalLiabilities.toString());

    console.log('Liabilities:');
    console.log(`  Accounts Payable:        ${ap.toFixed(2)}`);
    console.log(`  Deferred Income:         ${deferred.toFixed(2)}`);
    console.log(`  Provisions (Accrued):    ${provisions.toFixed(2)}`);
    console.log(`  ---`);
    console.log(`  Total Liabilities (DB):  ${totalLiabilities.toFixed(2)}`);

    const calculatedLiabilities = ap.plus(deferred).plus(provisions);
    console.log(`  Total Liab (Calc):       ${calculatedLiabilities.toFixed(2)}`);
    console.log(
      `  Difference:              ${calculatedLiabilities.minus(totalLiabilities).toFixed(2)}`
    );
    console.log();

    // Equity
    const retainedEarnings = new Decimal(h.retainedEarnings.toString());
    const equity = new Decimal(h.equity.toString());

    console.log('Equity:');
    console.log(`  Retained Earnings:       ${retainedEarnings.toFixed(2)}`);
    console.log(`  Total Equity (DB):       ${equity.toFixed(2)}`);
    console.log();

    // Balance Check
    const balanceCheck = totalAssets.minus(totalLiabilities).minus(equity);
    const isBalanced = balanceCheck.abs().lessThan(0.01);

    console.log('Balance Check:');
    console.log(`  Assets:                  ${totalAssets.toFixed(2)}`);
    console.log(`  Liabilities:             ${totalLiabilities.toFixed(2)}`);
    console.log(`  Equity:                  ${equity.toFixed(2)}`);
    console.log(`  ---`);
    console.log(`  Balance (A - L - E):     ${balanceCheck.toFixed(2)}`);
    console.log(`  Status:                  ${isBalanced ? '✅ BALANCED' : '❌ IMBALANCED'}`);
    console.log();

    if (!isBalanced) {
      console.log('🔍 Imbalance Analysis:');

      // Check if equity needs adjustment
      const correctEquity = totalAssets.minus(totalLiabilities);
      console.log(`  Correct Equity should be:    ${correctEquity.toFixed(2)}`);
      console.log(`  Current Equity in DB:        ${equity.toFixed(2)}`);
      console.log(`  Adjustment Needed:           ${correctEquity.minus(equity).toFixed(2)}`);
      console.log();

      // Check relationship with retained earnings
      console.log(
        `  Is Equity = Retained Earnings? ${equity.equals(retainedEarnings) ? 'YES' : 'NO'}`
      );
      if (!equity.equals(retainedEarnings)) {
        console.log(`  Missing Opening Equity?`);
      }
      console.log();
    }

    console.log('-'.repeat(80));
    console.log();
  }

  // --- PART 2: Balance Sheet Settings ---
  console.log('='.repeat(80));
  console.log('PART 2: BALANCE SHEET SETTINGS');
  console.log('='.repeat(80));
  console.log();

  const bsSettings = await prisma.balance_sheet_settings.findUnique({
    where: { versionId: version.id },
  });

  if (bsSettings) {
    const startingCash = new Decimal(bsSettings.startingCash.toString());
    const openingEquity = new Decimal(bsSettings.openingEquity.toString());

    console.log('Balance Sheet Settings:');
    console.log(`  Starting Cash (Year 0 EOY):  ${startingCash.toFixed(2)}`);
    console.log(`  Opening Equity (Year 0):     ${openingEquity.toFixed(2)}`);
    console.log();
  } else {
    console.log('⚠️  No balance sheet settings found for this version');
    console.log();
  }

  // --- PART 3: Key Questions ---
  console.log('='.repeat(80));
  console.log('PART 3: ROOT CAUSE ANALYSIS');
  console.log('='.repeat(80));
  console.log();

  console.log('Key Questions:');
  console.log();

  console.log('1. Opening Equity vs. Retained Earnings:');
  console.log('   - In historical data, is Equity = Opening Equity + Retained Earnings?');
  console.log('   - Or is Equity = Retained Earnings (missing opening equity)?');
  console.log();

  console.log('2. Historical Data Integrity:');
  console.log('   - Was the historical data imported correctly?');
  console.log('   - Are totalAssets, totalLiabilities, and equity from the source spreadsheet?');
  console.log();

  console.log('3. CircularSolver for Projections:');
  console.log('   - Is the solver correctly accumulating retained earnings?');
  console.log('   - Is openingEquity being added to retained earnings?');
  console.log('   - Formula: totalEquity = openingEquity + cumulativeRetainedEarnings');
  console.log();

  console.log('='.repeat(80));
  console.log('END OF DIAGNOSTIC REPORT');
  console.log('='.repeat(80));
}

debugBalanceSheet()
  .then(() => {
    console.log('✅ Diagnostic complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
