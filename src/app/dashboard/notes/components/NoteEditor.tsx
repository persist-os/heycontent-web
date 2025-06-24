"use client";
import React, { forwardRef, useCallback, useRef, useState, useEffect } from 'react';
import { RichTextEditor } from '@/components/ui/rich-text-editor/rich-text-editor';
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
  availableNotes?: Array<{ _id: string; title: string; type: string }>;
  onLinkNote?: (noteId: string) => void;
}

export const NoteEditor = forwardRef<HTMLDivElement, NoteEditorProps>((
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
  const textAreaRef = useRef<HTMLDivElement>(null);
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
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = textAreaRef.current;
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
    
    const element = textAreaRef.current;
    const rect = element.getBoundingClientRect();
    
    // For contentEditable, we need to use Selection API
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return {
        top: rect.top + 50,
        left: rect.left + 50
      };
    }
    
    const range = selection.getRangeAt(0);
    const rangeRect = range.getBoundingClientRect();
    
    return {
      top: Math.min(rangeRect.bottom + 10, window.innerHeight - 300),
      left: Math.min(rangeRect.left, window.innerWidth - 400)
    };
  }, []);

  // Handle content changes
  const handleChange = useCallback((content: string) => {
    onContentChange(content);
  }, [onContentChange]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
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
      const selection = window.getSelection();
      if (!selection || !textAreaRef.current) return;
      
      const range = selection.getRangeAt(0);
      const textContent = textAreaRef.current.textContent || '';
      
      // Get cursor position in text
      let cursorOffset = 0;
      const walker = document.createTreeWalker(
        textAreaRef.current,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node === range.startContainer) {
          cursorOffset += range.startOffset;
          break;
        }
        cursorOffset += node.textContent?.length || 0;
      }
      
      // Find the start of the current line
      const beforeCursor = textContent.substring(0, cursorOffset);
      const lastNewline = beforeCursor.lastIndexOf('\n');
      const lineContent = beforeCursor.substring(lastNewline + 1);
      
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
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    
    // Move cursor after the inserted text
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Trigger content change
    const newContent = textAreaRef.current.textContent || '';
    onContentChange(newContent);
  }, [onContentChange]);

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

  // Handle note linking - updated for contentEditable
  const handleLinkNote = useCallback((noteId: string) => {
    if (!textAreaRef.current) return;

    const selectedNote = availableNotes.find(note => String(note._id) === noteId);
    if (!selectedNote) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const linkText = `@[${selectedNote.title}]@`;
    
    // Insert the link text at cursor position
    range.deleteContents();
    range.insertNode(document.createTextNode(linkText));
    
    // Move cursor after the inserted text
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Trigger content change
    const newContent = textAreaRef.current.textContent || '';
    onContentChange(newContent);
  }, [availableNotes, onContentChange]);

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
