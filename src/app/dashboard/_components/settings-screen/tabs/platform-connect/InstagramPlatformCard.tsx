import React from 'react';
import { Card } from '@/components/ui/card';
import { Instagram } from 'lucide-react';
import { ConnectedAccount } from './platform-utils';
import { fetchWithApiKey } from '@/app/lib/api-helpers';

interface InstagramPlatformCardProps {
  userId: string;
  account: ConnectedAccount | undefined;
  connecting: boolean;
  disconnecting: boolean;
  showInstagramOptions: boolean;
  setShowInstagramOptions: (show: boolean) => void;
  handleConnect: (options?: { useFacebook?: boolean }) => void;
  handleDisconnect: () => void;
}

export function InstagramPlatformCard({
  userId,
  account,
  connecting,
  disconnecting,
  showInstagramOptions,
  setShowInstagramOptions,
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


  // Facebook Business Connect (if needed, can also be routed through backend for consistency)
  const handleFacebookConnect = () => {
    alert('Facebook Business connect coming soon!');
  };

  return (
    <Card className="p-6 relative">
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
      {/* Instagram connect options */}
      {!account && (
        <div className="space-y-2">
          {showInstagramOptions ? (
            <>
              <div className="space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
                {/* Placeholder connect options for Instagram */}
                <button
                  type="button"
                  onClick={handleInstagramConnect}
                  className="w-full py-2 px-4 rounded-lg text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153))' }}
                  disabled={isLoading}
                >
                  Connect Instagram
                </button>
                <button
                  type="button"
                  onClick={handleFacebookConnect}
                  className="w-full py-2 px-4 rounded-lg text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153))' }}
                  disabled={isLoading}
                >
                  Connect via Facebook Business
                </button>
                <button
                  type="button"
                  onClick={() => setShowInstagramOptions(false)}
                  className="w-full py-2 px-4 rounded-lg text-gray-600 bg-gray-200 hover:bg-gray-300 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowInstagramOptions(true)}
              disabled={isLoading}
              className="w-full py-2 px-4 rounded-lg text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153))' }}
            >
              {isLoading ? 'Connecting...' : 'Connect'}
            </button>
          )}
        </div>
      )}
      {/* Instagram metrics placeholder */}
      {account && account.metadata && (
        <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
          <div>Followers: {account.metadata.followers ?? 0}</div>
          <div>Posts: {account.metadata.posts ?? 0}</div>
          <div>Engagement: {account.metadata.engagement ?? 0}</div>
        </div>
      )}
      {account && (
        <>
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={isLoading}
            className="w-full py-2 px-4 rounded-lg text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 mt-4"
            style={{ background: '#94A3B8' }}
          >
            {isLoading ? 'Disconnecting...' : 'Disconnect'}
          </button>
          <div className="mt-2 text-xs text-gray-400">
            Updated {account.updatedAt ? new Date(account.updatedAt).toLocaleString() : ''}
          </div>
        </>
      )}
    </Card>
  );
}
