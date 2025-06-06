"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Note, NoteUpdate, Command } from '../types';
import { ShortcutManager } from '../keyboard-shortcuts';
import { saveToLocal, getCursorCoordinates } from '../utils/note-utils';
import { useTitleGeneration } from './useTitleGeneration';

interface UseSmartNoteEditorProps {
  note: Note;
  onUpdate: (noteId: string, updates: NoteUpdate) => Promise<Note>;
  onSave: () => void;
  onToggleShortcuts: () => void;
  onRequestAIInsights: (noteId: string, note: Note) => Promise<void>;
}

export function useSmartNoteEditor({
  note,
  onUpdate,
  onSave,
  onToggleShortcuts,
  onRequestAIInsights
}: UseSmartNoteEditorProps) {
  // Core state
  const [content, setContent] = useState(note.content || '');
  const [titleGenerated, setTitleGenerated] = useState(note.titleGenerated ?? false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  
  // Editor UI state
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const [showCommands, setShowCommands] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  
  // References
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastGenerationAttemptRef = useRef<string | null>(null);
  
  // Title generation hook
  const { generateTitle, loading: titleLoading, clearAttempted } = useTitleGeneration();

  // Sync state with note prop changes
  useEffect(() => {
    setContent(note.content || '');
    setTitleGenerated(note.titleGenerated ?? false);
    
    // Clear generation attempts when note changes
    if (note._id !== lastGenerationAttemptRef.current) {
      clearAttempted();
      lastGenerationAttemptRef.current = String(note._id);
    }
  }, [note._id, note.content, note.titleGenerated, clearAttempted]);
  
  // Memoized condition for title generation
  const shouldGenerateTitle = useMemo(() => {
    return (
      !titleGenerated && // Not already generated
      !isGeneratingTitle && // Not currently generating
      !titleLoading && // Hook not busy
      (!note.title || note.title === 'Untitled Note' || note.title.trim() === '') && // No meaningful title
      content.trim().length >= 20 // Sufficient content
    );
  }, [titleGenerated, isGeneratingTitle, titleLoading, note.title, content]);
  
  // Title generation effect - only triggers when conditions are met
  useEffect(() => {
    if (!shouldGenerateTitle) return;
    
    const generateTitleAsync = async () => {
      setIsGeneratingTitle(true);
      
      try {
        const result = await generateTitle({
          content,
          platform: note.platform || 'general',
          noteId: String(note._id),
        });
        
        if (result.title && result.wasGenerated) {
          // Update local state immediately
          setTitleGenerated(true);
          
          // Update note in database
          await onUpdate(String(note._id), {
            title: result.title,
            titleGenerated: true
          });
        }
      } catch (error) {
        console.error('Title generation failed:', error);
      } finally {
        setIsGeneratingTitle(false);
      }
    };
    
    // Debounce title generation
    const titleDebounceTimer = setTimeout(generateTitleAsync, 1000);
    
    return () => clearTimeout(titleDebounceTimer);
  }, [shouldGenerateTitle, content, note.platform, note._id, generateTitle, onUpdate]);
  
  // Debounced content update - separate from title generation
  const debouncedContentUpdate = useCallback((newContent: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      // Only update content, never title here
      onUpdate(String(note._id), { content: newContent });
    }, 2000);
  }, [note._id, onUpdate]);
  
  // Extract tags from content
  useEffect(() => {
    if (!content) return;
    
    const tagRegex = /#(\\w+)/g;
    const tags: string[] = [];
    let match;

    while ((match = tagRegex.exec(content)) !== null) {
      tags.push(match[1]);
    }

    if (JSON.stringify(tags) !== JSON.stringify(note.tags)) {
      onUpdate(String(note._id), { tags: [...new Set(tags)] });
    }
  }, [content, note._id, note.tags, onUpdate]);

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

  // Request AI insights
  const requestAIInsights = useCallback(() => {
    if (!note?._id) {
      console.error('Cannot request AI insights: note ID is missing');
      return;
    }
    
    setAiLoading(true);
    const currentNote = { ...note, content };
    
    onRequestAIInsights(String(note._id), currentNote)
      .finally(() => setAiLoading(false));
  }, [note, content, onRequestAIInsights]);

  // Generate a title from the note content
  const generateTitleFromContent = useCallback((content: string): string | null => {
    if (!content || content.trim().length === 0) return null;
    
    // Get the first non-empty line
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0) return null;
    
    // Use the first line, but limit it to a reasonable length
    let title = lines[0].trim();
    
    // Remove markdown formatting if present
    title = title.replace(/^#+\s+/, ''); // Remove heading markers
    title = title.replace(/[*_~`]/g, ''); // Remove basic formatting like **bold**, _italic_, etc.
    
    // Limit length and add ellipsis if needed
    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }
    
    return title;
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
    // Use debounced update instead of direct update
    debouncedContentUpdate(newContent);
  }, [content, note._id, debouncedContentUpdate]);

  // Insert text at cursor (no more command menu logic here)
  const insertText = useCallback((text: string) => {
    if (!textAreaRef.current) return;
    const start = textAreaRef.current.selectionStart || 0;
    const end = textAreaRef.current.selectionEnd || 0;
    let newCursorPosition = start + text.length;
    const newContent = content.substring(0, start) + text + content.substring(end);
    setContent(newContent);
    setCursorPosition(newCursorPosition);
    debouncedContentUpdate(newContent);
  }, [content, debouncedContentUpdate]);

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
        // Use debounced update instead of direct update
        debouncedContentUpdate(newContent);
      }
    }
  }, [content, insertText, debouncedContentUpdate]);

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
    debouncedContentUpdate(newContent);
  }, [debouncedContentUpdate, showCommands, updateMenuPosition]);

  // Handle command selection
  const handleCommand = useCallback((command: Command) => {
    if (command.type === 'format') {
      handleFormat(command.shortcut || '', command.shortcut || '');
    } else if (command.type === 'block' && command.template) {
      const template = command.template;
      if (textAreaRef.current) {
        const start = textAreaRef.current.selectionStart || 0;
        const end = textAreaRef.current.selectionEnd || 0;
        const newContent = content.substring(0, start - 1) + template + content.substring(end);
        setContent(newContent);
        setCursorPosition(start - 1 + template.length);
        debouncedContentUpdate(newContent);
      } else {
        insertText(template);
      }
    } else if (command.type === 'metadata' && command.metadata) {
      onUpdate(String(note._id), { [command.metadata.type || '']: command.metadata.value });
    }
    setShowCommands(false);
  }, [content, debouncedContentUpdate, handleFormat, insertText, note._id, onUpdate]);

  // Set up shortcut manager
  const shortcutManager = useRef(
    new ShortcutManager({
      onSave,
      onQuickCapture: requestAIInsights,
      onCommandMenu: () => {
        if (textAreaRef.current) {
          // Just insert '/', rely on handleContentChange to handle menu
          insertText('/');
        }
      },
      onMention: () => {
        insertText('@');
      },
      onTag: () => {
        insertText('#');
        setShowTags(true);
        setShowCommands(false);
        setShowMentions(false);
      },
      onBold: () => handleFormat('**', '**'),
      onItalic: () => handleFormat('*', '*'),
      onUnderline: () => handleFormat('_', '_'),
      onIndent: () => handleIndent(true),
      onUnindent: () => handleIndent(false),
      onToggleShortcuts,
      onEscape: () => {
        setShowCommands(false);
        setShowMentions(false);
        setShowTags(false);
      }
    })
  ).current;

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    shortcutManager.handleKeyDown(e as any);
  }, [shortcutManager]);
  
  return {
    content,
    titleGenerated,
    isGeneratingTitle,
    aiLoading,
    setAiLoading,
    showFullAnalysis,
    setShowFullAnalysis,
    selectedInsight,
    setSelectedInsight,
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
    requestAIInsights,
    handleFormat,
    insertText,
    handleIndent,
    handleContentChange,
    handleCommand,
    handleKeyDown,
  };
}
