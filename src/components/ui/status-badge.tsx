/**
 * STATUS BADGE COMPONENT
 * 
 * Semantic status badge with icon support for widget and job statuses.
 * Enforces design system compliance with semantic color tokens.
 * 
 * LAW VI: Centralized status badge component.
 * Eliminates 15+ instances of hardcoded color badges across widget UIs.
 */

import React from 'react'
import { Badge } from './badge'
import { cn } from '@/lib/utils'
import { Circle, Activity, CheckCircle2, XCircle } from 'lucide-react'

export type StatusBadgeStatus = 'idle' | 'active' | 'completed' | 'error'

export interface StatusBadgeProps {
  status: StatusBadgeStatus
  size?: 'sm' | 'md'
  showIcon?: boolean
  className?: string
}

/**
 * Status badge configuration
 */
const statusConfig: Record<StatusBadgeStatus, { icon: React.ComponentType<{ className?: string }>, label: string, className: string }> = {
  idle: {
    icon: Circle,
    label: 'Resting',
    className: 'bg-muted/20 text-muted-foreground border-0'
  },
  active: {
    icon: Activity,
    label: 'Active',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0'
  },
  completed: {
    icon: CheckCircle2,
    label: 'Done',
    className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-0'
  },
  error: {
    icon: XCircle,
    label: 'Error',
    className: 'bg-destructive/10 text-destructive border-0'
  }
}

/**
 * Size configuration
 */
const sizeConfig = {
  sm: {
    icon: 'w-3 h-3',
    text: 'text-xs',
    padding: 'px-2 py-0.5'
  },
  md: {
    icon: 'w-4 h-4',
    text: 'text-sm',
    padding: 'px-2.5 py-1'
  }
}

/**
 * StatusBadge - Semantic status badge component
 * 
 * Displays status with appropriate icon and semantic colors.
 * Supports two sizes (sm, md) and optional icon display.
 * 
 * @example
 * <StatusBadge status="active" size="sm" />
 * <StatusBadge status="completed" showIcon={false} />
 */
export function StatusBadge({ 
  status, 
  size = 'md', 
  showIcon = true, 
  className 
}: StatusBadgeProps) {
  const config = statusConfig[status]
  const sizeStyles = sizeConfig[size]
  const Icon = config.icon
  
  return (
    <Badge 
      className={cn(
        config.className,
        sizeStyles.text,
        sizeStyles.padding,
        className
      )}
    >
      {showIcon && (
        <Icon className={cn(sizeStyles.icon, 'mr-1.5')} />
      )}
      <span>{config.label}</span>
    </Badge>
  )
}





