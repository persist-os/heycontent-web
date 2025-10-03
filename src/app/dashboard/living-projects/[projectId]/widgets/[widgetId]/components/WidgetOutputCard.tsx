/**
 * WIDGET OUTPUT CARD COMPONENT
 * 
 * Displays a widget output with expandable prompts and metadata
 */

'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  ExternalLink, 
  Lightbulb, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react'
import type { WidgetOutput } from '../types'

interface WidgetOutputCardProps {
  output: WidgetOutput
  isExpanded: boolean
  onToggle: () => void
  onLaunchLab: () => void
}

export function WidgetOutputCard({ 
  output, 
  isExpanded, 
  onToggle, 
  onLaunchLab 
}: WidgetOutputCardProps) {
  const getRelativeTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const weeks = Math.floor(days / 7)
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)
    
    if (seconds < 60) return 'just now'
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
    if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`
    if (weeks < 4) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
    if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`
    return `${years} ${years === 1 ? 'year' : 'years'} ago`
  }

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardContent className="p-0">
        {/* Output Header */}
        <div className="p-6 border-b border-border/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">
                  {getRelativeTime(output.createdAt)}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lightbulb className="w-4 h-4" />
                <span>{output.prompts?.length || 0} conversation starters</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onLaunchLab}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Launch Lab
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={onToggle}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="p-6 space-y-4 bg-muted/20">
            {/* Conversation Prompts */}
            {output.prompts && output.prompts.length > 0 ? (
              <div className="space-y-2">
                {output.prompts.map((prompt, idx) => (
                  <div
                    key={idx}
                    className="bg-muted/30 rounded p-4 text-sm text-foreground leading-relaxed"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xs text-muted-foreground font-medium mt-0.5">
                        {idx + 1}.
                      </span>
                      <span className="flex-1">{prompt.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No conversation starters available
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

