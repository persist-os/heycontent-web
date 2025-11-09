/**
 * INSIGHTS LAYOUT RENDERER
 * 
 * Generic insights renderer for artifacts with layout: 'insights'
 * Works with ANY artifact type that uses insights layout
 * 
 * Design Spec: Focus on key findings with priority indicators
 */

'use client'

import React, { useState } from 'react'
import { ArtifactMetadata } from '@/types/artifacts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Pencil, Lightbulb, AlertCircle, Info, BarChart as BarChartIcon, X } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { VersionSelector } from '../../VersionSelector'

interface Insight {
  id?: string
  title: string
  description: string
  impact?: 'high' | 'medium' | 'low'  // Legacy field
  significance?: string  // Actual Convex data uses this field
  metric?: string
  value?: string
  category?: string
}

interface InsightsLayoutRendererProps {
  data_model: {
    layout: 'insights'
    showCharts?: boolean
    chartType?: 'bar' | 'line' | 'pie'
  }
  data: {
    insights: Array<Insight>
    chartData?: Record<string, any>
  }
  editable: boolean
  onUpdate?: (data: any) => void
  artifactType?: string
  metadata?: ArtifactMetadata
}

export function InsightsLayoutRenderer({
  data_model,
  data,
  editable = false,
  onUpdate,
  artifactType,
  metadata
}: InsightsLayoutRendererProps) {
  // Defensive: ensure all required properties exist
  const insights = Array.isArray(data?.insights) ? data.insights : []
  const chartData = Array.isArray(data?.chartData) ? data.chartData : []
  const artifactMetadata = metadata || {
    version: 1,
    lastUpdatedBy: 'unknown',
    lastUpdatedAt: Date.now()
  }

  const [editingInsightId, setEditingInsightId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

  // Get priority icon and color (supports both 'impact' and 'significance')
  const getPriorityIndicator = (insight: Insight) => {
    // Support both 'impact' (legacy) and 'significance' (new format)
    const priority = insight?.impact || (insight?.significance ? 'medium' : undefined)
    
    switch (priority) {
      case 'high':
        return { icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-500/10' }
      case 'medium':
        return { icon: Info, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' }
      case 'low':
        return { icon: Lightbulb, color: 'text-blue-500', bgColor: 'bg-blue-500/10' }
      default:
        return { icon: Info, color: 'text-gray-500', bgColor: 'bg-gray-500/10' }
    }
  }

  // Format timestamp for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Group insights by category if provided
  const groupedInsights = insights.reduce((acc, insight) => {
    const category = insight?.category || 'General'
    if (!acc[category]) acc[category] = []
    acc[category].push(insight)
    return acc
  }, {} as Record<string, typeof insights>)

  // Handle editing insight
  const handleEditInsight = (insight: Insight) => {
    setEditingInsightId(insight.id || '')
    setEditTitle(insight.title)
    setEditDescription(insight.description)
  }

  const handleSaveInsight = () => {
    if (!onUpdate || !editingInsightId) return

    const newInsights = insights.map(insight => {
      if (insight.id === editingInsightId) {
        return {
          ...insight,
          title: editTitle,
          description: editDescription
        }
      }
      return insight
    })

    onUpdate({ ...data, insights: newInsights })
    setEditingInsightId(null)
    setEditTitle('')
    setEditDescription('')
  }

  const handleCancelEdit = () => {
    setEditingInsightId(null)
    setEditTitle('')
    setEditDescription('')
  }

  // Get artifact type display name
  const artifactTypeDisplay = artifactType || 'Analysis'

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-primary/20 hover:bg-card/80 transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{artifactTypeDisplay}</span>
            {editable && (
              <Pencil className="w-3 h-3 text-primary/60" />
            )}
          </div>
          <VersionSelector metadata={artifactMetadata} />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Insights grouped by category */}
        {Object.keys(groupedInsights).length > 0 ? (
          Object.entries(groupedInsights).map(([category, categoryInsights]) => (
            <div key={category} className="space-y-3">
              {Object.keys(groupedInsights).length > 1 && (
                <h3 className="text-sm font-semibold text-foreground border-b border-border/20 pb-2">
                  {category}
                </h3>
              )}
              
              <div className="space-y-3">
                {categoryInsights.map((insight, insightIdx) => {
                  const { icon: Icon, color, bgColor } = getPriorityIndicator(insight)
                  const priority = insight?.impact || (insight?.significance ? 'medium' : undefined)
                  const insightId = insight.id || `insight-${category}-${insightIdx}`
                  const isEditing = editingInsightId === insightId
                  
                  return (
                    <div
                      key={insightId}
                      className={`${bgColor} border border-border/20 rounded-lg p-4 transition-all duration-200 hover:bg-opacity-80`}
                    >
                      {isEditing ? (
                        /* Editing mode */
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                              Title
                            </label>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full px-3 py-2 text-sm bg-primary/5 border border-primary/40 rounded-md ring-2 ring-primary/50 focus:outline-none"
                              autoFocus
                              aria-label="Edit insight title"
                              placeholder="Enter insight title"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                              Description
                            </label>
                            <Textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="w-full min-h-[80px] px-3 py-2 text-sm bg-primary/5 border border-primary/40 rounded-md ring-2 ring-primary/50 focus:outline-none resize-y"
                              placeholder="Enter insight description..."
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={handleSaveInsight}
                              className="h-7 px-3 text-xs"
                            >
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEdit}
                              className="h-7 px-3 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Display mode */
                        <div className="flex items-start gap-3">
                          <Icon className={`w-5 h-5 ${color} flex-shrink-0 mt-0.5`} />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-sm font-semibold text-foreground">
                                {insight.title}
                              </h4>
                              <div className="flex items-center gap-2">
                                {priority && (
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {priority}
                                  </Badge>
                                )}
                                {editable && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditInsight(insight)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {insight.description}
                            </p>
                            {insight.significance && (
                              <p className="text-xs text-muted-foreground/80 italic">
                                {insight.significance}
                              </p>
                            )}
                            {insight.metric && insight.value && (
                              <div className="text-xs text-muted-foreground">
                                <strong>{insight.metric}:</strong> {insight.value}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        ) : (
          // Empty state
          <div className="text-center py-8 text-sm text-muted-foreground">
            <p>No insights available</p>
          </div>
        )}

        {/* Chart visualization */}
        {data_model?.showCharts && chartData.length > 0 && (
          <div className="bg-muted/10 border border-border/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChartIcon className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Data Visualization</h4>
              <Badge variant="outline" className="text-xs ml-auto">
                {chartData.length} data points
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              {data_model.chartType === 'bar' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey={Object.keys(chartData[0] || {})[0]} 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  {Object.keys(chartData[0] || {}).slice(1).map((key, idx) => (
                    <Bar key={key} dataKey={key} fill={`hsl(var(--primary))`} />
                  ))}
                </BarChart>
              ) : data_model.chartType === 'line' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey={Object.keys(chartData[0] || {})[0]} 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  {Object.keys(chartData[0] || {}).slice(1).map((key, idx) => (
                    <Line key={key} type="monotone" dataKey={key} stroke={`hsl(var(--primary))`} />
                  ))}
                </LineChart>
              ) : data_model.chartType === 'pie' ? (
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey={Object.keys(chartData[0] || {})[1] || 'value'}
                    nameKey={Object.keys(chartData[0] || {})[0] || 'name'}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(var(--primary))`} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey={Object.keys(chartData[0] || {})[0]} 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  {Object.keys(chartData[0] || {}).slice(1).map((key, idx) => (
                    <Bar key={key} dataKey={key} fill={`hsl(var(--primary))`} />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
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

