/**
 * WIDGET DETAILS PANEL COMPONENT
 * 
 * Side panel for displaying detailed widget information with
 * actions and metadata.
 */

'use client'

import React from 'react'
import { X, Layers, Palette, Clock, Activity, Target, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WidgetConfig } from '@/types/projectWidgets'
import { getWidgetThemeClasses } from '../utils/widgetStyling'

interface WidgetDetailsPanelProps {
  widget: WidgetConfig | null
  isOpen: boolean
  onClose: () => void
}

/**
 * Widget details panel component for displaying comprehensive widget information
 */
export function WidgetDetailsPanel({ 
  widget, 
  isOpen, 
  onClose 
}: WidgetDetailsPanelProps) {
  if (!isOpen || !widget) return null

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'text-red-600 dark:text-red-400'
    if (priority >= 6) return 'text-orange-600 dark:text-orange-400'
    if (priority >= 4) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  const getPriorityLabel = (priority: number) => {
    if (priority >= 8) return 'Critical'
    if (priority >= 6) return 'High'
    if (priority >= 4) return 'Medium'
    return 'Low'
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-background/95 backdrop-blur-sm border-l border-border/50 shadow-xl z-30 transform transition-transform duration-300 ease-out">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getWidgetThemeClasses(widget.theme).includes('orange') ? 'bg-orange-400' : getWidgetThemeClasses(widget.theme).includes('blue') ? 'bg-blue-400' : getWidgetThemeClasses(widget.theme).includes('purple') ? 'bg-purple-400' : 'bg-slate-400'}`} />
            <h2 className="text-lg font-semibold text-foreground">{widget.title}</h2>
          </div>
          <button
            title="Close"
            onClick={onClose}
            className="p-2 hover:bg-muted/50 rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
            <p className="text-sm text-foreground leading-relaxed">{widget.description}</p>
          </div>

          {/* Widget Type & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Type</h3>
              <Badge variant="outline" className="text-xs">
                {widget.widget_type}
              </Badge>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Category</h3>
              <Badge variant="outline" className="text-xs">
                {widget.category}
              </Badge>
            </div>
          </div>

          {/* Priority */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Priority</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    widget.priority >= 8 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                    widget.priority >= 6 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                    widget.priority >= 4 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                    'bg-gradient-to-r from-green-500 to-green-600'
                  }`}
                  style={{ width: `${(widget.priority / 10) * 100}%` }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${getPriorityColor(widget.priority)}`}>
                  {getPriorityLabel(widget.priority)}
                </span>
                <span className="text-xs text-muted-foreground">({widget.priority}/10)</span>
              </div>
            </div>
          </div>

          {/* Size & Theme */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Size</h3>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground capitalize">{widget.size}</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Theme</h3>
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground capitalize">{widget.theme}</span>
              </div>
            </div>
          </div>

          {/* Update Frequency */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Update Frequency</h3>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground capitalize">{widget.update_frequency}</span>
            </div>
          </div>

          {/* Widget ID */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Widget ID</h3>
            <div className="bg-muted/30 rounded-md p-3">
              <code className="text-xs text-muted-foreground font-mono break-all">
                {widget.widget_id}
              </code>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-border/30">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Activity className="w-4 h-4 mr-2" />
                View Activity
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Target className="w-4 h-4 mr-2" />
                Configure Settings
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Updates
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border/30">
          <div className="text-xs text-muted-foreground/60 text-center">
            Widget created by AI • Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
}
