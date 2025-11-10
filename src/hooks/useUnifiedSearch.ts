/**
 * Unified Search Hook
 * 
 * Provides unified search across all content types:
 * - Notes (keyword + vector)
 * - Cognitive Fields (keyword + vector)
 * - Shards (keyword + vector)
 * - Conversations (keyword + vector)
 * - Messages (keyword + vector)
 * - Stardust (vector only)
 * 
 * Implements two search modes:
 * - Keyword: Fast client-side filtering on keystroke
 * - Vector: Semantic search triggered on Enter
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getCurrentUserId } from '@/app/lib/api-helpers';

export interface SearchResult {
  id: string;
  type: 'note' | 'cognitive_field' | 'shard' | 'conversation' | 'message' | 'stardust';
  title: string;
  content: string;
  metadata?: any;
  score?: number;
  updatedAt?: number;
}

interface UseUnifiedSearchProps {
  enabled: boolean;
}

export function useUnifiedSearch({ enabled }: UseUnifiedSearchProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'keyword' | 'vector'>('keyword');
  const [isSearching, setIsSearching] = useState(false);

  // Get Firebase userId on mount
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await getCurrentUserId();
        setUserId(id);
      } catch (error) {
        console.error('Failed to get user ID:', error);
        setUserId(null);
      }
    };
    if (enabled) {
      fetchUserId();
    }
  }, [enabled]);

  // Fetch all user content for keyword search - use 'skip' pattern
  const notes = useQuery(
    api.noteQueries.getUserNotes,
    enabled && userId ? { userId, numItems: 100 } : 'skip'
  );

  const cognitiveFields = useQuery(
    api.cognitiveQueries.getAllCognitiveFields,
    enabled && userId ? { userId, limit: 100 } : 'skip'
  );

  const conversations = useQuery(
    api.chatQueries.getHistory,
    enabled && userId ? { userId, limit: 50 } : 'skip'
  );

  const shards = useQuery(
    api.shardQueries.getShardsByUser,
    enabled && userId ? { userId, limit: 100 } : 'skip'
  );

  const messages = useQuery(
    api.messagesQueries.getUserRecentMessages,
    enabled && userId ? { userId, limit: 200 } : 'skip'
  );

  // Vector search action
  const vectorSearch = useAction(api.vectorSearch.hybridSearchContent);

  // Keyword search (instant)
  const keywordSearchResults = useCallback(() => {
    if (!searchQuery.trim() || searchMode !== 'keyword' || !userId) return [];

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    // Search notes - handle paginated response
    if (notes?.page) {
      notes.page.forEach((note: any) => {
        if (
          note.title?.toLowerCase().includes(query) ||
          note.content?.toLowerCase().includes(query)
        ) {
          results.push({
            id: note._id,
            type: 'note',
            title: note.title || 'Untitled Note',
            content: note.content?.substring(0, 150) || '',
            metadata: note,
            updatedAt: note.updatedAt
          });
        }
      });
    }

    // Search cognitive fields - direct array from getAllCognitiveFields
    if (Array.isArray(cognitiveFields)) {
      cognitiveFields.forEach((field: any) => {
        if (
          field.fieldName?.toLowerCase().includes(query) ||
          field.coreInsight?.toLowerCase().includes(query) ||
          field.dimension?.toLowerCase().includes(query) ||
          field.description?.toLowerCase().includes(query)
        ) {
          results.push({
            id: field._id,
            type: 'cognitive_field',
            title: field.fieldName || 'Unnamed Cognitive Field',
            content: field.coreInsight || field.description || '',
            metadata: field,
            updatedAt: field.updatedAt || field._creationTime
          });
        }
      });
    }

    // Search conversations - direct array from getHistory
    if (Array.isArray(conversations)) {
      conversations.forEach((conv: any) => {
        if (
          conv.topic?.toLowerCase().includes(query) ||
          conv.messages?.[0]?.content?.toLowerCase().includes(query)
        ) {
          results.push({
            id: conv._id,
            type: 'conversation',
            title: conv.topic || 'Untitled Conversation',
            content: conv.messages?.[0]?.content?.substring(0, 150) || '',
            metadata: conv,
            updatedAt: conv._creationTime
          });
        }
      });
    }

    // Search shards - direct array from getShardsByUser
    if (Array.isArray(shards)) {
      shards.forEach((shard: any) => {
        if (
          shard.insight?.toLowerCase().includes(query) ||
          shard.dimension?.toLowerCase().includes(query) ||
          shard.tags?.some((tag: string) => tag.toLowerCase().includes(query))
        ) {
          results.push({
            id: shard._id,
            type: 'shard',
            title: shard.dimension || 'Untitled Shard',
            content: shard.insight?.substring(0, 150) || '',
            metadata: shard,
            updatedAt: shard._creationTime
          });
        }
      });
    }

    // Search messages - direct array from getUserRecentMessages
    if (Array.isArray(messages)) {
      messages.forEach((message: any) => {
        if (message.content?.toLowerCase().includes(query)) {
          // Use role and truncated content as title
          const roleLabel = message.role === 'user' ? 'You' : 'Assistant';
          results.push({
            id: message._id,
            type: 'message',
            title: `${roleLabel} message`,
            content: message.content?.substring(0, 150) || '',
            metadata: message,
            updatedAt: message.timestamp || message.createdAt
          });
        }
      });
    }

    // Sort by relevance (best match first) and recency
    return results
      .sort((a, b) => {
        // Prioritize title matches
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();
        const aTitleMatch = aTitle.includes(query);
        const bTitleMatch = bTitle.includes(query);

        if (aTitleMatch && !bTitleMatch) return -1;
        if (!aTitleMatch && bTitleMatch) return 1;

        // Then sort by recency
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      })
      .slice(0, 20); // Limit to top 20 results
  }, [searchQuery, searchMode, userId, notes, cognitiveFields, conversations, shards, messages]);

  // Vector search (triggered on Enter)
  const performVectorSearch = useCallback(async () => {
    if (!searchQuery.trim() || !userId) return [];

    setIsSearching(true);
    try {
      const results = await vectorSearch({
        userId,
        query: searchQuery,
        limit: 20,
        contentTypes: ['note', 'cognitive_field', 'conversation', 'shard', 'stardust', 'message'],
        minSimilarity: 0.3
      });

      // Transform results to SearchResult format
      return results.map((result: any) => ({
        id: result.contentId,
        type: result.contentType as 'note' | 'cognitive_field' | 'shard' | 'conversation' | 'message' | 'stardust',
        title: result.title || 'Untitled',
        content: result.content?.substring(0, 150) || '',
        score: result.score,
        metadata: result
      }));
    } catch (error) {
      console.error('Vector search failed:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, userId, vectorSearch]);

  // Get current results based on mode
  const [vectorResults, setVectorResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (searchMode === 'vector' && searchQuery.trim()) {
      performVectorSearch().then(setVectorResults);
    } else {
      setVectorResults([]);
    }
  }, [searchMode, searchQuery, performVectorSearch]);

  const results = searchMode === 'keyword' 
    ? keywordSearchResults() 
    : vectorResults;

  return {
    searchQuery,
    setSearchQuery,
    searchMode,
    setSearchMode,
    results,
    isSearching,
    triggerVectorSearch: () => setSearchMode('vector')
  };
}

