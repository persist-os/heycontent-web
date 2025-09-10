'use client'

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function LoadingState() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Header Skeleton */}
        <div className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
            <div className="lg:col-span-2">
              <div className="space-y-4">
                <div className="flex items-baseline gap-4">
                  <Skeleton className="w-32 h-12" />
                  <div className="h-px bg-border flex-1 mb-4" />
                </div>
                <Skeleton className="w-64 h-8 ml-8" />
                <div className="ml-16 mt-6">
                  <Skeleton className="w-80 h-4 mb-2" />
                  <Skeleton className="w-72 h-4" />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start lg:items-end">
              <Skeleton className="w-32 h-10" />
              <Skeleton className="w-40 h-3 mt-2" />
            </div>
          </div>

          {/* Filter Navigation Skeleton */}
          <div className="mt-12 flex items-center gap-8 border-b border-border/30">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="w-20 h-4 mb-4" />
            ))}
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="mt-12 space-y-8">
          <div className="flex flex-wrap items-center gap-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="w-24 h-4" />
            ))}
          </div>

          {/* Projects Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card border border-border/50 relative overflow-hidden">
                <div className="h-px bg-muted/30" />
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Skeleton className="w-3/4 h-6 mb-1" />
                        <Skeleton className="w-16 h-3" />
                      </div>
                      <Skeleton className="w-2 h-3" />
                    </div>
                    <Skeleton className="w-full h-4 mt-3" />
                    <Skeleton className="w-2/3 h-4" />
                  </div>
                  <div className="pt-3 border-t border-border/30">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Skeleton className="w-20 h-3" />
                        <Skeleton className="w-16 h-3" />
                      </div>
                      <Skeleton className="w-12 h-3" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
