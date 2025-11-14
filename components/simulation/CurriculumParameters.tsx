/**
 * Curriculum Parameters Component
 * Inputs for curriculum parameters (FR/IB) with tabs
 */

'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSimulationStore, type CurriculumParameters } from '@/stores/simulation-store';
import Decimal from 'decimal.js';

interface CurriculumParametersProps {
  hasChanges: boolean;
}

export function CurriculumParameters({ hasChanges }: CurriculumParametersProps) {
  const { parameters, updateCurriculumParameter } = useSimulationStore();
  const [activeTab, setActiveTab] = useState<'fr' | 'ib'>('fr');

  if (!parameters) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Select a base version to edit curriculum parameters
        </CardContent>
      </Card>
    );
  }

  const currentCurriculum = parameters.curriculum[activeTab];

  return (
    <Card className={hasChanges ? 'border-yellow-400' : ''}>
      <CardHeader>
        <CardTitle>Curriculum Parameters</CardTitle>
        <CardDescription>Edit capacity, tuition, CPI frequency, and enrollment per curriculum</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'fr' | 'ib')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fr">French (FR)</TabsTrigger>
            <TabsTrigger value="ib">IB</TabsTrigger>
          </TabsList>

          <TabsContent value="fr" className="space-y-4 mt-4">
            <CurriculumForm
              curriculum={currentCurriculum}
              curriculumKey="fr"
              onUpdate={updateCurriculumParameter}
            />
          </TabsContent>

          <TabsContent value="ib" className="space-y-4 mt-4">
            <CurriculumForm
              curriculum={parameters.curriculum.ib}
              curriculumKey="ib"
              onUpdate={updateCurriculumParameter}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface CurriculumFormProps {
  curriculum: CurriculumParameters;
  curriculumKey: 'fr' | 'ib';
  onUpdate: (curriculum: 'fr' | 'ib', field: keyof CurriculumParameters, value: unknown) => void;
}

function CurriculumForm({ curriculum, curriculumKey, onUpdate }: CurriculumFormProps) {
  // Focus on ramp-up period (2028-2032) for enrollment editing
  const rampUpYears = Array.from({ length: 5 }, (_, i) => 2028 + i);
  const enrollmentMap = new Map(curriculum.studentsProjection.map((sp) => [sp.year, sp.students]));

  const getEnrollment = (year: number): number => {
    return enrollmentMap.get(year) || 0;
  };

  const setEnrollment = (year: number, students: number) => {
    const existingProjection = curriculum.studentsProjection;
    const index = existingProjection.findIndex((sp) => sp.year === year);

    if (index >= 0) {
      const updated = [...existingProjection];
      updated[index] = { year, students };
      onUpdate(curriculumKey, 'studentsProjection', updated);
    } else {
      const updated = [...existingProjection, { year, students }].sort((a, b) => a.year - b.year);
      onUpdate(curriculumKey, 'studentsProjection', updated);
    }
  };

  return (
    <div className="space-y-4">
      {/* Capacity */}
      <div className="space-y-2">
        <Label>Capacity (students)</Label>
        <Input
          type="number"
          min={0}
          max={5000}
          value={curriculum.capacity}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 0;
            onUpdate(curriculumKey, 'capacity', value);
          }}
        />
      </div>

      {/* Base Tuition */}
      <div className="space-y-2">
        <Label>Base Tuition (SAR)</Label>
        <Input
          type="number"
          min={0}
          step={1000}
          value={
            curriculum.tuitionBase instanceof Decimal
              ? curriculum.tuitionBase.toFixed(0)
              : curriculum.tuitionBase
          }
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            onUpdate(curriculumKey, 'tuitionBase', new Decimal(value));
          }}
          className="font-mono"
        />
      </div>

      {/* CPI Frequency */}
      <div className="space-y-2">
        <Label>CPI Frequency</Label>
        <Select
          value={String(curriculum.cpiFrequency)}
          onValueChange={(value) => {
            onUpdate(curriculumKey, 'cpiFrequency', parseInt(value) as 1 | 2 | 3);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Every 1 year</SelectItem>
            <SelectItem value="2">Every 2 years</SelectItem>
            <SelectItem value="3">Every 3 years</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Enrollment (Ramp-Up Period) */}
      <div className="space-y-2">
        <Label>Enrollment Projection (Ramp-Up Period: 2028-2032)</Label>
        <div className="border rounded-md max-h-64 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Year</TableHead>
                <TableHead>Students</TableHead>
                <TableHead className="w-32">Utilization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rampUpYears.map((year) => {
                const students = getEnrollment(year);
                const utilization =
                  curriculum.capacity > 0 ? (students / curriculum.capacity) * 100 : 0;

                return (
                  <TableRow key={year}>
                    <TableCell className="font-medium">{year}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={curriculum.capacity}
                        value={students || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setEnrollment(year, Math.min(value, curriculum.capacity));
                        }}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell className="text-sm">
                      {utilization.toFixed(1)}%
                      {utilization >= 100 && (
                        <span className="ml-1 text-red-400">⚠️</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

