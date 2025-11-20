/**
 * Import Complete Historical Financial Data from CSV
 *
 * Usage:
 * 1. Prepare a CSV file with this format:
 *    Section,Item,2023,2024
 *    P&L,Tuition French Curriculum,55819340,65503278
 *    ...
 *
 * 2. Save as: scripts/historical-data.csv (or any path)
 *
 * 3. Run: npx tsx scripts/import-historical-data-complete.ts <versionId> [filePath]
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface HistoricalDataComplete {
  versionId: string;
  year: number;

  // P&L - Revenue
  tuitionFrenchCurriculum: number;
  tuitionIB: number;
  otherIncome: number;
  totalRevenues: number;

  // P&L - Expenses
  salariesAndRelatedCosts: number;
  schoolRent: number;
  otherExpenses: number;
  totalOperatingExpenses: number;

  // P&L - Other
  depreciationAmortization: number;
  interestIncome: number;
  interestExpenses: number;
  netResult: number;

  // Balance Sheet - Assets
  cashOnHandAndInBank: number;
  accountsReceivableAndOthers: number;
  totalCurrentAssets: number;
  tangibleIntangibleAssetsGross: number;
  accumulatedDepreciationAmort: number;
  nonCurrentAssets: number;
  totalAssets: number;

  // Balance Sheet - Liabilities
  accountsPayable: number;
  deferredIncome: number;
  totalCurrentLiabilities: number;
  provisions: number;
  totalLiabilities: number;

  // Balance Sheet - Equity
  retainedEarnings: number;
  equity: number;

  // Cash Flow - Operating Activities
  cfNetResult: number;
  cfAccountsReceivable: number;
  cfPrepaidExpenses: number;
  cfLoans: number;
  cfIntangibleAssets: number;
  cfAccountsPayable: number;
  cfAccruedExpenses: number;
  cfDeferredIncome: number;
  cfProvisions: number;
  cfDepreciation: number;
  netCashFromOperatingActivities: number;

  // Cash Flow - Investing Activities
  cfAdditionsFixedAssets: number;
  netCashFromInvestingActivities: number;

  // Cash Flow - Financing Activities
  cfChangesInFundBalance: number;
  netCashFromFinancingActivities: number;

  // Cash Flow - Summary
  netIncreaseDecreaseCash: number;
  cashBeginningOfPeriod: number;
  cashEndOfPeriod: number;
}

// Field mapping from CSV row names to database fields
const fieldMapping: Record<string, keyof Omit<HistoricalDataComplete, 'versionId' | 'year'>> = {
  'Tuition French Curriculum': 'tuitionFrenchCurriculum',
  'Tuition IB': 'tuitionIB',
  'Other Income': 'otherIncome',
  'Total Revenues': 'totalRevenues',
  'Salaries and Related Costs': 'salariesAndRelatedCosts',
  'School Rent': 'schoolRent',
  'Other Expenses': 'otherExpenses',
  'Total Operating Expenses': 'totalOperatingExpenses',
  'Depreciation and Amortization': 'depreciationAmortization',
  'Interest Income': 'interestIncome',
  'Interest Expenses': 'interestExpenses',
  'Net Result': 'netResult',
  'Cash on Hand and in Bank': 'cashOnHandAndInBank',
  'Accounts Receivable and Others': 'accountsReceivableAndOthers',
  'Total Current Assets': 'totalCurrentAssets',
  'Tangible and Intangible Assets Gross': 'tangibleIntangibleAssetsGross',
  'Accumulated Depreciation and Amortization': 'accumulatedDepreciationAmort',
  'Non Current Assets': 'nonCurrentAssets',
  'Total Assets': 'totalAssets',
  'Accounts Payable': 'accountsPayable',
  'Deferred Income': 'deferredIncome',
  'Total Current Liabilities': 'totalCurrentLiabilities',
  'Provisions': 'provisions',
  'Total Liabilities': 'totalLiabilities',
  'Retained Earnings': 'retainedEarnings',
  'Equity': 'equity',
};

// Cash flow specific mappings
const cashFlowMapping: Record<string, keyof Omit<HistoricalDataComplete, 'versionId' | 'year'>> = {
  'Net Result': 'cfNetResult',
  'Accounts Receivable': 'cfAccountsReceivable',
  'Prepaid Expenses': 'cfPrepaidExpenses',
  'Loans': 'cfLoans',
  'Intangible Assets': 'cfIntangibleAssets',
  'Accounts Payable': 'cfAccountsPayable',
  'Accrued Expenses': 'cfAccruedExpenses',
  'Deferred Income': 'cfDeferredIncome',
  'Provisions': 'cfProvisions',
  'Depreciation': 'cfDepreciation',
  'Net Cash from Operating Activities': 'netCashFromOperatingActivities',
  'Additions of Fixed Assets': 'cfAdditionsFixedAssets',
  'Net Cash from Investing Activities': 'netCashFromInvestingActivities',
  'Changes in Fund Balance': 'cfChangesInFundBalance',
  'Net Cash from Financing Activities': 'netCashFromFinancingActivities',
  'Net Increase (Decrease) Cash': 'netIncreaseDecreaseCash',
  'Cash Beginning of Period': 'cashBeginningOfPeriod',
  'Cash End of Period': 'cashEndOfPeriod',
};

async function importFromCSV(versionId: string, filePath: string) {
  console.log(`📊 Reading CSV file: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const csvContent = fs.readFileSync(filePath, 'utf-8');
  const lines = csvContent.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('CSV file is empty or invalid');
  }

  // Parse header
  const headers = lines[0].split(',').map((h) => h.trim());
  console.log(`Headers found: ${headers.join(', ')}`);

  // Verify version exists
  const version = await prisma.versions.findUnique({
    where: { id: versionId },
  });

  if (!version) {
    throw new Error(`Version with ID ${versionId} not found`);
  }

  console.log(`✅ Version found: ${version.name}`);

  // Initialize data structures for each year
  const dataByYear = new Map<number, Partial<HistoricalDataComplete>>();

  // Extract years from headers (skip "Section" and "Item" columns)
  const years = headers.slice(2).map((h) => parseInt(h));
  years.forEach((year) => {
    if (!isNaN(year)) {
      dataByYear.set(year, { versionId, year });
    }
  });

  console.log(`Years detected: ${Array.from(dataByYear.keys()).join(', ')}`);

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const section = values[0]; // P&L, Balance Sheet, Cash Flow
    const item = values[1]; // Field name

    // Determine which mapping to use
    let dbField: keyof Omit<HistoricalDataComplete, 'versionId' | 'year'> | undefined;

    if (section === 'Cash Flow') {
      dbField = cashFlowMapping[item];
    } else {
      dbField = fieldMapping[item];
    }

    if (!dbField) {
      console.log(`⚠️  Skipping unknown field: ${section} - ${item}`);
      continue;
    }

    // Parse values for each year
    for (let j = 2; j < values.length; j++) {
      const year = years[j - 2];
      if (isNaN(year)) continue;

      const yearData = dataByYear.get(year);
      if (!yearData) continue;

      const rawValue = values[j];
      // Handle negative values in parentheses like (28,460,183.000)
      let numericValue = rawValue
        .replace(/[,\s]/g, '') // Remove commas and spaces
        .replace(/\(([0-9.]+)\)/, '-$1'); // Convert (123) to -123

      const parsedValue = parseFloat(numericValue);

      if (!isNaN(parsedValue)) {
        (yearData as any)[dbField] = parsedValue;
      }
    }
  }

  // Upsert data for each year
  for (const [year, data] of dataByYear.entries()) {
    console.log(`\n📝 Upserting data for year ${year}...`);

    const fullData = {
      versionId,
      year,
      tuitionFrenchCurriculum: data.tuitionFrenchCurriculum || 0,
      tuitionIB: data.tuitionIB || 0,
      otherIncome: data.otherIncome || 0,
      totalRevenues: data.totalRevenues || 0,
      salariesAndRelatedCosts: data.salariesAndRelatedCosts || 0,
      schoolRent: data.schoolRent || 0,
      otherExpenses: data.otherExpenses || 0,
      totalOperatingExpenses: data.totalOperatingExpenses || 0,
      depreciationAmortization: data.depreciationAmortization || 0,
      interestIncome: data.interestIncome || 0,
      interestExpenses: data.interestExpenses || 0,
      netResult: data.netResult || 0,
      cashOnHandAndInBank: data.cashOnHandAndInBank || 0,
      accountsReceivableAndOthers: data.accountsReceivableAndOthers || 0,
      totalCurrentAssets: data.totalCurrentAssets || 0,
      tangibleIntangibleAssetsGross: data.tangibleIntangibleAssetsGross || 0,
      accumulatedDepreciationAmort: data.accumulatedDepreciationAmort || 0,
      nonCurrentAssets: data.nonCurrentAssets || 0,
      totalAssets: data.totalAssets || 0,
      accountsPayable: data.accountsPayable || 0,
      deferredIncome: data.deferredIncome || 0,
      totalCurrentLiabilities: data.totalCurrentLiabilities || 0,
      provisions: data.provisions || 0,
      totalLiabilities: data.totalLiabilities || 0,
      retainedEarnings: data.retainedEarnings || 0,
      equity: data.equity || 0,
      cfNetResult: data.cfNetResult || 0,
      cfAccountsReceivable: data.cfAccountsReceivable || 0,
      cfPrepaidExpenses: data.cfPrepaidExpenses || 0,
      cfLoans: data.cfLoans || 0,
      cfIntangibleAssets: data.cfIntangibleAssets || 0,
      cfAccountsPayable: data.cfAccountsPayable || 0,
      cfAccruedExpenses: data.cfAccruedExpenses || 0,
      cfDeferredIncome: data.cfDeferredIncome || 0,
      cfProvisions: data.cfProvisions || 0,
      cfDepreciation: data.cfDepreciation || 0,
      netCashFromOperatingActivities: data.netCashFromOperatingActivities || 0,
      cfAdditionsFixedAssets: data.cfAdditionsFixedAssets || 0,
      netCashFromInvestingActivities: data.netCashFromInvestingActivities || 0,
      cfChangesInFundBalance: data.cfChangesInFundBalance || 0,
      netCashFromFinancingActivities: data.netCashFromFinancingActivities || 0,
      netIncreaseDecreaseCash: data.netIncreaseDecreaseCash || 0,
      cashBeginningOfPeriod: data.cashBeginningOfPeriod || 0,
      cashEndOfPeriod: data.cashEndOfPeriod || 0,
    };

    console.log(`   Total Revenues: ${fullData.totalRevenues.toLocaleString()}`);
    console.log(`   Net Result: ${fullData.netResult.toLocaleString()}`);
    console.log(`   Total Assets: ${fullData.totalAssets.toLocaleString()}`);
    console.log(`   Cash End of Period: ${fullData.cashEndOfPeriod.toLocaleString()}`);

    await prisma.historical_actuals.upsert({
      where: {
        versionId_year: {
          versionId,
          year,
        },
      },
      create: fullData,
      update: fullData,
    });

    console.log(`   ✅ Saved`);
  }

  console.log(`\n✨ Import complete! ${dataByYear.size} years processed.`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
📊 Complete Historical Data Import Tool

Usage:
  npx tsx scripts/import-historical-data-complete.ts <versionId> [filePath]

Examples:
  # Import from CSV file
  npx tsx scripts/import-historical-data-complete.ts abc-123 scripts/historical-data.csv

  # Use default template file
  npx tsx scripts/import-historical-data-complete.ts abc-123

CSV Format:
  Section,Item,2023,2024
  P&L,Tuition French Curriculum,55819340,65503278
  P&L,Other Income,4373210,5015995
  ...
  Balance Sheet,Cash on Hand and in Bank,18557338,20047399
  ...
  Cash Flow,Net Result,360375,1490061
  ...

Available Versions:
`);

    const versions = await prisma.versions.findMany({
      select: {
        id: true,
        name: true,
        mode: true,
      },
      take: 10,
    });

    if (versions.length === 0) {
      console.log('  No versions found. Create a version first.');
    } else {
      versions.forEach((v) => {
        console.log(`  ${v.id} - ${v.name} (${v.mode})`);
      });
    }

    process.exit(0);
  }

  const versionId = args[0];
  const filePath =
    args[1] || path.join(__dirname, 'historical-data-complete-template.csv');

  await importFromCSV(versionId, filePath);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
