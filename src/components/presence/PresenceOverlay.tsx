'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePresenceStore } from '@/store/presence-store';
import { PresenceCursor, PresenceSelection, PresenceTypingIndicator } from './PresenceCursor';

interface PresenceOverlayProps {
  editorRef: React.RefObject<HTMLElement>;
  textContent: string;
  className?: string;
}

// Text metrics calculator for cursor positioning
class TextMetrics {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private editorElement: HTMLElement;
  private textContent: string;

  constructor(editorElement: HTMLElement, textContent: string) {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
    this.editorElement = editorElement;
    this.textContent = textContent;
    
    // Copy editor font styles to canvas for accurate measurements
    const computedStyle = window.getComputedStyle(editorElement);
    this.context.font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;
  }

  getPositionFromOffset(offset: number): { x: number; y: number; height: number } {
    const editorRect = this.editorElement.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(this.editorElement);
    const lineHeight = parseFloat(computedStyle.lineHeight) || 24;
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;

    // Split text into lines
    const textBeforeOffset = this.textContent.substring(0, offset);
    const lines = textBeforeOffset.split('\n');
    const currentLine = lines.length - 1;
    const textInCurrentLine = lines[currentLine] || '';

    // Calculate position
    const x = paddingLeft + this.context.measureText(textInCurrentLine).width;
    const y = paddingTop + (currentLine * lineHeight);

    return {
      x: Math.max(0, x),
      y: Math.max(0, y),
      height: lineHeight,
    };
  }

  getSelectionRects(start: number, end: number): Array<{ x: number; y: number; width: number; height: number }> {
    if (start >= end) return [];

    const editorRect = this.editorElement.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(this.editorElement);
    const lineHeight = parseFloat(computedStyle.lineHeight) || 24;
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;

    const rects: Array<{ x: number; y: number; width: number; height: number }> = [];
    const lines = this.textContent.split('\n');
    
    let currentOffset = 0;
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const lineStart = currentOffset;
      const lineEnd = currentOffset + line.length;
      
      // Check if selection intersects with this line
      if (start <= lineEnd && end >= lineStart) {
        const selectionStart = Math.max(start, lineStart);
        const selectionEnd = Math.min(end, lineEnd);
        
        if (selectionStart < selectionEnd) {
          const textBeforeSelection = line.substring(0, selectionStart - lineStart);
          const selectedText = line.substring(selectionStart - lineStart, selectionEnd - lineStart);
          
          const x = paddingLeft + this.context.measureText(textBeforeSelection).width;
          const y = paddingTop + (lineIndex * lineHeight);
          const width = this.context.measureText(selectedText).width;
          
          rects.push({
            x: Math.max(0, x),
            y: Math.max(0, y),
            width: Math.max(1, width),
            height: lineHeight,
          });
        }
      }
      
      currentOffset = lineEnd + 1; // +1 for the newline character
      
      if (currentOffset > end) break;
    }
    
    return rects;
  }
}

export function PresenceOverlay({ editorRef, textContent, className = '' }: PresenceOverlayProps) {
  const { activeUsers, currentUser } = usePresenceStore();
  const [editorRect, setEditorRect] = useState<DOMRect | null>(null);
  const [textMetrics, setTextMetrics] = useState<TextMetrics | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Update editor rect and text metrics when editor or content changes
  useEffect(() => {
    if (!editorRef.current) return;

    const updateMetrics = () => {
      const rect = editorRef.current!.getBoundingClientRect();
      setEditorRect(rect);
      setTextMetrics(new TextMetrics(editorRef.current!, textContent));
    };

    updateMetrics();

    // Set up resize observer to update metrics when editor size changes
    resizeObserverRef.current = new ResizeObserver(updateMetrics);
    resizeObserverRef.current.observe(editorRef.current);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [editorRef, textContent]);

  // Don't render if we don't have the necessary data
  if (!editorRect || !textMetrics || !editorRef.current) {
    return null;
  }

  // Filter out current user from display
  const otherUsers = Array.from(activeUsers.values()).filter(
    user => !currentUser || user.userId !== currentUser.userId
  );

  if (otherUsers.length === 0) {
    return null;
  }

  return (
    <div
      className={`absolute inset-0 pointer-events-none z-30 ${className}`}
      style={{
        left: 0,
        top: 0,
        width: editorRect.width,
        height: editorRect.height,
      }}
    >
      {otherUsers.map(user => (
        <React.Fragment key={user.userId}>
          {/* Render selections first (lower z-index) */}
          <PresenceSelection
            user={user}
            editorRect={editorRect}
            textMetrics={textMetrics}
          />
          
          {/* Render cursors */}
          <PresenceCursor
            user={user}
            editorRect={editorRect}
            textMetrics={textMetrics}
          />
          
          {/* Render typing indicators */}
          <PresenceTypingIndicator
            user={user}
            editorRect={editorRect}
            textMetrics={textMetrics}
          />
        </React.Fragment>
      ))}
    </div>
  );
}
