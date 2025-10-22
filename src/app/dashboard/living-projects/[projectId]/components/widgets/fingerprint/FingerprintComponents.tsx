/**
 * FINGERPRINT UI COMPONENTS
 * Reusable UI components for fingerprint display
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Pencil, Save, X } from 'lucide-react'
import { StatusConfig } from './fingerprintConfig'
import { T } from '@/components/translation/T'

interface StatusIndicatorProps {
  statusConfig: StatusConfig
  size?: 'sm' | 'md'
}

export const StatusIndicator = ({ statusConfig, size = 'md' }: StatusIndicatorProps) => {
  const sizeClass = size === 'sm' ? 'w-2 h-2' : 'w-2 h-2'
  
  return (
    <div className="relative">
      <motion.div 
        className={`${sizeClass} rounded-full ${statusConfig.color}`}
        animate={statusConfig.pulse ? { scale: [1, 1.2, 1] } : {}}
        transition={{ 
          duration: 2.5, 
          repeat: statusConfig.pulse ? Infinity : 0,
          ease: "easeInOut"
        }}
      />
      {statusConfig.pulse && (
        <div className={`absolute inset-0 ${sizeClass} rounded-full ${statusConfig.color} animate-ping opacity-30`} />
      )}
    </div>
  )
}

interface ActionButtonsProps {
  isEditing: boolean
  isSaving: boolean
  hasChanges: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onClose: () => void
}

export const ActionButtons = ({
  isEditing,
  isSaving,
  hasChanges,
  onEdit,
  onSave,
  onCancel,
  onClose
}: ActionButtonsProps) => {
  return (
    <div className="flex items-center gap-2">
      {!isEditing ? (
        <motion.button
          onClick={onEdit}
          className="flex items-center gap-1.5 text-muted-foreground/50 hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted/20 transition-all text-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <Pencil className="w-3.5 h-3.5" />
          <span className="text-xs font-medium"><T context="fingerprint.action.edit">Edit</T></span>
        </motion.button>
      ) : (
        <>
          <motion.button
            onClick={onSave}
            disabled={isSaving || !hasChanges}
            className="flex items-center gap-1.5 text-foreground bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: hasChanges ? 1.05 : 1 }}
            whileTap={{ scale: hasChanges ? 0.95 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Save className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{isSaving ? <T context="fingerprint.action.saving">Saving...</T> : <T context="fingerprint.action.save">Save</T>}</span>
          </motion.button>
          <motion.button
            onClick={onCancel}
            disabled={isSaving}
            className="flex items-center gap-1.5 text-muted-foreground/50 hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted/20 transition-all text-sm disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <X className="w-3.5 h-3.5" />
            <span className="text-xs font-medium"><T context="fingerprint.action.cancel">Cancel</T></span>
          </motion.button>
        </>
      )}
      
      <motion.button
        onClick={onClose}
        className="text-muted-foreground/40 hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-muted/20 transition-all text-sm"
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        ✕
      </motion.button>
    </div>
  )
}

interface ProgressBarProps {
  completion: number
}

export const ProgressBar = ({ completion }: ProgressBarProps) => {
  return (
    <motion.div 
      className="mt-4 flex items-center gap-3"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex-1 h-1 bg-muted/20 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-foreground/30 to-foreground/20 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${completion}%` }}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
        />
      </div>
      <motion.span 
        className="text-xs text-muted-foreground/50 tabular-nums font-light tracking-wider"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {completion}%
      </motion.span>
    </motion.div>
  )
}
