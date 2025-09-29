/**
 * WIDGET STYLING UTILITIES
 * 
 * Centralized styling functions for consistent widget and project appearance
 * across constellation views.
 */

/**
 * Widget theme mappings for consistent visual styling
 */
export function getWidgetThemeClasses(theme: string): string {
  switch (theme) {
    case 'warm':
      return 'bg-gradient-to-br from-orange-50/50 to-yellow-50/30 dark:from-orange-950/30 dark:to-yellow-950/20 border-orange-200/60 dark:border-orange-800/40 text-orange-700 dark:text-orange-300 shadow-orange-200/50 dark:shadow-orange-900/30'
    case 'clean':
      return 'bg-gradient-to-br from-slate-50/50 to-gray-50/30 dark:from-slate-950/30 dark:to-gray-950/20 border-slate-200/60 dark:border-slate-800/40 text-slate-700 dark:text-slate-300 shadow-slate-200/50 dark:shadow-slate-900/30'
    case 'professional':
      return 'bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/30 dark:to-indigo-950/20 border-blue-200/60 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 shadow-blue-200/50 dark:shadow-blue-900/30'
    case 'creative':
      return 'bg-gradient-to-br from-purple-50/50 to-pink-50/30 dark:from-purple-950/30 dark:to-pink-950/20 border-purple-200/60 dark:border-purple-800/40 text-purple-700 dark:text-purple-300 shadow-purple-200/50 dark:shadow-purple-900/30'
    default:
      return 'bg-gradient-to-br from-slate-50/50 to-gray-50/30 dark:from-slate-950/30 dark:to-gray-950/20 border-slate-200/60 dark:border-slate-800/40 text-slate-700 dark:text-slate-300 shadow-slate-200/50 dark:shadow-slate-900/30'
  }
}

/**
 * Widget size classes for grid layout
 */
export function getWidgetSizeClasses(size: string): string {
  switch (size) {
    case 'small':
      return 'col-span-1 row-span-1'
    case 'medium':
      return 'col-span-2 row-span-1'
    case 'large':
      return 'col-span-2 row-span-2'
    case 'xlarge':
      return 'col-span-3 row-span-2'
    default:
      return 'col-span-2 row-span-1'
  }
}

/**
 * Project status determination and styling
 * Used by both ProjectCard and ProjectStar for consistent status display
 */
export interface ProjectStatus {
  label: string
  stage: 'early' | 'active' | 'established'
  borderColor?: string
  glowColor?: string
  activeGlow?: string
  bgGradient?: string
}

export function getProjectStatus(project: {
  fingerprintId?: string
  updatedAt: number
}): ProjectStatus {
  const hasFingerprint = !!project.fingerprintId
  const isRecent = Date.now() - project.updatedAt < 24 * 60 * 60 * 1000

  if (!hasFingerprint) {
    return {
      label: 'discovering',
      stage: 'early',
      borderColor: 'border-amber-400/40',
      glowColor: 'ring-amber-400/30',
      activeGlow: 'ring-amber-500/60',
      bgGradient: 'bg-gradient-to-br from-amber-50/10 via-transparent to-amber-100/5 dark:from-amber-950/10 dark:to-amber-900/5'
    }
  }

  if (isRecent) {
    return {
      label: 'active',
      stage: 'active',
      borderColor: 'border-blue-400/40',
      glowColor: 'ring-blue-400/30',
      activeGlow: 'ring-blue-500/60',
      bgGradient: 'bg-gradient-to-br from-blue-50/10 via-transparent to-blue-100/5 dark:from-blue-950/10 dark:to-blue-900/5'
    }
  }

  return {
    label: 'living',
    stage: 'established',
    borderColor: 'border-muted-foreground/30',
    glowColor: 'ring-muted-foreground/20',
    activeGlow: 'ring-muted-foreground/40',
    bgGradient: 'bg-gradient-to-br from-muted/10 via-transparent to-muted/5'
  }
}

/**
 * Card size dimensions for constellation positioning
 */
export interface CardDimensions {
  width: number
  height: number
}

export function getCardDimensions(size: 'small' | 'medium' | 'large'): CardDimensions {
  const cardSizes = {
    small: { width: 192, height: 128 },   // w-48 h-32
    medium: { width: 256, height: 160 },  // w-64 h-40
    large: { width: 320, height: 192 }    // w-80 h-48
  }
  
  return cardSizes[size] || cardSizes.medium
}
