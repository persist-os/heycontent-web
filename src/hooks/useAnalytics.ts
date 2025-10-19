'use client'

import { track } from '@/lib/analytics'

export function useAnalytics() {
  return {
    trackWidgetOpen: (widgetType: string) => 
      track('widget_open', { widget_type: widgetType }),
    
    trackProjectOpen: (projectId: string) => 
      track('project_open', { project_id: projectId }),
    
    trackProjectCreate: () => 
      track('project_create'),
    
    trackNoteCreate: () => 
      track('note_create'),
    
    trackChatMessage: (messageLength: number) => 
      track('chat_message_sent', { message_length: messageLength }),
  }
}

