/**
 * Phase 0.1 Verification Script
 * 
 * Verifies that all required admin_settings fields exist in the database
 * and checks if migration has been applied.
 * 
 * Run with: npx tsx scripts/verify-phase-0-1.ts
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

interface VerificationResult {
  field: string;
  exists: boolean;
  value?: unknown;
  error?: string;
}

const REQUIRED_FIELDS = [
  'zakatRate',
  'debt_interest_rate',
  'bank_deposit_interest_rate',
  'minimum_cash_balance',
  'working_capital_settings',
] as const;

async function verifyPhase01(): Promise<void> {
  console.log('🔍 Phase 0.1 Verification Starting...\n');
  console.log('Checking for required admin_settings fields:\n');

  const results: VerificationResult[] = [];

  for (const field of REQUIRED_FIELDS) {
    try {
      const setting = await prisma.admin_settings.findUnique({
        where: { key: field },
      });

      if (setting) {
        results.push({
          field,
          exists: true,
          value: setting.value,
        });
        console.log(`✅ ${field}: EXISTS`);
        console.log(`   Value: ${JSON.stringify(setting.value)}`);
      } else {
        results.push({
          field,
          exists: false,
        });
        console.log(`❌ ${field}: MISSING`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        field,
        exists: false,
        error: errorMessage,
      });
      console.log(`❌ ${field}: ERROR - ${errorMessage}`);
    }
    console.log('');
  }

  // Summary
  console.log('='.repeat(60));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  
  const allExist = results.every((r) => r.exists);
  const missingFields = results.filter((r) => !r.exists).map((r) => r.field);
  
  if (allExist) {
    console.log('✅ SUCCESS: All required fields exist in database!');
    console.log('\nPhase 0.1 is FULLY IMPLEMENTED ✅');
    console.log('\nNext steps:');
    console.log('1. Test in development (npm run dev)');
    console.log('2. Verify no [DEFAULT] warnings in console');
    console.log('3. Proceed to Phase 0.2 (Database Performance)');
  } else {
    console.log('❌ FAILURE: Some fields are missing!');
    console.log(`\nMissing fields: ${missingFields.join(', ')}`);
    console.log('\nAction required:');
    console.log('1. Run migration: npx prisma migrate deploy (or migrate dev)');
    console.log('2. Run seed: npx prisma db seed');
    console.log('3. Re-run this verification script');
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Detailed results
  console.log('\nDETAILED RESULTS:');
  results.forEach((result) => {
    console.log(`\n${result.field}:`);
    console.log(`  Exists: ${result.exists ? '✅' : '❌'}`);
    if (result.value !== undefined) {
      console.log(`  Value: ${JSON.stringify(result.value)}`);
    }
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });
}

verifyPhase01()
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

