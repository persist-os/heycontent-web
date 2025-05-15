"use client";

import { useQuery, useMutation } from "convex/react";
import { api as convexApi } from "@/convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Switch } from "@/src/components/ui/switch";
import { Progress } from "@/src/components/ui/progress";
import { useAuth } from "@/app/context/auth-context";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import UpgradeModal from '@/app/(dashboard)/_components/settings-screen/tabs/subscription/upgrade-modal';

export default function SubscriptionOverview() {
  const { user } = useAuth();
  const userId = user?.uid || "";

  // Data fetching
  const currentSubscription = useQuery(convexApi.subscriptionQueries.getCurrentSubscription, { userId });
  const usage = useQuery(convexApi.usage.getCurrentUsage, { userId });
  const ubpSettings = useQuery(convexApi.ubpSettings.getUbpSettings, { userId });
  const sessions = useQuery(convexApi.sessions.listSessions, { userId }) || [];
  const usageEvents = useQuery(convexApi.usageEvents.listUsageEvents, { userId, limit: 20 }) || [];
  const setUbpSettings = useMutation(convexApi.ubpSettings.setUbpSettings);
  const revokeSession = useMutation(convexApi.sessions.revokeSession);
  const updatePlanQuantity = useMutation(convexApi.subscriptionActions.updatePlanQuantity);

  // Local state for UBP
  const [monthlyLimit, setMonthlyLimit] = useState(ubpSettings?.monthlyLimit || 20);
  const [ubpEnabled, setUbpEnabled] = useState(ubpSettings?.enabled ?? true);
  const [premiumEnabled, setPremiumEnabled] = useState(ubpSettings?.premiumEnabled ?? true);
  const [saving, setSaving] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [pendingQuantity, setPendingQuantity] = useState(currentSubscription?.quantity || 1);
  const [updatingQuantity, setUpdatingQuantity] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const basePrice = currentSubscription?.plan?.price || 20; // fallback to $20
  const increment = 500;
  const incrementPrice = 20;
  const minQuantity = 1;

  const handleSaveUbp = async () => {
    setSaving(true);
    await setUbpSettings({
      userId,
      enabled: ubpEnabled,
      premiumEnabled,
      monthlyLimit: Number(monthlyLimit),
    });
    setSaving(false);
  };

  const handleOpenQuantityModal = () => {
    setPendingQuantity(currentSubscription?.quantity || 1);
    setShowQuantityModal(true);
  };

  const handleConfirmQuantity = async () => {
    setUpdatingQuantity(true);
    await updatePlanQuantity({ userId, quantity: pendingQuantity });
    setShowQuantityModal(false);
    setUpdatingQuantity(false);
  };

  const handleUpgrade = () => setShowUpgradeModal(true);
  const handleCloseUpgrade = () => setShowUpgradeModal(false);
  const handleSelectPlan = (plan: string, interval: "month" | "year") => {
    // TODO: Add backend logic to upgrade plan
    setShowUpgradeModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Usage & Billing - full width top */}
      <Card>
        <CardHeader>
          <CardTitle>Usage & Billing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Included Plan Usage */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Fast Requests</span>
                <span>{usage?.fastRequests || 0} / 2000</span>
              </div>
              <Progress value={Math.min((usage?.fastRequests || 0) / 2000 * 100, 100)} />
              <div className="text-xs text-gray-500 mt-1">Premium models (e.g., GPT-4, etc.) included in your plan</div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Other Models</span>
                <span>{usage?.slowRequests || 0} / No Limit</span>
              </div>
              <Progress value={100} />
              <div className="text-xs text-gray-500 mt-1">Unlimited usage for mini/small models under your plan</div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700 my-4" />

          {/* Overage Controls Section */}
          <div className="space-y-4">
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
            <div className="text-xs text-gray-500 mt-1">
              Current overage spend: <b>${usage?.overageCharges?.toFixed(2) || "0.00"}</b> of ${monthlyLimit} limit
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account & Subscription and Active Sessions side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account & Subscription */}
        <Card>
          <CardHeader>
            <CardTitle>Account & Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="font-medium">{user?.displayName}</div>
            <div className="text-sm text-gray-500">{user?.email}</div>
            <div className="mt-2">
              <span className="font-semibold">Plan:</span> {currentSubscription?.plan?.name || "-"}
              <span className="ml-2 text-gray-500">${currentSubscription?.plan?.price || 0}/month</span>
            </div>
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={handleUpgrade}>Upgrade</Button>
              <Button size="sm" variant="outline">Manage Subscription</Button>
              <Button size="sm" variant="outline" onClick={handleOpenQuantityModal}>Change # of Requests</Button>
            </div>
          </CardContent>
        </Card>
        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sessions.length === 0 && <div className="text-sm text-gray-500">No active sessions</div>}
            {sessions.map(session => (
              <div key={session._id} className="flex justify-between items-center p-2 bg-gray-50 rounded mb-1">
                <div>
                  <div className="font-medium text-sm">{session.type === "desktop" ? "Desktop App Session" : "Web Session"}</div>
                  <div className="text-xs text-gray-500">Created {new Date(session.createdAt).toLocaleDateString()}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => revokeSession({ sessionId: session._id })} disabled={session.revoked}>
                  {session.revoked ? "Revoked" : "Revoke"}
                </Button>
              </div>
            ))}
            <div className="text-xs text-gray-400 mt-2">Note: Session revocation may take up to 10 minutes to take effect.</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Usage Events - full width bottom */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Usage Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2">Model</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 px-2">Qty</th>
                </tr>
              </thead>
              <tbody>
                {usageEvents.length === 0 && (
                  <tr><td colSpan={4} className="text-center text-gray-400 py-4">No usage events</td></tr>
                )}
                {usageEvents.map((event: any) => (
                  <tr key={event._id} className="border-b last:border-0">
                    <td className="py-2 px-2">{new Date(event.timestamp).toLocaleString()}</td>
                    <td className="py-2 px-2">{event.model}</td>
                    <td className="py-2 px-2">{event.status}</td>
                    <td className="py-2 px-2">{event.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quantity Modal */}
      <Dialog open={showQuantityModal} onOpenChange={setShowQuantityModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change # of Requests</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex items-center gap-4">
              <Button size="sm" variant="outline" onClick={() => setPendingQuantity(Math.max(minQuantity, pendingQuantity - 1))} disabled={pendingQuantity <= minQuantity}>-</Button>
              <span className="text-2xl font-bold">{pendingQuantity * increment}</span>
              <Button size="sm" variant="outline" onClick={() => setPendingQuantity(pendingQuantity + 1)}>+</Button>
            </div>
            <div className="text-sm text-gray-500">Requests per month</div>
            <div className="text-lg font-semibold mt-2">${pendingQuantity * incrementPrice}/month</div>
            <div className="text-xs text-gray-500">${incrementPrice} per {increment} requests</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuantityModal(false)} disabled={updatingQuantity}>Cancel</Button>
            <Button onClick={handleConfirmQuantity} disabled={updatingQuantity}>
              {updatingQuantity ? 'Updating...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpgradeModal open={showUpgradeModal} onClose={handleCloseUpgrade} onSelectPlan={handleSelectPlan} />
    </div>
  );
} 