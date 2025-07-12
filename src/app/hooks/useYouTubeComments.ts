import { useState, useCallback, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function useYouTubeComments(videoId: string) {
  const [cursor, setCursor] = useState<string | null>(null);
  const [allComments, setAllComments] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Query for comments with pagination
  const result = useQuery(
    api.youtubeQueries.getYouTubeComments,
    {
      videoId,
      paginationOpts: {
        cursor: cursor || undefined,
        numItems: 10, // Load 10 comments per page
      },
    }
  );

  // Accumulate comments when new data arrives
  useEffect(() => {
    if (result?.page) {
      if (cursor === null) {
        // First page - replace all comments
        setAllComments(result.page);
      } else {
        // Subsequent pages - append to existing comments
        setAllComments(prev => [...prev, ...result.page]);
      }
    }
  }, [result?.page, cursor]);

  // Load more comments
  const loadMore = useCallback(async () => {
    if (result?.isDone || isLoadingMore || !result?.continueCursor) return;
    
    setIsLoadingMore(true);
    setCursor(result.continueCursor);
    
    // Small delay to prevent spam clicking
    setTimeout(() => {
      setIsLoadingMore(false);
    }, 500);
  }, [result?.isDone, result?.continueCursor, isLoadingMore]);

  // Check if we have more comments to load
  const hasMore = !result?.isDone && !!result?.continueCursor;

  return {
    comments: allComments,
    hasMore,
    loadMore,
    isLoadingMore,
    isLoading: result === undefined,
  };
} 