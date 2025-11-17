import React from 'react'
import { ChatPanel } from '../dialogue/ChatPanel'

interface ChatMobileViewProps {
  messageList: any[]
  onInputPopulate: (text: string) => void
  onQuoteToNotepad: (text: string) => void
  widgetOutputId?: string
  suggestions: string[]
  sendMessage: (message: string, fileAttachments?: any[]) => void
  startNewConversation: () => void
  isLoading: boolean
  error: string | null
  inputComponent: React.ReactNode
}

export function ChatMobileView({
  messageList,
  onInputPopulate,
  onQuoteToNotepad,
  widgetOutputId,
  suggestions,
  sendMessage,
  startNewConversation,
  isLoading,
  error,
  inputComponent
}: ChatMobileViewProps) {
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Messages - Scrollable */}
      {/* Safe area handled by MobileBottomNav's safe-area-inset-bottom class */}
      <div className="flex-1 overflow-y-auto">
        <ChatPanel 
          messages={messageList}
          onInputPopulate={onInputPopulate}
          onQuoteToNotepad={onQuoteToNotepad}
          widgetOutputId={widgetOutputId}
          isFullScreen={false}
          onRestoreNotepad={() => {}}
          onCloseChat={() => {}}
          suggestions={suggestions}
          sendMessage={sendMessage}
          startNewConversation={startNewConversation}
          isLoading={isLoading}
          error={error}
        />
      </div>
      
      {/* Input Bar - Fixed, no bottom padding */}
      <div className="flex-shrink-0 border-t border-primary/20 bg-card/30 backdrop-blur-sm">
        {inputComponent}
      </div>
    </div>
  )
}

