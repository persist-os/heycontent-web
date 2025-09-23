/**
 * Insight Component
 *
 * Context search and discovery interface that replaces existing search with context-based architecture.
 * Handles @mentions, context discovery, and content injection.
 *
 * Features:
 * - @mention search with type filtering
 * - Context results with relevance scoring
 * - Active context management
 * - Content injection to dialogue
 * - Keyboard navigation
 *
 * Dependencies: useInsight, useDialogue hooks
 */

import React, { useRef, useEffect } from 'react'
import { useInsight, useDialogue } from '../hooks/useLabCore'

// =============================================================================
// INTERFACES
// =============================================================================

interface InsightComponentProps {
    className?: string
    searchTypes?: ('projects' | 'notes' | 'conversations' | 'crystals')[]
    showFilters?: boolean
    showActiveContexts?: boolean
    placeholder?: string
}

interface SearchInputProps {
    value: string
    onChange: (value: string) => void
    onSearch: (query: string) => void
    placeholder?: string
    disabled?: boolean
}

interface SearchResultsProps {
    results: any[] // TODO: Define proper ContextItem interface
    onSelect: (item: any) => void
    isLoading: boolean
}

interface ActiveContextsProps {
    contexts: any[] // TODO: Define proper ContextItem interface
    onRemove: (contextId: string) => void
    onInject: (context: any) => void
}

