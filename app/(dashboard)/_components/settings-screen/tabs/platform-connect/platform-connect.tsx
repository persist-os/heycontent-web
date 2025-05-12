import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { fetchWithAuth } from '@/app/lib/api-helpers';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { SocialPlatform } from '@/app/types/social-platforms';
import { PLATFORMS } from './platforms';
import { YouTubePlatformCard } from './YouTubePlatformCard';
import { GmailPlatformCard } from './GmailPlatformCard';
import { InstagramPlatformCard } from './InstagramPlatformCard';
import { isError, getAccountDetails, ConnectedAccount } from './platform-utils';

export function PlatformConnect() {
  const { user } = useAuth();
  const [refetchKey, setRefetchKey] = useState(0);

  // Refetch on successful connection and clean up the URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'youtube_connected') {
      setRefetchKey(k => k + 1);
      // Remove the query param from the URL for clean UX
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Use Convex queries for all platform data
  const youtubeData = user?.uid ? useQuery(api.youtubeQueries.getYouTubeChannelData, { userId: user.uid }) : undefined;

  // All hooks must be declared at the top, before any return
  const [connecting, setConnecting] = useState<SocialPlatform | null>(null);
  const [disconnecting, setDisconnecting] = useState<SocialPlatform | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInstagramOptions, setShowInstagramOptions] = useState(false);

  // Define fetchConnectedPlatforms before using it in any hooks
  const fetchConnectedPlatforms = async () => {
    try {
      setLoading(true);
      const accounts: ConnectedAccount[] = [];
      // Add YouTube account from Convex using youtubeChannels table
      if (youtubeData && !isError(youtubeData) && youtubeData !== null) {
        accounts.push({
          platform: 'youtube',
          username: youtubeData.snippet?.title || 'YouTube Channel',
          metadata: {
            subscribers: youtubeData.statistics?.subscriberCount || '0',
            videos: youtubeData.statistics?.videoCount || '0',
            views: youtubeData.statistics?.viewCount || '0'
          },
          updatedAt: youtubeData.updatedAt || Date.now(),
          isActive: true
        });
      }

      setConnectedAccounts(accounts);
    } catch (error) {
      console.error('Error fetching connected platforms:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add console logging for Convex responses


  // Update connected accounts when data changes
  useEffect(() => {
    fetchConnectedPlatforms();
  }, [youtubeData]);

  // URL error handling effect
  useEffect(() => {
    // Check for error in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error === 'no_pages_found') {
      toast.error(
        'Facebook Page required. Please create a Facebook Page and connect it to your Instagram Professional account first.',
        { duration: 6000 }
      );
    }
  }, []);

  // Early error/fallback handling (AFTER all hooks)
  if (youtubeData === undefined) {
    return <div className="flex items-center justify-center h-40">Loading platform data...</div>;
  }
  if (isError(youtubeData)) {
    return <div className="text-red-500 p-4">Failed to load YouTube data: {youtubeData.error}</div>;
  }

  const handleDisconnect = async (platform: SocialPlatform) => {
    try {
      setDisconnecting(platform);
      const response = await fetchWithAuth('/api/social/disconnect', {
        method: 'POST',
        body: JSON.stringify({ platform })
      });
      if (!response) {
        throw new Error('No response from server');
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Refresh the connected platforms list
      await fetchConnectedPlatforms();
      toast.success(`Successfully disconnected ${platform}`);
    } catch (error) {
      console.error('Disconnection error:', error);
      toast.error(`Failed to disconnect ${platform}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDisconnecting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Platform Integrations</h2>
          <p className="text-muted-foreground">Loading connected platforms...</p>
        </div>
      </div>
    );
  }

  return (
    <div key={refetchKey} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Platform Integrations</h2>
        <p className="text-muted-foreground">
          Connect your social media accounts to unlock powerful analytics and insights.
          Content will help you track engagement, monitor growth, and identify opportunities across all your platforms.
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{connectedAccounts.length} of {PLATFORMS.length} platforms connected</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PLATFORMS.map(platform => {
          const account = getAccountDetails(connectedAccounts, platform.id);
          const isConnecting = connecting === platform.id;
          const isDisconnecting = disconnecting === platform.id;
          if (platform.id === 'youtube') {
            return (
              <YouTubePlatformCard
                key={platform.id}
                account={account}
                connecting={isConnecting}
                disconnecting={isDisconnecting}
                handleConnect={() => {}}
                handleDisconnect={() => handleDisconnect('youtube')}
                userId={user?.uid || ''}
              />
            );
          }
          if (platform.id === 'gmail') {
            return (
              <GmailPlatformCard
                key={platform.id}
                account={account}
                connecting={isConnecting}
                disconnecting={isDisconnecting}
                handleConnect={() => {}}
                handleDisconnect={() => handleDisconnect('gmail')}
                userId={user?.uid || ''}
              />
            );
          }
          if (platform.id === 'instagram') {
            return (
              <InstagramPlatformCard
                key={platform.id}
                userId={user?.uid || ''}
                account={account}
                connecting={isConnecting}
                disconnecting={isDisconnecting}
                showInstagramOptions={showInstagramOptions}
                setShowInstagramOptions={setShowInstagramOptions}
                // The handleConnect prop is intentionally set to a no-op function to disable the broken connect logic for Instagram.
                handleConnect={() => {}}
                handleDisconnect={() => handleDisconnect('instagram')}
              />
            );
          }
          // Skip rendering for unknown platforms
          return null;
        })}
      </div>
    </div>
  );
}