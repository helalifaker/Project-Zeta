/**
 * Financial Detail PDF Template
 * 10-15 page detailed report
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { VersionWithRelations } from '@/services/version';
import type { FullProjectionResult } from '@/lib/calculations/financial/projection';
import { ReportHeader } from '../components/ReportHeader';
import { ReportFooter } from '../components/ReportFooter';
import { generateAllCharts } from '../charts/chart-helpers';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chart: {
    width: '100%',
    height: 200,
    marginBottom: 10,
  },
  table: {
    width: '100%',
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #e0e0e0',
    padding: 5,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
  },
});

interface FinancialDetailProps {
  version: VersionWithRelations;
  projection: FullProjectionResult;
  options: {
    includeCharts: boolean;
    includeYearByYear: boolean;
    includeAssumptions: boolean;
    includeAuditTrail: boolean;
  };
}

export function generateFinancialDetailPDF(
  version: VersionWithRelations,
  projection: FullProjectionResult,
  options: FinancialDetailProps['options']
): React.ReactElement {
  const charts = options.includeCharts ? generateAllCharts(projection) : null;

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <ReportHeader version={version} />
        
        <View style={styles.section}>
          <Text style={styles.title}>Financial Detail Report</Text>
          <Text>Comprehensive 30-year financial projection</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text>NPV (Rent): {projection.summary.npvRent.toFixed(0)} SAR</Text>
          <Text>NPV (Cash Flow): {projection.summary.npvCashFlow.toFixed(0)} SAR</Text>
          <Text>Avg EBITDA Margin: {projection.summary.avgEBITDAMargin.toFixed(2)}%</Text>
          <Text>Avg Rent Load: {projection.summary.avgRentLoad.toFixed(2)}%</Text>
        </View>

        <ReportFooter pageNumber={1} />
      </Page>

      {/* Charts Page */}
      {charts && (
        <Page size="A4" style={styles.page}>
          <ReportHeader version={version} />
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Revenue vs Rent</Text>
            <Image src={charts.revenueRent} style={styles.chart} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EBITDA Trend</Text>
            <Image src={charts.ebitdaTrend} style={styles.chart} />
          </View>

          <ReportFooter pageNumber={2} />
        </Page>
      )}

      {/* Additional Charts Page */}
      {charts && (
        <Page size="A4" style={styles.page}>
          <ReportHeader version={version} />
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rent Load %</Text>
            <Image src={charts.rentLoad} style={styles.chart} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Enrollment</Text>
            <Image src={charts.enrollment} style={styles.chart} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cash Flow</Text>
            <Image src={charts.cashFlow} style={styles.chart} />
          </View>

          <ReportFooter pageNumber={3} />
        </Page>
      )}

      {/* Year-by-Year Table */}
      {options.includeYearByYear && (
        <Page size="A4" style={styles.page} orientation="landscape">
          <ReportHeader version={version} />
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Year-by-Year Financial Summary</Text>
            
            <View style={[styles.table, styles.tableHeader]}>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Year</Text>
                <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Revenue</Text>
                <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Rent</Text>
                <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>EBITDA</Text>
                <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Cash Flow</Text>
                <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Rent Load %</Text>
              </View>
            </View>

            {projection.years.slice(0, 20).map((year) => (
              <View key={year.year} style={styles.tableRow}>
                <Text style={styles.tableCell}>{year.year}</Text>
                <Text style={styles.tableCell}>{year.revenue.toFixed(0)}</Text>
                <Text style={styles.tableCell}>{year.rent.toFixed(0)}</Text>
                <Text style={styles.tableCell}>{year.ebitda.toFixed(0)}</Text>
                <Text style={styles.tableCell}>{year.cashFlow.toFixed(0)}</Text>
                <Text style={styles.tableCell}>{year.rentLoad.toFixed(2)}%</Text>
              </View>
            ))}
          </View>

          <ReportFooter pageNumber={charts ? 4 : 2} />
        </Page>
      )}
    </Document>
  );
}

