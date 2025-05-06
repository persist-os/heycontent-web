import { Card } from '@/src/components/ui/card';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PlatformType } from './platforms';
import { ConnectedAccount, renderMetrics } from './platform-utils';
import { SocialPlatform } from '@/app/types/social-platforms';
import { PlatformConnectButton } from './PlatformConnectButton';

interface PlatformCardProps {
  platform: PlatformType;
  account: ConnectedAccount | undefined;
  connecting: SocialPlatform | null;
  disconnecting: SocialPlatform | null;
  showInstagramOptions: boolean;
  setShowInstagramOptions: (show: boolean) => void;
  handleConnect: (platform: SocialPlatform, options?: { useFacebook?: boolean }) => void;
  handleDisconnect: (platform: SocialPlatform) => void;
}

export function PlatformCard({
  platform,
  account,
  connecting,
  disconnecting,
  showInstagramOptions,
  setShowInstagramOptions,
  handleConnect,
  handleDisconnect,
}: PlatformCardProps) {
  const isLoading = connecting === platform.id || disconnecting === platform.id;
  return (
    <Card key={platform.id} className="p-6 relative">
      {account && !isLoading && (
        <div className="absolute top-4 right-4">
          {account.isActive ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-yellow-500" />
          )}
        </div>
      )}
      {isLoading && (
        <div className="absolute top-4 right-4">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      )}
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-12 h-12 rounded-lg ${platform.color} flex items-center justify-center`}>
          <platform.icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{platform.name}</h3>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? (connecting ? 'Connecting...' : 'Disconnecting...')
              : account
                ? `Connected as ${account.username}`
                : 'Not connected'}
          </p>
        </div>
      </div>
      {account && (
        <>
          {renderMetrics(platform.id, account.metadata)}
          <div className="mt-2 text-xs text-gray-500">
            Last updated: {formatDistanceToNow(new Date(account.updatedAt), { addSuffix: true })}
          </div>
        </>
      )}
      <p className="text-sm text-muted-foreground my-4">{platform.description}</p>
      <PlatformConnectButton
        platform={platform}
        account={account}
        connecting={connecting}
        disconnecting={disconnecting}
        showInstagramOptions={showInstagramOptions}
        setShowInstagramOptions={setShowInstagramOptions}
        handleConnect={handleConnect}
        handleDisconnect={handleDisconnect}
      />
    </Card>
  );
}
