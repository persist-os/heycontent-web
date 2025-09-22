import React from 'react'
import { useThemeClasses } from '@/lib/theme-utils'
import { FullHeightContainer, FlexContainer } from '@/components/ui/layout'

interface ChatLayoutProps {
  isMobile: boolean
  children: React.ReactNode
  className?: string
}

/**
 * Unified chat layout component that handles both mobile and desktop layouts
 * Replaces repetitive layout logic in ChatContainer
 * Uses h-screen to constrain to viewport height specifically for chat
 */
export function ChatLayout({ isMobile, children, className = '' }: ChatLayoutProps) {
  const themeClasses = useThemeClasses()
  
  return (
    <div className={`h-screen flex flex-col overflow-hidden ${themeClasses.layout.panel} ${className}`}>
      <FlexContainer 
        direction={isMobile ? 'col' : 'row'} 
        gap="none"
        className="h-full"
      >
        {children}
      </FlexContainer>
    </div>
  )
}

interface ChatPanelProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

/**
 * Reusable chat panel wrapper
 */
export function ChatPanel({ children, className = '', style }: ChatPanelProps) {
  const themeClasses = useThemeClasses()
  
  return (
    <FullHeightContainer 
      className={`${themeClasses.layout.panel} relative group ${className}`}
      style={style}
    >
      {children}
    </FullHeightContainer>
  )
}

interface ContentAreaProps {
  children: React.ReactNode
  isFlexGrow?: boolean
  className?: string
}

/**
 * Content area wrapper with consistent styling
 */
export function ContentArea({ children, isFlexGrow = true, className = '' }: ContentAreaProps) {
  return (
    <FlexContainer 
      direction="col" 
      gap="none" 
      className={`${isFlexGrow ? 'flex-1' : 'flex-shrink-0'} overflow-hidden ${className}`}
    >
      {children}
    </FlexContainer>
  )
}

interface InputAreaProps {
  children: React.ReactNode
  className?: string
}

/**
 * Input area wrapper for consistent bottom positioning
 */
export function InputArea({ children, className = '' }: InputAreaProps) {
  const themeClasses = useThemeClasses()
  
  return (
    <div className={`flex-shrink-0 border-t border-border bg-background ${className}`}>
      {children}
    </div>
  )
}
