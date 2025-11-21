import { prisma } from '../lib/db/prisma';
import Decimal from 'decimal.js';

const versionId = '98780539-2912-4c1d-8f11-15ccbd9e1920';

async function updateHistoricalData() {
  console.log('🔄 Updating historical data for Faker Helali Test version...\n');

  // 2023 Data
  const data2023 = {
    year: 2023,
    versionId,

    // P&L - Revenue
    tuitionFrenchCurriculum: new Decimal('55819340'),
    tuitionIB: new Decimal('0'),
    otherIncome: new Decimal('4373210'),
    totalRevenues: new Decimal('60192550'),

    // P&L - Expenses
    salariesAndRelatedCosts: new Decimal('28460183'),
    schoolRent: new Decimal('7939656'),
    otherExpenses: new Decimal('21816348'),
    totalOperatingExpenses: new Decimal('58216187'),

    // P&L - Other
    depreciationAmortization: new Decimal('2360301'),
    interestIncome: new Decimal('382960'),
    interestExpenses: new Decimal('0'),
    netResult: new Decimal('-978'),

    // Balance Sheet - Assets
    cashOnHandAndInBank: new Decimal('21580604'),
    accountsReceivableAndOthers: new Decimal('9429976'),
    totalCurrentAssets: new Decimal('31010580'),
    tangibleIntangibleAssetsGross: new Decimal('66811686'),
    accumulatedDepreciationAmort: new Decimal('39926077'),
    nonCurrentAssets: new Decimal('26885609'),
    totalAssets: new Decimal('57896189'),

    // Balance Sheet - Liabilities
    accountsPayable: new Decimal('3023457'),
    deferredIncome: new Decimal('21986734'),
    totalCurrentLiabilities: new Decimal('25010191'),
    provisions: new Decimal('21535293'),
    totalLiabilities: new Decimal('46545484'),

    // Balance Sheet - Equity
    retainedEarnings: new Decimal('1634487'),
    equity: new Decimal('9716218'),

    // Cash Flow - Operating Activities
    cfNetResult: new Decimal('-978'),
    cfAccountsReceivable: new Decimal('2495481'),
    cfPrepaidExpenses: new Decimal('33000'),
    cfLoans: new Decimal('-151750'),
    cfIntangibleAssets: new Decimal('-74285'),
    cfAccountsPayable: new Decimal('-957221'),
    cfAccruedExpenses: new Decimal('1443365'),
    cfDeferredIncome: new Decimal('1025429'),
    cfProvisions: new Decimal('6356309'),
    cfDepreciation: new Decimal('2002633'),
    netCashFromOperatingActivities: new Decimal('12172965'),

    // Cash Flow - Investing Activities
    cfAdditionsFixedAssets: new Decimal('-10890160'),
    netCashFromInvestingActivities: new Decimal('-10890160'),

    // Cash Flow - Financing Activities
    cfChangesInFundBalance: new Decimal('-310995'),
    netCashFromFinancingActivities: new Decimal('-310995'),

    // Cash Flow - Summary
    netIncreaseDecreaseCash: new Decimal('970828'),
    cashBeginningOfPeriod: new Decimal('20609776'),
    cashEndOfPeriod: new Decimal('21580604'),
  };

  // 2024 Data
  const data2024 = {
    year: 2024,
    versionId,

    // P&L - Revenue
    tuitionFrenchCurriculum: new Decimal('65503278'),
    tuitionIB: new Decimal('0'),
    otherIncome: new Decimal('5015995'),
    totalRevenues: new Decimal('70519273'),

    // P&L - Expenses
    salariesAndRelatedCosts: new Decimal('29874321'),
    schoolRent: new Decimal('7631145'),
    otherExpenses: new Decimal('29830920'),
    totalOperatingExpenses: new Decimal('67336386'),

    // P&L - Other
    depreciationAmortization: new Decimal('3612073'),
    interestIncome: new Decimal('432479'),
    interestExpenses: new Decimal('0'),
    netResult: new Decimal('3292'),

    // Balance Sheet - Assets
    cashOnHandAndInBank: new Decimal('18250072'),
    accountsReceivableAndOthers: new Decimal('14301148'),
    totalCurrentAssets: new Decimal('32551220'),
    tangibleIntangibleAssetsGross: new Decimal('79763893'),
    accumulatedDepreciationAmort: new Decimal('43538150'),
    nonCurrentAssets: new Decimal('36225743'),
    totalAssets: new Decimal('68776963'),

    // Balance Sheet - Liabilities
    accountsPayable: new Decimal('4087609'),
    deferredIncome: new Decimal('23726112'),
    totalCurrentLiabilities: new Decimal('27813721'),
    provisions: new Decimal('31149512'),
    totalLiabilities: new Decimal('58963233'),

    // Balance Sheet - Equity
    retainedEarnings: new Decimal('95206'),
    equity: new Decimal('9718524'),

    // Cash Flow - Operating Activities
    cfNetResult: new Decimal('3292'),
    cfAccountsReceivable: new Decimal('-4871172'),
    cfPrepaidExpenses: new Decimal('1501'),
    cfLoans: new Decimal('45750'),
    cfIntangibleAssets: new Decimal('-450182'),
    cfAccountsPayable: new Decimal('1064152'),
    cfAccruedExpenses: new Decimal('-1587140'),
    cfDeferredIncome: new Decimal('1739978'),
    cfProvisions: new Decimal('9614219'),
    cfDepreciation: new Decimal('3145274'),
    netCashFromOperatingActivities: new Decimal('8704694'),

    // Cash Flow - Investing Activities
    cfAdditionsFixedAssets: new Decimal('-12035226'),
    netCashFromInvestingActivities: new Decimal('-12035226'),

    // Cash Flow - Financing Activities
    cfChangesInFundBalance: new Decimal('-978'),
    netCashFromFinancingActivities: new Decimal('-978'),

    // Cash Flow - Summary
    netIncreaseDecreaseCash: new Decimal('-3330532'),
    cashBeginningOfPeriod: new Decimal('21580604'),
    cashEndOfPeriod: new Decimal('18250072'),
  };

  try {
    // Upsert 2023 data
    await prisma.historical_actuals.upsert({
      where: { versionId_year: { versionId, year: 2023 } },
      update: data2023,
      create: data2023,
    });
    console.log('✅ 2023 data updated');

    // Upsert 2024 data
    await prisma.historical_actuals.upsert({
      where: { versionId_year: { versionId, year: 2024 } },
      update: data2024,
      create: data2024,
    });
    console.log('✅ 2024 data updated');

    console.log('\n✨ Historical data update complete!');
    console.log('\n📊 Summary:');
    console.log('2023 - Revenue: 60,192,550 SAR, Net Result: -978 SAR');
    console.log('2024 - Revenue: 70,519,273 SAR, Net Result: 3,292 SAR');
  } catch (error) {
    console.error('❌ Error updating historical data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateHistoricalData();
