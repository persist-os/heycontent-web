import React from 'react';
import { Card } from '@/src/components/ui/card';
import { 
  X, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Clock, 
  Share2, 
  ExternalLink 
} from 'lucide-react';
import { ContentItem } from '../types';

interface DetailedAnalyticsModalProps {
  selectedContent: ContentItem;
  onClose: () => void;
  onDiscussContent: (item: ContentItem) => void;
}

export const DetailedAnalyticsModal: React.FC<DetailedAnalyticsModalProps> = ({
  selectedContent,
  onClose,
  onDiscussContent
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */} 
        <div className="px-6 py-4 border-b dark:border-gray-800 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-medium text-black dark:text-white">Detailed Analytics</h2>
            <p className="text-sm text-text-gray dark:text-gray-400">
              {/* Capitalize platform and type */}
              {selectedContent.platform.charAt(0).toUpperCase() + selectedContent.platform.slice(1)} • {selectedContent.type.charAt(0).toUpperCase() + selectedContent.type.slice(1)}
            </p>
          </div>
          <button 
            aria-label="Close"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */} 
        <div className="p-6 overflow-y-auto flex-grow">
          <div className="space-y-6">
            {/* Content Preview */} 
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-start gap-4">
                {/* Use thumbnail for YT, mediaUrl for others */} 
                {(selectedContent.content.thumbnail || selectedContent.content.mediaUrl) && (
                  <img 
                    src={selectedContent.content.thumbnail || selectedContent.content.mediaUrl}
                    alt="Content thumbnail" 
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div>
                  <h3 className="font-medium text-black dark:text-white mb-2">
                    {/* Subject for email, text otherwise */} 
                    {selectedContent.platform === 'gmail' 
                      ? selectedContent.content.subject 
                      : selectedContent.content.text}
                  </h3>
                  <p className="text-sm text-text-gray dark:text-gray-400">
                    {/* Nicer date and type display */} 
                    Published {selectedContent.publishedAt ? new Date(selectedContent.publishedAt).toLocaleDateString() : 'Date unknown'} • {
                      selectedContent.content.emailType 
                        ? `${selectedContent.content.emailType.charAt(0).toUpperCase() + selectedContent.content.emailType.slice(1)} Email`
                        : `${selectedContent.type.charAt(0).toUpperCase() + selectedContent.type.slice(1)}`
                    }
                  </p>
                  {/* Add link to original content if possible */} 
                  {selectedContent.platform === 'youtube' && (
                    <a 
                      href={`https://www.youtube.com/watch?v=${selectedContent.id}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-heycontent-purple hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      View on YouTube <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Performance Metrics - General */} 
            <div>
              <h3 className="text-base font-medium mb-4 text-black dark:text-white">Performance Overview</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-heycontent-light-yellow rounded-lg">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-text-gray dark:text-gray-400">
                        {selectedContent.platform === 'gmail' ? 'Opens' : 'Views'}
                      </p>
                      <p className="text-lg font-medium">{selectedContent.metrics.views?.toLocaleString() || 'N/A'}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-heycontent-light-yellow rounded-lg">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-text-gray dark:text-gray-400">Engagement</p>
                      <p className="text-lg font-medium">{selectedContent.metrics.engagement?.toFixed(1) || 'N/A'}%</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-heycontent-light-yellow rounded-lg">
                      <MessageSquare className="w-5 h-5" /> 
                    </div>
                    <div>
                      <p className="text-sm text-text-gray dark:text-gray-400">
                        {selectedContent.platform === 'gmail' ? 'Replies' : 'Comments'}
                      </p>
                      <p className="text-lg font-medium">{selectedContent.metrics.comments?.toLocaleString() || selectedContent.metrics.replies?.toLocaleString() || 'N/A'}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-heycontent-light-yellow rounded-lg">
                      {/* Use Clock for email response time, Shares for others? */}
                      {selectedContent.platform === 'gmail' && selectedContent.metrics.responseTime ? <Clock className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm text-text-gray dark:text-gray-400">
                        {selectedContent.platform === 'gmail' ? 
                          (selectedContent.metrics.responseTime ? 'Avg. Response' : 'Shares') // Fallback if no responseTime
                          : 'Shares'}
                      </p>
                      <p className="text-lg font-medium">
                        {selectedContent.platform === 'gmail' && selectedContent.metrics.responseTime ? `${selectedContent.metrics.responseTime}h` : (selectedContent.metrics.shares?.toLocaleString() || 'N/A')}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Platform-specific Metrics */} 
            {selectedContent.platform === 'gmail' ? (
              <div>
                <h3 className="text-base font-medium mb-4 text-black dark:text-white">Email Metrics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h4 className="text-sm font-medium mb-1">Open Rate</h4>
                    <p className="text-2xl font-semibold mb-3">{selectedContent.metrics.openRate?.toFixed(1) || 'N/A'}%</p>
                    {/* Placeholder for graph */}
                    <div className="h-32 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <p className="text-xs text-text-gray">Open Rate Over Time (Chart)</p>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <h4 className="text-sm font-medium mb-1">Click Rate</h4>
                    <p className="text-2xl font-semibold mb-3">{selectedContent.metrics.clickRate?.toFixed(1) || 'N/A'}%</p>
                    {/* Placeholder for graph */}
                    <div className="h-32 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <p className="text-xs text-text-gray">Click Distribution (Chart)</p>
                    </div>
                  </Card>
                  {/* Add Deal Value / Thread Info if relevant */} 
                  {selectedContent.content.emailType === 'partnership' && selectedContent.metrics.dealValue && (
                    <Card className="p-4 sm:col-span-2">
                      <h4 className="text-sm font-medium mb-1">Deal Value</h4>
                      <p className="text-2xl font-semibold">${selectedContent.metrics.dealValue.toLocaleString()}</p>
                      <p className="text-xs text-text-gray">Associated with partner: {selectedContent.content.partnerName}</p>
                    </Card>
                  )}
                  {selectedContent.content.thread && (
                    <Card className="p-4 sm:col-span-2">
                      <h4 className="text-sm font-medium mb-1">Conversation Thread</h4>
                      <p className="text-lg font-medium">{selectedContent.content.thread.messageCount} Messages</p>
                      <p className="text-xs text-text-gray">Last Reply: {new Date(selectedContent.content.thread.lastReplyDate).toLocaleString()}</p>
                    </Card>
                  )}
                </div>
              </div>
            ) : ( // YouTube / Instagram / TikTok specific metrics
              <div>
                <h3 className="text-base font-medium mb-4 text-black dark:text-white">{selectedContent.platform.charAt(0).toUpperCase() + selectedContent.platform.slice(1)} Metrics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h4 className="text-sm font-medium mb-1">Likes</h4>
                    <p className="text-2xl font-semibold mb-3">{selectedContent.metrics.likes?.toLocaleString() || 'N/A'}</p>
                    {/* Placeholder for graph */}
                    <div className="h-32 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <p className="text-xs text-text-gray">Likes Over Time (Chart)</p>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <h4 className="text-sm font-medium mb-1">Audience Retention</h4>
                    <p className="text-2xl font-semibold mb-3">N/A</p> {/* Placeholder */} 
                    {/* Placeholder for graph */}
                    <div className="h-32 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <p className="text-xs text-text-gray">Retention Graph (Chart)</p>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Modal Footer Actions */} 
        <div className="px-6 py-4 border-t dark:border-gray-800 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            onClick={() => onDiscussContent(selectedContent)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-heycontent-light-yellow text-black rounded-lg hover:bg-heycontent-yellow/90"
          >
            <MessageSquare className="w-4 h-4" />
            Discuss with Content
          </button>
          {/* Conditionally render View on Platform button */} 
          {selectedContent.platform === 'youtube' && (
            <a 
              href={`https://www.youtube.com/watch?v=${selectedContent.id}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm bg-heycontent-yellow text-black rounded-lg hover:bg-heycontent-yellow/90"
            >
              <ExternalLink className="w-4 h-4" />
              View on YouTube
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
