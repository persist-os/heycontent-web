import React from 'react'
import { PanelExpandButton } from './PanelExpandButton'

interface ChatContainerLayoutProps {
  children: React.ReactNode
  isMobile: boolean
  splitScreen: any
  getMainContentStyle: () => React.CSSProperties
}

export function ChatContainerLayout({ 
  children, 
  isMobile, 
  splitScreen, 
  getMainContentStyle 
}: ChatContainerLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Main chat content */}
      <div 
        data-chat-container
        className="flex flex-col h-screen bg-background relative group"
        style={!isMobile ? splitScreen.getChatContainerStyle() : getMainContentStyle()}
      >
        {/* Chat Panel Expand Button */}
        {!isMobile && (
          <PanelExpandButton
            panelType="chat"
            panelState={splitScreen.panelState}
            onExpand={splitScreen.setChatFullScreen}
            onRestore={splitScreen.restoreSplitView}
          />
        )}
        {children}
      </div>
    </div>
  )
}
