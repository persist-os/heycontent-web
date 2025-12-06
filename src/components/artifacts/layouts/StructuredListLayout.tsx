/**
 * STRUCTURED LIST LAYOUT
 * 
 * Renders structured_list artifacts as tables or card grids.
 * Design Spec: border-primary/20, bg-primary/5 (blue tint)
 */

'use client'

import React from 'react'
import { StructuredListArtifact, LayoutProps, ArtifactAction, ArtifactLink } from '@/types/artifacts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { UniversalArtifactActionBar } from '../UniversalArtifactActionBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FieldEditor } from '../editors/FieldEditor'
import { Pencil, MapPin, Phone, Mail, ExternalLink, Copy } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

export function StructuredListLayout({ 
  artifact,
  editable = false,
  onUpdate,
  editButton
}: LayoutProps<StructuredListArtifact>) {
  // Defensive: ensure all required properties exist
  const data_model = artifact?.data_model || { layout: 'table' as const, fields: [] }
  const fields = Array.isArray(data_model?.fields) ? data_model.fields : []
  const rawData = artifact?.data
  
  // Handle markdown content fallback: if data is an object with 'content', render as markdown
  const hasMarkdownContent = rawData && typeof rawData === 'object' && !Array.isArray(rawData) && 'content' in rawData && typeof (rawData as any).content === 'string'
  const markdownContent = hasMarkdownContent ? (rawData as any).content : null
  
  // Normal structured list data (array of rows)
  const data = Array.isArray(rawData) ? rawData : []
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

  // Helper: Get action icon
  const getActionIcon = (actionType: ArtifactAction['type']) => {
    switch (actionType) {
      case 'get_directions': return <MapPin className="w-4 h-4" />
      case 'call': return <Phone className="w-4 h-4" />
      case 'email': return <Mail className="w-4 h-4" />
      case 'open_url': return <ExternalLink className="w-4 h-4" />
      case 'copy_to_clipboard': return <Copy className="w-4 h-4" />
      default: return null
    }
  }

  // Helper: Get action label
  const getActionLabel = (action: ArtifactAction) => {
    if (action.label) return action.label
    switch (action.type) {
      case 'get_directions': return 'Get Directions'
      case 'call': return 'Call'
      case 'email': return 'Email'
      case 'open_url': return 'Open'
      case 'copy_to_clipboard': return 'Copy'
      default: return 'Action'
    }
  }

  // Helper: Get action variant (semantic colors)
  const getActionVariant = (actionType: ArtifactAction['type']): "default" | "secondary" | "outline" => {
    switch (actionType) {
      case 'get_directions': return 'default'  // Primary (blue)
      case 'call': return 'secondary'  // Secondary (muted)
      case 'email': return 'secondary'  // Secondary (muted)
      case 'open_url': return 'outline'  // Outline
      case 'copy_to_clipboard': return 'outline'  // Outline
      default: return 'outline'
    }
  }

  // Helper: Handle action click
  const handleActionClick = (action: ArtifactAction) => {
    if (action.type === 'copy_to_clipboard') {
      navigator.clipboard.writeText(action.url).catch(console.error)
    } else {
      window.open(action.url, '_blank', 'noopener,noreferrer')
    }
  }

  // Helper: Render actions and links for a row
  const renderActionsAndLinks = (row: any) => {
    const actions: ArtifactAction[] = Array.isArray(row?.actions) ? row.actions : []
    const links: ArtifactLink[] = Array.isArray(row?.links) ? row.links : []

    if (actions.length === 0 && links.length === 0) return null

    return (
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border/10">
        {/* Actions as buttons */}
        {actions.map((action, actionIdx) => (
          <Button
            key={`action-${actionIdx}`}
            variant={getActionVariant(action.type)}
            size="sm"
            onClick={() => handleActionClick(action)}
            className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
          >
            {getActionIcon(action.type)}
            <span className="ml-1">{getActionLabel(action)}</span>
          </Button>
        ))}
        {/* Links as clickable text */}
        {links.map((link, linkIdx) => (
          <a
            key={`link-${linkIdx}`}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline min-h-[44px] flex items-center"
          >
            {link.label}
          </a>
        ))}
      </div>
    )
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-primary/20 hover:bg-card/80 transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-sm font-medium text-foreground">Structured List</span>
            {editable && (
              <Pencil className="w-3 h-3 text-primary/60" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {editButton}
            <Badge variant="outline" className="text-xs">
              v{metadata.version}
            </Badge>
          </div>
        </div>
        {/* Action Bar - Integrated in CardHeader */}
        <UniversalArtifactActionBar artifact={artifact} />
      </CardHeader>
      
      <CardContent>
        {/* Markdown content fallback: render if data is an object with content */}
        {hasMarkdownContent && markdownContent ? (
          <div className="prose prose-sm max-w-none break-words text-muted-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
              {markdownContent}
            </ReactMarkdown>
          </div>
        ) : data.length === 0 ? (
          // Empty state: no data and no markdown content
          <div className="text-center py-8 text-sm text-muted-foreground">
            <p>No structured data available</p>
            {fields.length === 0 && (
              <p className="text-xs mt-2">No fields defined for this structured list</p>
            )}
          </div>
        ) : isCardLayout ? (
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
                {/* Render actions and links */}
                {renderActionsAndLinks(row)}
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
                  {/* Actions column header (if any row has actions/links) */}
                  {(data.some(r => (r?.actions && r.actions.length > 0) || (r?.links && r.links.length > 0))) && (
                    <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">
                      Actions
                    </th>
                  )}
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
                    {/* Actions/Links column (if any row has actions/links) */}
                    {(data.some(r => (r?.actions && r.actions.length > 0) || (r?.links && r.links.length > 0))) && (
                      <td key={`actions-${idx}`} className="px-4 py-3">
                        {renderActionsAndLinks(row)}
                      </td>
                    )}
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

