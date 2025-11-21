/**
 * Global Settings Card Component
 * Manages capacity cap and rent adjustment for transition period
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import Decimal from 'decimal.js';

interface GlobalSettingsCardProps {
  capacityCap: number;
  rentAdjustmentPercent: number;
  staffCostBase2024?: number | undefined; // NEW
  rentBase2024?: number | undefined; // NEW
  onChange: (settings: { capacityCap: number; rentAdjustmentPercent: number }) => void;
  disabled?: boolean;
}

export function GlobalSettingsCard({
  capacityCap,
  rentAdjustmentPercent,
  staffCostBase2024,
  rentBase2024,
  onChange,
  disabled = false,
}: GlobalSettingsCardProps): JSX.Element {
  const [localCapacity, setLocalCapacity] = useState(capacityCap.toString());
  const [localRentAdj, setLocalRentAdj] = useState(rentAdjustmentPercent.toString());
  const [capacityError, setCapacityError] = useState<string>('');
  const [rentError, setRentError] = useState<string>('');

  // Update local state when props change
  useEffect(() => {
    setLocalCapacity(capacityCap.toString());
  }, [capacityCap]);

  useEffect(() => {
    setLocalRentAdj(rentAdjustmentPercent.toString());
  }, [rentAdjustmentPercent]);

  const validateAndUpdateCapacity = (value: string): void => {
    const numValue = parseInt(value, 10);

    if (isNaN(numValue)) {
      setCapacityError('Please enter a valid number');
      return;
    }

    if (numValue < 1 || numValue > 3000) {
      setCapacityError('Capacity must be between 1 and 3,000');
      return;
    }

    setCapacityError('');
    onChange({ capacityCap: numValue, rentAdjustmentPercent: parseFloat(localRentAdj) });
  };

  const validateAndUpdateRent = (value: string): void => {
    const numValue = parseFloat(value);

    if (isNaN(numValue)) {
      setRentError('Please enter a valid number');
      return;
    }

    if (numValue < -50 || numValue > 100) {
      setRentError('Adjustment must be between -50% and +100%');
      return;
    }

    setRentError('');
    onChange({ capacityCap: parseInt(localCapacity, 10), rentAdjustmentPercent: numValue });
  };

  const calculateAdjustedRent = (): string => {
    if (!rentBase2024) return '0';
    try {
      const baseRent = new Decimal(rentBase2024);
      const adjustment = new Decimal(rentAdjustmentPercent).dividedBy(100);
      const adjustedRent = baseRent.times(new Decimal(1).plus(adjustment));

      return adjustedRent.toFixed(0);
    } catch (error) {
      return '0';
    }
  };

  const formatNumber = (num: string): string => {
    const numValue = parseFloat(num);
    if (isNaN(numValue)) return '0';
    return new Intl.NumberFormat('en-US').format(numValue);
  };

  const getBorderColor = (hasError: boolean, value: string, originalValue: number): string => {
    if (hasError) return 'border-red-500';
    if (value !== originalValue.toString()) return 'border-yellow-500';
    return 'border-input';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          Global Settings
        </CardTitle>
        <CardDescription>
          Configure capacity cap and view base year reference values for transition period
          (2025-2027)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Capacity Cap */}
        <div className="space-y-2">
          <Label htmlFor="capacityCap">Capacity Cap</Label>
          <div className="flex items-center gap-2">
            <Input
              id="capacityCap"
              type="number"
              min="1"
              max="3000"
              value={localCapacity}
              onChange={(e) => setLocalCapacity(e.target.value)}
              onBlur={(e) => validateAndUpdateCapacity(e.target.value)}
              className={getBorderColor(!!capacityError, localCapacity, capacityCap)}
              disabled={disabled}
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">students</span>
          </div>
          {capacityError ? (
            <p className="text-xs text-red-500">{capacityError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Maximum capacity due to temporary facility space constraints
            </p>
          )}
        </div>

        {/* Rent Adjustment - HIDDEN: Per-year rent growth now handled in the table */}
        {/* Users can set rent growth % for each year individually */}

        {/* NEW: Base Year Reference Section */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="text-sm font-medium">Base Year 2024 (Reference)</h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Staff Costs (2024)</Label>
              <div className="p-2 bg-muted rounded-md text-sm font-mono">
                {staffCostBase2024
                  ? formatNumber(staffCostBase2024.toString()) + ' SAR'
                  : 'Not set'}
              </div>
              <p className="text-xs text-muted-foreground">From historical actuals</p>
            </div>

            <div className="space-y-2">
              <Label>Rent (2024)</Label>
              <div className="p-2 bg-muted rounded-md text-sm font-mono">
                {rentBase2024 ? formatNumber(rentBase2024.toString()) + ' SAR' : 'Not set'}
              </div>
              <p className="text-xs text-muted-foreground">From historical actuals</p>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Base year values are used for growth calculations in transition years. Fetched
              automatically from 2024 historical data.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}
