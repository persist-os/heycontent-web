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
  console.log('GmailCard item:', item);

  const { content, metrics, publishedAt } = item;

  // Get the actual data from the Gmail thread
  const subject = content.subject || (item as any).data?.messages?.[0]?.subject || 'No Subject';
  const from = content.from || (item as any).data?.messages?.[0]?.from || 'Unknown Sender';
  const snippet = content.snippet || (item as any).snippet || 'No preview available';
  const replyCount = metrics?.replies ?? ((item as any).message_count ? (item as any).message_count - 1 : 0);

  // Use the Gmail refresh hook
  const { refresh, loading, error } = useGmailRefresh();

  const handleRefresh = async () => {
    // Use item.content.thread?.threadId as threadId and item.id as emailId
    await refresh(item.content.thread?.threadId || '', item.id);
  };

  return (
    <Card key={item.id} className="overflow-hidden border-2 border-blue-500 dark:border-blue-400 shadow-lg">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-500" />
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(publishedAt).toLocaleDateString()}</span>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{snippet}</p>

        {/* Subject, From on left, Replies card on right */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 space-y-1 min-w-0 pr-4">
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">Subject: </span>
              <span className="text-gray-800 dark:text-gray-200 font-medium" title={subject}>
                {subject}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">From: </span>
              <span className="text-gray-800 dark:text-gray-200" title={from}>
                {from}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-800 rounded-md min-w-[80px] flex-shrink-0">
            <MessageSquare className="w-4 h-4 text-orange-500" />
            <span className="font-medium">{replyCount.toLocaleString()}</span>
            <span className="text-xs">Replies</span>
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          <button
            className="px-3 py-1 rounded text-white hover:opacity-90 text-xs transition-opacity"
            style={{ backgroundColor: '#4715C8' }}
            onClick={() => onViewDetailedAnalytics(item)}
          >
            View Analytics
          </button>
          <button
            className="px-3 py-1 rounded border text-xs hover:opacity-90 transition-opacity"
            style={{ borderColor: '#4715C8', color: '#4715C8' }}
            onClick={() => onDiscussContent(item)}
          >
            Discuss
          </button>
          <button
            className="px-3 py-1 rounded text-black hover:opacity-90 text-xs flex items-center gap-1 transition-opacity"
            style={{ backgroundColor: '#BAA9FC' }}
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
          {error && <span className="text-xs text-red-500 ml-2">{error}</span>}
        </div>
      </div>
    </Card>
  );
};
