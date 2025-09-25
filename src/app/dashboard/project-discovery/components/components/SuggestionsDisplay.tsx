/**
 * Suggestions Display Component
 * 
 * React component for displaying suggestion chips and handling suggestion
 * clicks in the project discovery system. Provides interactive suggestions
 * for user responses and actions.
 * 
 * Used by: Main container component, suggestion management components
 */

'use client'

import React from 'react'

/**
 * Props interface for the SuggestionsDisplay component
 */
interface SuggestionsDisplayProps {
  /** Array of suggestion strings to display */
  suggestions: string[]
  /** Loading state for suggestions */
  isLoading?: boolean
  /** Callback function when a suggestion is clicked */
  onSuggestionClick: (suggestion: string) => void
  /** Optional title for the suggestions section */
  title?: string
  /** Optional subtitle or description */
  subtitle?: string
  /** Whether to show the suggestions container */
  showContainer?: boolean
}

/**
 * SuggestionsDisplay Component
 * 
 * Renders interactive suggestion chips with proper styling and click handling.
 * Extracted from ProjectDiscoveryChat.tsx to provide reusable suggestion display.
 * 
 * @param props - Component props
 * @returns JSX element containing suggestion chips
 */
export const SuggestionsDisplay: React.FC<SuggestionsDisplayProps> = ({
  suggestions,
  isLoading = false,
  onSuggestionClick,
  title = "Quick Answers",
  subtitle = "Click to fill missing fields",
  showContainer = true
}) => {
  // Don't render if no suggestions and not loading
  if (!isLoading && suggestions.length === 0) {
    return null
  }

  const containerContent = (
    <div className="space-y-2">
      {isLoading ? (
        // Loading state
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-green-400/60 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-green-700 dark:text-green-300">
              Generating quick answers...
            </span>
          </div>
        </div>
      ) : (
        // Suggestion chips
        suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="w-full text-left p-3 bg-white dark:bg-green-900/30 border border-green-200 dark:border-green-700/30 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/50 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-800/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-green-800 dark:text-green-200 text-sm group-hover:text-green-900 dark:group-hover:text-green-100">
                  {suggestion}
                </p>
              </div>
              <div className="flex-shrink-0">
                <svg className="w-4 h-4 text-green-400 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  )

  // Return with or without container based on showContainer prop
  if (!showContainer) {
    return containerContent
  }

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800/20 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-green-900 dark:text-green-100">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-green-700 dark:text-green-300">
            {subtitle}
          </span>
        </div>
      </div>
      {containerContent}
    </div>
  )
}

export default SuggestionsDisplay
