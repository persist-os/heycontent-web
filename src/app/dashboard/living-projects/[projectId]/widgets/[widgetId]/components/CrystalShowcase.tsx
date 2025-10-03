/**
 * CRYSTAL SHOWCASE
 * 
 * Beautiful, expandable display of crystals with minimal technical details
 */

'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react'

interface Crystal {
  _id: string
  crystal_id: string
  name: string
  description?: string
  dimension: string
  crystal_type: string
  confidence_score?: number
  evidence_count?: number
  last_reinforced?: number
  shardIds?: string[]
}

interface CrystalShowcaseProps {
  crystals: Crystal[]
}

export function CrystalShowcase({ crystals }: CrystalShowcaseProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [showDetailsIds, setShowDetailsIds] = useState<Set<string>>(new Set())

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

  if (crystals.length === 0) {
    return null
  }

  const formatType = (type: string) => {
    return type.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-light text-foreground">
          Crystals
          <span className="text-muted-foreground ml-2 text-sm">
            {crystals.length}
          </span>
        </h3>
      </div>

      <div className="space-y-2">
        {crystals.map((crystal) => {
          const isExpanded = expandedIds.has(crystal._id)
          
          return (
            <Card
              key={crystal._id}
              className="border-border/30 hover:border-blue-400/40 transition-colors duration-300"
            >
              <button
                onClick={() => toggleExpand(crystal._id)}
                className="w-full text-left p-4 hover:bg-muted/20 transition-colors duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <h4 className="font-medium text-foreground">
                      {crystal.name}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatType(crystal.crystal_type)}</span>
                      <span className="text-muted-foreground/50">•</span>
                      <span className="text-blue-500/70">{crystal.dimension}</span>
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
                  {crystal.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {crystal.description}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {crystal.confidence_score && (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground/70">Confidence</div>
                        <div className="text-sm font-medium text-foreground">
                          {Math.round(crystal.confidence_score * 100)}%
                        </div>
                      </div>
                    )}
                    
                    {crystal.evidence_count && (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground/70">Evidence</div>
                        <div className="text-sm font-medium text-foreground">
                          {crystal.evidence_count} pieces
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Additional Details Toggle */}
                  <div className="pt-2">
                    <button
                      onClick={(e) => toggleDetails(crystal._id, e)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-300 flex items-center gap-1"
                    >
                      {showDetailsIds.has(crystal._id) ? (
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

                    {showDetailsIds.has(crystal._id) && (
                      <div className="mt-3 p-3 bg-muted/20 rounded border border-border/30 space-y-2">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <div className="text-muted-foreground/70">Crystal ID</div>
                            <div className="font-mono text-foreground/80 break-all">
                              {crystal.crystal_id}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-muted-foreground/70">Database ID</div>
                            <div className="font-mono text-foreground/80 break-all">
                              {crystal._id}
                            </div>
                          </div>

                          {crystal.last_reinforced && (
                            <div>
                              <div className="text-muted-foreground/70">Last Reinforced</div>
                              <div className="text-foreground/80">
                                {new Date(crystal.last_reinforced).toLocaleString()}
                              </div>
                            </div>
                          )}

                          {crystal.shardIds && crystal.shardIds.length > 0 && (
                            <div className="col-span-2">
                              <div className="text-muted-foreground/70">Shard IDs ({crystal.shardIds.length})</div>
                              <div className="font-mono text-foreground/80 text-[10px] break-all max-h-20 overflow-y-auto">
                                {crystal.shardIds.join(', ')}
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
      </div>
    </div>
  )
}

