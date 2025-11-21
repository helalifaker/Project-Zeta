/**
 * Initialize transition year data for 2025-2027
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking transition year data...\n');

  const existingYears = await prisma.transition_year_data.findMany({
    select: { year: true },
    orderBy: { year: 'asc' },
  });

  console.log(
    `Found ${existingYears.length} existing records:`,
    existingYears.map((y) => y.year)
  );

  const requiredYears = [2025, 2026, 2027];
  const missingYears = requiredYears.filter((year) => !existingYears.some((y) => y.year === year));

  if (missingYears.length === 0) {
    console.log('\n✅ All transition years already initialized!\n');
    return;
  }

  console.log(`\n📝 Creating records for years: ${missingYears.join(', ')}\n`);

  for (const year of missingYears) {
    const created = await prisma.transition_year_data.create({
      data: {
        year,
        targetEnrollment: 1850,
        staffCostBase: 32000000, // Default: 32M SAR
        averageTuitionPerStudent: 25000, // Default: 25K SAR per student
        otherRevenue: 0,
        staffCostGrowthPercent: 0, // Default: 0% growth
        rentGrowthPercent: 0, // Default: 0% growth
        notes: 'Auto-generated default values',
      },
    });

    console.log(`✅ Created year ${year}:`);
    console.log(`   Enrollment: ${created.targetEnrollment}`);
    console.log(
      `   Tuition: ${created.averageTuitionPerStudent?.toString() || 'null'} SAR/student`
    );
    console.log(`   Staff Base: ${created.staffCostBase.toString()} SAR`);
    console.log(`   Staff Growth: ${created.staffCostGrowthPercent?.toString() || '0'}%`);
    console.log(`   Rent Growth: ${created.rentGrowthPercent?.toString() || '0'}%\n`);
  }

  console.log('✅ Transition year data initialization complete!\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
