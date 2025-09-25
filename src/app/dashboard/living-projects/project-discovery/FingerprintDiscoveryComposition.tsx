'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Id } from '@/convex/_generated/dataModel'
import { Message } from '@/app/types/conversation'
import { ChatInput } from '@/app/dashboard/thinking_lab/components/dialogue/input/chat-input'
import ChatMessagesList from '@/app/dashboard/thinking_lab/components/dialogue/components/ChatMessagesList'
import { sendDiscoveryMessage } from './services/discoveryService'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import AmbientFingerprintCanvas from './components/AmbientFingerprintCanvas'

interface FingerprintDiscoveryCompositionProps {
  projectId?: Id<"projects">
}

const FingerprintDiscoveryComposition: React.FC<FingerprintDiscoveryCompositionProps> = ({
  projectId
}) => {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const userId = getCurrentUserId()

  const handleSendMessage = useCallback(async (message: string) => {
    if (!userId || !message.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      role: 'user',
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setInputValue('')

    try {
      const response = await sendDiscoveryMessage({
        query: message.trim(),
        projectId: projectId,
        isFirstMessage: messages.length === 0,
        sessionId: sessionStorage.getItem('discovery_session_id') || undefined
      })

      if (response.session_id) {
        sessionStorage.setItem('discovery_session_id', response.session_id)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        role: 'assistant',
        timestamp: Date.now(),
        metadata: {
          suggestions: response.suggestions || []
        }
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Discovery error:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble connecting right now. Could you try again?",
        role: 'assistant',
        timestamp: Date.now(),
        metadata: {
          suggestions: ["Let's start over", "Tell me about your project"]
        }
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [userId, messages.length, projectId])

  const handleSuggestionClick = useCallback((suggestion: any, onSendMessage: (msg: string) => void) => {
    const text = typeof suggestion === 'string' ? suggestion : suggestion?.text || suggestion
    if (text) onSendMessage(text)
  }, [])

  return (
    <div className="h-full flex bg-background">
      {/* Main Discovery Panel */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-hidden">
          <ChatMessagesList
            messages={messages}
            referencedMessage={null}
            handleMessageReference={() => {}}
            handleReferenceClick={() => {}}
            handleOptionClick={() => {}}
            handleFollowUpClick={handleSendMessage}
            userId={userId}
            handleSuggestionClick={handleSuggestionClick}
            handleSendMessage={handleSendMessage}
            onInputPopulate={(text: string) => setInputValue(text)}
            notepadOpen={false}
            onQuoteToNotepad={() => {}}
            onContentClick={() => {}}
          />
        </div>

        <div className="border-t border-border/20 p-4">
          <ChatInput
            onSend={handleSendMessage}
            isLoading={isLoading}
            inputRef={inputRef}
            autoFocus={true}
            inputValue={inputValue}
            onInputChange={setInputValue}
            notepadOpen={false}
          />
        </div>
      </div>

      {/* Ambient Fingerprint Panel */}
      <div className="w-80 border-l border-border/20">
        <AmbientFingerprintCanvas 
          projectId={projectId}
          messageCount={messages.length}
          isActive={true}
          onAllStarsDiscovered={() => {
            console.log('🌟 Project fingerprint discovery complete!')
            // Redirect to the ProjectViewScreen with constellation view
            if (projectId) {
              router.push(`/dashboard/living-projects/${projectId}`)
            }
          }}
        />
      </div>
    </div>
  )
}

export default FingerprintDiscoveryComposition
