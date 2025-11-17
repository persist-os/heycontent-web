'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { SearchBar } from '@/components/ui/search-bar'
import { BaseCard } from '@/components/ui/base-card'
import { formatDistanceToNow } from '@/app/dashboard/living-projects/[projectId]/components/utils/dateFormatting'

/**
 * Widgets Page - Matches Figma design exactly
 * 
 * Figma node-id: 1238-2033
 * Layout: Breadcrumb, SearchBar, WidgetCard list
 * Uses real data from Convex queries (Pattern: artifacts/assignments pages)
 */
export default function WidgetsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Get user ID on component mount (Pattern: artifacts/assignments pages)
  useEffect(() => {
    const getUserId = async () => {
      try {
        const id = await getCurrentUserId()
        setUserId(id)
      } catch (error) {
        console.error('Failed to get user ID:', error)
      }
    }
    getUserId()
  }, [])

  // Fetch widgets from Convex (Pattern: useQuickEntryStats)
  const widgets = useQuery(
    api.widgetsQueries.getUserWidgets,
    userId ? { userId } : 'skip'
  )

  // Fetch projects to get names for breadcrumbs
  const projects = useQuery(
    api.projectsQueries.getByUser,
    userId ? { userId } : 'skip'
  )

  // Create project name map
  const projectNameMap = useMemo(() => {
    if (!projects) return new Map<string, string>()
    const map = new Map<string, string>()
    projects.forEach((project: any) => {
      map.set(project._id, project.name || 'Untitled Project')
    })
    return map
  }, [projects])

  // Filter widgets by search term
  const filteredWidgets = useMemo(() => {
    if (!widgets || !searchTerm) return widgets || []
    const term = searchTerm.toLowerCase()
    return widgets.filter((widget: any) => {
      const title = widget.title || widget.description || ''
      const projectName = widget.projectId ? projectNameMap.get(widget.projectId) || '' : ''
      return (
        title.toLowerCase().includes(term) ||
        projectName.toLowerCase().includes(term) ||
        widget.category?.toLowerCase().includes(term) ||
        widget.widget_type?.toLowerCase().includes(term)
      )
    })
  }, [widgets, searchTerm, projectNameMap])

  // Map widgets to WidgetCard format
  const widgetCards = useMemo(() => {
    if (!filteredWidgets) return []
    return filteredWidgets.map((widget: any) => {
      // Extract title with fallback chain
      let widgetTitle = widget.title
      if (!widgetTitle && widget.familyIdentity?.familyName) {
        widgetTitle = widget.familyIdentity.familyName
      }
      if (!widgetTitle && widget.description) {
        widgetTitle = widget.description.substring(0, 50) + (widget.description.length > 50 ? '...' : '')
      }
      if (!widgetTitle) {
        widgetTitle = widget.widget_type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Widget'
      }

      // Format timestamp from updatedAt or createdAt
      const timestamp = widget.updatedAt
        ? formatDistanceToNow(new Date(widget.updatedAt), { addSuffix: true, short: true })
        : widget.createdAt
        ? formatDistanceToNow(new Date(widget.createdAt), { addSuffix: true, short: true })
        : 'unknown'

      // Build summary from description or family mission
      let summary = widget.description || widget.familyIdentity?.mission || 'No description'
      if (summary.length > 120) {
        summary = summary.substring(0, 120) + '...'
      }

      // Build path from project name (breadcrumb path)
      const projectName = widget.projectId ? projectNameMap.get(widget.projectId) || 'Untitled Project' : undefined
      const path = projectName ? `${projectName}` : undefined

      // Use widget category or type as tag
      const tag = widget.category || widget.widget_type || undefined

      return {
        title: widgetTitle,
        timestamp,
        summary,
        path,
        tag,
        widgetId: widget._id,
        projectId: widget.projectId
      }
    })
  }, [filteredWidgets, projectNameMap])

  const breadcrumbItems = [
    { label: 'Files', href: '/dashboard/notes' },
    { label: 'Widgets' }
  ]

  return (
    <div className="min-h-screen bg-[hsl(var(--assignment-bg))] relative size-full px-4 md:px-0">
      {/* Main Content - Layout handles navigation spacing automatically */}
      <div className="w-full md:w-[1124px] mx-auto">
        {/* Breadcrumb - Responsive typography */}
        <div className="content-stretch flex font-['DM_Sans'] font-extralight gap-[4px] items-center leading-[0] relative shrink-0 text-[hsl(var(--assignment-text-regular))] text-xl md:text-[32px] tracking-[-0.96px] whitespace-nowrap [font-variation-settings:'opsz'_14]">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Search Bar */}
        <div className="box-border content-stretch flex flex-col gap-[10px] items-start px-0 py-[8px] relative shrink-0 w-full">
          <SearchBar value={searchTerm} onChange={setSearchTerm} />
        </div>

        {/* Widget Cards */}
        <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full mt-4 md:mt-0">
          {widgets === undefined ? (
            // Loading state
            <div className="text-[hsl(var(--assignment-text-subtle))]">Loading widgets...</div>
          ) : widgetCards.length === 0 ? (
            // Empty state
            <div className="text-[hsl(var(--assignment-text-subtle))]">
              {searchTerm ? 'No widgets found' : 'No widgets yet'}
            </div>
          ) : (
            widgetCards.map((widget) => {
              const handleClick = () => {
                if (widget.projectId && widget.widgetId) {
                  window.location.href = `/dashboard/living-projects/${widget.projectId}/gallery?id=${widget.widgetId}&type=widget`
                } else if (widget.projectId) {
                  window.location.href = `/dashboard/living-projects/${widget.projectId}/assignment`
                }
              }
              return (
                <BaseCard
                  key={widget.widgetId}
                  variant="widget"
                  title={widget.title}
                  timestamp={widget.timestamp}
                  summary={widget.summary}
                  path={widget.path}
                  tag={widget.tag}
                  onClick={handleClick}
                />
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

