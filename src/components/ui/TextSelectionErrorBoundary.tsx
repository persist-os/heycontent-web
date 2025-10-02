'use client'

import React, { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Error boundary specifically designed for text selection features
 * Provides graceful degradation when DOM selection APIs fail
 */
export class TextSelectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for monitoring
    console.warn('TextSelectionErrorBoundary caught an error:', error, errorInfo)
    
    // Call optional error callback
    this.props.onError?.(error, errorInfo)

    // In development, provide more detailed logging
    if (process.env.NODE_ENV === 'development') {
      console.group('Text Selection Error Details')
      console.error('Error:', error)
      console.error('Component Stack:', errorInfo.componentStack)
      console.error('Error Boundary:', errorInfo.errorBoundary)
      console.groupEnd()
    }
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI or default
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="text-selection-error-fallback flex items-center gap-2 text-muted-foreground text-sm p-2 rounded bg-muted/30">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          <span>Text selection temporarily unavailable</span>
        </div>
      )
    }

    return this.props.children
  }

  // Method to reset error state (useful for retry scenarios)
  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: undefined })
  }
}

/**
 * Hook-based wrapper for functional components
 */
export function withTextSelectionErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <TextSelectionErrorBoundary fallback={fallback}>
        <Component {...props} />
      </TextSelectionErrorBoundary>
    )
  }
}

/**
 * Lightweight error boundary for inline use
 */
interface ErrorBoundaryWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  className?: string
}

export function TextSelectionWrapper({ 
  children, 
  fallback, 
  className 
}: ErrorBoundaryWrapperProps) {
  return (
    <div className={className}>
      <TextSelectionErrorBoundary fallback={fallback}>
        {children}
      </TextSelectionErrorBoundary>
    </div>
  )
}
