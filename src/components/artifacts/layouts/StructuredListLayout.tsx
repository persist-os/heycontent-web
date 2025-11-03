/**
 * STRUCTURED LIST LAYOUT
 * 
 * Renders structured_list artifacts as tables or card grids.
 * Design Spec: border-primary/20, bg-primary/5 (blue tint)
 */

'use client'

import React from 'react'
import { StructuredListArtifact, LayoutProps } from '@/types/artifacts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FieldEditor } from '../editors/FieldEditor'
import { Pencil } from 'lucide-react'

export function StructuredListLayout({ 
  artifact,
  editable = false,
  onUpdate
}: LayoutProps<StructuredListArtifact>) {
  // Defensive: ensure all required properties exist
  const data_model = artifact?.data_model || { layout: 'table' as const, fields: [] }
  const fields = Array.isArray(data_model?.fields) ? data_model.fields : []
  const data = Array.isArray(artifact?.data) ? artifact.data : []
  const metadata = artifact?.metadata || {
    version: 1,
    lastUpdatedBy: 'unknown',
    lastUpdatedAt: Date.now()
  }

  // Handle field updates
  const handleFieldUpdate = (rowIndex: number, fieldKey: string, value: any) => {
    if (!onUpdate) return
    
    const newData = [...data]
    newData[rowIndex] = { ...newData[rowIndex], [fieldKey]: value }
    onUpdate(newData)
  }

  // Card view for mobile, table for desktop
  const isCardLayout = data_model?.layout === 'cards'

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-primary/20 hover:bg-card/80 transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-sm font-medium text-foreground">Structured List</span>
            {editable && (
              <Pencil className="w-3 h-3 text-primary/60" />
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            v{metadata.version}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {isCardLayout ? (
          // Card Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((row, idx) => (
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
        ) : (
          // Table View
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/20">
                  {fields.map((field, fieldIdx) => (
                    <th
                      key={`header-${field?.key || fieldIdx}`}
                      className="text-left text-sm font-medium text-muted-foreground px-4 py-3"
                    >
                      {field?.label || field?.key || 'Field'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr
                    key={`table-row-${idx}`}
                    className="border-b border-border/10 last:border-0 even:bg-muted/5 hover:bg-muted/10 transition-colors"
                  >
                    {fields.map((field, fieldIdx) => (
                      <td key={`cell-${idx}-${field?.key || fieldIdx}`} className="px-4 py-3 text-sm text-foreground">
                        <FieldEditor
                          value={row?.[field?.key || '']}
                          type={field?.type || 'text'}
                          options={field?.options}
                          editable={editable && (field?.editable ?? false)}
                          onSave={(value) => handleFieldUpdate(idx, field?.key || '', value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Metadata Footer */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground/70 border-t border-border/20 pt-3 mt-4">
          <span>Updated {new Date(metadata.lastUpdatedAt).toLocaleTimeString()}</span>
          <span>•</span>
          <span>Source: Widget {metadata.lastUpdatedBy.slice(-4)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

