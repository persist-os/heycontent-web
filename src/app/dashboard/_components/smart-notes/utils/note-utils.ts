import { Note } from '../types/index';

export const saveToLocal = (noteId: string, updates: Partial<Note>) => {
  const key = `note_${noteId}`;
  const existing = localStorage.getItem(key);
  const note = existing ? JSON.parse(existing) : {};
  localStorage.setItem(key, JSON.stringify({ ...note, ...updates }));
};

export const getCursorCoordinates = (textarea: HTMLTextAreaElement, position: number) => {
  const rect = textarea.getBoundingClientRect();
  const style = window.getComputedStyle(textarea);
  const lineHeight = parseInt(style.lineHeight);
  const paddingTop = parseInt(style.paddingTop);
  const paddingLeft = parseInt(style.paddingLeft);
  
  const text = textarea.value.substring(0, position);
  const lines = text.split('\n');
  const currentLine = lines[lines.length - 1];
  const lineNumber = lines.length;
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return { top: 0, left: 0 };
  
  context.font = style.font;
  const textWidth = context.measureText(currentLine).width;
  
  return {
    top: rect.top + paddingTop + (lineNumber * lineHeight),
    left: rect.left + paddingLeft + textWidth
  };
};

export const applyFormat = (
  content: string,
  selectedText: string,
  prefix: string,
  suffix: string = prefix,
  start: number,
  end: number,
  textarea: HTMLTextAreaElement | null
) => {
  if (!textarea) return { newContent: content, newCursorPosition: start };

  const newContent = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
  const newCursorPosition = end + prefix.length + suffix.length;
  
  return {
    newContent,
    newCursorPosition
  };
}; 