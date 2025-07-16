import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function PageSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header Skeleton */}
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Metrics Row Skeleton */}
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </div>
              </Card>
            ))}
            <Skeleton className="h-10 w-48" />
          </div>
          <Skeleton className="h-16 w-52" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column Skeleton */}
        <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-border p-4">
          <div className="mb-4">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div className="w-full lg:w-1/2 p-4">
          <Skeleton className="h-6 w-40 mb-4" />
          <Card className="p-6">
            <Skeleton className="h-32 w-full mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </Card>
        </div>
      </div>
    </div>
  );
} 