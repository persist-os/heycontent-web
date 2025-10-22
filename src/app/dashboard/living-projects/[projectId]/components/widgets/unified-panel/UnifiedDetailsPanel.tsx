/**
 * UNIFIED DETAILS PANEL
 * 
 * Main component that manages and renders multiple panel instances.
 * Consolidates WidgetDetailsPanel and ContentDetailsPanel into a single unified system.
 * 
 * Features:
 * - Multiple panels can be open simultaneously
 * - Each panel can be pinned (stays open)
 * - Panels can be collapsed or expanded
 * - Draggable and resizable in expanded mode
 * - Type-specific styling and tabs
 */

'use client'

import React, { useState } from 'react'
import { UnifiedDetailsPanelProps, TabType } from '@/app/dashboard/living-projects/types/unifiedDetailsPanel'
import { TYPE_CONFIGS } from './panelConfig'
import { CollapsedView } from './CollapsedView'
import { ExpandedView } from './ExpandedView'
import { OverviewTab, MetadataTab, ActionsTab, ActivityTab } from './TabContent'

export function UnifiedDetailsPanel({
  instances,
  onInstanceUpdate,
  onInstanceClose,
  projectId
}: UnifiedDetailsPanelProps) {
  // Track active tab for each panel instance
  const [activeTabsMap, setActiveTabsMap] = useState<Record<string, TabType>>({})

  // Handle minimize events
  React.useEffect(() => {
    const handleMinimize = (event: CustomEvent) => {
      const { id } = event.detail
      onInstanceUpdate(id, { 
        isExpanded: false, 
        size: { width: 280, height: 80 } // Collapsed size
      })
    }

    window.addEventListener('panel-minimize', handleMinimize as EventListener)
    return () => window.removeEventListener('panel-minimize', handleMinimize as EventListener)
  }, [onInstanceUpdate])

  return (
    <>
      {instances.map((instance) => {
        const config = TYPE_CONFIGS[instance.itemType]
        const activeTab = activeTabsMap[instance.id] || config.tabs[0]

        // Collapsed view
        if (!instance.isExpanded) {
          return (
            <CollapsedView
              key={instance.id}
              instance={instance}
              config={config}
              onExpand={() => onInstanceUpdate(instance.id, { isExpanded: true })}
            />
          )
        }

        // Expanded view with tabs
        return (
          <ExpandedView
            key={instance.id}
            instance={instance}
            config={config}
            activeTab={activeTab}
            setActiveTab={(tab) =>
              setActiveTabsMap((prev) => ({ ...prev, [instance.id]: tab }))
            }
            onClose={() => onInstanceClose(instance.id)}
            onPin={() =>
              onInstanceUpdate(instance.id, { isPinned: !instance.isPinned })
            }
            onResize={(size) => onInstanceUpdate(instance.id, { size })}
          >
            {/* Render active tab content */}
            {activeTab === 'overview' && (
              <OverviewTab
                item={instance.item}
                itemType={instance.itemType}
                config={config}
                projectId={projectId}
                onClose={() => onInstanceClose(instance.id)}
              />
            )}
            {activeTab === 'metadata' && (
              <MetadataTab
                item={instance.item}
                itemType={instance.itemType}
                config={config}
                projectId={projectId}
                onClose={() => onInstanceClose(instance.id)}
              />
            )}
            {activeTab === 'actions' && (
              <ActionsTab
                item={instance.item}
                itemType={instance.itemType}
                config={config}
                projectId={projectId}
                onClose={() => onInstanceClose(instance.id)}
              />
            )}
            {activeTab === 'activity' && (
              <ActivityTab
                item={instance.item}
                itemType={instance.itemType}
                config={config}
                projectId={projectId}
                onClose={() => onInstanceClose(instance.id)}
              />
            )}
          </ExpandedView>
        )
      })}
    </>
  )
}

// Export sub-components for direct use if needed
export { CollapsedView } from './CollapsedView'
export { ExpandedView } from './ExpandedView'
export { OverviewTab, MetadataTab, ActionsTab, ActivityTab } from './TabContent'
export { usePanelInstances } from './usePanelInstances'
export { useUnifiedActions } from './useUnifiedActions'
export { TYPE_CONFIGS, TABS } from './panelConfig'

