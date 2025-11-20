/**
 * Balance Sheet Settings Component
 * 
 * Input form for balance sheet starting balances:
 * - Starting Cash (Year 0 ending balance)
 * - Opening Equity (Year 0 opening equity)
 * 
 * These values are required for the Balance Sheet and Cash Flow calculations.
 * 
 * Reference: FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md (lines 1826-1828)
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';

/**
 * Balance Sheet Settings Schema (Zod validation)
 */
const BalanceSheetSettingsSchema = z.object({
  startingCash: z.number().min(0, 'Starting cash cannot be negative').max(1000000000, 'Starting cash too high'),
  openingEquity: z.number().min(0, 'Opening equity cannot be negative').max(10000000000, 'Opening equity too high'),
});

type BalanceSheetSettingsData = z.infer<typeof BalanceSheetSettingsSchema>;

export interface BalanceSheetSettingsProps {
  versionId: string;
  initialData?: {
    startingCash: number;
    openingEquity: number;
  };
  onSave?: (data: BalanceSheetSettingsData) => void;
}

/**
 * Balance Sheet Settings Component
 * 
 * @example
 * <BalanceSheetSettings
 *   versionId="abc-123"
 *   initialData={{ startingCash: 5000000, openingEquity: 55000000 }}
 *   onSave={(data) => console.log('Saved:', data)}
 * />
 */
export function BalanceSheetSettings(props: BalanceSheetSettingsProps): JSX.Element {
  const { versionId, initialData, onSave } = props;

  // Form state
  const [startingCash, setStartingCash] = useState<string>(
    initialData?.startingCash.toString() || '5000000'
  );
  const [openingEquity, setOpeningEquity] = useState<string>(
    initialData?.openingEquity.toString() || '55000000'
  );

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setStartingCash(initialData.startingCash.toString());
      setOpeningEquity(initialData.openingEquity.toString());
    }
  }, [initialData]);

  // Format number with commas for display
  const formatNumber = (value: string): string => {
    const num = parseFloat(value.replace(/,/g, ''));
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Handle input change (accept numbers and commas)
  const handleInputChange = (value: string, setter: (v: string) => void): void => {
    // Remove all non-digit characters except commas
    const cleaned = value.replace(/[^\d,]/g, '');
    setter(cleaned);
  };

  // Validate form
  const validate = (): boolean => {
    const cashNum = parseFloat(startingCash.replace(/,/g, ''));
    const equityNum = parseFloat(openingEquity.replace(/,/g, ''));

    const result = BalanceSheetSettingsSchema.safeParse({
      startingCash: cashNum,
      openingEquity: equityNum,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setValidationErrors(errors);
      return false;
    }

    setValidationErrors({});
    return true;
  };

  // Handle save
  const handleSave = async (): Promise<void> => {
    setError(null);
    setSuccess(false);

    // Validate
    if (!validate()) {
      setError('Please fix validation errors');
      return;
    }

    setSaving(true);

    try {
      const cashNum = parseFloat(startingCash.replace(/,/g, ''));
      const equityNum = parseFloat(openingEquity.replace(/,/g, ''));

      const data: BalanceSheetSettingsData = {
        startingCash: cashNum,
        openingEquity: equityNum,
      };

      // Call API
      const response = await fetch(`/api/versions/${versionId}/balance-sheet-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save settings');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // Callback
      if (onSave) {
        onSave(data);
      }
    } catch (err) {
      console.error('[BalanceSheetSettings] Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance Sheet Settings</CardTitle>
        <CardDescription>
          Configure starting balances for the balance sheet and cash flow calculations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="border-accent-green bg-accent-green/10">
            <CheckCircle2 className="h-4 w-4 text-accent-green" />
            <AlertTitle className="text-accent-green">Success</AlertTitle>
            <AlertDescription>Balance sheet settings saved successfully</AlertDescription>
          </Alert>
        )}

        {/* Starting Cash Input */}
        <div className="space-y-2">
          <Label htmlFor="starting-cash">
            Starting Cash (SAR)
            <Badge variant="secondary" className="ml-2 text-xs">
              Year 0 Ending Balance
            </Badge>
          </Label>
          <Input
            id="starting-cash"
            type="text"
            value={formatNumber(startingCash)}
            onChange={(e) => handleInputChange(e.target.value, setStartingCash)}
            onBlur={() => setStartingCash(formatNumber(startingCash))}
            placeholder="5,000,000"
            className={validationErrors.startingCash ? 'border-accent-red' : ''}
            disabled={saving}
          />
          {validationErrors.startingCash && (
            <p className="text-sm text-accent-red">{validationErrors.startingCash}</p>
          )}
          <p className="text-sm text-text-tertiary">
            Cash balance at the beginning of Year 1 (2023). This is the starting point for cash flow calculations.
          </p>
        </div>

        {/* Opening Equity Input */}
        <div className="space-y-2">
          <Label htmlFor="opening-equity">
            Opening Equity (SAR)
            <Badge variant="secondary" className="ml-2 text-xs">
              Year 0 Opening Equity
            </Badge>
          </Label>
          <Input
            id="opening-equity"
            type="text"
            value={formatNumber(openingEquity)}
            onChange={(e) => handleInputChange(e.target.value, setOpeningEquity)}
            onBlur={() => setOpeningEquity(formatNumber(openingEquity))}
            placeholder="55,000,000"
            className={validationErrors.openingEquity ? 'border-accent-red' : ''}
            disabled={saving}
          />
          {validationErrors.openingEquity && (
            <p className="text-sm text-accent-red">{validationErrors.openingEquity}</p>
          )}
          <p className="text-sm text-text-tertiary">
            Equity at the beginning of the projection period. Must equal opening net assets (Cash + Fixed Assets - Liabilities).
          </p>
        </div>

        {/* Explanation Box */}
        <div className="p-4 bg-background-tertiary rounded-md space-y-2">
          <p className="text-sm text-text-secondary">
            <span className="font-semibold">Important:</span> These values establish the starting point for all financial statements.
          </p>
          <p className="text-sm text-text-secondary">
            <span className="font-semibold">Opening Balance Sheet:</span> Assets (Cash + Fixed Assets) = Liabilities + Opening Equity
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              Default Starting Cash: 5,000,000 SAR
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Default Opening Equity: 55,000,000 SAR
            </Badge>
          </div>
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

