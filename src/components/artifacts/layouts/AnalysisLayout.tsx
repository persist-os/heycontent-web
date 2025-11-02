/**
 * ANALYSIS LAYOUT
 * 
 * Renders analysis artifacts with insights and optional visualizations.
 * Supports chart rendering with recharts library.
 * Design Spec: Focus on key findings with priority indicators
 */

'use client'

import React from 'react'
import { AnalysisArtifact, LayoutProps } from '@/types/artifacts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pencil, Lightbulb, AlertCircle, Info, BarChart as BarChartIcon } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export function AnalysisLayout({ 
  artifact,
  editable = false
}: LayoutProps<AnalysisArtifact>) {
  // Defensive: ensure all required properties exist
  const schema = artifact?.schema || { layout: 'insights' as const }
  const data = artifact?.data || { insights: [] }
  const metadata = artifact?.metadata || {
    version: 1,
    lastUpdatedBy: 'unknown',
    lastUpdatedAt: Date.now()
  }

  // Get priority icon and color
  const getPriorityIndicator = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return { icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-500/10' }
      case 'medium':
        return { icon: Info, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' }
      case 'low':
        return { icon: Lightbulb, color: 'text-blue-500', bgColor: 'bg-blue-500/10' }
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
  const insights = Array.isArray(data.insights) ? data.insights : []
  const groupedInsights = insights.reduce((acc, insight) => {
    const category = insight?.category || 'General'
    if (!acc[category]) acc[category] = []
    acc[category].push(insight)
    return acc
  }, {} as Record<string, typeof insights>)

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-primary/20 hover:bg-card/80 transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Analysis</span>
            {editable && (
              <Pencil className="w-3 h-3 text-primary/60" />
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            v{metadata.version}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Insights grouped by category */}
        {Object.entries(groupedInsights).map(([category, insights]) => (
          <div key={category} className="space-y-3">
            {Object.keys(groupedInsights).length > 1 && (
              <h3 className="text-sm font-semibold text-foreground border-b border-border/20 pb-2">
                {category}
              </h3>
            )}
            
            <div className="space-y-3">
              {insights.map((insight, insightIdx) => {
                const { icon: Icon, color, bgColor } = getPriorityIndicator(insight.impact)
                return (
                  <div
                    key={insight.id || `insight-${category}-${insightIdx}`}
                    className={`${bgColor} border border-border/20 rounded-lg p-4 transition-all duration-200 hover:bg-opacity-80`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 ${color} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-foreground">
                            {insight.title}
                          </h4>
                          <Badge variant="outline" className="text-xs capitalize">
                            {insight.impact}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Chart visualization */}
        {schema?.showCharts && data?.chartData && Array.isArray(data.chartData) && data.chartData.length > 0 && (
          <div className="bg-muted/10 border border-border/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChartIcon className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Data Visualization</h4>
              <Badge variant="outline" className="text-xs ml-auto">
                {data.chartData.length} data points
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              {schema.chartType === 'bar' ? (
                <BarChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey={Object.keys(data.chartData[0] || {})[0]} 
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
                  <Bar 
                    dataKey={Object.keys(data.chartData[0] || {})[1]} 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : schema.chartType === 'line' ? (
                <LineChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey={Object.keys(data.chartData[0] || {})[0]}
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
                  <Line 
                    type="monotone"
                    dataKey={Object.keys(data.chartData[0] || {})[1]} 
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  />
                </LineChart>
              ) : (
                <PieChart>
                  <Pie
                    data={data.chartData}
                    dataKey={Object.keys(data.chartData[0] || {})[1]}
                    nameKey={Object.keys(data.chartData[0] || {})[0]}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {data.chartData.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`hsl(${(index * 360) / data.chartData.length}, 70%, 50%)`}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              )}
            </ResponsiveContainer>
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

