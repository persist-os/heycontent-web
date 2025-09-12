'use client'

import React from 'react'
import { WidgetConfig } from './WidgetFactory'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  Calendar, 
  CheckSquare, 
  Clock, 
  Target, 
  TrendingUp,
  Users,
  FileText,
  Lightbulb,
  Settings,
  Share2,
  Edit3
} from 'lucide-react'

interface AgentGeneratedWidgetsProps {
  widgets: WidgetConfig[]
  layoutType: string
  columns: number
  globalTheme: string
  colorScheme: string
  fontStyle: string
}

const getWidgetIcon = (widgetType: string) => {
  switch (widgetType) {
    case 'tracker':
      return <Target className="w-4 h-4" />
    case 'chart':
      return <BarChart3 className="w-4 h-4" />
    case 'board':
      return <CheckSquare className="w-4 h-4" />
    case 'timeline':
      return <Calendar className="w-4 h-4" />
    case 'meter':
      return <TrendingUp className="w-4 h-4" />
    case 'inspiration':
      return <Lightbulb className="w-4 h-4" />
    case 'content':
      return <FileText className="w-4 h-4" />
    case 'collaboration':
      return <Users className="w-4 h-4" />
    default:
      return <Settings className="w-4 h-4" />
  }
}

const getSizeClasses = (size: string) => {
  switch (size) {
    case 'small':
      return 'col-span-1 row-span-1'
    case 'medium':
      return 'col-span-2 row-span-1'
    case 'large':
      return 'col-span-2 row-span-2'
    case 'xlarge':
      return 'col-span-3 row-span-2'
    default:
      return 'col-span-1 row-span-1'
  }
}

const getThemeClasses = (theme: string) => {
  switch (theme) {
    case 'warm':
      return 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800/20'
    case 'clean':
      return 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/20'
    case 'professional':
      return 'bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800/20'
    case 'creative':
      return 'bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800/20'
    default:
      return 'bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800/20'
  }
}

const getPriorityColor = (priority: number) => {
  if (priority >= 8) return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
  if (priority >= 6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
  if (priority >= 4) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
}

export function AgentGeneratedWidgets({ 
  widgets, 
  layoutType, 
  columns, 
  globalTheme, 
  colorScheme, 
  fontStyle 
}: AgentGeneratedWidgetsProps) {
  // Sort widgets by position
  const sortedWidgets = [...widgets].sort((a, b) => a.position - b.position)

  return (
    <div className="space-y-6">
      {/* Widget Grid */}
      <div 
        className={`grid gap-4 ${
          layoutType === 'grid' 
            ? `grid-cols-${columns}` 
            : layoutType === 'dashboard'
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1'
        }`}
        style={{
          gridTemplateColumns: layoutType === 'grid' ? `repeat(${columns}, 1fr)` : undefined
        }}
      >
        {sortedWidgets.map((widget) => (
          <Card 
            key={widget.widget_id}
            className={`${getSizeClasses(widget.size)} ${getThemeClasses(widget.theme)} transition-all duration-200 hover:shadow-md`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getWidgetIcon(widget.widget_type)}
                  <CardTitle className="text-sm font-medium">
                    {widget.title}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getPriorityColor(widget.priority)}`}
                  >
                    P{widget.priority}
                  </Badge>
                  {widget.interactive && (
                    <Badge variant="outline" className="text-xs">
                      Interactive
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {widget.description}
              </p>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Widget Content Placeholder */}
              <div className="space-y-3">
                {/* Data Sources */}
                {widget.data_sources.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {widget.data_sources.map((source, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {source}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* Update Frequency */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  Updates: {widget.update_frequency}
                </div>
                
                {/* Widget Actions */}
                <div className="flex items-center gap-2 pt-2">
                  {widget.editable && (
                    <Button size="sm" variant="outline" className="h-7 px-2">
                      <Edit3 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  )}
                  {widget.shareable && (
                    <Button size="sm" variant="outline" className="h-7 px-2">
                      <Share2 className="w-3 h-3 mr-1" />
                      Share
                    </Button>
                  )}
                </div>
                
                {/* Widget Configuration Display */}
                {widget.config && Object.keys(widget.config).length > 0 && (
                  <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
                    <div className="font-medium mb-1">Configuration:</div>
                    <pre className="text-xs text-muted-foreground overflow-x-auto">
                      {JSON.stringify(widget.config, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Layout Info */}
      <div className="text-xs text-muted-foreground text-center">
        Layout: {layoutType} | Theme: {globalTheme} | Color: {colorScheme} | Font: {fontStyle}
      </div>
    </div>
  )
}
