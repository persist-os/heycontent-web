import React, { useState, useEffect, useRef } from 'react';
import { Note, NoteUpdate } from './types';
import { ShortcutManager } from './keyboard-shortcuts';
import { CommandMenu, type Command } from './CommandMenu';
import { saveToLocal, getCursorCoordinates, applyFormat } from './utils/note-utils';
import { NoteHeader } from './components/NoteHeader';
import { NoteReferences } from './components/NoteReferences';
import { CommandMenus } from './components/CommandMenus';
import { FullAnalysisModal } from './components/FullAnalysisModal';
import { Keyboard } from 'lucide-react';

interface NoteAreaProps {
  note: Note;
  onUpdate: (noteId: string, updates: NoteUpdate) => Promise<Note>;
  onSave: () => void;
  onToggleShortcuts: () => void;
  onRequestAIInsights: (noteId: string, note: Note) => Promise<void>;
  onBack: () => void;
  isMobile: boolean;
}

export function NoteArea({
  note,
  onUpdate,
  onSave,
  onToggleShortcuts,
  onRequestAIInsights,
  onBack,
  isMobile
}: NoteAreaProps) {
  const [content, setContent] = useState(note.content || '');

  // Keep content in sync with note prop
  useEffect(() => {
    setContent(note.content || '');
  }, [note.content]);

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
  const shortcutManager = useRef<ShortcutManager>(
    new ShortcutManager({
      onSave,
      onQuickCapture: () => {
        if (!note?._id) {
          console.error('Cannot request AI insights: note or note._id is undefined');
          return;
        }
        // Create a new note object with the current content
        const currentNote = { ...note, content };
        onRequestAIInsights(note._id, currentNote);
      },
      onCommandMenu: () => {
        if (textAreaRef.current) {
          const cursorPos = textAreaRef.current.selectionStart;
          const lineStart = content.lastIndexOf('\n', cursorPos) + 1;
          const lineContent = content.substring(lineStart, cursorPos);
          if (lineContent.trim() === '') {
            setShowCommands(true);
            updateMenuPosition();
          }
        }
      },
      onMention: () => {
        setShowMentions(true);
        updateMenuPosition();
      },
      onTag: () => {
        setShowTags(true);
        updateMenuPosition();
      },
      onBold: () => handleFormat('**', '**'),
      onItalic: () => handleFormat('*', '*'),
      onUnderline: () => handleFormat('_', '_'),
      onIndent: () => insertText('  '),
      onUnindent: () => {
        if (textAreaRef.current) {
          const start = textAreaRef.current.selectionStart || 0;
          const lineStart = content.lastIndexOf('\n', start) + 1;
          const lineContent = content.substring(lineStart, start);
          if (lineContent.startsWith('  ')) {
            const newContent = content.substring(0, lineStart) + content.substring(lineStart + 2);
            setContent(newContent);
            onUpdate(note._id, { content: newContent });
          }
        }
      },
      onToggleShortcuts,
      onEscape: () => {
        setShowCommands(false);
        setShowMentions(false);
        setShowTags(false);
      }
    })
  );
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

  // Add debug logging for initial render
  useEffect(() => {
    console.log('NoteArea mounted with note:', note);
  }, [note]);

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

  const handleContentChange = async (newContent: string) => {
    console.log('Content changing to:', newContent);
    setContent(newContent);
    
    try {
      // Update the note content with proper updates wrapper
      const updatedNote = await onUpdate(note._id, {
        content: newContent,
        updatedAt: Date.now()
      });
      console.log('Note updated successfully:', updatedNote);
      
      // Save to local storage as backup
      saveToLocal(note._id, { content: newContent });
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  // Update menu position when content changes
  const updateMenuPosition = () => {
    if (textAreaRef.current) {
      const cursorPos = textAreaRef.current.selectionStart || 0;
      const coords = getCursorCoordinates(textAreaRef.current, cursorPos);
      setMenuPosition(coords);
    }
  };

  // Handle key down events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    console.log('Key pressed:', e.key);
    
    if (shortcutManager.current) {
      const handled = shortcutManager.current.handleKeyDown(e as any);
      if (!handled) {
        if (e.key === '@') {
          console.log('@ key pressed, showing mentions menu');
          insertText('@');
          setShowMentions(true);
          updateMenuPosition();
        } else if (e.key === '#') {
          console.log('# key pressed, showing tags menu');
          insertText('#');
          setShowTags(true);
          updateMenuPosition();
        } else if (e.key === '/') {
          console.log('/ key pressed, showing commands menu');
          insertText('/');
          setShowCommands(true);
          updateMenuPosition();
        } else if (e.key === 'Backspace') {
          // Check if we're deleting a special character
          if (textAreaRef.current) {
            const cursorPos = textAreaRef.current.selectionStart;
            const charBeforeCursor = content.charAt(cursorPos - 1);
            if (charBeforeCursor === '@' || charBeforeCursor === '#' || charBeforeCursor === '/') {
              console.log('Special character deleted, closing menus');
              setShowCommands(false);
              setShowMentions(false);
              setShowTags(false);
            }
          }
        }
      }
    }
  };

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (textAreaRef.current && !textAreaRef.current.contains(event.target as Node)) {
        setShowCommands(false);
        setShowMentions(false);
        setShowTags(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  return (
    <div 
      className="flex flex-col h-full note-container"
      data-note={JSON.stringify(note)}
    >
      <NoteHeader
        note={note}
        onUpdate={onUpdate}
        onSave={onSave}
        onBack={onBack}
        isMobile={isMobile}
        onRequestAIInsights={onRequestAIInsights}
        currentContent={content}
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
      <button
        onClick={onToggleShortcuts}
        className="fixed bottom-4 left-4 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 hover:bg-white transition-colors"
        title="Keyboard Shortcuts (⌘ + /)"
      >
        <Keyboard className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );
}