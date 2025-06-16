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

  // Search files using the new unified system
  const searchResults = useQuery(
    api.usersFilesQueries.searchFiles,
    userId && suggestionQuery && mentionType ? {
      userId,
      query: suggestionQuery,
      limit: 8,
    } : 'skip'
  );

  // Handle input changes and detect @ or # mentions
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    onChange(newValue);
    setCursorPosition(cursorPos);

    // Check for mention triggers
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    
    // Determine if we're in a mention context
    const atContext = lastAtIndex !== -1 && (lastHashIndex === -1 || lastAtIndex > lastHashIndex);
    const hashContext = lastHashIndex !== -1 && (lastAtIndex === -1 || lastHashIndex > lastAtIndex);
    
    if (atContext) {
      const queryStart = lastAtIndex + 1;
      const queryEnd = cursorPos;
      const query = textBeforeCursor.substring(queryStart, queryEnd);
      
      // Only show suggestions if the query doesn't contain spaces (incomplete mention)
      if (!query.includes(' ') && query.length >= 0) {
        setMentionType('@');
        setSuggestionQuery(query);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else if (hashContext) {
      const queryStart = lastHashIndex + 1;
      const queryEnd = cursorPos;
      const query = textBeforeCursor.substring(queryStart, queryEnd);
      
      // Only show suggestions if the query doesn't contain spaces (incomplete mention)
      if (!query.includes(' ') && query.length >= 0) {
        setMentionType('#');
        setSuggestionQuery(query);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
      setMentionType(null);
      setSuggestionQuery('');
    }
  }, [onChange]);

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
        handleMentionSelect(searchResults[0]);
        e.preventDefault();
      }
    }
    
    // Pass through other keyboard events
    if (onKeyPress) {
      onKeyPress(e);
    }
  }, [showSuggestions, searchResults, handleMentionSelect, onKeyPress]);

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

  // Filter results based on mention type
  const filteredResults = React.useMemo(() => {
    if (!searchResults) return [];
    
    if (mentionType === '@') {
      // @ mentions should prioritize platforms but can include any file
      return searchResults.sort((a, b) => {
        if (a.type === 'platform' && b.type !== 'platform') return -1;
        if (a.type !== 'platform' && b.type === 'platform') return 1;
        return 0;
      });
    } else if (mentionType === '#') {
      // # mentions should prioritize content
      return searchResults.sort((a, b) => {
        if (a.type === 'content' && b.type !== 'content') return -1;
        if (a.type !== 'content' && b.type === 'content') return 1;
        return 0;
      });
    }
    
    return searchResults;
  }, [searchResults, mentionType]);

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full min-h-[48px] max-h-[300px] resize-none overflow-y-auto ${className}`}
        disabled={disabled}
        rows={1}
        style={{
          height: 'auto',
          minHeight: '48px',
        }}
        onInput={(e) => {
          // Auto-resize textarea
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = target.scrollHeight + 'px';
        }}
      />
      
      {/* Suggestions dropdown */}
      {showSuggestions && filteredResults && filteredResults.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          <div className="p-2 text-xs text-gray-500 border-b">
            {mentionType === '@' ? 'Select a platform or file' : 'Select content'}
          </div>
          {filteredResults.map((mention, index) => (
            <div
              key={`${mention.id}-${mention.subtype}`}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handleMentionSelect(mention)}
            >
              <span className="text-lg">{getMentionIcon(mention)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{mention.fileName}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {mention.platform}
                  </span>
                </div>
                {mention.snippet && (
                  <p className="text-xs text-gray-600 truncate mt-1">
                    {mention.snippet}
                  </p>
                )}
                {mention.from && (
                  <p className="text-xs text-gray-500 mt-1">
                    From: {mention.from}
                  </p>
                )}
                {mention.stats && (
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    {mention.stats.views && <span>👁 {mention.stats.views.toLocaleString()}</span>}
                    {mention.stats.likes && <span>❤️ {mention.stats.likes.toLocaleString()}</span>}
                    {mention.stats.messages && <span>💬 {mention.stats.messages}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div className="p-2 text-xs text-gray-400 border-t">
            Press Ctrl+Enter to select first result, Esc to close
          </div>
        </div>
      )}
    </div>
  );
}; 