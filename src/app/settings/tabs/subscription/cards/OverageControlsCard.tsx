import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Edit3, X, Check } from 'lucide-react';
import React, { useState } from 'react';

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
    console.log('[OverageControlsCard] Saving values:', { 
      editUbpEnabled, 
      editMonthlyLimit 
    });
    
    try {
      // Call the save handler with the current edit values
      await handleSaveUbp(editUbpEnabled, editMonthlyLimit);
      
      // Update the parent state with our edit values (after successful save)
      setUbpEnabled(editUbpEnabled);
      setMonthlyLimit(editMonthlyLimit);
      
      // Exit edit mode
      setIsEditing(false);
      
      console.log('[OverageControlsCard] Save completed successfully!');
    } catch (error) {
      console.error('[OverageControlsCard] Save failed:', error);
      // Don't exit edit mode on error so user can try again
      alert('Failed to save settings. Please try again.');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Extra requests</CardTitle>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-8 w-8 p-0"
              disabled={saving}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          // Edit Mode
          <>
            <div className="flex items-center gap-2">
              <Switch 
                checked={editUbpEnabled} 
                onCheckedChange={setEditUbpEnabled}
                disabled={saving}
              />
              <span className="text-sm">Allow extra requests after you reach your plan limit</span>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Monthly spend cap for extra requests</label>
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
              We'll stop charging for extra requests once you hit this cap. Your base plan stays the same.
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                size="sm" 
                onClick={handleSave} 
                disabled={saving}
                className="flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Cancel
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
                {ubpEnabled ? 'Extra requests are enabled' : 'Extra requests are disabled'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Monthly spend cap:</span>
              <span className="text-sm font-medium">${monthlyLimit}</span>
            </div>

            <div className="text-xs text-muted-foreground">
              {ubpEnabled 
                ? `We'll stop charging for extra requests once you hit $${monthlyLimit}. Your base plan stays the same.`
                : 'Extra requests will be blocked once you reach your plan limit.'
              }
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};