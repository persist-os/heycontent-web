'use client';

import React from 'react';
import { UserPresence } from '@/store/presence-store';

interface PresenceCursorProps {
  user: UserPresence;
  editorRect: DOMRect;
  textMetrics: {
    getPositionFromOffset: (offset: number) => { x: number; y: number; height: number };
  };
}

export function PresenceCursor({ user, editorRect, textMetrics }: PresenceCursorProps) {
  const position = textMetrics.getPositionFromOffset(user.cursorPosition);
  
  // Don't render if position is invalid
  if (position.x < 0 || position.y < 0) {
    return null;
  }

  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-200 ease-out"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translateX(-1px)', // Center the cursor line
      }}
    >
      {/* Cursor line */}
      <div
        className="w-0.5 transition-all duration-200 ease-out"
        style={{
          height: position.height,
          backgroundColor: user.userColor,
          boxShadow: `0 0 4px ${user.userColor}40`,
        }}
      />
      
      {/* User label */}
      <div
        className="absolute -top-6 left-0 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap transition-all duration-200 ease-out"
        style={{
          backgroundColor: user.userColor,
          transform: 'translateX(-50%)',
        }}
      >
        {user.userName}
        {user.isTyping && (
          <span className="ml-1 inline-flex">
            <span className="animate-pulse">●</span>
          </span>
        )}
      </div>
    </div>
  );
}

interface PresenceSelectionProps {
  user: UserPresence;
  editorRect: DOMRect;
  textMetrics: {
    getPositionFromOffset: (offset: number) => { x: number; y: number; height: number };
    getSelectionRects: (start: number, end: number) => Array<{ x: number; y: number; width: number; height: number }>;
  };
}

export function PresenceSelection({ user, editorRect, textMetrics }: PresenceSelectionProps) {
  if (!user.selectionRange || user.selectionRange.start === user.selectionRange.end) {
    return null;
  }

  const selectionRects = textMetrics.getSelectionRects(
    user.selectionRange.start,
    user.selectionRange.end
  );

  if (selectionRects.length === 0) {
    return null;
  }

  return (
    <div className="absolute pointer-events-none z-40">
      {selectionRects.map((rect, index) => (
        <div
          key={index}
          className="absolute transition-all duration-200 ease-out"
          style={{
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
            backgroundColor: `${user.userColor}20`,
            border: `1px solid ${user.userColor}40`,
          }}
        />
      ))}
      
      {/* Selection tooltip */}
      {selectionRects.length > 0 && (
        <div
          className="absolute px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap transition-all duration-200 ease-out"
          style={{
            left: selectionRects[0].x,
            top: selectionRects[0].y - 28,
            backgroundColor: user.userColor,
            transform: 'translateX(-50%)',
          }}
        >
          {user.userName} selected
        </div>
      )}
    </div>
  );
}

interface PresenceTypingIndicatorProps {
  user: UserPresence;
  editorRect: DOMRect;
  textMetrics: {
    getPositionFromOffset: (offset: number) => { x: number; y: number; height: number };
  };
}

export function PresenceTypingIndicator({ user, editorRect, textMetrics }: PresenceTypingIndicatorProps) {
  if (!user.isTyping) {
    return null;
  }

  const position = textMetrics.getPositionFromOffset(user.cursorPosition);
  
  // Don't render if position is invalid
  if (position.x < 0 || position.y < 0) {
    return null;
  }

  return (
    <div
      className="absolute pointer-events-none z-45 transition-all duration-200 ease-out"
      style={{
        left: position.x + 8, // Offset from cursor
        top: position.y,
      }}
    >
      {/* Typing animation */}
      <div
        className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium text-white"
        style={{
          backgroundColor: user.userColor,
        }}
      >
        <span>{user.userName} is typing</span>
        <div className="flex space-x-0.5">
          <div
            className="w-1 h-1 rounded-full animate-pulse"
            style={{
              backgroundColor: 'white',
              animationDelay: '0ms',
              animationDuration: '1000ms',
            }}
          />
          <div
            className="w-1 h-1 rounded-full animate-pulse"
            style={{
              backgroundColor: 'white',
              animationDelay: '200ms',
              animationDuration: '1000ms',
            }}
          />
          <div
            className="w-1 h-1 rounded-full animate-pulse"
            style={{
              backgroundColor: 'white',
              animationDelay: '400ms',
              animationDuration: '1000ms',
            }}
          />
        </div>
      </div>
    </div>
  );
}
