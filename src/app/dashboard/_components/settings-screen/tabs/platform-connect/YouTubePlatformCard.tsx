import React from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ConnectedAccount } from './platform-utils';
import { YouTubeBrandIcon } from '../../../YoutubeBrandIcon';

interface YouTubePlatformCardProps {
  account: ConnectedAccount | undefined;
  connecting: boolean;
  disconnecting: boolean;
  handleConnect: () => void;
  handleDisconnect: () => void;
  userId: string;
}

export function YouTubePlatformCard({
  account,
  connecting,
  disconnecting,
  handleDisconnect,
  userId,
}: YouTubePlatformCardProps) {
  const isLoading = connecting || disconnecting;

  // YouTube OAuth logic
  const handleYouTubeConnect = () => {
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      redirect_uri: `${process.env.NEXT_PUBLIC_BACKEND_URL}/youtube/oauth/callback`,
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.force-ssl',
        'openid',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ].join(' '),
      state: btoa(JSON.stringify({ userId, platform: 'youtube' })),
      access_type: 'offline',
      prompt: 'consent',
    });
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    window.location.href = googleAuthUrl;
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
        <div className="flex items-center justify-center">
          <YouTubeBrandIcon href="https://youtube.com/" className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">YouTube</h3>
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
        Track channel performance and subscriber growth and more
      </div>
      {account && account.metadata && (
        <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
          <div>Subscribers: {account.metadata.subscribers || 0}</div>
          <div>Videos: {account.metadata.videos || 0}</div>
          <div>Total Views: {account.metadata.views || 0}</div>
        </div>
      )}
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
            onClick={handleYouTubeConnect}
            disabled={isLoading}
            className="w-full py-2 px-4 rounded-lg text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
            style={{ background: '#dc2626' }}
          >
            {isLoading ? 'Connecting...' : 'Connect YouTube'}
          </button>
        )}
      </div>
      {account && (
        <div className="mt-2 text-xs text-gray-400">
          Updated {formatDistanceToNow(account.updatedAt, { addSuffix: true })}
        </div>
      )}
    </Card>
  );
}
