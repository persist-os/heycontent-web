'use client'

import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'
import { X, Send, Copy, MessageSquare, FileText, Plus, ChevronRight, ChevronLeft, Search, BookOpen, Users } from 'lucide-react'
import { useTheme } from 'next-themes'
import { motion } from "framer-motion"
import { Loader2, ArrowRight } from 'lucide-react'

interface Source {
  id: string
  type: 'note' | 'conversation'
  title: string
  content: string
  timestamp: string
  relevance: number
}

interface ConversationMessage {
  id: string
  sender: 'user' | 'assistant'
  content: string
  timestamp: string
  sources?: string[]
  suggestions?: Array<{
    id: string
    text: string
    type: 'followup' | 'action'
  }>
}

interface DisplayOption {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
  category?: string
}

const sources: Source[] = [
  {
    id: 'note-1',
    type: 'note',
    title: 'Career Goals & Values',
    content: 'I want to work in environments that prioritize collaboration over competition. My ideal role would involve creative problem-solving and meaningful impact on users.',
    timestamp: '2 weeks ago',
    relevance: 0.95
  },
  {
    id: 'conversation-1',
    type: 'conversation',
    title: 'Previous job search discussion',
    content: 'We discussed how environment affects my focus and productivity. I mentioned preferring companies with strong work-life balance and supportive team cultures.',
    timestamp: '1 month ago',
    relevance: 0.88
  },
  {
    id: 'note-2',
    type: 'note',
    title: 'Work Environment Preferences',
    content: 'I thrive in collaborative, low-ego environments where people genuinely want to help each other succeed. Remote-friendly companies with good communication practices are important.',
    timestamp: '3 weeks ago',
    relevance: 0.82
  }
]

const conversation: ConversationMessage[] = [
  {
    id: '1',
    sender: 'user',
    content: "I've been applying to jobs, but it feels overwhelming. Part of me also wonders if moving would make things easier—or harder.",
    timestamp: '2:34 PM'
  },
  {
    id: '2',
    sender: 'assistant',
    content: "I hear you. Looking at your **Career Goals & Values** note from 2 weeks ago, you mentioned wanting environments that prioritize collaboration over competition. It makes sense that moving and job searching are tangled together for you.\n\nMaybe we can look at them as two threads of the same question: *where do you see yourself thriving, both in work and in daily life?*\n\nBased on your **Work Environment Preferences** note, you thrive in collaborative, low-ego environments. That could be a key filter for both location and company choices.",
    timestamp: '2:35 PM',
    sources: ['note-1', 'note-2']
  },
  {
    id: '3',
    sender: 'user',
    content: "Yeah, I don't just want any job. I want to land somewhere that feels like it fits who I am now, not just what's available.",
    timestamp: '2:36 PM'
  },
  {
    id: '4',
    sender: 'assistant',
    content: "That's exactly the right mindset. From our previous conversation about job searching, we discussed how environment affects your focus and productivity. You mentioned preferring companies with strong work-life balance and supportive team cultures.\n\nThat could be your north star: look for roles in places where you can build both a career and a life you won't feel disconnected from.",
    timestamp: '2:37 PM',
    sources: ['conversation-1']
  },
  {
    id: '5',
    sender: 'user',
    content: "So not just \"what's the job,\" but \"what's the setting where the job will actually feel sustainable.\"",
    timestamp: '2:38 PM'
  },
  {
    id: '6',
    sender: 'assistant',
    content: "Exactly. That frame can shift how you filter opportunities. Instead of scanning endless listings, you're asking: *does this role fit the kind of life I'm moving toward?* That's a calmer, more grounded way to search.\n\nHere are some ways to approach this:\n\n**1. Map your non-negotiables**\n- What environments help you focus?\n- Where do you feel most creative?\n- What kind of team dynamics energize you?\n\n**2. Research companies, not just roles**\n- Look at their values and culture\n- Check employee reviews on Glassdoor\n- See how they talk about work-life balance\n\n**3. Network with intention**\n- Reach out to people at companies you're curious about\n- Ask about day-to-day experience, not just job duties\n- Get a sense of the actual work environment",
    timestamp: '2:39 PM',
    suggestions: [
      {
        id: 's1',
        text: 'Create a list of my non-negotiables',
        type: 'action'
      },
      {
        id: 's2',
        text: 'Research 3 companies I\'m interested in',
        type: 'action'
      },
      {
        id: 's3',
        text: 'What questions should I ask in interviews?',
        type: 'followup'
      }
    ]
  }
]



function SmartSearchSources({ sources: sourceIds }: { sources?: string[] }) {
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

function SuggestionChips({ suggestions, onSuggestionClick }: { 
  suggestions?: Array<{ id: string; text: string; type: 'followup' | 'action' }>
  onSuggestionClick?: (suggestion: string) => void
}) {
  if (!suggestions || suggestions.length === 0) return null

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          onClick={() => onSuggestionClick?.(suggestion.text)}
          className="inline-flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 text-sm px-3 py-1.5 rounded-full transition-colors duration-200"
        >
          {suggestion.type === 'action' ? (
            <Plus className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
          {suggestion.text}
        </button>
      ))}
    </div>
  )
}

function InlineCommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [userInput, setUserInput] = useState('')

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="fixed z-[200] bg-background border border-border rounded-lg shadow-2xl overflow-hidden backdrop-blur-sm"
      style={{
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '400px',
        maxHeight: '500px'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <span className="text-sm font-medium">AI Assistant</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
          aria-label="Close command palette"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Input */}
      <div className="p-4 border-b border-border">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Ask AI to analyze, summarize, or expand..."
          className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          disabled
        />
      </div>

      {/* Commands */}
      <div className="max-h-80 overflow-y-auto">
        <div className="py-2">
          <div className="px-4 py-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              AI Actions
            </h3>
            <div className="space-y-0.5">
              <button
                className="w-full flex items-center gap-3 px-3 py-2 text-left transition-all duration-200 opacity-50 cursor-not-allowed"
                disabled
              >
                <div className="flex-shrink-0 text-muted-foreground">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Analyze this conversation</span>
              </button>
              <button
                className="w-full flex items-center gap-3 px-3 py-2 text-left transition-all duration-200 opacity-50 cursor-not-allowed"
                disabled
              >
                <div className="flex-shrink-0 text-muted-foreground">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Summarize key points</span>
              </button>
              <button
                className="w-full flex items-center gap-3 px-3 py-2 text-left transition-all duration-200 opacity-50 cursor-not-allowed"
                disabled
              >
                <div className="flex-shrink-0 text-muted-foreground">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Save as Smart Note</span>
              </button>
              <button
                className="w-full flex items-center gap-3 px-3 py-2 text-left transition-all duration-200 opacity-50 cursor-not-allowed"
                disabled
              >
                <div className="flex-shrink-0 text-muted-foreground">
                  <ChevronRight className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Expand on this idea</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground/80">
        Preview mode - AI features disabled
      </div>
    </motion.div>
  )
}

const MarkdownNotepad = forwardRef(function MarkdownNotepad({ 
  isOpen, 
  onClose, 
  width, 
  style,
  onOpenCommandPalette
}: {
  isOpen: boolean
  onClose: () => void
  width: number
  style: React.CSSProperties
  onOpenCommandPalette?: () => void
}, ref) {
  const [content, setContent] = useState(`# Job Search Strategy

## Key Insights from Today's Conversation

Based on our discussion about job searching and potential relocation, here are the main takeaways:

### Environment Matters
- **Collaboration over competition**: I thrive in low-ego environments where people genuinely want to help each other succeed
- **Work-life balance**: Strong preference for companies that prioritize this
- **Remote-friendly**: Good communication practices are essential

### Non-Negotiables to Map
- [ ] What environments help me focus?
- [ ] Where do I feel most creative?
- [ ] What kind of team dynamics energize me?

### Research Strategy
1. **Look at company values and culture** - not just job duties
2. **Check employee reviews** on Glassdoor for real insights
3. **Network with intention** - reach out to people at interesting companies
4. **Ask about day-to-day experience** during interviews

### Questions to Ask in Interviews
- How does the team handle disagreements?
- What's the work-life balance like in practice?
- How do you support professional growth?
- What's the communication style like?

`)
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const accentBg = isDark ? 'bg-primary' : 'bg-purple-600'
  const accentBgHover = isDark ? 'hover:bg-primary/90' : 'hover:bg-purple-700'

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    hasUnsavedContent: () => !!content.trim(),
    clearContent: () => setContent(''),
    getContent: () => content || '',
  }), [content]);

  // Handle Command+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && (e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpenCommandPalette?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onOpenCommandPalette])

  if (!isOpen) return null

  return (
    <div 
      className="fixed top-0 right-0 h-full bg-background border-l border-border z-40 flex flex-col shadow-lg"
      style={{ ...style, width: `${width}px` }}
    >
      {/* Resize Handle */}
      <div className="absolute left-0 top-0 w-2 h-full cursor-col-resize z-50 hover:bg-purple-600/10 transition-colors group flex items-center justify-center">
        <div className="w-0.5 h-8 bg-border group-hover:bg-purple-600/50 transition-colors rounded-full" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground">
            Smart Notes
          </h3>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenCommandPalette}
            className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Open AI Assistant (⌘K)"
          >
            <Plus className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setContent('')}
            className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground rounded-md transition-colors hover:bg-muted"
            title="Clear content"
          >
            Clear
          </button>
          
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded transition-colors"
            aria-label="Close notepad"
            title="Close notepad"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing... Your notes will appear here."
          className="w-full h-full resize-none bg-transparent border-0 outline-none text-sm leading-relaxed font-mono"
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground/80 shrink-0">
        Markdown supported • ⌘K for AI assistant • @ to link notes
      </div>
    </div>
  )
})

