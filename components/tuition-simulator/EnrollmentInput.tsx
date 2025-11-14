/**
 * Enrollment Input Component
 * Year-by-year enrollment input with growth rate helper
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface EnrollmentInputProps {
  curriculum: 'FR' | 'IB';
  capacity: number;
  enrollments: Array<{ year: number; students: number }>;
  onEnrollmentChange: (year: number, students: number) => void;
  startYear?: number;
  endYear?: number;
  suggestedStartPercentage?: number; // Percentage of capacity for start year
  suggestedGrowthRate?: number; // Suggested growth rate per year
}

export function EnrollmentInput({
  curriculum,
  capacity,
  enrollments,
  onEnrollmentChange,
  suggestedStartPercentage,
  suggestedGrowthRate,
}: EnrollmentInputProps) {
  const [growthRate, setGrowthRate] = useState(suggestedGrowthRate || 5);

  // Create enrollment map for quick lookup
  const enrollmentMap = new Map(enrollments.map((e) => [e.year, e.students]));

  // Get enrollment for a specific year
  const getEnrollment = (year: number): number => {
    return enrollmentMap.get(year) || 0;
  };

  // Apply growth rate to years 2028-2032 (ramp-up period)
  const handleApplyGrowthRate = () => {
    const rampUpStartYear = 2028;
    const rampUpEndYear = 2032;
    
    // Get starting enrollment
    const startEnrollment = getEnrollment(rampUpStartYear) || Math.round(capacity * (suggestedStartPercentage || 0.75));
    
    for (let year = rampUpStartYear; year <= rampUpEndYear; year++) {
      const yearsFromStart = year - rampUpStartYear;
      const students = Math.min(
        Math.round(startEnrollment * Math.pow(1 + growthRate / 100, yearsFromStart)),
        capacity
      );
      onEnrollmentChange(year, students);
    }
  };

  // Focus on ramp-up period (2028-2032) for display
  const rampUpYears = Array.from({ length: 5 }, (_, i) => 2028 + i);
  const displayYears = rampUpYears;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {curriculum === 'FR' ? 'French (FR)' : 'IB'} Enrollment
        </CardTitle>
        <CardDescription>
          Capacity: {capacity} students | Utilization shown for ramp-up period (2028-2032)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Growth Rate Slider */}
        <div className="space-y-2">
          <Label>Growth Rate: {growthRate > 0 ? '+' : ''}{growthRate.toFixed(1)}% per year</Label>
          <Slider
            value={growthRate}
            onValueChange={setGrowthRate}
            min={-10}
            max={50}
            step={0.5}
          />
          <Button
            onClick={handleApplyGrowthRate}
            size="sm"
            variant="outline"
            className="w-full"
          >
            Apply Growth Rate to Ramp-Up Period (2028-2032)
          </Button>
        </div>

        {/* Year-by-Year Inputs Table */}
        <div className="space-y-2">
          <Label>Enrollment by Year (Ramp-Up Period)</Label>
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
                {displayYears.map((year) => {
                  const students = getEnrollment(year);
                  const utilization = capacity > 0 ? (students / capacity) * 100 : 0;
                  
                  return (
                    <TableRow key={year}>
                      <TableCell className="font-medium">{year}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          max={capacity}
                          value={students || ''}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            onEnrollmentChange(year, Math.min(value, capacity));
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

        {/* Quick Set Suggestion */}
        {suggestedStartPercentage && (
          <div className="text-xs text-muted-foreground">
            Suggestion: Start with {Math.round(capacity * suggestedStartPercentage)} students (
            {(suggestedStartPercentage * 100).toFixed(0)}% of capacity) for {curriculum === 'FR' ? 'established school' : 'new program'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

