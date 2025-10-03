/**
 * SHARD COLLECTION
 * 
 * Delicate, expandable display of shards - the building blocks of understanding
 */

'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { ChevronDown, ChevronUp, Quote } from 'lucide-react'

interface Shard {
  _id: string
  exact_quote?: string
  what_it_reveals?: string
  dimension?: string
  confidence_level?: string
  situation_context?: string
  why_significant?: string
  source_type?: string
}

interface ShardCollectionProps {
  shards: Shard[]
}

export function ShardCollection({ shards }: ShardCollectionProps) {
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

  if (shards.length === 0) {
    return null
  }

  const displayShards = showAll ? shards : shards.slice(0, 5)

  const getConfidenceColor = (level?: string) => {
    switch (level) {
      case 'high':
        return 'text-green-500/70'
      case 'medium':
        return 'text-yellow-500/70'
      case 'low':
        return 'text-muted-foreground/50'
      default:
        return 'text-muted-foreground/50'
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Quote className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-light text-foreground">
          Shards
          <span className="text-muted-foreground ml-2 text-sm">
            {shards.length}
          </span>
        </h3>
      </div>

      <div className="space-y-2">
        {displayShards.map((shard) => {
          const isExpanded = expandedIds.has(shard._id)
          
          return (
            <Card
              key={shard._id}
              className="border-border/30 hover:border-purple-400/40 transition-colors duration-300"
            >
              <button
                onClick={() => toggleExpand(shard._id)}
                className="w-full text-left p-4 hover:bg-muted/20 transition-colors duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    {shard.exact_quote && (
                      <p className="text-sm text-foreground/90 italic">
                        "{shard.exact_quote.slice(0, 120)}
                        {shard.exact_quote.length > 120 ? '...' : ''}"
                      </p>
                    )}
                    
                    {shard.what_it_reveals && !shard.exact_quote && (
                      <p className="text-sm text-foreground/90">
                        {shard.what_it_reveals.slice(0, 120)}
                        {shard.what_it_reveals.length > 120 ? '...' : ''}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-3 text-xs">
                      {shard.dimension && (
                        <span className="text-purple-500/70">{shard.dimension}</span>
                      )}
                      {shard.confidence_level && (
                        <>
                          <span className="text-muted-foreground/50">•</span>
                          <span className={getConfidenceColor(shard.confidence_level)}>
                            {shard.confidence_level} confidence
                          </span>
                        </>
                      )}
                    </div>
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
                  {shard.what_it_reveals && shard.exact_quote && (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground/70">What it reveals</div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {shard.what_it_reveals}
                      </p>
                    </div>
                  )}
                  
                  {shard.situation_context && (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground/70">Context</div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {shard.situation_context}
                      </p>
                    </div>
                  )}
                  
                  {shard.why_significant && (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground/70">Why it matters</div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {shard.why_significant}
                      </p>
                    </div>
                  )}

                  {/* Additional Details Toggle */}
                  <div className="pt-2">
                    <button
                      onClick={(e) => toggleDetails(shard._id, e)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-300 flex items-center gap-1"
                    >
                      {showDetailsIds.has(shard._id) ? (
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

                    {showDetailsIds.has(shard._id) && (
                      <div className="mt-3 p-3 bg-muted/20 rounded border border-border/30 space-y-2">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="col-span-2">
                            <div className="text-muted-foreground/70">Shard ID</div>
                            <div className="font-mono text-foreground/80 break-all">
                              {shard._id}
                            </div>
                          </div>

                          {shard.source_type && (
                            <div>
                              <div className="text-muted-foreground/70">Source Type</div>
                              <div className="text-foreground/80">
                                {shard.source_type}
                              </div>
                            </div>
                          )}

                          {shard.confidence_level && (
                            <div>
                              <div className="text-muted-foreground/70">Confidence Level</div>
                              <div className="text-foreground/80">
                                {shard.confidence_level}
                              </div>
                            </div>
                          )}

                          {(shard as any).extraction_timestamp && (
                            <div>
                              <div className="text-muted-foreground/70">Extracted</div>
                              <div className="text-foreground/80">
                                {new Date((shard as any).extraction_timestamp).toLocaleString()}
                              </div>
                            </div>
                          )}

                          {(shard as any).usage_count !== undefined && (
                            <div>
                              <div className="text-muted-foreground/70">Usage Count</div>
                              <div className="text-foreground/80">
                                {(shard as any).usage_count}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
        
        {shards.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
          >
            {showAll ? 'Show less' : `Show ${shards.length - 5} more`}
          </button>
        )}
      </div>
    </div>
  )
}

