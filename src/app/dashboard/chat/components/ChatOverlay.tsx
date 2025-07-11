"use client";

import React from 'react';
import { YouTubeOverlay } from '@/components/content/overlays/YouTubeOverlay';
import { InstagramOverlay } from '@/components/content/overlays/InstagramOverlay';
import { InsightOverlay } from '@/components/content/overlays/InsightOverlay';
import { InsightCard } from '@/components/content/InsightCard';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { useNotes } from '@/app/context/notes-context';
import { NoteCard } from '@/app/dashboard/notes/components/cards/NoteCard';
import { useRouter, useSearchParams } from 'next/navigation';
import { NoteMeta } from '@/app/dashboard/notes/components/NoteMeta';
import { NoteContentRenderer } from '@/app/dashboard/notes/components/NoteContentRenderer';

interface ChatOverlayProps {
  contentType: 'youtube' | 'instagram' | 'insight' | 'note';
  contentId: string;
  onClose: () => void;
  insightData?: any; // For direct insight data
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  contentType,
  contentId,
  onClose,
  insightData
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

  // Render Instagram content using shared component
  if (contentType === 'instagram') {
    return (
      <InstagramOverlay
        postId={contentId}
        onClose={onClose}
        showAnalysis={true}
        hideDiscussButton={true}
      />
    );
  }

  // Render insight content using shared component
  if (contentType === 'insight') {
    // If we have direct insight data, render it directly
    if (insightData) {
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] flex flex-col overflow-hidden">
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center">
                        <span className="text-white text-sm font-bold">I</span>
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold">AI Insight</h1>
                        <p className="text-muted-foreground">AI-Generated Insight</p>
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
              <InsightCard
                {...insightData}
                expanded={true}
                showAnalysis={true}
                onDiscuss={(content: string, title: string) => {
                  // Handle discuss action - could navigate to chat or show a modal
                  console.log('Discuss insight:', { content, title });
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    // Otherwise use the InsightOverlay
    return (
      <InsightOverlay
        insightId={contentId}
        onClose={onClose}
        showAnalysis={true}
      />
    );
  }

  // Render note content overlay
  if (contentType === 'note') {
    // Get userId for fetching note
    const { firebaseUser } = useAuth();
    const userId = firebaseUser?.uid || '';
    const note = useQuery(api.notes.getNote, { noteId: contentId, userId });
    const { notes: availableNotes } = useNotes();
    const router = useRouter();
    const searchParams = useSearchParams();
    const chatId = searchParams.get('id');

    // Handler for X button: go to Smart Notes preview
    const handleCloseToSmartNotes = () => {
      let url = `/dashboard/notes?noteId=${contentId}&fromChat=true`;
      if (chatId) url += `&chatId=${chatId}`;
      router.push(url);
    };

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-6">
        <div className="bg-background rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-border">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">N</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold leading-tight">Smart Note Preview</h1>
                <p className="text-muted-foreground text-sm">Full note preview (read-only)</p>
              </div>
            </div>
            <button
              title="Close"
              onClick={handleCloseToSmartNotes}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Main content */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar metadata */}
            <div className="hidden md:block w-64 flex-shrink-0 border-r bg-muted/40 p-6 overflow-y-auto">
              {note && (
                <div>
                  <div className="mb-6">
                    <div className="text-xs text-muted-foreground mb-1">Title</div>
                    <div className="font-semibold text-lg break-words">{note.title || 'Untitled Note'}</div>
                  </div>
                  <div className="mb-6">
                    <div className="text-xs text-muted-foreground mb-1">Type</div>
                    <div className="capitalize text-sm font-medium">{note.type || 'idea_bank'}</div>
                  </div>
                  {note.platform && (
                    <div className="mb-6">
                      <div className="text-xs text-muted-foreground mb-1">Platform</div>
                      <div className="text-sm">{note.platform}</div>
                    </div>
                  )}
                  {note.tags && note.tags.length > 0 && (
                    <div className="mb-6">
                      <div className="text-xs text-muted-foreground mb-1">Tags</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {note.tags.map((tag, idx) => (
                          <span key={idx} className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mb-6">
                    <div className="text-xs text-muted-foreground mb-1">Created</div>
                    <div className="text-sm">{note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Unknown'}</div>
                  </div>
                  <div className="mb-6">
                    <div className="text-xs text-muted-foreground mb-1">Updated</div>
                    <div className="text-sm">{note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : 'Unknown'}</div>
                  </div>
                </div>
              )}
            </div>
            {/* Main content area */}
            <div className="flex-1 p-6 overflow-y-auto">
              {note ? (
                <div className="max-w-none">
                  <NoteContentRenderer content={note.content} />
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading note...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Content Preview</h2>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-muted-foreground">Content type "{contentType}" not supported yet.</p>
      </div>
    </div>
  );
}; 