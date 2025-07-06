'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Mail, RefreshCw } from 'lucide-react';
import { GmailCard } from '../cards/GmailCard';
import { GmailModal } from '../modals/GmailModal';
import { PlatformEmbeddingStatus } from '../components/PlatformEmbeddingStatus';
import { useGmailAnalytics } from '../hooks/useGmailAnalytics';
import { GmailContentItem, AnyContentItem } from '../types';
import { sortContent } from '../utils';
import { Skeleton } from '@/components/ui/skeleton';
import { PlatformConnectionPrompt } from '../../_components/content-hub/PlatformConnectionPrompt';
import { useGmailBatchRefresh } from '@/app/hooks/useGmailBatchRefresh';

interface GmailPlatformProps {
  userId: string;
  gmailItems: GmailContentItem[];
  loading: boolean;
  hasConnectedAccounts: boolean;
  error: string | null;
}

export function GmailPlatform({ 
  userId,
  gmailItems,
  loading,
  hasConnectedAccounts,
  error,
}: GmailPlatformProps) {
  const router = useRouter();
  const [selectedContent, setSelectedContent] = useState<GmailContentItem | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  // Use the batch Gmail refresh hook
  const { refresh, loading: refreshing, error: refreshError, success: refreshSuccess } = useGmailBatchRefresh();

  // Pass refreshCount to useGmailAnalytics to trigger refetch
  const { gmailItems: displayItems, loading: gmailLoading, hasConnectedAccounts: gmailConnected } = useGmailAnalytics(userId, refreshCount);

  // Sort items by date
  const displayItemsSorted = sortContent(gmailItems, 'date');

  const discussContent = async (item: AnyContentItem) => {
    try {
      // Create a compact context object to avoid URL length issues
      const context = {
        platform: item.platform,
        contentId: item.id,
        analysis: (item as any).aiAnalysis || null,
        title: (item as GmailContentItem).content?.data?.subject || 'Email Thread',
        thumbnailUrl: undefined,
        publishedAt: item.publishedAt,
        metrics: item.metrics,
        // For Gmail, create a compact content object with only essential fields
        content: {
          data: {
            subject: (item as GmailContentItem).content?.data?.subject || 'No Subject',
            from: (item as GmailContentItem).content?.data?.from || 'Unknown Sender',
            snippet: (item as GmailContentItem).content?.data?.snippet || 'No preview available',
            threadId: (item as GmailContentItem).content?.data?.threadId || (item as GmailContentItem).id,
            emailId: (item as GmailContentItem).content?.data?.emailId || (item as GmailContentItem).id,
            // Don't include the full payload to avoid URL length issues
          }
        }
      };
      
      const encodedContext = encodeURIComponent(JSON.stringify(context));
      
      // Check if the URL would be too long (browsers typically limit to ~2000 chars)
      const baseUrl = `/dashboard/chat?contentContext=`;
      const fullUrl = baseUrl + encodedContext;
      
      if (fullUrl.length > 1900) {
        // If URL is too long, use a more minimal context
        const minimalContext = {
          platform: item.platform,
          contentId: item.id,
          title: (item as GmailContentItem).content?.data?.subject || 'Email Thread',
          publishedAt: item.publishedAt,
          subject: (item as GmailContentItem).content?.data?.subject || 'No Subject',
          from: (item as GmailContentItem).content?.data?.from || 'Unknown Sender',
          threadId: (item as GmailContentItem).content?.data?.threadId || item.id,
        };
        const minimalEncoded = encodeURIComponent(JSON.stringify(minimalContext));
        router.push(`/dashboard/chat?contentContext=${minimalEncoded}`);
      } else {
        router.push(fullUrl);
      }
    } catch (error) {
      console.error('Error creating discussion context:', error);
      // Fallback: navigate to chat without context
      router.push('/dashboard/chat');
    }
  };

  const handleRefresh = async () => {
    // For batch refresh, call refresh with no arguments
    await refresh();
    setRefreshCount((c) => c + 1); // Trigger refetch
  };

  // Show Gmail connect card if no Gmail account found
  if (!hasConnectedAccounts) {
    return (
      <PlatformConnectionPrompt
        platformName="Gmail"
        platformIcon={
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-500 flex items-center justify-center">
            <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
        }
        description="Connect your Gmail account to view detailed analytics, track content performance, and get insights on your content strategy."
        buttonColor="bg-red-500"
        buttonHoverColor="hover:bg-red-600"
      />
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4 mb-8">
        <p>Error: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-2">Try Again</Button>
      </div>
    );
  }

  return (
    <>
      {/* Refresh Button (top right, consistent with other platforms) */}
      <div className="flex justify-end mb-4">
        <Button 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-white/80 hover:bg-white border border-gray-200 text-gray-700 hover:text-gray-900 backdrop-blur-sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Gmail'}
        </Button>
      </div>
      {refreshError && !refreshSuccess && (
        <div className="text-red-500 text-sm mb-2 text-center">{refreshError}</div>
      )}
      {refreshSuccess && (
        <div className="text-green-500 text-sm mb-2 text-center">Gmail emails refreshed!</div>
      )}
      {/* Platform Embedding Status */}
      <PlatformEmbeddingStatus 
        platform="gmail" 
        contentCount={displayItems.length} 
        userId={userId} 
      />

      {gmailLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col space-y-4">
              <div className="flex justify-between items-start">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
              <div className="flex justify-end items-center pt-4">
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : displayItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {displayItems.map((item, index) => {
            const uniqueKey = `${item.platform}-${item.id}-${index}`;
            return (
              <GmailCard
                key={uniqueKey}
                item={item as GmailContentItem}
                onDiscussContent={() => discussContent(item)}
                onViewDetailedAnalytics={() => setSelectedContent(item as GmailContentItem)}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-[400px] px-4">
          <Card className="p-6 sm:p-8 max-w-md w-full bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl text-center">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-500 flex items-center justify-center">
                <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
            
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
              No Emails Found
            </h3>
            
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm leading-relaxed">
              We couldn't find any emails in your connected Gmail account. 
              Try sending or receiving emails to see your analytics here.
            </p>
          </Card>
        </div>
      )}

      {selectedContent && (
        <GmailModal
          selectedContent={selectedContent}
          onClose={() => setSelectedContent(null)}
        />
      )}
    </>
  );
} 