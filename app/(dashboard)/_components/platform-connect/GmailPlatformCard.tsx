// Aria + Paing

import React from 'react';
import { Card } from '@/src/components/ui/card';
import { Mail, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ConnectedAccount } from './platform-utils';

interface GmailPlatformCardProps {
  account: ConnectedAccount | undefined;
  connecting: boolean;
  disconnecting: boolean;
  handleConnect: () => void;
  handleDisconnect: () => void;
  userId: string;
}

export function GmailPlatformCard({
  account,
  connecting,
  disconnecting,
  handleDisconnect,
  userId,
}: GmailPlatformCardProps) {
  const isLoading = connecting || disconnecting;

  // Gmail OAuth logic
  const handleGmailConnect = () => {
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/social/callback/gmail`,
      response_type: 'code',
      scope: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.modify",
        "https://www.googleapis.com/auth/gmail.send",
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile"
      ].join(' '),
      state: btoa(JSON.stringify({ userId, platform: 'gmail' })),
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
        <div className="w-12 h-12 rounded-lg bg-red-500 flex items-center justify-center">
          <Mail className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Gmail</h3>
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
        Manage partnerships and business communications and more
      </div>
      {account && account.metadata && (
        <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
          <div>Emails: {account.metadata.emails || 0}</div>
          <div>Labels: {account.metadata.labels || 0}</div>
          <div>Threads: {account.metadata.threads || 0}</div>
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
            onClick={handleGmailConnect}
            disabled={isLoading}
            className="w-full py-2 px-4 rounded-lg text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
            style={{ background: '#ef4444' }}
          >
            {isLoading ? 'Connecting...' : 'Connect Gmail'}
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