export function AgentsShowcase() {
  const [notepadOpen, setNotepadOpen] = useState(true) // Open by default
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [notepadWidth, setNotepadWidth] = useState(400)
  const [inputValue, setInputValue] = useState('')
  const notepadRef = useRef<{ hasUnsavedContent: () => boolean; clearContent: () => void; getContent: () => string }>(null)
  const { theme } = useTheme()

  const getMainContentStyle = () => ({
    marginRight: notepadOpen ? `${notepadWidth}px` : '0px',
    transition: 'margin-right 0.3s ease-in-out'
  })

  const getNotepadStyle = () => ({
    transform: notepadOpen ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.3s ease-in-out'
  })

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
  }

  return (
    <section className="py-40 bg-gradient-to-b from-white via-blue-50/20 to-white dark:from-slate-900 dark:via-blue-950/10 dark:to-slate-900 relative overflow-hidden">
      {/* Subtle background animation */}
      <div className="absolute top-0 left-1/2 w-96 h-96 bg-gradient-to-br from-blue-100/40 to-cyan-100/30 dark:from-blue-900/15 dark:to-cyan-900/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-gradient-to-br from-indigo-100/30 to-purple-100/20 dark:from-indigo-900/12 dark:to-purple-900/8 rounded-full blur-3xl animate-float-delayed" />
      <div className="absolute top-1/3 right-0 w-64 h-64 bg-gradient-to-br from-emerald-100/25 to-teal-100/15 dark:from-emerald-900/10 dark:to-teal-900/6 rounded-full blur-3xl animate-float-slow" />
      
      <div className="max-w-7xl mx-auto px-8 sm:px-12 relative z-10">
        <div className="text-center mb-32">
          <h2 className="text-4xl sm:text-5xl font-light text-slate-900 dark:text-slate-100 leading-tight tracking-wide mb-8 animate-fade-in-up">
            Effortlessly intuitive
          </h2>
          <p className="text-2xl sm:text-3xl text-slate-600 dark:text-slate-400 font-light max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            Simply describe what you need in natural language. 
            Get precisely crafted responses that build on your previous conversations and preferences.
          </p>
        </div>

        {/* Chat Container Preview */}
        <div className="max-w-6xl mx-auto relative animate-fade-in-up" style={{animationDelay: '0.4s'}}>
          <div className="bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">HeyContext Chat</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Job search & career planning</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNotepadOpen(!notepadOpen)}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Toggle Smart Notes"
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Content */}
            <div className="relative" style={getMainContentStyle()}>
              <div className="p-6">
                <div className="max-w-4xl mx-auto relative">
                  <div className="space-y-6">
                    {conversation.map((message, index) => (
                      <div key={message.id} className="relative animate-fade-in-up" style={{animationDelay: `${0.6 + index * 0.2}s`}}>
                        {message.sender === 'assistant' && message.sources && message.sources.length > 0 && (
                          <SmartSearchSources sources={message.sources} />
                        )}
                        
                        <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                            <div className={`inline-block px-6 py-4 rounded-2xl ${
                              message.sender === 'user' 
                                ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900' 
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}>
                              <div className="text-lg leading-relaxed prose prose-sm max-w-none">
                                <div dangerouslySetInnerHTML={{ 
                                  __html: message.content
                                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
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

                        {/* Suggestions */}
                        <SuggestionChips suggestions={message.suggestions} onSuggestionClick={handleSuggestionClick} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="border-t border-slate-200 dark:border-slate-700 bg-background p-4">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 relative">
                      <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Message HeyContext..."
                        className="w-full px-4 py-3 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        rows={1}
                        style={{ height: '48px', lineHeight: '1.2' }}
                      />
                    </div>
                    <button className="flex-shrink-0 h-12 w-12 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center justify-center" aria-label="Send message">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notepad */}
          <MarkdownNotepad
            ref={notepadRef}
            isOpen={notepadOpen}
            onClose={() => setNotepadOpen(false)}
            width={notepadWidth}
            style={getNotepadStyle()}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          />
        </div>

        {/* Command Palette */}
        <InlineCommandPalette 
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
        />

        <div className="mt-32 text-center animate-fade-in-up" style={{animationDelay: '2s'}}>
          <div className="inline-block bg-slate-100/90 dark:bg-slate-800/80 backdrop-blur-sm rounded-full px-10 py-6 hover:bg-slate-200/90 dark:hover:bg-slate-700/80 transition-all duration-500 hover:scale-105 cursor-default">
            <p className="text-slate-600 dark:text-slate-400 font-light text-lg hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-500">
              Beautifully simple, deeply personal, completely private
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-25px) rotate(1deg); }
          66% { transform: translateY(15px) rotate(-1deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(20px) rotate(-1deg); }
          66% { transform: translateY(-15px) rotate(1deg); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(0.5deg); }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
          opacity: 0;
        }
        
        .animate-float {
          animation: float 10s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 12s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 15s ease-in-out infinite;
        }
      `}</style>
    </section>
  )
}