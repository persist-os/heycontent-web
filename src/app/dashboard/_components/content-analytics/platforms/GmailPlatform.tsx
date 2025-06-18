'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Mail } from 'lucide-react';
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

  // Show loading state if data is still loading
  if (loading) {
    return <LoadingState type="content" />;
  }

  // Show Gmail connect card if no Gmail account found
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <Card className="p-6 sm:p-8 max-w-md w-full bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-500 flex items-center justify-center">
              <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>
          
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
            Connect Your Gmail Account
          </h3>
          
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm leading-relaxed">
            Connect your Gmail account to view email analytics, track business communications, 
            and get insights on partnership opportunities.
          </p>
          
          <Button 
            onClick={() => router.push('/settings?tab=integrations')}
            className="w-full py-3 px-4 sm:px-6 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <Settings className="w-4 h-4" />
            Go to Integrations
          </Button>
          
          <div className="mt-3 sm:mt-4 text-xs text-gray-500">
            You can connect Gmail in Settings → Integrations
          </div>
        </Card>
      </div>
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
      {displayItems.length > 0 ? (
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
              Connect Your Gmail Account
            </h3>
            
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm leading-relaxed">
              Connect your Gmail account to view email analytics, track business communications, 
              and get insights on partnership opportunities.
            </p>
            
            <Button 
              onClick={() => router.push('/settings?tab=integrations')}
              className="w-full py-3 px-4 sm:px-6 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Settings className="w-4 h-4" />
              Go to Integrations
            </Button>
            
            <div className="mt-3 sm:mt-4 text-xs text-gray-500">
              You can connect Gmail in Settings → Integrations
            </div>
          </Card>
        </div>
      )}

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