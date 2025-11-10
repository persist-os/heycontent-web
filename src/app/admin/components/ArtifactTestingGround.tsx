/**
 * ARTIFACT TESTING GROUND
 * 
 * Interactive testing environment for the Universal Artifact System.
 * Allows admins to test all artifact types, editing, and features.
 */

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ArtifactRenderer } from '@/components/artifacts/ArtifactRenderer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Artifact } from '@/types/artifacts'
import { Beaker, List, Clock, Activity, Eye, Pencil, FileText, Lightbulb, BarChart3 } from 'lucide-react'

export function ArtifactTestingGround() {
  const [editable, setEditable] = useState(false)
  const [updateLog, setUpdateLog] = useState<string[]>([])

  const logUpdate = (type: string, data: any) => {
    const timestamp = new Date().toLocaleTimeString()
    setUpdateLog(prev => [`[${timestamp}] ${type} updated:`, JSON.stringify(data, null, 2), '', ...prev].slice(0, 20))
  }

  // Sample Structured List Artifact
  const listArtifact: Artifact = {
    type: 'structured_list',
    schema: {
      layout: 'table',
      fields: [
        { key: 'task', type: 'text', label: 'Task Name', editable: true },
        { key: 'priority', type: 'select', label: 'Priority', editable: true, options: ['High', 'Medium', 'Low'] },
        { key: 'status', type: 'badge', label: 'Status', editable: true, options: ['Done', 'In Progress', 'Blocked'] },
        { key: 'assignee', type: 'text', label: 'Assignee', editable: true },
        { key: 'id', type: 'text', label: 'ID', editable: false }
      ]
    },
    data: [
      { task: 'Build artifact system', priority: 'High', status: 'Done', assignee: 'Engineering', id: '001' },
      { task: 'Add timeline support', priority: 'High', status: 'Done', assignee: 'Engineering', id: '002' },
      { task: 'Test editing features', priority: 'Medium', status: 'In Progress', assignee: 'QA', id: '003' },
      { task: 'Write documentation', priority: 'Low', status: 'Blocked', assignee: 'Docs', id: '004' }
    ],
    metadata: {
      version: 1,
      lastUpdatedBy: 'widget_test',
      lastUpdatedAt: Date.now()
    }
  }

  // Sample Timeline Artifact
  const timelineArtifact: Artifact = {
    type: 'timeline',
    schema: {
      layout: 'timeline',
      eventTypes: [
        { type: 'milestone', icon: 'flag', color: 'blue', label: 'Milestone' },
        { type: 'task', icon: 'check', color: 'green', label: 'Task' },
        { type: 'deadline', icon: 'alert', color: 'red', label: 'Deadline' },
        { type: 'note', icon: 'circle', color: 'purple', label: 'Note' }
      ],
      groupBy: 'date'
    },
    data: {
      events: [
        {
          id: '1',
          timestamp: Date.now(),
          type: 'milestone',
          title: 'Phase 2 Complete',
          description: 'Editing and subscription features implemented'
        },
        {
          id: '2',
          timestamp: Date.now() - 3600000,
          type: 'task',
          title: 'Timeline Layout Built',
          description: 'Vertical timeline with event dots and colors'
        },
        {
          id: '3',
          timestamp: Date.now() - 7200000,
          type: 'task',
          title: 'Tracker Layout Built',
          description: 'Compact activity log format'
        },
        {
          id: '4',
          timestamp: Date.now() - 86400000,
          type: 'milestone',
          title: 'Phase 1 Complete',
          description: 'Foundation and basic rendering established'
        },
        {
          id: '5',
          timestamp: Date.now() + 86400000,
          type: 'deadline',
          title: 'Phase 3 Deadline',
          description: 'Report, analysis, and summary layouts due'
        }
      ]
    },
    metadata: {
      version: 1,
      lastUpdatedBy: 'widget_timeline',
      lastUpdatedAt: Date.now()
    }
  }

  // Sample Tracker Artifact
  const trackerArtifact: Artifact = {
    type: 'tracker',
    schema: {
      layout: 'tracker',
      eventTypes: []
    },
    data: {
      events: [
        {
          id: '1',
          timestamp: Date.now(),
          type: 'success',
          widgetId: 'widget_123',
          widgetName: 'Task Generator',
          message: 'executed successfully',
          status: 'success',
          details: 'Generated 4 tasks in structured list'
        },
        {
          id: '2',
          timestamp: Date.now() - 900000,
          type: 'execution',
          widgetId: 'widget_456',
          widgetName: 'Timeline Builder',
          message: 'started execution',
          status: 'running',
          details: 'Processing project milestones'
        },
        {
          id: '3',
          timestamp: Date.now() - 1800000,
          type: 'update',
          widgetId: 'widget_789',
          widgetName: 'Status Updater',
          message: 'updated artifact data',
          status: 'success',
          details: 'Changed 2 task statuses'
        },
        {
          id: '4',
          timestamp: Date.now() - 3600000,
          type: 'error',
          widgetId: 'widget_999',
          widgetName: 'Data Sync',
          message: 'failed to sync',
          status: 'failed',
          details: 'Connection timeout after 30s'
        }
      ]
    },
    metadata: {
      version: 1,
      lastUpdatedBy: 'system',
      lastUpdatedAt: Date.now()
    }
  }

  // Card layout version of list
  const cardListArtifact: Artifact = {
    ...listArtifact,
    schema: {
      ...listArtifact.schema,
      layout: 'cards'
    }
  }

  // Sample Report Artifact
  const reportArtifact: Artifact = {
    type: 'report',
    schema: {
      layout: 'markdown',
      sections: [
        { id: '1', title: 'Executive Summary', order: 1 },
        { id: '2', title: 'Key Findings', order: 2 },
        { id: '3', title: 'Recommendations', order: 3 }
      ]
    },
    data: {
      markdown: '',
      sections: [
        {
          id: '1',
          title: 'Executive Summary',
          content: 'The **Universal Artifact Rendering System** has successfully completed Phase 3 development. All six artifact types are now fully implemented and operational:\n\n- Structured List (table & cards)\n- Timeline (events with types)\n- Tracker (execution logs)\n- Report (markdown sections) ✨\n- Analysis (insights + charts) 📊\n- Summary (formatted metrics)\n\nKey achievements include a **70% code reduction** compared to traditional component-per-type approaches, full type safety with TypeScript, and seamless integration with existing widget infrastructure.\n\n> "This is a game-changer for widget development" - Engineering Team'
        },
        {
          id: '2',
          title: 'Key Findings',
          content: '## Code Efficiency\n\nThe universal renderer approach reduced total codebase size by approximately **400 lines** compared to individual component implementations.\n\n### Developer Experience\n\nNew artifact types can be added with `<80 lines` of code per type. Example:\n\n```typescript\nexport function CustomLayout({ artifact }: LayoutProps) {\n  return <Card>...</Card>\n}\n```\n\n### Design System Compliance\n\nAll components follow Material Design 3 principles:\n\n1. **Semantic colors** - No hardcoded values\n2. **Glassmorphism** - `bg-card/50 backdrop-blur-sm`\n3. **Consistent spacing** - 4px multiples\n\n### Performance\n\nRendering performance is consistent across all artifact types with minimal overhead. Benchmarks show:\n\n| Artifact Type | Avg Render Time | Memory Usage |\n|---------------|-----------------|-------------|\n| Structured List | 12ms | 2.3 MB |\n| Timeline | 8ms | 1.8 MB |\n| Report | 15ms | 2.1 MB |'
        },
        {
          id: '3',
          title: 'Recommendations',
          content: '### Short-term Priorities\n\nMoving forward, we recommend:\n\n1. **Markdown Editing** ✅ COMPLETED\n   - Live preview while editing\n   - Syntax highlighting\n   - Section-by-section editing\n\n2. **Chart Integration** ✅ COMPLETED\n   - Bar, Line, Pie charts\n   - Responsive design\n   - Semantic color theming\n\n3. **Backend Integration** 🔄 IN PROGRESS\n   - Artifact persistence\n   - Version tracking\n   - Change history\n\n### Long-term Vision\n\n- [ ] AI-powered artifact generation\n- [ ] Cross-project artifact sharing\n- [ ] Artifact templates library\n- [ ] Custom artifact type builder\n\n---\n\n**Status**: Phase 3 ✅ Complete | Next: Backend Integration'
        }
      ]
    },
    metadata: {
      version: 1,
      lastUpdatedBy: 'widget_report_gen',
      lastUpdatedAt: Date.now()
    }
  }

  // Sample Analysis Artifact
  const analysisArtifact: Artifact = {
    type: 'analysis',
    schema: {
      layout: 'insights',
      showCharts: true,
      chartType: 'bar'
    },
    data: {
      insights: [
        {
          id: '1',
          title: 'High Code Reusability Achieved',
          description: 'The universal renderer pattern enables 70% code reduction across all artifact types. Each new type requires only a single layout component (<80 lines) instead of multiple specialized renderers.',
          priority: 'high',
          category: 'Architecture'
        },
        {
          id: '2',
          title: 'Consistent User Experience',
          description: 'All artifacts share common visual patterns (glassmorphism, semantic colors, metadata footers) providing a cohesive experience regardless of content type.',
          priority: 'high',
          category: 'UX'
        },
        {
          id: '3',
          title: 'Type Safety Improvements',
          description: 'TypeScript interfaces for all artifact types ensure compile-time validation and reduce runtime errors by 90% compared to previous implementations.',
          priority: 'medium',
          category: 'Quality'
        },
        {
          id: '4',
          title: 'Performance Optimization Opportunity',
          description: 'Consider implementing virtual scrolling for large datasets in Structured List artifacts. Current implementation handles up to 100 rows efficiently.',
          priority: 'low',
          category: 'Performance'
        }
      ],
      chartData: [
        { type: 'Structured List', lines: 133 },
        { type: 'Timeline', lines: 153 },
        { type: 'Tracker', lines: 125 },
        { type: 'Report', lines: 83 },
        { type: 'Analysis', lines: 128 },
        { type: 'Summary', lines: 108 }
      ]
    },
    metadata: {
      version: 1,
      lastUpdatedBy: 'widget_analyzer',
      lastUpdatedAt: Date.now()
    }
  }

  // Sample Summary Artifact
  const summaryArtifact: Artifact = {
    type: 'summary',
    schema: {
      layout: 'card',
      metrics: [
        { key: 'totalArtifacts', label: 'Total Artifacts', format: 'number' },
        { key: 'codeLines', label: 'Total Code', format: 'number', unit: 'lines' },
        { key: 'codeReduction', label: 'Code Reduction', format: 'percentage' },
        { key: 'typesSupported', label: 'Types Supported', format: 'number' },
        { key: 'avgLinesPerType', label: 'Avg Lines/Type', format: 'number', unit: 'lines' },
        { key: 'testCoverage', label: 'Test Coverage', format: 'percentage' }
      ]
    },
    data: {
      keyMetrics: {
        totalArtifacts: 6,
        codeLines: 730,
        codeReduction: 70,
        typesSupported: 6,
        avgLinesPerType: 122,
        testCoverage: 95
      },
      summaryText: 'Phase 3 completion marks a major milestone in the Universal Artifact System. All six core artifact types are now operational with full editing support, type safety, and design system compliance. The system demonstrates significant efficiency gains with 70% code reduction and sub-80-line implementations per type.'
    },
    metadata: {
      version: 1,
      lastUpdatedBy: 'widget_summary',
      lastUpdatedAt: Date.now()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <Card className="border-purple-200 dark:border-purple-900">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Beaker className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <CardTitle>Artifact Testing Ground</CardTitle>
              </div>
              <CardDescription>
                Interactive testing for the Universal Artifact Rendering System
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {editable ? (
                  <Pencil className="h-4 w-4 text-primary" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <Label htmlFor="editable-mode" className="cursor-pointer">
                  {editable ? 'Edit Mode' : 'View Mode'}
                </Label>
                <Switch
                  id="editable-mode"
                  checked={editable}
                  onCheckedChange={setEditable}
                />
              </div>
              
              <Badge variant={editable ? 'default' : 'outline'}>
                {editable ? 'Editing Enabled' : 'Read-Only'}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Artifact Tabs */}
      <Tabs defaultValue="list-table" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 gap-2">
          <TabsTrigger value="list-table" className="gap-2">
            <List className="h-4 w-4" />
            List (Table)
          </TabsTrigger>
          <TabsTrigger value="list-cards" className="gap-2">
            <List className="h-4 w-4" />
            List (Cards)
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <Clock className="h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="tracker" className="gap-2">
            <Activity className="h-4 w-4" />
            Tracker
          </TabsTrigger>
          <TabsTrigger value="report" className="gap-2">
            <FileText className="h-4 w-4" />
            Report
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="summary" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Summary
          </TabsTrigger>
        </TabsList>

        {/* Table List */}
        <TabsContent value="list-table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Structured List (Table Layout)</CardTitle>
              <CardDescription>
                Click on any editable field (dashed underline) when edit mode is enabled
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ArtifactRenderer
                artifact={listArtifact}
                editable={editable}
                onUpdate={(data) => logUpdate('Structured List', data)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Card List */}
        <TabsContent value="list-cards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Structured List (Card Layout)</CardTitle>
              <CardDescription>
                Responsive card grid - perfect for mobile viewing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ArtifactRenderer
                artifact={cardListArtifact}
                editable={editable}
                onUpdate={(data) => logUpdate('Structured List (Cards)', data)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
              <CardDescription>
                Vertical timeline with event dots and type-based colors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ArtifactRenderer
                artifact={timelineArtifact}
                editable={editable}
                onUpdate={(data) => logUpdate('Timeline', data)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tracker */}
        <TabsContent value="tracker" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Execution Tracker</CardTitle>
              <CardDescription>
                Compact activity log for widget execution history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ArtifactRenderer
                artifact={trackerArtifact}
                editable={false}
                onUpdate={(data) => logUpdate('Tracker', data)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Report */}
        <TabsContent value="report" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report</CardTitle>
              <CardDescription>
                Markdown-based report with structured sections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ArtifactRenderer
                artifact={reportArtifact}
                editable={editable}
                onUpdate={(data) => logUpdate('Report', data)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis */}
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analysis</CardTitle>
              <CardDescription>
                Data insights with priority indicators and optional charts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ArtifactRenderer
                artifact={analysisArtifact}
                editable={editable}
                onUpdate={(data) => logUpdate('Analysis', data)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
              <CardDescription>
                Key metrics and highlights with formatted values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ArtifactRenderer
                artifact={summaryArtifact}
                editable={editable}
                onUpdate={(data) => logUpdate('Summary', data)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Update Log */}
      {updateLog.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Update Log</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUpdateLog([])}
              >
                Clear Log
              </Button>
            </div>
            <CardDescription>
              Real-time log of artifact updates (optimistic UI)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted/50 p-4 rounded-lg overflow-auto max-h-64 font-mono">
              {updateLog.join('\n')}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="border-blue-200 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="text-lg">Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">🎯 Phase 1 Features (Read-Only Display)</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Switch between artifact types using tabs</li>
              <li>View structured lists in table or card format</li>
              <li>See timeline with event dots and colors</li>
              <li>Check tracker with status badges</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">✏️ Phase 2 Features (Inline Editing)</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Toggle "Edit Mode" switch in header</li>
              <li>Click any field with dashed underline to edit</li>
              <li>Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to save changes</li>
              <li>Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> to cancel</li>
              <li>Watch updates appear in the log below</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">📊 Phase 3+ Features (Enhanced Artifacts)</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li><strong>Report Markdown Editing:</strong> Click "Edit" button on any section to edit markdown with live preview</li>
              <li><strong>Chart Visualization:</strong> Analysis artifacts display interactive bar/line/pie charts with data</li>
              <li><strong>Markdown Rendering:</strong> Full GFM support (tables, code blocks, lists, emphasis, blockquotes)</li>
              <li><strong>Summary Metrics:</strong> Formatted numbers, percentages, and currency with responsive grid layout</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">🎨 Field Types Supported</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Text</Badge>
              <Badge variant="outline">Select (Dropdown)</Badge>
              <Badge variant="outline">Badge (Status)</Badge>
              <Badge variant="outline">Number</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

