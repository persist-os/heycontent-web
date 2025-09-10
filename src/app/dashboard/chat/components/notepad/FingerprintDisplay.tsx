'use client'

import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'
import { X, RefreshCw, Eye } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Skeleton } from '@/components/ui/skeleton'
import { useProjectFingerprint, useFingerprintDisplay } from '@/store/project-fingerprint-store'

interface FingerprintDisplayProps {
  isOpen: boolean
  onClose: () => void
  width: number
  onWidthChange: (width: number) => void
  style: React.CSSProperties
  // Mobile props
  isMobile?: boolean
  activeTab?: 'chat' | 'notes' | 'fingerprint'
  onScrollPositionChange?: (position: number) => void
}

const FingerprintField: React.FC<{
  label: string;
  value: string | string[] | number | undefined;
  isArray?: boolean;
  isLoading?: boolean;
}> = ({ label, value, isArray = false, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="mb-8">
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    )
  }

  if (!value || (Array.isArray(value) && value.length === 0)) {
    return null
  }

  return (
    <div className="mb-8">
      <h4 className="text-sm font-medium text-primary mb-3 uppercase tracking-wide">
        {label}
      </h4>
      {Array.isArray(value) ? (
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <span
              key={index}
              className="inline-block px-3 py-1.5 text-sm bg-primary/10 text-primary border border-primary/20 rounded-full hover:bg-primary/15 transition-colors"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-foreground break-words">
          {typeof value === 'number' ? value.toString() : value}
        </p>
      )}
    </div>
  )
}

