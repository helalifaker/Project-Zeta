/**
 * Report Storage Service
 * Handles file storage and URL generation for reports
 */

import { writeFile, mkdir, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const REPORTS_DIR = join(process.cwd(), 'public', 'reports');

// Ensure reports directory exists
async function ensureReportsDir(): Promise<void> {
  if (!existsSync(REPORTS_DIR)) {
    await mkdir(REPORTS_DIR, { recursive: true });
  }
}

/**
 * Store report file to disk
 */
export async function storeReport(
  file: Buffer,
  fileName: string
): Promise<{ filePath: string; fileSize: number }> {
  await ensureReportsDir();

  const filePath = join(REPORTS_DIR, fileName);
  await writeFile(filePath, file);

  return {
    filePath: `/reports/${fileName}`,
    fileSize: file.length,
  };
}

/**
 * Generate temporary download URL
 */
export function getReportUrl(reportId: string, _fileName?: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/api/reports/${reportId}/download`;
}

/**
 * Delete report file from disk
 */
export async function deleteReport(filePath: string): Promise<void> {
  // Remove leading slash if present
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  const fullPath = join(process.cwd(), 'public', cleanPath);

  if (existsSync(fullPath)) {
    await unlink(fullPath);
  }
}

/**
 * Read report file from disk
 */
export async function readReportFile(filePath: string): Promise<Buffer> {
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  const fullPath = join(process.cwd(), 'public', cleanPath);

  if (!existsSync(fullPath)) {
    throw new Error(`Report file not found: ${filePath}`);
  }

  return await readFile(fullPath);
}

/**
 * Clean expired reports (background job)
 * Should be called periodically (e.g., daily cron job)
 */
export async function cleanExpiredReports(): Promise<number> {
  // This would typically query the database for expired reports
  // and delete the files. For now, it's a placeholder.
  return 0;
}

