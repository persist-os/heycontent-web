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
                    <div className="text-xs text-muted-foreground mb-1">Last updated</div>
                    <div className="text-xs">{note.updatedAt ? new Date(note.updatedAt).toLocaleString() : 'Just now'}</div>
                  </div>
                </div>
              )}
            </div>
            {/* Main note content */}
            <div className="flex-1 overflow-y-auto p-6">
              {note === undefined ? (
                <div className="text-center py-8 text-muted-foreground">Loading note...</div>
              ) : note === null ? (
                <div className="text-center py-8 text-red-500">Note not found or you do not have access.</div>
              ) : (
                <>
                  <div className="block md:hidden mb-6">
                    <div className="text-xs text-muted-foreground mb-1">Title</div>
                    <div className="font-semibold text-lg break-words">{note.title || 'Untitled Note'}</div>
                    <div className="text-xs text-muted-foreground mt-1">{note.updatedAt ? new Date(note.updatedAt).toLocaleString() : 'Just now'}</div>
                  </div>
                  <div className="prose prose-sm max-w-none text-foreground">
                    <NoteContentRenderer 
                      content={note.content || ''} 
                      availableNotes={availableNotes.map(n => ({ _id: String(n._id), title: n.title, type: n.type }))}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          {/* Footer */}
          {note && (
            <div className="border-t bg-background/95 px-8 py-5 flex justify-end">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg px-5 py-2 text-base transition-colors"
                onClick={() => {
                  let url = `/dashboard/notes?noteId=${note._id}&fromChat=true`;
                  if (chatId) url += `&chatId=${chatId}`;
                  router.push(url);
                }}
              >
                Open in Smart Notes
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}; 