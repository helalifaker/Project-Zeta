/**
 * Other Revenue Editor Component
 * 
 * Year-by-year input table for other revenue items (30 years: 2023-2052).
 * Allows users to add revenue sources beyond tuition (e.g., facilities rental, programs).
 * 
 * Features:
 * - Virtualized table for performance (30 rows)
 * - Auto-save (debounced)
 * - Validation (non-negative, year range)
 * - Currency formatting
 * 
 * Reference: FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md (lines 1760-1767)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, AlertCircle, CheckCircle2, Download, Upload } from 'lucide-react';
import { z } from 'zod';
import Decimal from 'decimal.js';

/**
 * Other Revenue Item Schema
 */
const OtherRevenueItemSchema = z.object({
  year: z.number().int().min(2023).max(2052),
  amount: z.number().min(0, 'Amount cannot be negative'),
});

type OtherRevenueItem = z.infer<typeof OtherRevenueItemSchema>;

export interface OtherRevenueEditorProps {
  versionId: string;
  initialData?: Record<number, number>; // { year: amount }
  onSave?: (data: Record<number, number>) => void;
}

/**
 * Other Revenue Editor Component
 * 
 * @example
 * <OtherRevenueEditor
 *   versionId="abc-123"
 *   initialData={{ 2028: 1000000, 2029: 1100000 }}
 *   onSave={(data) => console.log('Saved:', data)}
 * />
 */
export function OtherRevenueEditor(props: OtherRevenueEditorProps): JSX.Element {
  const { versionId, initialData, onSave } = props;

  // Initialize 30 years (2023-2052) with zeros or initial data
  const [revenueData, setRevenueData] = useState<Record<number, number>>(() => {
    const data: Record<number, number> = {};
    for (let year = 2023; year <= 2052; year++) {
      data[year] = initialData?.[year] || 0;
    }
    return data;
  });

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Debounced auto-save
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      const data: Record<number, number> = {};
      for (let year = 2023; year <= 2052; year++) {
        data[year] = initialData[year] || 0;
      }
      setRevenueData(data);
    }
  }, [initialData]);

  // Format number with commas
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Parse input value
  const parseNumber = (value: string): number => {
    const num = parseFloat(value.replace(/,/g, ''));
    return isNaN(num) ? 0 : Math.max(0, num);
  };

  // Handle input change
  const handleChange = (year: number, value: string): void => {
    const amount = parseNumber(value);
    
    setRevenueData(prev => ({
      ...prev,
      [year]: amount,
    }));

    // Debounce auto-save (2 seconds)
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    const timeout = setTimeout(() => {
      saveData({ ...revenueData, [year]: amount });
    }, 2000);

    setSaveTimeout(timeout);
  };

  // Save data to API
  const saveData = async (data: Record<number, number>): Promise<void> => {
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      // Convert to array format for API
      const items: OtherRevenueItem[] = Object.entries(data)
        .filter(([, amount]) => amount > 0) // Only send non-zero amounts
        .map(([year, amount]) => ({
          year: parseInt(year),
          amount,
        }));

      // Call API
      const response = await fetch(`/api/versions/${versionId}/other-revenue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save other revenue');
      }

      setSuccess(true);
      setLastSaved(new Date());
      setTimeout(() => setSuccess(false), 3000);

      // Callback
      if (onSave) {
        onSave(data);
      }
    } catch (err) {
      console.error('[OtherRevenueEditor] Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save other revenue');
    } finally {
      setSaving(false);
    }
  };

  // Handle manual save button
  const handleSaveNow = (): void => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      setSaveTimeout(null);
    }
    saveData(revenueData);
  };

  // Calculate total
  const total = Object.values(revenueData).reduce((sum, amount) => sum + amount, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Other Revenue</CardTitle>
            <CardDescription>
              Additional revenue sources beyond tuition (e.g., facilities rental, programs, events)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={saving ? 'secondary' : success ? 'default' : 'outline'}>
              {saving ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Saving...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Saved
                </>
              ) : lastSaved ? (
                `Last saved: ${lastSaved.toLocaleTimeString()}`
              ) : (
                'Not saved'
              )}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleSaveNow} disabled={saving}>
              <Upload className="h-4 w-4 mr-2" />
              Save Now
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
            <AlertDescription>Other revenue saved successfully</AlertDescription>
          </Alert>
        )}

        {/* Table */}
        <div className="rounded-md border max-h-[600px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background-secondary z-10">
              <TableRow>
                <TableHead className="w-[100px]">Year</TableHead>
                <TableHead className="text-right">Amount (SAR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.keys(revenueData)
                .map(Number)
                .sort((a, b) => a - b)
                .map((year) => (
                  <TableRow key={year}>
                    <TableCell className="font-medium">{year}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="text"
                        value={revenueData[year] === 0 ? '' : formatNumber(revenueData[year])}
                        onChange={(e) => handleChange(year, e.target.value)}
                        placeholder="0"
                        className="text-right font-mono"
                        disabled={saving}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              {/* Total Row */}
              <TableRow className="bg-background-tertiary font-semibold border-t-2">
                <TableCell>TOTAL (30 years)</TableCell>
                <TableCell className="text-right font-mono text-accent-blue">
                  {formatNumber(total)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Explanation */}
        <div className="p-4 bg-background-tertiary rounded-md space-y-2">
          <p className="text-sm text-text-secondary">
            <span className="font-semibold">Auto-save:</span> Changes are automatically saved 2 seconds after you stop typing.
          </p>
          <p className="text-sm text-text-secondary">
            <span className="font-semibold">Validation:</span> All amounts must be non-negative. Leave blank or enter 0 for years with no other revenue.
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Years: 2023-2052 (30 years)
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Currency: SAR
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Total: {formatNumber(total)} SAR
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

