import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ShardCard } from './ShardCard';

interface ShardsViewProps {
  recentShards?: any[];
}

export const ShardsView: React.FC<ShardsViewProps> = ({ recentShards }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-medium text-foreground">Information Shards</h3>
        <p className="text-muted-foreground">Raw insights and observations</p>
      </div>

      {recentShards ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentShards.map((shard: any) => (
            <ShardCard key={shard._id} shard={shard} />
          ))}
        </div>
      ) : (
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
      )}
    </div>
  );
};
