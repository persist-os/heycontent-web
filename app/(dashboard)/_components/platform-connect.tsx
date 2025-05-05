import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { fetchWithAuth } from '@/app/lib/api-helpers';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { SocialPlatform } from '@/app/types/social-platforms';
import { PLATFORMS } from './platform-connect/platforms';
import { PlatformCard } from './platform-connect/PlatformCard';
import { isError, getAccountDetails, ConnectedAccount } from './platform-connect/platform-utils';

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
  const youtubeData = user?.uid ? useQuery(api.youtubeQueries.getYouTubeData, { userId: user.uid }) : undefined;
  const gmailData = user?.uid ? useQuery(api.gmail.getGmailData, { userId: user.uid }) : undefined;
  const socialAccounts = user?.uid ? useQuery(api.social.getConnectedAccounts, { userId: user.uid }) : undefined;

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
      // Add YouTube account from Convex
      if (youtubeData && !isError(youtubeData) && youtubeData !== null) {
        accounts.push({
          platform: 'youtube',
          username: youtubeData.data?.snippet?.title || 'YouTube Channel',
          metadata: {
            subscribers: youtubeData.subscriberCount,
            videos: youtubeData.videoCount,
            views: youtubeData.viewCount
          },
          updatedAt: youtubeData.timestamp,
          isActive: true
        });
      }
      // Add Gmail account from Convex
      if (gmailData && !isError(gmailData) && gmailData.socialAccount) {
        accounts.push({
          platform: 'gmail',
          username: gmailData.socialAccount.username,
          metadata: gmailData.socialAccount.metadata,
          updatedAt: gmailData.socialAccount.updatedAt,
          isActive: gmailData.socialAccount.isConnected
        });
      }
      // Add Instagram accounts from social accounts
      if (Array.isArray(socialAccounts)) {
        const instagramAccounts = socialAccounts.filter(acc => acc.platform === 'instagram');
        accounts.push(...instagramAccounts.map(acc => ({
          platform: acc.platform as SocialPlatform,
          username: acc.username,
          metadata: acc.metadata,
          updatedAt: acc.updatedAt,
          isActive: acc.isConnected
        })));
      }
      setConnectedAccounts(accounts);
    } catch (error) {
      console.error('Error fetching connected platforms:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add console logging for Convex responses
  useEffect(() => {
    console.log('YouTube Data:', youtubeData);
    console.log('Gmail Data:', gmailData);
    console.log('Social Accounts:', socialAccounts);
  }, [youtubeData, gmailData, socialAccounts]);

  // Update connected accounts when data changes
  useEffect(() => {
    fetchConnectedPlatforms();
  }, [youtubeData, gmailData, socialAccounts]);

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
  if (youtubeData === undefined || gmailData === undefined || socialAccounts === undefined) {
    return <div className="flex items-center justify-center h-40">Loading platform data...</div>;
  }
  if (isError(youtubeData)) {
    return <div className="text-red-500 p-4">Failed to load YouTube data: {youtubeData.error}</div>;
  }
  if (isError(gmailData)) {
    return <div className="text-red-500 p-4">Failed to load Gmail data: {gmailData.error}</div>;
  }
  if (isError(socialAccounts)) {
    return <div className="text-red-500 p-4">Failed to load social accounts: {socialAccounts.error}</div>;
  }
  if (youtubeData === null && gmailData === null && (!Array.isArray(socialAccounts) || socialAccounts.length === 0)) {
    return <div className="text-gray-500 p-4">No platform data found for your account.</div>;
  }

  const handleConnect = async (platform: SocialPlatform, options?: { useFacebook?: boolean }) => {
    try {
      setConnecting(platform);
      let url = `/api/social/auth-url?platform=${platform}`;
      if (options?.useFacebook !== undefined) {
        url += `&useFacebook=${options.useFacebook}`;
      }
      const response = await fetchWithAuth(url);
      if (!response) {
        throw new Error('No response from server');
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('No auth URL in response');
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast.error(`Failed to connect to ${platform}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setConnecting(null);
      setShowInstagramOptions(false);
    }
  };

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
        {PLATFORMS.map(platform => (
          <PlatformCard
            key={platform.id}
            platform={platform}
            account={getAccountDetails(connectedAccounts, platform.id)}
            connecting={connecting}
            disconnecting={disconnecting}
            showInstagramOptions={showInstagramOptions}
            setShowInstagramOptions={setShowInstagramOptions}
            handleConnect={handleConnect}
            handleDisconnect={handleDisconnect}
          />
        ))}
      </div>
    </div>
  );
}