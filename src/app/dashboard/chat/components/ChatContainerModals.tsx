import React from 'react'
import { ChatOverlay } from './ChatOverlay'
import type { OverlayContent } from '../types/chat-container.types'

interface ChatContainerModalsProps {
  overlayContent: OverlayContent | null
  handleOverlayClose: () => void
}

export function ChatContainerModals({
  overlayContent,
  handleOverlayClose
}: ChatContainerModalsProps) {
  return (
    <>
      {/* Chat Overlay */}
      {overlayContent && (
        <ChatOverlay
          contentType={overlayContent.contentType}
          contentId={overlayContent.contentId}
          onClose={handleOverlayClose}
        />
      )}
    </>
  )
}
