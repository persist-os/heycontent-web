/**
 * WIDGET OUTPUT CARD COMPONENT
 * 
 * Displays a widget output with expandable prompts and metadata
 */

'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  ExternalLink, 
  Lightbulb, 
  Hash, 
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
  const createdDate = new Date(output.createdAt)

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
                  {createdDate.toLocaleDateString()} at {createdDate.toLocaleTimeString()}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  <span>{output.prompts?.length || 0} prompts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  <code className="text-xs font-mono">{output.outputId.slice(0, 8)}</code>
                </div>
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
            {/* Note ID */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Note ID</h4>
              <div className="bg-muted/30 rounded p-3 break-all">
                <code className="text-xs text-foreground font-mono">
                  {output.noteId}
                </code>
              </div>
            </div>

            {/* Conversation Prompts */}
            {output.prompts && output.prompts.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-3">
                  Conversation Starters
                </h4>
                <div className="space-y-2">
                  {output.prompts.map((prompt, idx) => (
                    <div
                      key={idx}
                      className="bg-muted/30 rounded p-3 text-sm text-foreground/80"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xs text-muted-foreground font-medium mt-0.5">
                          {idx + 1}.
                        </span>
                        <span className="flex-1">{prompt.text}</span>
                        <Badge variant="outline" className="text-xs">
                          P{prompt.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Output ID */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Output ID</h4>
              <div className="bg-muted/30 rounded p-3 break-all">
                <code className="text-xs text-muted-foreground font-mono">
                  {output.outputId}
                </code>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

