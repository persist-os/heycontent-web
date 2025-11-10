/**
 * MARKDOWN LAYOUT RENDERER
 * 
 * Generic markdown renderer for artifacts with layout: 'markdown'
 * Works with ANY artifact type that uses markdown layout
 * 
 * Design Spec: Neutral tones for document-style presentation
 */

'use client'

import React, { useState, useMemo } from 'react'
import { ArtifactMetadata } from '@/types/artifacts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Pencil, Eye, Check, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { ArtifactVersionSelector } from '../../ArtifactVersionSelector'
import { Id } from '@/convex/_generated/dataModel'

interface SectionDefinition {
  id: string
  title: string
  order: number
}

interface Section {
  id?: string
  title: string
  content?: string
  markdown?: string  // Actual Convex data uses 'markdown' field
}

interface MarkdownLayoutRendererProps {
  data_model: {
    layout: 'markdown'
    sections?: Array<SectionDefinition>
  }
  data: {
    markdown?: string
    sections?: Array<Section>
  }
  editable: boolean
  onUpdate?: (data: any) => void
  artifactType?: string
  metadata?: ArtifactMetadata
  editButton?: React.ReactNode
  artifactId?: Id<'artifacts'>
  selectedVersion?: number
  onVersionChange?: (version: number) => void
}

export function MarkdownLayoutRenderer({
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
}: MarkdownLayoutRendererProps) {
  // Defensive: ensure all required properties exist
  const rawSections = Array.isArray(data?.sections) ? data.sections : []
  const markdown = data?.markdown || ''
  const artifactMetadata = metadata || {
    version: 1,
    lastUpdatedBy: 'unknown',
    lastUpdatedAt: Date.now()
  }

  // Parse sections: handle both object array and string array formats
  // If sections is array of strings, parse markdown to extract content for each
  const sections = useMemo(() => {
    if (rawSections.length === 0) return []
    
    // Check if sections is array of strings (titles only)
    const isStringArray = rawSections.every((s: any) => typeof s === 'string')
    
    if (isStringArray && markdown) {
      // Parse markdown into sections based on headings
      const sectionTitles = rawSections as unknown as string[]
      const parsedSections: Array<{id: string, title: string, content: string}> = []
      
      // Split markdown by headings (###, ##, #)
      const headingRegex = /^(#{1,3})\s+(.+)$/gm
      const matches = Array.from(markdown.matchAll(headingRegex))
      
      for (let i = 0; i < sectionTitles.length; i++) {
        const title = sectionTitles[i]
        // Find matching heading in markdown
        const matchIndex = matches.findIndex(m => m[2].trim() === title.trim())
        
        if (matchIndex >= 0) {
          const startPos = matches[matchIndex].index! + matches[matchIndex][0].length
          const endPos = matches[matchIndex + 1]?.index || markdown.length
          const content = markdown.slice(startPos, endPos).trim()
          
          parsedSections.push({
            id: `section-${i}`,
            title: title,
            content: content
          })
        } else {
          // Fallback: create section with empty content
          parsedSections.push({
            id: `section-${i}`,
            title: title,
            content: ''
          })
        }
      }
      
      return parsedSections
    }
    
    // Already array of objects, return as-is
    return rawSections as Array<{id?: string, title?: string, content?: string, markdown?: string}>
  }, [rawSections, markdown])
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

    const newSections = sections.map(section => {
      if (section?.id === editingSectionId || (section as any)?.id === editingSectionId) {
        // Preserve existing field structure - use markdown if it existed, otherwise content
        const hasMarkdown = (section as any)?.markdown !== undefined
        return hasMarkdown 
          ? { ...section, markdown: editValue }
          : { ...section, content: editValue }
      }
      return section
    })

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

  // Extract title from markdown content if section title is missing
  const extractTitleFromMarkdown = (markdown: string | undefined): string | null => {
    if (!markdown) return null
    // Match first heading (###, ##, or #) - handle multiline with /m flag
    // Also handle headings that might have extra whitespace
    const headingMatch = markdown.match(/^#{1,3}\s+(.+?)(?:\n|$)/m)
    if (headingMatch) {
      return headingMatch[1].trim()
    }
    return null
  }

  // Get section title with fallback to extracted markdown heading
  const getSectionTitle = (section: any): string => {
    // Priority 1: Use explicit title field
    if (section?.title) return section.title
    
    // Priority 2: Extract from content field (check both content and markdown)
    const content = section?.content || section?.markdown || ''
    
    // Debug logging (remove after testing)
    if (!content && process.env.NODE_ENV === 'development') {
      console.log('Section has no content:', section)
    }
    
    const extractedTitle = extractTitleFromMarkdown(content)
    if (extractedTitle) return extractedTitle
    
    // Priority 3: Fallback
    return 'Untitled Section'
  }

  // Get artifact type display name
  const artifactTypeDisplay = artifactType || 'Report'

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/40 hover:bg-card/80 transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{artifactTypeDisplay}</span>
            {editable && !isEditing && (
              <Pencil className="w-3 h-3 text-muted-foreground/60" />
            )}
            {isEditing && (
              <Eye className="w-3 h-3 text-primary" />
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

      <CardContent className="space-y-6">
        {/* Sections view if provided */}
        {sections.length > 0 ? (
          sections.map((section, sectionIdx) => (
            <div key={section?.id || `section-${sectionIdx}`} className="space-y-2">
              <div className="flex items-center justify-between border-b border-border/20 pb-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {getSectionTitle(section)}
                </h3>
                {editable && editingSectionId !== (section?.id || `section-${sectionIdx}`) && !isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditSection(section?.id || `section-${sectionIdx}`, (section as any)?.markdown || section?.content || '')}
                    className="h-6 px-2 text-xs"
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
              
              {editingSectionId === (section?.id || `section-${sectionIdx}`) && isEditing ? (
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
                    <div className="prose prose-sm max-w-none break-words text-muted-foreground bg-muted/10 p-3 rounded-md">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                        {editValue}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                /* Display mode */
                <div className="prose prose-sm max-w-none break-words text-muted-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                    {(section as any)?.markdown || section?.content || ''}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          ))
        ) : markdown ? (
          /* Single markdown content */
          <div className="prose prose-sm max-w-none break-words text-muted-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
              {markdown}
            </ReactMarkdown>
          </div>
        ) : (
          /* Empty state */
          <div className="text-center py-8 text-sm text-muted-foreground">
            <p>No markdown content available</p>
          </div>
        )}

        {/* Metadata footer */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground/70 border-t border-border/20 pt-3 mt-4">
          <Badge variant="outline" className="text-xs">
            v{artifactMetadata.version}
          </Badge>
          <span>•</span>
          <span>Updated {formatDate(artifactMetadata.lastUpdatedAt)}</span>
          <span>•</span>
          <span>Source: {artifactMetadata.lastUpdatedBy}</span>
        </div>
      </CardContent>
    </Card>
  )
}

