/**
 * Generate Report Form Component
 * Form for generating new reports
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface GenerateReportFormProps {
  versions: Array<{ id: string; name: string }>;
  userRole: string;
  onSuccess: () => void;
}

export function GenerateReportForm({ versions, userRole, onSuccess }: GenerateReportFormProps) {
  const [versionId, setVersionId] = useState<string>('');
  const [reportType, setReportType] = useState<'EXECUTIVE_SUMMARY' | 'FINANCIAL_DETAIL' | 'COMPARISON'>('EXECUTIVE_SUMMARY');
  const [format, setFormat] = useState<'PDF' | 'EXCEL' | 'CSV'>('PDF');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeYearByYear, setIncludeYearByYear] = useState(true);
  const [includeAssumptions, setIncludeAssumptions] = useState(false);
  const [includeAuditTrail, setIncludeAuditTrail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!versionId) {
      setError('Please select a version');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/reports/generate/${versionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType,
          format,
          includeCharts,
          includeYearByYear,
          includeAssumptions,
          includeAuditTrail: userRole === 'ADMIN' ? includeAuditTrail : false,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        // Handle error message - ensure it's a string, not an object
        const errorMessage = typeof data.error === 'string' 
          ? data.error 
          : data.error?.message || 'Failed to generate report';
        setError(errorMessage);
        return;
      }

      // Download report immediately
      if (data.data.downloadUrl) {
        window.location.href = data.data.downloadUrl;
      }

      onSuccess();
    } catch (err) {
      console.error('Error generating report:', err);
      // Handle network errors or non-JSON responses
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Network error: Could not connect to server');
      } else {
        setError('Failed to generate report. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Preview structure based on selected options
  const previewSections = [
    { name: 'Report Header', included: true },
    { name: 'Key Performance Indicators (KPIs)', included: true },
    { name: 'Summary Metrics', included: true },
    { name: 'Charts and Visualizations', included: includeCharts },
    { name: 'Year-by-Year Data', included: includeYearByYear },
    { name: 'Assumptions', included: includeAssumptions },
    { name: 'Audit Trail', included: includeAuditTrail && userRole === 'ADMIN' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="space-y-4">
      {/* Version Selector */}
      <div className="space-y-2">
        <Label>Version *</Label>
        <Select
          value={versionId}
          onValueChange={setVersionId}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a version" />
          </SelectTrigger>
          <SelectContent>
            {versions.map((version) => (
              <SelectItem key={version.id} value={version.id}>
                {String(version.name || 'Unnamed Version')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Report Type */}
      <div className="space-y-2">
        <Label>Report Type *</Label>
        <Select
          value={reportType}
          onValueChange={(value) => setReportType(value as 'EXECUTIVE_SUMMARY' | 'FINANCIAL_DETAIL' | 'COMPARISON')}
          required
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EXECUTIVE_SUMMARY">Executive Summary</SelectItem>
            <SelectItem value="FINANCIAL_DETAIL">Financial Detail</SelectItem>
            <SelectItem value="COMPARISON">Comparison</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Format */}
      <div className="space-y-2">
        <Label>Format *</Label>
        <Select
          value={format}
          onValueChange={(value) => setFormat(value as 'PDF' | 'EXCEL' | 'CSV')}
          required
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PDF">PDF</SelectItem>
            <SelectItem value="EXCEL">Excel</SelectItem>
            <SelectItem value="CSV">CSV</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Options</CardTitle>
          <CardDescription>Customize report content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeCharts"
              checked={includeCharts}
              onCheckedChange={(checked) => setIncludeCharts(checked === true)}
            />
            <Label htmlFor="includeCharts" className="cursor-pointer">
              Include charts
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeYearByYear"
              checked={includeYearByYear}
              onCheckedChange={(checked) => setIncludeYearByYear(checked === true)}
            />
            <Label htmlFor="includeYearByYear" className="cursor-pointer">
              Include year-by-year table
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeAssumptions"
              checked={includeAssumptions}
              onCheckedChange={(checked) => setIncludeAssumptions(checked === true)}
            />
            <Label htmlFor="includeAssumptions" className="cursor-pointer">
              Include assumptions
            </Label>
          </div>
          {userRole === 'ADMIN' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeAuditTrail"
                checked={includeAuditTrail}
                onCheckedChange={(checked) => setIncludeAuditTrail(checked === true)}
              />
              <Label htmlFor="includeAuditTrail" className="cursor-pointer">
                Include audit trail
              </Label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md p-3">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={loading || !versionId}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate Report'
        )}
      </Button>
      </form>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview Structure</CardTitle>
          <CardDescription>
            Sections that will be included in your report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {previewSections.map((section) => (
              <div
                key={section.name}
                className={`flex items-center justify-between p-2 rounded-md ${
                  section.included
                    ? 'bg-green-500/10 border border-green-500/20'
                    : 'bg-muted border border-muted'
                }`}
              >
                <span className={`text-sm ${section.included ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {section.name}
                </span>
                {section.included ? (
                  <span className="text-xs text-green-500 font-medium">✓ Included</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Not included</span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground">
              <strong>Format:</strong> {String(format)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              <strong>Type:</strong> {String(reportType).replace('_', ' ')}
            </p>
            {reportType === 'COMPARISON' && (
              <p className="text-xs text-yellow-500 mt-1">
                ⚠️ Comparison reports require selecting comparison versions
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

