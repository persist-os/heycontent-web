import React, { useState, useEffect, useRef } from 'react';
import type { Note, NoteType } from './types/index';
import { ShortcutManager } from './keyboard-shortcuts';
import { CommandMenu, type Command } from './CommandMenu';
import { saveToLocal, getCursorCoordinates, applyFormat } from './utils/note-utils';
import { NoteHeader } from './components/NoteHeader';
import { NoteReferences } from './components/NoteReferences';
import { CommandMenus } from './components/CommandMenus';
import { FullAnalysisModal } from './components/FullAnalysisModal';

interface NoteAreaProps {
  note: Note;
  onUpdate: (noteId: string, updates: Partial<Note>) => void;
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
        onUpdate(note.id, { tags: [...new Set(tags)] });
      }
    }
  }, [content, note.id, note.tags]);

  // Load from local storage on mount
  useEffect(() => {
    const key = `note_${note.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const localNote = JSON.parse(saved);
      setContent(localNote.content || note.content || '');
    } else {
      setContent(note.content || '');
    }
  }, [note.id, note.content]);

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
      if (text === '**') {
        const { newContent, newCursorPosition: pos } = applyFormat(content, selectedText, '**', '**', start, end, textAreaRef.current);
        newText = newContent;
        newCursorPosition = pos;
      } else if (text === '_') {
        const { newContent, newCursorPosition: pos } = applyFormat(content, selectedText, '_', '_', start, end, textAreaRef.current);
        newText = newContent;
        newCursorPosition = pos;
      } else if (text === '<u>') {
        const { newContent, newCursorPosition: pos } = applyFormat(content, selectedText, '<u>', '</u>', start, end, textAreaRef.current);
        newText = newContent;
        newCursorPosition = pos;
      }
    } else {
      if (text === '**') {
        newText = '**';
        newCursorPosition = start + 1;
      } else if (text === '_') {
        newText = '_';
        newCursorPosition = start + 1;
      } else if (text === '<u>') {
        newText = '<u></u>';
        newCursorPosition = start + 3;
      }
    }

    const newContent = content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);
    onUpdate(note.id, { content: newContent });
    saveToLocal(note.id, { content: newContent });

    if (textAreaRef.current) {
      textAreaRef.current.focus();
      textAreaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
    }
  };

  // Initialize shortcut manager once
  useEffect(() => {
    const handleFormat = (prefix: string, suffix: string = prefix) => {
      if (!textAreaRef.current || !content) return;
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;
      const selectedText = content.substring(start, end);

      if (selectedText) {
        const { newContent, newCursorPosition } = applyFormat(content, selectedText, prefix, suffix, start, end, textAreaRef.current);
        setContent(newContent);
        onUpdate(note.id, { content: newContent });
        saveToLocal(note.id, { content: newContent });
        textAreaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      } else {
        insertText(prefix);
      }
    };

    shortcutManager.current = new ShortcutManager({
      onSave: () => {
        if (note?.id) {
          onSave?.();
        }
      },
      onQuickCapture: () => {
        insertText('/capture');
        setShowCommands(true);
      },
      onCommandMenu: () => {
        insertText('/');
      },
      onMention: () => {
        insertText('@');
      },
      onTag: () => {
        insertText('#');
      },
      onBold: () => handleFormat('**'),
      onItalic: () => handleFormat('_'),
      onUnderline: () => handleFormat('<u>', '</u>'),
      onIndent: () => {
        insertText('  ');
      },
      onUnindent: () => {
        if (!textAreaRef.current || !content) return;
        const start = textAreaRef.current.selectionStart;
        const lineStart = content.lastIndexOf('\n', start - 1) + 1;
        const line = content.substring(lineStart, start);
        if (line.startsWith('  ')) {
          const newContent = content.substring(0, lineStart) + line.substring(2) + content.substring(start);
          setContent(newContent);
          saveToLocal(note.id, { content: newContent });
          onUpdate(note.id, { content: newContent });
          setCursorPosition(start - 2);
        }
      },
      onToggleShortcuts: () => {
        onToggleShortcuts?.();
      }
    });
  }, [note.id, content]);

  const updateMenuPosition = () => {
    if (!textAreaRef.current) return;
    const position = textAreaRef.current.selectionStart;
    const coords = getCursorCoordinates(textAreaRef.current, position);
    setMenuPosition(coords);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onUpdate(note.id, { content: newContent });
    saveToLocal(note.id, { content: newContent });
  };

  const handleCommand = (command: Command) => {
    setShowCommands(false);

    if (command.type === 'metadata') {
      if (command.metadata?.type === 'idea' || command.metadata?.type === 'important') {
        onUpdate(note.id, { [command.metadata.type]: command.metadata.value });
      }
      return;
    }

    if (command.template) {
      if (!textAreaRef.current || !content) return;
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;

      const newContent = content.substring(0, start - 1) + command.template + content.substring(end);
      setContent(newContent);
      onUpdate(note.id, { content: newContent });
      saveToLocal(note.id, { content: newContent });

      const newPosition = start - 1 + command.template.length;
      setTimeout(() => {
        if (textAreaRef.current) {
          textAreaRef.current.focus();
          textAreaRef.current.setSelectionRange(newPosition, newPosition);
        }
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdKey = isMac ? e.metaKey : e.ctrlKey;

    if (shortcutManager.current?.handleKeyDown(e as any)) {
      return;
    }

    if (e.key === '/' && !cmdKey) {
      const start = e.currentTarget.selectionStart;
      const text = e.currentTarget.value || '';
      const beforeCursor = text.substring(0, start);

      if (start === 0 || /[\n\s]$/.test(beforeCursor)) {
        e.preventDefault();
        insertText('/');
        setShowCommands(true);
        setShowMentions(false);
        setShowTags(false);
        updateMenuPosition();
      }
    }

    if (e.key === '@') {
      e.preventDefault();
      insertText('@');
      setShowMentions(true);
      setShowCommands(false);
      setShowTags(false);
      updateMenuPosition();
    }

    if (e.key === '#') {
      e.preventDefault();
      insertText('#');
      setShowTags(true);
      setShowCommands(false);
      setShowMentions(false);
      updateMenuPosition();
    }

    if (showCommands && e.key !== 'Escape') {
      const value = e.currentTarget.value || '';
      const newSearchTerm = value.substring(value.lastIndexOf('/') + 1);
      setSearchTerm(newSearchTerm);
    }

    if (cmdKey && content) {
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const selectedText = content.substring(start, end);

      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          applyFormat(content, selectedText, '**', '**', start, end, textAreaRef.current);
          return;
        case 'i':
          e.preventDefault();
          applyFormat(content, selectedText, '_', '_', start, end, textAreaRef.current);
          return;
        case 'u':
          e.preventDefault();
          applyFormat(content, selectedText, '<u>', '</u>', start, end, textAreaRef.current);
          return;
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <NoteHeader
        note={note}
        onUpdate={onUpdate}
        onSave={onSave}
        onRequestAIInsights={onRequestAIInsights}
      />

      <div className="flex-1 p-6 overflow-y-auto relative">
        <div className="max-w-4xl mx-auto space-y-4">
          <NoteReferences
            references={references}
            selectedInsight={selectedInsight}
            setSelectedInsight={setSelectedInsight}
            setShowFullAnalysis={setShowFullAnalysis}
          />

          <div className="relative min-h-[calc(100vh-300px)]">
            <textarea
              ref={textAreaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type / for commands, @ to reference content, # to add tags"
              className="w-full p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-base leading-relaxed absolute inset-0 text-transparent"
              style={{
                minHeight: 'calc(100vh - 300px)',
                height: 'auto',
                caretColor: '#4B5563',
                background: 'transparent'
              }}
            />

            <div className="w-full p-4 rounded-lg text-base leading-relaxed pointer-events-none">
              {content.split('\n').map((line, lineIndex) => (
                <div key={lineIndex} className="mb-1 text-gray-800">
                  {line.split(/(\*\*.*?\*\*|_.*?_|<u>.*?<\/u>)/).map((part: string, partIndex: number) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
                    }
                    if (part.startsWith('_') && part.endsWith('_')) {
                      return <em key={partIndex}>{part.slice(1, -1)}</em>;
                    }
                    if (part.startsWith('<u>') && part.endsWith('</u>')) {
                      return <u key={partIndex}>{part.slice(3, -4)}</u>;
                    }
                    return part;
                  })}
                </div>
              ))}
            </div>

            <CommandMenus
              showCommands={showCommands}
              showMentions={showMentions}
              showTags={showTags}
              menuPosition={menuPosition}
              searchTerm={searchTerm}
              onCommandSelect={handleCommand}
              onCloseCommands={() => setShowCommands(false)}
              textAreaRef={textAreaRef}
              onUpdate={onUpdate}
              noteId={note.id}
            />
          </div>
        </div>
      </div>

      <FullAnalysisModal
        showFullAnalysis={showFullAnalysis}
        setShowFullAnalysis={setShowFullAnalysis}
        selectedInsight={selectedInsight}
        references={references}
      />
    </div>
  );
}