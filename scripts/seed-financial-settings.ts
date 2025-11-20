/**
 * Seed Financial Settings
 * 
 * Purpose: Add Zakat rate and Financial Statement settings to admin_settings
 * Run: npx tsx scripts/seed-financial-settings.ts
 * 
 * Reference: prisma/migrations/20251118231938_add_zakat_rate_settings/migration.sql
 */

import { prisma } from '../lib/db/prisma';

async function main() {
  console.log('🌱 Seeding financial settings...\n');

  // 1. Add zakatRate (default: 2.5% per Saudi Arabian law)
  console.log('1. Adding zakatRate...');
  await prisma.admin_settings.upsert({
    where: { key: 'zakatRate' },
    create: {
      key: 'zakatRate',
      value: 0.025,
    },
    update: {
      value: 0.025,
    },
  });
  console.log('   ✅ zakatRate: 0.025 (2.5%)');

  // 2. Add debt_interest_rate (default: 5%)
  console.log('2. Adding debt_interest_rate...');
  await prisma.admin_settings.upsert({
    where: { key: 'debt_interest_rate' },
    create: {
      key: 'debt_interest_rate',
      value: 0.05,
    },
    update: {
      value: 0.05,
    },
  });
  console.log('   ✅ debt_interest_rate: 0.05 (5%)');

  // 3. Add bank_deposit_interest_rate (default: 2%)
  console.log('3. Adding bank_deposit_interest_rate...');
  await prisma.admin_settings.upsert({
    where: { key: 'bank_deposit_interest_rate' },
    create: {
      key: 'bank_deposit_interest_rate',
      value: 0.02,
    },
    update: {
      value: 0.02,
    },
  });
  console.log('   ✅ bank_deposit_interest_rate: 0.02 (2%)');

  // 4. Add minimum_cash_balance (default: 1,000,000 SAR)
  console.log('4. Adding minimum_cash_balance...');
  await prisma.admin_settings.upsert({
    where: { key: 'minimum_cash_balance' },
    create: {
      key: 'minimum_cash_balance',
      value: 1000000,
    },
    update: {
      value: 1000000,
    },
  });
  console.log('   ✅ minimum_cash_balance: 1000000 (1M SAR)');

  // 5. Add working_capital_settings (default: AR=0 days, AP=30 days, deferred=25%, accrued=15 days)
  console.log('5. Adding working_capital_settings...');
  await prisma.admin_settings.upsert({
    where: { key: 'working_capital_settings' },
    create: {
      key: 'working_capital_settings',
      value: {
        accountsReceivable: { collectionDays: 0 },
        accountsPayable: { paymentDays: 30 },
        deferredIncome: { deferralFactor: 0.25 },
        accruedExpenses: { accrualDays: 15 },
      },
    },
    update: {
      value: {
        accountsReceivable: { collectionDays: 0 },
        accountsPayable: { paymentDays: 30 },
        deferredIncome: { deferralFactor: 0.25 },
        accruedExpenses: { accrualDays: 15 },
      },
    },
  });
  console.log('   ✅ working_capital_settings: {AR: 0d, AP: 30d, deferred: 25%, accrued: 15d}');

  console.log('\n✅ Financial settings seeded successfully!');
  console.log('\n📊 Summary:');
  console.log('   • Zakat Rate: 2.5%');
  console.log('   • Debt Interest Rate: 5%');
  console.log('   • Bank Deposit Interest Rate: 2%');
  console.log('   • Minimum Cash Balance: 1M SAR');
  console.log('   • Working Capital: Configured');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding financial settings:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

