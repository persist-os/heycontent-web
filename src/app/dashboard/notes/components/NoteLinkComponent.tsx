import React from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useNotes } from '../../../context/notes-context';

export const NoteLinkComponent: React.FC<NodeViewProps> = ({ node }) => {
  const { navigateToNote, notes } = useNotes();
  const { noteId, title } = node.attrs;

  // Check if the note still exists (or if title is empty, indicating missing note)
  const noteExists = notes.some(note => String(note._id) === String(noteId)) && title;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (noteExists) {
      console.log('🔗 Note link clicked:', { noteId, title });
      navigateToNote(noteId, true); // true indicates this is from a link click
    }
  };

  // If note doesn't exist, render missing note message
  if (!noteExists) {
    return (
      <NodeViewWrapper as="span" className="inline">
        <span className="text-red-500 italic">
          [Missing Note]
        </span>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper as="span" className="inline">
      <button
        onClick={handleClick}
        className="text-blue-600 hover:text-blue-800 underline bg-transparent border-none p-0 m-0 cursor-pointer font-inherit text-inherit"
        type="button"
      >
        {title}
      </button>
    </NodeViewWrapper>
  );
}; 