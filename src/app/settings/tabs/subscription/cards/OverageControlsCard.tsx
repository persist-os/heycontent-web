import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import React from 'react';

interface OverageControlsCardProps {
  ubpEnabled: boolean;
  monthlyLimit: number;
  saving: boolean;
  setUbpEnabled: (v: boolean) => void;
  setMonthlyLimit: (v: number) => void;
  handleSaveUbp: () => void;
}

export const OverageControlsCard: React.FC<OverageControlsCardProps> = ({
  ubpEnabled,
  monthlyLimit,
  saving,
  setUbpEnabled,
  setMonthlyLimit,
  handleSaveUbp
}) => (
  <Card>
    <CardContent className="space-y-4">
      <div className="bg-yellow-900/80 text-yellow-100 rounded p-3 text-sm flex items-center gap-2">
        <span className="font-bold">ℹ️</span>
        <span>Need more than what’s included in your plan? Turn on extra requests and set a monthly cap so you stay in control.</span>
      </div>
      <div className="font-semibold text-base mt-2 mb-1">Extra requests</div>
      <div className="flex items-center gap-2 mt-2">
        <Switch checked={ubpEnabled} onCheckedChange={setUbpEnabled} />
        <span className="text-sm">Allow extra requests after you reach your plan limit</span>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-sm">Monthly spend cap for extra requests</span>
        <input
          type="number"
          className="border rounded px-2 py-1 w-20"
          value={monthlyLimit}
          onChange={e => setMonthlyLimit(Number(e.target.value))}
          min={0}
          step={1}
          placeholder="25"
          aria-label="Monthly overage spending limit"
        />
        <Button size="sm" onClick={handleSaveUbp} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        We’ll stop charging for extra requests once you hit this cap. Your base plan cost stays the same.
      </div>
    </CardContent>
  </Card>
);
