/**
 * Version Selector List Component
 * Checkbox list for selecting versions to compare (2-4 versions)
 */

'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useComparisonStore } from '@/stores/comparison-store';
import type { VersionListItem } from '@/services/version';

interface VersionSelectorListProps {
  versions: VersionListItem[];
}

export function VersionSelectorList({ versions }: VersionSelectorListProps) {
  const { selectedVersionIds, addVersion, removeVersion, clearComparison } = useComparisonStore();

  const handleToggle = (versionId: string, checked: boolean) => {
    if (checked) {
      addVersion(versionId);
    } else {
      removeVersion(versionId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Select Versions to Compare</CardTitle>
            <CardDescription>
              Select 2-4 versions for comparison ({selectedVersionIds.length}/4 selected)
            </CardDescription>
          </div>
          {selectedVersionIds.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearComparison}>
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {versions.map((version) => {
            const isSelected = selectedVersionIds.includes(version.id);
            const isDisabled = !isSelected && selectedVersionIds.length >= 4;

            return (
              <div
                key={version.id}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50"
              >
                <Checkbox
                  id={version.id}
                  checked={isSelected}
                  disabled={isDisabled}
                  onCheckedChange={(checked: boolean) => handleToggle(version.id, checked === true)}
                />
                <label
                  htmlFor={version.id}
                  className={`flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                    isDisabled ? 'text-muted-foreground' : 'cursor-pointer'
                  }`}
                >
                  {version.name}
                </label>
                {isSelected && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeVersion(version.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        {versions.length === 0 && (
          <div className="text-center text-muted-foreground py-4">
            No versions available
          </div>
        )}
      </CardContent>
    </Card>
  );
}

