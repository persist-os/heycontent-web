"use client";
import React, { useRef, useEffect, forwardRef, useState, useCallback } from 'react';
import { InlineCommandPalette } from './InlineCommandPalette';
import { useInlineAI } from '../hooks/useInlineAI';
import { NoteContentRenderer } from './NoteContentRenderer';

interface NoteEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  noteId?: string;
  noteTitle?: string;
  platform?: string;
  tags?: string[];
  userId: string;
  noteType?: string;
  availableNotes?: Array<{ _id: string; title: string; type: string }>;
  onLinkNote?: (noteId: string) => void;
}

export const NoteEditor = forwardRef<HTMLTextAreaElement, NoteEditorProps>((
  {
    content,
    onContentChange,
    placeholder = "Type your note here...",
    disabled = false,
    noteId,
    noteTitle,
    platform,
    tags,
    userId,
    noteType,
    availableNotes = [],
    onLinkNote
  }, 
  ref
) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [palettePosition, setPalettePosition] = useState({ top: 0, left: 0 });
  const [isFocused, setIsFocused] = useState(false);
  const [paletteMode, setPaletteMode] = useState<'commands' | 'notes'>('commands');

  // Initialize the inline AI hook
  const { askAI, requestAnalysis, requestIdeas } = useInlineAI({
    noteId,
    noteContent: content,
    noteTitle,
    platform,
    tags,
    userId,
  });

  // Sync the forwarded ref with our internal ref
  useEffect(() => {
    if (ref && typeof ref === 'function') {
      ref(textAreaRef.current);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = textAreaRef.current;
    }
  }, [ref]);

  // Sync scroll between textarea and overlay
  const handleScroll = useCallback(() => {
    if (textAreaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textAreaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textAreaRef.current.scrollLeft;
    }
  }, []);

  // Calculate cursor position for command palette
  const getCursorCoordinates = useCallback(() => {
    if (!textAreaRef.current) return { top: 100, left: 100 };
    
    const textarea = textAreaRef.current;
    const rect = textarea.getBoundingClientRect();
    const start = textarea.selectionStart;
    const value = textarea.value;
    
    // Simple approach: calculate approximate position based on text dimensions
    const textBeforeCursor = value.substring(0, start);
    const lines = textBeforeCursor.split('\n');
    const currentLineIndex = lines.length - 1;
    const currentLineText = lines[currentLineIndex] || '';
    
    // Get computed styles
    const computed = window.getComputedStyle(textarea);
    const fontSize = parseInt(computed.fontSize, 10) || 16;
    const lineHeight = computed.lineHeight === 'normal' 
      ? fontSize * 1.2 
      : parseInt(computed.lineHeight, 10) || fontSize * 1.2;
    const paddingTop = parseInt(computed.paddingTop, 10) || 0;
    const paddingLeft = parseInt(computed.paddingLeft, 10) || 0;
    
    // Create a temporary canvas to measure text width
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = computed.font;
      const textWidth = ctx.measureText(currentLineText).width;
      
      // Calculate position
      const x = rect.left + paddingLeft + textWidth;
      const y = rect.top + paddingTop + (currentLineIndex * lineHeight) + lineHeight + 10;
      
      return {
        top: Math.min(y, window.innerHeight - 300),
        left: Math.min(x, window.innerWidth - 400)
      };
    }
    
    // Fallback if canvas fails
    return {
      top: rect.top + 50,
      left: rect.left + 50
    };
  }, []);

  // Handle content changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange(e.target.value);
  }, [onContentChange]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + K to open inline command palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      e.stopPropagation();
      const coords = getCursorCoordinates();
      setPalettePosition(coords);
      setPaletteMode('commands');
      setShowCommandPalette(true);
      return;
    }

    // '/' at the start of a line to open command palette
    if (e.key === '/') {
      const textarea = textAreaRef.current;
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const lineStart = content.lastIndexOf('\n', start - 1) + 1;
      const lineContent = content.substring(lineStart, start);
      
      if (lineContent.trim() === '') {
        e.preventDefault();
        e.stopPropagation();
        const coords = getCursorCoordinates();
        setPalettePosition(coords);
        setPaletteMode('commands');
        setShowCommandPalette(true);
        return;
      }
    }

    // '@' to open note linking palette
    if (e.key === '@') {
      // Don't prevent default - let the @ be typed first
      // Open the palette after the @ is inserted
      setTimeout(() => {
        const coords = getCursorCoordinates();
        setPalettePosition(coords);
        setPaletteMode('notes');
        setShowCommandPalette(true);
      }, 0);
      return;
    }

    // Handle ESC to close command palette
    if (e.key === 'Escape' && showCommandPalette) {
      e.preventDefault();
      e.stopPropagation();
      setShowCommandPalette(false);
      return;
    }
  }, [content, getCursorCoordinates, showCommandPalette]);

  // Insert content at cursor position
  const insertAtCursor = useCallback((text: string) => {
    if (!textAreaRef.current) return;
    
    const textarea = textAreaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newContent = content.substring(0, start) + text + content.substring(end);
    const newCursorPosition = start + text.length;
    
    onContentChange(newContent);
    
    // Set cursor position after content update
    setTimeout(() => {
      if (textAreaRef.current) {
        textAreaRef.current.selectionStart = newCursorPosition;
        textAreaRef.current.selectionEnd = newCursorPosition;
        textAreaRef.current.focus();
      }
    }, 0);
  }, [content, onContentChange]);

  // Handle AI responses
  const handleAskAI = useCallback(async (prompt: string) => {
    try {
      const response = await askAI(prompt);
      insertAtCursor(`\n\n${response}`);
    } catch (error) {
      console.error('Failed to get AI response:', error);
    }
  }, [askAI, insertAtCursor]);

  const handleRequestAnalysis = useCallback(async (noteType: string) => {
    try {
      const analysis = await requestAnalysis(noteType);
      insertAtCursor(`\n\n## Analysis\n\n${analysis}`);
    } catch (error) {
      console.error('Failed to get analysis:', error);
    }
  }, [requestAnalysis, insertAtCursor]);

  const handleRequestIdeas = useCallback(async () => {
    try {
      const ideas = await requestIdeas();
      const ideasText = ideas.map((idea, index) => `${index + 1}. ${idea}`).join('\n');
      insertAtCursor(`\n\n## Ideas\n\n${ideasText}`);
    } catch (error) {
      console.error('Failed to get ideas:', error);
    }
  }, [requestIdeas, insertAtCursor]);

  // Handle note linking - fixed to not replace the user's @ but just add title and closing @
  const handleLinkNote = useCallback((noteId: string) => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    const selectedNote = availableNotes.find(note => String(note._id) === noteId);
    if (!selectedNote) return;

    // Just add the title and closing @ (don't replace the user's @)
    const linkText = `${selectedNote.title}@`;
    const currentContent = content;
    const cursorPos = textarea.selectionStart;

    // Insert the title and closing @ at the current cursor position
    const newContent = 
      currentContent.substring(0, cursorPos) + 
      linkText + 
      currentContent.substring(cursorPos);

    const newCursorPosition = cursorPos + linkText.length;
    onContentChange(newContent);
    
    // Set cursor position after content update
    setTimeout(() => {
      if (textAreaRef.current) {
        textAreaRef.current.selectionStart = newCursorPosition;
        textAreaRef.current.selectionEnd = newCursorPosition;
        textAreaRef.current.focus();
      }
    }, 0);
  }, [availableNotes, content, onContentChange]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Textarea for text input with visible cursor and selection, but invisible text */}
      <textarea
        ref={textAreaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onScroll={handleScroll}
        className="absolute inset-0 w-full h-full min-h-[300px] resize-none p-4 text-base leading-relaxed bg-transparent caret-foreground border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 transition-all duration-200 rounded-md z-0 selection:bg-primary/20"
        placeholder=""
        disabled={disabled}
        spellCheck={true}
        autoFocus={!disabled}
        style={{ 
          color: 'transparent',
          caretColor: 'var(--foreground)'
        }}
      />
      
      {/* Visual overlay with rendered content and clickable links */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 p-4 text-base leading-relaxed whitespace-pre-wrap overflow-hidden bg-background text-foreground rounded-md pointer-events-none z-10"
        onClick={() => textAreaRef.current?.focus()}
      >
        <NoteContentRenderer
          content={content}
          availableNotes={availableNotes}
          onLinkNote={onLinkNote}
        />
        
        {/* Placeholder text when empty */}
        {!content && !isFocused && (
          <div className="text-muted-foreground/50 pointer-events-none">
            {placeholder}
            {'\n\n⌘K or / to open inline AI assistant • @ to link notes • ⌘K outside editor for global search'}
          </div>
        )}
      </div>
      
      <InlineCommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        position={palettePosition}
        onAskAI={handleAskAI}
        onRequestAnalysis={handleRequestAnalysis}
        onRequestIdeas={handleRequestIdeas}
        onLinkNote={handleLinkNote}
        noteType={noteType}
        availableNotes={availableNotes}
        currentNoteId={noteId}
        showNoteLinks={paletteMode === 'notes'}
      />
    </div>
  );
});

NoteEditor.displayName = 'NoteEditor';
