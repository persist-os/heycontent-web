/**
 * WIDGET PROPERTIES CARD COMPONENT
 * 
 * Displays widget properties like priority, category, size, theme, etc.
 */

'use client'

import React from 'react'
import { BaseCard } from '@/components/ui/base-card'
import { Badge } from '@/components/ui/badge'
import { Target, Layers, Palette, Clock } from 'lucide-react'
import { getPriorityColor, getPriorityLabel, getPriorityGradient } from '../utils'
import type { WidgetConfig } from '@/types/projectWidgets'

interface WidgetPropertiesCardProps {
  widget: WidgetConfig
}

export function WidgetPropertiesCard({ widget }: WidgetPropertiesCardProps) {
  return (
    <BaseCard
      variant="widget-properties"
      title="Properties"
    >
      <div className="space-y-3">
        {/* Priority */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Priority</span>
            <span className={`text-sm font-medium ${getPriorityColor(widget.priority)}`}>
              {getPriorityLabel(widget.priority)} ({widget.priority}/10)
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden relative">
            <div 
              className={`absolute inset-0 rounded-full transition-all duration-500 ${getPriorityGradient(widget.priority)}`}
              data-priority={widget.priority}
            >
              <div className={`h-full ${
                widget.priority === 10 ? 'w-full' :
                widget.priority === 9 ? 'w-[90%]' :
                widget.priority === 8 ? 'w-4/5' :
                widget.priority === 7 ? 'w-[70%]' :
                widget.priority === 6 ? 'w-3/5' :
                widget.priority === 5 ? 'w-1/2' :
                widget.priority === 4 ? 'w-2/5' :
                widget.priority === 3 ? 'w-[30%]' :
                widget.priority === 2 ? 'w-1/5' :
                widget.priority === 1 ? 'w-[10%]' :
                'w-0'
              }`} />
            </div>
          </div>
        </div>

        {/* Category */}
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Category:</span>
          <Badge variant="outline" className="text-xs">{widget.category}</Badge>
        </div>

        {/* Size */}
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Size:</span>
          <span className="text-sm text-foreground capitalize">{widget.size}</span>
        </div>

        {/* Theme */}
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Theme:</span>
          <span className="text-sm text-foreground capitalize">{widget.theme}</span>
        </div>

        {/* Update Frequency */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Updates:</span>
          <span className="text-sm text-foreground capitalize">{widget.update_frequency}</span>
        </div>
      </div>
    </BaseCard>
  )
}

