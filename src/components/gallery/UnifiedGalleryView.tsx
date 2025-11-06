/**
 * TRUE UNIFIED GALLERY VIEW - Full Screen Experience
 * 
 * Sophisticated gradient-based gallery showing artifacts and widgets.
 * Visual distinction through color themes (no icons).
 * 
 * DESIGN COMPLIANCE:
 * - Artifact theme: Blue/Cyan gradients
 * - Widget theme: Purple/Indigo gradients
 * - Glassmorphism throughout
 * - No icons - pure gradient styling
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UnifiedGalleryViewProps } from '@/types/gallery'
import { GallerySidebar } from './GallerySidebar'
import { GalleryNavigation } from './GalleryNavigation'
import { useGalleryNavigation } from '@/hooks/useGalleryNavigation'
import { ArtifactRenderer } from '@/components/artifacts/ArtifactRenderer'
import { WidgetDetailView } from './WidgetDetailView'
import { cn } from '@/lib/utils'

export function UnifiedGalleryView({
  projectId,
  initialItemId,
  items,
  onClose,
  userId
}: UnifiedGalleryViewProps & { userId?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  const {
    currentItem,
    currentIndex,
    total,
    hasPrev,
    hasNext,
    goToPrev,
    goToNext,
    goToIndex
  } = useGalleryNavigation({
    items,
    initialItemId,
    projectId,
    onClose
  })
  
  // Empty state
  if (items.length === 0) {
    return (
      <div className="fixed inset-0 bg-background">
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4 max-w-md">
            <h2 className="text-2xl font-semibold text-foreground">No Items Yet</h2>
            <p className="text-muted-foreground">
              This project doesn't have any artifacts or widgets yet
            </p>
            <Button onClick={onClose} variant="outline">
              Back to Project
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  // No current item (safety check)
  if (!currentItem) {
    return null
  }
  
  const isArtifact = currentItem.itemType === 'artifact'
  const typeLabel = isArtifact ? 'Artifact' : 'Widget'
  
  // Gradient themes based on type
  const headerGradient = isArtifact
    ? 'bg-gradient-to-br from-blue-500/10 via-cyan-500/8 to-blue-500/5'
    : 'bg-gradient-to-br from-purple-500/10 via-indigo-500/8 to-purple-500/5'
  
  const accentBorder = isArtifact
    ? 'border-blue-500/20'
    : 'border-purple-500/20'
  
  const typeBadgeGradient = isArtifact
    ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400'
    : 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-600 dark:text-purple-400'
  
  // Render current item based on its type
  const renderCurrentItem = () => {
    if (isArtifact) {
      return (
        <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl p-6">
          <ArtifactRenderer 
            artifact={currentItem as any} 
            editable={false} 
          />
        </div>
      )
    } else {
      // Widget display with comprehensive detail view
      return userId ? (
        <WidgetDetailView 
          widget={currentItem} 
          userId={userId}
          projectId={projectId}
        />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>User authentication required to view widget details</p>
        </div>
      )
    }
  }
  
  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Header with gradient theme */}
      <div className={cn(
        "border-b backdrop-blur-xl",
        headerGradient,
        accentBorder
      )}>
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Title & Type Badge */}
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-foreground">
                Project Gallery
              </h1>
              <Badge 
                variant="outline" 
                className={cn(
                  "px-3 py-1 font-medium border-0",
                  typeBadgeGradient
                )}
              >
                {typeLabel}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} of {total}
              </span>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {/* Toggle Sidebar */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-muted-foreground hover:text-foreground"
              >
                {sidebarOpen ? 'Hide List' : 'Show List'}
              </Button>
              
              {/* Back to Constellation */}
              <Button
                onClick={onClose}
                variant="outline"
                className={cn(
                  "backdrop-blur-sm border-0",
                  isArtifact 
                    ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400" 
                    : "bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400"
                )}
              >
                Back to Constellation
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Body with Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <GallerySidebar
            items={items}
            currentIndex={currentIndex}
            onSelectItem={goToIndex}
          />
        )}
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-8">
            {/* Render current item with fade transition */}
            <div className="animate-in fade-in-0 duration-300">
              {renderCurrentItem()}
            </div>
            
            {/* Navigation Controls */}
            <div className="mt-6">
              <GalleryNavigation
                hasPrev={hasPrev}
                hasNext={hasNext}
                currentIndex={currentIndex}
                total={total}
                onPrev={goToPrev}
                onNext={goToNext}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
