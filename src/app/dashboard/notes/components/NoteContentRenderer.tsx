"use client";
import React, { useMemo } from 'react';
import { LinkedContentRenderer } from './LinkedContentRenderer';

interface NoteContentRendererProps {
  content: string;
  availableNotes?: Array<{ _id: string; title: string; type: string }>;
  availableContent?: Array<{ id: string; title: string; type: string }>;
  onLinkNote?: (noteId: string) => void;
  onLinkContent?: (prefixedId: string) => void;
}

export const NoteContentRenderer: React.FC<NoteContentRendererProps> = ({
  content,
  availableNotes = [],
  availableContent = [],
  onLinkNote,
  onLinkContent
}) => {
  // Parse content and render note links with titles - handles @[noteId]@ format
  const renderedContent = useMemo(() => {
    if (!content) return [];

    const parts: React.ReactNode[] = [];
    let remainingContent = content;
    let partIndex = 0;

    while (remainingContent.length > 0) {
      // Find the next potential link start @[
      const linkStartIndex = remainingContent.indexOf('@[');
      
      if (linkStartIndex === -1) {
        // No more @[ patterns, add remaining content
        if (remainingContent) {
          parts.push(remainingContent);
        }
        break;
      }

      // Add text before the @[
      if (linkStartIndex > 0) {
        parts.push(remainingContent.substring(0, linkStartIndex));
      }

      // Look for the closing ]@
      const afterLinkStart = remainingContent.substring(linkStartIndex + 2); // Skip @[
      const linkEndIndex = afterLinkStart.indexOf(']@');

      if (linkEndIndex === -1) {
        // No closing ]@, treat as regular text
        parts.push(remainingContent.substring(linkStartIndex));
        break;
      }

      // Extract the content ID
      const contentId = afterLinkStart.substring(0, linkEndIndex).trim();
      
      // Check if it's a prefixed ID (youtube, instagram, note, insight, etc.)
      if (contentId.includes(':')) {
        const [contentType, id] = contentId.split(':', 2);
        
        if (contentType === 'note') {
          // Handle note linking (existing functionality)
          const linkedNote = availableNotes.find(note => 
            String(note._id) === String(id) || note._id === id
          );
          
          if (linkedNote) {
            // Render as clickable note link
            if (onLinkNote) {
              parts.push(
                <button
                  key={`link-${partIndex}-${linkStartIndex}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onLinkNote(linkedNote._id);
                  }}
                  className="text-blue-600 hover:text-blue-800 underline bg-transparent border-none p-0 m-0 cursor-pointer font-inherit text-inherit font-medium"
                  type="button"
                >
                  {linkedNote.title}
                </button>
              );
            } else {
              // Fallback to non-clickable if no onLinkNote callback
              parts.push(
                <span
                  key={`link-${partIndex}-${linkStartIndex}`}
                  className="font-medium underline"
                >
                  {linkedNote.title}
                </span>
              );
            }
          } else {
            // Note not found, show missing note indicator
            parts.push(
              <span
                key={`unknown-link-${partIndex}-${linkStartIndex}`}
                className="text-red-500 italic"
              >
                [Missing Note]
              </span>
            );
          }
        } else if (contentType === 'insight') {
          // Handle insight linking - ID format is insight:analysisId:index
          // Use LinkedContentRenderer for consistent preview style
          parts.push(
            <LinkedContentRenderer
              key={`insight-link-${partIndex}-${linkStartIndex}`}
              prefixedId={contentId}
              onLinkContent={onLinkContent}
            />
          );
        } else {
          // Handle other content types (youtube, instagram, etc.)
          parts.push(
            <LinkedContentRenderer
              key={`content-link-${partIndex}-${linkStartIndex}`}
              prefixedId={contentId}
              onLinkContent={onLinkContent}
            />
          );
        }
      } else {
        // Handle display format content (Smart Note: Title, YouTube: Title, etc.)
        if (contentId.startsWith('Smart Note: ')) {
          const noteTitle = contentId.replace('Smart Note: ', '');
          const linkedNote = availableNotes.find(note => note.title === noteTitle);
          
          if (linkedNote) {
            // Render as clickable note link
            if (onLinkNote) {
              parts.push(
                <button
                  key={`link-${partIndex}-${linkStartIndex}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onLinkNote(linkedNote._id);
                  }}
                  className="text-blue-600 hover:text-blue-800 underline bg-transparent border-none p-0 m-0 cursor-pointer font-inherit text-inherit font-medium"
                  type="button"
                >
                  {linkedNote.title}
                </button>
              );
            } else {
              // Fallback to non-clickable if no onLinkNote callback
              parts.push(
                <span
                  key={`link-${partIndex}-${linkStartIndex}`}
                  className="font-medium underline"
                >
                  {linkedNote.title}
                </span>
              );
            }
          } else {
            // Note not found, show missing note indicator
            parts.push(
              <span
                key={`unknown-link-${partIndex}-${linkStartIndex}`}
                className="text-red-500 italic"
              >
                [Missing Note]
              </span>
            );
          }
        } else if (contentId.startsWith('YouTube: ') || contentId.startsWith('Instagram: ')) {
          // For YouTube and Instagram display format, we can't resolve them here
          // They should be handled by the LinkedContentRenderer with proper prefixed IDs
          parts.push(
            <span
              key={`unknown-link-${partIndex}-${linkStartIndex}`}
              className="text-orange-500 italic"
            >
              {contentId}
            </span>
          );
        } else {
          // Raw note ID format (legacy format) - check if it's a note ID
          const linkedNote = availableNotes.find(note => 
            String(note._id) === String(contentId) || note._id === contentId
          );
          
          if (linkedNote) {
            // Render as clickable note link
            if (onLinkNote) {
              parts.push(
                <button
                  key={`link-${partIndex}-${linkStartIndex}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onLinkNote(linkedNote._id);
                  }}
                  className="text-blue-600 hover:text-blue-800 underline bg-transparent border-none p-0 m-0 cursor-pointer font-inherit text-inherit font-medium"
                  type="button"
                >
                  {linkedNote.title}
                </button>
              );
            } else {
              // Fallback to non-clickable if no onLinkNote callback
              parts.push(
                <span
                  key={`link-${partIndex}-${linkStartIndex}`}
                  className="font-medium underline"
                >
                  {linkedNote.title}
                </span>
              );
            }
          } else {
            // Note not found, show missing note indicator
            parts.push(
              <span
                key={`unknown-link-${partIndex}-${linkStartIndex}`}
                className="text-red-500 italic"
              >
                [Missing Note]
              </span>
            );
          }
        }
      }

      // Move past this link
      remainingContent = afterLinkStart.substring(linkEndIndex + 2); // Skip ]@
      partIndex++;
    }

    return parts;
  }, [content, availableNotes, availableContent, onLinkNote, onLinkContent]);

  return (
    <>
      {renderedContent.map((part, index) => (
        <React.Fragment key={index}>{part}</React.Fragment>
      ))}
    </>
  );
}; 