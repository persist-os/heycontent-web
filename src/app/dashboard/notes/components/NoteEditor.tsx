"use client";
import React, { useRef, useEffect, forwardRef, useState, useCallback } from 'react';
import { InlineCommandPalette } from './InlineCommandPalette';
import { useInlineAI } from '../hooks/useInlineAI';

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
    noteType
  }, 
  ref
) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [palettePosition, setPalettePosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [isFocused, setIsFocused] = useState(false);

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
        top: Math.min(y, window.innerHeight - 300), // Ensure palette fits on screen
        left: Math.min(x, window.innerWidth - 400)  // Ensure palette fits on screen
      };
    }
    
    // Fallback if canvas fails
    return {
      top: rect.top + 50,
      left: rect.left + 50
    };
  }, []);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + K to open inline command palette (only when textarea is focused)
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      e.stopPropagation(); // Prevent global command palette from opening
      const coords = getCursorCoordinates();
      setPalettePosition(coords);
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
      
      // If we're at the start of a line or only whitespace before cursor
      if (lineContent.trim() === '') {
        e.preventDefault();
        e.stopPropagation(); // Prevent any potential conflicts
        const coords = getCursorCoordinates();
        setPalettePosition(coords);
        setShowCommandPalette(true);
        return;
      }
    }

    // Handle ESC to close command palette
    if (e.key === 'Escape' && showCommandPalette) {
      e.preventDefault();
      e.stopPropagation();
      setShowCommandPalette(false);
      return;
    }
  }, [content, getCursorCoordinates, showCommandPalette]);

  // Handle content changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const newCursorPosition = e.target.selectionStart;
    
    onContentChange(newContent);
    setCursorPosition(newCursorPosition);
  }, [onContentChange]);

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
      // Could show a toast notification here
    }
  }, [askAI, insertAtCursor]);

  const handleRequestAnalysis = useCallback(async (noteType: string) => {
    try {
      const analysis = await requestAnalysis(noteType);
      insertAtCursor(`\n\n## Analysis\n\n${analysis}`);
    } catch (error) {
      console.error('Failed to get analysis:', error);
      // Could show a toast notification here
    }
  }, [requestAnalysis, insertAtCursor]);

  const handleRequestIdeas = useCallback(async () => {
    try {
      const ideas = await requestIdeas();
      const ideasText = ideas.map((idea, index) => `${index + 1}. ${idea}`).join('\n');
      insertAtCursor(`\n\n## Ideas\n\n${ideasText}`);
    } catch (error) {
      console.error('Failed to get ideas:', error);
      // Could show a toast notification here
    }
  }, [requestIdeas, insertAtCursor]);

  return (
    <div className="relative w-full h-full">
      <textarea
        ref={textAreaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="w-full h-full min-h-[300px] resize-none p-4 text-base leading-relaxed 
          bg-background text-foreground placeholder:text-muted-foreground/50
          border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2
          transition-all duration-200 rounded-md
          transform-gpu will-change-contents"
        placeholder={`${placeholder}

⌘K or / to open inline AI assistant • ⌘K outside editor for global search`}
        disabled={disabled}
        spellCheck={true}
        autoFocus={!disabled}
      />
      
      <InlineCommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        position={palettePosition}
        onAskAI={handleAskAI}
        onRequestAnalysis={handleRequestAnalysis}
        onRequestIdeas={handleRequestIdeas}
        noteType={noteType}
      />
    </div>
  );
});

NoteEditor.displayName = 'NoteEditor';
