'use client';

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ProjectPresenceIndicatorProps {
  projectId: Id<'projects'>;
  currentView?: string;
  currentItemId?: string;
}

interface PresenceUser {
  userId: string;
  userName: string;
  userColor: string;
  currentView?: string;
  currentItemId?: string;
  isActive: boolean;
  lastSeen: number;
}

// Generate consistent color for user (same as presence-store.ts)
const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
];

function generateUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}

export function ProjectPresenceIndicator({ 
  projectId, 
  currentView,
  currentItemId 
}: ProjectPresenceIndicatorProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get userId from cookie/API key
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await getCurrentUserId();
        setUserId(id);
      } catch (error) {
        console.error('Failed to get user ID:', error);
      }
    };
    fetchUserId();
  }, []);
  
  // Get user info from Convex
  const userInfo = useQuery(
    api.userQueries.getUserInfo,
    userId ? { userId } : 'skip'
  );
  
  const userName = userInfo?.name || userInfo?.email || 'User';

  // Query presence data (auto-updates via Convex subscription)
  const presence = useQuery(
    api.projectPresence.getProjectPresence,
    projectId ? { projectId } : 'skip'
  ) as PresenceUser[] | undefined;

  const updatePresence = useMutation(api.projectPresence.updateProjectPresence);
  const removePresence = useMutation(api.projectPresence.removeProjectPresence);

  // Debounced presence update (5s)
  const debouncedUpdate = useCallback(() => {
    if (!userId || !projectId) return;
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      updatePresence({
        projectId,
        userId,
        userName,
        userColor: generateUserColor(userId),
        currentView,
        currentItemId,
        isActive: true,
      }).catch(console.error);
    }, 5000);
  }, [userId, projectId, userName, currentView, currentItemId, updatePresence]);

  // Heartbeat (30s) - immediate updates
  useEffect(() => {
    if (!userId || !projectId) return;

    const heartbeat = setInterval(() => {
      updatePresence({
        projectId,
        userId,
        userName,
        userColor: generateUserColor(userId),
        currentView,
        currentItemId,
        isActive: true,
      }).catch(console.error);
    }, 30000);

    // Initial presence update
    updatePresence({
      projectId,
      userId,
      userName,
      userColor: generateUserColor(userId),
      currentView,
      currentItemId,
      isActive: true,
    }).catch(console.error);

    return () => {
      clearInterval(heartbeat);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      // Remove presence on unmount
      if (userId && projectId) {
        removePresence({ projectId, userId }).catch(console.error);
      }
    };
  }, [projectId, userId, userName, currentView, currentItemId, updatePresence, removePresence]);

  // Update presence when currentView or currentItemId changes (debounced)
  useEffect(() => {
    if (userId && projectId) {
      debouncedUpdate();
    }
  }, [currentView, currentItemId, debouncedUpdate, userId, projectId]);

  if (!presence || presence.length === 0) return null;

  // Filter out current user from display
  const otherUsers = presence.filter(p => p.userId !== userId);

  if (otherUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {otherUsers.map((user) => (
          <div key={user.userId} className="relative group">
            <Avatar
              className="w-8 h-8 border-2 border-background"
              style={{ borderColor: user.userColor }}
            >
              <AvatarFallback
                className="text-xs font-medium"
                style={{ 
                  backgroundColor: user.userColor,
                  color: '#fff'
                }}
              >
                {user.userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {user.currentView && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover border border-border rounded-md text-xs text-popover-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {user.userName} • {user.currentView}
              </div>
            )}
          </div>
        ))}
      </div>
      {otherUsers.length > 0 && (
        <span className="text-xs text-muted-foreground">
          {otherUsers.length} {otherUsers.length === 1 ? 'other' : 'others'} viewing
        </span>
      )}
    </div>
  );
}