const FingerprintSection: React.FC<{
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
}> = ({ title, children, isLoading = false }) => {
  if (isLoading) {
    return (
      <section className="mb-12">
        <Skeleton className="h-6 w-48 mb-8" />
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="mb-12">
      <h2 className="text-xl font-medium text-foreground mb-8 pb-2 border-b border-primary/20">
        {title}
      </h2>
      <div className="space-y-8">
        {children}
      </div>
    </section>
  )
}

export const FingerprintDisplay = forwardRef(function FingerprintDisplay({
  isOpen,
  onClose,
  width,
  onWidthChange,
  style,
  isMobile = false,
  activeTab = 'fingerprint',
  onScrollPositionChange
}: FingerprintDisplayProps, ref) {
  const [isResizing, setIsResizing] = useState(false)
  const resizeStartX = useRef<number>(0)
  const resizeStartWidth = useRef<number>(0)
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const accentBg = isDark ? 'bg-primary' : 'bg-purple-600'
  const accentBgHover = isDark ? 'hover:bg-primary/90' : 'hover:bg-purple-700'

  // Get fingerprint data using the store
  const { fingerprint, isLoading, hasFingerprint } = useProjectFingerprint()
  const displayData = useFingerprintDisplay()

  // Handle resizing (desktop only)
  useEffect(() => {
    if (isMobile) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return

      const deltaX = resizeStartX.current - e.clientX
      const newWidth = Math.max(300, Math.min(800, resizeStartWidth.current + deltaX))
      onWidthChange(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isResizing, onWidthChange, isMobile])

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    if (isMobile) return
    e.preventDefault()
    e.stopPropagation()
    resizeStartX.current = e.clientX
    resizeStartWidth.current = width
    setIsResizing(true)
  }, [width, isMobile])

  // Don't render on mobile if not the active tab
  if (isMobile && activeTab !== 'fingerprint') {
    return null
  }

  // Don't render on desktop if not open
  if (!isMobile && !isOpen) {
    return null
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-background">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-foreground">
              Project Fingerprint
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded transition-colors"
              aria-label="Close fingerprint"
              title="Close fingerprint"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-auto relative p-4">
          {!hasFingerprint ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="max-w-sm">
                <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  No Project Fingerprint
                </h3>
                <p className="text-muted-foreground text-sm">
                  Create a project and start a conversation to generate your fingerprint.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="pb-6 border-b border-primary/20">
                <h1 className="text-xl font-semibold text-foreground mb-3">
                  {displayData.name || 'Untitled Project'}
                </h1>
                {displayData.description && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {displayData.description}
                  </p>
                )}
              </div>

              {/* Intelligence Overview */}
              <FingerprintSection title="Project Intelligence" isLoading={isLoading}>
                <FingerprintField
                  label="Domain"
                  value={displayData.domain}
                  isLoading={isLoading}
                />
                <FingerprintField
                  label="Complexity Level"
                  value={displayData.complexity_level}
                  isLoading={isLoading}
                />
                <FingerprintField
                  label="Working Style"
                  value={displayData.working_style}
                  isArray={true}
                  isLoading={isLoading}
                />
              </FingerprintSection>

              {/* Intentions */}
              <FingerprintSection title="Core Intentions" isLoading={isLoading}>
                <FingerprintField
                  label="What This Is About"
                  value={displayData.core_intention}
                  isLoading={isLoading}
                />
                <FingerprintField
                  label="Success Vision"
                  value={displayData.success_vision}
                  isLoading={isLoading}
                />
                <FingerprintField
                  label="Personal Growth"
                  value={displayData.personal_growth}
                  isArray={true}
                  isLoading={isLoading}
                />
              </FingerprintSection>

              {/* Deliverables */}
              <FingerprintSection title="What You'll Create" isLoading={isLoading}>
                <FingerprintField
                  label="Tangible Outputs"
                  value={displayData.tangible_deliverables}
                  isArray={true}
                  isLoading={isLoading}
                />
                <FingerprintField
                  label="Intangible Benefits"
                  value={displayData.intangible_benefits}
                  isArray={true}
                  isLoading={isLoading}
                />
              </FingerprintSection>

              {/* Working Environment */}
              <FingerprintSection title="How You Work" isLoading={isLoading}>
                <FingerprintField
                  label="Constraints"
                  value={displayData.user_constraints}
                  isArray={true}
                  isLoading={isLoading}
                />
                <FingerprintField
                  label="Support Systems"
                  value={displayData.support_systems}
                  isArray={true}
                  isLoading={isLoading}
                />
                <FingerprintField
                  label="Potential Challenges"
                  value={displayData.potential_obstacles}
                  isArray={true}
                  isLoading={isLoading}
                />
              </FingerprintSection>
            </div>
          )}
        </div>

        {/* Mobile Footer */}
        <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground/80 shrink-0">
          Live project intelligence • Evolves with your work
        </div>
      </div>
    )
  }

  // Desktop layout
  return (
    <div
      className="fixed top-0 right-0 h-full bg-background border-l border-border z-40 flex flex-col shadow-lg"
      style={{ ...style, width: `${width}px` }}
    >
      {/* Resize Handle */}
      <div
        className={`absolute left-0 top-0 w-2 h-full cursor-col-resize z-50 ${isDark ? 'hover:bg-primary/10' : 'hover:bg-purple-600/10'} transition-colors group flex items-center justify-center`}
        onMouseDown={handleResizeStart}
      >
        <div className={`w-0.5 h-8 bg-border ${isDark ? 'group-hover:bg-primary/50' : 'group-hover:bg-purple-600/50'} transition-colors rounded-full`} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">
            Project Fingerprint
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded transition-colors"
            aria-label="Close fingerprint"
            title="Close fingerprint"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto relative">
        <div className="p-4">
          {!hasFingerprint ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="max-w-sm">
                <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  No Project Fingerprint
                </h3>
                <p className="text-muted-foreground text-sm">
                  Create a project and start a conversation to generate your fingerprint.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="pb-6 border-b border-primary/20">
                <h1 className="text-xl font-semibold text-foreground mb-3">
                  {displayData.name || 'Untitled Project'}
                </h1>
                {displayData.description && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {displayData.description}
                  </p>
                )}
              </div>

              {/* Intelligence Overview */}
              <FingerprintSection title="Project Intelligence" isLoading={isLoading}>
                <FingerprintField
                  label="Domain"
                  value={displayData.domain}
                  isLoading={isLoading}
                />
                <FingerprintField
                  label="Complexity Level"
                  value={displayData.complexity_level}
                  isLoading={isLoading}
                />
                <FingerprintField
                  label="Working Style"
                  value={displayData.working_style}
                  isArray={true}
                  isLoading={isLoading}
                />
              </FingerprintSection>

              {/* Intentions */}
              <FingerprintSection title="Core Intentions" isLoading={isLoading}>
                <FingerprintField
                  label="What This Is About"
                  value={displayData.core_intention}
                  isLoading={isLoading}
                />
                <FingerprintField
                  label="Success Vision"
                  value={displayData.success_vision}
                  isLoading={isLoading}
                />
                <FingerprintField
                  label="Personal Growth"
                  value={displayData.personal_growth}
                  isArray={true}
                  isLoading={isLoading}
                />
              </FingerprintSection>

              {/* Deliverables */}
              <FingerprintSection title="What You'll Create" isLoading={isLoading}>
                <FingerprintField
                  label="Tangible Outputs"
                  value={displayData.tangible_deliverables}
                  isArray={true}
                  isLoading={isLoading}
                />
                <FingerprintField
                  label="Intangible Benefits"
                  value={displayData.intangible_benefits}
                  isArray={true}
                  isLoading={isLoading}
                />
              </FingerprintSection>

              {/* Working Environment */}
              <FingerprintSection title="How You Work" isLoading={isLoading}>
                <FingerprintField
                  label="Constraints"
                  value={displayData.user_constraints}
                  isArray={true}
                  isLoading={isLoading}
                />
                <FingerprintField
                  label="Support Systems"
                  value={displayData.support_systems}
                  isArray={true}
                  isLoading={isLoading}
                />
                <FingerprintField
                  label="Potential Challenges"
                  value={displayData.potential_obstacles}
                  isArray={true}
                  isLoading={isLoading}
                />
              </FingerprintSection>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground/80 shrink-0">
        Live project intelligence • Evolves with your work
      </div>
    </div>
  )
})
