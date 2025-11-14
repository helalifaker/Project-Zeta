/**
 * Reports Client Component
 * Main component for reports page with list and generation
 */

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ReportList } from './ReportList';
import { GenerateReportForm } from './GenerateReportForm';
import { useReportsStore, type ReportListItem } from '@/stores/reports-store';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';

interface ReportsProps {
  initialReports: ReportListItem[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  versions: Array<{ id: string; name: string }>;
  userRole: string;
}

export function Reports({ initialReports, initialPagination, versions, userRole }: ReportsProps) {
  const { setReports, setPagination } = useReportsStore();
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

  // Initialize store with server data
  useEffect(() => {
    setReports(initialReports);
    setPagination(initialPagination);
  }, [initialReports, initialPagination, setReports, setPagination]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Generate and download financial reports
          </p>
        </div>
        <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Generate New Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Generate New Report</DialogTitle>
              <DialogDescription>
                Select version and report type to generate a new report
              </DialogDescription>
            </DialogHeader>
            <GenerateReportForm
              versions={versions}
              userRole={userRole}
              onSuccess={() => {
                setGenerateDialogOpen(false);
                // Refresh reports list
                window.location.reload();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Reports List */}
      <ReportList versions={versions} />
    </div>
  );
}

