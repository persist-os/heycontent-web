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
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="max-w-md space-y-6">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent w-2/3" />
          <div className="space-y-3">
            <h2 className="text-2xl font-light tracking-tight text-foreground">
              Authentication required
            </h2>
            <p className="text-muted-foreground/80 leading-relaxed ml-1">
              Please sign in to begin your project discovery journey.
            </p>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-background">
      {/* Main Chat Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Status indicator for discovery progress */}
        {projectDiscovery.discoveryProgress.isComplete && (
          <div className="px-8 py-4 border-b border-border/20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400/60 rounded-full" />
              <span className="text-sm font-medium text-foreground/80">Discovery complete</span>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center px-8">
                <div className="max-w-lg space-y-8">
                  <div className="h-px bg-gradient-to-r from-blue-400/60 via-transparent to-transparent w-3/4" />
                  
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-baseline gap-4">
                        <h2 className="text-4xl font-light tracking-tight text-foreground">
                          Begin
                        </h2>
                        <div className="h-px bg-border/40 flex-1 mb-2" />
                      </div>
                      <h3 className="text-xl font-medium text-muted-foreground ml-6">
                        together
                      </h3>
                    </div>
                    
                    <div className="ml-1 space-y-4">
                      <p className="text-muted-foreground/80 leading-relaxed text-base">
                        Share what you're working on. I'll listen, ask thoughtful questions, 
                        and help create an AI fingerprint that truly understands your project.
                      </p>
                      
                      {combinedLoading && (
                        <div className="flex items-center gap-3 mt-6">
                          <div className="w-5 h-5 border-2 border-blue-400/60 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm text-muted-foreground/70">
                            Preparing conversation space...
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-4 max-w-4xl",
                    message.role === 'user' ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border transition-colors duration-300",
                    message.role === 'user'
                      ? "bg-foreground text-background border-foreground/20"
                      : "bg-muted/50 border-border/30"
                  )}>
                    {message.role === 'user' ? (
                      <span className="text-sm font-medium">You</span>
                    ) : (
                      <span className="text-sm font-medium">AI</span>
                    )}
                  </div>
                  <div className={cn(
                    "rounded-lg px-5 py-3 max-w-[75%] transition-all duration-300",
                    message.role === 'user'
                      ? "bg-foreground text-background border-l-2 border-foreground/20"
                      : "bg-muted/30 border-l-2 border-blue-400/60"
                  )}>
                    <p className="text-base leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            {combinedLoading && (
              <div className="flex gap-4 max-w-4xl">
                <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0 border border-border/30">
                  <div className="w-4 h-4 border-2 border-blue-400/60 border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="bg-muted/30 rounded-lg px-5 py-3 border-l-2 border-blue-400/60">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground/70">Thinking...</span>
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-pulse"></div>
                      <div className="w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area with anti-corporate styling */}
          <div className="border-t border-border/20 px-8 py-6">
            <div className="space-y-4">
              <div className="h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent w-1/2" />
              
              <div className="flex gap-4">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                  placeholder="What's on your mind about this project..."
                  className="flex-1 px-4 py-3 text-base border border-border/50 rounded-lg focus:outline-none focus:border-blue-400/60 transition-colors duration-300 bg-background"
                  disabled={combinedLoading}
                />
                <button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={!inputValue.trim() || combinedLoading}
                  className={cn(
                    "px-6 py-3 text-base rounded-lg transition-all duration-300",
                    inputValue.trim() && !combinedLoading
                      ? "bg-foreground text-background hover:bg-foreground/90 hover:scale-[1.02]"
                      : "bg-muted/50 text-muted-foreground cursor-not-allowed border border-border/30"
                  )}
                >
                  {combinedLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    'Share'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Tab Bar with anti-corporate styling */}
        {isMobile && (
          <div className="sm:hidden border-t border-border/20 bg-background">
            <div className="h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
            <div className="flex">
              <button
                onClick={() => switchToTab('chat')}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 py-4 px-4 relative transition-all duration-300",
                  activeTab === 'chat'
                    ? "text-foreground bg-muted/30"
                    : "text-muted-foreground hover:text-foreground/70 hover:bg-muted/20"
                )}
              >
                <span className="text-sm font-medium">Conversation</span>
                {activeTab === 'chat' && (
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
                )}
              </button>

              <button
                onClick={() => switchToTab('fingerprint')}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 py-4 px-4 relative transition-all duration-300",
                  activeTab === 'fingerprint'
                    ? "text-foreground bg-muted/30"
                    : "text-muted-foreground hover:text-foreground/70 hover:bg-muted/20"
                )}
              >
                <span className="text-sm font-medium">Intelligence</span>
                {activeTab === 'fingerprint' && (
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
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