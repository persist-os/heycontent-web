'use client';

import React, { useEffect, useState } from 'react';
import { usePresenceStore, UserPresence } from '@/store/presence-store';
import { toast } from 'sonner';
import { UserPlus, UserMinus } from 'lucide-react';

interface PresenceNotificationsProps {
  enabled?: boolean;
  showJoinNotifications?: boolean;
  showLeaveNotifications?: boolean;
}

export function PresenceNotifications({ 
  enabled = true,
  showJoinNotifications = true,
  showLeaveNotifications = true 
}: PresenceNotificationsProps) {
  const { activeUsers, currentUser } = usePresenceStore();
  const [previousUsers, setPreviousUsers] = useState<Map<string, UserPresence>>(new Map());
  
  useEffect(() => {
    if (!enabled || !currentUser) return;
    
    // Compare current users with previous users to detect joins/leaves
    const currentUserIds = new Set(activeUsers.keys());
    const previousUserIds = new Set(previousUsers.keys());
    
    // Detect new users (joins)
    if (showJoinNotifications) {
      for (const userId of currentUserIds) {
        if (!previousUserIds.has(userId) && userId !== currentUser.userId) {
          const user = activeUsers.get(userId);
          if (user) {
            toast.success(`${user.userName} joined the document`, {
              icon: <UserPlus className="w-4 h-4" />,
              duration: 3000,
            });
          }
        }
      }
    }
    
    // Detect users who left
    if (showLeaveNotifications) {
      for (const userId of previousUserIds) {
        if (!currentUserIds.has(userId) && userId !== currentUser.userId) {
          const user = previousUsers.get(userId);
          if (user) {
            toast.info(`${user.userName} left the document`, {
              icon: <UserMinus className="w-4 h-4" />,
              duration: 2000,
            });
          }
        }
      }
    }
    
    // Update previous users for next comparison
    setPreviousUsers(new Map(activeUsers));
  }, [activeUsers, currentUser, enabled, showJoinNotifications, showLeaveNotifications, previousUsers]);
  
  return null; // This component only handles notifications
}
