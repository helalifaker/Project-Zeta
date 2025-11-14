/**
 * Executive Summary PDF Template
 * 2-3 page summary report
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { VersionWithRelations } from '@/services/version';
import type { FullProjectionResult } from '@/lib/calculations/financial/projection';
import { ReportHeader } from '../components/ReportHeader';
import { ReportFooter } from '../components/ReportFooter';
import { generateRevenueRentChart, generateEBITDATrendChart } from '../charts/chart-helpers';

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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48%',
    padding: 10,
    border: '1pt solid #e0e0e0',
    marginBottom: 10,
  },
  kpiLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 5,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chart: {
    width: '100%',
    height: 200,
    marginBottom: 10,
  },
});

interface ExecutiveSummaryProps {
  version: VersionWithRelations;
  projection: FullProjectionResult;
  options: {
    includeCharts: boolean;
    includeYearByYear: boolean;
    includeAssumptions: boolean;
    includeAuditTrail: boolean;
  };
}

export function generateExecutiveSummaryPDF(
  version: VersionWithRelations,
  projection: FullProjectionResult,
  options: ExecutiveSummaryProps['options']
): React.ReactElement {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ReportHeader version={version} />
        
        <View style={styles.section}>
          <Text style={styles.title}>Executive Summary</Text>
          <Text>Report generated for {version.name}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>NPV (Rent)</Text>
              <Text style={styles.kpiValue}>
                {projection.summary.npvRent.toFixed(0)} SAR
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>NPV (Cash Flow)</Text>
              <Text style={styles.kpiValue}>
                {projection.summary.npvCashFlow.toFixed(0)} SAR
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Avg EBITDA Margin</Text>
              <Text style={styles.kpiValue}>
                {projection.summary.avgEBITDAMargin.toFixed(2)}%
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Avg Rent Load</Text>
              <Text style={styles.kpiValue}>
                {projection.summary.avgRentLoad.toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rent Model Summary</Text>
          <Text>Model: {version.rentPlan?.rentModel || 'N/A'}</Text>
          {/* Add more rent model details */}
        </View>

        {/* Charts */}
        {options.includeCharts && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Revenue vs Rent</Text>
              <Image
                src={generateRevenueRentChart(projection)}
                style={styles.chart}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>EBITDA Trend</Text>
              <Image
                src={generateEBITDATrendChart(projection)}
                style={styles.chart}
              />
            </View>
          </>
        )}

        <ReportFooter pageNumber={1} />
      </Page>
    </Document>
  );
}

