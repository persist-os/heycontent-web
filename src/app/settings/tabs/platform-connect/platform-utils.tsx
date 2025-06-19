import { SocialPlatform } from '@/app/types/social-platforms';
import React from 'react';

export interface ConnectedAccount {
  platform: SocialPlatform;
  username: string | null;
  metadata: any;
  updatedAt: number;
  isActive: boolean;
}

// Utility: error detection for API/Convex/network
export function isError(data: any): data is { error: string } {
  return data && typeof data === 'object' && 'error' in data;
}

// Utility: get account details by platform
export function getAccountDetails(accounts: ConnectedAccount[], platform: string) {
  return accounts.find(account => account.platform === platform);
}

// Utility: render metrics per platform
export function renderMetrics(platform: string, metadata: any): React.ReactNode {
  if (!metadata) return null;
  switch (platform) {
    case 'youtube':
      return (
        <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
          <div>Subscribers: {metadata.subscribers || 0}</div>
          <div>Videos: {metadata.videos || 0}</div>
          <div>Total Views: {metadata.views || 0}</div>
        </div>
      );
    case 'gmail':
      return (
        <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
          <div>Total Messages: {metadata.messagesTotal || 0}</div>
          <div>Total Threads: {metadata.threadsTotal || 0}</div>
        </div>
      );
    default:
      return null;
  }
}