interface ContextFiltersProps {
    availableTypes: string[]
    selectedTypes: string[]
    onTypeToggle: (type: string) => void
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function InsightComponent({
                                     className = '',
                                     searchTypes = ['projects', 'notes', 'conversations', 'crystals'],
                                     showFilters = true,
                                     showActiveContexts = true,
                                     placeholder = "Search @projects, @notes, @conversations..."
                                 }: InsightComponentProps) {
    const { state: insightState, actions: insightActions } = useInsight()
    const dialogue = useDialogue()

    const handleSearch = (query: string) => {
        insightActions.performSearch(query)
    }

    const handleSelectResult = (item: any) => {
        insightActions.addContext(item)
    }

    const handleInjectContext = (context: any) => {
        // TODO: Verify this matches your current context injection functionality
        insightActions.injectContent(context)

        // TODO: How do you want to handle context injection into dialogue?
        // Option 1: Add as system message
        // Option 2: Add as context for next user message
        // Option 3: Add as reference in input area
        console.log('Injecting context into dialogue:', context)
    }

    const handleRemoveContext = (contextId: string) => {
        insightActions.removeContext(contextId)
    }

    const handleToggleSearch = () => {
        insightActions.toggleSearch()
    }

    return (
        <div className={`insight-component ${className}`}>
            {/* TODO: Copy your existing search interface structure */}

            <div className="insight-header">
                <button
                    onClick={handleToggleSearch}
                    className={`search-toggle ${insightState.searchEnabled ? 'active' : ''}`}
                >
                    {/* TODO: Add your search icon */}
                    {insightState.searchEnabled ? 'Hide Search' : 'Show Search'}
                </button>
            </div>

            {insightState.searchEnabled && (
                <>
                    <SearchInput
                        value={insightState.searchQuery}
                        onChange={insightActions.updateSearchQuery}
                        onSearch={handleSearch}
                        placeholder={placeholder}
                        disabled={insightState.isSearching}
                    />

                    {showFilters && (
                        <ContextFilters
                            availableTypes={searchTypes}
                            selectedTypes={searchTypes} // TODO: Add filter state management
                            onTypeToggle={(type) => {
                                // TODO: Implement type filtering logic
                                console.log('Toggle type filter:', type)
                            }}
                        />
                    )}

                    <SearchResults
                        results={insightState.searchResults}
                        onSelect={handleSelectResult}
                        isLoading={insightState.isSearching}
                    />
                </>
            )}

            {showActiveContexts && insightState.activeContexts.length > 0 && (
                <ActiveContexts
                    contexts={insightState.activeContexts}
                    onRemove={handleRemoveContext}
                    onInject={handleInjectContext}
                />
            )}

            {insightState.error && (
                <div className="insight-error">
                    {/* TODO: Style this error display to match your design */}
                    Error: {insightState.error}
                </div>
            )}
        </div>
    )
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function SearchInput({
                         value,
                         onChange,
                         onSearch,
                         placeholder = "Search...",
                         disabled = false
                     }: SearchInputProps) {
    const inputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (value.trim()) {
            onSearch(value.trim())
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // TODO: Add keyboard navigation for search results
        if (e.key === 'ArrowDown') {
            // Navigate to first result
        } else if (e.key === 'Escape') {
            // Clear search
            onChange('')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="search-input-form">
            {/* TODO: Copy your existing search input structure and styling */}
            <div className="search-input-container">
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="search-input"
                    autoComplete="off"
                    // TODO: Add any other input props you need
                />

                <button
                    type="submit"
                    disabled={disabled || !value.trim()}
                    className="search-button"
                >
                    {/* TODO: Add your search icon */}
                    🔍
                </button>
            </div>
        </form>
    )
}

function SearchResults({
                           results,
                           onSelect,
                           isLoading
                       }: SearchResultsProps) {
    if (isLoading) {
        return (
            <div className="search-results loading">
                {/* TODO: Copy your existing loading indicator */}
                <div className="loading-indicator">Searching...</div>
            </div>
        )
    }

    if (results.length === 0) {
        return (
            <div className="search-results empty">
                {/* TODO: Style empty state to match your design */}
                <div className="empty-message">No results found</div>
            </div>
        )
    }

    return (
        <div className="search-results">
            {/* TODO: Copy your existing search results structure and styling */}
            {results.map((result) => (
                <SearchResultItem
                    key={result.id}
                    result={result}
                    onSelect={() => onSelect(result)}
                />
            ))}
        </div>
    )
}

function SearchResultItem({
                              result,
                              onSelect
                          }: {
    result: any
    onSelect: () => void
}) {
    return (
        <div
            className={`search-result-item search-result-${result.type}`}
            onClick={onSelect}
        >
            {/* TODO: Copy your existing result item structure and styling */}
            <div className="result-header">
                <span className="result-type">{result.type}</span>
                <span className="result-title">{result.title}</span>
            </div>

            <div className="result-content">
                {result.content}
            </div>

            {result.relevance && (
                <div className="result-relevance">
                    {Math.round(result.relevance * 100)}% match
                </div>
            )}
        </div>
    )
}

function ActiveContexts({
                            contexts,
                            onRemove,
                            onInject
                        }: ActiveContextsProps) {
    return (
        <div className="active-contexts">
            {/* TODO: Copy your existing active contexts structure and styling */}
            <div className="active-contexts-header">
                <span>Active Contexts ({contexts.length})</span>
            </div>

            <div className="active-contexts-list">
                {contexts.map((context) => (
                    <div key={context.id} className="active-context-item">
                        <span className="context-title">{context.title}</span>
                        <span className="context-type">{context.type}</span>

                        <div className="context-actions">
                            <button
                                onClick={() => onInject(context)}
                                className="inject-button"
                                title="Inject into conversation"
                            >
                                {/* TODO: Add your inject icon */}
                                ↪
                            </button>

                            <button
                                onClick={() => onRemove(context.id)}
                                className="remove-button"
                                title="Remove context"
                            >
                                {/* TODO: Add your remove icon */}
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function ContextFilters({
                            availableTypes,
                            selectedTypes,
                            onTypeToggle
                        }: ContextFiltersProps) {
    return (
        <div className="context-filters">
            {/* TODO: Copy your existing filter structure and styling */}
            <div className="filter-header">Filter by type:</div>

            <div className="filter-buttons">
                {availableTypes.map((type) => (
                    <button
                        key={type}
                        onClick={() => onTypeToggle(type)}
                        className={`filter-button ${selectedTypes.includes(type) ? 'active' : ''}`}
                    >
                        @{type}
                    </button>
                ))}
            </div>
        </div>
    )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default InsightComponent
export type { InsightComponentProps, SearchInputProps, SearchResultsProps }