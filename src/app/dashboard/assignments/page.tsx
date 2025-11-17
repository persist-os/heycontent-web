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
 * AssignmentCardWithMessage - Fetches latest message for assignment card
 * 
 * Fetches project-scoped conversation and latest message to show in summary
 * Uses userId from parent component for conversation access
 */
function AssignmentCardWithMessage({ assignment, userId }: { assignment: any, userId: string | null }) {
  // Fetch project-scoped conversation (use userId from parent, not projectUserId)
  const conversation = useQuery(
    api.chatQueries.getProjectScopedConversation,
    assignment.projectId && userId ? {
      projectId: assignment.projectId as any,
      userId: userId
    } : 'skip'
  )

  // Fetch latest messages from conversation (get more to find user message)
  const latestMessages = useQuery(
    api.chatQueries.getRecentMessages,
    conversation?._id ? {
      conversationId: conversation._id,
      limit: 5  // Get more messages to find a user message
    } : 'skip'
  )

  // Get latest message content for summary (prefer user messages, then assistant)
  const latestMessage = useMemo(() => {
    if (!latestMessages || latestMessages.length === 0) return null
    
    // Prefer user messages, then assistant messages
    const userMessage = latestMessages.find((msg: any) => msg.role === 'user')
    const assistantMessage = latestMessages.find((msg: any) => msg.role === 'assistant')
    
    return userMessage || assistantMessage || latestMessages[0]
  }, [latestMessages])

  const messagePreview = latestMessage?.content 
    ? (latestMessage.content.length > 120 
        ? latestMessage.content.substring(0, 120) + '...' 
        : latestMessage.content)
    : null

  // Use message preview in summary if available, otherwise use original summary
  const summary = messagePreview || assignment.summary

  const handleClick = () => {
    if (assignment.projectId) {
      window.location.href = `/dashboard/living-projects/${assignment.projectId}/assignment`
    }
  }

  return (
    <BaseCard
      variant={assignment.isActive ? "assignment" : "default"}
      title={assignment.title}
      timestamp={assignment.timestamp}
      summary={summary}
      path={assignment.path}
      tag={assignment.tag}
      onClick={handleClick}
      className={!assignment.isActive ? "bg-[hsl(var(--notes-surface-dim))] border-2 border-[hsl(var(--notes-surface-dim))]" : undefined}
    />
  )
}

/**
 * Assignments Page - Matches Figma design exactly
 * 
 * Figma node-id: 1238-1987
 * Layout: Breadcrumb, SearchBar, AssignmentCard list
 * Uses real data from Convex queries (Pattern: HomeScreen.tsx)
 */
export default function AssignmentsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Get user ID on component mount (Pattern: HomeScreen.tsx)
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

  // Fetch projects from Convex (Pattern: HomeScreen.tsx)
  const projects = useQuery(
    api.projectsQueries.getByUser,
    userId ? { userId } : 'skip'
  )

  // Filter projects by search term
  const filteredProjects = useMemo(() => {
    if (!projects || !searchTerm) return projects || []
    const term = searchTerm.toLowerCase()
    return projects.filter((project: any) => 
      project.name?.toLowerCase().includes(term) ||
      project.description?.toLowerCase().includes(term)
    )
  }, [projects, searchTerm])

  // Map projects to AssignmentCard format
  const assignments = useMemo(() => {
    if (!filteredProjects) return []
    return filteredProjects.map((project: any) => {
      // Determine if active (status is not "sleeping" or "archived")
      const isActive = project.status !== 'sleeping' && project.status !== 'archived'
      
      // Format timestamp from updatedAt or createdAt
      const timestamp = project.updatedAt
        ? formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true, short: true })
        : project.createdAt
        ? formatDistanceToNow(new Date(project.createdAt), { addSuffix: true, short: true })
        : 'unknown'

      // Build summary from available data - prioritize content counts
      const summaryParts: string[] = []
      if (project.conversationCount > 0) {
        summaryParts.push(`${project.conversationCount} conversation${project.conversationCount !== 1 ? 's' : ''}`)
      }
      if (project.noteCount > 0) {
        summaryParts.push(`${project.noteCount} note${project.noteCount !== 1 ? 's' : ''}`)
      }
      if (project.totalContent > 0 && summaryParts.length === 0) {
        summaryParts.push(`${project.totalContent} item${project.totalContent !== 1 ? 's' : ''}`)
      }
      const summary = summaryParts.length > 0 
        ? summaryParts.join(' • ')
        : project.description || 'No content yet'

      // Show status as tag if available (not default/active)
      const tag = project.status && project.status !== 'active' && project.status !== 'default' 
        ? project.status 
        : undefined

      // Path can show additional context - removed "Intelligence enabled"
      const path = undefined

      return {
        title: project.name || 'Untitled Assignment',
        timestamp,
        summary,
        path,
        tag,
        isActive,
        projectId: project._id,
        projectUserId: project.userId
      }
    })
  }, [filteredProjects])

  const breadcrumbItems = [
    { label: 'Files', href: '/dashboard/notes' },
    { label: 'Assignments' }
  ]

  return (
    <div className="min-h-screen bg-[hsl(var(--assignment-bg))] relative size-full px-4 md:px-0">
      {/* Main Content - Layout handles navigation spacing automatically */}
      <div className="w-full md:w-[1124px] mx-auto">
        {/* Breadcrumb - Responsive typography */}
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Search Bar */}
        <div className="box-border content-stretch flex flex-col gap-2 md:gap-[10px] items-start px-0 py-2 md:py-[8px] relative shrink-0 w-full">
          <SearchBar value={searchTerm} onChange={setSearchTerm} />
        </div>

        {/* Assignment Cards */}
        <div className="content-stretch flex flex-col gap-4 md:gap-[16px] items-start relative shrink-0 w-full mt-2 md:mt-0">
          {projects === undefined ? (
            // Loading state - Responsive typography
            <div className="text-[hsl(var(--assignment-text-subtle))] text-sm md:text-base py-4 md:py-0">
              Loading assignments...
            </div>
          ) : assignments.length === 0 ? (
            // Empty state - Responsive typography
            <div className="text-[hsl(var(--assignment-text-subtle))] text-sm md:text-base py-4 md:py-0">
              {searchTerm ? 'No assignments found' : 'No assignments yet'}
            </div>
          ) : (
            assignments.map((assignment) => (
              <AssignmentCardWithMessage
                key={assignment.projectId}
                assignment={assignment}
                userId={userId}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

