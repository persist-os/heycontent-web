import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { X, MessageSquare, Mail, Sparkles, Bot } from 'lucide-react';
import { GmailContentItem } from '../types';
import { getMetricsDisplay } from '../utils';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useContentContextActions } from '@/store/content-context-store';

interface GmailModalProps {
  selectedContent: GmailContentItem;
  onClose: () => void;
}

export const GmailModal: React.FC<GmailModalProps> = ({
  selectedContent,
  onClose
}) => {
  const router = useRouter();
  const { setGmailContext } = useContentContextActions();

  // Handle discuss content with Zustand store
  const handleDiscussContent = () => {
    if (selectedContent.convexData) {
      setGmailContext({
        ...selectedContent.convexData,
        analysisMarkdown: selectedContent.analysisMarkdown || selectedContent.convexData.analysisMarkdown
      });
    } else {
      const mockConvexData = {
        _id: selectedContent.id as any,
        _creationTime: Date.now(),
        userId: '',
        gmailAccountId: '',
        threadId: selectedContent.content.data?.threadId || selectedContent.id,
        subject: selectedContent.content.data?.subject || 'No Subject',
        from: selectedContent.content.data?.from || 'Unknown',
        snippet: selectedContent.content.data?.snippet || '',
        message_count: selectedContent.metrics?.replies || 0,
        messages: selectedContent.content.data?.messages || [],
        data: selectedContent.content.data || {},
        analysis: selectedContent.analysis || null,
        analysisMarkdown: selectedContent.analysisMarkdown || null,
        createdAt: new Date(selectedContent.publishedAt).getTime(),
        updatedAt: Date.now(),
      };
      setGmailContext(mockConvexData as any);
    }
    router.push('/dashboard/chat');
  };

  // Handle backdrop click to close modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b dark:border-gray-800 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-medium text-black dark:text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-500" /> Gmail Analytics
            </h2>
            <p className="text-sm text-text-gray dark:text-gray-400">
              Email • {selectedContent.content.data.emailType.charAt(0).toUpperCase() + selectedContent.content.data.emailType.slice(1)}
            </p>
          </div>
          <Button variant="ghost" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow space-y-6">
          {/* Preview */}
          <Card className="p-4 bg-gray-50 dark:bg-gray-800">
            <h3 className="font-medium text-black dark:text-white mb-1">{selectedContent.content.data.subject}</h3>
            <p className="text-sm text-text-gray dark:text-gray-400 mb-1 line-clamp-2">{selectedContent.content.data.snippet}</p>
            <p className="text-xs text-text-gray dark:text-gray-400">
              From: {selectedContent.content.data.from || 'Unknown'} | Received: {new Date(selectedContent.publishedAt).toLocaleString()}
            </p>
          </Card>

          {/* Metrics */}
          <div>
            <h3 className="text-base font-medium mb-4 text-black dark:text-white">Performance Metrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {getMetricsDisplay(selectedContent)}
            </div>
          </div>

          {/* AI Analysis */}
          {(
            selectedContent.analysisMarkdown ||
            (selectedContent.convexData && selectedContent.convexData.analysisMarkdown)
          ) && (
            <div>
              <h3 className="text-base font-medium mb-2 text-black dark:text-white">AI Analysis</h3>
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-heycontent-light-yellow dark:from-gray-800 dark:to-gray-900 min-h-[72px] flex flex-col justify-center">
                <div className="space-y-3">
                  <p className="text-sm text-black dark:text-white whitespace-pre-line">
                    {selectedContent.analysisMarkdown || (selectedContent.convexData && selectedContent.convexData.analysisMarkdown)}
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* All Messages in Thread */}
          {selectedContent.content.data.messages && selectedContent.content.data.messages.length > 0 && (
            <div>
              <h3 className="text-base font-medium mb-4 text-black dark:text-white">All Messages in Thread</h3>
              <div className="space-y-4">
                {selectedContent.content.data.messages.map((msg, idx) => (
                  <Card key={msg.id || idx} className="p-3 bg-white dark:bg-gray-900 border">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>From: {msg.from}</span>
                      {msg.subject && <span> | Subject: {msg.subject}</span>}
                    </div>
                    <div className="text-sm text-black dark:text-white mb-1">{msg.snippet}</div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t dark:border-gray-800 flex items-center justify-end gap-3 flex-shrink-0">
          <Button
            onClick={handleDiscussContent}
            className="bg-primary text-primary-foreground dark:text-black hover:bg-primary/90 hover:text-primary-foreground dark:hover:text-black"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Discuss with Content
          </Button>
        </div>
      </div>
    </div>
  );
};