/**
 * Cache Performance Test Script
 *
 * Purpose: Verify that in-memory caching is working correctly
 * Tests:
 * 1. Admin settings cache (10-minute TTL)
 * 2. Cache invalidation
 * 3. Performance improvement measurement
 *
 * Run: npx tsx scripts/test-cache-performance.ts
 */

import { getCachedFinancialSettings, invalidateAdminSettingsCache } from '../lib/cache/admin-settings-cache';

async function testAdminSettingsCache() {
  console.log('🧪 Testing Admin Settings Cache\n');

  // Test 1: First fetch (cache miss)
  console.log('1️⃣ First fetch (cache miss - will query database):');
  const start1 = performance.now();
  const settings1 = await getCachedFinancialSettings();
  const time1 = performance.now() - start1;
  console.log(`   ✅ Fetched settings in ${time1.toFixed(2)}ms`);
  console.log(`   📊 Zakat rate: ${settings1.zakatRate.toNumber()}`);

  // Test 2: Second fetch (cache hit)
  console.log('\n2️⃣ Second fetch (cache hit - should be <1ms):');
  const start2 = performance.now();
  const settings2 = await getCachedFinancialSettings();
  const time2 = performance.now() - start2;
  console.log(`   ✅ Fetched settings in ${time2.toFixed(2)}ms`);
  console.log(`   📊 Zakat rate: ${settings2.zakatRate.toNumber()}`);

  // Performance comparison
  const improvement = ((time1 - time2) / time1 * 100).toFixed(1);
  console.log(`\n📈 Performance Improvement: ${improvement}% faster (${time1.toFixed(2)}ms → ${time2.toFixed(2)}ms)`);

  // Test 3: Cache invalidation
  console.log('\n3️⃣ Cache invalidation:');
  invalidateAdminSettingsCache();
  console.log('   ✅ Cache invalidated');

  // Test 4: Fetch after invalidation (cache miss again)
  console.log('\n4️⃣ Fetch after invalidation (cache miss):');
  const start3 = performance.now();
  const settings3 = await getCachedFinancialSettings();
  const time3 = performance.now() - start3;
  console.log(`   ✅ Fetched settings in ${time3.toFixed(2)}ms`);
  console.log(`   📊 Zakat rate: ${settings3.zakatRate.toNumber()}`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 CACHE PERFORMANCE SUMMARY');
  console.log('='.repeat(60));
  console.log(`Cache Miss (DB Query):     ${time1.toFixed(2)}ms`);
  console.log(`Cache Hit (In-Memory):     ${time2.toFixed(2)}ms`);
  console.log(`Performance Improvement:   ${improvement}%`);
  console.log(`Target: <10ms (Cached)     ${time2 < 10 ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(60));

  // Success criteria
  if (time2 < 10) {
    console.log('\n✅ SUCCESS: Cache performance meets target (<10ms)');
    return true;
  } else {
    console.log('\n❌ FAILURE: Cache performance does not meet target');
    return false;
  }
}

async function main() {
  try {
    const success = await testAdminSettingsCache();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Error during cache test:', error);
    process.exit(1);
  }
}

main();
