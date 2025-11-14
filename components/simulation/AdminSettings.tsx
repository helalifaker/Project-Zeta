/**
 * Admin Settings Component
 * Admin settings (CPI rate, discount rate, tax rate) - ADMIN role only
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useSimulationStore } from '@/stores/simulation-store';
import Decimal from 'decimal.js';

interface AdminSettingsProps {
  hasChanges: boolean;
  userRole: string;
}

export function AdminSettings({ hasChanges, userRole }: AdminSettingsProps) {
  const { parameters, updateAdminSetting } = useSimulationStore();
  const isAdmin = userRole === 'ADMIN';

  if (!parameters) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Select a base version to view admin settings
        </CardContent>
      </Card>
    );
  }

  const admin = parameters.admin;

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Settings</CardTitle>
          <CardDescription>Only ADMIN can edit admin settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>CPI Rate:</span>
                <span>
                  {admin.cpiRate instanceof Decimal
                    ? admin.cpiRate.times(100).toFixed(2)
                    : String((admin.cpiRate as number) * 100)}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span>Discount Rate:</span>
                <span>
                  {admin.discountRate instanceof Decimal
                    ? admin.discountRate.times(100).toFixed(2)
                    : String((admin.discountRate as number) * 100)}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax Rate:</span>
                <span>
                  {admin.taxRate instanceof Decimal
                    ? admin.taxRate.times(100).toFixed(2)
                    : String((admin.taxRate as number) * 100)}
                  %
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={hasChanges ? 'border-yellow-400' : ''}>
      <CardHeader>
        <CardTitle>Admin Settings</CardTitle>
        <CardDescription>Edit CPI rate, discount rate, and tax rate (ADMIN only)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>CPI Rate (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={
              admin.cpiRate instanceof Decimal
                ? admin.cpiRate.times(100).toFixed(2)
                : String((admin.cpiRate as number) * 100)
            }
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              updateAdminSetting('cpiRate', new Decimal(value / 100));
            }}
          />
        </div>

        <div className="space-y-2">
          <Label>Discount Rate (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={
              admin.discountRate instanceof Decimal
                ? admin.discountRate.times(100).toFixed(2)
                : String((admin.discountRate as number) * 100)
            }
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              updateAdminSetting('discountRate', new Decimal(value / 100));
            }}
          />
        </div>

        <div className="space-y-2">
          <Label>Tax Rate (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={
              admin.taxRate instanceof Decimal
                ? admin.taxRate.times(100).toFixed(2)
                : String((admin.taxRate as number) * 100)
            }
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              updateAdminSetting('taxRate', new Decimal(value / 100));
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

