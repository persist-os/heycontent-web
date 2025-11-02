/**
 * BUDGET INDICATOR COMPONENT
 * 
 * LLM call budget display for project execution tracking.
 * 
 * Design:
 * - Shows as "AI Budget" meter
 * - Color-coded progress bar (green → yellow → red)
 * - Clean, minimalist display
 * - No emojis, no icons
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface BudgetIndicatorProps {
  budgetUsed: number
  budgetTotal: number
  onEditBudget?: () => void
}

export function BudgetIndicator({
  budgetUsed,
  budgetTotal,
  onEditBudget
}: BudgetIndicatorProps) {
  // Calculate usage percentage
  const percentage = budgetTotal > 0 ? (budgetUsed / budgetTotal) * 100 : 0
  
  // Color coding based on usage
  const isLow = percentage < 50        // Green (0-50%)
  const isWarning = percentage >= 80   // Red (80%+)
  const isMedium = !isLow && !isWarning // Yellow (50-80%)
  
  const barColor = isWarning
    ? 'bg-gradient-to-r from-red-500 to-red-400'
    : isMedium
    ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
    : 'bg-gradient-to-r from-primary to-blue-400'

  return (
    <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg min-w-[200px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-foreground">AI Budget</span>
        
        {onEditBudget && (
          <button
            onClick={onEditBudget}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Edit
          </button>
        )}
      </div>
      
      {/* Usage Counter */}
      <div className="text-sm text-foreground font-mono mb-2">
        {budgetUsed} / {budgetTotal} calls
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
        <div 
          className={cn("h-2 rounded-full transition-all duration-500", barColor)}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      {/* Status Messages - No emojis */}
      {isWarning && (
        <div className="text-xs text-red-400 mt-2">
          Running low - {Math.round(percentage)}% used
        </div>
      )}
      
      {isLow && budgetUsed > 0 && (
        <div className="text-xs text-primary mt-2">
          Efficient - Only {budgetUsed} calls used
        </div>
      )}
      
      {isMedium && (
        <div className="text-xs text-yellow-400 mt-2">
          {Math.round(100 - percentage)}% remaining
        </div>
      )}
    </div>
  )
}

