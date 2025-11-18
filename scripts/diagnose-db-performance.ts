#!/usr/bin/env ts-node
/**
 * Database Performance Diagnostic Tool
 * Measures connection establishment vs query execution time
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const prisma = new PrismaClient({
  log: ['error'],
});

interface DiagnosticResult {
  test: string;
  duration: number;
  success: boolean;
  error?: string;
}

async function runDiagnostics(): Promise<void> {
  console.log('🔍 Database Performance Diagnostics\n');
  console.log('=' .repeat(60));
  
  // Check connection string
  const dbUrl = process.env.DATABASE_URL || '';
  console.log('\n📋 Connection Configuration:');
  console.log(`   URL: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);
  console.log(`   Has pgBouncer: ${dbUrl.includes('pgbouncer=true')}`);
  console.log(`   Port: ${dbUrl.match(/:(\d+)\//)?.[1] || 'unknown'}`);
  console.log(`   Region: ${dbUrl.match(/aws-0-([^.]+)/)?.[1] || 'unknown'}`);
  
  const results: DiagnosticResult[] = [];
  
  // Test 1: First connection (cold start)
  console.log('\n🧪 Test 1: Cold Connection Establishment');
  try {
    const start = Date.now();
    await prisma.$connect();
    const duration = Date.now() - start;
    results.push({ test: 'Cold Connection', duration, success: true });
    console.log(`   ✅ Connected in ${duration}ms`);
  } catch (error) {
    const duration = Date.now();
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    results.push({ test: 'Cold Connection', duration, success: false, error: errorMsg });
    console.log(`   ❌ Failed: ${errorMsg}`);
  }
  
  // Test 2: Simple query (warm connection)
  console.log('\n🧪 Test 2: Simple Query (SELECT 1)');
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1 as test`;
    const duration = Date.now() - start;
    results.push({ test: 'Simple Query', duration, success: true });
    console.log(`   ✅ Query executed in ${duration}ms`);
  } catch (error) {
    const duration = Date.now();
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    results.push({ test: 'Simple Query', duration, success: false, error: errorMsg });
    console.log(`   ❌ Failed: ${errorMsg}`);
  }
  
  // Test 3: Multiple queries (connection reuse)
  console.log('\n🧪 Test 3: Connection Reuse (5 queries)');
  const queryTimes: number[] = [];
  for (let i = 0; i < 5; i++) {
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT ${i} as iteration, NOW() as timestamp`;
      const duration = Date.now() - start;
      queryTimes.push(duration);
      console.log(`   Query ${i + 1}: ${duration}ms`);
    } catch (error) {
      console.log(`   Query ${i + 1}: Failed`);
    }
  }
  if (queryTimes.length > 0) {
    const avg = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;
    const min = Math.min(...queryTimes);
    const max = Math.max(...queryTimes);
    results.push({ test: 'Connection Reuse (avg)', duration: avg, success: true });
    console.log(`   📊 Average: ${avg.toFixed(0)}ms, Min: ${min}ms, Max: ${max}ms`);
  }
  
  // Test 4: Count query (actual database operation)
  console.log('\n🧪 Test 4: Count Query (users table)');
  try {
    const start = Date.now();
    const count = await prisma.user.count();
    const duration = Date.now() - start;
    results.push({ test: 'Count Query', duration, success: true });
    console.log(`   ✅ Counted ${count} users in ${duration}ms`);
  } catch (error) {
    const duration = Date.now();
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    results.push({ test: 'Count Query', duration, success: false, error: errorMsg });
    console.log(`   ❌ Failed: ${errorMsg}`);
  }
  
  // Test 5: Network latency test (ping equivalent)
  console.log('\n🧪 Test 5: Network Round-Trip');
  try {
    const start = Date.now();
    const result = await prisma.$queryRaw<Array<{ now: Date }>>`SELECT NOW() as now`;
    const serverTime = result[0]?.now;
    const duration = Date.now() - start;
    const clientTime = new Date();
    const timeDiff = serverTime ? Math.abs(clientTime.getTime() - serverTime.getTime()) : 0;
    results.push({ test: 'Network Round-Trip', duration, success: true });
    console.log(`   ✅ Round-trip: ${duration}ms`);
    console.log(`   ⏱️  Time difference: ${timeDiff}ms`);
  } catch (error) {
    const duration = Date.now();
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    results.push({ test: 'Network Round-Trip', duration, success: false, error: errorMsg });
    console.log(`   ❌ Failed: ${errorMsg}`);
  }
  
  // Test 6: Connection pool status
  console.log('\n🧪 Test 6: Connection Pool Status');
  try {
    const result = await prisma.$queryRaw<Array<{ 
      count: bigint;
      state: string;
    }>>`
      SELECT 
        count(*) as count,
        state
      FROM pg_stat_activity 
      WHERE datname = current_database()
      GROUP BY state
    `;
    console.log('   Active connections:');
    result.forEach(row => {
      console.log(`     ${row.state}: ${row.count}`);
    });
  } catch (error) {
    console.log(`   ⚠️  Could not check connection pool: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:');
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    const status = result.success ? `${result.duration}ms` : `Failed: ${result.error}`;
    console.log(`   ${icon} ${result.test}: ${status}`);
  });
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  const simpleQueryTime = results.find(r => r.test === 'Simple Query')?.duration || 0;
  const avgReuseTime = results.find(r => r.test === 'Connection Reuse (avg)')?.duration || 0;
  
  if (simpleQueryTime > 1000) {
    console.log('   ⚠️  Query time > 1000ms indicates:');
    console.log('      - Network latency to Supabase');
    console.log('      - Connection establishment overhead');
    console.log('      - Possible connection pool exhaustion');
  }
  
  if (avgReuseTime > 500 && avgReuseTime < simpleQueryTime) {
    console.log('   ✅ Connection reuse is working (subsequent queries faster)');
  } else if (avgReuseTime > simpleQueryTime) {
    console.log('   ⚠️  Connection reuse not optimal (queries not getting faster)');
  }
  
  if (!dbUrl.includes('pgbouncer=true')) {
    console.log('   ⚠️  DATABASE_URL missing ?pgbouncer=true - connection pooling may not be optimal');
  }
  
  await prisma.$disconnect();
}

runDiagnostics()
  .then(() => {
    console.log('\n✅ Diagnostics complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Diagnostics failed:', error);
    process.exit(1);
  });

