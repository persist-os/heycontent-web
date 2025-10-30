/**
 * Unified Search Hook
 * 
 * Provides unified search across all content types:
 * - Notes (keyword + vector)
 * - Crystals (keyword + vector)
 * - Shards (keyword)
 * - Conversations (keyword + vector)
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
  type: 'note' | 'crystal' | 'shard' | 'conversation';
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

  const crystals = useQuery(
    api.crystalQueries.getCrystalsByUser,
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

    // Search crystals - direct array from getCrystalPersonaData
    if (Array.isArray(crystals)) {
      crystals.forEach((crystal: any) => {
        if (
          crystal.name?.toLowerCase().includes(query) ||
          crystal.core_insight?.toLowerCase().includes(query) ||
          crystal.dimension?.toLowerCase().includes(query)
        ) {
          results.push({
            id: crystal._id,
            type: 'crystal',
            title: crystal.name || 'Unnamed Crystal',
            content: crystal.core_insight || '',
            metadata: crystal,
            updatedAt: crystal.last_evolution
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
  }, [searchQuery, searchMode, userId, notes, crystals, conversations, shards]);

  // Vector search (triggered on Enter)
  const performVectorSearch = useCallback(async () => {
    if (!searchQuery.trim() || !userId) return [];

    setIsSearching(true);
    try {
      const results = await vectorSearch({
        userId,
        query: searchQuery,
        limit: 20,
        contentTypes: ['note', 'cognitive_field', 'conversation', 'shard', 'stardust'],
        minSimilarity: 0.3
      });

      // Transform results to SearchResult format
      return results.map((result: any) => ({
        id: result.contentId,
        type: result.contentType as 'note' | 'cognitive_field' | 'shard' | 'conversation',
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

