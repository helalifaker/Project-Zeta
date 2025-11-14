/**
 * Audit Log Viewer Component
 * Table view of audit logs with filters and pagination
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettingsStore } from '@/stores/settings-store';
import { Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export function AuditLogViewer() {
  const {
    auditLogs,
    auditLogsTotal,
    auditLogsPage,
    auditLogsLimit,
    auditLogsLoading,
    auditLogsError,
    auditLogsFilters,
    fetchAuditLogs,
  } = useSettingsStore();

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [actionFilter, setActionFilter] = useState(auditLogsFilters.action || '');
  const [entityTypeFilter, setEntityTypeFilter] = useState(auditLogsFilters.entityType || '');
  const [startDate, setStartDate] = useState(auditLogsFilters.startDate || '');
  const [endDate, setEndDate] = useState(auditLogsFilters.endDate || '');

  // Load audit logs on mount
  useEffect(() => {
    fetchAuditLogs({ page: 1, limit: auditLogsLimit });
  }, [fetchAuditLogs, auditLogsLimit]);

  const handleApplyFilters = () => {
    const filters: {
      action?: string;
      entityType?: string;
      startDate?: string;
      endDate?: string;
      page: number;
      limit: number;
    } = {
      page: 1,
      limit: auditLogsLimit,
    };
    if (actionFilter) filters.action = actionFilter;
    if (entityTypeFilter) filters.entityType = entityTypeFilter;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    fetchAuditLogs(filters);
  };

  const toggleRow = (logId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedRows(newExpanded);
  };

  const formatMetadata = (metadata: unknown): string => {
    if (!metadata) return 'No details';
    try {
      return JSON.stringify(metadata, null, 2);
    } catch {
      return String(metadata);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>
              View all system actions and changes. Total: {auditLogsTotal} logs
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => fetchAuditLogs({ page: auditLogsPage, limit: auditLogsLimit })}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <Input
              placeholder="Action filter..."
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            />
          </div>
          <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Entity Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Entity Types</SelectItem>
              <SelectItem value="VERSION">Version</SelectItem>
              <SelectItem value="CURRICULUM">Curriculum</SelectItem>
              <SelectItem value="RENT">Rent</SelectItem>
              <SelectItem value="CAPEX">Capex</SelectItem>
              <SelectItem value="OPEX">Opex</SelectItem>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="SETTING">Setting</SelectItem>
              <SelectItem value="REPORT">Report</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            placeholder="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <div className="flex gap-2">
            <Input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Button onClick={handleApplyFilters} variant="outline">
              Apply
            </Button>
          </div>
        </div>

        {auditLogsError && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm mb-4">
            {auditLogsError}
          </div>
        )}

        {/* Audit Logs Table */}
        {auditLogsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Entity ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  auditLogs.map((log) => (
                    <>
                      <TableRow key={log.id} className="cursor-pointer" onClick={() => toggleRow(log.id)}>
                        <TableCell>
                          {expandedRows.has(log.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </TableCell>
                        <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                          {log.userName || log.userEmail || 'Unknown'}
                        </TableCell>
                        <TableCell className="font-medium">{log.action}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded bg-muted text-xs">{log.entityType}</span>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.entityId.substring(0, 8)}...</TableCell>
                      </TableRow>
                      {expandedRows.has(log.id) && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/50">
                            <div className="p-4 space-y-2">
                              <div>
                                <strong>Metadata:</strong>
                                <pre className="mt-2 p-2 bg-background rounded text-xs overflow-auto max-h-48">
                                  {formatMetadata(log.metadata)}
                                </pre>
                              </div>
                              {log.ipAddress && (
                                <div className="text-xs text-muted-foreground">
                                  <strong>IP:</strong> {log.ipAddress}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {auditLogsTotal > auditLogsLimit && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((auditLogsPage - 1) * auditLogsLimit) + 1} to {Math.min(auditLogsPage * auditLogsLimit, auditLogsTotal)} of {auditLogsTotal} logs
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAuditLogs({ ...auditLogsFilters, page: auditLogsPage - 1, limit: auditLogsLimit })}
                disabled={auditLogsPage === 1 || auditLogsLoading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAuditLogs({ ...auditLogsFilters, page: auditLogsPage + 1, limit: auditLogsLimit })}
                disabled={auditLogsPage * auditLogsLimit >= auditLogsTotal || auditLogsLoading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

