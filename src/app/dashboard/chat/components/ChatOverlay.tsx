"use client";

import React from 'react';
import { YouTubeOverlay } from '@/components/content/overlays/YouTubeOverlay';
import { InstagramOverlay } from '@/components/content/overlays/InstagramOverlay';
import { GmailOverlay } from '@/components/content/overlays/GmailOverlay';
import { InsightOverlay } from '@/components/content/overlays/InsightOverlay';
import { InsightCard } from '@/components/content/InsightCard';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { NoteContentRenderer } from '@/app/dashboard/notes/components/NoteContentRenderer';
import { getCurrentUserId } from '@/app/lib/api-helpers';

interface ChatOverlayProps {
  contentType: 'youtube' | 'instagram' | 'gmail' | 'insight' | 'note' | 'smart_note';
  contentId: string;
  onClose: () => void;
  insightData?: any;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  contentType,
  contentId,
  onClose,
  insightData
}) => {
  // All hooks must be called at the top level
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = getCurrentUserId() || '';
  // Extract the actual note ID (remove note: or notes: prefix if present)
  const actualNoteId = (contentType === 'note' || contentType === 'smart_note') && contentId.startsWith('note') 
    ? contentId.replace(/^(note|notes):/, '') 
    : contentId;

  const note = useQuery(
    api.notes.getNote,
    (contentType === 'note' || contentType === 'smart_note') ? { noteId: actualNoteId, userId } : 'skip'
  );

  // Add debugging for note query
  React.useEffect(() => {
    if (contentType === 'note' || contentType === 'smart_note') {
      console.log('🔗 ChatOverlay: Note query debug:', {
        contentType,
        originalContentId: contentId,
        actualNoteId,
        userId,
        noteExists: !!note,
        noteData: note ? {
          id: note._id,
          title: note.title,
          type: note.type
        } : null,
        // Add validation for note ID format
        noteIdValidation: {
          originalLength: contentId?.length || 0,
          actualLength: actualNoteId?.length || 0,
          originalFormat: contentId?.match(/^[a-zA-Z0-9]{20,}$/) ? 'valid' : 'invalid',
          actualFormat: actualNoteId?.match(/^[a-zA-Z0-9]{20,}$/) ? 'valid' : 'invalid',
          startsWithPrefix: contentId?.startsWith('note:') || contentId?.startsWith('notes:') ? 'yes' : 'no'
        }
      });
    }
  }, [contentType, contentId, actualNoteId, userId, note]);

  const chatId = searchParams.get('id');

  // Render functions for each content type
  const renderYouTubeOverlay = () => (
    <YouTubeOverlay
      videoId={contentId}
      onClose={onClose}
      showAnalysis={true}
    />
  );

  const renderInstagramOverlay = () => (
    <InstagramOverlay
      postId={contentId}
      onClose={onClose}
      showAnalysis={true}
      hideDiscussButton={true}
    />
  );

  const renderGmailOverlay = () => (
    <GmailOverlay
      threadId={contentId}
      onClose={onClose}
      showAnalysis={true}
    />
  );

  const renderInsightOverlay = () => {
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
                  console.log('Discuss insight:', { content, title });
                }}
              />
            </div>
          </div>
        </div>
      );
    }
    // Show positive unsupported message instead of loading
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Preview Unavailable</h2>
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
          <p className="text-muted-foreground">
            We’re actively expanding previews. For insights, you can still open the full analysis from your dashboard to explore the details.
          </p>
        </div>
      </div>
    );
  };

  const renderNoteOverlay = () => {
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
            <div className="flex items-center gap-2">
              <button
                title="Go to Smart Notes"
                onClick={handleCloseToSmartNotes}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
              >
                Go to Smart Notes
              </button>
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
                          <span key={idx} className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                            #{tag}
                          </span>
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
              ) : note === undefined ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading note...</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-red-500 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <p className="text-muted-foreground">Note not found or access denied.</p>
                  <p className="text-sm text-muted-foreground mt-2">Note ID: {contentId}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFallback = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Content Preview</h2>
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
        <p className="text-muted-foreground">
          We’re actively expanding previews. This content isn’t available for in-chat preview yet, but you can open it from your dashboard.
        </p>
      </div>
    </div>
  );

  // Render based on content type
  switch (contentType) {
    case 'youtube':
      return renderYouTubeOverlay();
    case 'instagram':
      return renderInstagramOverlay();
    case 'gmail':
      return renderGmailOverlay();
    case 'insight':
      return renderInsightOverlay();
    case 'note':
    case 'smart_note':
      return renderNoteOverlay();
    default:
      return renderFallback();
  }
}; 