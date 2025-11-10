/**
 * GALLERY NAVIGATION - Gradient Button Controls
 * 
 * Sophisticated navigation without icons.
 * Pure gradient/glassmorphism styling.
 * 
 * DESIGN COMPLIANCE:
 * - No icons - text-only buttons
 * - Gradient backgrounds with glassmorphism
 * - Smooth hover transitions
 * - Disabled state with reduced opacity
 */

'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { T } from '@/components/translation/T'

interface GalleryNavigationProps {
  hasPrev: boolean
  hasNext: boolean
  currentIndex: number
  total: number
  onPrev: () => void
  onNext: () => void
}

export function GalleryNavigation({
  hasPrev,
  hasNext,
  currentIndex,
  total,
  onPrev,
  onNext
}: GalleryNavigationProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      {/* Previous Button */}
      <Button
        onClick={onPrev}
        disabled={!hasPrev}
        className={cn(
          "px-6 py-3 rounded-lg font-medium backdrop-blur-sm transition-all duration-300",
          "bg-gradient-to-r from-primary/10 via-primary/8 to-primary/5",
          "border border-primary/20",
          "hover:from-primary/20 hover:via-primary/15 hover:to-primary/10",
          "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "disabled:hover:from-primary/10 disabled:hover:via-primary/8 disabled:hover:to-primary/5"
        )}
        variant="ghost"
      >
        <T context="button.gallery.previous">Previous</T>
      </Button>
      
      {/* Counter with gradient background */}
      <div className={cn(
        "px-4 py-2 rounded-lg backdrop-blur-sm",
        "bg-gradient-to-r from-muted/50 to-muted/30",
        "border border-border/40"
      )}>
        <span className="text-sm font-medium text-foreground">
          {currentIndex + 1}
        </span>
        <span className="text-sm text-muted-foreground mx-1.5">/</span>
        <span className="text-sm text-muted-foreground">
          {total}
        </span>
      </div>
      
      {/* Next Button */}
      <Button
        onClick={onNext}
        disabled={!hasNext}
        className={cn(
          "px-6 py-3 rounded-lg font-medium backdrop-blur-sm transition-all duration-300",
          "bg-gradient-to-r from-primary/10 via-primary/8 to-primary/5",
          "border border-primary/20",
          "hover:from-primary/20 hover:via-primary/15 hover:to-primary/10",
          "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "disabled:hover:from-primary/10 disabled:hover:via-primary/8 disabled:hover:to-primary/5"
        )}
        variant="ghost"
      >
        <T context="button.gallery.next">Next</T>
      </Button>
    </div>
  )
}
