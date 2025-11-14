/**
 * Report Header Component
 * Header for all PDF reports
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { VersionWithRelations } from '@/services/version';

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: '1pt solid #e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
});

interface ReportHeaderProps {
  version: VersionWithRelations;
}

export function ReportHeader({ version }: ReportHeaderProps): React.ReactElement {
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.header}>
      <Text style={styles.title}>Project Zeta - Financial Planning Report</Text>
      <Text style={styles.subtitle}>Version: {version.name}</Text>
      <Text style={styles.subtitle}>Generated: {generatedDate}</Text>
    </View>
  );
}

