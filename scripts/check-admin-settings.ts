import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdminSettings() {
  try {
    const settings = await prisma.admin_settings.findMany({
      select: {
        key: true,
        value: true,
      },
      orderBy: {
        key: 'asc',
      },
    });

    console.log('\n=== Admin Settings in Database ===\n');

    if (settings.length === 0) {
      console.log('⚠️  No admin_settings found in database!');
    } else {
      settings.forEach((setting) => {
        console.log(`Key: ${setting.key}`);
        console.log(`Value: ${JSON.stringify(setting.value, null, 2)}`);
        console.log('---');
      });
    }

    console.log(`\nTotal settings: ${settings.length}`);

    // Check for required fields
    const requiredKeys = [
      'zakatRate',
      'debt_interest_rate',
      'bank_deposit_interest_rate',
      'minimum_cash_balance',
      'working_capital_settings',
      'cpiRate',
      'discountRate',
    ];

    console.log('\n=== Required Fields Check ===\n');

    const existingKeys = settings.map((s) => s.key);
    requiredKeys.forEach((key) => {
      const exists = existingKeys.includes(key);
      console.log(`${exists ? '✅' : '❌'} ${key}`);
    });

    // Check for deprecated taxRate
    const hasTaxRate = existingKeys.includes('taxRate');
    if (hasTaxRate) {
      console.log('\n⚠️  WARNING: Deprecated "taxRate" field found. Should be replaced with "zakatRate"');
    }

  } catch (error) {
    console.error('Error checking admin settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminSettings();
