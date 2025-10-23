/**
 * WIDGET OUTPUT CARD COMPONENT
 * 
 * Displays a widget output with expandable prompts, note preview, and metadata
 */

'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { FileText, MessageSquare, Calendar, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { ThumbRating } from '@/components/ui/thumb-rating'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { WidgetOutput } from '../types'
import { T, TButton } from '@/components/translation'

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
    
    if (seconds < 60) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(timestamp).toLocaleDateString()
  }

  const promptCount = output.prompts?.length || 0
  const hasNote = output.noteId
  
  // Mutation for rating the widget output
  const rateOutput = useMutation('widget_outputs:rateWidgetOutput')
  
  const handleRate = async (rating: 1 | 0, feedbackText?: string) => {
    try {
      await rateOutput({
        outputId: output.outputId,
        userId: output.userId,
        rating,
        feedbackText
      })
    } catch (error) {
      console.error('Failed to rate widget output:', error)
    }
  }

  return (
    <div className="
      bg-card/50 backdrop-blur-sm
      border border-border/40
      rounded-2xl
      hover:bg-card/80 hover:border-border/60 hover:shadow-lg hover:shadow-primary/5
      transition-all duration-300
      group
    ">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="
                  w-10 h-10 rounded-xl
                  bg-primary/10 backdrop-blur-sm
                  border border-primary/20
                  flex items-center justify-center
                  group-hover:bg-primary/15 group-hover:border-primary/30
                  transition-all duration-300
                ">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-light text-foreground">
                      {getRelativeTime(output.createdAt)}
                    </span>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(output.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>
                      <T context="widget.conversation_starters">
                        {promptCount} conversation {promptCount === 1 ? 'starter' : 'starters'}
                      </T>
                    </span>
                    {hasNote && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <T context="widget.generated_note">+ generated note</T>
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      <ThumbRating 
                        value={output.userRating} 
                        onRate={handleRate}
                        feedbackText={output.feedbackText}
                        disabled={output.userRating !== undefined}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={onLaunchLab}
                  className="
                    rounded-xl
                    bg-primary hover:bg-primary/90
                    transition-all duration-300
                  "
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  <T context="button.open_thinking_lab">Open in Thinking Lab</T>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onToggle}
                  className="rounded-xl"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Note Preview */}
            {hasNote && (
              <div className="
                p-4
                bg-accent/5 backdrop-blur-sm
                border border-accent/20
                rounded-xl
                hover:bg-accent/10 hover:border-accent/30
                transition-all duration-300
              ">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent" />
                  <h4 className="text-sm font-medium text-foreground">
                    <T context="widget.note_title">{output.noteTitle || "Generated Note"}</T>
                  </h4>
                </div>
              </div>
            )}

            {/* Prompts Preview */}
            {promptCount > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground/80">
                  <T context="widget.conversation_starters_title">Conversation Starters</T>
                </h4>
                <div className="space-y-2">
                  {output.prompts.slice(0, isExpanded ? output.prompts.length : 2).map((prompt, idx) => (
                    <div
                      key={idx}
                      className="
                        p-3
                        bg-muted/20 backdrop-blur-sm
                        border border-border/20
                        rounded-lg
                        hover:bg-muted/30 hover:border-border/40
                        transition-all duration-200
                      "
                    >
                      <div className="flex items-start gap-2">
                        <span className="
                          text-xs font-medium text-muted-foreground
                          bg-primary/10 border border-primary/20
                          px-2 py-1 rounded-full
                        ">
                          {prompt.priority}
                        </span>
                        <p className="text-sm text-foreground font-light leading-relaxed">
                          {prompt.text}
                        </p>
                      </div>
                    </div>
                  ))}
                  {!isExpanded && promptCount > 2 && (
                    <div className="text-xs text-muted-foreground/60 text-center py-2">
                      <T context="widget.more_starters">+{promptCount - 2} more starters</T>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-6 pt-6 border-t border-border/20">
            <div className="
              bg-muted/10 backdrop-blur-sm
              border border-border/20
              rounded-xl p-4
            ">
              <h4 className="text-sm font-medium text-foreground mb-3">
                <T context="widget.output_details">Output Details</T>
              </h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span><T context="widget.output_id">Output ID:</T></span>
                  <span className="font-mono text-xs text-foreground">{output.outputId}</span>
                </div>
                <div className="flex justify-between">
                  <span><T context="widget.created">Created:</T></span>
                  <span className="text-foreground">{new Date(output.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span><T context="widget.conversation_starters_count">Conversation Starters:</T></span>
                  <span className="text-foreground">{promptCount}</span>
                </div>
                {hasNote && (
                  <div className="flex justify-between">
                    <span><T context="widget.generated_note_status">Generated Note:</T></span>
                    <span className="text-green-600 dark:text-green-400">✓ <T context="widget.created_status">Created</T></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

