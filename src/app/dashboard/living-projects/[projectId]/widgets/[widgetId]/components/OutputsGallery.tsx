/**
 * OUTPUTS GALLERY
 * 
 * Streamlined display of widget outputs with minimal technical clutter
 */

'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Sparkles, FileText } from 'lucide-react'
import type { WidgetOutput } from '../types'

interface OutputsGalleryProps {
  outputs: WidgetOutput[]
  onLaunchLab: (output: WidgetOutput) => void
}

export function OutputsGallery({ outputs, onLaunchLab }: OutputsGalleryProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [showDetailsIds, setShowDetailsIds] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  const toggleDetails = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newDetails = new Set(showDetailsIds)
    if (newDetails.has(id)) {
      newDetails.delete(id)
    } else {
      newDetails.add(id)
    }
    setShowDetailsIds(newDetails)
  }

  if (outputs.length === 0) {
    return (
      <Card className="border-border/30 p-12 text-center">
        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          No outputs yet
        </h3>
        <p className="text-sm text-muted-foreground">
          Run this widget to generate your first output
        </p>
      </Card>
    )
  }

  const displayOutputs = showAll ? outputs : outputs.slice(0, 10)

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-light text-foreground">
          Outputs
          <span className="text-muted-foreground ml-2 text-sm">
            {outputs.length}
          </span>
        </h3>
      </div>

      <div className="space-y-2">
        {displayOutputs.map((output) => {
          const isExpanded = expandedIds.has(output.outputId)
          const promptCount = output.prompts?.length || 0
          
          return (
            <Card
              key={output.outputId}
              className="border-border/30 hover:border-amber-400/40 transition-colors duration-300"
            >
              <button
                onClick={() => toggleExpand(output.outputId)}
                className="w-full text-left p-4 hover:bg-muted/20 transition-colors duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatDate(output.createdAt)}</span>
                      <span className="text-muted-foreground/50">•</span>
                      <span>{promptCount} prompts</span>
                    </div>
                    
                    {output.prompts?.[0] && (
                      <p className="text-sm text-foreground/90 mt-2">
                        {output.prompts[0].text.slice(0, 150)}
                        {output.prompts[0].text.length > 150 ? '...' : ''}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-muted-foreground">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-border/20 pt-3">
                  {output.prompts && output.prompts.length > 1 && (
                    <div className="space-y-2">
                      {output.prompts.slice(1).map((prompt, idx) => (
                        <div key={idx} className="pl-3 border-l-2 border-amber-400/30">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {prompt.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Button
                    onClick={() => onLaunchLab(output)}
                    variant="ghost"
                    size="sm"
                    className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                  >
                    Open in Thinking Lab →
                  </Button>

                  {/* Additional Details Toggle */}
                  <div className="pt-2">
                    <button
                      onClick={(e) => toggleDetails(output.outputId, e)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-300 flex items-center gap-1"
                    >
                      {showDetailsIds.has(output.outputId) ? (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          Hide technical details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          Show technical details
                        </>
                      )}
                    </button>

                    {showDetailsIds.has(output.outputId) && (
                      <div className="mt-3 p-3 bg-muted/20 rounded border border-border/30 space-y-2">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="col-span-2">
                            <div className="text-muted-foreground/70">Output ID</div>
                            <div className="font-mono text-foreground/80 break-all">
                              {output.outputId}
                            </div>
                          </div>

                          <div className="col-span-2">
                            <div className="text-muted-foreground/70">Database ID</div>
                            <div className="font-mono text-foreground/80 break-all">
                              {output._id}
                            </div>
                          </div>

                          <div className="col-span-2">
                            <div className="text-muted-foreground/70">Widget ID</div>
                            <div className="font-mono text-foreground/80 break-all text-[10px]">
                              {output.widgetId}
                            </div>
                          </div>

                          <div className="col-span-2">
                            <div className="text-muted-foreground/70">Note ID</div>
                            <div className="font-mono text-foreground/80 break-all text-[10px]">
                              {output.noteId}
                            </div>
                          </div>

                          <div className="col-span-2">
                            <div className="text-muted-foreground/70">Project ID</div>
                            <div className="font-mono text-foreground/80 break-all text-[10px]">
                              {output.projectId}
                            </div>
                          </div>

                          <div>
                            <div className="text-muted-foreground/70">User ID</div>
                            <div className="font-mono text-foreground/80 break-all text-[10px]">
                              {output.userId}
                            </div>
                          </div>

                          <div>
                            <div className="text-muted-foreground/70">Created</div>
                            <div className="text-foreground/80">
                              {new Date(output.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
        
        {outputs.length > 10 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
          >
            {showAll ? 'Show less' : `Show ${outputs.length - 10} more`}
          </button>
        )}
      </div>
    </div>
  )
}

