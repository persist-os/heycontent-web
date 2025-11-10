/**
 * TABLE LAYOUT RENDERER
 * 
 * Generic table renderer for artifacts with layout: 'table'
 * Works with ANY artifact type that uses table layout (not just structured_list)
 * 
 * Design Spec: border-primary/20, bg-primary/5 (blue tint)
 */

'use client'

import React from 'react'
import { FieldDefinition, ArtifactMetadata } from '@/types/artifacts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pencil } from 'lucide-react'
import { FieldEditor } from '../../editors/FieldEditor'
import { ArtifactVersionSelector } from '../../ArtifactVersionSelector'
import { Id } from '@/convex/_generated/dataModel'

interface TableLayoutRendererProps {
  data_model: {
    layout: 'table'
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

export function TableLayoutRenderer({
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
}: TableLayoutRendererProps) {
  // Defensive: ensure all required properties exist
  const fields = Array.isArray(data_model?.fields) ? data_model.fields : []
  const tableData = Array.isArray(data) ? data : []
  const artifactMetadata = metadata || {
    version: 1,
    lastUpdatedBy: 'unknown',
    lastUpdatedAt: Date.now()
  }

  // Infer fields from first data row if fields array is empty
  const effectiveFields = fields.length > 0 
    ? fields 
    : (tableData.length > 0 
        ? Object.keys(tableData[0]).map(key => ({
            key,
            name: key,  // Support both key and name
            type: 'text' as const,
            label: key,
            editable: false
          }))
        : [])

  // Helper to get field identifier (supports both 'name' and 'key')
  const getFieldId = (field: any) => {
    return (field as any)?.name || field?.key || ''
  }

  // Helper to get field display label
  const getFieldLabel = (field: any) => {
    return (field as any)?.label || (field as any)?.name || field?.key || 'Field'
  }

  // Handle field updates
  const handleFieldUpdate = (rowIndex: number, fieldId: string, value: any) => {
    if (!onUpdate) return
    
    const newData = [...tableData]
    newData[rowIndex] = { ...newData[rowIndex], [fieldId]: value }
    onUpdate(newData)
  }

  // Get artifact type display name
  const artifactTypeDisplay = artifactType || 'Table'

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-primary/20 hover:bg-card/80 transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-sm font-medium text-foreground">{artifactTypeDisplay}</span>
            {editable && (
              <Pencil className="w-3 h-3 text-primary/60" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {editButton}
            {artifactId && selectedVersion !== undefined && onVersionChange ? (
              <ArtifactVersionSelector
                artifactId={artifactId}
                currentVersion={selectedVersion}
                onVersionChange={onVersionChange}
              />
            ) : (
              <Badge variant="outline" className="text-xs">
                v{artifactMetadata.version}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {tableData.length === 0 ? (
          // Empty state
          <div className="text-center py-8 text-sm text-muted-foreground">
            <p>No structured data available</p>
            {effectiveFields.length === 0 && (
              <p className="text-xs mt-2">No fields defined for this table</p>
            )}
          </div>
        ) : (
          // Table View
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/20">
                  {effectiveFields.map((field, fieldIdx) => {
                    const fieldId = getFieldId(field)
                    return (
                      <th
                        key={`header-${fieldId || fieldIdx}`}
                        className="text-left text-sm font-medium text-muted-foreground px-4 py-3"
                      >
                        {getFieldLabel(field)}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, idx) => (
                  <tr
                    key={`table-row-${idx}`}
                    className="border-b border-border/10 last:border-0 even:bg-muted/5 hover:bg-muted/10 transition-colors"
                  >
                    {effectiveFields.map((field, fieldIdx) => {
                      const fieldId = getFieldId(field)
                      const cellValue = row?.[fieldId] ?? null
                      return (
                        <td key={`cell-${idx}-${fieldId || fieldIdx}`} className="px-4 py-3 text-sm text-foreground">
                          <FieldEditor
                            value={cellValue}
                            type={(field as any)?.type || field?.type || 'text'}
                            options={(field as any)?.options || field?.options}
                            editable={editable && ((field as any)?.editable ?? field?.editable ?? false)}
                            onSave={(value) => handleFieldUpdate(idx, fieldId, value)}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Metadata Footer */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground/70 border-t border-border/20 pt-3 mt-4">
          <span>Updated {new Date(artifactMetadata.lastUpdatedAt).toLocaleTimeString()}</span>
          <span>•</span>
          <span>Source: Widget {artifactMetadata.lastUpdatedBy.slice(-4)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

