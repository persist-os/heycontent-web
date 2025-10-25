import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAuth } from '@/app/context/auth-context';
import { CrystalStats, FormationStatus, FormationEligibility } from './types';
import { toast } from 'sonner';

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

  const softRefresh = () => {
    // Keep existing data but force a fresh query from the beginning
    setCursor(null);
    setPaginationError(null);
    // Don't clear allCrystals immediately - let the new data replace it
  };

  return {
    crystals: allCrystals,
    hasMore: paginationError ? false : (paginatedResult ? !paginatedResult.isDone : false),
    isLoadingMore,
    loadMore,
    reset,
    softRefresh,
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

  const softRefresh = () => {
    // Keep existing data but force a fresh query from the beginning
    setCursor(null);
    // Don't clear allShards immediately - let the new data replace it
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

/**
 * Hook for crystal CRUD operations using existing batchMutateCrystalData
 * Simplified to avoid UI freezing issues
 */
export const useCrystalMutations = () => {
  const batchMutate = useMutation(api.crystalMutations.batchMutateCrystalData);
  const [isWorking, setIsWorking] = useState(false);

  const updateCrystal = async (crystalId: string, updateData: any) => {
    if (isWorking) return false; // Prevent multiple concurrent operations
    
    setIsWorking(true);
    try {
      const result = await batchMutate({
        table: "crystals",
        operations: [{
          type: "update",
          id: crystalId as Id<"crystals">,
          data: {
            ...updateData,
            updatedAt: Date.now()
          }
        }]
      });

      if (result.success) {
        toast.success('Crystal updated successfully');
        return true;
      } else {
        toast.error('Failed to update crystal');
        return false;
      }
    } catch (error) {
      console.error('Error updating crystal:', error);
      toast.error('Failed to update crystal');
      return false;
    } finally {
      setIsWorking(false);
    }
  };

  const deleteCrystal = async (crystalId: string) => {
    if (isWorking) return false; // Prevent multiple concurrent operations
    
    setIsWorking(true);
    try {
      const result = await batchMutate({
        table: "crystals",
        operations: [{
          type: "delete",
          id: crystalId as Id<"crystals">
        }]
      });

      if (result.success) {
        toast.success('Crystal deleted successfully');
        return true;
      } else {
        toast.error('Failed to delete crystal');
        return false;
      }
    } catch (error) {
      console.error('Error deleting crystal:', error);
      toast.error('Failed to delete crystal');
      return false;
    } finally {
      setIsWorking(false);
    }
  };

  return {
    updateCrystal,
    deleteCrystal,
    isLoading: isWorking
  };
};

/**
 * Hook for crystal shard CRUD operations using existing batchMutateCrystalData
 * Simplified to avoid UI freezing issues
 */
export const useShardMutations = () => {
  const batchMutate = useMutation(api.crystalMutations.batchMutateCrystalData);
  const [isWorking, setIsWorking] = useState(false);

  const updateShard = async (shardId: string, updateData: any) => {
    if (isWorking) return false; // Prevent multiple concurrent operations
    
    setIsWorking(true);
    try {
      const result = await batchMutate({
        table: "crystal_shards",
        operations: [{
          type: "update",
          id: shardId as Id<"crystal_shards">,
          data: {
            ...updateData,
            updatedAt: Date.now()
          }
        }]
      });

      if (result.success) {
        toast.success('Shard updated successfully');
        return true;
      } else {
        toast.error('Failed to update shard');
        return false;
      }
    } catch (error) {
      console.error('Error updating shard:', error);
      toast.error('Failed to update shard');
      return false;
    } finally {
      setIsWorking(false);
    }
  };

  const deleteShard = async (shardId: string) => {
    if (isWorking) return false; // Prevent multiple concurrent operations
    
    setIsWorking(true);
    try {
      const result = await batchMutate({
        table: "crystal_shards",
        operations: [{
          type: "delete",
          id: shardId as Id<"crystal_shards">
        }]
      });

      if (result.success) {
        toast.success('Shard deleted successfully');
        return true;
      } else {
        toast.error('Failed to delete shard');
        return false;
      }
    } catch (error) {
      console.error('Error deleting shard:', error);
      toast.error('Failed to delete shard');
      return false;
    } finally {
      setIsWorking(false);
    }
  };

  return {
    updateShard,
    deleteShard,
    isLoading: isWorking
  };
};

/**
 * Hook to fetch shard content by their IDs
 * Used to display actual shard content in crystal cards
 */
export const useShardsByIds = (userId: string | undefined, shardIds: string[] | undefined) => {
  const shards = useQuery(
    api.shardQueries.getShardsByIds,
    userId && shardIds && shardIds.length > 0 ? {
      userId,
      shardIds
    } : "skip"
  );

  return {
    shards: shards || [],
    isLoading: shards === undefined,
    hasShards: shards && shards.length > 0
  };
};

/**
 * Hook to fetch recent formation run data for debugging/monitoring
 */
export const useFormationRuns = (userId: string | undefined, limit: number = 5) => {
  const formationRuns = useQuery(
    api.formationQueries.getRecentFormationRuns,
    userId ? { userId, limit } : "skip"
  );

  return {
    formationRuns: formationRuns || [],
    isLoading: formationRuns === undefined
  };
};
