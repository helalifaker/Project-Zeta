/**
 * Check Capex Items for a Specific Version
 * Lists all capex items (auto + manual) for a given version
 * 
 * Usage: npx tsx scripts/check-version-capex.ts <versionId>
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function checkVersionCapex(versionId?: string): Promise<void> {
  console.log('🔍 Checking capex items...');
  console.log('');
  
  try {
    let version;
    
    if (versionId) {
      version = await prisma.versions.findUnique({
        where: { id: versionId },
        select: { id: true, name: true },
      });
      
      if (!version) {
        console.error(`❌ Version not found: ${versionId}`);
        process.exit(1);
      }
    } else {
      // Get all versions
      const versions = await prisma.versions.findMany({
        select: { id: true, name: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
      
      if (versions.length === 0) {
        console.log('❌ No versions found');
        process.exit(1);
      }
      
      console.log('📋 Available versions:');
      versions.forEach((v, i) => {
        console.log(`   ${i + 1}. ${v.name} (${v.id})`);
      });
      console.log('');
      
      version = versions[0];
      console.log(`Using latest version: ${version.name}`);
      console.log('');
    }
    
    const allItems = await prisma.capex_items.findMany({
      where: { versionId: version.id },
      include: {
        capex_rules: {
          select: {
            id: true,
            category: true,
          },
        },
      },
      orderBy: [
        { year: 'asc' },
        { category: 'asc' },
      ],
    });
    
    if (allItems.length === 0) {
      console.log(`✅ No capex items found for version: ${version.name}`);
      return;
    }
    
    const manualItems = allItems.filter(item => item.ruleId === null);
    const autoItems = allItems.filter(item => item.ruleId !== null);
    
    console.log(`📊 Version: ${version.name} (${version.id})`);
    console.log(`   Total items: ${allItems.length}`);
    console.log(`   Manual items: ${manualItems.length}`);
    console.log(`   Auto items: ${autoItems.length}`);
    console.log('');
    
    if (manualItems.length > 0) {
      console.log('📝 Manual Items (ruleId = null):');
      for (const item of manualItems) {
        console.log(`   - Year: ${item.year}, Category: ${item.category}, Amount: ${item.amount} SAR`);
        console.log(`     ID: ${item.id}`);
      }
      console.log('');
    }
    
    if (autoItems.length > 0) {
      console.log('🤖 Auto Items (from rules):');
      for (const item of autoItems) {
        const rule = item.capex_rules;
        console.log(`   - Year: ${item.year}, Category: ${item.category}, Amount: ${item.amount} SAR`);
        console.log(`     Rule ID: ${item.ruleId}, Rule Category: ${rule?.category || 'N/A'}`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Failed to check capex items!');
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

const versionId = process.argv[2];
checkVersionCapex(versionId)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

