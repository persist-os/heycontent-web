'use client'

import React from 'react'
import { WidgetConfig } from '@/types/projectWidgets'
import { X } from 'lucide-react'

interface WidgetDetailsPanelProps {
  widget: WidgetConfig | null
  isOpen: boolean
  onClose: () => void
}

export function WidgetDetailsPanel({ widget, isOpen, onClose }: WidgetDetailsPanelProps) {
  return (
    <div
      className={[
        'fixed top-0 right-0 h-screen w-[380px] max-w-[90vw] bg-background border-l border-border shadow-xl z-50',
        'transition-transform duration-300 ease-out',
        isOpen ? 'translate-x-0' : 'translate-x-full',
      ].join(' ')}
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <div className="text-sm text-muted-foreground">Widget</div>
          <h3 className="text-lg font-medium">{widget?.title || '—'}</h3>
        </div>
        <button onClick={onClose} className="p-2 rounded-md hover:bg-muted">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3 text-sm">
        {widget ? (
          <>
            <div>
              <div className="text-muted-foreground">Type</div>
              <div className="font-medium">{widget.widget_type}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Category</div>
              <div className="font-medium">{widget.category}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Description</div>
              <div>{widget.description}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-muted-foreground">Priority</div>
                <div className="font-medium">{widget.priority}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Size</div>
                <div className="font-medium">{widget.size}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Theme</div>
                <div className="font-medium">{widget.theme}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Update</div>
                <div className="font-medium">{widget.update_frequency}</div>
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Data Sources</div>
              <div className="font-medium break-words">
                {widget.data_sources?.length ? widget.data_sources.join(', ') : '—'}
              </div>
            </div>
          </>
        ) : (
          <div className="text-muted-foreground">Select a widget to see details</div>
        )}
      </div>
    </div>
  )
}


