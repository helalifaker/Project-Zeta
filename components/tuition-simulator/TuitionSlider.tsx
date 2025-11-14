/**
 * Tuition Slider Component
 * Slider with percentage adjustment (-20% to +50%)
 */

'use client';

import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Decimal from 'decimal.js';

interface TuitionSliderProps {
  curriculum: 'FR' | 'IB';
  baseTuition: Decimal;
  adjustment: number; // Percentage adjustment (-20 to +50)
  onAdjustmentChange: (adjustment: number) => void;
  locked?: boolean;
  onLockToggle?: () => void;
}

export function TuitionSlider({
  curriculum,
  baseTuition,
  adjustment,
  onAdjustmentChange,
  locked,
  onLockToggle,
}: TuitionSliderProps) {
  const adjustedTuition = baseTuition.times(1 + adjustment / 100);
  const minAdjustment = -20;
  const maxAdjustment = 50;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {curriculum === 'FR' ? 'French (FR)' : 'IB'} Base Tuition
          </CardTitle>
          {onLockToggle && (
            <button
              onClick={onLockToggle}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {locked ? '🔒 Locked' : '🔓 Unlocked'}
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Adjustment: {adjustment > 0 ? '+' : ''}{adjustment.toFixed(1)}%</Label>
          <Slider
            value={adjustment}
            onValueChange={onAdjustmentChange}
            min={minAdjustment}
            max={maxAdjustment}
            step={0.1}
          />
        </div>
        <div className="space-y-2">
          <Label>Base Tuition</Label>
          <Input
            type="number"
            value={baseTuition.toFixed(0)}
            readOnly
            className="font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label>Adjusted Tuition</Label>
          <Input
            type="number"
            value={adjustedTuition.toFixed(0)}
            readOnly
            className="font-mono font-semibold text-primary"
          />
        </div>
      </CardContent>
    </Card>
  );
}

