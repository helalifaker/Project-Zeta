/**
 * Test Admin Settings Helpers
 * 
 * Purpose: Verify admin settings helpers work correctly
 * Run: npx tsx scripts/test-admin-settings.ts
 */

import {
  getZakatRate,
  getDebtInterestRate,
  getBankDepositInterestRate,
  getMinimumCashBalance,
  getWorkingCapitalSettings,
  getAllFinancialSettings,
} from '../lib/utils/admin-settings';

async function main() {
  console.log('🧪 Testing Admin Settings Helpers...\n');

  // Test 1: getZakatRate
  console.log('1. Testing getZakatRate()...');
  const zakatRate = await getZakatRate();
  if (zakatRate.success) {
    console.log(`   ✅ Zakat Rate: ${zakatRate.data.toNumber()} (${(zakatRate.data.toNumber() * 100).toFixed(2)}%)`);
  } else {
    console.log(`   ❌ Error: ${zakatRate.error}`);
  }

  // Test 2: getDebtInterestRate
  console.log('2. Testing getDebtInterestRate()...');
  const debtRate = await getDebtInterestRate();
  if (debtRate.success) {
    console.log(`   ✅ Debt Interest Rate: ${debtRate.data.toNumber()} (${(debtRate.data.toNumber() * 100).toFixed(2)}%)`);
  } else {
    console.log(`   ❌ Error: ${debtRate.error}`);
  }

  // Test 3: getBankDepositInterestRate
  console.log('3. Testing getBankDepositInterestRate()...');
  const depositRate = await getBankDepositInterestRate();
  if (depositRate.success) {
    console.log(`   ✅ Bank Deposit Rate: ${depositRate.data.toNumber()} (${(depositRate.data.toNumber() * 100).toFixed(2)}%)`);
  } else {
    console.log(`   ❌ Error: ${depositRate.error}`);
  }

  // Test 4: getMinimumCashBalance
  console.log('4. Testing getMinimumCashBalance()...');
  const minCash = await getMinimumCashBalance();
  if (minCash.success) {
    console.log(`   ✅ Minimum Cash: ${minCash.data.toNumber().toLocaleString()} SAR`);
  } else {
    console.log(`   ❌ Error: ${minCash.error}`);
  }

  // Test 5: getWorkingCapitalSettings
  console.log('5. Testing getWorkingCapitalSettings()...');
  const wcSettings = await getWorkingCapitalSettings();
  if (wcSettings.success) {
    console.log(`   ✅ Working Capital:`);
    console.log(`      • AR Collection Days: ${wcSettings.data.accountsReceivable.collectionDays}`);
    console.log(`      • AP Payment Days: ${wcSettings.data.accountsPayable.paymentDays}`);
    console.log(`      • Deferred Income Factor: ${wcSettings.data.deferredIncome.deferralFactor} (${(wcSettings.data.deferredIncome.deferralFactor * 100).toFixed(0)}%)`);
    console.log(`      • Accrued Expense Days: ${wcSettings.data.accruedExpenses.accrualDays}`);
  } else {
    console.log(`   ❌ Error: ${wcSettings.error}`);
  }

  // Test 6: getAllFinancialSettings (batched)
  console.log('6. Testing getAllFinancialSettings() [BATCHED]...');
  const startTime = performance.now();
  const allSettings = await getAllFinancialSettings();
  const duration = performance.now() - startTime;
  
  if (allSettings.success) {
    console.log(`   ✅ All Settings Fetched (${duration.toFixed(2)}ms):`);
    console.log(`      • Zakat Rate: ${allSettings.data.zakatRate.toNumber()}`);
    console.log(`      • Debt Rate: ${allSettings.data.debtInterestRate.toNumber()}`);
    console.log(`      • Deposit Rate: ${allSettings.data.bankDepositInterestRate.toNumber()}`);
    console.log(`      • Min Cash: ${allSettings.data.minimumCashBalance.toNumber().toLocaleString()}`);
    console.log(`      • Working Capital: Configured`);
  } else {
    console.log(`   ❌ Error: ${allSettings.error}`);
  }

  console.log('\n✅ All Admin Settings Helper Tests Completed!');
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error('\n❌ Test Error:', e);
    process.exit(1);
  });

