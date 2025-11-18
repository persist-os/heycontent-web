/**
 * CARDS LAYOUT RENDERER
 * 
 * Generic card grid renderer for artifacts with layout: 'cards'
 * Works with ANY artifact type that uses cards layout (not just structured_list)
 * 
 * Design Spec: border-primary/20, bg-primary/5 (blue tint)
 */

'use client'

import React from 'react'
import { FieldDefinition, ArtifactMetadata } from '@/types/artifacts'
import { Card, CardContent } from '@/components/ui/card'
import { ArtifactCardHeader } from '../shared/ArtifactCardHeader'
import { ArtifactCardFooter } from '../shared/ArtifactCardFooter'
import { Id } from '@/convex/_generated/dataModel'

interface CardsLayoutRendererProps {
  data_model: {
    layout: 'cards'
    fields: FieldDefinition[]
    groupBy?: string
    sortBy?: string
  }
  data: Array<Record<string, any>>
  editable: boolean
  onUpdate?: (data: any) => void
  artifactType?: string
  metadata?: ArtifactMetadata
  editButton?: React.ReactNode
  artifactId?: Id<'artifacts'>
  selectedVersion?: number
  onVersionChange?: (version: number) => void
}

export function CardsLayoutRenderer({
  data_model,
  data,
  editable = false,
  onUpdate,
  artifactType,
  metadata,
  editButton,
  artifactId,
  selectedVersion,
  onVersionChange
}: CardsLayoutRendererProps) {
  // Defensive: ensure all required properties exist
  const fields = Array.isArray(data_model?.fields) ? data_model.fields : []
  const cardsData = Array.isArray(data) ? data : []
  const artifactMetadata = metadata || {
    version: 1,
    lastUpdatedBy: 'unknown',
    lastUpdatedAt: Date.now()
  }

  // Handle field updates
  const handleFieldUpdate = (rowIndex: number, fieldKey: string, value: any) => {
    if (!onUpdate) return
    
    const newData = [...cardsData]
    newData[rowIndex] = { ...newData[rowIndex], [fieldKey]: value }
    onUpdate(newData)
  }

  // Get artifact type display name
  const artifactTypeDisplay = artifactType || 'Cards'

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-primary/20 hover:bg-card/80 transition-all duration-300">
      <ArtifactCardHeader
        artifactTypeDisplay={artifactTypeDisplay}
        editable={editable}
        editButton={editButton}
        artifactId={artifactId}
        selectedVersion={selectedVersion}
        onVersionChange={onVersionChange}
        metadata={artifactMetadata}
        icon={<div className="w-2 h-2 rounded-full bg-primary" />}
      />
      
      <CardContent>
        {cardsData.length === 0 ? (
          // Empty state
          <div className="text-center py-8 text-sm text-muted-foreground">
            <p>No structured data available</p>
            {fields.length === 0 && (
              <p className="text-xs mt-2">No fields defined for this card grid</p>
            )}
          </div>
        ) : (
          // Card Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cardsData.map((row, idx) => (
              <div
                key={`card-row-${idx}`}
                className="bg-muted/20 hover:bg-muted/30 rounded-lg p-4 border border-border/20 transition-all duration-200"
              >
                {fields.map((field, fieldIdx) => (
                  <div key={`${field?.key || `field-${fieldIdx}`}`} className="mb-2 last:mb-0">
                    <span className="text-xs text-muted-foreground">
                      {field?.label || field?.key || 'Field'}
                    </span>
                    <div className="mt-1">
                      <FieldEditor
                        value={row?.[field?.key || '']}
                        type={field?.type || 'text'}
                        options={field?.options}
                        editable={editable && (field?.editable ?? false)}
                        onSave={(value) => handleFieldUpdate(idx, field?.key || '', value)}
                        className="text-sm text-foreground"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <ArtifactCardFooter metadata={artifactMetadata} />
      </CardContent>
    </Card>
  )
}

