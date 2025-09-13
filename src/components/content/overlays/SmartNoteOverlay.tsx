"use client";

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { useNotes } from '@/app/context/notes-context';
import { ContentOverlay } from '@/components/ui/ContentOverlay';
import { NoteContentRenderer } from '@/app/dashboard/notes/components/NoteContentRenderer';
import { FileText } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface SmartNoteOverlayProps {
  noteId: string;
  onClose: () => void;
}

// Utility to render content with newlines preserved (paragraphs and <br />)
function renderContentWithNewlines(content: string) {
  if (!content) return null;
  // Split by double newlines for paragraphs
  return content.split(/\n\n+/).map((para, i) => (
    <p key={i} className="mb-3 whitespace-pre-line">
      {para.split(/\n/).reduce((acc, line, idx) => {
        if (idx > 0) acc.push(<br key={idx} />);
        acc.push(line);
        return acc;
      }, [] as React.ReactNode[])}
    </p>
  ));
}

const SmartNoteOverlay: React.FC<SmartNoteOverlayProps> = ({ noteId, onClose }) => {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid || '';
  const note = useQuery(api.notes.getNote, { noteId, userId });
  const { notes: availableNotes } = useNotes();
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams.get('id');

  // Helper for label badge
  const renderLabel = (type?: string) => {
    if (!type) return null;
    return (
      <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold align-middle">
        {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
      </span>
    );
  };

  return (
    <ContentOverlay
      onClose={onClose}
      title={note?.title || 'Smart Note'}
      subtitle={null}
      icon={<FileText className="w-8 h-8 text-blue-500" />}
      className="max-w-3xl"
    >
      {note === undefined ? (
        <div className="text-center py-8 text-muted-foreground">Loading note...</div>
      ) : note === null ? (
        <div className="text-center py-8 text-red-500">Note not found or you do not have access.</div>
      ) : (
        <div className="flex flex-col gap-6 w-full">
          {/* Title, label, and date */}
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                {note.title || 'Untitled Note'}
              </h1>
              {renderLabel(note.type)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {note.updatedAt ? new Date(note.updatedAt).toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
            </div>
            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {note.tags.map((tag, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">#{tag}</span>
                ))}
              </div>
            )}
          </div>
          {/* Note preview content */}
          <div className="bg-white rounded-lg shadow border px-6 py-5 w-full">
            {/* Use NoteContentRenderer for links, but preserve newlines for plain text */}
            {note.content ? (
              <div className="prose prose-sm max-w-none text-foreground">
                <NoteContentRenderer
                  content={note.content}
                  availableNotes={availableNotes.map(n => ({ _id: String(n._id), title: n.title, type: n.type }))}
                />
                {/* If NoteContentRenderer does not preserve newlines, also render below: */}
                {/* {renderContentWithNewlines(note.content)} */}
              </div>
            ) : (
              <div className="text-muted-foreground italic">No content</div>
            )}
          </div>
          {/* Go to File System button */}
          <div className="flex justify-end mt-2">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg px-5 py-2 text-base transition-colors shadow"
              onClick={() => {
                let url = `/dashboard/notes?noteId=${note._id}&fromChat=true`;
                if (chatId) url += `&chatId=${chatId}`;
                router.push(url);
              }}
            >
              Go to Files
            </button>
          </div>
        </div>
      )}
    </ContentOverlay>
  );
};

export default SmartNoteOverlay; 