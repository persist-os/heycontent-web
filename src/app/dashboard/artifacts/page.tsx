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
 * Artifacts Page - Matches Figma design exactly
 * 
 * Figma node-id: 1238-1914
 * Layout: Breadcrumb, SearchBar, 2-column grid of ArtifactCards
 * Uses real data from Convex queries (Pattern: assignments page)
 */
export default function ArtifactsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Get user ID on component mount (Pattern: assignments page)
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

  // Fetch artifacts from Convex (Pattern: useQuickEntryStats)
  const artifacts = useQuery(
    api.artifactQueries.getUserArtifacts,
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

  // Filter artifacts by search term
  const filteredArtifacts = useMemo(() => {
    if (!artifacts || !searchTerm) return artifacts || []
    const term = searchTerm.toLowerCase()
    return artifacts.filter((artifact: any) => {
      const title = artifact.title || artifact.type || ''
      const projectName = artifact.projectId ? projectNameMap.get(artifact.projectId) || '' : ''
      return (
        title.toLowerCase().includes(term) ||
        projectName.toLowerCase().includes(term) ||
        artifact.type?.toLowerCase().includes(term) ||
        artifact.tags?.some((tag: string) => tag.toLowerCase().includes(term))
      )
    })
  }, [artifacts, searchTerm, projectNameMap])

  // Map artifacts to ArtifactCard format
  const artifactCards = useMemo(() => {
    if (!filteredArtifacts) return []
    return filteredArtifacts.map((artifact: any) => {
      // Extract title with fallback chain
      let artifactTitle = artifact.title
      if (!artifactTitle && artifact.data?.title) {
        artifactTitle = artifact.data.title
      }
      if (!artifactTitle && artifact.type === 'report' && artifact.data?.markdown) {
        const match = artifact.data.markdown.match(/^#\s+(.+)$/m)
        if (match) {
          artifactTitle = match[1].trim()
        }
      }
      if (!artifactTitle) {
        artifactTitle = artifact.type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Artifact'
      }

      // Format timestamp from updatedAt or createdAt
      const timestamp = artifact.updatedAt
        ? formatDistanceToNow(new Date(artifact.updatedAt), { addSuffix: true, short: true })
        : artifact.createdAt
        ? formatDistanceToNow(new Date(artifact.createdAt), { addSuffix: true, short: true })
        : 'unknown'

      // Build summary from project name (breadcrumb path)
      const projectName = artifact.projectId ? projectNameMap.get(artifact.projectId) || 'Untitled Project' : 'No Project'
      const summary = projectName

      // Use artifact type as tag
      const tag = artifact.type || undefined

      return {
        title: artifactTitle,
        timestamp,
        summary,
        tag,
        artifactId: artifact._id,
        projectId: artifact.projectId
      }
    })
  }, [filteredArtifacts, projectNameMap])

  const breadcrumbItems = [
    { label: 'Files', href: '/dashboard/notes' },
    { label: 'Artifacts' }
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

        {/* Artifact Cards - Responsive grid: 1 column mobile, 2 columns desktop */}
        <div className="box-border gap-[20px] grid grid-cols-1 md:grid-cols-2 grid-rows-auto px-0 py-[8px] relative shrink-0 w-full mt-4 md:mt-0">
          {artifacts === undefined ? (
            // Loading state
            <div className="col-span-1 md:col-span-2 text-[hsl(var(--assignment-text-subtle))]">Loading artifacts...</div>
          ) : artifactCards.length === 0 ? (
            // Empty state
            <div className="col-span-1 md:col-span-2 text-[hsl(var(--assignment-text-subtle))]">
              {searchTerm ? 'No artifacts found' : 'No artifacts yet'}
            </div>
          ) : (
            artifactCards.map((artifact) => {
              const handleClick = () => {
                if (artifact.projectId && artifact.artifactId) {
                  window.location.href = `/dashboard/living-projects/${artifact.projectId}/gallery?id=${artifact.artifactId}`
                }
              }
              return (
                <BaseCard
                  key={artifact.artifactId}
                  variant="artifact"
                  title={artifact.title}
                  timestamp={artifact.timestamp}
                  summary={artifact.summary}
                  tag={artifact.tag}
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

