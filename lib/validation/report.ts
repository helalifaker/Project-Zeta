/**
 * Report Validation Schemas
 * Zod schemas for report-related inputs
 */

import { z } from 'zod';
import { ReportType, ReportFormat } from '@prisma/client';

export const GenerateReportSchema = z
  .object({
    reportType: z.nativeEnum(ReportType),
    format: z.nativeEnum(ReportFormat),
    includeCharts: z.boolean().default(true),
    includeYearByYear: z.boolean().default(true),
    includeAssumptions: z.boolean().default(false),
    includeAuditTrail: z.boolean().default(false),
    compareWithIds: z.array(z.string().uuid()).min(1).max(3).optional(), // For comparison reports (1-3 IDs)
    metadata: z.record(z.unknown()).optional(),
  })
  .refine(
    (data) => {
      // Comparison reports require at least one comparison version ID
      if (data.reportType === 'COMPARISON') {
        return data.compareWithIds && data.compareWithIds.length >= 1;
      }
      return true;
    },
    {
      message: 'Comparison reports require at least one comparison version ID',
      path: ['compareWithIds'],
    }
  );

export const ListReportsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  versionId: z.string().uuid().optional().or(z.undefined()),
  reportType: z.string().optional().or(z.undefined()), // Allow any string, validate later
  format: z.string().optional().or(z.undefined()), // Allow any string, validate later
});

export type GenerateReportInput = z.infer<typeof GenerateReportSchema>;
export type ListReportsInput = z.infer<typeof ListReportsSchema>;

