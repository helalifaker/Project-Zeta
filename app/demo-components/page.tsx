/**
 * Component Demo Page
 * Showcase all UI components and charts
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RevenueChart } from '@/components/charts/RevenueChart';

export default function DemoComponentsPage(): JSX.Element {
  const [inputValue, setInputValue] = useState('');

  // Sample data for charts
  const sampleChartData = [
    { year: 2028, revenue: 10000000, rent: 2000000, ebitda: 3000000 },
    { year: 2029, revenue: 11000000, rent: 2200000, ebitda: 3300000 },
    { year: 2030, revenue: 12000000, rent: 2400000, ebitda: 3600000 },
    { year: 2031, revenue: 13000000, rent: 2600000, ebitda: 3900000 },
    { year: 2032, revenue: 14000000, rent: 2800000, ebitda: 4200000 },
  ];

  return (
    <div className="min-h-screen bg-background-primary p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-2">Component Demo</h1>
          <p className="text-text-secondary">Project Zeta UI Components & Charts</p>
        </div>

        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Button variants and sizes</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </CardContent>
        </Card>

        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
            <CardDescription>Form input components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter text..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Input type="number" placeholder="Enter number..." />
            <Input type="email" placeholder="Enter email..." />
            <Input type="password" placeholder="Enter password..." />
            <Input disabled placeholder="Disabled input" />
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardDescription>Status indicators</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Table</CardTitle>
            <CardDescription>Data table component</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>EBITDA</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleChartData.map((row) => (
                  <TableRow key={row.year}>
                    <TableCell>{row.year}</TableCell>
                    <TableCell>{row.revenue.toLocaleString()} SAR</TableCell>
                    <TableCell>{row.rent.toLocaleString()} SAR</TableCell>
                    <TableCell>{row.ebitda.toLocaleString()} SAR</TableCell>
                    <TableCell>
                      <Badge variant={row.ebitda > 0 ? 'default' : 'destructive'}>
                        {row.ebitda > 0 ? 'Positive' : 'Negative'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Charts */}
        <Card>
          <CardHeader>
            <CardTitle>Charts</CardTitle>
            <CardDescription>Revenue, Rent, and EBITDA visualization</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={sampleChartData} showRent showEbitda />
          </CardContent>
        </Card>

        {/* Dialog */}
        <Card>
          <CardHeader>
            <CardTitle>Dialog</CardTitle>
            <CardDescription>Modal dialog component</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dialog Title</DialogTitle>
                  <DialogDescription>
                    This is a dialog component example. It can be used for confirmations, forms, or any modal content.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-text-secondary">Dialog content goes here.</p>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Tooltip */}
        <Card>
          <CardHeader>
            <CardTitle>Tooltip</CardTitle>
            <CardDescription>Hover tooltips</CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <div className="flex gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Hover me</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This is a tooltip</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Another tooltip</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tooltip with more information</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Tabs</CardTitle>
            <CardDescription>Tabbed interface</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="tab1" className="w-full">
              <TabsList>
                <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                <TabsTrigger value="tab3">Tab 3</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1" className="mt-4">
                <p className="text-text-secondary">Content for Tab 1</p>
              </TabsContent>
              <TabsContent value="tab2" className="mt-4">
                <p className="text-text-secondary">Content for Tab 2</p>
              </TabsContent>
              <TabsContent value="tab3" className="mt-4">
                <p className="text-text-secondary">Content for Tab 3</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

