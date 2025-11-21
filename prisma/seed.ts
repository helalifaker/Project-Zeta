/**
 * Database Seed Script
 * Creates initial admin user and default settings
 * 
 * Run with: npx prisma db seed
 */

import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...');

  // 1. Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.users.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      email: 'admin@company.com',
      name: 'Admin User',
      password: adminPassword,
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // 2. Create Planner User
  const plannerPassword = await bcrypt.hash('planner123', 10);
  const planner = await prisma.users.upsert({
    where: { email: 'planner@company.com' },
    update: {},
    create: {
      email: 'planner@company.com',
      name: 'Finance Planner',
      password: plannerPassword,
      role: Role.PLANNER,
      emailVerified: new Date(),
    },
  });
  console.log('✅ Planner user created:', planner.email);

  // 3. Create Viewer User
  const viewerPassword = await bcrypt.hash('viewer123', 10);
  const viewer = await prisma.users.upsert({
    where: { email: 'viewer@company.com' },
    update: {},
    create: {
      email: 'viewer@company.com',
      name: 'Board Member',
      password: viewerPassword,
      role: Role.VIEWER,
      emailVerified: new Date(),
    },
  });
  console.log('✅ Viewer user created:', viewer.email);

  // 4. Create Admin Settings
  const settings = [
    { key: 'cpiRate', value: 0.03 },
    { key: 'discountRate', value: 0.08 },
    { key: 'taxRate', value: 0.15 }, // Keep for backward compatibility
    // Phase 0.1: Financial Statement Settings (added 2025-11-21)
    { key: 'zakatRate', value: 0.025 }, // 2.5% (Saudi Arabian standard)
    { key: 'debt_interest_rate', value: 0.05 }, // 5% (default for Interest Expense)
    { key: 'bank_deposit_interest_rate', value: 0.02 }, // 2% (default for Interest Income)
    { key: 'minimum_cash_balance', value: 1000000 }, // 1,000,000 SAR (triggers automatic debt)
    { key: 'working_capital_settings', value: {
      accountsReceivable: { collectionDays: 0 },
      accountsPayable: { paymentDays: 30 },
      deferredIncome: { deferralFactor: 0.25 },
      accruedExpenses: { accrualDays: 15 }
    }},
    { key: 'currency', value: 'SAR' },
    { key: 'timezone', value: 'Asia/Riyadh' },
    { key: 'dateFormat', value: 'DD/MM/YYYY' },
    { key: 'numberFormat', value: '1,000,000' },
  ];

  for (const setting of settings) {
    await prisma.admin_settings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: {
        key: setting.key,
        value: setting.value,
        updatedBy: admin.id,
      },
    });
    console.log(`✅ Setting created: ${setting.key} = ${setting.value}`);
  }

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📝 Default Users:');
  console.log('  Admin:   admin@company.com / admin123');
  console.log('  Planner: planner@company.com / planner123');
  console.log('  Viewer:  viewer@company.com / viewer123');
  console.log('\n⚠️  IMPORTANT: Change passwords immediately in production!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

