import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronDown } from 'lucide-react';
import { CrystalCard } from './CrystalCard';
import { usePaginatedCrystals, useAuth } from './hooks';

interface CrystalsViewProps {
  recentCrystals?: any[]; // Legacy prop for fallback
}

export const CrystalsView: React.FC<CrystalsViewProps> = ({ recentCrystals }) => {
  const userId = useAuth();
  const { 
    crystals, 
    hasMore, 
    isLoadingMore, 
    loadMore, 
    pageInfo 
  } = usePaginatedCrystals(userId);
  // Use paginated data if available, fallback to legacy prop
  const displayCrystals = crystals.length > 0 ? crystals : (recentCrystals || []);
  const isLoading = !userId || (crystals.length === 0 && !recentCrystals);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-medium text-foreground">Knowledge Crystals</h3>
        <p className="text-muted-foreground">
          Consolidated patterns and behavioral insights
          {pageInfo && ` • ${displayCrystals.length} crystals`}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-border/50 rounded-2xl p-6 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : displayCrystals.length > 0 ? (
        <>
          <div className="space-y-6">
            {displayCrystals.map((crystal: any) => (
              <CrystalCard key={crystal._id} crystal={crystal} />
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
                    Load more crystals
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No crystals found. Start a conversation to generate insights!</p>
        </div>
      )}
    </div>
  );
};
