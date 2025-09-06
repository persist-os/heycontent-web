'use client'

import React, { useState } from 'react'
import { Send, MessageSquare, Search, BookOpen, Users } from 'lucide-react'

interface Source {
  id: string
  type: 'note' | 'conversation'
  title: string
  relevance: number
}

interface ConversationMessage {
  id: string
  sender: 'user' | 'assistant'
  content: string
  timestamp: string
  sources?: string[]
}

const sources: Source[] = [
  {
    id: 'note-1',
    type: 'note',
    title: 'Project Requirements',
    relevance: 0.94
  },
  {
    id: 'conversation-1',
    type: 'conversation', 
    title: 'Previous discussion',
    relevance: 0.87
  }
]

const conversation: ConversationMessage[] = [
  {
    id: '1',
    sender: 'user',
    content: "What should I prioritize for next sprint?",
    timestamp: '2:34 PM'
  },
  {
    id: '2',
    sender: 'assistant',
    content: "Looking at your **Project Requirements** and our previous discussion, the authentication work keeps surfacing as the key blocker.\n\nThe mobile improvements would pair naturally with this—you'll be testing auth across devices anyway.",
    timestamp: '2:35 PM',
    sources: ['note-1', 'conversation-1']
  },
  {
    id: '3',
    sender: 'user',
    content: "Right, that makes sense. Good point about the testing synergy.",
    timestamp: '2:37 PM'
  }
]

function ContextualSources({ sources: sourceIds }: { sources?: string[] }) {
  if (!sourceIds || sourceIds.length === 0) return null

  const relevantSources = sourceIds.map(id => sources.find(s => s.id === id)).filter(Boolean) as Source[]

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Search className="w-4 h-4 text-blue-500" />
        <span className="text-xs text-slate-500 dark:text-slate-400">Relevant sources:</span>
      </div>
      <div className="flex gap-2">
        {relevantSources.map((source) => (
          <div key={source.id} className="flex items-center gap-1 bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/30 rounded-lg px-2 py-1">
            {source.type === 'note' ? (
              <BookOpen className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            ) : (
              <Users className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            )}
            <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
              {source.title}
            </span>
            <span className="text-xs text-blue-500/70 dark:text-blue-400/70">
              {Math.round(source.relevance * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ContextualShowcase() {
  const [inputValue, setInputValue] = useState('')

  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50/30 dark:from-slate-900 dark:to-slate-900/90 relative overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-100/20 to-cyan-100/10 dark:from-blue-900/8 dark:to-cyan-900/4 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-br from-indigo-100/15 to-purple-100/8 dark:from-indigo-900/6 dark:to-purple-900/3 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-8 sm:px-12 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-light text-slate-900 dark:text-slate-100 leading-tight mb-6">
            Naturally intelligent
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
            Conversations that remember. Notes that connect. Understanding that grows.
          </p>
        </div>

        {/* Chat Container Preview */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-800 dark:bg-slate-200 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white dark:text-slate-800" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">HeyContext</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Active session</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Live</span>
              </div>
            </div>

            {/* Chat Messages - Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              <div className="max-w-4xl mx-auto relative">
                <div className="space-y-6">
                  {conversation.map((message) => (
                    <div key={message.id} className="relative">
                      {message.sender === 'assistant' && message.sources && message.sources.length > 0 && (
                        <ContextualSources sources={message.sources} />
                      )}
                      
                      <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                          <div className={`inline-block px-6 py-4 rounded-2xl ${
                            message.sender === 'user' 
                              ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900' 
                              : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white'
                          }`}>
                            <div className={`text-sm leading-relaxed max-w-none ${
                              message.sender === 'user' 
                                ? 'text-white dark:text-slate-900' 
                                : 'text-slate-800 dark:text-white'
                            }`}>
                              <div dangerouslySetInnerHTML={{ 
                                __html: message.content
                                  .replace(/\*\*(.*?)\*\*/g, `<strong class="${message.sender === 'user' ? 'text-white dark:text-slate-900' : 'text-slate-800 dark:text-white'}">$1</strong>`)
                                  .replace(/\n\n/g, '<br><br>')
                                  .replace(/\n/g, '<br>')
                              }} />
                            </div>
                          </div>
                          <div className={`text-xs text-slate-500 dark:text-slate-400 mt-2 ${
                            message.sender === 'user' ? 'text-right' : 'text-left'
                          }`}>
                            {message.timestamp}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Input Area - Fixed at Bottom */}
            <div className="border-t border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 p-4 shrink-0">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Message HeyContext..."
                      className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400"
                      disabled
                    />
                  </div>
                  <button 
                    className="flex-shrink-0 h-12 w-12 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg transition-colors flex items-center justify-center opacity-50" 
                    aria-label="Send message"
                    disabled
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Text */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-slate-100/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-full px-8 py-4 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-all duration-300 hover:scale-105">
            <p className="text-slate-600 dark:text-slate-400 font-light">
              Simply works the way you think
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
