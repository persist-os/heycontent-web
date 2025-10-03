/**
 * WIDGET DATA HOOK
 * 
 * Centralized hook for fetching all widget-related data:
 * - Widget config
 * - Outputs
 * - Crystals
 * - Shards
 * - Conversations
 * - Notes
 */

import { useEffect, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import type { WidgetConfig } from '@/types/projectWidgets'

interface UseWidgetDataProps {
  userId: string | null
  projectId: Id<"projects">
  widgetId: string
}

export function useWidgetData({ userId, projectId, widgetId }: UseWidgetDataProps) {
  const [widget, setWidget] = useState<WidgetConfig | null>(null)

  // Fetch project widgets to get widget config
  const projectWidgets = useQuery(
    api.projectWidgetsQueries.getProjectWidgetsByProject,
    userId && projectId ? { userId, projectId } : 'skip'
  )

  // Extract the specific widget
  useEffect(() => {
    if (projectWidgets?.widgets) {
      const foundWidget = projectWidgets.widgets.find(
        (w: WidgetConfig) => w.widget_id === widgetId
      )
      setWidget(foundWidget as WidgetConfig || null)
    }
  }, [projectWidgets, widgetId])

  // Fetch outputs
  const outputs = useQuery(
    api.widgetOutputsQueries.getWidgetOutputData,
    userId && widgetId ? {
      userId,
      filters: { widgetId },
      limit: 50,
      orderBy: 'desc'
    } : 'skip'
  )

  // Fetch all crystals for user, then filter by widgetId
  const allCrystals = useQuery(
    api.crystalQueries.getCrystalData,
    userId ? {
      userId,
      table: 'crystals',
      limit: 500,
      orderBy: 'desc'
    } : 'skip'
  )

  // Filter crystals by widgetId
  const crystals = allCrystals?.filter((crystal: any) => crystal.widgetId === widgetId) || []

  // Fetch all shards for user, then filter by widgetId
  const allShards = useQuery(
    api.crystalQueries.getCrystalData,
    userId ? {
      userId,
      table: 'crystal_shards',
      limit: 500,
      orderBy: 'desc'
    } : 'skip'
  )

  // Filter shards by widgetId
  const shards = allShards?.filter((shard: any) => shard.widgetId === widgetId) || []

  // Fetch conversations for this widget
  const conversations = useQuery(
    api.chatQueries.getHistory,
    userId ? { userId, limit: 100 } : 'skip'
  )

  // Filter conversations by widgetId
  const widgetConversations = conversations?.filter(
    (conv: any) => conv.widgetId === widgetId
  ) || []

  // Get unique noteIds from outputs as strings
  const noteIds = outputs 
    ? [...new Set(outputs.map((output: any) => output.noteId).filter(Boolean))] as string[]
    : []

  // Fetch notes in batches of 5
  const note1 = useQuery(
    api.noteQueries.getNote,
    noteIds[0] && userId ? { noteId: noteIds[0] as string, userId } : 'skip'
  )
  const note2 = useQuery(
    api.noteQueries.getNote,
    noteIds[1] && userId ? { noteId: noteIds[1] as string, userId } : 'skip'
  )
  const note3 = useQuery(
    api.noteQueries.getNote,
    noteIds[2] && userId ? { noteId: noteIds[2] as string, userId } : 'skip'
  )
  const note4 = useQuery(
    api.noteQueries.getNote,
    noteIds[3] && userId ? { noteId: noteIds[3] as string, userId } : 'skip'
  )
  const note5 = useQuery(
    api.noteQueries.getNote,
    noteIds[4] && userId ? { noteId: noteIds[4] as string, userId } : 'skip'
  )

  const connectedNotes = [note1, note2, note3, note4, note5]
    .filter(note => note !== null && note !== undefined)

  return {
    widget,
    outputs: outputs || [],
    crystals,
    shards,
    conversations: widgetConversations,
    notes: connectedNotes,
    isLoading: !userId || !widget
  }
}

