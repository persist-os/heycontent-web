"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Note, NoteUpdate, Command } from '../types';
import { getCursorCoordinates } from '../utils/note-utils';

interface UseSmartNoteEditorProps {
  note: Note;
}

export function useSmartNoteEditor({
  note,
}: UseSmartNoteEditorProps) {
  // Core state
  const [content, setContent] = useState(note.content || '');
  
  // Editor UI state
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const [showCommands, setShowCommands] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  
  // References
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  
  // Sync state with note prop changes
  useEffect(() => {
    setContent(note.content || '');
  }, [note._id, note.content]);

  // Load from local storage
  useEffect(() => {
    const key = `note_${note._id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const localNote = JSON.parse(saved);
        setContent(localNote.content || note.content || '');
      } catch (e) {
        console.error('Failed to parse saved note:', e);
      }
    }
  }, [note._id, note.content]);

  // Reset text area ref
  const setTextAreaRef = useCallback((node: HTMLTextAreaElement | null) => {
    textAreaRef.current = node;
  }, []);

  // Update cursor position and menu
  const updateMenuPosition = useCallback(() => {
    if (!textAreaRef.current) return;
    
    const { top, left } = getCursorCoordinates(
      textAreaRef.current, 
      textAreaRef.current.selectionStart || 0
    );
    
    setMenuPosition({
      top: top + 20,
      left: Math.max(10, left)
    });
  }, []);

  // Handle text formatting
  const handleFormat = useCallback((prefix: string, suffix: string = prefix) => {
    if (!textAreaRef.current) return;
    
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
  }, [content]);

  // Insert text at cursor (no more command menu logic here)
  const insertText = useCallback((text: string) => {
    if (!textAreaRef.current) return;
    const start = textAreaRef.current.selectionStart || 0;
    const end = textAreaRef.current.selectionEnd || 0;
    const newCursorPosition = start + text.length;
    const newContent = content.substring(0, start) + text + content.substring(end);
    setContent(newContent);
    setCursorPosition(newCursorPosition);
  }, [content]);

  // Handle indentation
  const handleIndent = useCallback((indent: boolean = true) => {
    if (!textAreaRef.current) return;
    
    if (indent) {
      insertText('  ');
    } else {
      const start = textAreaRef.current.selectionStart || 0;
      const lineStart = content.lastIndexOf('\n', start) + 1;
      const lineContent = content.substring(lineStart, start);
      
      if (lineContent.startsWith('  ')) {
        const newContent = content.substring(0, lineStart) + content.substring(lineStart + 2);
        setContent(newContent);
      }
    }
  }, [content, insertText]);

  // Handle content changes from typing
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    // Unified '/' trigger and command menu logic
    if (textAreaRef.current) {
      const cursorPos = textAreaRef.current.selectionStart;
      const lineStart = newContent.lastIndexOf('\n', cursorPos - 1) + 1;
      const lineContent = newContent.substring(lineStart, cursorPos);
      // If the user just typed a '/' at the start of a line, open the command menu
      if (lineContent === '/') {
        updateMenuPosition();
        setSearchTerm('');
        setShowCommands(true);
        setShowMentions(false);
        setShowTags(false);
      } else if (lineContent.startsWith('/')) {
        // If user is typing after '/', filter commands
        setSearchTerm(lineContent.substring(1));
        setShowCommands(true);
      } else if (showCommands && !lineContent.includes('/')) {
        // If '/' is deleted, close the menu
        setShowCommands(false);
      }
    }
  }, [showCommands, updateMenuPosition]);

  // Handle command selection
  const handleCommand = useCallback((command: Command) => {
    if (command.type === 'format') {
      handleFormat(command.shortcut || '', command.shortcut || '');
    } else if (command.type === 'block' && command.template) {
      const template = command.template;
      if (textAreaRef.current) {
        const start = textAreaRef.current.selectionStart || 0;
        const end = textAreaRef.current.selectionEnd || 0;
        const commandStartPos = start - searchTerm.length - 1;
        const newContent = content.substring(0, commandStartPos) + template + content.substring(end);
        setContent(newContent);
        setCursorPosition(commandStartPos + template.length);
      } else {
        insertText(template);
      }
    }
    setShowCommands(false);
    setSearchTerm('');
  }, [content, handleFormat, insertText, searchTerm]);

  return {
    content,
    cursorPosition,
    setCursorPosition,
    showCommands,
    setShowCommands,
    showMentions,
    setShowMentions,
    showTags,
    setShowTags,
    menuPosition,
    setMenuPosition,
    searchTerm,
    setSearchTerm,
    textAreaRef: setTextAreaRef,
    updateMenuPosition,
    handleFormat,
    insertText,
    handleIndent,
    handleContentChange,
    handleCommand,
  };
}
