import React from 'react'
import { cn } from '@/lib/utils'

/**
 * Standardized Layout Components
 * Replaces hardcoded flexbox and centering logic throughout the app
 */

interface CenterContainerProps {
  children: React.ReactNode
  className?: string
  variant?: 'full' | 'content' | 'card'
  direction?: 'vertical' | 'horizontal' | 'both'
}

/**
 * Standardized centering container
 * Replaces all the hardcoded "flex items-center justify-center" patterns
 */
export function CenterContainer({ 
  children, 
  className = '', 
  variant = 'full',
  direction = 'both'
}: CenterContainerProps) {
  const variants = {
    full: 'h-full w-full',
    content: 'h-full max-w-4xl mx-auto w-full',
    card: 'min-h-[400px] w-full'
  }
  
  const directions = {
    vertical: 'flex flex-col justify-center',
    horizontal: 'flex items-center',
    both: 'flex items-center justify-center'
  }
  
  return (
    <div className={cn(
      variants[variant],
      directions[direction],
      className
    )}>
      {children}
    </div>
  )
}

interface FlexContainerProps {
  children: React.ReactNode
  className?: string
  direction?: 'row' | 'col'
  gap?: 'none' | 'sm' | 'md' | 'lg'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  align?: 'start' | 'center' | 'end' | 'stretch'
}

/**
 * Standardized flex container
 * Replaces repetitive flex container patterns
 */
export function FlexContainer({
  children,
  className = '',
  direction = 'col',
  gap = 'md',
  justify = 'start',
  align = 'stretch'
}: FlexContainerProps) {
  const directions = {
    row: 'flex-row',
    col: 'flex-col'
  }
  
  const gaps = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  }
  
  const justifies = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around'
  }
  
  const aligns = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  }
  
  return (
    <div className={cn(
      'flex',
      directions[direction],
      gaps[gap],
      justifies[justify],
      aligns[align],
      className
    )}>
      {children}
    </div>
  )
}

interface SpacingContainerProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

/**
 * Standardized spacing container
 * Replaces hardcoded padding/margin patterns
 */
export function SpacingContainer({
  children,
  className = '',
  padding = 'md',
  margin = 'none'
}: SpacingContainerProps) {
  const paddings = {
    none: 'p-0',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  }
  
  const margins = {
    none: 'm-0',
    sm: 'm-2',
    md: 'm-4',
    lg: 'm-6',
    xl: 'm-8'
  }
  
  return (
    <div className={cn(
      paddings[padding],
      margins[margin],
      className
    )}>
      {children}
    </div>
  )
}

interface ContentWrapperProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  center?: boolean
}

/**
 * Standardized content wrapper
 * Replaces repeated max-width and centering patterns
 */
export function ContentWrapper({
  children,
  className = '',
  maxWidth = 'lg',
  center = true
}: ContentWrapperProps) {
  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full'
  }
  
  return (
    <div className={cn(
      maxWidths[maxWidth],
      center && 'mx-auto',
      'w-full',
      className
    )}>
      {children}
    </div>
  )
}

/**
 * Full height layout component - ensures proper height inheritance
 */
export function FullHeightContainer({ 
  children, 
  className = '',
  style
}: { 
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div className={cn('h-full flex flex-col', className)} style={style}>
      {children}
    </div>
  )
}

/**
 * Standardized page layout for chat interfaces
 */
export function ChatPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <FullHeightContainer>
      <CenterContainer variant="full">
        <ContentWrapper maxWidth="xl">
          {children}
        </ContentWrapper>
      </CenterContainer>
    </FullHeightContainer>
  )
}
