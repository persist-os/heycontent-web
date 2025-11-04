import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ProjectStatusBadgeProps {
  status: 'working' | 'sleeping' | 'stable' | 'fresh'
  size?: 'sm' | 'md' | 'lg'
  showPulse?: boolean
  className?: string
}

export function ProjectStatusBadge({ 
  status, 
  size = 'md',
  showPulse = true,
  className 
}: ProjectStatusBadgeProps) {
  return (
    <Badge className={cn(
      // Size variants
      size === 'sm' && 'text-xs px-2 py-0.5',
      size === 'md' && 'text-sm px-3 py-1',
      size === 'lg' && 'text-base px-4 py-1.5',
      
      // Status colors (semantic - from spec)
      status === 'working' && 'bg-primary/10 text-primary border-primary/20',
      status === 'sleeping' && 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      status === 'stable' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      status === 'fresh' && 'bg-accent/10 text-accent-foreground border-accent/20',
      
      className
    )}>
      {/* Pulse animation for 'working' */}
      {status === 'working' && showPulse && (
        <span className="w-2 h-2 bg-primary rounded-full animate-pulse mr-2" />
      )}
      
      {/* Status text */}
      {status === 'working' && 'Working'}
      {status === 'sleeping' && '💤 Sleeping'}
      {status === 'stable' && '✅ Stable'}
      {status === 'fresh' && '✨ Fresh'}
    </Badge>
  )
}

