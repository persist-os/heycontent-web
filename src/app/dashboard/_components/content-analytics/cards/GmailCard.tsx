import React from 'react';
import { Card } from '@/components/ui/card';
import { MessageSquare, Mail, Users, CheckCircle, MousePointerClick, Eye, RefreshCw } from 'lucide-react';
import { useGmailRefresh } from '@/app/hooks/useGmailRefresh';

import { GmailContentItem } from '../types';

export interface GmailCardProps {
  item: GmailContentItem;
  onDiscussContent: (item: GmailContentItem) => void;
  onViewDetailedAnalytics: (item: GmailContentItem) => void;
}

export const GmailCard: React.FC<GmailCardProps> = ({ item, onDiscussContent, onViewDetailedAnalytics }) => {
  const { content, metrics, publishedAt } = item;
  const openRate = ((metrics?.openRate ?? 0) * 100).toFixed(1);
  const clickRate = ((metrics?.clickRate ?? 0) * 100).toFixed(1);

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
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg line-clamp-1" title={content.subject}>{content.subject}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate" title={content.from}>{content.from}</p>
            </div>
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(publishedAt).toLocaleDateString()}</span>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{content.snippet}</p>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-x-2 gap-y-2 text-sm mb-4 text-center">
          <div className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-300 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
            <Eye className="w-5 h-5 text-blue-500" />
            <span className="font-medium">{openRate}%</span>
            <span className="text-xs">Open Rate</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-300 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
            <MousePointerClick className="w-5 h-5 text-green-500" />
            <span className="font-medium">{clickRate}%</span>
            <span className="text-xs">Click Rate</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-300 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
            <MessageSquare className="w-4 h-4 text-orange-500" />
            <span className="font-medium">{(metrics?.replies ?? 0).toLocaleString()}</span>
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
