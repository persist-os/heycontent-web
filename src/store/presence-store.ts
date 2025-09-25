import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { ConvexReactClient } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

// Types for presence data
export interface UserPresence {
  userId: string;
  userName: string;
  userColor: string;
  cursorPosition: number;
  selectionRange: { start: number; end: number } | null;
  isTyping: boolean;
  lastSeen: number;
  scrollPosition: number;
  viewport: { top: number; bottom: number };
}

export interface PresenceStoreState {
  // Core presence data
  activeUsers: Map<string, UserPresence>;
  currentUser: {
    userId: string;
    userName: string;
    userColor: string;
  } | null;
  
  // Current document/note context
  currentNoteId: string | null;
  
  // Heartbeat and cleanup
  heartbeatInterval: NodeJS.Timeout | null;
  cleanupInterval: NodeJS.Timeout | null;
  lastHeartbeat: number;
  
  // Connection state
  isConnected: boolean;
  convexClient: ConvexReactClient | null;
  
  // Actions
  initializePresence: (userId: string, userName: string, noteId: string, convex: ConvexReactClient) => void;
  updateCursorPosition: (position: number) => void;
  updateSelection: (start: number, end: number) => void;
  updateScrollPosition: (position: number, viewport: { top: number; bottom: number }) => void;
  setTyping: (isTyping: boolean) => void;
  updatePresenceData: (users: UserPresence[]) => void;
  cleanup: () => void;
  disconnect: () => void;
  
  // Utility functions
  getUserColor: (userId: string) => string;
  getActiveUserCount: () => number;
  isUserActive: (userId: string) => boolean;
}

// Color palette for user avatars and cursors
const USER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Light Yellow
  '#BB8FCE', // Light Purple
  '#85C1E9', // Light Blue
  '#F8C471', // Orange
  '#82E0AA', // Light Green
];

// Generate consistent color for user
function generateUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}

// Stale presence cleanup threshold (30 seconds)
const STALE_THRESHOLD = 30 * 1000;
const HEARTBEAT_INTERVAL = 2500; // 2.5 seconds
const CLEANUP_INTERVAL = 5000; // 5 seconds

