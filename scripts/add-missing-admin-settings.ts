import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addMissingSettings() {
  try {
    console.log('Adding missing admin settings...\n');

    // Add cpiRate
    await prisma.admin_settings.upsert({
      where: { key: 'cpiRate' },
      update: {},
      create: {
        key: 'cpiRate',
        value: 0.03, // 3% CPI rate
      },
    });
    console.log('✅ Added/verified cpiRate: 0.03 (3%)');

    // Add discountRate
    await prisma.admin_settings.upsert({
      where: { key: 'discountRate' },
      update: {},
      create: {
        key: 'discountRate',
        value: 0.08, // 8% discount rate
      },
    });
    console.log('✅ Added/verified discountRate: 0.08 (8%)');

    // Add currency
    await prisma.admin_settings.upsert({
      where: { key: 'currency' },
      update: {},
      create: {
        key: 'currency',
        value: 'SAR',
      },
    });
    console.log('✅ Added/verified currency: SAR');

    // Add timezone
    await prisma.admin_settings.upsert({
      where: { key: 'timezone' },
      update: {},
      create: {
        key: 'timezone',
        value: 'Asia/Riyadh',
      },
    });
    console.log('✅ Added/verified timezone: Asia/Riyadh');

    console.log('\n✅ All missing admin settings added successfully!');
    console.log('\nVerifying all critical settings exist...\n');

    // Verify all settings
    const settings = await prisma.admin_settings.findMany({
      select: { key: true },
      orderBy: { key: 'asc' },
    });

    const requiredKeys = [
      'cpiRate',
      'discountRate',
      'zakatRate',
      'debt_interest_rate',
      'bank_deposit_interest_rate',
      'minimum_cash_balance',
      'working_capital_settings',
      'currency',
      'timezone',
    ];

    const existingKeys = settings.map((s) => s.key);
    let allPresent = true;

    requiredKeys.forEach((key) => {
      const exists = existingKeys.includes(key);
      console.log(`${exists ? '✅' : '❌'} ${key}`);
      if (!exists) allPresent = false;
    });

    if (allPresent) {
      console.log('\n✅ SUCCESS: All required admin settings are present!');
      console.log('📋 Phase 0.1 requirements met.');
    } else {
      console.log('\n⚠️  Some settings are still missing.');
    }

  } catch (error) {
    console.error('Error adding settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingSettings();
