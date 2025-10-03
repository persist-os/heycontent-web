/**
 * CONVERSATION THREADS
 * 
 * Minimal, elegant display of conversations related to this widget
 */

'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { ChevronDown, ChevronUp, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Message {
  role: string
  content: string
  timestamp?: number
}

interface Conversation {
  _id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

interface ConversationThreadsProps {
  conversations: Conversation[]
}

export function ConversationThreads({ conversations }: ConversationThreadsProps) {
  const router = useRouter()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [showDetailsIds, setShowDetailsIds] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  const toggleDetails = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newDetails = new Set(showDetailsIds)
    if (newDetails.has(id)) {
      newDetails.delete(id)
    } else {
      newDetails.add(id)
    }
    setShowDetailsIds(newDetails)
  }

  const handleViewConversation = (conversationId: string) => {
    router.push(`/dashboard/chat?conversationId=${conversationId}`)
  }

  if (conversations.length === 0) {
    return null
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 24) {
      return 'Today'
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)} days ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <MessageCircle className="w-5 h-5 text-green-500" />
        <h3 className="text-lg font-light text-foreground">
          Conversations
          <span className="text-muted-foreground ml-2 text-sm">
            {conversations.length}
          </span>
        </h3>
      </div>

      <div className="space-y-2">
        {conversations.map((conversation) => {
          const isExpanded = expandedIds.has(conversation._id)
          const messageCount = conversation.messages?.length || 0
          const lastMessage = conversation.messages?.[conversation.messages.length - 1]
          
          return (
            <Card
              key={conversation._id}
              className="border-border/30 hover:border-green-400/40 transition-colors duration-300"
            >
              <button
                onClick={() => toggleExpand(conversation._id)}
                className="w-full text-left p-4 hover:bg-muted/20 transition-colors duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <h4 className="font-medium text-foreground">
                      {conversation.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{messageCount} messages</span>
                      <span className="text-muted-foreground/50">•</span>
                      <span>{formatDate(conversation.updatedAt)}</span>
                    </div>
                  </div>
                  
                  <div className="text-muted-foreground">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-border/20 pt-3">
                  {lastMessage && (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground/70">Last message</div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {lastMessage.content.slice(0, 200)}
                        {lastMessage.content.length > 200 ? '...' : ''}
                      </p>
                    </div>
                  )}
                  
                  <button
                    onClick={() => handleViewConversation(conversation._id)}
                    className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors duration-300"
                  >
                    View full conversation →
                  </button>

                  {/* Additional Details Toggle */}
                  <div className="pt-2">
                    <button
                      onClick={(e) => toggleDetails(conversation._id, e)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-300 flex items-center gap-1"
                    >
                      {showDetailsIds.has(conversation._id) ? (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          Hide technical details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          Show technical details
                        </>
                      )}
                    </button>

                    {showDetailsIds.has(conversation._id) && (
                      <div className="mt-3 p-3 bg-muted/20 rounded border border-border/30 space-y-2">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="col-span-2">
                            <div className="text-muted-foreground/70">Conversation ID</div>
                            <div className="font-mono text-foreground/80 break-all">
                              {conversation._id}
                            </div>
                          </div>

                          <div>
                            <div className="text-muted-foreground/70">Created</div>
                            <div className="text-foreground/80">
                              {new Date(conversation.createdAt).toLocaleString()}
                            </div>
                          </div>

                          <div>
                            <div className="text-muted-foreground/70">Last Updated</div>
                            <div className="text-foreground/80">
                              {new Date(conversation.updatedAt).toLocaleString()}
                            </div>
                          </div>

                          {(conversation as any).widgetOutputId && (
                            <div className="col-span-2">
                              <div className="text-muted-foreground/70">Widget Output ID</div>
                              <div className="font-mono text-foreground/80 break-all text-[10px]">
                                {(conversation as any).widgetOutputId}
                              </div>
                            </div>
                          )}

                          {(conversation as any).conversationType && (
                            <div>
                              <div className="text-muted-foreground/70">Type</div>
                              <div className="text-foreground/80">
                                {(conversation as any).conversationType}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

