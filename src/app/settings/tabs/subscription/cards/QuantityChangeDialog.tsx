import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import React from 'react';

interface QuantityChangeDialogProps {
  open: boolean;
  pendingQuantity: number;
  updatingQuantity: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  planPrice: number;
}

export const QuantityChangeDialog: React.FC<QuantityChangeDialogProps> = ({
  open,
  pendingQuantity,
  updatingQuantity,
  onDecrease,
  onIncrease,
  onCancel,
  onConfirm,
  planPrice
}) => (
  <Dialog open={open} onOpenChange={onCancel}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Change Number of Requests</DialogTitle>
      </DialogHeader>
      <div className="py-4">
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="lg" onClick={onDecrease} disabled={pendingQuantity <= 1}>-</Button>
          <div className="text-2xl font-bold w-12 text-center">{pendingQuantity}</div>
          <Button variant="outline" size="lg" onClick={onIncrease}>+</Button>
        </div>
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Total: ${planPrice * pendingQuantity}/month
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={updatingQuantity}>Cancel</Button>
        <Button onClick={onConfirm} disabled={updatingQuantity}>
          {updatingQuantity ? 'Updating...' : 'Confirm'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
