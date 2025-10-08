/**
 * FINGERPRINT VIEWS
 * Collapsed and Expanded view components
 */

'use client'

import React, { useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { StatusIndicator, ActionButtons, ProgressBar } from './FingerprintComponents'
import { StatusConfig, TABS, TabType } from './fingerprintConfig'
import { GripVertical } from 'lucide-react'

interface CollapsedViewProps {
  fingerprint: any
  statusConfig: StatusConfig
  completion: number
  onExpand: () => void
}

export const CollapsedView = ({ fingerprint, statusConfig, completion, onExpand }: CollapsedViewProps) => (
  <motion.div
    drag
    dragMomentum={false}
    whileTap={{ scale: 0.97, cursor: "grabbing" }}
    whileHover={{ scale: 1.02, y: -1 }}
    transition={{ type: "spring", stiffness: 400, damping: 25 }}
    className="cursor-grab"
  >
    <button
      onClick={onExpand}
      className="group relative bg-background/80 backdrop-blur-md rounded-xl px-4 py-3 hover:bg-background/95 transition-all duration-300 border border-border/20 hover:border-border/40 shadow-sm hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <StatusIndicator statusConfig={statusConfig} />
        </div>
        
        <div className="text-left">
          <motion.div 
            className="text-sm font-medium"
            initial={false}
            animate={{ opacity: [1, 0.85, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            {fingerprint.name}
          </motion.div>
          <div className="text-xs text-muted-foreground/60 font-light tracking-wide">
            {completion}% formed
          </div>
        </div>
      </div>
      
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-foreground/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </button>
  </motion.div>
)

interface ExpandedViewProps {
  fingerprint: any
  statusConfig: StatusConfig
  completion: number
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  isEditing: boolean
  isSaving: boolean
  hasChanges: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onClose: () => void
  modalSize: { width: number; height: number }
  setModalSize: (size: { width: number; height: number }) => void
  children: React.ReactNode
}

export const ExpandedView = ({
  fingerprint,
  statusConfig,
  completion,
  activeTab,
  setActiveTab,
  isEditing,
  isSaving,
  hasChanges,
  onEdit,
  onSave,
  onCancel,
  onClose,
  modalSize,
  setModalSize,
  children
}: ExpandedViewProps) => {
  const resizeRef = useRef<HTMLDivElement>(null)
  const isResizing = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })
  const startSize = useRef({ width: 0, height: 0 })

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isResizing.current = true
    startPos.current = { x: e.clientX, y: e.clientY }
    startSize.current = { ...modalSize }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current) return

      const deltaX = moveEvent.clientX - startPos.current.x
      const deltaY = moveEvent.clientY - startPos.current.y

      const newWidth = Math.max(600, Math.min(1600, startSize.current.width + deltaX))
      const newHeight = Math.max(400, Math.min(1200, startSize.current.height + deltaY))

      setModalSize({ width: newWidth, height: newHeight })
    }

    const handleMouseUp = () => {
      isResizing.current = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [modalSize, setModalSize])

  return (
  <motion.div
    ref={resizeRef}
    drag
    dragMomentum={false}
    whileTap={{ scale: 0.99, cursor: "grabbing" }}
    initial={{ opacity: 0, scale: 0.96, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 300, damping: 30 }}
    className="cursor-grab bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/30 overflow-hidden relative"
    style={{ 
      width: `${modalSize.width}px`, 
      height: `${modalSize.height}px`,
      maxWidth: '95vw',
      maxHeight: '90vh'
    }}
  >
    {/* Header */}
    <div className="relative px-6 py-5 border-b border-border/10 bg-gradient-to-b from-muted/5 to-transparent">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative flex items-center gap-2">
              <StatusIndicator statusConfig={statusConfig} />
              <span className="text-xs font-medium text-muted-foreground/70 tracking-wide">
                {statusConfig.label}
              </span>
            </div>
            
            {fingerprint.domain && (
              <>
                <span className="text-xs text-muted-foreground/40">•</span>
                <span className="text-xs text-muted-foreground/70 capitalize">
                  {fingerprint.domain}
                </span>
              </>
            )}
          </div>
          
          <motion.h2 
            className="text-2xl font-light tracking-tight mb-1.5"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {fingerprint.name}
          </motion.h2>
          
          {fingerprint.description && (
            <motion.p 
              className="text-sm text-muted-foreground/70 leading-relaxed line-clamp-2"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {fingerprint.description}
            </motion.p>
          )}
        </div>
        
        <ActionButtons
          isEditing={isEditing}
          isSaving={isSaving}
          hasChanges={hasChanges}
          onEdit={onEdit}
          onSave={onSave}
          onCancel={onCancel}
          onClose={onClose}
        />
      </div>

      <ProgressBar completion={completion} />
    </div>

    {/* Tab Navigation */}
    <div className="flex border-b border-border/10 px-6 bg-gradient-to-b from-transparent to-muted/5">
      {TABS.map((tab, index) => (
        <motion.button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`relative px-5 py-3.5 text-sm transition-all duration-300 ${
            activeTab === tab.id
              ? 'text-foreground'
              : 'text-muted-foreground/50 hover:text-muted-foreground/80'
          }`}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + index * 0.05 }}
        >
          <div className="font-medium tracking-wide">{tab.label}</div>
          <div className="text-xs text-muted-foreground/40 font-light">{tab.subtitle}</div>
          
          {activeTab === tab.id && (
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/40 to-transparent"
              layoutId="activeTab"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          
          <motion.div 
            className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
            initial={{ scaleX: 0 }}
            whileHover={{ scaleX: activeTab === tab.id ? 0 : 1 }}
            transition={{ duration: 0.2 }}
          />
        </motion.button>
      ))}
    </div>

    {/* Tab Content - Scrollable */}
    <div 
      className="p-6 overflow-y-auto"
      style={{ 
        height: `calc(${modalSize.height}px - 200px)`,
        minHeight: '280px'
      }}
    >
      {children}
    </div>

    {/* Footer */}
    {fingerprint.created_at && (
      <motion.div 
        className="absolute bottom-0 left-0 right-0 px-6 py-3 border-t border-border/10 bg-background/95 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between text-xs text-muted-foreground/40">
          <div>
            DNA formed {new Date(fingerprint.created_at).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
          {fingerprint.intelligence_version && (
            <div>Intelligence v{fingerprint.intelligence_version}</div>
          )}
        </div>
      </motion.div>
    )}

    {/* Resize Handle */}
    <div
      onMouseDown={handleResizeStart}
      className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize group z-50"
      style={{ touchAction: 'none' }}
    >
      <div className="absolute bottom-2 right-2 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors">
        <GripVertical className="w-4 h-4 rotate-45" />
      </div>
      {/* Larger hit area */}
      <div className="absolute inset-0" />
    </div>
  </motion.div>
  )
}
