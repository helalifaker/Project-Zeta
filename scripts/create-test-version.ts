/**
 * Quick script to create a test version for historical data upload
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating test version...');

  // Get the first user (or you can specify your user ID)
  const user = await prisma.users.findFirst();

  if (!user) {
    console.error('No users found. Please create a user first.');
    process.exit(1);
  }

  console.log(`Using user: ${user.email}`);

  // Create a test version
  const version = await prisma.versions.create({
    data: {
      name: 'Historical Data Test Version',
      description: 'Test version for uploading historical data (2023-2024)',
      mode: 'RELOCATION_2028',
      status: 'DRAFT',
      createdBy: user.id,
    },
  });

  console.log('✅ Test version created successfully!');
  console.log(`   ID: ${version.id}`);
  console.log(`   Name: ${version.name}`);
  console.log(`   Mode: ${version.mode}`);
  console.log('\nYou can now upload historical data at:');
  console.log('http://localhost:3000/admin/historical-data');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
