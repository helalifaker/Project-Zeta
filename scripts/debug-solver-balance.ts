/**
 * Debug CircularSolver Balance Sheet Calculation
 *
 * Tests if the CircularSolver correctly balances the Balance Sheet
 */

import Decimal from 'decimal.js';
import { CircularSolver, type SolverParams } from '@/lib/calculations/financial/circular-solver';

async function debugSolverBalance() {
  console.log('='.repeat(80));
  console.log('CIRCULAR SOLVER BALANCE SHEET TEST');
  console.log('='.repeat(80));
  console.log();

  // Simple test case
  const revenue = new Array(30).fill(null).map((_, i) => new Decimal(100_000_000 + i * 1_000_000));
  const ebitda = revenue.map((r) => r.times(0.15)); // 15% EBITDA margin
  const capex = new Array(30).fill(null).map(() => new Decimal(5_000_000));
  const staffCosts = revenue.map((r) => r.times(0.4)); // 40% staff costs

  const params: SolverParams = {
    versionId: 'test',
    versionMode: 'RELOCATION_2028',
    revenue,
    ebitda,
    capex,
    fixedAssetsOpening: new Decimal(50_000_000),
    depreciationRate: new Decimal(0.1),
    staffCosts,
    startingCash: new Decimal(5_000_000),
    openingEquity: new Decimal(55_000_000),
  };

  const solver = new CircularSolver();
  const result = await solver.solve(params);

  if (!result.success || !result.data.success) {
    console.error('❌ Solver failed:', result.success ? result.data : result);
    return;
  }

  const solverData = result.data;

  console.log(`✅ Solver converged in ${solverData.iterations} iterations`);
  console.log(`   Max error: ${solverData.maxError.toFixed(6)}`);
  console.log(`   Duration: ${solverData.duration.toFixed(2)}ms`);
  console.log();

  // Check balance for each year
  console.log('Balance Sheet Check (Year-by-Year):');
  console.log('-'.repeat(80));
  console.log('Year | Assets      | Liabilities | Equity      | Balance     | Status');
  console.log('-'.repeat(80));

  let imbalancedYears = 0;
  const imbalances: Array<{ year: number; balance: Decimal }> = [];

  for (const yearData of solverData.projection) {
    const assets = yearData.totalAssets;
    const liabilities = yearData.totalLiabilities;
    const equity = yearData.totalEquity;
    const balance = assets.minus(liabilities).minus(equity);
    const isBalanced = balance.abs().lessThan(0.01);

    if (!isBalanced) {
      imbalancedYears++;
      imbalances.push({ year: yearData.year, balance });
    }

    const status = isBalanced ? '✅' : '❌';
    console.log(
      `${yearData.year} | ${assets.toFixed(0).padStart(11)} | ${liabilities.toFixed(0).padStart(11)} | ${equity.toFixed(0).padStart(11)} | ${balance.toFixed(0).padStart(11)} | ${status}`
    );
  }

  console.log('-'.repeat(80));
  console.log();

  if (imbalancedYears > 0) {
    console.log(`❌ Found ${imbalancedYears} imbalanced years`);
    console.log();
    console.log('Imbalanced Years:');
    for (const { year, balance } of imbalances) {
      console.log(`  ${year}: ${balance.toFixed(2)}`);
    }
    console.log();

    // Detailed analysis of first imbalanced year
    const firstImbalanced = solverData.projection.find((y) =>
      y.totalAssets.minus(y.totalLiabilities).minus(y.totalEquity).abs().greaterThanOrEqualTo(0.01)
    );

    if (firstImbalanced) {
      console.log('Detailed Analysis of First Imbalanced Year:');
      console.log(`Year: ${firstImbalanced.year}`);
      console.log();

      console.log('Assets:');
      console.log(`  Cash:                ${firstImbalanced.cash.toFixed(2)}`);
      console.log(`  Accounts Receivable: ${firstImbalanced.accountsReceivable.toFixed(2)}`);
      console.log(`  Fixed Assets:        ${firstImbalanced.fixedAssets.toFixed(2)}`);
      console.log(`  ---`);
      console.log(`  Total Assets:        ${firstImbalanced.totalAssets.toFixed(2)}`);
      console.log();

      console.log('Liabilities:');
      console.log(`  Accounts Payable:    ${firstImbalanced.accountsPayable.toFixed(2)}`);
      console.log(`  Deferred Income:     ${firstImbalanced.deferredIncome.toFixed(2)}`);
      console.log(`  Accrued Expenses:    ${firstImbalanced.accruedExpenses.toFixed(2)}`);
      console.log(`  Short-term Debt:     ${firstImbalanced.shortTermDebt.toFixed(2)}`);
      console.log(`  ---`);
      console.log(`  Total Liabilities:   ${firstImbalanced.totalLiabilities.toFixed(2)}`);
      console.log();

      console.log('Equity:');
      console.log(`  Opening Equity:      ${firstImbalanced.openingEquity.toFixed(2)}`);
      console.log(`  Retained Earnings:   ${firstImbalanced.retainedEarnings.toFixed(2)}`);
      console.log(`  ---`);
      console.log(`  Total Equity:        ${firstImbalanced.totalEquity.toFixed(2)}`);
      console.log();

      const recalcAssets = firstImbalanced.cash
        .plus(firstImbalanced.accountsReceivable)
        .plus(firstImbalanced.fixedAssets);
      const recalcLiabilities = firstImbalanced.accountsPayable
        .plus(firstImbalanced.deferredIncome)
        .plus(firstImbalanced.accruedExpenses)
        .plus(firstImbalanced.shortTermDebt);
      const recalcEquity = firstImbalanced.openingEquity.plus(firstImbalanced.retainedEarnings);

      console.log('Recalculated Totals:');
      console.log(`  Assets (recalc):     ${recalcAssets.toFixed(2)}`);
      console.log(`  Liabilities (recalc):${recalcLiabilities.toFixed(2)}`);
      console.log(`  Equity (recalc):     ${recalcEquity.toFixed(2)}`);
      console.log();

      console.log('Comparison:');
      console.log(
        `  Assets match?        ${recalcAssets.equals(firstImbalanced.totalAssets) ? 'YES' : 'NO'}`
      );
      console.log(
        `  Liabilities match?   ${recalcLiabilities.equals(firstImbalanced.totalLiabilities) ? 'YES' : 'NO'}`
      );
      console.log(
        `  Equity match?        ${recalcEquity.equals(firstImbalanced.totalEquity) ? 'YES' : 'NO'}`
      );
      console.log();

      const balanceCheck = recalcAssets.minus(recalcLiabilities).minus(recalcEquity);
      console.log(`Balance Check (recalc): ${balanceCheck.toFixed(2)}`);
    }
  } else {
    console.log('✅ All 30 years are balanced!');
  }

  console.log();
  console.log('='.repeat(80));
}

debugSolverBalance()
  .then(() => {
    console.log('✅ Test complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
