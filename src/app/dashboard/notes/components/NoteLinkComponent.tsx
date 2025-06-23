import React from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useNotes } from '../../../context/notes-context';

export const NoteLinkComponent: React.FC<NodeViewProps> = ({ node }) => {
  const { navigateToNote } = useNotes();
  const { noteId, title } = node.attrs;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('🔗 Note link clicked:', { noteId, title });
    navigateToNote(noteId, true); // true indicates this is from a link click
  };

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