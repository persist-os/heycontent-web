import React from 'react'
import { AmbientInsightsContainer } from './ambient_insights/AmbientInsightsContainer'
import { FullHeightContainer } from '@/components/ui/layout'

interface EmptyStateProps {
  isMobile: boolean
  activeTab: string
  authData: any
  themeColors: any
  handleNewChat: () => void
  handleSendMessageWithUpdateCheck: (message: string) => void
  clearContentContext: () => void
}

export function EmptyState({
  isMobile,
  activeTab,
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
    <FullHeightContainer className="flex-1">
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
    </FullHeightContainer>
  )
}
