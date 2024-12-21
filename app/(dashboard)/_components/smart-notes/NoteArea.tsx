import React, { useState, useEffect, useRef } from 'react';
import { AtSign, Lightbulb, Hash, Star, Calendar, Image, LinkIcon, MessageSquare } from 'lucide-react';
import type { Note } from './index';
import { ShortcutManager } from './keyboard-shortcuts';

interface NoteAreaProps {
  note: Note;
  onUpdate: (noteId: string, updates: Partial<Note>) => void;
  showCommands: boolean;
  setShowCommands: (show: boolean) => void;
  onSave?: () => void;
  onToggleShortcuts?: () => void;
}

export function NoteArea({ 
  note, 
  onUpdate, 
  showCommands, 
  setShowCommands,
  onSave,
  onToggleShortcuts
}: NoteAreaProps) {
  const [content, setContent] = useState(note.content);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const references = Array.isArray(note.references) ? note.references : [];
  const [showMentions, setShowMentions] = useState(false);
  const [showTags, setShowTags] = useState(false);

  useEffect(() => {
    setContent(note.content);
  }, [note.content]);

  const insertText = (text: string) => {
    if (!textAreaRef.current) return;
    const start = textAreaRef.current.selectionStart;
    const end = textAreaRef.current.selectionEnd;
    const newContent = content.substring(0, start) + text + content.substring(end);
    setContent(newContent);
    onUpdate(note.id, { content: newContent });
    setCursorPosition(start + text.length);
  };

  useEffect(() => {
    const shortcutManager = new ShortcutManager({
      onSave: () => {
        onSave?.();
        onUpdate(note.id, { content });
      },
      onQuickCapture: () => {
        const newContent = content + '\n\n/capture';
        setContent(newContent);
        onUpdate(note.id, { content: newContent });
      },
      onCommandMenu: () => {
        setShowCommands(true);
        setShowMentions(false);
        setShowTags(false);
      },
      onMention: () => {
        insertText('@');
        setShowMentions(true);
        setShowCommands(false);
        setShowTags(false);
      },
      onTag: () => {
        insertText('#');
        setShowTags(true);
        setShowCommands(false);
        setShowMentions(false);
      },
      onBold: () => {
        if (!textAreaRef.current) return;
        const start = textAreaRef.current.selectionStart;
        const end = textAreaRef.current.selectionEnd;
        const selectedText = content.substring(start, end);
        insertText(`**${selectedText}**`);
      },
      onItalic: () => {
        if (!textAreaRef.current) return;
        const start = textAreaRef.current.selectionStart;
        const end = textAreaRef.current.selectionEnd;
        const selectedText = content.substring(start, end);
        insertText(`_${selectedText}_`);
      },
      onUnderline: () => {
        if (!textAreaRef.current) return;
        const start = textAreaRef.current.selectionStart;
        const end = textAreaRef.current.selectionEnd;
        const selectedText = content.substring(start, end);
        insertText(`<u>${selectedText}</u>`);
      },
      onIndent: () => {
        insertText('  ');
      },
      onUnindent: () => {
        if (!textAreaRef.current) return;
        const start = textAreaRef.current.selectionStart;
        const lineStart = content.lastIndexOf('\n', start - 1) + 1;
        const line = content.substring(lineStart, start);
        if (line.startsWith('  ')) {
          const newContent = content.substring(0, lineStart) + line.substring(2) + content.substring(start);
          setContent(newContent);
          onUpdate(note.id, { content: newContent });
          setCursorPosition(start - 2);
        }
      },
      onToggleShortcuts: onToggleShortcuts
    });

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCommands(false);
        setShowMentions(false);
        setShowTags(false);
        return;
      }
      shortcutManager.handleKeyDown(e);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [note.id, content, onUpdate, setShowCommands, onSave, onToggleShortcuts]);

  useEffect(() => {
    if (cursorPosition !== null && textAreaRef.current) {
      textAreaRef.current.focus();
      textAreaRef.current.setSelectionRange(cursorPosition, cursorPosition);
      setCursorPosition(null);
    }
  }, [cursorPosition]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    
    // Check for command triggers
    if (newContent.endsWith('/')) {
      setShowCommands(true);
      setShowMentions(false);
      setShowTags(false);
    } else if (showCommands && !newContent.endsWith('/')) {
      setShowCommands(false);
    }

    // Check for mention triggers
    if (newContent.endsWith('@')) {
      setShowMentions(true);
      setShowCommands(false);
      setShowTags(false);
    } else if (showMentions && !newContent.endsWith('@')) {
      setShowMentions(false);
    }

    // Check for tag triggers
    if (newContent.endsWith('#')) {
      setShowTags(true);
      setShowCommands(false);
      setShowMentions(false);
    } else if (showTags && !newContent.endsWith('#')) {
      setShowTags(false);
    }

    onUpdate(note.id, { content: newContent });
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-gray-100 p-4">
        <input 
          type="text"
          value={note.title}
          onChange={(e) => onUpdate(note.id, { title: e.target.value })}
          className="text-xl font-semibold bg-transparent border-none focus:outline-none w-full"
          placeholder="Untitled Note"
        />
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-4">
          {references.map((ref, index) => (
            <div 
              key={index}
              className={`p-3 ${
                ref.type === 'ai_insight' ? 'bg-blue-50' : 'border-l-4 border-purple-500 pl-3'
              } rounded-lg`}
            >
              <div className="flex items-center gap-2 text-blue-600 text-sm font-medium mb-2">
                {ref.type === 'ai_insight' ? (
                  <AtSign className="w-4 h-4" />
                ) : (
                  <Lightbulb className="w-4 h-4" />
                )}
                {ref.type === 'ai_insight' ? 'AI Insight Reference' : 'New Idea'}
              </div>
              <p className="text-gray-600">{ref.content}</p>
            </div>
          ))}

          <div className="relative">
            <textarea
              ref={textAreaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Type / for commands, @ to reference content, # to add tags"
              className="w-full p-3 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[300px] resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 