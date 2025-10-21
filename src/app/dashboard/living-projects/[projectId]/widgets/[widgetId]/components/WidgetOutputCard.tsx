/**
 * WIDGET OUTPUT CARD COMPONENT
 * 
 * Displays a widget output with expandable prompts, note preview, and metadata
 */

'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { FileText, MessageSquare, Calendar, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
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

  return (
    <div className="border border-border/40 hover:border-border/60 transition-all duration-200 group">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-muted-foreground" />
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
                  </div>
                </div>
              </div>
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

            {/* Note Preview */}
            {hasNote && (
              <div className="p-4 bg-muted/10 rounded-xl border border-border/20">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
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
                      className="p-3 bg-muted/20 rounded-lg border border-border/20"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium text-muted-foreground bg-muted/40 px-2 py-1 rounded-full">
                          {prompt.priority}
                        </span>
                        <p className="text-sm text-foreground/80 font-light leading-relaxed">
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
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-foreground/80 mb-3">
                  <T context="widget.output_details">Output Details</T>
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span><T context="widget.output_id">Output ID:</T></span>
                    <span className="font-mono text-xs">{output.outputId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span><T context="widget.created">Created:</T></span>
                    <span>{new Date(output.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span><T context="widget.conversation_starters_count">Conversation Starters:</T></span>
                    <span>{promptCount}</span>
                  </div>
                  {hasNote && (
                    <div className="flex justify-between">
                      <span><T context="widget.generated_note_status">Generated Note:</T></span>
                      <span className="text-green-600 dark:text-green-400">✓ <T context="widget.created_status">Created</T></span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-foreground/80 mb-3">
                  <T context="widget.actions">Actions</T>
                </h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start rounded-xl"
                    onClick={onLaunchLab}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    <T context="button.open_thinking_lab">Open in Thinking Lab</T>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

