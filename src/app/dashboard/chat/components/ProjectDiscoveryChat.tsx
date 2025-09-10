'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { MessageSquare, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/app/context/auth-context'

// Project Discovery specific components
import { FingerprintDisplay } from './notepad/FingerprintDisplay'

// Project discovery context and hooks
import { useProjectFingerprintStore } from '@/store/project-fingerprint-store'

// Temporary mock implementation for development
const mockUseProjectDiscoveryContext = (projectId?: string, fingerprintId?: string) => ({
  projectId,
  fingerprintId,
  currentFingerprint: null,
  isInitializing: false,
  isLoading: false,
  error: null,
  initializeProjectDiscovery: () => Promise.resolve(),
  updateFingerprint: () => Promise.resolve(),
  finalizeFingerprint: () => Promise.resolve(),
  resetDiscovery: () => Promise.resolve(),
  discoveryProgress: {
    hasBasicInfo: false,
    hasGoals: false,
    hasTimeline: false,
    hasOutputs: false,
    hasUI: false,
    isComplete: false
  }
})

interface ProjectDiscoveryChatProps {
  projectId?: string
  fingerprintId?: string
}

const ProjectDiscoveryChat: React.FC<ProjectDiscoveryChatProps> = ({
  projectId,
  fingerprintId
}) => {
  const { theme } = useTheme()

  // Project discovery context
  const projectDiscovery = mockUseProjectDiscoveryContext(projectId, fingerprintId)
  const fingerprintStore = useProjectFingerprintStore()

  // Authentication and user data
  const { firebaseUser } = useAuth()
  const authData = {
    user: firebaseUser,
    userId: firebaseUser?.uid,
    userEmail: firebaseUser?.email,
    isAuthenticated: !!firebaseUser,
    isLoading: firebaseUser === undefined
  }

  // Theme-aware colors
  const themeColors = {
    accentColor: theme === 'dark' ? 'text-primary' : 'text-purple-600',
    accentBg: theme === 'dark' ? 'bg-primary' : 'bg-purple-600',
    accentBgHover: theme === 'dark' ? 'hover:bg-primary/90' : 'hover:bg-purple-700',
    accentBgLight: theme === 'dark' ? 'bg-primary/10' : 'bg-purple-600/10',
    accentBorder: theme === 'dark' ? 'border-primary' : 'border-purple-600'
  }

  // UI state
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'fingerprint'>('chat')
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<Array<{id: string, content: string, role: 'user' | 'assistant'}>>([])
  const [isLoading, setIsLoading] = useState(false)

  // Check mobile state
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Initialize project discovery context
  useEffect(() => {
    if (authData.userId && projectId) {
      projectDiscovery.initializeProjectDiscovery()
    }
  }, [authData.userId, projectId, projectDiscovery])

  // Handle sending messages (simplified for now)
  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      content,
      role: 'user' as const
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Simulate AI response for project discovery
    setTimeout(() => {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: `I understand you're working on: "${content}". This is great context for building your project fingerprint. What are your main goals for this project?`,
        role: 'assistant' as const
      }
      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
    }, 1000)
  }, [])

  // Handle tab switching
  const switchToTab = useCallback((tab: 'chat' | 'fingerprint') => {
    if (isMobile) {
      setActiveTab(tab)
    }
  }, [isMobile])

  // Loading state
  const combinedLoading = isLoading || authData.isLoading || projectDiscovery.isInitializing

  if (!authData.isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please sign in to continue with project discovery.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-background">
      {/* Main Chat Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h1 className="text-xl font-semibold">Project Discovery</h1>
            <p className="text-sm text-muted-foreground">
              Building your project's AI fingerprint
            </p>
          </div>
          {projectDiscovery.discoveryProgress.isComplete && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-700 dark:text-green-300">Complete</span>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4 max-w-md">
                  <div className="space-y-3">
                    <h2 className="text-2xl font-semibold">Let's Get Started</h2>
                    <p className="text-muted-foreground">
                      Tell me about your project. What are you working on? I'll help create a comprehensive AI fingerprint that evolves with your project.
                    </p>
                  </div>
                  {combinedLoading && (
                    <div className="flex flex-col items-center space-y-3">
                      <div className={`h-8 w-8 rounded-full ${themeColors.accentBgLight} animate-pulse`}></div>
                      <p className="text-sm text-muted-foreground">Initializing project discovery...</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 max-w-4xl",
                    message.role === 'user' ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    message.role === 'user'
                      ? `${themeColors.accentBg} text-white`
                      : "bg-muted"
                  )}>
                    {message.role === 'user' ? (
                      <span className="text-sm font-medium">U</span>
                    ) : (
                      <span className="text-sm">AI</span>
                    )}
                  </div>
                  <div className={cn(
                    "rounded-lg px-4 py-2 max-w-[70%]",
                    message.role === 'user'
                      ? `${themeColors.accentBg} text-white`
                      : "bg-muted"
                  )}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            {combinedLoading && (
              <div className="flex gap-3 max-w-4xl">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">AI</span>
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce animate-delay-100"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce animate-delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                placeholder="Tell me about your project..."
                className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={combinedLoading}
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || combinedLoading}
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors",
                  inputValue.trim() && !combinedLoading
                    ? `${themeColors.accentBg} ${themeColors.accentBgHover} text-white`
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        {isMobile && (
          <div className="sm:hidden border-t border-border bg-background">
            <div className="flex">
              <button
                onClick={() => switchToTab('chat')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 px-4 relative transition-all duration-200",
                  activeTab === 'chat'
                    ? "text-foreground bg-muted/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm font-medium">Chat</span>
                {activeTab === 'chat' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>

              <button
                onClick={() => switchToTab('fingerprint')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 px-4 relative transition-all duration-200",
                  activeTab === 'fingerprint'
                    ? "text-foreground bg-muted/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">Fingerprint</span>
                {activeTab === 'fingerprint' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile: Show fingerprint content when activeTab is 'fingerprint' */}
      {isMobile && activeTab === 'fingerprint' && (
        <div className="flex-1 overflow-hidden">
          <FingerprintDisplay
            isOpen={true}
            onClose={() => switchToTab('chat')}
            width={400}
            onWidthChange={() => {}}
            style={{}}
            isMobile={true}
            activeTab={activeTab}
            onScrollPositionChange={() => {}}
          />
        </div>
      )}

      {/* Desktop: Always show fingerprint display */}
      {!isMobile && (
        <FingerprintDisplay
          isOpen={true}
          onClose={() => {}}
          width={400}
          onWidthChange={() => {}}
          style={{}}
          isMobile={false}
          onScrollPositionChange={() => {}}
        />
      )}
    </div>
  )
}

export default ProjectDiscoveryChat