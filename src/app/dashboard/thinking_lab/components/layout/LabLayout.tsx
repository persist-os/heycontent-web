import React from 'react'
import { useThemeClasses } from '@/lib/theme-utils'
import { FullHeightContainer, FlexContainer } from '@/components/ui/layout'

interface LabLayoutProps {
  isMobile: boolean
  children: React.ReactNode
  className?: string
}

/**
 * Unified thinking lab layout component that handles both mobile and desktop layouts
 * Uses h-screen to constrain to viewport height specifically for the thinking lab
 */
export function LabLayout({ isMobile, children, className = '' }: LabLayoutProps) {
  const themeClasses = useThemeClasses()
  
  // Check if className contains flex-col to override direction
  const isColumn = className.includes('flex-col')
  const direction = isColumn ? 'col' : (isMobile ? 'col' : 'row')
  
  return (
    <div className={`h-screen flex flex-col overflow-hidden ${themeClasses.layout.panel} ${className}`}>
      <FlexContainer 
        direction={direction} 
        gap="none"
        className="h-full"
      >
        {children}
      </FlexContainer>
    </div>
  )
}

interface LabPanelProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

/**
 * Reusable lab panel wrapper with expand button support
 */
export function LabPanel({ children, className = '', style }: LabPanelProps) {
  const themeClasses = useThemeClasses()
  
  return (
    <FullHeightContainer 
      className={`${themeClasses.layout.panel} relative group border-r border-border/30 last:border-r-0 ${className}`}
      style={style}
    >
      {children}
    </FullHeightContainer>
  )
}

interface LabContentAreaProps {
  children: React.ReactNode
  isFlexGrow?: boolean
  className?: string
}

/**
 * Content area wrapper with consistent styling for lab components
 */
export function LabContentArea({ children, isFlexGrow = true, className = '' }: LabContentAreaProps) {
  return (
    <FlexContainer 
      direction="col" 
      gap="none" 
      className={`${isFlexGrow ? 'flex-1' : 'flex-shrink-0'} overflow-hidden p-4 ${className}`}
    >
      {children}
    </FlexContainer>
  )
}
