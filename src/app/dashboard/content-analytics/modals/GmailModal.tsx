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
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const router = useRouter();
  const { setGmailContext } = useContentContextActions();

  const requestAiAnalysis = async () => {
    setLoading(true);
    // Simulate API call - TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1200));
    setAiAnalysis(`AI Analysis for "${selectedContent.content.data.subject}":\n- Open rate (${selectedContent.metrics.openRate}%) is strong. \n- Click rate (${selectedContent.metrics.clickRate}%) could be improved.\n- Consider A/B testing subject lines or call-to-action placement.`);
    setLoading(false);
  };

  // Handle discuss content with Zustand store
  const handleDiscussContent = () => {
    // Use the full Convex document if available, otherwise create a fallback
    if (selectedContent.convexData) {
      // Use the complete Convex document with all fields
      console.log('🔍 [GMAIL MODAL] Using full Convex document:', {
        hasData: !!selectedContent.convexData.data,
        dataKeys: selectedContent.convexData.data ? Object.keys(selectedContent.convexData.data) : 'none',
        fullConvexData: selectedContent.convexData
      });
      
      // Update the analysis markdown if we have fresh analysis
      const updatedConvexData = {
        ...selectedContent.convexData,
        analysisMarkdown: aiAnalysis || selectedContent.analysisMarkdown || selectedContent.convexData.analysisMarkdown
      };
      
      setGmailContext(updatedConvexData);
    } else {
      // Fallback to creating a mock object (shouldn't happen with proper data)
      console.warn('🔍 [GMAIL MODAL] No convexData available, using fallback mock object');
      
      // Create a mock Convex document structure
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
        analysisMarkdown: aiAnalysis || selectedContent.analysisMarkdown || null,
        createdAt: new Date(selectedContent.publishedAt).getTime(),
        updatedAt: Date.now(),
      };

      setGmailContext(mockConvexData as any);
    }
    
    // Navigate to chat
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
            {/* Use a container that mimics the grid structure expected by getMetricsDisplay */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {getMetricsDisplay(selectedContent)}
            </div>
          </div>

          {/* AI Analysis */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-medium text-black dark:text-white">AI Analysis</h3>
              <Button size="sm" onClick={requestAiAnalysis} disabled={loading || !!aiAnalysis}>
                <Sparkles className="w-4 h-4 mr-2" />
                {loading ? 'Analyzing...' : (aiAnalysis ? 'Analysis Complete' : 'Request Analysis')}
              </Button>
            </div>
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-heycontent-light-yellow dark:from-gray-800 dark:to-gray-900 min-h-[72px] flex flex-col justify-center">
              {aiAnalysis ? (
                <div className="space-y-3">
                  <p className="text-sm text-black dark:text-white whitespace-pre-line">{aiAnalysis}</p>
                  <Button variant="outline" size="sm" onClick={() => setChatOpen(!chatOpen)}>
                    <Bot className="w-4 h-4 mr-2" />
                    {chatOpen ? 'Close Chat' : 'Chat with Analysis'}
                  </Button>
                  {chatOpen && (
                    <div className="mt-2 p-3 border rounded-lg bg-gray-50 dark:bg-gray-700">
                      {/* TODO: Integrate real chat component here */}
                      <p className="text-xs text-text-gray italic">Chat interface placeholder. Ask about the analysis results!</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-text-gray text-sm italic text-center">Click 'Request Analysis' to get AI insights.</p>
              )}
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t dark:border-gray-800 flex items-center justify-end gap-3 flex-shrink-0">
          <Button onClick={handleDiscussContent} className="bg-heycontent-light-yellow hover:bg-heycontent-yellow/90 text-black">
            <MessageSquare className="w-4 h-4 mr-2" />
            Discuss with Content
          </Button>
        </div>
      </div>
    </div>
  );
};