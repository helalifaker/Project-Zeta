/**
 * Delete All Manual Capex Items
 * Removes all manual capex items (where ruleId IS NULL) from the database
 * 
 * Usage: npx tsx scripts/delete-manual-capex.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function deleteManualCapexItems(): Promise<void> {
  console.log('🗑️  Deleting all manual capex items...');
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || 'NOT SET'}`);
  console.log('');
  
  try {
    // First, count how many manual items exist
    const manualItemsCount = await prisma.capex_items.count({
      where: {
        ruleId: null, // Manual items have ruleId = null
      },
    });
    
    console.log(`📊 Found ${manualItemsCount} manual capex item(s) to delete`);
    
    if (manualItemsCount === 0) {
      console.log('✅ No manual capex items to delete. Database is clean!');
      return;
    }
    
    // Show a breakdown by version (optional, for visibility)
    const itemsByVersion = await prisma.capex_items.groupBy({
      by: ['versionId'],
      where: {
        ruleId: null,
      },
      _count: {
        id: true,
      },
    });
    
    if (itemsByVersion.length > 0) {
      console.log('');
      console.log('📋 Breakdown by version:');
      for (const group of itemsByVersion) {
        const version = await prisma.versions.findUnique({
          where: { id: group.versionId },
          select: { name: true },
        });
        console.log(`   - ${version?.name || group.versionId}: ${group._count.id} item(s)`);
      }
    }
    
    // Confirm deletion
    console.log('');
    console.log('⚠️  WARNING: This will delete ALL manual capex items!');
    console.log('   Auto-generated items (from rules) will NOT be affected.');
    console.log('');
    
    // Delete all manual capex items
    const deleteResult = await prisma.capex_items.deleteMany({
      where: {
        ruleId: null, // Only delete manual items
      },
    });
    
    console.log('');
    console.log(`✅ Successfully deleted ${deleteResult.count} manual capex item(s)!`);
    console.log('   Auto-generated items (from rules) remain untouched.');
    
    // Verify deletion
    const remainingCount = await prisma.capex_items.count({
      where: {
        ruleId: null,
      },
    });
    
    if (remainingCount === 0) {
      console.log('✅ Verification: No manual items remaining. Clean!');
    } else {
      console.log(`⚠️  Warning: ${remainingCount} manual item(s) still exist.`);
    }
    
  } catch (error) {
    console.error('❌ Failed to delete manual capex items!');
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteManualCapexItems()
  .then(() => {
    console.log('');
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ Script failed!');
    console.error(error);
    process.exit(1);
  });

