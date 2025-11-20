import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

async function updateHistoricalData() {
  try {
    console.log('Starting historical data update...');

    // Get all versions to update their historical data
    const versions = await prisma.versions.findMany({
      select: { id: true, name: true }
    });

    if (versions.length === 0) {
      console.log('No versions found. Please create a version first.');
      return;
    }

    console.log(`Found ${versions.length} version(s). Updating historical data...`);

    for (const version of versions) {
      console.log(`\nUpdating version: ${version.name} (${version.id})`);

      // Update 2023 data
      const data2023 = {
        versionId: version.id,
        year: 2023,

        // P&L - Revenue
        tuitionFrenchCurriculum: new Decimal(55819340),
        tuitionIB: new Decimal(0),
        otherIncome: new Decimal(4373210),
        totalRevenues: new Decimal(55819340).plus(4373210), // 60,192,550

        // P&L - Expenses
        salariesAndRelatedCosts: new Decimal(28460183),
        schoolRent: new Decimal(7939656),
        otherExpenses: new Decimal(21816348),
        totalOperatingExpenses: new Decimal(28460183).plus(7939656).plus(21816348), // 58,216,187

        // P&L - Other
        depreciationAmortization: new Decimal(2360301),
        interestIncome: new Decimal(382960),
        interestExpenses: new Decimal(0),
        netResult: new Decimal(0), // Will be calculated

        // Balance Sheet - Assets
        cashOnHandAndInBank: new Decimal(21580604),
        accountsReceivableAndOthers: new Decimal(9429976),
        totalCurrentAssets: new Decimal(21580604).plus(9429976), // 31,010,580
        tangibleIntangibleAssetsGross: new Decimal(66811686),
        accumulatedDepreciationAmort: new Decimal(39926077),
        nonCurrentAssets: new Decimal(66811686).minus(39926077), // 26,885,609
        totalAssets: new Decimal(31010580).plus(26885609), // 57,896,189

        // Balance Sheet - Liabilities
        accountsPayable: new Decimal(3023457),
        deferredIncome: new Decimal(21986734),
        totalCurrentLiabilities: new Decimal(3023457).plus(21986734), // 25,010,191
        provisions: new Decimal(21535293),
        totalLiabilities: new Decimal(25010191).plus(21535293), // 46,545,484

        // Balance Sheet - Equity (from actual data)
        retainedEarnings: new Decimal(2717196), // Retained Earnings 2023
        equity: new Decimal(9716218), // Equity 2023

        // Cash Flow - Operating Activities
        cfNetResult: new Decimal(-978),
        cfAccountsReceivable: new Decimal(2495481),
        cfPrepaidExpenses: new Decimal(33000),
        cfLoans: new Decimal(-151750),
        cfIntangibleAssets: new Decimal(-74285),
        cfAccountsPayable: new Decimal(-957221),
        cfAccruedExpenses: new Decimal(1443365),
        cfDeferredIncome: new Decimal(1025429),
        cfProvisions: new Decimal(6356309),
        cfDepreciation: new Decimal(2002633),
        netCashFromOperatingActivities: new Decimal(12171983),

        // Cash Flow - Investing Activities
        cfAdditionsFixedAssets: new Decimal(-10890160),
        netCashFromInvestingActivities: new Decimal(-10890160),

        // Cash Flow - Financing Activities
        cfChangesInFundBalance: new Decimal(-310995),
        netCashFromFinancingActivities: new Decimal(-310995),

        // Cash Flow - Summary
        netIncreaseDecreaseCash: new Decimal(970828),
        cashBeginningOfPeriod: new Decimal(20609776),
        cashEndOfPeriod: new Decimal(21580604),
      };

      // Net Result for 2023 (from actual data)
      data2023.netResult = new Decimal(978);

      await prisma.historical_actuals.upsert({
        where: {
          versionId_year: {
            versionId: version.id,
            year: 2023
          }
        },
        update: data2023,
        create: data2023
      });

      console.log(`✓ Updated 2023 data`);

      // Update 2024 data
      const data2024 = {
        versionId: version.id,
        year: 2024,

        // P&L - Revenue
        tuitionFrenchCurriculum: new Decimal(65503278),
        tuitionIB: new Decimal(0),
        otherIncome: new Decimal(5015995),
        totalRevenues: new Decimal(65503278).plus(5015995), // 70,519,273

        // P&L - Expenses
        salariesAndRelatedCosts: new Decimal(29874321),
        schoolRent: new Decimal(7631145),
        otherExpenses: new Decimal(29830920),
        totalOperatingExpenses: new Decimal(29874321).plus(7631145).plus(29830920), // 67,336,386

        // P&L - Other
        depreciationAmortization: new Decimal(3612073),
        interestIncome: new Decimal(432479),
        interestExpenses: new Decimal(0),
        netResult: new Decimal(0), // Will be calculated

        // Balance Sheet - Assets
        cashOnHandAndInBank: new Decimal(18250072),
        accountsReceivableAndOthers: new Decimal(14301148),
        totalCurrentAssets: new Decimal(18250072).plus(14301148), // 32,551,220
        tangibleIntangibleAssetsGross: new Decimal(79763893),
        accumulatedDepreciationAmort: new Decimal(43538150),
        nonCurrentAssets: new Decimal(79763893).minus(43538150), // 36,225,743
        totalAssets: new Decimal(32551220).plus(36225743), // 68,776,963

        // Balance Sheet - Liabilities
        accountsPayable: new Decimal(4087609),
        deferredIncome: new Decimal(23726112),
        totalCurrentLiabilities: new Decimal(4087609).plus(23726112), // 27,813,721
        provisions: new Decimal(31149512),
        totalLiabilities: new Decimal(27813721).plus(31149512), // 58,963,233

        // Balance Sheet - Equity (from actual data)
        retainedEarnings: new Decimal(9715292), // Retained Earnings 2024
        equity: new Decimal(9716329), // Equity 2024

        // Cash Flow - Operating Activities
        cfNetResult: new Decimal(3292),
        cfAccountsReceivable: new Decimal(-4871172),
        cfPrepaidExpenses: new Decimal(1501),
        cfLoans: new Decimal(45750),
        cfIntangibleAssets: new Decimal(-450182),
        cfAccountsPayable: new Decimal(1064152),
        cfAccruedExpenses: new Decimal(-1587140),
        cfDeferredIncome: new Decimal(1739978),
        cfProvisions: new Decimal(9614219),
        cfDepreciation: new Decimal(3145274),
        netCashFromOperatingActivities: new Decimal(8705672),

        // Cash Flow - Investing Activities
        cfAdditionsFixedAssets: new Decimal(-12035226),
        netCashFromInvestingActivities: new Decimal(-12035226),

        // Cash Flow - Financing Activities
        cfChangesInFundBalance: new Decimal(-978),
        netCashFromFinancingActivities: new Decimal(-978),

        // Cash Flow - Summary
        netIncreaseDecreaseCash: new Decimal(-3330532),
        cashBeginningOfPeriod: new Decimal(21580604),
        cashEndOfPeriod: new Decimal(18250072),
      };

      // Net Result for 2024 (from actual data)
      data2024.netResult = new Decimal(3252);

      await prisma.historical_actuals.upsert({
        where: {
          versionId_year: {
            versionId: version.id,
            year: 2024
          }
        },
        update: data2024,
        create: data2024
      });

      console.log(`✓ Updated 2024 data`);
    }

    console.log('\n✅ Historical data update completed successfully!');

    // Display summary
    console.log('\n📊 Summary:');
    console.log('2023:');
    console.log(`  Tuition FR: ${new Decimal(55819340).toFixed(2)}`);
    console.log(`  Other Income: ${new Decimal(4373210).toFixed(2)}`);
    console.log(`  Total Revenue: ${new Decimal(60192550).toFixed(2)}`);
    console.log(`  Salaries: ${new Decimal(28460183).toFixed(2)}`);
    console.log(`  School Rent: ${new Decimal(7939656).toFixed(2)}`);
    console.log(`  Other Expenses: ${new Decimal(21816348).toFixed(2)}`);
    console.log(`  Depreciation: ${new Decimal(2360301).toFixed(2)}`);
    console.log(`  Interest Income: ${new Decimal(382960).toFixed(2)}`);
    console.log(`  Net Result: ${new Decimal(978).toFixed(2)}`);
    console.log(`  Retained Earnings: ${new Decimal(2717196).toFixed(2)}`);
    console.log(`  Equity: ${new Decimal(9716218).toFixed(2)}`);
    console.log('');
    console.log('2024:');
    console.log(`  Tuition FR: ${new Decimal(65503278).toFixed(2)}`);
    console.log(`  Other Income: ${new Decimal(5015995).toFixed(2)}`);
    console.log(`  Total Revenue: ${new Decimal(70519273).toFixed(2)}`);
    console.log(`  Salaries: ${new Decimal(29874321).toFixed(2)}`);
    console.log(`  School Rent: ${new Decimal(7631145).toFixed(2)}`);
    console.log(`  Other Expenses: ${new Decimal(29830920).toFixed(2)}`);
    console.log(`  Depreciation: ${new Decimal(3612073).toFixed(2)}`);
    console.log(`  Interest Income: ${new Decimal(432479).toFixed(2)}`);
    console.log(`  Net Result: ${new Decimal(3252).toFixed(2)}`);
    console.log(`  Retained Earnings: ${new Decimal(9715292).toFixed(2)}`);
    console.log(`  Equity: ${new Decimal(9716329).toFixed(2)}`);

  } catch (error) {
    console.error('Error updating historical data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateHistoricalData()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
