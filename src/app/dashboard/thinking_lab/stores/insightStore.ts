/**
 * Insight Store
 *
 * Zustand store for managing context search and discovery state.
 * This handles @mentions, search, and context injection.
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// TODO: Import your existing API functions
// import { searchContent, getContextByType } from '../api/search' // TODO: What are your actual API functions?

type ContextType = 'projects' | 'notes' | 'conversations' | 'crystals'

interface ContextItem {
    id: string
    type: ContextType
    title: string
    content: string
    relevance?: number
    // TODO: Add any other context item properties you have
}

interface InsightState {
    searchEnabled: boolean
    searchQuery: string
    searchResults: ContextItem[]
    isSearching: boolean
    activeContexts: ContextItem[]
    availableTypes: ContextType[]
    error?: string
}

interface InsightActions {
    toggleSearch: () => void
    updateSearchQuery: (query: string) => void
    performSearch: (query: string) => Promise<void>
    addContext: (context: ContextItem) => void
    removeContext: (contextId: string) => void
    injectContent: (content: ContextItem) => void
    clearSearch: () => void
    setError: (error: string | undefined) => void
    loadContextByType: (type: ContextType) => Promise<void>
}

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

            set({ isSearching: true, error: undefined })

            try {
                // TODO: Replace with your actual search API
                // const results = await searchContent(query, get().availableTypes)

                // TODO: Mock search results - replace with actual API
                const mockResults: ContextItem[] = [
                    {
                        id: 'project-1',
                        type: 'projects',
                        title: `Project: ${query}`,
                        content: `This is a project related to ${query}`,
                        relevance: 0.9
                    },
                    {
                        id: 'note-1',
                        type: 'notes',
                        title: `Note about ${query}`,
                        content: `This note contains information about ${query}`,
                        relevance: 0.8
                    },
                    {
                        id: 'conversation-1',
                        type: 'conversations',
                        title: `Conversation mentioning ${query}`,
                        content: `Previous conversation where we discussed ${query}`,
                        relevance: 0.7
                    }
                ]

                set({
                    searchResults: mockResults,
                    isSearching: false
                })

            } catch (error) {
                console.error('Search failed:', error)
                set({
                    isSearching: false,
                    error: error instanceof Error ? error.message : 'Search failed',
                    searchResults: []
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