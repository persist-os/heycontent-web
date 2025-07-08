"use client";

import React from 'react';
import { YouTubeOverlay } from '@/components/content/overlays/YouTubeOverlay';
import { InsightOverlay } from '@/components/content/overlays/InsightOverlay';

interface ChatOverlayProps {
  contentType: 'youtube' | 'insight' | 'note';
  contentId: string;
  onClose: () => void;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  contentType,
  contentId,
  onClose
}) => {
  // Render YouTube content using shared component
  if (contentType === 'youtube') {
    return (
      <YouTubeOverlay
        videoId={contentId}
        onClose={onClose}
        showAnalysis={true}
      />
    );
  }

  // Render insight content using shared component
  if (contentType === 'insight') {
    return (
      <InsightOverlay
        insightId={contentId}
        onClose={onClose}
        showAnalysis={true}
      />
    );
  }

  // Render note content (keep existing implementation for now)
  if (contentType === 'note') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-background rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] flex flex-col overflow-hidden">
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                      <span className="text-white text-sm font-bold">N</span>
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold">Smart Note</h1>
                      <p className="text-muted-foreground">Note Content</p>
                    </div>
                  </div>
                </div>
                <button
                  title="Close"
                  onClick={onClose}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto p-6 overflow-y-auto flex-1">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Note content overlay not yet implemented</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}; 