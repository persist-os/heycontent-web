import React from 'react'
import { useThemeClasses } from '@/lib/theme-utils'

interface ChatLayoutProps {
  isMobile: boolean
  children: React.ReactNode
  className?: string
}

/**
 * Unified chat layout component that handles both mobile and desktop layouts
 * Replaces repetitive layout logic in ChatContainer
 */
export function ChatLayout({ isMobile, children, className = '' }: ChatLayoutProps) {
  const themeClasses = useThemeClasses()
  
  if (isMobile) {
    return (
      <div className={`flex flex-col h-screen ${themeClasses.layout.panel} ${className}`}>
        {children}
      </div>
    )
  }
  
  return (
    <div className={`flex h-screen ${themeClasses.layout.panel} ${className}`}>
      {children}
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
    <div 
      className={`flex flex-col h-screen ${themeClasses.layout.panel} relative group ${className}`}
      style={style}
    >
      {children}
    </div>
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
    <div className={`${isFlexGrow ? 'flex-1' : 'flex-shrink-0'} h-full flex flex-col ${className}`}>
      {children}
    </div>
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
