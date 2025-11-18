import { BaseModal } from '@/components/ui/base-modal';
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
  <BaseModal
    isOpen={open}
    onClose={onCancel}
    title="Change Number of Requests"
    variant="quantity-change"
    onConfirm={onConfirm}
    onCancel={onCancel}
    confirmText="Confirm"
    cancelText="Cancel"
    isLoading={updatingQuantity}
    loadingText="Updating..."
  >
    <div className="py-4">
      <div className="flex items-center justify-center gap-4">
        <Button 
          variant="outline" 
          size="lg" 
          onClick={onDecrease} 
          disabled={pendingQuantity <= 1}
          className="min-h-[44px] min-w-[44px]"
        >
          -
        </Button>
        <div className="text-2xl font-bold w-12 text-center">{pendingQuantity}</div>
        <Button 
          variant="outline" 
          size="lg" 
          onClick={onIncrease}
          className="min-h-[44px] min-w-[44px]"
        >
          +
        </Button>
      </div>
      <div className="mt-4 text-sm text-muted-foreground text-center">
        Total: ${planPrice * pendingQuantity}/month
      </div>
    </div>
  </BaseModal>
);
