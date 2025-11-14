/**
 * System Health Dashboard Component
 * Display system health metrics and status
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/stores/settings-store';
import { Loader2, RefreshCw, CheckCircle2, AlertCircle, XCircle, Database, Users, FileText, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function SystemHealth() {
  const {
    systemHealth,
    systemHealthLoading,
    systemHealthError,
    fetchSystemHealth,
  } = useSettingsStore();

  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load system health on mount
  useEffect(() => {
    fetchSystemHealth();
  }, [fetchSystemHealth]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchSystemHealth();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchSystemHealth]);

  const getStatusIcon = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-500">Healthy</Badge>;
      case 'degraded':
        return <Badge variant="default" className="bg-yellow-500">Degraded</Badge>;
      case 'down':
        return <Badge variant="destructive">Down</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Health</CardTitle>
              <CardDescription>
                Monitor system status, database health, and user activity
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
              </Button>
              <Button
                variant="outline"
                onClick={() => fetchSystemHealth()}
                disabled={systemHealthLoading}
              >
                {systemHealthLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {systemHealthError && (
        <Card>
          <CardContent className="py-4">
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {systemHealthError}
            </div>
          </CardContent>
        </Card>
      )}

      {systemHealthLoading && !systemHealth ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : systemHealth ? (
        <>
          {/* Database Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  <CardTitle>Database</CardTitle>
                </div>
                {getStatusBadge(systemHealth.database.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(systemHealth.database.status)}
                    <span className="font-medium capitalize">{systemHealth.database.status}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Response Time</div>
                  <div className="font-medium mt-1">{systemHealth.database.responseTime}ms</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Last Check</div>
                  <div className="font-medium mt-1">
                    {new Date(systemHealth.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <CardTitle>Users</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total Users</div>
                  <div className="text-2xl font-bold mt-1">{systemHealth.users.total}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Active (24h)</div>
                  <div className="text-2xl font-bold mt-1">{systemHealth.users.active24h}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Active (7d)</div>
                  <div className="text-2xl font-bold mt-1">{systemHealth.users.active7d}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Versions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle>Versions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total</div>
                  <div className="text-xl font-bold mt-1">{systemHealth.versions.total}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Draft</div>
                  <div className="text-xl font-bold mt-1">{systemHealth.versions.draft}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Ready</div>
                  <div className="text-xl font-bold mt-1">{systemHealth.versions.ready}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Approved</div>
                  <div className="text-xl font-bold mt-1">{systemHealth.versions.approved}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Locked</div>
                  <div className="text-xl font-bold mt-1">{systemHealth.versions.locked}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                <CardTitle>Reports</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total Reports</div>
                  <div className="text-2xl font-bold mt-1">{systemHealth.reports.total}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Expired</div>
                  <div className="text-2xl font-bold mt-1">{systemHealth.reports.expired}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

