/**
 * REPORT LAYOUT
 * 
 * Renders report artifacts with markdown content.
 * Supports inline markdown editing when editable prop is true.
 * Design Spec: Neutral tones for document-style presentation
 */

'use client'

import React, { useState } from 'react'
import { ReportArtifact, LayoutProps } from '@/types/artifacts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, FileText, Check, X, Eye } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

export function ReportLayout({ 
  artifact,
  editable = false,
  onUpdate
}: LayoutProps<ReportArtifact>) {
  const { schema, data, metadata } = artifact
  const [isEditing, setIsEditing] = useState(false)
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // Format timestamp for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleEditSection = (sectionId: string, currentContent: string) => {
    setEditingSectionId(sectionId)
    setEditValue(currentContent)
    setIsEditing(true)
  }

  const handleSave = () => {
    if (!onUpdate || !editingSectionId) return

    const newSections = data.sections?.map(section =>
      section.id === editingSectionId
        ? { ...section, content: editValue }
        : section
    )

    onUpdate({ ...data, sections: newSections })
    setIsEditing(false)
    setEditingSectionId(null)
    setEditValue('')
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditingSectionId(null)
    setEditValue('')
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/40 hover:bg-card/80 transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Report</span>
            {editable && !isEditing && (
              <Pencil className="w-3 h-3 text-muted-foreground/60" />
            )}
            {isEditing && (
              <Eye className="w-3 h-3 text-primary" />
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            v{metadata.version}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Sections view if provided */}
        {data.sections && data.sections.length > 0 ? (
          data.sections.map((section) => (
            <div key={section.id} className="space-y-2">
              <div className="flex items-center justify-between border-b border-border/20 pb-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {section.title}
                </h3>
                {editable && editingSectionId !== section.id && !isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditSection(section.id, section.content)}
                    className="h-6 px-2 text-xs"
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
              
              {editingSectionId === section.id && isEditing ? (
                /* Editing mode */
                <div className="space-y-2">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full min-h-[200px] p-3 text-sm bg-primary/5 border border-primary/40 rounded-md ring-2 ring-primary/50 focus:outline-none font-mono resize-y"
                    placeholder="Enter markdown content..."
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSave}
                      className="h-7 px-3 text-xs"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      className="h-7 px-3 text-xs"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                  {/* Live preview */}
                  <div className="border-t border-border/20 pt-3">
                    <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                    <div className="prose prose-sm max-w-none text-muted-foreground bg-muted/10 p-3 rounded-md">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                        {editValue}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                /* Display mode */
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                    {section.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          ))
        ) : (
          /* Single markdown content */
          <div className="prose prose-sm max-w-none text-muted-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
              {data.markdown}
            </ReactMarkdown>
          </div>
        )}

        {/* Metadata footer */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground/70 border-t border-border/20 pt-3 mt-4">
          <Badge variant="outline" className="text-xs">
            v{metadata.version}
          </Badge>
          <span>•</span>
          <span>Updated {formatDate(metadata.lastUpdatedAt)}</span>
          <span>•</span>
          <span>Source: {metadata.lastUpdatedBy}</span>
        </div>
      </CardContent>
    </Card>
  )
}

