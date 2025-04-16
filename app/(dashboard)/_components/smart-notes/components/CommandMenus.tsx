import React from 'react';
import { AtSign, Hash } from 'lucide-react';
import { CommandMenu, type Command } from '../CommandMenu';

interface CommandMenusProps {
  showCommands: boolean;
  showMentions: boolean;
  showTags: boolean;
  menuPosition: { top: number; left: number };
  searchTerm: string;
  onCommandSelect: (command: Command) => void;
  onCloseCommands: () => void;
  textAreaRef: React.RefObject<HTMLTextAreaElement>;
  onUpdate: (noteId: string, updates: any) => void;
  noteId: string;
}

export function CommandMenus({
  showCommands,
  showMentions,
  showTags,
  menuPosition,
  searchTerm,
  onCommandSelect,
  onCloseCommands,
  textAreaRef,
  onUpdate,
  noteId
}: CommandMenusProps) {
  const mentionOptions = ['conversation', 'insight'];
  const tagOptions = ['content', 'idea', 'todo'];

  const MentionsMenu = () => (
    <div className="p-2 space-y-1">
      <div className="text-sm font-medium mb-2">Reference content</div>
      {mentionOptions.map((option, index) => (
        <button
          key={index}
          onClick={() => {
            const start = textAreaRef.current?.selectionStart || 0;
            const textContent = textAreaRef.current?.value || '';
            const newContent = textContent.substring(0, start - 1) + `@${option} ` + textContent.substring(start);
            onUpdate(noteId, { content: newContent });
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 text-left text-sm"
        >
          <AtSign className="w-4 h-4 text-gray-500" />
          <span>@{option}</span>
        </button>
      ))}
    </div>
  );

  const TagsMenu = () => (
    <div className="p-2 space-y-1">
      <div className="text-sm font-medium mb-2">Add a tag</div>
      {tagOptions.map((option, index) => (
        <button
          key={index}
          onClick={() => {
            const start = textAreaRef.current?.selectionStart || 0;
            const textContent = textAreaRef.current?.value || '';
            const newContent = textContent.substring(0, start - 1) + `#${option} ` + textContent.substring(start);
            onUpdate(noteId, { content: newContent });
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 text-left text-sm"
        >
          <Hash className="w-4 h-4 text-gray-500" />
          <span>#{option}</span>
        </button>
      ))}
    </div>
  );

  return (
    <>
      {showCommands && (
        <CommandMenu
          onSelect={onCommandSelect}
          onClose={onCloseCommands}
          searchTerm={searchTerm}
          position={menuPosition}
        />
      )}

      {showMentions && (
        <div
          className="absolute bg-white rounded-lg shadow-lg border border-gray-200 z-50 w-64"
          style={{
            top: menuPosition.top,
            left: menuPosition.left
          }}
        >
          <MentionsMenu />
        </div>
      )}

      {showTags && (
        <div
          className="absolute bg-white rounded-lg shadow-lg border border-gray-200 z-50 w-64"
          style={{
            top: menuPosition.top,
            left: menuPosition.left
          }}
        >
          <TagsMenu />
        </div>
      )}
    </>
  );
} 