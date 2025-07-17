'use client'

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { ContentHubInsightsUI } from './ContentHubInsightsUI'
import { mockContentHubInsight, mockDataBundle } from './contentHubInsightsMockData'

interface ContentHubInsightsSkeletonProps {
  isLoading?: boolean
  showPreview?: boolean
}

export function ContentHubInsightsSkeleton({ 
  isLoading = true, 
  showPreview = false 
}: ContentHubInsightsSkeletonProps) {
  
  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="mb-6">
        <Card className="p-6 border-2 border-transparent shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-9 w-20" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </Card>
      </div>
    )
  }

  // Show preview with mock data
  if (showPreview) {
    return (
      <ContentHubInsightsUI
        insight={mockContentHubInsight}
        hasMinimumPlatforms={mockDataBundle.hasMinimumPlatforms}
        connectedPlatforms={mockDataBundle.connectedPlatforms}
        refreshing={false}
        disabled={true}
        onRefresh={() => {}}
        onDiscuss={() => {}}
        onGenerate={() => {}}
      />
    )
  }

  return null
} 