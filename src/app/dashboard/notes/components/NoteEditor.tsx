"use client";
import React, { forwardRef, useCallback, useRef, useState, useEffect } from 'react';
import { RichTextEditor } from '@/components/ui/rich-text-editor/rich-text-editor';
import { useInlineAI } from '../hooks/useInlineAI';
import { NoteContentRenderer } from './NoteContentRenderer';
import { InlineCommandPalette } from './InlineCommandPalette';

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
      // The RichTextEditor will handle inserting the response
      return response;
    } catch (error) {
      console.error('Failed to get AI response:', error);
    }
  }, [askAI]);

  const handleRequestAnalysis = useCallback(async (noteType: string) => {
    try {
      const analysis = await requestAnalysis(noteType);
      // The RichTextEditor will handle inserting the analysis
      return analysis;
    } catch (error) {
      console.error('Failed to get analysis:', error);
    }
  }, [requestAnalysis]);

  const handleRequestIdeas = useCallback(async () => {
    try {
      const ideas = await requestIdeas();
      // The RichTextEditor will handle formatting and inserting the ideas
      return ideas;
    } catch (error) {
      console.error('Failed to get ideas:', error);
    }
  }, [requestIdeas]);

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
    <RichTextEditor
      ref={ref}
      content={content}
      onContentChange={onContentChange}
      placeholder={placeholder}
      disabled={disabled}
      onAskAI={handleAskAI}
      onRequestAnalysis={handleRequestAnalysis}
      onRequestIdeas={handleRequestIdeas}
      noteId={noteId}
      noteTitle={noteTitle}
      platform={platform}
      tags={tags}
      userId={userId}
      noteType={noteType}
    />
  );
});

NoteEditor.displayName = 'NoteEditor';
