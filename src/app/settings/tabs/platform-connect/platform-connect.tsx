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
import { AutomaticEmbeddingStatus } from './AutomaticEmbeddingStatus';
import { isError, getAccountDetails, ConnectedAccount } from './platform-utils';
import { AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';

export function PlatformConnect() {
  const { firebaseUser } = useAuth();
  const [refetchKey, setRefetchKey] = useState(0);

  // Refetch on successful connection and clean up the URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'youtube_connected' || urlParams.get('success') === 'instagram_connected') {
      setRefetchKey(k => k + 1);
      // Remove the query param from the URL for clean UX
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Use Convex queries for all platform data
  const youtubeData = useQuery(api.youtubeQueries.getYouTubeChannelData, firebaseUser?.uid ? { userId: firebaseUser.uid } : 'skip');
  const instagramData = useQuery(api.instagramQueries.getInstagramAccount, firebaseUser?.uid ? { userId: firebaseUser.uid } : 'skip');
  const gmailAccounts = useQuery(api.gmailQueries.getGmailAccounts, firebaseUser?.uid ? { userId: firebaseUser.uid } : 'skip');

  // Add console logging for Convex responses
  useEffect(() => {
    console.log('Instagram data from Convex:', instagramData);
  }, [instagramData]);

  // All hooks must be declared at the top, before any return
  const [connecting, setConnecting] = useState<SocialPlatform | null>(null);
  const [disconnecting, setDisconnecting] = useState<SocialPlatform | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInstagramOptions, setShowInstagramOptions] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  


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

      // Add Instagram accounts from Convex
      if (instagramData && !isError(instagramData) && instagramData !== null) {
        // If multiple accounts, use the first one for now (we can improve this later)
        const instagramAccount = instagramData;
        accounts.push({
          platform: 'instagram',
          username: instagramAccount.username || 'Instagram Account',
          metadata: {
            followers: instagramAccount.profileData.followers_count || '0',
            following: instagramAccount.profileData.follows_count || '0',
            posts: instagramAccount.profileData.media_count || '0'
          },
          updatedAt: instagramAccount.updatedAt || Date.now(),
          isActive: true
        });
      }

      // Add Gmail accounts from Convex
      if (gmailAccounts && !isError(gmailAccounts) && gmailAccounts.length > 0) {
        // Use the first Gmail account for now (can support multiple later)
        const gmailAccount = gmailAccounts[0];
        accounts.push({
          platform: 'gmail',
          username: gmailAccount.email || 'Gmail Account',
          metadata: {
            emails: gmailAccount.messagesTotal || 0,
            labels: gmailAccount.labelsTotal || 0,
            threads: gmailAccount.threadsTotal || 0
          },
          updatedAt: gmailAccount.updatedAt || Date.now(),
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

  // Update connected accounts when data changes
  useEffect(() => {
    fetchConnectedPlatforms();
  }, [youtubeData, instagramData, gmailAccounts]);

  // URL error handling effect
  useEffect(() => {
    // Check for error in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const platform = urlParams.get('platform');
    const message = urlParams.get('message');
    
    if (error === 'account_already_connected' && platform && message) {
      const platformNames = {
        instagram: 'Instagram',
        youtube: 'YouTube', 
        gmail: 'Gmail'
      };
      
      toast.error(
        `${platformNames[platform]} Connection Failed: ${decodeURIComponent(message)}`,
        { 
          duration: 8000,
          style: {
            maxWidth: '500px'
          }
        }
      );
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error === 'no_pages_found') {
      toast.error(
        'Facebook Page required. Please create a Facebook Page and connect it to your Instagram Professional account first.',
        { duration: 6000 }
      );
    }
  }, []);

  // Early error/fallback handling (AFTER all hooks)
  // if (youtubeData === undefined || instagramData === undefined) {
  //   return <div className="flex items-center justify-center h-40">Loading platform data...</div>;
  // }
  if (isError(youtubeData)) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">Platform Integrations</h2>
          <p className="text-muted-foreground">We're having trouble loading your YouTube data.</p>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Failed to load YouTube data: {youtubeData.error}</span>
          </div>
        </div>
      </div>
    );
  }
  if (isError(instagramData)) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">Platform Integrations</h2>
          <p className="text-muted-foreground">We're having trouble loading your Instagram data.</p>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Failed to load Instagram data: {instagramData.error}</span>
          </div>
        </div>
      </div>
    );
  }

  // Handle disconnecting a platform

  const handleDisconnect = async (platform: SocialPlatform) => {
    try {
      setDisconnecting(platform);
      
      // Use unified HTTP endpoint for all platforms
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
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">Platform Integrations</h2>
          <p className="text-muted-foreground">Connecting you to your favorite platforms...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted/50 rounded-lg border border-border/30 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div key={refetchKey} className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">Platform Integrations</h2>
          <p className="text-muted-foreground max-w-3xl">
            Connect your social media accounts to unlock powerful analytics and insights.
            Content will help you track engagement, monitor growth, and identify opportunities across all your platforms.
          </p>
        </div>
        <button
          onClick={() => {
            const element = document.querySelector('[data-content-memory]');
            element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors bg-muted/50 hover:bg-muted/80 rounded-lg border border-muted-foreground/20 hover:border-muted-foreground/40"
          title="Scroll to Content Memory section"
        >
          <span>Content Memory</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </div>
      
      {/* Connection Status */}
      <div className="bg-muted/50 p-4 rounded-lg border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-medium">Connection Status</h3>
            <p className="text-sm text-muted-foreground">
              {connectedAccounts.length} of {PLATFORMS.length} platforms connected
            </p>
          </div>
          <div className="w-full sm:w-48 h-2 bg-background rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-700 ease-out"
              style={{ 
                width: `${(connectedAccounts.length / PLATFORMS.length) * 100}%`,
                background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.8) 100%)',
                borderRadius: '9999px'
              }}
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                userId={firebaseUser?.uid || ''}
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
                userId={firebaseUser?.uid || ''}
              />
            );
          }
          if (platform.id === 'instagram') {
            return (
              <InstagramPlatformCard
                key={platform.id}
                userId={firebaseUser?.uid || ''}
                account={account}
                connecting={isConnecting}
                disconnecting={isDisconnecting}
                showInstagramOptions={showInstagramOptions}
                setShowInstagramOptions={setShowInstagramOptions}
                handleConnect={() => setConnecting('instagram')}
                handleDisconnect={() => handleDisconnect('instagram')}
              />
            );
          }
          // Skip rendering for unknown platforms
          return null;
        })}
      </div>
      
      {/* Coming Soon Section */}
      <div className="space-y-4">
        <button
          onClick={() => setShowComingSoon(!showComingSoon)}
          className="flex items-center gap-2 text-left hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
        >
          {showComingSoon ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <div className="space-y-1">
            <h3 className="text-lg font-medium text-foreground">Coming Soon</h3>
            <p className="text-sm text-muted-foreground">
              We're working on bringing you more platform integrations
            </p>
          </div>
        </button>
        
        {showComingSoon && (
          <div className="bg-muted/30 border border-dashed border-muted-foreground/20 rounded-lg p-6">
            <div className="text-center space-y-3">
              <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
                <span className="px-3 py-1 bg-background/60 rounded-full border border-muted-foreground/10">
                  𝕏 / Twitter
                </span>
                <span className="px-3 py-1 bg-background/60 rounded-full border border-muted-foreground/10">
                  TikTok
                </span>
                <span className="px-3 py-1 bg-background/60 rounded-full border border-muted-foreground/10">
                  Pinterest
                </span>
                <span className="px-3 py-1 bg-background/60 rounded-full border border-muted-foreground/10">
                  + More
                </span>
              </div>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Get notified when these platforms become available to help you analyze and grow your content across all channels
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* AI Search Intelligence Section */}
      <div data-content-memory>
        {firebaseUser?.uid && <AutomaticEmbeddingStatus userId={firebaseUser.uid} />}
      </div>
    </div>
  );
}