/**
 * Recalculate Dialog Component
 * Dialog for recalculating staff costs from 2028 baseline with CPI
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Calculator, Loader2 } from 'lucide-react';
import Decimal from 'decimal.js';

interface RecalculateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (staffCosts2028: number, cpiRate: number) => Promise<void>;
}

interface CalculatedValues {
  year2025: string;
  year2026: string;
  year2027: string;
}

interface CalculationResult {
  success: boolean;
  data: CalculatedValues | null;
  error: string | null;
}

export function RecalculateDialog({
  open,
  onOpenChange,
  onConfirm,
}: RecalculateDialogProps): JSX.Element {
  const [staffCost2028, setStaffCost2028] = useState<string>('10000000');
  const [cpiRate, setCpiRate] = useState<string>('3.0');
  const [isCalculating, setIsCalculating] = useState(false);
  const [asyncError, setAsyncError] = useState<string>('');

  // Pure function - no side effects
  const calculateBackwards = (staffCost: string, cpi: string): CalculationResult => {
    try {
      const base2028 = new Decimal(staffCost);
      const cpiDecimal = new Decimal(cpi).dividedBy(100);

      // Validation - return error instead of setting state
      if (base2028.lessThanOrEqualTo(0)) {
        return {
          success: false,
          data: null,
          error: 'Staff cost must be greater than 0',
        };
      }

      if (cpiDecimal.lessThan(0) || cpiDecimal.greaterThan(0.5)) {
        return {
          success: false,
          data: null,
          error: 'CPI rate must be between 0% and 50%',
        };
      }

      // Calculate backwards from 2028
      // 2027 = 2028 / (1 + CPI)
      const cost2027 = base2028.dividedBy(new Decimal(1).plus(cpiDecimal));

      // 2026 = 2027 / (1 + CPI)
      const cost2026 = cost2027.dividedBy(new Decimal(1).plus(cpiDecimal));

      // 2025 = 2026 / (1 + CPI)
      const cost2025 = cost2026.dividedBy(new Decimal(1).plus(cpiDecimal));

      return {
        success: true,
        data: {
          year2025: cost2025.toFixed(0),
          year2026: cost2026.toFixed(0),
          year2027: cost2027.toFixed(0),
        },
        error: null,
      };
    } catch (err) {
      return {
        success: false,
        data: null,
        error: 'Invalid calculation parameters',
      };
    }
  };

  // Memoize calculation to prevent infinite re-renders
  const calculationResult = useMemo(
    () => calculateBackwards(staffCost2028, cpiRate),
    [staffCost2028, cpiRate]
  );

  // Clear async error when inputs change
  useEffect(() => {
    setAsyncError('');
  }, [staffCost2028, cpiRate]);

  const handleConfirm = async (): Promise<void> => {
    if (!calculationResult.success || !calculationResult.data) {
      return;
    }

    setAsyncError('');
    setIsCalculating(true);
    try {
      await onConfirm(parseFloat(staffCost2028), parseFloat(cpiRate));
      onOpenChange(false);
    } catch (err) {
      setAsyncError('Failed to apply recalculation');
    } finally {
      setIsCalculating(false);
    }
  };

  const formatNumber = (num: string): string => {
    const numValue = parseFloat(num);
    if (isNaN(numValue)) return '0';
    return new Intl.NumberFormat('en-US').format(numValue);
  };

  // Derive error from calculation result or async error
  const error = asyncError || calculationResult.error || null;
  const calculatedValues = calculationResult.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Recalculate Staff Costs from 2028
          </DialogTitle>
          <DialogDescription>
            Enter the 2028 staff cost baseline and CPI rate to calculate transition year values
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 2028 Staff Cost Input */}
          <div className="space-y-2">
            <Label htmlFor="staffCost2028">2028 Staff Cost Base (SAR)</Label>
            <Input
              id="staffCost2028"
              type="number"
              min="0"
              step="100000"
              value={staffCost2028}
              onChange={(e) => setStaffCost2028(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              The expected staff cost for year 2028 (post-relocation)
            </p>
          </div>

          {/* CPI Rate Input */}
          <div className="space-y-2">
            <Label htmlFor="cpiRate">CPI Rate (%)</Label>
            <Input
              id="cpiRate"
              type="number"
              min="0"
              max="50"
              step="0.1"
              value={cpiRate}
              onChange={(e) => setCpiRate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Annual Consumer Price Index growth rate (e.g., 3.0 for 3%)
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Calculated Preview */}
          {calculatedValues && calculationResult.success && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="text-sm font-medium mb-2">Calculated Values:</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">2025:</span>
                      <span className="font-mono font-medium">
                        {formatNumber(calculatedValues.year2025)} SAR
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">2026:</span>
                      <span className="font-mono font-medium">
                        {formatNumber(calculatedValues.year2026)} SAR
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">2027:</span>
                      <span className="font-mono font-medium">
                        {formatNumber(calculatedValues.year2027)} SAR
                      </span>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Explanation */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Staff costs are calculated backwards from 2028 using the formula:
              <br />
              <code className="text-xs bg-muted px-1 py-0.5 rounded mt-1 inline-block">
                Year(n) = Year(n+1) / (1 + CPI)
              </code>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCalculating}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isCalculating || !calculationResult.success || !calculatedValues}
          >
            {isCalculating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                Apply Calculation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
