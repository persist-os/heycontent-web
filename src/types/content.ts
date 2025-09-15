import { ConvexReactClient } from 'convex/react';

// Unified content interface for all platforms
export interface UnifiedContent {
  id: string;
  title: string;
  type: 'note' | 'conversation';
  contentType: string;
  platform: string;
  createdAt: number;
  updatedAt: number;
  important: boolean;
  tags: string[];
  analysis?: any;
  analysisMarkdown?: string; // Markdown-formatted analysis
  content?: string;
  // Conversation specific
  messages?: any[];
  recommendations?: any[];
}

// Infinite scroll state per platform
export interface InfiniteScrollState {
  items: UnifiedContent[];
  hasMore: boolean;
  isLoadingMore: boolean;
  nextCursor: string | null;
  totalLoaded: number;
  isInitialized: boolean;
  error: string | null;
  // Memory management
  maxItems: number;
  loadedPages: number;
  // Performance tracking
  lastLoadTime: number;
  scrollVelocity: number;
}

// Loading states per platform
export interface PlatformLoadingState {
  notes: boolean;
  conversations: boolean;
}

// Error states per platform
export interface PlatformErrorState {
  notes: string | null;
  conversations: string | null;
}

// Content data per platform with infinite scroll support
export interface PlatformContentData {
  notes: InfiniteScrollState;
  conversations: InfiniteScrollState;
}

// Legacy flat content arrays for backward compatibility
export interface LegacyPlatformContentData {
  notes: UnifiedContent[];
  conversations: UnifiedContent[];
}

export interface ContentStoreState {
  // Data
  content: PlatformContentData;
  allContent: UnifiedContent[];
  
  // Loading states
  loading: PlatformLoadingState;
  isInitialized: boolean;
  lastFetchedUserId: string | null;
  
  // Cache metadata
  cacheTimestamp: number;
  cacheValidDuration: number; // 5 minutes in milliseconds
  
  // Error states
  errors: PlatformErrorState;
  
  // Actions
  initializeContent: (userId: string, convex: ConvexReactClient) => Promise<void>;
  refreshContent: (userId: string, convex: ConvexReactClient) => Promise<void>;
  refreshPlatform: (userId: string, platform: keyof PlatformContentData, convex: ConvexReactClient) => Promise<void>;
  invalidateContent: () => void;
  isCacheValid: () => boolean;
  
  // Infinite scroll actions
  loadMoreContent: (userId: string, platform: keyof PlatformContentData, convex: ConvexReactClient) => Promise<void>;
  initializePlatform: (userId: string, platform: keyof PlatformContentData, convex: ConvexReactClient) => Promise<void>;
  resetPlatformScroll: (platform: keyof PlatformContentData) => void;
  
  // Content resolution helpers
  findContentById: (contentId: string) => UnifiedContent | null;
  getContentByPlatform: (platform: keyof PlatformContentData) => UnifiedContent[];
  getAllLinkableContent: () => UnifiedContent[];
  getContentByTab: (currentTab: string) => UnifiedContent[];
  
  // Legacy compatibility
  getLegacyContentByPlatform: (platform: keyof PlatformContentData) => UnifiedContent[];
}

// Configuration for infinite scroll
export const INFINITE_SCROLL_CONFIG = {
  PAGE_SIZE: 20,
  PRELOAD_THRESHOLD: 0.8, // Load more when 80% scrolled
  MAX_ITEMS_IN_MEMORY: 500,
  VIEWPORT_BUFFER: 50, // Items to render outside viewport
  SCROLL_DEBOUNCE_MS: 100,
} as const;

// Initial states
export const createInitialInfiniteScrollState = (): InfiniteScrollState => ({
  items: [],
  hasMore: true,
  isLoadingMore: false,
  nextCursor: null,
  totalLoaded: 0,
  isInitialized: false,
  error: null,
  maxItems: INFINITE_SCROLL_CONFIG.MAX_ITEMS_IN_MEMORY,
  loadedPages: 0,
  lastLoadTime: 0,
  scrollVelocity: 0,
});

export const initialPlatformLoadingState: PlatformLoadingState = {
  notes: false,
  conversations: false,
};

export const initialPlatformErrorState: PlatformErrorState = {
  notes: null,
  conversations: null,
};

export const initialContentState: PlatformContentData = {
  notes: createInitialInfiniteScrollState(),
  conversations: createInitialInfiniteScrollState(),
}; 