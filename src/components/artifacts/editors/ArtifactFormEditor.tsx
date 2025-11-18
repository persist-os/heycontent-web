/**
 * ARTIFACT FORM EDITOR
 * 
 * Form-based editor for artifacts (not JSON!)
 * Renders appropriate form fields based on artifact layout type
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Artifact } from '@/types/artifacts'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Plus, Trash2, ChevronDown, Code } from 'lucide-react'

interface ArtifactFormEditorProps {
  artifact: Artifact
  onSave: (data: any) => Promise<{ success: boolean; error?: string }>
  onCancel: () => void
  isSaving: boolean
  formData: any
  setFormData: React.Dispatch<React.SetStateAction<any>>
}

export function ArtifactFormEditor({
  artifact,
  onSave,
  onCancel,
  isSaving,
  formData,
  setFormData
}: ArtifactFormEditorProps) {
  const layout = artifact.data_model?.layout || artifact.type
  const [error, setError] = useState<string | null>(null)
  const [showJson, setShowJson] = useState(false)

  // Format JSON for display (recompute on formData changes)
  const jsonString = JSON.stringify(formData, null, 2)

  // Render JSON view component (reusable across all layouts)
  // Must be defined before any early returns
  const renderJsonView = React.useCallback(() => (
    <Collapsible open={showJson} onOpenChange={setShowJson} className="mt-4 w-full">
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between min-h-[44px]"
          aria-label="Toggle JSON view"
        >
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            <span>View JSON (Read-only)</span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${showJson ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 p-2 md:p-4 bg-muted/30 rounded-lg border border-border/20 w-full max-w-full overflow-hidden">
          <pre className="text-xs md:text-sm font-mono max-h-[300px] overflow-y-auto break-all whitespace-pre-wrap overflow-wrap-anywhere">
            {jsonString}
          </pre>
        </div>
      </CollapsibleContent>
    </Collapsible>
  ), [showJson, jsonString])

  const updateField = (path: string[], value: any) => {
    setFormData((prev: any) => {
      const newData = { ...prev }
      let current = newData
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {}
        }
        current = current[path[i]]
      }
      current[path[path.length - 1]] = value
      return newData
    })
  }

  const addArrayItem = (arrayPath: string[], template: any) => {
    setFormData((prev: any) => {
      const newData = { ...prev }
      let current = newData
      for (let i = 0; i < arrayPath.length - 1; i++) {
        current = current[arrayPath[i]]
      }
      const array = current[arrayPath[arrayPath.length - 1]] || []
      array.push({ ...template, id: `new-${Date.now()}` })
      current[arrayPath[arrayPath.length - 1]] = array
      return newData
    })
  }

  const removeArrayItem = (arrayPath: string[], index: number) => {
    setFormData((prev: any) => {
      const newData = { ...prev }
      let current = newData
      for (let i = 0; i < arrayPath.length - 1; i++) {
        current = current[arrayPath[i]]
      }
      const array = [...(current[arrayPath[arrayPath.length - 1]] || [])]
      array.splice(index, 1)
      current[arrayPath[arrayPath.length - 1]] = array
      return newData
    })
  }

  // Render based on layout type
  if (layout === 'table' || layout === 'cards') {
    // Structured list / table editor
    const dataModel = artifact.data_model as any
    const fields = dataModel?.fields || []
    const rows = Array.isArray(formData) ? formData : []
    
    return (
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {rows.map((row: any, rowIdx: number) => (
            <div key={rowIdx} className="p-4 border border-border/20 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Row {rowIdx + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeArrayItem([], rowIdx)}
                  className="min-h-[44px] min-w-[44px] px-3 text-sm md:text-xs"
                  aria-label={`Delete row ${rowIdx + 1}`}
                >
                  <Trash2 className="w-4 h-4 md:w-3 md:h-3" />
                </Button>
              </div>
              
              {fields.map((field: any) => {
                const fieldKey = field.key || field.id
                const value = row[fieldKey] || ''
                
                return (
                  <div key={fieldKey} className="space-y-1">
                    <Label className="text-xs">{field.label || fieldKey}</Label>
                    {field.type === 'select' ? (
                      <Select
                        value={value}
                        onValueChange={(val) => updateField([rowIdx.toString(), fieldKey], val)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(field.options || []).map((opt: string) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.type === 'number' ? (
                      <Input
                        type="number"
                        value={value}
                        onChange={(e) => updateField([rowIdx.toString(), fieldKey], e.target.value)}
                      />
                    ) : (
                      <Input
                        value={value}
                        onChange={(e) => updateField([rowIdx.toString(), fieldKey], e.target.value)}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const template: any = {}
              fields.forEach((field: any) => {
                template[field.key || field.id] = ''
              })
              addArrayItem([], template)
            }}
            className="w-full min-h-[44px]"
            aria-label="Add new row"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Row
          </Button>
        </div>
        
        {renderJsonView()}
      </div>
    )
  }

  if (layout === 'timeline') {
    // Timeline editor
    const events = formData.events || []
    
    return (
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {events.map((event: any, idx: number) => (
            <div key={idx} className="p-4 border border-border/20 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Event {idx + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeArrayItem(['events'], idx)}
                  className="min-h-[44px] min-w-[44px] px-3 text-sm md:text-xs"
                  aria-label={`Delete event ${idx + 1}`}
                >
                  <Trash2 className="w-4 h-4 md:w-3 md:h-3" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Title</Label>
                <Input
                  value={event.title || ''}
                  onChange={(e) => updateField(['events', idx.toString(), 'title'], e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={event.description || ''}
                  onChange={(e) => updateField(['events', idx.toString(), 'description'], e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Type</Label>
                <Input
                  value={event.type || ''}
                  onChange={(e) => updateField(['events', idx.toString(), 'type'], e.target.value)}
                />
              </div>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={() => addArrayItem(['events'], {
              id: `event-${Date.now()}`,
              timestamp: Date.now(),
              type: '',
              title: '',
              description: ''
            })}
            className="w-full min-h-[44px]"
            aria-label="Add new event"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>
        
        {renderJsonView()}
      </div>
    )
  }

  if (layout === 'markdown') {
    // Markdown editor
    const markdown = formData.markdown || ''
    const sections = formData.sections || []
    
    return (
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        
        {markdown !== undefined ? (
          <div className="space-y-2">
            <Label>Markdown Content</Label>
            <Textarea
              value={markdown}
              onChange={(e) => updateField(['markdown'], e.target.value)}
              rows={15}
              className="font-mono text-sm"
            />
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {sections.map((section: any, idx: number) => (
              <div key={idx} className="p-4 border border-border/20 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">{section.title || `Section ${idx + 1}`}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArrayItem(['sections'], idx)}
                    className="min-h-[44px] min-w-[44px] px-3 text-sm md:text-xs"
                    aria-label={`Delete section ${idx + 1}`}
                  >
                    <Trash2 className="w-4 h-4 md:w-3 md:h-3" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={section.title || ''}
                    onChange={(e) => updateField(['sections', idx.toString(), 'title'], e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Content</Label>
                  <Textarea
                    value={section.content || section.markdown || ''}
                    onChange={(e) => updateField(['sections', idx.toString(), section.markdown !== undefined ? 'markdown' : 'content'], e.target.value)}
                    rows={5}
                  />
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={() => addArrayItem(['sections'], {
                id: `section-${Date.now()}`,
                title: '',
                content: ''
              })}
              className="w-full min-h-[44px]"
              aria-label="Add new section"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>
          </div>
        )}
        
        {renderJsonView()}
      </div>
    )
  }

  if (layout === 'insights') {
    // Insights editor
    const insights = formData.insights || []
    
    return (
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {insights.map((insight: any, idx: number) => (
            <div key={idx} className="p-4 border border-border/20 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Insight {idx + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeArrayItem(['insights'], idx)}
                  className="min-h-[44px] min-w-[44px] px-3 text-sm md:text-xs"
                  aria-label={`Delete insight ${idx + 1}`}
                >
                  <Trash2 className="w-4 h-4 md:w-3 md:h-3" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Title</Label>
                <Input
                  value={insight.title || ''}
                  onChange={(e) => updateField(['insights', idx.toString(), 'title'], e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={insight.description || ''}
                  onChange={(e) => updateField(['insights', idx.toString(), 'description'], e.target.value)}
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Impact</Label>
                <Select
                  value={insight.impact || 'medium'}
                  onValueChange={(val) => updateField(['insights', idx.toString(), 'impact'], val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={() => addArrayItem(['insights'], {
              id: `insight-${Date.now()}`,
              title: '',
              description: '',
              impact: 'medium'
            })}
            className="w-full min-h-[44px]"
            aria-label="Add new insight"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Insight
          </Button>
        </div>
        
        {renderJsonView()}
      </div>
    )
  }

  if (layout === 'card') {
    // Card layout editor (summary artifacts)
    const dataModel = artifact.data_model as any
    const metrics = dataModel?.metrics || []
    const keyMetrics = formData.keyMetrics || {}
    
    return (
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Metric values editor */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Metric Values</h3>
            {metrics.map((metric: any) => {
              const metricKey = metric.key || metric.id
              const value = keyMetrics[metricKey] || ''
              const format = metric.format || 'text'
              
              return (
                <div key={metricKey} className="space-y-2">
                  <Label className="text-xs">
                    {metric.label || metricKey}
                    {metric.unit && <span className="text-muted-foreground ml-1">({metric.unit})</span>}
                  </Label>
                  {format === 'number' || format === 'currency' || format === 'percentage' ? (
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => {
                        const numValue = e.target.value === '' ? '' : parseFloat(e.target.value)
                        updateField(['keyMetrics', metricKey], numValue === '' ? '' : isNaN(numValue) ? e.target.value : numValue)
                      }}
                      placeholder={`Enter ${format === 'currency' ? 'currency' : format === 'percentage' ? 'percentage' : 'number'} value`}
                    />
                  ) : (
                    <Input
                      value={value}
                      onChange={(e) => updateField(['keyMetrics', metricKey], e.target.value)}
                      placeholder={`Enter ${metric.label || metricKey} value`}
                    />
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Summary text editor */}
          <div className="space-y-2">
            <Label className="text-xs">Summary Text (Optional)</Label>
            <Textarea
              value={formData.summaryText || ''}
              onChange={(e) => updateField(['summaryText'], e.target.value)}
              rows={4}
              placeholder="Optional summary text describing the metrics"
            />
          </div>
        </div>
        
        {renderJsonView()}
      </div>
    )
  }

  if (layout === 'tracker') {
    // Tracker layout editor
    const dataModel = artifact.data_model as any
    const trackers = dataModel?.trackers || []
    const entries = formData.entries || []
    
    return (
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {entries.map((entry: any, idx: number) => (
            <div key={idx} className="p-4 border border-border/20 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  Entry {idx + 1}
                  {entry.timestamp && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({new Date(entry.timestamp).toLocaleString()})
                    </span>
                  )}
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeArrayItem(['entries'], idx)}
                  className="min-h-[44px] min-w-[44px] px-3 text-sm md:text-xs"
                  aria-label={`Delete entry ${idx + 1}`}
                >
                  <Trash2 className="w-4 h-4 md:w-3 md:h-3" />
                </Button>
              </div>
              
              {/* Timestamp editor */}
              <div className="space-y-2">
                <Label className="text-xs">Timestamp</Label>
                <Input
                  type="datetime-local"
                  value={entry.timestamp ? new Date(entry.timestamp).toISOString().slice(0, 16) : ''}
                  onChange={(e) => {
                    const timestamp = e.target.value ? new Date(e.target.value).getTime() : Date.now()
                    updateField(['entries', idx.toString(), 'timestamp'], timestamp)
                  }}
                />
              </div>
              
              {/* Tracker values editor */}
              <div className="space-y-3">
                <Label className="text-xs">Tracker Values</Label>
                {trackers.map((tracker: any) => {
                  const trackerKey = tracker.key || tracker.id
                  const value = entry.values?.[trackerKey] || ''
                  const format = tracker.format || 'text'
                  
                  return (
                    <div key={trackerKey} className="space-y-1">
                      <Label className="text-xs">
                        {tracker.label || tracker.title || trackerKey}
                        {tracker.unit && <span className="text-muted-foreground ml-1">({tracker.unit})</span>}
                      </Label>
                      {format === 'number' || format === 'currency' || format === 'percentage' ? (
                        <Input
                          type="number"
                          value={value}
                          onChange={(e) => {
                            const numValue = e.target.value === '' ? '' : parseFloat(e.target.value)
                            const newValue = numValue === '' ? '' : isNaN(numValue) ? e.target.value : numValue
                            updateField(['entries', idx.toString(), 'values', trackerKey], newValue)
                          }}
                          placeholder={`Enter ${format === 'currency' ? 'currency' : format === 'percentage' ? 'percentage' : 'number'} value`}
                        />
                      ) : (
                        <Input
                          value={value}
                          onChange={(e) => updateField(['entries', idx.toString(), 'values', trackerKey], e.target.value)}
                          placeholder={`Enter ${tracker.label || trackerKey} value`}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
              
              {/* Note editor */}
              <div className="space-y-2">
                <Label className="text-xs">Note (Optional)</Label>
                <Textarea
                  value={entry.note || ''}
                  onChange={(e) => updateField(['entries', idx.toString(), 'note'], e.target.value)}
                  rows={2}
                  placeholder="Optional note about this entry"
                />
              </div>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const newValues: Record<string, any> = {}
              trackers.forEach((tracker: any) => {
                const trackerKey = tracker.key || tracker.id
                newValues[trackerKey] = ''
              })
              addArrayItem(['entries'], {
                id: `entry-${Date.now()}`,
                timestamp: Date.now(),
                values: newValues,
                note: ''
              })
            }}
            className="w-full min-h-[44px]"
            aria-label="Add new entry"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </Button>
        </div>
        
        {renderJsonView()}
      </div>
    )
  }

  // Fallback: show JSON editor for unsupported layouts
  return (
    <div className="space-y-4">
      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-sm text-yellow-600 dark:text-yellow-400">
        Form editor not available for this layout type. Please use individual field editing.
      </div>
      
      {renderJsonView()}
    </div>
  )
}

