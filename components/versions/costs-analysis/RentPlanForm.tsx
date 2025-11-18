/**
 * Rent Plan Form Component
 * Inline form for editing rent model and parameters
 * Used in RentLens expanded state for inline editing
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { RentModel } from '@prisma/client';
import { Save, X } from 'lucide-react';

interface RentPlanFormProps {
  /** Current rent model */
  rentModel: RentModel;
  /** Current parameters */
  parameters: Record<string, unknown>;
  /** Callback when form is saved */
  onSave: (rentModel: RentModel, parameters: Record<string, number>) => void;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Whether form is saving */
  saving?: boolean;
}

export function RentPlanForm({
  rentModel: initialRentModel,
  parameters: initialParameters,
  onSave,
  onCancel,
  saving = false,
}: RentPlanFormProps) {
  const [rentModel, setRentModel] = useState<RentModel>(initialRentModel);
  const [params, setParams] = useState<Record<string, number>>(() => {
    // Initialize form data from existing parameters
    const initial: Record<string, number> = {};
    Object.entries(initialParameters).forEach(([key, value]) => {
      if (typeof value === 'number') {
        initial[key] = value;
      } else if (typeof value === 'string' && !isNaN(parseFloat(value))) {
        initial[key] = parseFloat(value);
      }
    });
    return initial;
  });

  // Update form when props change
  useEffect(() => {
    setRentModel(initialRentModel);
    const updated: Record<string, number> = {};
    Object.entries(initialParameters).forEach(([key, value]) => {
      if (typeof value === 'number') {
        updated[key] = value;
      } else if (typeof value === 'string' && !isNaN(parseFloat(value))) {
        updated[key] = parseFloat(value);
      }
    });
    setParams(updated);
  }, [initialRentModel, initialParameters]);

  const handleModelChange = (newModel: RentModel) => {
    setRentModel(newModel);
    // Initialize default parameters for new model if switching
    if (newModel !== initialRentModel) {
      const defaults: Record<string, number> = {};
      if (newModel === 'FIXED_ESCALATION') {
        defaults.baseRent = (params.baseRent as number) || 1000000;
        defaults.escalationRate = (params.escalationRate as number) || 0.04;
        defaults.frequency = (params.frequency as number) || 1;
        defaults.startYear = (params.startYear as number) || 2028;
      } else if (newModel === 'REVENUE_SHARE') {
        defaults.revenueSharePercent = (params.revenueSharePercent as number) || 0.08;
      } else if (newModel === 'PARTNER_MODEL') {
        defaults.landSize = (params.landSize as number) || 10000;
        defaults.landPricePerSqm = (params.landPricePerSqm as number) || 5000;
        defaults.buaSize = (params.buaSize as number) || 8000;
        defaults.constructionCostPerSqm = (params.constructionCostPerSqm as number) || 3000;
        defaults.yieldBase = (params.yieldBase as number) || 0.045;
        defaults.growthRate = (params.growthRate as number) || 0.04;
        defaults.frequency = (params.frequency as number) || 2;
      }
      setParams(defaults);
    }
  };

  const handleSave = () => {
    onSave(rentModel, params);
  };

  return (
    <Card className="border-blue-500/50 bg-blue-500/5">
      <CardContent className="pt-6 space-y-4">
        {/* Rent Model Selector */}
        <div className="space-y-2">
          <Label>Rent Model *</Label>
          <Select value={rentModel} onValueChange={(value) => handleModelChange(value as RentModel)}>
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
        {rentModel === 'FIXED_ESCALATION' && (
          <FixedEscalationParams
            parameters={params}
            onUpdate={(updates) => setParams({ ...params, ...updates })}
          />
        )}

        {rentModel === 'REVENUE_SHARE' && (
          <RevenueShareParams
            parameters={params}
            onUpdate={(updates) => setParams({ ...params, ...updates })}
          />
        )}

        {rentModel === 'PARTNER_MODEL' && (
          <PartnerModelParams
            parameters={params}
            onUpdate={(updates) => setParams({ ...params, ...updates })}
          />
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Apply Model'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface ModelParamsProps {
  parameters: Record<string, number>;
  onUpdate: (updates: Record<string, number>) => void;
}

function FixedEscalationParams({ parameters, onUpdate }: ModelParamsProps) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="space-y-2">
        <Label>Base Rent (SAR) *</Label>
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
        <Label>Escalation Rate (%) *</Label>
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
        <p className="text-xs text-muted-foreground">
          Annual rent increase percentage (e.g., 4% = 0.04)
        </p>
      </div>
      <div className="space-y-2">
        <Label>Frequency (Years)</Label>
        <Select
          value={String(parameters.frequency || 1)}
          onValueChange={(value) => {
            const freq = parseInt(value, 10) || 1;
            onUpdate({ frequency: freq });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Every 1 year</SelectItem>
            <SelectItem value="2">Every 2 years</SelectItem>
            <SelectItem value="3">Every 3 years</SelectItem>
            <SelectItem value="4">Every 4 years</SelectItem>
            <SelectItem value="5">Every 5 years</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Apply escalation every N years (default: 1 year)
        </p>
      </div>
      <div className="space-y-2">
        <Label>Start Year</Label>
        <Input
          type="number"
          min={2023}
          max={2052}
          step={1}
          value={String(parameters.startYear || 2028)}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10) || 2028;
            onUpdate({ startYear: value });
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
        <Label>Revenue Share Percentage (%) *</Label>
        <Input
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={String(((parameters.revenueSharePercent as number) || 0.08) * 100)}
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            onUpdate({ revenueSharePercent: value / 100 });
          }}
        />
        <p className="text-xs text-muted-foreground">
          Percentage of revenue paid as rent (e.g., 8% = 0.08)
        </p>
      </div>
    </div>
  );
}

function PartnerModelParams({ parameters, onUpdate }: ModelParamsProps) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Land Size (m²) *</Label>
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
          <Label>Land Price per m² (SAR) *</Label>
          <Input
            type="number"
            min={0}
            step={100}
            value={String(parameters.landPricePerSqm || 5000)}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              onUpdate({ landPricePerSqm: value });
            }}
            className="font-mono"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>BUA Size (m²) *</Label>
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
          <Label>Construction Cost per m² (SAR) *</Label>
          <Input
            type="number"
            min={0}
            step={100}
            value={String(parameters.constructionCostPerSqm || 3000)}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              onUpdate({ constructionCostPerSqm: value });
            }}
            className="font-mono"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Yield Base (%) *</Label>
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
        <p className="text-xs text-muted-foreground">
          Annual yield percentage for Year 1 only (e.g., 4.5% = 0.045)
        </p>
      </div>
      <div className="space-y-2">
        <Label>Growth Rate (%)</Label>
        <Input
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={String(((parameters.growthRate as number) || 0) * 100)}
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            onUpdate({ growthRate: value / 100 });
          }}
        />
        <p className="text-xs text-muted-foreground">
          Escalation rate for years 2+ (e.g., 4% = 0.04). Leave 0 for no escalation.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Frequency (Years) *</Label>
        <Select
          value={String(parameters.frequency || 1)}
          onValueChange={(value) => {
            const freq = parseInt(value, 10) || 1;
            onUpdate({ frequency: freq });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Every 1 year</SelectItem>
            <SelectItem value="2">Every 2 years</SelectItem>
            <SelectItem value="3">Every 3 years</SelectItem>
            <SelectItem value="4">Every 4 years</SelectItem>
            <SelectItem value="5">Every 5 years</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Apply growth rate escalation every N years (required)
        </p>
      </div>
    </div>
  );
}

