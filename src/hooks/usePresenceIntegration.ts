'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePresenceStore } from '@/store/presence-store';
import { useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';

interface UsePresenceIntegrationProps {
  noteId: string;
  userId: string;
  userName: string;
  editorRef: React.RefObject<HTMLTextAreaElement | HTMLElement>;
  enabled?: boolean;
}

export function usePresenceIntegration({
  noteId,
  userId,
  userName,
  editorRef,
  enabled = true
}: UsePresenceIntegrationProps) {
  const convex = useConvex();
  const {
    initializePresence,
    updateCursorPosition,
    updateSelection,
    updateScrollPosition,
    setTyping,
    updatePresenceData,
    disconnect,
    currentNoteId
  } = usePresenceStore();

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCursorPositionRef = useRef<number>(-1);
  const lastSelectionRef = useRef<{ start: number; end: number } | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to presence updates from Convex
  const presenceData = useQuery(api.presence.getPresence, 
    enabled && noteId ? { noteId } : 'skip'
  );

  // Initialize presence when component mounts or noteId changes
  useEffect(() => {
    if (!enabled || !noteId || !userId || !userName) return;

    // Only initialize if we're not already connected to this note
    if (currentNoteId !== noteId) {
      initializePresence(userId, userName, noteId, convex);
    }

    return () => {
      // Cleanup when unmounting or changing notes
      if (currentNoteId === noteId) {
        disconnect();
      }
    };
  }, [enabled, noteId, userId, userName, convex, initializePresence, disconnect, currentNoteId]);

  // Update presence data when Convex subscription changes
  useEffect(() => {
    if (presenceData) {
      updatePresenceData(presenceData);
    }
  }, [presenceData, updatePresenceData]);

  // Debounced cursor position update
  const debouncedUpdateCursor = useCallback((position: number) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      if (position !== lastCursorPositionRef.current) {
        updateCursorPosition(position);
        lastCursorPositionRef.current = position;
      }
    }, 100); // 100ms debounce
  }, [updateCursorPosition]);

  // Handle cursor position changes
  const handleCursorChange = useCallback(() => {
    if (!enabled || !editorRef.current) return;

    const element = editorRef.current;
    let cursorPosition = 0;
    let selectionStart = 0;
    let selectionEnd = 0;

    if (element instanceof HTMLTextAreaElement) {
      cursorPosition = element.selectionStart;
      selectionStart = element.selectionStart;
      selectionEnd = element.selectionEnd;
    } else {
      // For content editable elements, we need to calculate position differently
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        cursorPosition = range.startOffset;
        selectionStart = range.startOffset;
        selectionEnd = range.endOffset;
      }
    }

    // Update cursor position (debounced)
    debouncedUpdateCursor(cursorPosition);

    // Update selection (immediate)
    const newSelection = { start: selectionStart, end: selectionEnd };
    const lastSelection = lastSelectionRef.current;
    
    if (!lastSelection || 
        lastSelection.start !== newSelection.start || 
        lastSelection.end !== newSelection.end) {
      updateSelection(selectionStart, selectionEnd);
      lastSelectionRef.current = newSelection;
    }
  }, [enabled, editorRef, debouncedUpdateCursor, updateSelection]);

  // Handle typing state
  const handleTyping = useCallback(() => {
    if (!enabled) return;

    setTyping(true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing to false after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 1000);
  }, [enabled, setTyping]);

  // Handle scroll position changes
  const handleScroll = useCallback(() => {
    if (!enabled || !editorRef.current) return;

    const element = editorRef.current;
    const scrollTop = element.scrollTop;
    const clientHeight = element.clientHeight;
    
    const viewport = {
      top: scrollTop,
      bottom: scrollTop + clientHeight
    };

    updateScrollPosition(scrollTop, viewport);
  }, [enabled, editorRef, updateScrollPosition]);

  // Set up event listeners
  useEffect(() => {
    if (!enabled || !editorRef.current) return;

    const element = editorRef.current;

    // Cursor and selection events
    const handleSelectionChange = () => {
      handleCursorChange();
    };

    // Typing events
    const handleInput = () => {
      handleTyping();
      handleCursorChange(); // Cursor might change during typing
    };

    const handleKeyDown = () => {
      handleTyping();
    };

    // Mouse events for cursor changes
    const handleMouseUp = () => {
      // Small delay to ensure selection has been updated
      setTimeout(handleCursorChange, 10);
    };

    // Scroll events
    const handleScrollEvent = () => {
      handleScroll();
    };

    // Add event listeners
    if (element instanceof HTMLTextAreaElement) {
      element.addEventListener('input', handleInput);
      element.addEventListener('keydown', handleKeyDown);
      element.addEventListener('mouseup', handleMouseUp);
      element.addEventListener('selectionchange', handleSelectionChange);
      element.addEventListener('scroll', handleScrollEvent);
    } else {
      // For content editable elements
      element.addEventListener('input', handleInput);
      element.addEventListener('keydown', handleKeyDown);
      element.addEventListener('mouseup', handleMouseUp);
      element.addEventListener('scroll', handleScrollEvent);
      
      // Listen to document selection changes for content editable
      document.addEventListener('selectionchange', handleSelectionChange);
    }

    // Initial cursor position
    handleCursorChange();
    handleScroll();

    return () => {
      // Cleanup event listeners
      if (element instanceof HTMLTextAreaElement) {
        element.removeEventListener('input', handleInput);
        element.removeEventListener('keydown', handleKeyDown);
        element.removeEventListener('mouseup', handleMouseUp);
        element.removeEventListener('selectionchange', handleSelectionChange);
        element.removeEventListener('scroll', handleScrollEvent);
      } else {
        element.removeEventListener('input', handleInput);
        element.removeEventListener('keydown', handleKeyDown);
        element.removeEventListener('mouseup', handleMouseUp);
        element.removeEventListener('scroll', handleScrollEvent);
        document.removeEventListener('selectionchange', handleSelectionChange);
      }

      // Clear timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [enabled, editorRef, handleCursorChange, handleTyping, handleScroll]);

  return {
    // Expose some utilities for manual control if needed
    updateCursorPosition: debouncedUpdateCursor,
    updateSelection,
    setTyping,
    handleCursorChange,
    handleTyping,
  };
}
