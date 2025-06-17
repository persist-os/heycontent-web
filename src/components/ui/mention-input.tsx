import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface MentionItem {
  id: string;
  type: 'platform' | 'content';
  subtype: string;
  platform: string;
  fileName: string;
  title: string;
  snippet?: string;
  thumbnailUrl?: string;
  from?: string;
  date?: string;
  stats?: {
    views?: number;
    likes?: number;
    comments?: number;
    messages?: number;
    threads?: number;
  };
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMentionSelect: (mention: MentionItem) => void;
  placeholder?: string;
  className?: string;
  userId?: string;
  disabled?: boolean;
  onKeyPress?: (e: React.KeyboardEvent) => void;
}

export const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onMentionSelect,
  placeholder = "Type @ for platforms, # for content...",
  className = "",
  userId,
  disabled = false,
  onKeyPress,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [mentionType, setMentionType] = useState<'@' | '#' | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Search platforms for @ mentions
  const platformResults = useQuery(
    api.usersFilesQueries.searchPlatforms,
    userId && mentionType === '@' ? {
      userId,
      query: suggestionQuery || '', // Allow empty queries
      limit: 8,
    } : 'skip'
  );

  // Search content for # mentions
  const contentResults = useQuery(
    api.usersFilesQueries.searchContent,
    userId && mentionType === '#' ? {
      userId,
      query: suggestionQuery || '', // Allow empty queries
      limit: 8,
    } : 'skip'
  );

  // Get current search results based on mention type
  const searchResults = mentionType === '@' ? platformResults : contentResults;

  // Debug the search results
  useEffect(() => {
    console.log('🔍 MentionInput - Search params:', { 
      userId, 
      suggestionQuery, 
      mentionType, 
      willQuery: !!(userId && mentionType),
      searchResults: searchResults ? searchResults.length : 'no results'
    });
  }, [userId, suggestionQuery, mentionType, searchResults]);

  // Handle input changes and detect @ or # mentions
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    console.log('🔍 MentionInput - Input changed:', { newValue, cursorPos, userId });
    
    onChange(newValue);
    setCursorPosition(cursorPos);

    // Check for mention triggers
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    
    console.log('🔍 MentionInput - Checking mentions:', { textBeforeCursor, lastAtIndex, lastHashIndex });
    
    // Determine if we're in a mention context
    const atContext = lastAtIndex !== -1 && (lastHashIndex === -1 || lastAtIndex > lastHashIndex);
    const hashContext = lastHashIndex !== -1 && (lastAtIndex === -1 || lastHashIndex > lastAtIndex);
    
    if (atContext) {
      const queryStart = lastAtIndex + 1;
      const queryEnd = cursorPos;
      const query = textBeforeCursor.substring(queryStart, queryEnd);
      
      console.log('🔍 MentionInput - @ context detected:', { query, userId });
      
      // Only show suggestions if the query doesn't contain spaces (incomplete mention)
      if (!query.includes(' ') && query.length >= 0) {
        setMentionType('@');
        setSuggestionQuery(query);
        setShowSuggestions(true);
        console.log('🔍 MentionInput - Setting @ suggestions:', { query, userId, willQuery: !!(userId && '@') });
      } else {
        setShowSuggestions(false);
      }
    } else if (hashContext) {
      const queryStart = lastHashIndex + 1;
      const queryEnd = cursorPos;
      const query = textBeforeCursor.substring(queryStart, queryEnd);
      
      console.log('🔍 MentionInput - # context detected:', { query, userId });
      
      // Only show suggestions if the query doesn't contain spaces (incomplete mention)
      if (!query.includes(' ') && query.length >= 0) {
        setMentionType('#');
        setSuggestionQuery(query);
        setShowSuggestions(true);
        console.log('🔍 MentionInput - Setting # suggestions:', { query, userId, willQuery: !!(userId && '#') });
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
      setMentionType(null);
      setSuggestionQuery('');
    }
  }, [onChange, userId]);

  // Handle mention selection
  const handleMentionSelect = useCallback((mention: MentionItem) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    
    if (mentionType === '@') {
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      const beforeMention = textBeforeCursor.substring(0, lastAtIndex);
      const mentionText = `@${mention.fileName}`;
      const newValue = beforeMention + mentionText + ' ' + textAfterCursor;
      
      onChange(newValue);
      onMentionSelect(mention);
      
      // Set cursor position after the mention
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = beforeMention.length + mentionText.length + 1;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    } else if (mentionType === '#') {
      const lastHashIndex = textBeforeCursor.lastIndexOf('#');
      const beforeMention = textBeforeCursor.substring(0, lastHashIndex);
      const mentionText = `#${mention.fileName}`;
      const newValue = beforeMention + mentionText + ' ' + textAfterCursor;
      
      onChange(newValue);
      onMentionSelect(mention);
      
      // Set cursor position after the mention
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = beforeMention.length + mentionText.length + 1;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    }
    
    setShowSuggestions(false);
    setMentionType(null);
    setSuggestionQuery('');
  }, [value, cursorPosition, mentionType, onChange, onMentionSelect]);

  // Convert search result to MentionItem
  const convertToMentionItem = useCallback((result: any): MentionItem => {
    // Improve fileName display for different types
    let displayName = result.fileName;
    
    // Handle Gmail threads with better naming
    if (result.subtype === 'email_thread' && result.snippet) {
      const subject = result.snippet.split('\n')[0] || result.fileName;
      displayName = subject.length > 50 ? subject.substring(0, 50) + '...' : subject;
    }
    
    // Handle emails with subject
    if (result.subtype === 'email' && result.snippet) {
      displayName = result.snippet.length > 50 ? result.snippet.substring(0, 50) + '...' : result.snippet;
    }
    
    // Handle YouTube videos
    if (result.subtype === 'video' && result.title && result.title !== result.fileName) {
      displayName = result.title;
    }
    
    return {
      id: result.id,
      type: result.type || (result.subtype?.includes('platform_') ? 'platform' : 'content'),
      subtype: result.subtype,
      platform: result.platform,
      fileName: displayName,
      title: result.title || displayName,
      snippet: result.snippet,
      thumbnailUrl: result.thumbnailUrl,
      from: result.from,
      date: result.date,
      stats: result.stats
    };
  }, []);

  // Handle keyboard navigation in suggestions
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && searchResults && searchResults.length > 0) {
      // Handle arrow keys and enter for suggestion navigation
      // This is a simplified version - you could add more sophisticated navigation
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        e.preventDefault();
      } else if (e.key === 'Enter' && e.ctrlKey) {
        // Ctrl+Enter to select first suggestion
        const convertedResult = convertToMentionItem(searchResults[0]);
        handleMentionSelect(convertedResult);
        e.preventDefault();
      }
    }
    
    // Pass through other keyboard events
    if (onKeyPress) {
      onKeyPress(e);
    }
  }, [showSuggestions, searchResults, handleMentionSelect, onKeyPress, convertToMentionItem]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get the appropriate icon for mention type
  const getMentionIcon = (mention: MentionItem) => {
    if (mention.type === 'platform') {
      switch (mention.platform) {
        case 'gmail': return '📧';
        case 'youtube': return '🎥';
        case 'instagram': return '📸';
        default: return '🔗';
      }
    } else {
      switch (mention.subtype) {
        case 'email': return '✉️';
        case 'email_thread': return '📧';
        case 'video': return '🎬';
        case 'instagram_post': return '📷';
        case 'note': return '📝';
        case 'insight': return '💡';
        case 'analytics': return '📊';
        default: return '📄';
      }
    }
  };

  // Convert results to MentionItem format
  const filteredResults = React.useMemo(() => {
    if (!searchResults) return [];
    
    // Convert all results to MentionItem format with improved display names
    return searchResults.map(convertToMentionItem);
  }, [searchResults, convertToMentionItem]);

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full min-h-[24px] max-h-[120px] resize-none overflow-y-auto bg-transparent border-0 outline-0 ${className}`}
        disabled={disabled}
        rows={1}
        style={{
          height: 'auto',
          minHeight: '24px',
        }}
        onInput={(e) => {
          // Auto-resize textarea
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = target.scrollHeight + 'px';
        }}
      />
      
      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full bottom-full mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-64 overflow-y-auto backdrop-blur-sm"
        >
          <div className="p-3 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 font-medium">
            {mentionType === '@' ? 'Select a platform' : 'Select content'}
          </div>
          {filteredResults && filteredResults.length > 0 ? (
            <>
              {filteredResults.map((mention, index) => (
                <div
                  key={`${mention.id}-${mention.subtype}`}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                  onClick={() => handleMentionSelect(mention)}
                >
                  <span className="text-lg">{getMentionIcon(mention)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate text-gray-900 dark:text-gray-100">{mention.fileName}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                        {mention.platform}
                      </span>
                    </div>
                    {mention.snippet && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
                        {mention.snippet}
                      </p>
                    )}
                    {mention.from && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        From: {mention.from}
                      </p>
                    )}
                    {mention.stats && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {mention.stats.views && <span>👁 {mention.stats.views.toLocaleString()}</span>}
                        {mention.stats.likes && <span>❤️ {mention.stats.likes.toLocaleString()}</span>}
                        {mention.stats.messages && <span>💬 {mention.stats.messages}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="p-3 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700">
                Press Ctrl+Enter to select first result, Esc to close
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              {mentionType === '@' 
                ? 'No platforms connected. Connect Gmail, YouTube, or Instagram to see suggestions.' 
                : 'No content found. Upload files or connect platforms to see content suggestions.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 