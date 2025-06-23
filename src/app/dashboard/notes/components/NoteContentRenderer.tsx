"use client";
import React, { useMemo } from 'react';

interface NoteContentRendererProps {
  content: string;
  availableNotes?: Array<{ _id: string; title: string; type: string }>;
  onLinkNote?: (noteId: string) => void;
}

export const NoteContentRenderer: React.FC<NoteContentRendererProps> = ({
  content,
  availableNotes = [],
  onLinkNote
}) => {
  // Parse content and render with clickable links - using simple string parsing instead of regex
  const renderedContent = useMemo(() => {
    if (!content) return [];

    const parts: React.ReactNode[] = [];
    let remainingContent = content;
    let partIndex = 0;

    while (remainingContent.length > 0) {
      // Find the next potential link start
      const atIndex = remainingContent.indexOf('@');
      
      if (atIndex === -1) {
        // No more @ symbols, add remaining content
        if (remainingContent) {
          parts.push(remainingContent);
        }
        break;
      }

      // Add text before the @
      if (atIndex > 0) {
        parts.push(remainingContent.substring(0, atIndex));
      }

      // Look for the closing @
      const afterAt = remainingContent.substring(atIndex + 1);
      const closingAtIndex = afterAt.indexOf('@');

      if (closingAtIndex === -1) {
        // No closing @, treat as regular text
        parts.push(remainingContent.substring(atIndex));
        break;
      }

      // Extract the potential link text
      const linkText = afterAt.substring(0, closingAtIndex).trim();
      
      // Check if this is a valid note link
      const linkedNote = availableNotes.find(note => note.title === linkText);
      
      if (linkedNote && linkText && onLinkNote) {
        // Render as clickable link
        parts.push(
          <button
            key={`link-${partIndex}-${atIndex}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Note link clicked:', {
                noteId: linkedNote._id,
                noteTitle: linkedNote.title,
                linkText,
                onLinkNote: !!onLinkNote
              });
              onLinkNote(linkedNote._id);
            }}
            className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer bg-transparent border-0 p-0 font-inherit text-inherit leading-inherit pointer-events-auto"
            style={{ fontSize: 'inherit', lineHeight: 'inherit' }}
          >
            @{linkText}@
          </button>
        );
      } else {
        // Not a valid link, treat as regular text
        parts.push(`@${linkText}@`);
      }

      // Move past this link
      remainingContent = afterAt.substring(closingAtIndex + 1);
      partIndex++;
    }

    return parts;
  }, [content, availableNotes, onLinkNote]);

  return (
    <>
      {renderedContent.map((part, index) => (
        <React.Fragment key={index}>{part}</React.Fragment>
      ))}
    </>
  );
}; 