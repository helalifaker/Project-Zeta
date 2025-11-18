/**
 * Check Manual Capex Items
 * Lists all manual capex items currently in the database
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function checkManualCapexItems(): Promise<void> {
  console.log('🔍 Checking for manual capex items...');
  console.log('');
  
  try {
    const manualItems = await prisma.capex_items.findMany({
      where: {
        ruleId: null,
      },
      include: {
        versions: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { versionId: 'asc' },
        { year: 'asc' },
        { category: 'asc' },
      ],
    });
    
    if (manualItems.length === 0) {
      console.log('✅ No manual capex items found. Database is clean!');
      return;
    }
    
    console.log(`📊 Found ${manualItems.length} manual capex item(s):`);
    console.log('');
    
    // Group by version
    const byVersion = new Map<string, typeof manualItems>();
    for (const item of manualItems) {
      const versionId = item.versionId;
      if (!byVersion.has(versionId)) {
        byVersion.set(versionId, []);
      }
      byVersion.get(versionId)!.push(item);
    }
    
    for (const [versionId, items] of byVersion.entries()) {
      const version = items[0].versions;
      console.log(`📁 Version: ${version.name} (${versionId})`);
      console.log(`   Items: ${items.length}`);
      console.log('');
      
      for (const item of items) {
        console.log(`   - Year: ${item.year}, Category: ${item.category}, Amount: ${item.amount} SAR`);
        console.log(`     ID: ${item.id}`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Failed to check manual capex items!');
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkManualCapexItems()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

