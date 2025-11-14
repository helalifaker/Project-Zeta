/**
 * Global Settings Component
 * Form for managing global admin settings
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettingsStore } from '@/stores/settings-store';
import { Loader2, Save } from 'lucide-react';

export function GlobalSettings() {
  const { settings, settingsLoading, settingsError, fetchSettings, updateSettings } = useSettingsStore();
  const [formData, setFormData] = useState({
    cpiRate: 0.03,
    discountRate: 0.08,
    taxRate: 0.15,
    currency: 'SAR',
    timezone: 'Asia/Riyadh',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '1,000,000',
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load settings on mount
  useEffect(() => {
    if (!settings) {
      fetchSettings();
    } else {
      setFormData({
        cpiRate: settings.cpiRate,
        discountRate: settings.discountRate,
        taxRate: settings.taxRate,
        currency: settings.currency,
        timezone: settings.timezone,
        dateFormat: settings.dateFormat,
        numberFormat: settings.numberFormat,
      });
    }
  }, [settings, fetchSettings]);

  // Update form when settings change
  useEffect(() => {
    if (settings) {
      setFormData({
        cpiRate: settings.cpiRate,
        discountRate: settings.discountRate,
        taxRate: settings.taxRate,
        currency: settings.currency,
        timezone: settings.timezone,
        dateFormat: settings.dateFormat,
        numberFormat: settings.numberFormat,
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    const success = await updateSettings(formData);
    setSaving(false);

    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  if (settingsLoading && !settings) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Settings</CardTitle>
        <CardDescription>
          Configure default values for CPI rate, discount rate, currency, and formatting options
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {settingsError && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {settingsError}
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-sm">
              Settings saved successfully!
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CPI Rate */}
            <div className="space-y-2">
              <Label htmlFor="cpiRate">CPI Rate (%)</Label>
              <Input
                id="cpiRate"
                type="number"
                step="0.001"
                min="0"
                max="1"
                value={formData.cpiRate}
                onChange={(e) => setFormData({ ...formData, cpiRate: parseFloat(e.target.value) || 0 })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Annual Consumer Price Index rate (e.g., 0.03 for 3%)
              </p>
            </div>

            {/* Discount Rate */}
            <div className="space-y-2">
              <Label htmlFor="discountRate">Discount Rate (%)</Label>
              <Input
                id="discountRate"
                type="number"
                step="0.001"
                min="0"
                max="1"
                value={formData.discountRate}
                onChange={(e) => setFormData({ ...formData, discountRate: parseFloat(e.target.value) || 0 })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Discount rate for NPV calculations (e.g., 0.08 for 8%)
              </p>
            </div>

            {/* Tax Rate */}
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.001"
                min="0"
                max="1"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Default tax rate (e.g., 0.15 for 15%)
              </p>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAR">SAR (Saudi Riyal)</SelectItem>
                  <SelectItem value="USD">USD (US Dollar)</SelectItem>
                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Asia/Riyadh">Asia/Riyadh (Saudi Arabia)</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Format */}
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select value={formData.dateFormat} onValueChange={(value) => setFormData({ ...formData, dateFormat: value })}>
                <SelectTrigger id="dateFormat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Number Format */}
            <div className="space-y-2">
              <Label htmlFor="numberFormat">Number Format</Label>
              <Select value={formData.numberFormat} onValueChange={(value) => setFormData({ ...formData, numberFormat: value })}>
                <SelectTrigger id="numberFormat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1,000,000">1,000,000 (Comma separator)</SelectItem>
                  <SelectItem value="1.000.000">1.000.000 (Dot separator)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving || settingsLoading}>
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
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

