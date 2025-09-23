/**
 * Insight Store
 *
 * Zustand store for managing context search and discovery state.
 * This handles @mentions, search, and context injection.
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// Import API services
import { searchRelevantContent, generateEmbeddingsForPlatform, checkEmbeddingStatus } from '../modules/api/searchService'
import { getCurrentUserId } from '@/app/lib/api-helpers'

// Import centralized types
import type { ContextItem, ContextType, InsightState, InsightActions } from '../types'

type InsightStore = InsightState & InsightActions

export const useInsightStore = create<InsightStore>()(
    subscribeWithSelector((set, get) => ({
        // Initial state
        searchEnabled: false,
        searchQuery: '',
        searchResults: [],
        isSearching: false,
        activeContexts: [],
        availableTypes: ['projects', 'notes', 'conversations', 'crystals'],
        error: undefined,
        currentStatus: undefined,
        embeddingStatus: { hasEmbeddings: false, count: 0 },
        isGeneratingEmbeddings: false,

        // Actions
        toggleSearch: () => {
            set(state => ({
                searchEnabled: !state.searchEnabled,
                searchQuery: '',
                searchResults: [],
                error: undefined
            }))
        },

        updateSearchQuery: (query: string) => {
            set({ searchQuery: query })

            // TODO: Implement debounced search if desired
            if (query.length > 2) {
                // Debounce search
                setTimeout(() => {
                    const currentQuery = get().searchQuery
                    if (currentQuery === query) {
                        get().performSearch(query)
                    }
                }, 300)
            } else {
                set({ searchResults: [] })
            }
        },

        performSearch: async (query: string) => {
            if (!query.trim()) {
                set({ searchResults: [] })
                return
            }

            set({ isSearching: true, error: undefined, currentStatus: 'Searching your content...' })

            try {
                // Get user ID for search
                const userId = getCurrentUserId()
                if (!userId) {
                    set({
                        isSearching: false,
                        error: 'User authentication required for search',
                        currentStatus: undefined
                    })
                    return
                }

                // Perform vector search
                const response = await searchRelevantContent(
                    query, 
                    userId, 
                    (status: string) => {
                        set({ currentStatus: status })
                    },
                    10 // Search limit
                )

                if (response && response.relevantContent.length > 0) {
                    // Convert search results to ContextItem format
                    const contextItems: ContextItem[] = response.relevantContent.map((item, index) => ({
                        id: `${item.contentType}-${index}`,
                        type: item.contentType as ContextType,
                        title: item.title,
                        content: item.summary || '',
                        relevance: item.score
                    }))

                    set({
                        searchResults: contextItems,
                        isSearching: false,
                        currentStatus: `Found ${contextItems.length} relevant items`
                    })

                    // Clear status after delay
                    setTimeout(() => {
                        set({ currentStatus: undefined })
                    }, 3000)
                } else {
                    set({
                        searchResults: [],
                        isSearching: false,
                        currentStatus: 'No relevant content found'
                    })

                    // Clear status after delay
                    setTimeout(() => {
                        set({ currentStatus: undefined })
                    }, 3000)
                }

            } catch (error) {
                console.error('Search failed:', error)
                set({
                    isSearching: false,
                    error: error instanceof Error ? error.message : 'Search failed',
                    currentStatus: undefined
                })
            }
        },

        addContext: (context: ContextItem) => {
            const { activeContexts } = get()

            // Prevent duplicates
            if (activeContexts.find(c => c.id === context.id)) {
                return
            }

            set({
                activeContexts: [...activeContexts, context]
            })
        },

        removeContext: (contextId: string) => {
            set(state => ({
                activeContexts: state.activeContexts.filter(c => c.id !== contextId)
            }))
        },

        injectContent: (content: ContextItem) => {
            // TODO: How do you want to handle content injection?
            // Option 1: Dispatch to dialogue store
            // Option 2: Emit event
            // Option 3: Callback system

            console.log('Injecting content:', content)

            // TODO: Example of injecting into dialogue
            // You might want to add this content to the current conversation
            // or provide it as context for the next message
        },

        clearSearch: () => {
            set({
                searchQuery: '',
                searchResults: [],
                error: undefined
            })
        },

        setError: (error: string | undefined) => {
            set({ error })
        },

        loadContextByType: async (type: ContextType) => {
            set({ isSearching: true, error: undefined })

            try {
                // TODO: Replace with your actual API
                // const contexts = await getContextByType(type)

                // TODO: Mock context loading - replace with actual API
                const mockContexts: ContextItem[] = Array.from({ length: 5 }, (_, i) => ({
                    id: `${type}-${i}`,
                    type,
                    title: `${type} ${i + 1}`,
                    content: `Content for ${type} ${i + 1}`,
                    relevance: (5 - i) / 5
                }))

                set({
                    searchResults: mockContexts,
                    isSearching: false
                })

            } catch (error) {
                console.error(`Failed to load ${type}:`, error)
                set({
                    isSearching: false,
                    error: error instanceof Error ? error.message : `Failed to load ${type}`
                })
            }
        },

        generateEmbeddings: async (platform: 'conversations' | 'notes') => {
            set({ isGeneratingEmbeddings: true, error: undefined, currentStatus: `Generating embeddings for ${platform}...` })

            try {
                const userId = getCurrentUserId()
                if (!userId) {
                    set({
                        isGeneratingEmbeddings: false,
                        error: 'User authentication required for embedding generation',
                        currentStatus: undefined
                    })
                    return
                }

                const result = await generateEmbeddingsForPlatform(userId, platform)
                
                set({
                    isGeneratingEmbeddings: false,
                    currentStatus: `Generated embeddings for ${result[platform].succeeded} ${platform}`
                })

                // Update embedding status
                get().checkEmbeddingStatus()

                // Clear status after delay
                setTimeout(() => {
                    set({ currentStatus: undefined })
                }, 3000)

            } catch (error) {
                console.error('Failed to generate embeddings:', error)
                set({
                    isGeneratingEmbeddings: false,
                    error: error instanceof Error ? error.message : 'Failed to generate embeddings',
                    currentStatus: undefined
                })
            }
        },

        checkEmbeddingStatus: async () => {
            try {
                const userId = getCurrentUserId()
                if (!userId) return

                const status = await checkEmbeddingStatus(userId)
                set({ embeddingStatus: status })

            } catch (error) {
                console.error('Failed to check embedding status:', error)
            }
        },

        setStatus: (status: string | undefined) => {
            set({ currentStatus: status })
        }
    }))
)

// TODO: Add any additional selectors you need
export const useInsightSearch = () => useInsightStore(state => ({
    searchEnabled: state.searchEnabled,
    searchQuery: state.searchQuery,
    searchResults: state.searchResults,
    isSearching: state.isSearching
}))

export const useInsightContexts = () => useInsightStore(state => state.activeContexts)

export const useInsightActions = () => useInsightStore(state => ({
    toggleSearch: state.toggleSearch,
    updateSearchQuery: state.updateSearchQuery,
    performSearch: state.performSearch,
    addContext: state.addContext,
    removeContext: state.removeContext,
    injectContent: state.injectContent
}))