"use client";
import React, { useRef, useEffect, forwardRef } from 'react';

interface NoteEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  updateMenuPosition?: () => void;
  cursorPosition: number | null;
  setCursorPosition: (position: number | null) => void;
}

export const NoteEditor = forwardRef<HTMLTextAreaElement, NoteEditorProps>((
  {
    content,
    onContentChange,
    onKeyDown,
    placeholder = "Type your note here...",
    disabled = false,
    updateMenuPosition,
    cursorPosition,
    setCursorPosition
  }, 
  ref
) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  // Sync the forwarded ref with our internal ref
  useEffect(() => {
    if (ref && typeof ref === 'function') {
      ref(textAreaRef.current);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = textAreaRef.current;
    }
  }, [ref]);

  // Set cursor position when it changes
  useEffect(() => {
    if (textAreaRef.current && cursorPosition !== null) {
      textAreaRef.current.selectionStart = cursorPosition;
      textAreaRef.current.selectionEnd = cursorPosition;
      textAreaRef.current.focus();
    }
  }, [cursorPosition]);

  // Handle content change and cursor position updates
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    onContentChange(newContent);
    if (updateMenuPosition) {
      setTimeout(updateMenuPosition, 0);
    }
  };

  // Robust keydown handler to ensure '/' always triggers command menu
  //const handleKeyDownInternal = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    //if (e.key === '/') {
      // Let the input update first, then handle content change
      //setTimeout(() => {
        //if (textAreaRef.current) {
          //onContentChange(textAreaRef.current.value);
        //}
      //}, 0);
    //}
    //onKeyDown(e);
  //};

  return (
    <div className="w-full h-full">
      <textarea
        ref={textAreaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        className="w-full h-full min-h-[300px] resize-none p-4 text-base leading-relaxed 
          bg-background text-foreground placeholder:text-muted-foreground/50
          border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2
          transition-colors duration-200 rounded-md"
        placeholder={placeholder}
        disabled={disabled}
        spellCheck={true}
      />
    </div>
  );
});

NoteEditor.displayName = 'NoteEditor';
