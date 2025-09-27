import React from 'react'
import { AmbientInsightsContainer } from './ambient_insights/AmbientInsightsContainer'

interface EmptyStateProps {
  isMobile: boolean
  activeTab: string
  hasPersona: boolean
  authData: any
  themeColors: any
  handleNewChat: () => void
  handleSendMessageWithUpdateCheck: (message: string, fileAttachments?: any[]) => void
  clearContentContext: () => void
}

export function EmptyState({
  isMobile,
  activeTab,
  hasPersona,
  authData,
  themeColors,
  handleNewChat,
  handleSendMessageWithUpdateCheck,
  clearContentContext
}: EmptyStateProps) {
  // Don't show ambient insights when on mobile notes tab
  if (isMobile && activeTab === 'notes') {
    return null
  }

  // Always show ambient insights - onboarding has been eliminated
  return (
    <div className="flex-1 flex flex-col">
      <AmbientInsightsContainer 
        userId={authData.userId}
        handleSendMessage={(msg, context) => {
          handleNewChat()
          setTimeout(() => {
            if (context) clearContentContext()
            handleSendMessageWithUpdateCheck(msg)
          }, 0)
        }}
      />
    </div>
  )
}
