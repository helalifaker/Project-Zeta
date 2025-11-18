/**
 * Seed Test Version
 * Creates a test version with all required data including new capex rules
 */

// Load environment variables from .env.local
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

import { PrismaClient, CapexCategory } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test version...');

  // Get first user
  const user = await prisma.users.findFirst();
  if (!user) {
    throw new Error('No user found. Please create a user first.');
  }

  console.log(`✅ Found user: ${user.email}`);

  // Create test version with unique timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '').replace('T', '-').slice(0, -1);
  const version = await prisma.version.create({
    data: {
      name: `Test Version ${timestamp}`,
      description: 'Test version with new capex rules structure',
      mode: 'RELOCATION_2028',
      status: 'DRAFT',
      createdBy: user.id,
    },
  });

  console.log(`✅ Created version: ${version.name} (${version.id})`);

  // Create curriculum plans (FR + IB)
  const frPlan = await prisma.curriculum_plans.create({
    data: {
      versionId: version.id,
      curriculumType: 'FR',
      capacity: 300,
      tuitionBase: new Decimal(80000),
      cpiFrequency: 2,
      tuitionGrowthRate: new Decimal(0.03),
      teacherRatio: new Decimal(0.15), // 1 teacher per 6.67 students
      nonTeacherRatio: new Decimal(0.08), // 1 non-teacher per 12.5 students
      teacherMonthlySalary: new Decimal(25000),
      nonTeacherMonthlySalary: new Decimal(18000),
      studentsProjection: Array.from({ length: 30 }, (_, i) => {
        const year = 2023 + i;
        let students = 0;
        if (year >= 2028 && year <= 2032) {
          // Ramp-up period (70% to 100%)
          const rampProgress = (year - 2028) / 4;
          students = Math.round(300 * (0.7 + 0.3 * rampProgress));
        } else if (year > 2032) {
          // Full capacity
          students = 300;
        }
        return { year, students };
      }),
    },
  });

  const ibPlan = await prisma.curriculum_plans.create({
    data: {
      versionId: version.id,
      curriculumType: 'IB',
      capacity: 200,
      tuitionBase: new Decimal(60000),
      cpiFrequency: 2,
      tuitionGrowthRate: new Decimal(0.04),
      teacherRatio: new Decimal(0.12), // 1 teacher per 8.33 students
      nonTeacherRatio: new Decimal(0.06), // 1 non-teacher per 16.67 students
      teacherMonthlySalary: new Decimal(22000),
      nonTeacherMonthlySalary: new Decimal(16000),
      studentsProjection: Array.from({ length: 30 }, (_, i) => {
        const year = 2023 + i;
        let students = 0;
        if (year >= 2028 && year <= 2032) {
          // Ramp-up period (0% to 80%)
          const rampProgress = (year - 2028) / 4;
          students = Math.round(200 * (0 + 0.8 * rampProgress));
        } else if (year > 2032) {
          // 80% capacity (maintained from 2032)
          students = 160;
        }
        return { year, students };
      }),
    },
  });

  console.log(`✅ Created curriculum plans: FR (${frPlan.id}), IB (${ibPlan.id})`);

  // Create rent plan (Partner Model)
  const rentPlan = await prisma.rent_plans.create({
    data: {
      versionId: version.id,
      rentModel: 'PARTNER_MODEL',
      parameters: {
        partnerYield: 0.08,
        landValue: 50000000,
        buildingValue: 150000000,
        growthRate: 0.03,
        frequency: 2,
      },
    },
  });

  console.log(`✅ Created rent plan: Partner Model (${rentPlan.id})`);

  // Create default capex rules (NEW FUNCTIONALITY)
  const capexRules = await prisma.capex_rules.createMany({
    data: [
      {
        versionId: version.id,
        category: CapexCategory.BUILDING,
        cycleYears: 20,
        baseCost: new Decimal(10000000), // 10M SAR
        startingYear: 2028,
        inflationIndex: null, // Uses global CPI
      },
      {
        versionId: version.id,
        category: CapexCategory.TECHNOLOGY,
        cycleYears: 4,
        baseCost: new Decimal(500000), // 500K SAR
        startingYear: 2028,
        inflationIndex: null,
      },
      {
        versionId: version.id,
        category: CapexCategory.EQUIPMENT,
        cycleYears: 7,
        baseCost: new Decimal(1000000), // 1M SAR
        startingYear: 2028,
        inflationIndex: null,
      },
      {
        versionId: version.id,
        category: CapexCategory.FURNITURE,
        cycleYears: 7,
        baseCost: new Decimal(800000), // 800K SAR
        startingYear: 2028,
        inflationIndex: null,
      },
      {
        versionId: version.id,
        category: CapexCategory.VEHICLES,
        cycleYears: 10,
        baseCost: new Decimal(300000), // 300K SAR
        startingYear: 2028,
        inflationIndex: null,
      },
    ],
  });

  console.log(`✅ Created ${capexRules.count} capex rules`);

  // Create opex sub-accounts
  const opexSubAccounts = await prisma.opex_sub_accounts.createMany({
    data: [
      {
        versionId: version.id,
        subAccountName: 'Marketing & Admissions',
        percentOfRevenue: new Decimal(5),
        isFixed: false,
        fixedAmount: null,
      },
      {
        versionId: version.id,
        subAccountName: 'Facilities Maintenance',
        percentOfRevenue: new Decimal(3),
        isFixed: false,
        fixedAmount: null,
      },
      {
        versionId: version.id,
        subAccountName: 'Utilities',
        percentOfRevenue: null,
        isFixed: true,
        fixedAmount: new Decimal(500000), // Fixed 500K SAR
      },
    ],
  });

  console.log(`✅ Created ${opexSubAccounts.count} opex sub-accounts`);

  console.log('\n🎉 Seed completed successfully!');
  console.log(`\n📊 Test Version Details:`);
  console.log(`   ID: ${version.id}`);
  console.log(`   Name: ${version.name}`);
  console.log(`   URL: http://localhost:3000/versions/${version.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

