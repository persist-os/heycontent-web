import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronDown } from 'lucide-react';
import { ShardCard } from './ShardCard';
import { usePaginatedShards, useAuth } from './hooks';

interface ShardsViewProps {
  recentShards?: any[]; // Legacy prop for fallback
}

export const ShardsView: React.FC<ShardsViewProps> = ({ recentShards }) => {
  const userId = useAuth();
  const { 
    shards, 
    hasMore, 
    isLoadingMore, 
    loadMore, 
    pageInfo,
    aggregates 
  } = usePaginatedShards(userId, 50); // Load 50 shards per page
  // Use paginated data if available, fallback to legacy prop
  const displayShards = shards.length > 0 ? shards : (recentShards || []);
  const isLoading = !userId || (shards.length === 0 && !recentShards);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-medium text-foreground">Information Shards</h3>
        <p className="text-muted-foreground">
          Raw insights and observations
          {(aggregates?.totalShards || pageInfo) && ` • ${displayShards.length}${aggregates?.totalShards ? ` of ${aggregates.totalShards}` : ''} shards`}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border border-border/50 rounded-xl p-4 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="flex justify-between">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : displayShards.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayShards.map((shard: any) => (
              <ShardCard 
                key={shard._id} 
                shard={shard} 
              />
            ))}
          </div>
          
          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={loadMore}
                disabled={isLoadingMore}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {isLoadingMore ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading more...
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Load more shards
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No shards found. Start a conversation to generate insights!</p>
        </div>
      )}
    </div>
  );
};
