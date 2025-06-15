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
    <Card className="p-6 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300">
      {/* Header with icon and date */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/20">
            <Mail className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Email Thread</h3>
        </div>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {new Date(publishedAt).toLocaleDateString()}
        </span>
      </div>

      {/* Content Section */}
      <div className="space-y-4">
        {/* Subject */}
        <div className="flex justify-between items-start">
          <span className="text-sm text-gray-600">Subject</span>
          <span className="font-medium text-gray-900 text-right max-w-[200px] truncate" title={subject}>
            {subject}
          </span>
        </div>

        {/* From */}
        <div className="flex justify-between items-start">
          <span className="text-sm text-gray-600">From</span>
          <span className="font-medium text-gray-900 text-right max-w-[200px] truncate" title={from}>
            {from}
          </span>
        </div>

        {/* Snippet */}
        <div className="flex justify-between items-start">
          <span className="text-sm text-gray-600">Preview</span>
          <span className="text-sm text-gray-700 text-right max-w-[200px] line-clamp-2" title={snippet}>
            {snippet}
          </span>
        </div>

        {/* Replies */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Replies</span>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-gray-900">{replyCount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button
          className="flex-1 px-4 py-2 rounded-xl border border-blue-500/20 text-blue-600 hover:bg-blue-50 transition-colors duration-200 text-sm font-medium"
          onClick={() => onDiscussContent(item)}
        >
          <MessageSquare className="w-4 h-4 inline mr-2" />
          Discuss
        </button>
        <button
          className="px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200 text-sm font-medium flex items-center gap-2"
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh
        </button>
      </div>
      
      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-xs text-red-600">{error}</span>
        </div>
      )}
    </Card>
  );
};
