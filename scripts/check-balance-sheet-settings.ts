/**
 * Check balance sheet settings for all versions
 */

import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

async function checkBalanceSheetSettings() {
  console.log('='.repeat(80));
  console.log('BALANCE SHEET SETTINGS CHECK');
  console.log('='.repeat(80));
  console.log();

  const versions = await prisma.versions.findMany({
    include: {
      balance_sheet_settings: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  console.log(`Found ${versions.length} versions\n`);

  for (const version of versions) {
    console.log(`Version: ${version.name} (${version.id})`);
    console.log(`Mode: ${version.mode}`);

    if (version.balance_sheet_settings) {
      const bss = version.balance_sheet_settings;
      console.log(`✅ Balance Sheet Settings:`);
      console.log(`   Starting Cash: ${new Decimal(bss.startingCash.toString()).toFixed(2)}`);
      console.log(`   Opening Equity: ${new Decimal(bss.openingEquity.toString()).toFixed(2)}`);
    } else {
      console.log(`❌ NO Balance Sheet Settings found`);
    }

    console.log();
  }
}

checkBalanceSheetSettings()
  .then(() => {
    console.log('✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