export const usePresenceStore = create<PresenceStoreState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    activeUsers: new Map(),
    currentUser: null,
    currentNoteId: null,
    heartbeatInterval: null,
    cleanupInterval: null,
    lastHeartbeat: 0,
    isConnected: false,
    convexClient: null,

    // Initialize presence system
    initializePresence: (userId: string, userName: string, noteId: string, convex: ConvexReactClient) => {
      const state = get();
      
      // Clean up existing intervals
      if (state.heartbeatInterval) {
        clearInterval(state.heartbeatInterval);
      }
      if (state.cleanupInterval) {
        clearInterval(state.cleanupInterval);
      }

      const userColor = generateUserColor(userId);
      
      set({
        currentUser: { userId, userName, userColor },
        currentNoteId: noteId,
        convexClient: convex,
        isConnected: true,
        lastHeartbeat: Date.now(),
      });

      // Start heartbeat system
      const heartbeatInterval = setInterval(() => {
        const currentState = get();
        if (currentState.currentUser && currentState.currentNoteId && currentState.convexClient) {
          const activeUser = currentState.activeUsers.get(currentState.currentUser.userId);
          
          // Send presence update
          currentState.convexClient.mutation(api.presence.updatePresence, {
            noteId: currentState.currentNoteId,
            userId: currentState.currentUser.userId,
            userName: currentState.currentUser.userName,
            userColor: currentState.currentUser.userColor,
            cursorPosition: activeUser?.cursorPosition || 0,
            selectionRange: activeUser?.selectionRange || null,
            isTyping: activeUser?.isTyping || false,
            scrollPosition: activeUser?.scrollPosition || 0,
            viewport: activeUser?.viewport || { top: 0, bottom: 0 },
          }).catch(console.error);

          set({ lastHeartbeat: Date.now() });
        }
      }, HEARTBEAT_INTERVAL);

      // Start cleanup system
      const cleanupInterval = setInterval(() => {
        const currentState = get();
        const now = Date.now();
        const updatedUsers = new Map(currentState.activeUsers);
        
        // Remove stale users
        for (const [userId, user] of updatedUsers) {
          if (now - user.lastSeen > STALE_THRESHOLD) {
            updatedUsers.delete(userId);
          }
        }
        
        if (updatedUsers.size !== currentState.activeUsers.size) {
          set({ activeUsers: updatedUsers });
        }
      }, CLEANUP_INTERVAL);

      set({ heartbeatInterval, cleanupInterval });
    },

    // Update cursor position
    updateCursorPosition: (position: number) => {
      const state = get();
      if (!state.currentUser) return;

      const updatedUsers = new Map(state.activeUsers);
      const currentPresence = updatedUsers.get(state.currentUser.userId) || {
        userId: state.currentUser.userId,
        userName: state.currentUser.userName,
        userColor: state.currentUser.userColor,
        cursorPosition: 0,
        selectionRange: null,
        isTyping: false,
        lastSeen: Date.now(),
        scrollPosition: 0,
        viewport: { top: 0, bottom: 0 },
      };

      updatedUsers.set(state.currentUser.userId, {
        ...currentPresence,
        cursorPosition: position,
        lastSeen: Date.now(),
      });

      set({ activeUsers: updatedUsers });

      // Immediate broadcast for cursor moves
      if (state.convexClient && state.currentNoteId) {
        state.convexClient.mutation(api.presence.updatePresence, {
          noteId: state.currentNoteId,
          userId: state.currentUser.userId,
          userName: state.currentUser.userName,
          userColor: state.currentUser.userColor,
          cursorPosition: position,
          selectionRange: currentPresence.selectionRange,
          isTyping: currentPresence.isTyping,
          scrollPosition: currentPresence.scrollPosition,
          viewport: currentPresence.viewport,
        }).catch(console.error);
      }
    },

    // Update selection range
    updateSelection: (start: number, end: number) => {
      const state = get();
      if (!state.currentUser) return;

      const selectionRange = start === end ? null : { start, end };
      const updatedUsers = new Map(state.activeUsers);
      const currentPresence = updatedUsers.get(state.currentUser.userId) || {
        userId: state.currentUser.userId,
        userName: state.currentUser.userName,
        userColor: state.currentUser.userColor,
        cursorPosition: start,
        selectionRange: null,
        isTyping: false,
        lastSeen: Date.now(),
        scrollPosition: 0,
        viewport: { top: 0, bottom: 0 },
      };

      updatedUsers.set(state.currentUser.userId, {
        ...currentPresence,
        cursorPosition: start,
        selectionRange,
        lastSeen: Date.now(),
      });

      set({ activeUsers: updatedUsers });

      // Immediate broadcast for selection changes
      if (state.convexClient && state.currentNoteId) {
        state.convexClient.mutation(api.presence.updatePresence, {
          noteId: state.currentNoteId,
          userId: state.currentUser.userId,
          userName: state.currentUser.userName,
          userColor: state.currentUser.userColor,
          cursorPosition: start,
          selectionRange,
          isTyping: currentPresence.isTyping,
          scrollPosition: currentPresence.scrollPosition,
          viewport: currentPresence.viewport,
        }).catch(console.error);
      }
    },

    // Update scroll position and viewport
    updateScrollPosition: (position: number, viewport: { top: number; bottom: number }) => {
      const state = get();
      if (!state.currentUser) return;

      const updatedUsers = new Map(state.activeUsers);
      const currentPresence = updatedUsers.get(state.currentUser.userId) || {
        userId: state.currentUser.userId,
        userName: state.currentUser.userName,
        userColor: state.currentUser.userColor,
        cursorPosition: 0,
        selectionRange: null,
        isTyping: false,
        lastSeen: Date.now(),
        scrollPosition: 0,
        viewport: { top: 0, bottom: 0 },
      };

      updatedUsers.set(state.currentUser.userId, {
        ...currentPresence,
        scrollPosition: position,
        viewport,
        lastSeen: Date.now(),
      });

      set({ activeUsers: updatedUsers });
    },

    // Set typing state
    setTyping: (isTyping: boolean) => {
      const state = get();
      if (!state.currentUser) return;

      const updatedUsers = new Map(state.activeUsers);
      const currentPresence = updatedUsers.get(state.currentUser.userId) || {
        userId: state.currentUser.userId,
        userName: state.currentUser.userName,
        userColor: state.currentUser.userColor,
        cursorPosition: 0,
        selectionRange: null,
        isTyping: false,
        lastSeen: Date.now(),
        scrollPosition: 0,
        viewport: { top: 0, bottom: 0 },
      };

      updatedUsers.set(state.currentUser.userId, {
        ...currentPresence,
        isTyping,
        lastSeen: Date.now(),
      });

      set({ activeUsers: updatedUsers });

      // Immediate broadcast for typing state changes
      if (state.convexClient && state.currentNoteId) {
        state.convexClient.mutation(api.presence.updatePresence, {
          noteId: state.currentNoteId,
          userId: state.currentUser.userId,
          userName: state.currentUser.userName,
          userColor: state.currentUser.userColor,
          cursorPosition: currentPresence.cursorPosition,
          selectionRange: currentPresence.selectionRange,
          isTyping,
          scrollPosition: currentPresence.scrollPosition,
          viewport: currentPresence.viewport,
        }).catch(console.error);
      }
    },

    // Update presence data from Convex subscription
    updatePresenceData: (users: UserPresence[]) => {
      const state = get();
      const updatedUsers = new Map(state.activeUsers);
      
      // Update with fresh data from server
      users.forEach(user => {
        // Don't overwrite our own data with potentially stale server data
        if (state.currentUser && user.userId === state.currentUser.userId) {
          return;
        }
        updatedUsers.set(user.userId, user);
      });
      
      set({ activeUsers: updatedUsers });
    },

    // Cleanup function
    cleanup: () => {
      const state = get();
      
      if (state.heartbeatInterval) {
        clearInterval(state.heartbeatInterval);
      }
      if (state.cleanupInterval) {
        clearInterval(state.cleanupInterval);
      }
      
      set({
        activeUsers: new Map(),
        heartbeatInterval: null,
        cleanupInterval: null,
        isConnected: false,
      });
    },

    // Disconnect and cleanup
    disconnect: () => {
      const state = get();
      
      // Send disconnect signal
      if (state.convexClient && state.currentNoteId && state.currentUser) {
        state.convexClient.mutation(api.presence.removePresence, {
          noteId: state.currentNoteId,
          userId: state.currentUser.userId,
        }).catch(console.error);
      }
      
      state.cleanup();
      
      set({
        currentUser: null,
        currentNoteId: null,
        convexClient: null,
      });
    },

    // Utility functions
    getUserColor: (userId: string) => generateUserColor(userId),
    
    getActiveUserCount: () => {
      const state = get();
      return state.activeUsers.size;
    },
    
    isUserActive: (userId: string) => {
      const state = get();
      const user = state.activeUsers.get(userId);
      if (!user) return false;
      
      const now = Date.now();
      return (now - user.lastSeen) < STALE_THRESHOLD;
    },
  }))
);
