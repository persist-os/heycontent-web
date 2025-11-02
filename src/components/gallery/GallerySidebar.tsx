/**
 * GALLERY SIDEBAR - Gradient-Based Type Distinction
 * 
 * Visual hierarchy through sophisticated gradients.
 * Artifacts: Blue/Cyan theme
 * Widgets: Purple/Indigo theme
 * 
 * DESIGN COMPLIANCE:
 * - No icons - pure gradient/color distinction
 * - Glassmorphism with backdrop blur
 * - Active state with stronger gradient
 * - Smooth hover transitions
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { GalleryItem } from '@/types/gallery'
import { cn } from '@/lib/utils'

interface GallerySidebarProps {
  items: GalleryItem[]
  currentIndex: number
  onSelectItem: (index: number) => void
  className?: string
}

export function GallerySidebar({
  items,
  currentIndex,
  onSelectItem,
  className
}: GallerySidebarProps) {
  return (
    <div className={cn(
      "w-80 border-r border-border/40 overflow-y-auto bg-muted/20",
      className
    )}>
      <div className="p-3 space-y-2">
        {items.map((item, index) => {
          const isArtifact = item.itemType === 'artifact'
          const isActive = index === currentIndex
          
          // Gradient themes based on type
          const baseGradient = isArtifact
            ? 'from-blue-500/8 via-cyan-500/6 to-blue-500/4'
            : 'from-purple-500/8 via-indigo-500/6 to-purple-500/4'
          
          const hoverGradient = isArtifact
            ? 'hover:from-blue-500/15 hover:via-cyan-500/12 hover:to-blue-500/8'
            : 'hover:from-purple-500/15 hover:via-indigo-500/12 hover:to-purple-500/8'
          
          const activeGradient = isArtifact
            ? 'from-blue-500/20 via-cyan-500/18 to-blue-500/15'
            : 'from-purple-500/20 via-indigo-500/18 to-purple-500/15'
          
          const borderColor = isArtifact
            ? 'border-blue-500/30'
            : 'border-purple-500/30'
          
          const activeBorderColor = isArtifact
            ? 'border-blue-500/50'
            : 'border-purple-500/50'
          
          const typeBadgeGradient = isArtifact
            ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-blue-700 dark:text-blue-300'
            : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-purple-700 dark:text-purple-300'
          
          // Left accent bar gradient
          const accentBar = isArtifact
            ? 'bg-gradient-to-b from-blue-500 via-cyan-500 to-blue-500'
            : 'bg-gradient-to-b from-purple-500 via-indigo-500 to-purple-500'
          
          return (
            <div
              key={item._id}
              onClick={() => onSelectItem(index)}
              className={cn(
                "relative group cursor-pointer rounded-lg transition-all duration-300",
                "border backdrop-blur-sm",
                // Base state
                !isActive && "bg-gradient-to-br",
                !isActive && baseGradient,
                !isActive && hoverGradient,
                !isActive && "border-border/40",
                !isActive && `hover:${borderColor}`,
                // Active state
                isActive && "bg-gradient-to-br",
                isActive && activeGradient,
                isActive && "border-2",
                isActive && activeBorderColor,
                isActive && "shadow-lg",
                isActive && (isArtifact ? "shadow-blue-500/10" : "shadow-purple-500/10")
              )}
            >
              {/* Left accent bar */}
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg transition-all",
                accentBar,
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50"
              )} />
              
              {/* Content */}
              <div className="p-4 pl-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className={cn(
                    "font-semibold text-sm leading-tight flex-1 line-clamp-2",
                    isActive ? "text-foreground" : "text-foreground/80"
                  )}>
                    {item.title}
                  </h3>
                  <Badge 
                    className={cn(
                      "text-xs font-medium border-0 px-2 py-0.5 flex-shrink-0",
                      typeBadgeGradient
                    )}
                  >
                    {item.itemType}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground/70 line-clamp-2">
                  {item.description}
                </p>
              </div>
              
              {/* Bottom gradient border on hover */}
              <div className={cn(
                "absolute bottom-0 left-4 right-4 h-px transition-opacity",
                "bg-gradient-to-r",
                isArtifact 
                  ? "from-transparent via-blue-500/40 to-transparent"
                  : "from-transparent via-purple-500/40 to-transparent",
                isActive ? "opacity-60" : "opacity-0 group-hover:opacity-40"
              )} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
