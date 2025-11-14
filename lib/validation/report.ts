/**
 * Report Validation Schemas
 * Zod schemas for report-related inputs
 */

import { z } from 'zod';
import { ReportType, ReportFormat } from '@prisma/client';

export const GenerateReportSchema = z.object({
  reportType: z.nativeEnum(ReportType),
  format: z.nativeEnum(ReportFormat),
  includeCharts: z.boolean().default(true),
  includeYearByYear: z.boolean().default(true),
  includeAssumptions: z.boolean().default(false),
  includeAuditTrail: z.boolean().default(false),
  compareWithIds: z.array(z.string().uuid()).optional(), // For comparison reports
  metadata: z.record(z.unknown()).optional(),
});

export const ListReportsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  versionId: z.string().uuid().optional(),
  reportType: z.nativeEnum(ReportType).optional(),
  format: z.nativeEnum(ReportFormat).optional(),
});

export type GenerateReportInput = z.infer<typeof GenerateReportSchema>;
export type ListReportsInput = z.infer<typeof ListReportsSchema>;

