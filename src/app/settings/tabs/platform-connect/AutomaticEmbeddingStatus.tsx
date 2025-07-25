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
  const userHeartbeat = useAction(api.automaticEmbeddingSystem.userHeartbeat);

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Smart Search Knowledge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading sync status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!statusData?.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            Smart Search System Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Unable to load content sync status. Please try refreshing.
          </p>
          <Button onClick={fetchStatus} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { queueStatus, recentSync, embeddingCounts } = statusData;

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Smart Search Knowledge
            </CardTitle>
            <div className="flex items-center gap-2">
              {queueStatus.pending > 0 ? (
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  {queueStatus.pending} syncing
                </Badge>
              ) : (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  All synced
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Your content is automatically processed and stored as searchable knowledge for AI-powered insights and context. 
            Content syncs <b>every 2 minutes</b> while you're active and <b>automatically on login</b> to keep everything up to date.
          </div>

          {/* Queue Status */}
          {(queueStatus.pending > 0 || queueStatus.failed > 0) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Syncing Content</span>
                <span className="text-muted-foreground">
                  {queueStatus.pending} pending{queueStatus.failed > 0 && `, ${queueStatus.failed} retrying`}
                </span>
              </div>
              {queueStatus.total > 0 && (
                <Progress 
                  value={((queueStatus.total - queueStatus.pending) / queueStatus.total) * 100} 
                  className="h-2" 
                />
              )}
            </div>
          )}

          {/* Recent Sync Info */}
          {recentSync && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Last Update</span>
                <Badge variant="outline" className={cn(
                  recentSync.status === 'completed' ? 'border-green-500 text-green-700' :
                  recentSync.status === 'running' ? 'border-blue-500 text-blue-700' :
                  'border-red-500 text-red-700'
                )}>
                  {recentSync.status}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(recentSync.startedAt).toLocaleString()}
                {recentSync.itemsQueued > 0 && (
                  <span className="ml-2">• {recentSync.itemsQueued} items processed</span>
                )}
              </div>
            </div>
          )}

          {/* Auto-sync info */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Activity className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-400" />
              <div className="text-xs text-blue-800 dark:text-blue-200">
                <div className="font-medium mb-1">Automatic Syncing</div>
                <div>Content updates automatically every 2 minutes while you're active, and immediately when you log in. No manual action needed!</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Your Content Library
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="font-medium">Total Content Stored</span>
              <Badge variant="secondary">{embeddingCounts.total}</Badge>
            </div>
            
            {Object.entries(embeddingCounts.byPlatform).map(([platform, count]) => {
              const IconComponent = PLATFORM_ICONS[platform] || FileText;
              const label = PLATFORM_LABELS[platform] || platform;
              
              return (
                <div key={platform} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{label}</span>
                  </div>
                  <Badge variant="outline">{count}</Badge>
                </div>
              );
            })}
            
            {Object.keys(embeddingCounts.byPlatform).length > 0 && (
              <div className="pt-2 text-xs text-muted-foreground">
                All your content is available for smart search and AI-powered insights across the platform.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 