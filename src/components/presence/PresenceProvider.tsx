'use client';

import React, { useEffect } from 'react';
import { usePresenceIntegration } from '@/hooks/usePresenceIntegration';
import { PresenceOverlay } from './PresenceOverlay';
import { PresenceNotifications } from './PresenceNotifications';
import { CollaboratorPanel, FloatingCollaboratorIndicator } from './CollaboratorPanel';

interface PresenceProviderProps {
  noteId: string;
  userId: string;
  userName: string;
  editorRef: React.RefObject<HTMLTextAreaElement | HTMLElement>;
  textContent: string;
  enabled?: boolean;
  showNotifications?: boolean;
  showFloatingIndicator?: boolean;
  showCollaboratorPanel?: boolean;
  children?: React.ReactNode;
}

export function PresenceProvider({
  noteId,
  userId,
  userName,
  editorRef,
  textContent,
  enabled = true,
  showNotifications = true,
  showFloatingIndicator = false,
  showCollaboratorPanel = false,
  children
}: PresenceProviderProps) {
  
  // Initialize presence integration
  usePresenceIntegration({
    noteId,
    userId,
    userName,
    editorRef,
    enabled
  });

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      
      {/* Presence overlay for cursors and selections */}
      <PresenceOverlay 
        editorRef={editorRef}
        textContent={textContent}
      />
      
      {/* Notifications for joins/leaves */}
      {showNotifications && (
        <PresenceNotifications 
          enabled={enabled}
          showJoinNotifications={true}
          showLeaveNotifications={true}
        />
      )}
      
      {/* Floating collaborator indicator */}
      {showFloatingIndicator && (
        <FloatingCollaboratorIndicator />
      )}
      
      {/* Full collaborator panel */}
      {showCollaboratorPanel && (
        <CollaboratorPanel className="mt-4" />
      )}
    </>
  );
}

// Convenience hook for getting presence-enabled editor props
export function usePresenceEnabledEditor({
  noteId,
  userId,
  userName,
  textContent,
  enabled = true
}: {
  noteId: string;
  userId: string;
  userName: string;
  textContent: string;
  enabled?: boolean;
}) {
  const editorRef = React.useRef<HTMLTextAreaElement>(null);
  
  const presenceProps = {
    noteId,
    userId,
    userName,
    editorRef,
    textContent,
    enabled
  };

  return {
    editorRef,
    presenceProps,
    PresenceWrapper: ({ children, ...props }: { children: React.ReactNode } & Partial<PresenceProviderProps>) => (
      <PresenceProvider {...presenceProps} {...props}>
        {children}
      </PresenceProvider>
    )
  };
}
