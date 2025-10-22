/**
 * COLLAPSED VIEW
 * Compact, draggable panel view with minimal information
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { CollapsedViewProps } from '@/app/dashboard/living-projects/types/unifiedDetailsPanel'
import { getItemTitle, getItemSubtitle } from './panelConfig'
import { T } from '@/components/translation/T'

export const CollapsedView = ({ instance, config, onExpand }: CollapsedViewProps) => {
  const Icon = config.icon
  const title = getItemTitle(instance.item, instance.itemType)
  const subtitle = getItemSubtitle(instance.item, instance.itemType)

  return (
    <motion.div
      drag
      dragMomentum={false}
      whileTap={{ scale: 0.97, cursor: 'grabbing' }}
      whileHover={{ scale: 1.02, y: -1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="cursor-grab fixed z-40"
      style={{
        left: instance.position.x,
        top: instance.position.y,
        width: instance.size.width,
        height: instance.size.height
      }}
      onDragEnd={(_, info) => {
        // Update position after drag (handled by parent via updateInstance)
      }}
    >
      <button
        onClick={onExpand}
        className={`
          group relative w-full h-full
          bg-background/80 backdrop-blur-md rounded-xl
          px-4 py-3 hover:bg-background/95
          transition-all duration-300
          border border-border/20 hover:border-border/40
          shadow-sm hover:shadow-md
          cursor-pointer
        `}
        title="Click to expand"
      >
        <div className="flex items-center gap-3">
          {/* Icon with pulse indicator if pinned */}
          <div className="relative">
            <div className={`
              p-2 rounded-lg ${config.accentColor}
              transition-transform duration-300
              group-hover:scale-110
            `}>
              <Icon className={`w-4 h-4 ${config.iconColor}`} />
            </div>
            
            {instance.isPinned && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            )}
          </div>

          {/* Title and subtitle */}
          <div className="flex-1 text-left min-w-0">
            <motion.div
              className="text-sm font-medium truncate"
              initial={false}
              animate={{ opacity: [1, 0.85, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              {title}
            </motion.div>
            <div className="text-xs text-muted-foreground/60 font-light tracking-wide truncate">
              <T context={`panel.collapsed.${instance.itemType}`}>{subtitle}</T>
            </div>
          </div>
        </div>

        {/* Hover gradient effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-foreground/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </button>
    </motion.div>
  )
}

