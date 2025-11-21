/**
 * Script to insert missing admin_settings fields
 * Fixes Phase 0.1: Missing Database Fields
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Inserting missing admin_settings fields...\n');

  const settings = [
    {
      key: 'zakatRate',
      value: 0.025, // 2.5% - Saudi Arabian standard
    },
    {
      key: 'debt_interest_rate',
      value: 0.05, // 5%
    },
    {
      key: 'bank_deposit_interest_rate',
      value: 0.02, // 2%
    },
    {
      key: 'minimum_cash_balance',
      value: 1000000, // 1M SAR
    },
    {
      key: 'working_capital_settings',
      value: {
        accountsReceivable: { collectionDays: 0 },
        accountsPayable: { paymentDays: 30 },
        deferredIncome: { deferralFactor: 0.25 },
        accruedExpenses: { accrualDays: 15 },
      },
    },
  ];

  for (const setting of settings) {
    try {
      // Check if exists
      const existing = await prisma.admin_settings.findUnique({
        where: { key: setting.key },
      });

      if (existing) {
        console.log(`✅ ${setting.key}: Already exists (value: ${JSON.stringify(existing.value)})`);
      } else {
        // Insert new setting
        await prisma.admin_settings.create({
          data: {
            key: setting.key,
            value: setting.value,
          },
        });
        console.log(`✅ ${setting.key}: Inserted (value: ${JSON.stringify(setting.value)})`);
      }
    } catch (error) {
      console.error(`❌ ${setting.key}: Failed -`, error);
    }
  }

  console.log('\n✅ Admin settings insertion complete!');
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
