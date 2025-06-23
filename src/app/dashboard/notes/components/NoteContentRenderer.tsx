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

      // Extract the note ID
      const noteId = afterLinkStart.substring(0, linkEndIndex).trim();
      
      console.log('NoteContentRenderer: Looking for note with ID:', noteId);
      console.log('Available notes:', availableNotes.map(n => ({ id: n._id, title: n.title })));
      
      // Find the note by ID (try both string comparison and exact match)
      const linkedNote = availableNotes.find(note => 
        String(note._id) === String(noteId) || note._id === noteId
      );
      
      console.log('Found linked note:', linkedNote);
      
      if (linkedNote) {
        // Render as non-clickable underlined title
        parts.push(
          <span
            key={`link-${partIndex}-${linkStartIndex}`}
            className="font-medium underline"
          >
            {linkedNote.title}
          </span>
        );
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

      // Move past this link
      remainingContent = afterLinkStart.substring(linkEndIndex + 2); // Skip ]@
      partIndex++;
    }

    return parts;
  }, [content, availableNotes]);

  return (
    <>
      {renderedContent.map((part, index) => (
        <React.Fragment key={index}>{part}</React.Fragment>
      ))}
    </>
  );
}; 