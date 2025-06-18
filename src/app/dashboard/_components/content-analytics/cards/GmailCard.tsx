import React from 'react';
import { Card } from '@/components/ui/card';
import { MessageSquare, Mail, RefreshCw } from 'lucide-react';
import { useGmailRefresh } from '@/app/hooks/useGmailRefresh';

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

  const handleRefresh = async () => {
    // Use the correct threadId from the data structure and the first message ID
    const threadId = content.data?.threadId;
    const messageId = content.data?.emailId;
    if (threadId && messageId) {
      await refresh(threadId, messageId);
    }
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-blue-500/25 border-2 border-transparent hover:border-blue-500/30 bg-white dark:bg-gray-800">
      <div className="p-4">
        {/* Header with icon and date */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
              <Mail className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium text-text-dark dark:text-white">Email Thread</h3>
              <p className="text-sm text-text-gray dark:text-gray-400">{new Date(publishedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-4 mb-6">
          {/* Subject */}
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-600 dark:text-gray-400">Subject</span>
            <span className="font-medium text-gray-900 dark:text-white text-right max-w-[200px] truncate" title={subject}>
              {subject}
            </span>
          </div>

          {/* From */}
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-600 dark:text-gray-400">From</span>
            <span className="font-medium text-gray-900 dark:text-white text-right max-w-[200px] truncate" title={from}>
              {from}
            </span>
          </div>

          {/* Snippet */}
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-600 dark:text-gray-400">Preview</span>
            <span className="text-sm text-gray-700 dark:text-gray-300 text-right max-w-[200px] line-clamp-2" title={snippet}>
              {snippet}
            </span>
          </div>

          {/* Replies */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Replies</span>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-gray-900 dark:text-white">{replyCount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            className="flex-1 bg-heycontent-yellow hover:bg-heycontent-yellow/90 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            onClick={() => onDiscussContent(item)}
          >
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Discuss With Content
          </button>
          <button
            className={`relative px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-text-dark dark:text-white`}
            onClick={handleRefresh}
            disabled={loading}
            title={error ? `Refresh needed: ${error}` : "Refresh data"}
          >
            {/* Subtle error indicator dot */}
            {error && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            )}
            {loading ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
            ) : (
              <RefreshCw className={`w-4 h-4 ${error ? 'text-amber-600 dark:text-amber-400' : ''}`} />
            )}
          </button>
        </div>
      </div>
    </Card>
  );
};
