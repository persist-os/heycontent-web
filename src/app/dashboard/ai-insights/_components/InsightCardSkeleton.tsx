'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function InsightCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col space-y-4">
      <Skeleton className="h-5 w-3/4" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  )
} 