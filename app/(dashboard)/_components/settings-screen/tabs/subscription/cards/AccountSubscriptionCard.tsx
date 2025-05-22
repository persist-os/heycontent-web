import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import React from 'react';

interface AccountSubscriptionCardProps {
  user: any;
  currentSubscription: any;
  handleUpgrade: () => void;
  handleOpenQuantityModal: () => void;
  handleManageSubscription: () => void;
}

export const AccountSubscriptionCard: React.FC<AccountSubscriptionCardProps> = ({
  user,
  currentSubscription,
  handleUpgrade,
  handleOpenQuantityModal,
  handleManageSubscription
}) => (
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
        <Button size="sm" variant="outline" onClick={handleManageSubscription}>Manage Subscription</Button>
        <Button size="sm" variant="outline" onClick={handleOpenQuantityModal}>Change # of Requests</Button>
      </div>
    </CardContent>
  </Card>
);
