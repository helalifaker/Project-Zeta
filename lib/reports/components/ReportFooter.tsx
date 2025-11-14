/**
 * Report Footer Component
 * Footer for all PDF reports
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    paddingTop: 10,
    borderTop: '1pt solid #e0e0e0',
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
  },
});

interface ReportFooterProps {
  pageNumber: number;
  totalPages?: number;
}

export function ReportFooter({ pageNumber, totalPages }: ReportFooterProps): React.ReactElement {
  return (
    <View style={styles.footer}>
      <Text>
        Page {pageNumber}
        {totalPages && ` of ${totalPages}`} | Project Zeta Financial Planning Application
      </Text>
    </View>
  );
}

