'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GmailCard } from '../cards/GmailCard';
import { GmailModal } from '../modals/GmailModal';
import { LoadingState } from '../loading/LoadingState';
import { useGmailAnalytics } from '../hooks/useGmailAnalytics';
import { GmailContentItem, AnyContentItem } from '../types';
import { sortContent } from '../utils';

interface GmailPlatformProps {
  userId: string;
  selectedPlatform: 'gmail' | 'all';
}

export function GmailPlatform({ userId, selectedPlatform }: GmailPlatformProps) {
  const router = useRouter();
  const [selectedContent, setSelectedContent] = useState<GmailContentItem | null>(null);
  
  const { items, loading, error, isConnected } = useGmailAnalytics(userId);

  // Sort items by date
  const displayItems = sortContent(items, 'date');

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
          title: context.title,
          publishedAt: item.publishedAt,
          // For Gmail, include only the most essential data
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

  // Show loading state if data is still loading
  if (loading) {
    return <LoadingState type="content" />;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
        {displayItems.length > 0 ? (
          displayItems.map((item, index) => {
            const uniqueKey = `${item.platform}-${item.id}-${index}`;
            return (
              <GmailCard
                key={uniqueKey}
                item={item as GmailContentItem}
                onDiscussContent={() => discussContent(item)}
                onViewDetailedAnalytics={() => setSelectedContent(item as GmailContentItem)}
              />
            );
          })
        ) : (
          <div className="col-span-full text-center py-10 text-text-gray dark:text-gray-400">
            <div className="space-y-2">
              <p className="text-lg font-medium">No Gmail content found</p>
              <p className="text-sm">Connect your Gmail account to see email analytics and insights.</p>
              <p className="text-xs text-gray-500">
                Only meaningful emails are stored and displayed for better content analysis.
              </p>
            </div>
          </div>
        )}
      </div>

      {selectedContent && (
        <GmailModal
          selectedContent={selectedContent}
          onClose={() => setSelectedContent(null)}
          onDiscussContent={() => discussContent(selectedContent)}
        />
      )}
    </>
  );
} 