import React from 'react';
import { Card } from '@/components/ui/card';
import { Instagram, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { ConnectedAccount } from './platform-utils';
import { fetchWithApiKey } from '@/app/lib/api-helpers';

interface InstagramPlatformCardProps {
  userId: string;
  account: ConnectedAccount | undefined;
  connecting: boolean;
  disconnecting: boolean;
  handleConnect: (options?: { useFacebook?: boolean }) => void;
  handleDisconnect: () => void;
}

export function InstagramPlatformCard({
  userId,
  account,
  connecting,
  disconnecting,
  handleDisconnect,
}: InstagramPlatformCardProps) {
  const isLoading = connecting || disconnecting;

  // Instagram OAuth using backend API (POST with userId)
  const handleInstagramConnect = async () => {
    try {
      const res = await fetchWithApiKey('/api/social/instagram/auth-url', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.auth_url || data.authUrl) {
        window.location.href = data.auth_url || data.authUrl;
      } else {
        alert('Failed to get Instagram auth URL.');
      }
    } catch (err) {
      alert('Error connecting to Instagram.');
    }
  };

  return (
    <Card className="p-6 relative">
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
        <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
          <Instagram className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Instagram</h3>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? connecting
                ? 'Connecting...'
                : 'Disconnecting...'
              : account
                ? `Connected as ${account.username}`
                : 'Not connected'}
          </p>
        </div>
      </div>
      <div className="text-sm text-gray-600 mb-2">
        Connect to analyze engagement and find opportunities, and more
      </div>
      
      <div className="mt-4">
        {account ? (
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={isLoading}
            className="w-full py-2 px-4 rounded-lg text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
            style={{ background: '#94A3B8' }}
          >
            {isLoading ? 'Disconnecting...' : 'Disconnect'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleInstagramConnect}
            disabled={isLoading}
            className="w-full py-2 px-4 rounded-lg text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153))' }}
          >
            {isLoading ? 'Connecting...' : 'Connect Instagram'}
          </button>
        )}
      </div>
      
      {/* Instagram metrics placeholder */}
      {account && account.metadata && (
        <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
          <div>Followers: {account.metadata.followers ?? 0}</div>
          <div>Posts: {account.metadata.posts ?? 0}</div>
        </div>
      )}
      
      {account && (
        <div className="mt-2 text-xs text-gray-400">
          Updated {account.updatedAt ? new Date(account.updatedAt).toLocaleString() : ''}
        </div>
      )}
    </Card>
  );
}
