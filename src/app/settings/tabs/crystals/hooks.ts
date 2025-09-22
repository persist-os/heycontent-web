import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getFirebaseAuth } from '@/app/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { CrystalStats, FormationStatus, FormationEligibility } from './types';

export const useAuth = () => {
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    let auth;
    try {
      auth = getFirebaseAuth();
    } catch (e) {
      auth = null;
    }
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUserId(firebaseUser?.uid);
    });
    
    return () => unsubscribe();
  }, []);

  return userId;
};

export const useCrystalData = (userId: string | undefined) => {
  const crystalStats = useQuery(
    api.crystalQueries.getCrystalStats,
    userId ? { userId } : "skip"
  ) as CrystalStats | undefined;

  const recentCrystals = useQuery(
    api.crystalQueries.getPersonaData,
    userId ? { userId, operation: "crystals", limit: 5 } : "skip"
  ) as any[] | undefined;

  const recentShards = useQuery(
    api.crystalQueries.getPersonaData,
    userId ? { userId, operation: "shards", limit: 8 } : "skip"
  ) as any[] | undefined;

  return {
    crystalStats,
    recentCrystals,
    recentShards
  };
};

export const useFormationData = (userId: string | undefined) => {
  const formationStatus = useQuery(
    api.formationQueries.queryFormation,
    userId ? { 
      operation: "status", 
      userId, 
      includeHistory: true, 
      limit: 3 
    } : "skip"
  ) as FormationStatus | undefined;

  const formationEligibility = useQuery(
    api.formationQueries.queryFormation,
    userId ? { 
      operation: "eligibility", 
      userId,
      minShards: 25,
      minDaysSinceLastRun: 0.25
    } : "skip"
  ) as FormationEligibility | undefined;

  return {
    formationStatus,
    formationEligibility
  };
};

export const formatTimeSince = (ms: number): string => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ago`;
  } else {
    return `${minutes}m ago`;
  }
};

// Paginated hooks for optimized queries with fallback support
export const usePaginatedCrystals = (userId: string | undefined, pageSize: number = 20) => {
  const [cursor, setCursor] = useState<string | null>(null);
  const [allCrystals, setAllCrystals] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [paginationError, setPaginationError] = useState<string | null>(null);

  // Paginated query with error handling
  const paginatedResult = useQuery(
    api.paginatedQueries.getPaginatedCrystals,
    userId && !paginationError ? {
      userId,
      paginationOpts: {
        numItems: pageSize,
        cursor
      },
      sortOrder: "desc" as const
    } : "skip"
  );

  // Fallback to original query if pagination fails
  const fallbackResult = useQuery(
    api.crystalQueries.getPersonaData,
    userId && paginationError ? { 
      userId, 
      operation: "crystals", 
      limit: pageSize 
    } : "skip"
  ) as any[] | undefined;

  useEffect(() => {
    // Handle paginated query results
    if (paginatedResult && !cursor) {
      // First page - replace all crystals
      setAllCrystals(paginatedResult.page);
      setPaginationError(null);
    } else if (paginatedResult && cursor) {
      // Subsequent pages - append to existing
      setAllCrystals(prev => [...prev, ...paginatedResult.page]);
    }
    setIsLoadingMore(false);
  }, [paginatedResult, cursor]);

  useEffect(() => {
    // Handle fallback query results
    if (fallbackResult && paginationError) {
      setAllCrystals(fallbackResult);
      setIsLoadingMore(false);
    }
  }, [fallbackResult, paginationError]);

  // Check if paginated query failed and switch to fallback
  useEffect(() => {
    if (userId && !paginatedResult && !paginationError && cursor === null) {
      // If paginated query should have returned data but didn't, switch to fallback
      const timer = setTimeout(() => {
        if (!paginatedResult) {
          console.warn('Paginated crystals query failed, switching to fallback');
          setPaginationError('Pagination failed');
        }
      }, 3000); // Wait 3 seconds before falling back

      return () => clearTimeout(timer);
    }
  }, [userId, paginatedResult, paginationError, cursor]);

  const loadMore = () => {
    if (paginationError) {
      // Can't load more with fallback query
      return;
    }
    
    if (paginatedResult && !paginatedResult.isDone && paginatedResult.continueCursor) {
      setIsLoadingMore(true);
      setCursor(paginatedResult.continueCursor);
    }
  };

  const reset = () => {
    setCursor(null);
    setAllCrystals([]);
    setPaginationError(null);
  };

  return {
    crystals: allCrystals,
    hasMore: paginationError ? false : (paginatedResult ? !paginatedResult.isDone : false),
    isLoadingMore,
    loadMore,
    reset,
    pageInfo: paginatedResult?.pageInfo,
    isUsingFallback: !!paginationError
  };
};

export const usePaginatedShards = (userId: string | undefined, pageSize: number = 50) => {
  const [cursor, setCursor] = useState<string | null>(null);
  const [allShards, setAllShards] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const paginatedResult = useQuery(
    api.paginatedQueries.getPaginatedShards,
    userId ? {
      userId,
      paginationOpts: {
        numItems: pageSize,
        cursor
      },
      sortOrder: "desc" as const
    } : "skip"
  );

  useEffect(() => {
    if (paginatedResult && !cursor) {
      // First page - replace all shards
      setAllShards(paginatedResult.page);
    } else if (paginatedResult && cursor) {
      // Subsequent pages - append to existing
      setAllShards(prev => [...prev, ...paginatedResult.page]);
    }
    setIsLoadingMore(false);
  }, [paginatedResult, cursor]);

  const loadMore = () => {
    if (paginatedResult && !paginatedResult.isDone && paginatedResult.continueCursor) {
      setIsLoadingMore(true);
      setCursor(paginatedResult.continueCursor);
    }
  };

  const reset = () => {
    setCursor(null);
    setAllShards([]);
  };

  return {
    shards: allShards,
    hasMore: paginatedResult ? !paginatedResult.isDone : false,
    isLoadingMore,
    loadMore,
    reset,
    pageInfo: paginatedResult?.pageInfo,
    aggregates: paginatedResult?.aggregates
  };
};
