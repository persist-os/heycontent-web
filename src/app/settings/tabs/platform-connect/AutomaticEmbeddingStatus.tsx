'use client';

import React, { useState, useEffect } from 'react';
import { useAction, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  FileText, 
  MessageCircle, 
  Youtube, 
  Instagram, 
  Mail, 
  Lightbulb,
  Activity,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutomaticEmbeddingStatusProps {
  userId: string;
}

const PLATFORM_ICONS: Record<string, React.ComponentType<any>> = {
  notes: FileText,
  conversations: MessageCircle,
  youtube: Youtube,
  instagram: Instagram,
  gmail: Mail,
  insights: Lightbulb
};

const PLATFORM_LABELS: Record<string, string> = {
  notes: 'Notes',
  conversations: 'Conversations',
  youtube: 'YouTube',
  instagram: 'Instagram',
  gmail: 'Gmail',
  insights: 'AI Insights'
};

export function AutomaticEmbeddingStatus({ userId }: AutomaticEmbeddingStatusProps) {
  const [statusData, setStatusData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const getEmbeddingStatus = useAction(api.userActions.getEmbeddingSyncStatus);
  const userHeartbeat = useAction(api.embeddingSystem.userHeartbeat);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const status = await getEmbeddingStatus({ userId });
      setStatusData(status);
    } catch (error) {
      console.error('Failed to fetch embedding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Heartbeat mechanism for active users
  useEffect(() => {
    if (!userId) return;

    // Initial sync call
    userHeartbeat({ userId }).catch(console.error);

    // Set up heartbeat every 1.5 minutes for more responsive queue processing
    const heartbeatInterval = setInterval(async () => {
      try {
        console.log('💓 [HEARTBEAT] Triggering sync for active user');
        await userHeartbeat({ userId });
        // Refresh status after heartbeat
        await fetchStatus();
      } catch (error) {
        console.error('Heartbeat sync failed:', error);
      }
    }, 90 * 1000); // 1.5 minutes - more frequent processing

    return () => clearInterval(heartbeatInterval);
  }, [userId, userHeartbeat]);

  useEffect(() => {
    fetchStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-medium text-foreground">Smart Search</h3>
          <p className="text-sm text-muted-foreground">
            Loading content intelligence status...
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-3 text-sm text-muted-foreground">Loading sync status...</span>
        </div>
      </div>
    );
  }

  if (!statusData?.success) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Smart Search Error
          </h3>
          <p className="text-sm text-muted-foreground">
            Unable to load content intelligence status
          </p>
        </div>
        
        <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200/30 dark:border-red-800/30 rounded-xl p-4">
          <p className="text-sm text-red-800 dark:text-red-200 mb-4">
            Unable to load content sync status. Please try refreshing.
          </p>
          <Button 
            onClick={fetchStatus} 
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-100/50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { queueStatus, lastUpdate, embeddingCounts } = statusData;

  return (
    <div className="space-y-8">
      {/* Smart Search Status */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-medium text-foreground">Smart Search</h3>
            <p className="text-sm text-muted-foreground">
              Your content is automatically processed for AI-powered search and insights
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {queueStatus.pending > 0 ? (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">{queueStatus.pending} syncing</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">All synced</span>
              </div>
            )}
          </div>
        </div>

        {/* Status indicator line */}
        <div className={`h-px bg-gradient-to-r from-transparent to-transparent ${
          queueStatus.pending > 0 
            ? 'via-amber-400/60' 
            : 'via-green-400/60'
        }`} />

        {/* Sync Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">Content Sync Status</span>
            <span className="text-muted-foreground">Active</span>
          </div>
          <Progress value={100} className="h-1.5" />
        </div>

        {/* Last Update */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Last Update</span>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-xs font-medium">Active</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {lastUpdate ? (
              <>
                Last sync: {new Date(lastUpdate.timestamp).toLocaleString()}
                {lastUpdate.itemsProcessed > 0 && (
                  <span className="ml-2">
                    • {lastUpdate.itemsSucceeded} items processed
                  </span>
                )}
              </>
            ) : (
              'No recent sync activity'
            )}
          </div>
        </div>

        {/* Auto-sync info */}
        <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/30 dark:border-blue-800/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Activity className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div className="space-y-1">
              <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Automatic Processing
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                Content updates automatically every 2 minutes while you're active, and immediately when you log in. No manual action needed.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />

      {/* Content Library */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-medium text-foreground">Content Library</h3>
          <p className="text-sm text-muted-foreground">
            Overview of your processed content available for search
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3">
            <span className="font-medium text-foreground">Total Content Stored</span>
            <div className="px-3 py-1 bg-muted/50 rounded-full text-sm font-medium">
              {String(embeddingCounts.total)}
            </div>
          </div>
          
          <div className="space-y-3">
            {Object.entries(embeddingCounts.byPlatform).map(([platform, count]) => {
              const IconComponent = PLATFORM_ICONS[platform] || FileText;
              const label = PLATFORM_LABELS[platform] || platform;
              
              return (
                <div key={platform} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{label}</span>
                  </div>
                  <div className="px-2 py-1 bg-muted/30 rounded text-xs font-medium text-muted-foreground">
                    {String(count)}
                  </div>
                </div>
              );
            })}
          </div>
          
          {Object.keys(embeddingCounts.byPlatform).length > 0 && (
            <div className="pt-3 text-xs text-muted-foreground leading-relaxed">
              All your content is available for smart search and AI-powered insights across the platform.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 