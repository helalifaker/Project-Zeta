/**
 * Quick Actions Bar Component
 * Helper actions for transition planning
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calculator, RotateCcw, AlertTriangle } from 'lucide-react';

interface QuickActionsBarProps {
  onRecalculate: () => void;
  onReset: () => void;
  disabled?: boolean;
}

export function QuickActionsBar({
  onRecalculate,
  onReset,
  disabled = false,
}: QuickActionsBarProps): JSX.Element {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetClick = (): void => {
    setShowResetConfirm(true);
  };

  const handleResetConfirm = (): void => {
    onReset();
    setShowResetConfirm(false);
  };

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          onClick={onRecalculate}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <Calculator className="h-4 w-4" />
          Recalculate from 2028
        </Button>

        <Button
          variant="outline"
          onClick={handleResetClick}
          disabled={disabled}
          className="flex items-center gap-2 text-muted-foreground hover:text-destructive"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Reset to Default Values?
            </DialogTitle>
            <DialogDescription>
              This will reset all transition period settings to their default values. Any unsaved
              changes will be lost. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleResetConfirm}>
              Reset to Defaults
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
