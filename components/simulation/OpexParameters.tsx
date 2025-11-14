/**
 * Opex Parameters Component
 * Opex sub-accounts management (add/remove, % of revenue or fixed amount)
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';
import { useSimulationStore, type OpexSubAccount } from '@/stores/simulation-store';
import Decimal from 'decimal.js';

interface OpexParametersProps {
  hasChanges: boolean;
}

export function OpexParameters({ hasChanges }: OpexParametersProps) {
  const { parameters, addOpexSubAccount, removeOpexSubAccount, updateOpexSubAccount } =
    useSimulationStore();

  if (!parameters) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Select a base version to edit opex parameters
        </CardContent>
      </Card>
    );
  }

  const subAccounts = parameters.opex.subAccounts;

  const handleAdd = () => {
    addOpexSubAccount({
      subAccountName: 'New Account',
      percentOfRevenue: new Decimal(0),
      isFixed: false,
      fixedAmount: null,
    });
  };

  return (
    <Card className={hasChanges ? 'border-yellow-400' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Opex Parameters</CardTitle>
            <CardDescription>Manage operating expense sub-accounts</CardDescription>
          </div>
          <Button onClick={handleAdd} size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {subAccounts.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No opex sub-accounts. Click "Add" to create one.
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subAccounts.map((account) => (
                  <OpexSubAccountRow
                    key={account.id}
                    account={account}
                    onUpdate={(updates) => updateOpexSubAccount(account.id, updates)}
                    onRemove={() => removeOpexSubAccount(account.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface OpexSubAccountRowProps {
  account: OpexSubAccount;
  onUpdate: (updates: Partial<OpexSubAccount>) => void;
  onRemove: () => void;
}

function OpexSubAccountRow({ account, onUpdate, onRemove }: OpexSubAccountRowProps) {
  const isFixed = account.isFixed;

  return (
    <TableRow>
      <TableCell>
        <Input
          value={account.subAccountName}
          onChange={(e) => onUpdate({ subAccountName: e.target.value })}
          className="min-w-[150px]"
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={!isFixed}
            onCheckedChange={(checked) => onUpdate({ isFixed: !checked })}
            id={`percent-${account.id}`}
          />
          <Label htmlFor={`percent-${account.id}`} className="text-sm cursor-pointer">
            % of Revenue
          </Label>
          <Checkbox
            checked={isFixed}
            onCheckedChange={(checked) => onUpdate({ isFixed: checked })}
            id={`fixed-${account.id}`}
          />
          <Label htmlFor={`fixed-${account.id}`} className="text-sm cursor-pointer">
            Fixed
          </Label>
        </div>
      </TableCell>
      <TableCell>
        {isFixed ? (
          <Input
            type="number"
            min={0}
            step={10000}
            value={
              account.fixedAmount instanceof Decimal
                ? account.fixedAmount.toFixed(0)
                : account.fixedAmount || ''
            }
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              onUpdate({
                fixedAmount: new Decimal(value),
                percentOfRevenue: null,
              });
            }}
            className="font-mono w-32"
          />
        ) : (
          <Input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={
              account.percentOfRevenue instanceof Decimal
                ? account.percentOfRevenue.times(100).toFixed(2)
                : account.percentOfRevenue !== null
                  ? String((account.percentOfRevenue as number) * 100)
                  : ''
            }
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              onUpdate({
                percentOfRevenue: new Decimal(value / 100),
                fixedAmount: null,
              });
            }}
            className="w-24"
          />
        )}
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-red-400" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

