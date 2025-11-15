/**
 * Version Detail Client Component
 * Client component for displaying version detail with tabs
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VersionStatusBadge } from './VersionStatusBadge';
import { VersionActionMenu } from './VersionActionMenu';
import type { VersionWithRelations } from '@/services/version';
import { ArrowLeft } from 'lucide-react';

interface VersionDetailProps {
  version: VersionWithRelations;
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  // Use consistent format to avoid hydration mismatches
  // Format: DD/MM/YYYY (consistent across server and client)
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function VersionDetail({ version }: VersionDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/versions')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Versions
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{version.name}</h1>
            <VersionStatusBadge status={version.status} />
          </div>
          {version.description && (
            <p className="text-muted-foreground">{version.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <VersionActionMenu version={version} />
        </div>
      </div>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Version Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">Mode:</span>{' '}
              <span>{version.mode === 'RELOCATION_2028' ? 'Relocation 2028' : 'Historical Baseline'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>{' '}
              <span>{formatDate(version.createdAt)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Created By:</span>{' '}
              <span>{version.creator.name || version.creator.email}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Last Updated:</span>{' '}
              <span>{formatDate(version.updatedAt)}</span>
            </div>
          </div>
          {version.basedOn && (
            <div>
              <span className="text-muted-foreground">Based On:</span>{' '}
              <span>{version.basedOn.name}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="rent">Rent</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>Version summary and key metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Curriculum Plans</div>
                  <div className="text-2xl font-bold">{version.curriculumPlans.length}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Rent Plan</div>
                  <div className="text-2xl font-bold">{version.rentPlan ? 'Yes' : 'No'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Capex Items</div>
                  <div className="text-2xl font-bold">{version.capexItems.length}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Opex Accounts</div>
                  <div className="text-2xl font-bold">{version.opexSubAccounts.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="curriculum" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Curriculum Plans</CardTitle>
              <CardDescription>FR and IB curriculum configurations</CardDescription>
            </CardHeader>
            <CardContent>
              {version.curriculumPlans.length === 0 ? (
                <p className="text-muted-foreground">No curriculum plans configured</p>
              ) : (
                <div className="space-y-4">
                  {version.curriculumPlans.map((plan) => (
                    <div key={plan.id} className="border rounded-lg p-4">
                      <div className="font-semibold">{plan.curriculumType}</div>
                      <div className="text-sm text-muted-foreground mt-2 space-y-1">
                        <div>Capacity: {plan.capacity} students</div>
                        <div>Base Tuition: {plan.tuitionBase.toString()} SAR</div>
                        <div>CPI Frequency: Every {plan.cpiFrequency} year(s)</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rent Plan</CardTitle>
              <CardDescription>Rent model configuration</CardDescription>
            </CardHeader>
            <CardContent>
              {version.rentPlan ? (
                <div className="space-y-2">
                  <div>
                    <span className="text-muted-foreground">Model:</span>{' '}
                    <span>{version.rentPlan.rentModel}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Parameters:</span>
                    <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto">
                      {JSON.stringify(version.rentPlan.parameters, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No rent plan configured</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financials</CardTitle>
              <CardDescription>Financial projections and analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Financial calculations will be displayed here. This requires the financial
                calculation engine to be integrated.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

