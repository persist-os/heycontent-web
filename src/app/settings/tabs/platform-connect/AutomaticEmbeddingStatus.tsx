'use client';

import React, { useState, useEffect } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  FileText, 
  MessageCircle,
  Gem,
  TrendingUp
} from 'lucide-react';
import { getCurrentUserId } from '@/app/lib/api-helpers';

const CONTENT_ICONS: Record<string, React.ComponentType<any>> = {
  notes: FileText,
  conversations: MessageCircle,
  crystals: Gem,
};

const CONTENT_LABELS: Record<string, string> = {
  notes: 'Notes',
  conversations: 'Conversations',
  crystals: 'Crystals'
};

export function AutomaticEmbeddingStatus() {
  const [countsData, setCountsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  const getEmbeddingCounts = useAction(api.userActions.getEmbeddingCounts);

  const fetchCounts = async (uid: string) => {
    try {
      setIsLoading(true);
      const counts = await getEmbeddingCounts({ userId: uid });
      setCountsData(counts);
    } catch (error) {
      console.error('Failed to fetch embedding counts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const initialize = async () => {
      try {
        const uid = await getCurrentUserId();
        if (mounted) {
          setUserId(uid);
          await fetchCounts(uid);
          
          // Refresh counts every 60 seconds
          const interval = setInterval(() => fetchCounts(uid), 60000);
          return interval;
        }
      } catch (error) {
        console.error('Failed to initialize embedding status:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    const intervalPromise = initialize();
    
    return () => {
      mounted = false;
      intervalPromise.then(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Smart Search Knowledge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading content...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!countsData?.success) {
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
            Unable to load content. Please try refreshing.
          </p>
          <Button 
            onClick={() => {
              if (userId) {
                fetchCounts(userId);
              }
            }} 
            variant="outline"
            disabled={!userId}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { total, byType } = countsData;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Your Content Library
          </CardTitle>
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Your content is automatically processed for AI-powered search and insights. 
          Embeddings are generated when you create notes, conversations, or crystals.
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="font-medium">Total Searchable Content</span>
            <Badge variant="outline">{total}</Badge>
          </div>
          
          {Object.entries(byType).map(([type, count]) => {
            const IconComponent = CONTENT_ICONS[type] || FileText;
            const label = CONTENT_LABELS[type] || type;
            
            return (
              <div key={type} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <IconComponent className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{label}</span>
                </div>
                <Badge variant="outline">{count as number}</Badge>
              </div>
            );
          })}
          
          {Object.keys(byType).length > 0 && (
            <div className="pt-2 text-xs text-muted-foreground">
              All your content is available for smart search and AI-powered insights.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 