/**
 * Staffing Parameters Component
 * Inputs for staffing parameters (base cost, CPI frequency)
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSimulationStore } from '@/stores/simulation-store';
import Decimal from 'decimal.js';

interface StaffingParametersProps {
  hasChanges: boolean;
}

export function StaffingParameters({ hasChanges }: StaffingParametersProps) {
  const { parameters, updateStaffingParameter } = useSimulationStore();

  if (!parameters) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Select a base version to edit staffing parameters
        </CardContent>
      </Card>
    );
  }

  const staffing = parameters.staffing;

  return (
    <Card className={hasChanges ? 'border-yellow-400' : ''}>
      <CardHeader>
        <CardTitle>Staffing Parameters</CardTitle>
        <CardDescription>Configure base staff cost and CPI frequency</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Base Staff Cost (SAR)</Label>
          <Input
            type="number"
            min={0}
            step={100000}
            value={
              staffing.baseStaffCost instanceof Decimal
                ? staffing.baseStaffCost.toFixed(0)
                : staffing.baseStaffCost
            }
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              updateStaffingParameter('baseStaffCost', new Decimal(value));
            }}
            className="font-mono"
          />
        </div>

        <div className="space-y-2">
          <Label>CPI Frequency</Label>
          <Select
            value={String(staffing.cpiFrequency)}
            onValueChange={(value) => {
              updateStaffingParameter('cpiFrequency', parseInt(value) as 1 | 2 | 3);
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
      </CardContent>
    </Card>
  );
}

