import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import React from 'react';

interface OverageControlsCardProps {
  ubpEnabled: boolean;
  premiumEnabled: boolean;
  monthlyLimit: number;
  saving: boolean;
  setUbpEnabled: (v: boolean) => void;
  setPremiumEnabled: (v: boolean) => void;
  setMonthlyLimit: (v: number) => void;
  handleSaveUbp: () => void;
}

export const OverageControlsCard: React.FC<OverageControlsCardProps> = ({
  ubpEnabled,
  premiumEnabled,
  monthlyLimit,
  saving,
  setUbpEnabled,
  setPremiumEnabled,
  setMonthlyLimit,
  handleSaveUbp
}) => (
  <Card>
    <CardContent className="space-y-4">
      <div className="bg-yellow-900/80 text-yellow-100 rounded p-3 text-sm flex items-center gap-2">
        <span className="font-bold">?</span>
        <span>Usage-based pricing allows you to pay for extra requests <b>beyond your plan limits</b>. <a href="#" className="underline">Learn more</a></span>
      </div>
      <div className="font-semibold text-base mt-2 mb-1">Overage Controls</div>
      <div className="flex items-center gap-2 mt-2">
        <Switch checked={ubpEnabled} onCheckedChange={setUbpEnabled} />
        <span className="text-sm">Enable usage-based pricing for extra requests</span>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={premiumEnabled} onCheckedChange={setPremiumEnabled} />
        <span className="text-sm">Enable UBP for premium models (overage only)</span>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-sm">Monthly overage spending limit:</span>
        <input
          type="number"
          className="border rounded px-2 py-1 w-20"
          value={monthlyLimit}
          onChange={e => setMonthlyLimit(Number(e.target.value))}
        />
        <Button size="sm" onClick={handleSaveUbp} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        You will never be charged more than this for extra requests in a month. Base plan cost is separate.
      </div>
    </CardContent>
  </Card>
);
