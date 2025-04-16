import React, { useState, useEffect, useRef } from 'react';
import { Note, NoteUpdate } from './hooks/useNotes';
import { ShortcutManager } from './keyboard-shortcuts';
import { CommandMenu, type Command } from './CommandMenu';
import { saveToLocal, getCursorCoordinates, applyFormat } from './utils/note-utils';
import { NoteHeader } from './components/NoteHeader';
import { NoteReferences } from './components/NoteReferences';
import { CommandMenus } from './components/CommandMenus';
import { FullAnalysisModal } from './components/FullAnalysisModal';

interface NoteAreaProps {
  note: Note;
  onUpdate: (noteId: string, updates: NoteUpdate) => Promise<Note>;
  onSave: () => void;
  onToggleShortcuts: () => void;
  onRequestAIInsights: (noteId: string, note: Note) => Promise<void>;
}

export function NoteArea({
  note,
  onUpdate,
  onSave,
  onToggleShortcuts,
  onRequestAIInsights
}: NoteAreaProps) {
  const [content, setContent] = useState(note.content || '');
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const [showCommands, setShowCommands] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const shortcutManager = useRef<ShortcutManager>();
  const references = Array.isArray(note.references) ? note.references : [];

  // Extract tags from content
  useEffect(() => {
    if (content) {
      const tagRegex = /#(\w+)/g;
      const tags: string[] = [];
      let match;

      while ((match = tagRegex.exec(content)) !== null) {
        tags.push(match[1]);
      }

      if (JSON.stringify(tags) !== JSON.stringify(note.tags)) {
        onUpdate(note._id, { tags: [...new Set(tags)] });
      }
    }
  }, [content, note._id, note.tags]);

  // Load from local storage on mount
  useEffect(() => {
    const key = `note_${note._id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const localNote = JSON.parse(saved);
      setContent(localNote.content || note.content || '');
    } else {
      setContent(note.content || '');
    }
  }, [note._id, note.content]);

  const insertText = (text: string) => {
    if (!textAreaRef.current || !content) return;

    const start = textAreaRef.current.selectionStart || 0;
    const end = textAreaRef.current.selectionEnd || 0;
    const selectedText = content.substring(start, end);
    let newText = text;
    let newCursorPosition = start + text.length;

    if (text === '#' || text === '@' || text === '/') {
      newText = text;
      newCursorPosition = start + 1;
      updateMenuPosition();

      if (text === '/') {
        setShowCommands(true);
        setShowMentions(false);
        setShowTags(false);
      }
      if (text === '@') {
        setShowMentions(true);
        setShowCommands(false);
        setShowTags(false);
      }
      if (text === '#') {
        setShowTags(true);
        setShowCommands(false);
        setShowMentions(false);
      }
    } else if (selectedText) {
      newText = text;
      newCursorPosition = start + text.length;
    }

    const newContent = content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);
    setCursorPosition(newCursorPosition);
    onUpdate(note._id, { content: newContent });
  };

  const handleFormat = (prefix: string, suffix: string = prefix) => {
    if (!textAreaRef.current || !content) return;

    const start = textAreaRef.current.selectionStart || 0;
    const end = textAreaRef.current.selectionEnd || 0;
    const selectedText = content.substring(start, end);

    let newContent: string;
    let newCursorPosition: number;

    if (selectedText) {
      newContent = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
      newCursorPosition = end + prefix.length + suffix.length;
    } else {
      newContent = content.substring(0, start) + prefix + suffix + content.substring(end);
      newCursorPosition = start + prefix.length;
    }

    setContent(newContent);
    setCursorPosition(newCursorPosition);
    onUpdate(note._id, { content: newContent });
  };

  const updateMenuPosition = () => {
    if (!textAreaRef.current) return;

    const { top, left } = getCursorCoordinates(textAreaRef.current, textAreaRef.current.selectionStart || 0);
    setMenuPosition({ top, left });
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onUpdate(note._id, { content: newContent });
  };

  const handleCommand = (command: Command) => {
    if (command.type === 'format') {
      handleFormat(command.shortcut || '', command.shortcut || '');
    } else if (command.type === 'block' && command.template) {
      insertText(command.template);
    } else if (command.type === 'metadata' && command.metadata) {
      onUpdate(note._id, { [command.metadata.type || '']: command.metadata.value });
    }
    setShowCommands(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (shortcutManager.current) {
      shortcutManager.current.handleKeyDown(e as any);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <NoteHeader
        note={note}
        onUpdate={(updates) => onUpdate(note._id, updates)}
        onSave={onSave}
      />
      <div className="flex-1 overflow-auto p-4">
        <textarea
          ref={textAreaRef}
          className="w-full h-full resize-none outline-none bg-transparent"
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type / for commands, @ to reference content, # to add tags"
          aria-label="Note content"
        />
      </div>
      <NoteReferences
        references={references}
        selectedInsight={selectedInsight}
        setSelectedInsight={setSelectedInsight}
        setShowFullAnalysis={setShowFullAnalysis}
      />
      <CommandMenus
        showCommands={showCommands}
        showMentions={showMentions}
        showTags={showTags}
        menuPosition={menuPosition}
        searchTerm={searchTerm}
        onCommandSelect={handleCommand}
        onCloseCommands={() => {
          setShowCommands(false);
          setShowMentions(false);
          setShowTags(false);
        }}
        textAreaRef={textAreaRef}
        onUpdate={onUpdate}
        noteId={note._id}
      />
      <FullAnalysisModal
        showFullAnalysis={showFullAnalysis}
        setShowFullAnalysis={setShowFullAnalysis}
        selectedInsight={selectedInsight}
        references={references}
      />
    </div>
  );
}