/**
 * Reports Client Component
 * Main component for reports page with list and generation
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { ReportList } from './ReportList';
import { GenerateReportForm } from './GenerateReportForm';
import { useReportsStore, type ReportListItem } from '@/stores/reports-store';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSession } from 'next-auth/react';

interface ReportsProps {
  initialReports?: ReportListItem[];
  initialPagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  versions?: Array<{ id: string; name: string }>;
  userRole?: string;
}

export function Reports({ initialReports, initialPagination, versions: initialVersions, userRole: initialUserRole }: ReportsProps) {
  const { setReports, setPagination } = useReportsStore();
  const { data: session } = useSession();
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [versions, setVersions] = useState<Array<{ id: string; name: string }>>(initialVersions || []);
  const [versionsLoading, setVersionsLoading] = useState(!initialVersions);
  const [userRole, setUserRole] = useState(initialUserRole || 'VIEWER');
  
  // Track if versions have been fetched to prevent duplicate fetches (React Strict Mode)
  const versionsFetchedRef = useRef(false);

  // Fetch versions on client side if not provided by server
  useEffect(() => {
    if (initialVersions) {
      setVersions(initialVersions);
      setVersionsLoading(false);
      return;
    }

    // Prevent duplicate fetches (React Strict Mode runs effects twice in development)
    if (versionsFetchedRef.current) {
      return;
    }
    versionsFetchedRef.current = true;

    console.log('📡 Fetching versions list (Reports - lightweight)...');
    const fetchStart = performance.now();

    fetch('/api/versions?page=1&limit=100&lightweight=true')
      .then(response => response.json())
      .then(data => {
        const fetchTime = performance.now() - fetchStart;
        console.log(`✅ Versions list loaded in ${fetchTime.toFixed(0)}ms`);
        
        if (data.success && data.data?.versions) {
          const versionsList = data.data.versions.map((v: any) => ({
            id: v.id,
            name: v.name,
          }));
          setVersions(versionsList);
        }
        setVersionsLoading(false);
      })
      .catch(error => {
        console.error('❌ Failed to fetch versions:', error);
        setVersionsLoading(false);
      });
  }, [initialVersions]);

  // Get user role from session if not provided
  useEffect(() => {
    if (initialUserRole) {
      setUserRole(initialUserRole);
    } else if (session?.user?.role) {
      setUserRole(session.user.role);
    }
  }, [session, initialUserRole]);

  // Initialize store with server data (if provided)
  useEffect(() => {
    if (initialReports && initialPagination) {
      setReports(initialReports);
      setPagination(initialPagination);
    }
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
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate New Report</DialogTitle>
              <DialogDescription>
                Select version and report type to generate a new report
              </DialogDescription>
            </DialogHeader>
            {versions.length > 0 ? (
              <GenerateReportForm
                versions={versions}
                userRole={userRole}
                onSuccess={() => {
                  setGenerateDialogOpen(false);
                  // Refresh reports list
                  window.location.reload();
                }}
              />
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                Loading versions...
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Reports List */}
      <ReportList versions={versions} />
    </div>
  );
}

