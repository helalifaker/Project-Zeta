/**
 * Rent Parameters Component
 * Rent model selector and dynamic inputs based on selected model
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSimulationStore, type RentParameters } from '@/stores/simulation-store';

interface RentParametersProps {
  hasChanges: boolean;
}

export function RentParameters({ hasChanges }: RentParametersProps) {
  const { parameters, updateRentParameter } = useSimulationStore();

  if (!parameters) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Select a base version to edit rent parameters
        </CardContent>
      </Card>
    );
  }

  const rentParams = parameters.rent;
  const modelParams = rentParams.parameters as Record<string, unknown>;

  const handleModelChange = (newModel: 'FIXED_ESCALATION' | 'REVENUE_SHARE' | 'PARTNER_MODEL') => {
    // Initialize default parameters for new model
    let newParams: Record<string, unknown> = {};

    if (newModel === 'FIXED_ESCALATION') {
      newParams = {
        baseRent: modelParams.baseRent || 1000000,
        escalationRate: modelParams.escalationRate || 0.04,
      };
    } else if (newModel === 'REVENUE_SHARE') {
      newParams = {
        revenueSharePercent: modelParams.revenueSharePercent || 0.15,
        minRent: modelParams.minRent || 500000,
      };
    } else if (newModel === 'PARTNER_MODEL') {
      newParams = {
        landSize: modelParams.landSize || 10000,
        buaSize: modelParams.buaSize || 8000,
        yieldBase: modelParams.yieldBase || 0.045,
      };
    }

    updateRentParameter('rentModel', newModel);
    updateRentParameter('parameters', newParams);
  };

  return (
    <Card className={hasChanges ? 'border-yellow-400' : ''}>
      <CardHeader>
        <CardTitle>Rent Parameters</CardTitle>
        <CardDescription>Select rent model and configure parameters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rent Model Selector */}
        <div className="space-y-2">
          <Label>Rent Model</Label>
          <Select
            value={rentParams.rentModel}
            onValueChange={(value) =>
              handleModelChange(value as 'FIXED_ESCALATION' | 'REVENUE_SHARE' | 'PARTNER_MODEL')
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FIXED_ESCALATION">Fixed Escalation</SelectItem>
              <SelectItem value="REVENUE_SHARE">Revenue Share</SelectItem>
              <SelectItem value="PARTNER_MODEL">Partner Model</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Model-Specific Parameters */}
        {rentParams.rentModel === 'FIXED_ESCALATION' && (
          <FixedEscalationParams
            parameters={modelParams}
            onUpdate={(updates) =>
              updateRentParameter('parameters', { ...modelParams, ...updates })
            }
          />
        )}

        {rentParams.rentModel === 'REVENUE_SHARE' && (
          <RevenueShareParams
            parameters={modelParams}
            onUpdate={(updates) =>
              updateRentParameter('parameters', { ...modelParams, ...updates })
            }
          />
        )}

        {rentParams.rentModel === 'PARTNER_MODEL' && (
          <PartnerModelParams
            parameters={modelParams}
            onUpdate={(updates) =>
              updateRentParameter('parameters', { ...modelParams, ...updates })
            }
          />
        )}
      </CardContent>
    </Card>
  );
}

interface ModelParamsProps {
  parameters: Record<string, unknown>;
  onUpdate: (updates: Record<string, unknown>) => void;
}

function FixedEscalationParams({ parameters, onUpdate }: ModelParamsProps) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="space-y-2">
        <Label>Base Rent (SAR)</Label>
        <Input
          type="number"
          min={0}
          step={10000}
          value={String(parameters.baseRent || 1000000)}
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            onUpdate({ baseRent: value });
          }}
          className="font-mono"
        />
      </div>
      <div className="space-y-2">
        <Label>Escalation Rate (%)</Label>
        <Input
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={String(((parameters.escalationRate as number) || 0.04) * 100)}
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            onUpdate({ escalationRate: value / 100 });
          }}
        />
      </div>
    </div>
  );
}

function RevenueShareParams({ parameters, onUpdate }: ModelParamsProps) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="space-y-2">
        <Label>Revenue Share Percentage (%)</Label>
        <Input
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={String(((parameters.revenueSharePercent as number) || 0.15) * 100)}
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            onUpdate({ revenueSharePercent: value / 100 });
          }}
        />
      </div>
      <div className="space-y-2">
        <Label>Minimum Rent (SAR)</Label>
        <Input
          type="number"
          min={0}
          step={10000}
          value={String(parameters.minRent || 500000)}
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            onUpdate({ minRent: value });
          }}
          className="font-mono"
        />
      </div>
    </div>
  );
}

function PartnerModelParams({ parameters, onUpdate }: ModelParamsProps) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="space-y-2">
        <Label>Land Size (m²)</Label>
        <Input
          type="number"
          min={0}
          step={100}
          value={String(parameters.landSize || 10000)}
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            onUpdate({ landSize: value });
          }}
        />
      </div>
      <div className="space-y-2">
        <Label>BUA Size (m²)</Label>
        <Input
          type="number"
          min={0}
          step={100}
          value={String(parameters.buaSize || 8000)}
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            onUpdate({ buaSize: value });
          }}
        />
      </div>
      <div className="space-y-2">
        <Label>Yield Base (%)</Label>
        <Input
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={String(((parameters.yieldBase as number) || 0.045) * 100)}
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            onUpdate({ yieldBase: value / 100 });
          }}
        />
      </div>
    </div>
  );
}

