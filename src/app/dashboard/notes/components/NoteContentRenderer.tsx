"use client";
import React, { useMemo } from 'react';
import { LinkedContentRenderer } from './LinkedContentRenderer';

interface NoteContentRendererProps {
  content: string;
  availableNotes?: Array<{ _id: string; title: string; type: string }>;
  onLinkNote?: (noteId: string) => void;
  onLinkContent?: (prefixedId: string) => void;
}

export const NoteContentRenderer: React.FC<NoteContentRendererProps> = ({
  content,
  availableNotes = [],
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
      
      console.log('NoteContentRenderer: Looking for content with ID:', contentId);
      
      // Check if it's a prefixed ID (youtube:, instagram:, etc.)
      if (contentId.includes(':')) {
        const [contentType, id] = contentId.split(':', 2);
        
        if (contentType === 'note') {
          // Handle note linking (existing functionality)
          const linkedNote = availableNotes.find(note => 
            String(note._id) === String(id) || note._id === id
          );
          
          console.log('Found linked note:', linkedNote);
          
          if (linkedNote) {
            // Render as clickable note link
            if (onLinkNote) {
              parts.push(
                <button
                  key={`link-${partIndex}-${linkStartIndex}`}
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('🔗 Note link clicked:', { noteId: linkedNote._id, title: linkedNote.title });
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
        // Legacy note ID format (no prefix)
        const linkedNote = availableNotes.find(note => 
          String(note._id) === String(contentId) || note._id === contentId
        );
        
        console.log('Found linked note (legacy):', linkedNote);
        
        if (linkedNote) {
          // Render as clickable note link
          if (onLinkNote) {
            parts.push(
              <button
                key={`link-${partIndex}-${linkStartIndex}`}
                onClick={(e) => {
                  e.preventDefault();
                  console.log('🔗 Note link clicked:', { noteId: linkedNote._id, title: linkedNote.title });
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

      // Move past this link
      remainingContent = afterLinkStart.substring(linkEndIndex + 2); // Skip ]@
      partIndex++;
    }

    return parts;
  }, [content, availableNotes, onLinkNote, onLinkContent]);

  return (
    <>
      {renderedContent.map((part, index) => (
        <React.Fragment key={index}>{part}</React.Fragment>
      ))}
    </>
  );
}; 