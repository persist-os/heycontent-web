'use client'

import React from 'react'
import { WidgetFactory } from '../../../components/widgets/WidgetFactory'

interface AgentGeneratedWidgetsProps {
  widgets: any[]
  projectId: string
}

export function AgentGeneratedWidgets({ widgets, projectId }: AgentGeneratedWidgetsProps) {
  if (!widgets || widgets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground/60">No widgets generated yet</p>
        <p className="text-sm text-muted-foreground/40 mt-2">
          Widgets will be generated based on your project's fingerprint
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets.map((widget) => (
          <div key={widget._id} className="h-full">
            <WidgetFactory
              config={widget}
              projectId={projectId}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
