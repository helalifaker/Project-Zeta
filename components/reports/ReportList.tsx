/**
 * Report List Component
 * Displays list of reports with filters and pagination
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Trash2, FileText, FileSpreadsheet } from 'lucide-react';
import { useReportsStore, type ReportListItem } from '@/stores/reports-store';
import { ReportPreview } from './ReportPreview';

interface ReportListProps {
  versions: Array<{ id: string; name: string }>;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

export function ReportList({ versions }: ReportListProps) {
  const { reports, filters, pagination, setFilters, setPagination, loading } = useReportsStore();
  const [selectedReport, setSelectedReport] = useState<ReportListItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Fetch reports when filters or pagination change
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.set('page', String(pagination.page));
        queryParams.set('limit', String(pagination.limit));
        
        if (filters.versionId) queryParams.set('versionId', filters.versionId);
        if (filters.reportType) queryParams.set('reportType', filters.reportType);
        if (filters.format) queryParams.set('format', filters.format);

        const response = await fetch(`/api/reports?${queryParams.toString()}`);
        const data = await response.json();

        if (data.success) {
          useReportsStore.getState().setReports(data.data.reports);
          useReportsStore.getState().setPagination(data.data.pagination);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
        useReportsStore.getState().setError('Failed to fetch reports');
      }
    };

    fetchReports();
  }, [filters, pagination.page, pagination.limit]);

  const handleDownload = async (report: ReportListItem) => {
    try {
      const response = await fetch(`/api/reports/${report.id}/download`);
      if (!response.ok) {
        alert('Failed to download report');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report');
    }
  };

  const handleDelete = async (report: ReportListItem) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      const response = await fetch(`/api/reports/${report.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        alert('Failed to delete report');
        return;
      }

      // Refresh reports list
      window.location.reload();
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Version</label>
              <Select
                value={filters.versionId || ''}
                onValueChange={(value) => {
                  if (value) {
                    setFilters({ versionId: value });
                  } else {
                    const { versionId: _, ...rest } = filters;
                    setFilters(rest);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All versions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All versions</SelectItem>
                  {versions.map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      {version.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select
                value={filters.reportType || ''}
                onValueChange={(value) => {
                  if (value) {
                    setFilters({ reportType: value });
                  } else {
                    const { reportType: _, ...rest } = filters;
                    setFilters(rest);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="EXECUTIVE_SUMMARY">Executive Summary</SelectItem>
                  <SelectItem value="FINANCIAL_DETAIL">Financial Detail</SelectItem>
                  <SelectItem value="COMPARISON">Comparison</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <Select
                value={filters.format || ''}
                onValueChange={(value) => {
                  if (value) {
                    setFilters({ format: value });
                  } else {
                    const { format: _, ...rest } = filters;
                    setFilters(rest);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All formats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All formats</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="EXCEL">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>
            {pagination.total} report{pagination.total !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No reports found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Generated</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => {
                    const expired = isExpired(report.expiresAt);
                    return (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {report.format === 'PDF' ? (
                              <FileText className="h-4 w-4 text-red-400" />
                            ) : (
                              <FileSpreadsheet className="h-4 w-4 text-green-400" />
                            )}
                            {report.fileName}
                          </div>
                        </TableCell>
                        <TableCell>{report.version?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {report.reportType.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{report.format}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(report.generatedAt)}</TableCell>
                        <TableCell>{formatFileSize(report.fileSize)}</TableCell>
                        <TableCell>
                          {expired ? (
                            <Badge variant="destructive">Expired</Badge>
                          ) : (
                            <Badge variant="default">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedReport(report);
                                setPreviewOpen(true);
                              }}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownload(report)}
                              disabled={expired}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(report)}
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      {selectedReport && (
        <ReportPreview
          report={selectedReport}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          onDownload={() => handleDownload(selectedReport)}
        />
      )}
    </div>
  );
}

