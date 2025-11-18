import { BaseCard } from '@/components/ui/base-card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Edit3, X, Check } from 'lucide-react';
import React, { useState } from 'react';
import { T } from '@/components/translation/T';

interface OverageControlsCardProps {
  ubpEnabled: boolean;
  monthlyLimit: number;
  saving: boolean;
  setUbpEnabled: (v: boolean) => void;
  setMonthlyLimit: (v: number) => void;
  handleSaveUbp: (ubpEnabled: boolean, monthlyLimit: number) => void;
}

export const OverageControlsCard: React.FC<OverageControlsCardProps> = ({
  ubpEnabled,
  monthlyLimit,
  saving,
  setUbpEnabled,
  setMonthlyLimit,
  handleSaveUbp
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editUbpEnabled, setEditUbpEnabled] = useState(ubpEnabled);
  const [editMonthlyLimit, setEditMonthlyLimit] = useState(monthlyLimit);

  // Sync edit values when props change (e.g., after successful save)
  React.useEffect(() => {
    if (!isEditing) {
      setEditUbpEnabled(ubpEnabled);
      setEditMonthlyLimit(monthlyLimit);
    }
  }, [ubpEnabled, monthlyLimit, isEditing]);

  const handleEdit = () => {
    setEditUbpEnabled(ubpEnabled);
    setEditMonthlyLimit(monthlyLimit);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditUbpEnabled(ubpEnabled);
    setEditMonthlyLimit(monthlyLimit);
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      // Call the save handler with the current edit values
      await handleSaveUbp(editUbpEnabled, editMonthlyLimit);
      
      // Update the parent state with our edit values (after successful save)
      setUbpEnabled(editUbpEnabled);
      setMonthlyLimit(editMonthlyLimit);
      
      // Exit edit mode
      setIsEditing(false);
      
    } catch (error) {
      console.error('[OverageControlsCard] Save failed:', error);
      // Don't exit edit mode on error so user can try again
      // Note: alert() doesn't support ReactNode, so we keep it as-is for now
      alert('Failed to save settings. Please try again.');
    }
  };

  return (
    <BaseCard variant="overage" title="Extra requests">
      <div className="flex items-center justify-between mb-3">
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-8 w-8 p-0 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
            disabled={saving}
          >
            <Edit3 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="space-y-4 mt-3">
        {isEditing ? (
          // Edit Mode
          <>
            <div className="flex items-center gap-2">
              <Switch 
                checked={editUbpEnabled} 
                onCheckedChange={setEditUbpEnabled}
                disabled={saving}
              />
              <span className="text-sm"><T context="settings.subscription.overage.allow.description">Allow extra requests after you reach your plan limit</T></span>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium"><T context="settings.subscription.overage.cap.label">Monthly spend cap for extra requests</T></label>
              <div className="flex items-center gap-2">
                <span className="text-sm">$</span>
                <input
                  type="number"
                  className="border rounded px-3 py-2 w-20 text-sm"
                  value={editMonthlyLimit}
                  onChange={e => setEditMonthlyLimit(Math.max(0, Number(e.target.value)))}
                  min={0}
                  step={1}
                  disabled={saving}
                  aria-label="Monthly overage spending limit"
                />
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              <T context="settings.subscription.overage.cap.description">We'll stop charging for extra requests once you hit this cap. Your base plan stays the same.</T>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                size="sm" 
                onClick={handleSave} 
                disabled={saving}
                className="flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                {saving ? <T context="button.saving">Saving...</T> : <T context="button.save">Save</T>}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                <T context="button.cancel">Cancel</T>
              </Button>
            </div>
          </>
        ) : (
          // View Mode
          <>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                ubpEnabled ? 'bg-primary border-primary' : 'border-muted-foreground'
              }`}>
                {ubpEnabled && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <span className="text-sm">
                {ubpEnabled ? <T context="settings.subscription.overage.status.enabled">Extra requests are enabled</T> : <T context="settings.subscription.overage.status.disabled">Extra requests are disabled</T>}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground"><T context="settings.subscription.overage.cap.label.short">Monthly spend cap:</T></span>
              <span className="text-sm font-medium">${monthlyLimit}</span>
            </div>

            <div className="text-xs text-muted-foreground">
              {ubpEnabled 
                ? <T context="settings.subscription.overage.cap.description.with_amount">We'll stop charging for extra requests once you hit ${monthlyLimit}. Your base plan stays the same.</T>
                : <T context="settings.subscription.overage.blocked.description">Extra requests will be blocked once you reach your plan limit.</T>
              }
            </div>
          </>
        )}
      </div>
    </BaseCard>
  );
};