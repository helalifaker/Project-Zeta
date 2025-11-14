/**
 * Test Prisma Connection
 * Verifies database connection with current .env.local settings
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testConnection(): Promise<void> {
  console.log('🔍 Testing Prisma connection...');
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || 'NOT SET'}`);
  
  try {
    // Test connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Connection successful!');
    console.log('   Result:', result);
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`✅ Database accessible! Found ${userCount} users.`);
  } catch (error) {
    console.error('❌ Connection failed!');
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
      if (error.message.includes('Authentication failed')) {
        console.error('\n🔧 Troubleshooting:');
        console.error('   1. Verify password in Supabase Dashboard');
        console.error('   2. Check if username format is correct: postgres.alcpcjfcbrkdmccpjgit');
        console.error('   3. Ensure connection string uses correct port (6543 for pooler)');
        console.error('   4. Verify sslmode=require is included');
      }
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testConnection()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

