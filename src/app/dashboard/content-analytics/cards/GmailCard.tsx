import React from 'react';
import { Card } from '@/components/ui/card';
import { MessageSquare, Mail, RefreshCw } from 'lucide-react';
import { useGmailRefresh } from '@/app/hooks/useGmailRefresh';
import { useRouter } from 'next/navigation';
import { useContentContextActions } from '@/store/content-context-store';

import { GmailContentItem } from '../types';

export interface GmailCardProps {
  item: GmailContentItem;
  onDiscussContent: (item: GmailContentItem) => void;
  onViewDetailedAnalytics: (item: GmailContentItem) => void;
}

export const GmailCard: React.FC<GmailCardProps> = ({ item, onDiscussContent, onViewDetailedAnalytics }) => {
  const { content, metrics, publishedAt } = item;

  // Access the data that's been properly mapped in ContentAnalyticsScreen
  const subject = content.data?.subject || 'No Subject';
  const from = content.data?.from || 'Unknown Sender';
  const snippet = content.data?.snippet || 'No preview available';
  const replyCount = metrics?.replies ?? 0;

  // Use the Gmail refresh hook
  const { refresh, loading, error } = useGmailRefresh();
  
  const router = useRouter();
  const { setGmailContext } = useContentContextActions();

  const handleRefresh = async () => {
    // Use the correct threadId from the data structure and the first message ID
    const threadId = content.data?.threadId;
    const messageId = content.data?.emailId;
    if (threadId && messageId) {
      await refresh(threadId, messageId);
    }
  };

  // Handle discuss content with Zustand store
  const handleDiscussContent = () => {
    // Use the full Convex document if available, otherwise create a fallback
    if (item.convexData) {
      // Use the complete Convex document with all fields
      console.log('🔍 [GMAIL CARD] Using full Convex document:', {
        hasData: !!item.convexData.data,
        dataKeys: item.convexData.data ? Object.keys(item.convexData.data) : 'none',
        fullConvexData: item.convexData
      });
      
      setGmailContext(item.convexData);
    } else {
      // Fallback to creating a mock object (shouldn't happen with proper data)
      console.warn('🔍 [GMAIL CARD] No convexData available, using fallback mock object');
      
      // Create a mock Convex document structure
      const mockConvexData = {
        _id: item.id as any,
        _creationTime: Date.now(),
        userId: '',
        gmailAccountId: '',
        threadId: content.data?.threadId || item.id,
        subject: content.data?.subject || 'No Subject',
        from: content.data?.from || 'Unknown',
        snippet: content.data?.snippet || '',
        message_count: metrics?.replies || 0,
        messages: content.data?.messages || [],
        data: content.data || {},
        analysis: item.analysis || null,
        createdAt: new Date(publishedAt).getTime(),
        updatedAt: Date.now(),
      };

      setGmailContext(mockConvexData as any);
    }
    
    // Navigate to chat
    router.push('/dashboard/chat');
  };

  // Make the card clickable for full view
  const handleCardClick = () => {
    onViewDetailedAnalytics(item);
  };

  return (
    <Card
      className="overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-blue-500/25 border-2 border-transparent hover:border-blue-500/30 bg-background dark:bg-background"
      onClick={handleCardClick}
      tabIndex={0}
      role="button"
      aria-label="Open full email view"
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
    >
      <div className="p-4">
        {/* Header with icon and date */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted dark:bg-muted">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Email Thread</h3>
              <p className="text-sm text-muted-foreground">{new Date(publishedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-4 mb-6">
          {/* Subject */}
          <div className="flex justify-between items-start">
            <span className="text-sm text-muted-foreground">Subject</span>
            <span className="font-medium text-foreground text-right max-w-[200px] truncate" title={subject}>
              {subject}
            </span>
          </div>

          {/* From */}
          <div className="flex justify-between items-start">
            <span className="text-sm text-muted-foreground">From</span>
            <span className="font-medium text-foreground text-right max-w-[200px] truncate" title={from}>
              {from}
            </span>
          </div>

          {/* Snippet */}
          <div className="flex justify-between items-start">
            <span className="text-sm text-muted-foreground">Preview</span>
            <span className="text-sm text-muted-foreground text-right max-w-[200px] line-clamp-2" title={snippet}>
              {snippet}
            </span>
          </div>

          {/* Replies */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Replies</span>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">{replyCount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            className="flex-1 bg-primary text-primary-foreground dark:text-black hover:bg-primary/90 hover:text-primary-foreground dark:hover:text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            onClick={e => { e.stopPropagation(); onDiscussContent(item); }}
            tabIndex={0}
            aria-label="Discuss with Content"
          >
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Discuss With Content
          </button>
          <button
            className="relative px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 bg-muted hover:bg-muted text-foreground"
            onClick={e => { e.stopPropagation(); handleRefresh(); }}
            disabled={loading}
            title={error ? `Refresh needed: ${error}` : "Refresh data"}
            tabIndex={0}
            aria-label="Refresh Gmail"
          >
            {error && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
            )}
            {loading ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
            ) : (
              <RefreshCw className={`w-4 h-4 ${error ? 'text-destructive' : ''}`} />
            )}
          </button>
        </div>
      </div>
    </Card>
  );
};
