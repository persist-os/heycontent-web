/**
 * WIDGET DASHBOARD TYPES
 * 
 * Shared type definitions for widget dashboard components
 */

export interface WidgetOutput {
  _id: string
  outputId: string
  widgetId: string
  projectId: string
  userId: string
  noteId: string
  noteTitle?: string
  prompts: Array<{
    text: string
    priority: number
  }>
  createdAt: number
}

export interface ConnectedNote {
  _id: string
  userId: string
  title: string
  content?: string
  important?: boolean
  platform?: string
  references?: string[]
  type?: string
  tags: string[]
  analysis?: string
  images?: Array<{
    url: string
    filename: string
    originalFilename?: string
    uploadedAt: number
    size?: number
    mimeType?: string
    width?: number
    height?: number
  }>
  sourceConversationId?: string
  folderId?: string
  createdAt: number
  updatedAt: number
  titleGenerated?: boolean
  typeGenerated?: boolean
  widgetId?: string
  isWidgetOutput?: boolean
  projectId?: string
}

