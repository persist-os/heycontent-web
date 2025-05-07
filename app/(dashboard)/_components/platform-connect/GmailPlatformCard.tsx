// Written by Paing 

import React from 'react';
import { Card } from '@/src/components/ui/card';
import { Mail } from 'lucide-react';
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
  handleConnect,
  handleDisconnect,
  userId,
}: GmailPlatformCardProps) {
  const isLoading = connecting || disconnecting;

  // Gmail OAuth logic
  const handleGmailConnect = () => {
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}api/social/callback/gmail`,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.labels email profile',
      state: btoa(JSON.stringify({ userId, platform: 'gmail' })),
      access_type: 'offline',
      prompt: 'consent',
    });
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    window.location.href = googleAuthUrl;
  };

  return (
    <Card className="p-6 relative">
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
      {/* Placeholder for Gmail metrics */}
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
    </Card>
  );
}
