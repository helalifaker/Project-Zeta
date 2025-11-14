/**
 * Capex Parameters Component
 * Capex items management (add/remove, year, amount, category)
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { useSimulationStore, type CapexItem } from '@/stores/simulation-store';
import Decimal from 'decimal.js';

interface CapexParametersProps {
  hasChanges: boolean;
}

export function CapexParameters({ hasChanges }: CapexParametersProps) {
  const { parameters, addCapexItem, removeCapexItem, updateCapexItem } = useSimulationStore();

  if (!parameters) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Select a base version to edit capex parameters
        </CardContent>
      </Card>
    );
  }

  const items = parameters.capex.items;

  const handleAdd = () => {
    addCapexItem({
      year: 2028,
      amount: new Decimal(0),
      category: 'Other',
    });
  };

  return (
    <Card className={hasChanges ? 'border-yellow-400' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Capex Parameters</CardTitle>
            <CardDescription>Manage capital expenditure items</CardDescription>
          </div>
          <Button onClick={handleAdd} size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No capex items. Click "Add" to create one.
          </div>
        ) : (
          <div className="border rounded-md max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>Amount (SAR)</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <CapexItemRow
                    key={item.id}
                    item={item}
                    onUpdate={(updates) => updateCapexItem(item.id, updates)}
                    onRemove={() => removeCapexItem(item.id)}
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

interface CapexItemRowProps {
  item: CapexItem;
  onUpdate: (updates: Partial<CapexItem>) => void;
  onRemove: () => void;
}

function CapexItemRow({ item, onUpdate, onRemove }: CapexItemRowProps) {
  return (
    <TableRow>
      <TableCell>
        <Input
          type="number"
          min={2023}
          max={2052}
          value={item.year}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 2023;
            onUpdate({ year: Math.min(Math.max(value, 2023), 2052) });
          }}
          className="w-24"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min={0}
          step={10000}
          value={
            item.amount instanceof Decimal ? item.amount.toFixed(0) : item.amount
          }
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            onUpdate({ amount: new Decimal(value) });
          }}
          className="font-mono w-32"
        />
      </TableCell>
      <TableCell>
        <Select
          value={item.category}
          onValueChange={(value) =>
            onUpdate({ category: value as 'Building' | 'Equipment' | 'Technology' | 'Other' })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Building">Building</SelectItem>
            <SelectItem value="Equipment">Equipment</SelectItem>
            <SelectItem value="Technology">Technology</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-red-400" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

