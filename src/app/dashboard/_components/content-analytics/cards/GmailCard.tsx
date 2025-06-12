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

  // Get the actual data from the Gmail thread
  const { subject = 'No Subject', from = 'Unknown Sender', snippet = 'No preview available' } = content.data || {};
  const replyCount = metrics?.replies ?? 0;

  // Use the Gmail refresh hook
  const { refresh, loading, error } = useGmailRefresh();

  const handleRefresh = async () => {
    // Use the real Gmail thread ID and message ID
    await refresh(item.content.data.threadId, item.content.data.emailId);
  };

  return (
    <Card key={item.id} className="overflow-hidden border-2 border-blue-500 dark:border-blue-400 shadow-lg rounded-xl mb-4">
      <div className="p-4 flex flex-col gap-2">
        {/* Top Row */}
        <div className="flex items-center justify-between">
          <Mail className="w-5 h-5 text-blue-500" />
          <span className="text-xs text-gray-500">{new Date(publishedAt).toLocaleDateString()}</span>
        </div>

        {/* Snippet */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1 line-clamp-2">{snippet}</p>

        {/* Info and Replies */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">Subject: </span>
              <span className="text-gray-800 dark:text-gray-200 font-medium" title={subject}>{subject}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">From: </span>
              <span className="text-gray-800 dark:text-gray-200" title={from}>{from}</span>
            </div>
          </div>
          <div className="flex flex-row sm:flex-col items-center gap-1 bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2 min-w-[80px]">
            <MessageSquare className="w-4 h-4 text-orange-500" />
            <span className="font-medium">{replyCount.toLocaleString()}</span>
            <span className="text-xs">Replies</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <button
            className="w-full sm:w-auto px-3 py-2 rounded border text-xs font-semibold border-[#4715C8] text-[#4715C8] hover:bg-[#4715C8]/10 transition"
            onClick={() => onDiscussContent(item)}
          >
            Discuss
          </button>
          <button
            className="w-full sm:w-auto px-3 py-2 rounded text-black text-xs font-semibold bg-[#BAA9FC] hover:opacity-90 flex items-center justify-center gap-1 transition"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </button>
        </div>
        {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
      </div>
    </Card>
  );
};
