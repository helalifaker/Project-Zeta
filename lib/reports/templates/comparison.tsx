/**
 * Comparison PDF Template
 * Compare multiple versions
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { VersionWithRelations } from '@/services/version';
import type { FullProjectionResult } from '@/lib/calculations/financial/projection';
import { ReportHeader } from '../components/ReportHeader';
import { ReportFooter } from '../components/ReportFooter';
import { generateRevenueRentChart, generateEBITDATrendChart, generateRentLoadChart } from '../charts/chart-helpers';

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
});

interface ComparisonProps {
  baseVersion: VersionWithRelations;
  baseProjection: FullProjectionResult;
  compareVersions: VersionWithRelations[];
  compareProjections: FullProjectionResult[];
  options: {
    includeCharts: boolean;
    includeYearByYear: boolean;
    includeAssumptions: boolean;
    includeAuditTrail: boolean;
  };
}

export function generateComparisonPDF(
  baseVersion: VersionWithRelations,
  baseProjection: FullProjectionResult,
  compareVersions: VersionWithRelations[],
  compareProjections: FullProjectionResult[],
  options: ComparisonProps['options']
): React.ReactElement {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ReportHeader version={baseVersion} />
        
        <View style={styles.section}>
          <Text style={styles.title}>Comparison Report</Text>
          <Text>Comparing {compareVersions.length + 1} versions</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Base Version: {baseVersion.name}</Text>
          <Text>NPV (Rent): {baseProjection.summary.npvRent.toFixed(0)} SAR</Text>
          <Text>NPV (Cash Flow): {baseProjection.summary.npvCashFlow.toFixed(0)} SAR</Text>
        </View>

        {compareVersions.map((version, index) => {
          const projection = compareProjections[index];
          if (!projection) return null;
          
          return (
            <View key={version.id} style={styles.section}>
              <Text style={styles.sectionTitle}>Version: {version.name}</Text>
              <Text>NPV (Rent): {projection.summary.npvRent.toFixed(0)} SAR</Text>
              <Text>NPV (Cash Flow): {projection.summary.npvCashFlow.toFixed(0)} SAR</Text>
            </View>
          );
        })}

        {/* Charts */}
        {options.includeCharts && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Revenue vs Rent (Base)</Text>
              <Image
                src={generateRevenueRentChart(baseProjection)}
                style={styles.chart}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>EBITDA Trend (Base)</Text>
              <Image
                src={generateEBITDATrendChart(baseProjection)}
                style={styles.chart}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rent Load % (Base)</Text>
              <Image
                src={generateRentLoadChart(baseProjection)}
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

