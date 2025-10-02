import { useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { UnifiedContent, PlatformContentData } from '@/types/content';
import { useContentStore } from '@/store/content-store';
import { useEffect, useMemo } from 'react';

// Content resolution utility that replaces getAllLinkableContent
export function useContentResolver(userId: string | undefined) {
  const convex = useConvex();
  const store = useContentStore();
  
  // Initialize content when userId is available
  useEffect(() => {
    if (userId && !store.isInitialized) {
      store.initializeContent(userId, convex);
    }
  }, [userId, store.isInitialized]);

  // Return content and utilities
  return {
    // Data
    allContent: store.allContent,
    content: store.content,
    isLoading: Object.values(store.loading).some(Boolean),
    isInitialized: store.isInitialized,
    errors: store.errors,
    hasErrors: Object.values(store.errors).some(Boolean),
    
    // Utilities (these replace getAllLinkableContent functionality)
    findContentById: (contentId: string) => store.findContentById(contentId),
    getContentByPlatform: (platform: keyof PlatformContentData) => 
      store.getContentByPlatform(platform),
    getAllLinkableContent: () => store.getAllLinkableContent(),
    getContentByTab: (currentTab: string) => store.getContentByTab(currentTab),
    
    // Actions
    refreshContent: () => userId && store.refreshContent(userId, convex),
    refreshPlatform: (platform: keyof PlatformContentData) => 
      userId && store.refreshPlatform(userId, platform, convex),
    invalidateContent: store.invalidateContent,
    
    // Infinite scroll actions
    loadMoreContent: (platform: keyof PlatformContentData) => 
      userId && store.loadMoreContent(userId, platform, convex),
    resetPlatformScroll: store.resetPlatformScroll,
    
    // Platform-specific infinite scroll state
    getPlatformScrollState: (platform: keyof PlatformContentData) => store.content[platform],
  };
}

// Helper function to resolve content IDs to titles (for api-utils.ts)
export async function resolveContentTitles(
  contentIds: string[], 
  userId: string,
  convex: any
): Promise<Record<string, string>> {
  const titles: Record<string, string> = {};
  
  try {
    // Fetch content from notes only
    const [notes] = await Promise.allSettled([
      convex.query(api.noteQueries.getUserNotes, { userId, numItems: 1000 }), // Get up to 1000 notes
    ]);
    
    // Process notes
    if (notes.status === 'fulfilled') {
      notes.value.page.forEach((note: any) => {
        titles[String(note._id)] = note.title || 'Untitled Note';
        titles[`note:${note._id}`] = note.title || 'Untitled Note';
        titles[`notes:${note._id}`] = note.title || 'Untitled Note';
      });
    }
    
    // Only return titles for the requested content IDs
    const requestedTitles: Record<string, string> = {};
    contentIds.forEach(id => {
      if (titles[id]) {
        requestedTitles[id] = titles[id];
      }
    });
    
    return requestedTitles;
  } catch (error) {
    console.error('Error resolving content titles:', error);
    return {};
  }
}

// Helper function to resolve all link content (for api-utils.ts)
export async function resolveAllLinkContent(
  content: string,
  userId: string,
  convex: any
): Promise<any[]> {
  const contentIdPattern = /@\[([^\]]+)\]@/g;
  const matches = Array.from(content.matchAll(contentIdPattern));
  
  if (matches.length === 0) {
    return [];
  }
  
  const contentIds = matches.map(match => match[1]);
  const resolvedContent: any[] = [];
  
  try {
    // Fetch content from notes only
    const [notes] = await Promise.allSettled([
      convex.query(api.noteQueries.getUserNotes, { userId, numItems: 1000 }), // Get up to 1000 notes
    ]);
    
    for (const contentId of contentIds) {
      let foundContent = null;
      
      // Check if it's a prefixed ID
      if (contentId.includes(':')) {
        const [prefix, id] = contentId.split(':', 2);
        
        switch (prefix) {
          case 'note':
          case 'notes':
            if (notes.status === 'fulfilled') {
              foundContent = notes.value.page.find((note: any) => String(note._id) === id);
              if (foundContent) {
                resolvedContent.push({
                  type: 'note',
                  id: contentId,
                  title: foundContent.title || 'Untitled Note',
                  content: foundContent.content || '',
                  platform: 'smart-notes',
                  createdAt: foundContent.createdAt || Date.now(),
                });
              }
            }
            break;
        }
      } else {
        // Handle non-prefixed IDs (assume they're notes)
        if (notes.status === 'fulfilled') {
          foundContent = notes.value.page.find((note: any) => String(note._id) === contentId);
          if (foundContent) {
            resolvedContent.push({
              type: 'note',
              id: contentId,
              title: foundContent.title || 'Untitled Note',
              content: foundContent.content || '',
              platform: 'smart-notes',
              createdAt: foundContent.createdAt || Date.now(),
            });
          }
        }
      }
    }
    
    return resolvedContent;
  } catch (error) {
    console.error('Error resolving all link content:', error);
    return [];
  }
}

// Helper to get content by platform with infinite scroll support
export function useContentByPlatform(platform: 'smart-notes' | 'conversations') {
  const content = useContentStore(state => state.content);
  const loading = useContentStore(state => state.loading);
  const errors = useContentStore(state => state.errors);
  
  const platformKey = platform === 'smart-notes' ? 'notes' : platform;
  
  return useMemo(() => {
    const platformContent = content[platformKey as keyof typeof content];
    return {
      content: platformContent.items || [],
      loading: loading[platformKey as keyof typeof loading],
      error: errors[platformKey as keyof typeof errors],
      hasError: !!errors[platformKey as keyof typeof errors],
      // Infinite scroll state
      hasMore: platformContent.hasMore,
      isLoadingMore: platformContent.isLoadingMore,
      totalLoaded: platformContent.totalLoaded,
      nextCursor: platformContent.nextCursor,
      scrollState: platformContent,
    };
  }, [content, loading, errors, platformKey]);
} 