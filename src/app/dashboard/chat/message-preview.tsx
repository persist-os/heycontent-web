'use client'

import { MessageBubble } from './message-bubble'
import { useState } from 'react'
import type { Message } from '@/app/types'
import type { InteractiveOption } from './interactive-response'

// Mock message that reflects our actual codebase
const mockMessage: Message = {
  id: '1',
  content: "Here's an analysis of your recent content performance. Your engagement rates have increased by 15% compared to last month, and we're seeing strong growth in your audience demographics.",
  role: 'assistant',
  timestamp: new Date().toISOString(),
  chat_response: "Here's an analysis of your recent content performance. Your engagement rates have increased by 15% compared to last month, and we're seeing strong growth in your audience demographics.",
  relatedInsights: [
    {
      type: 'Performance',
      summary: 'Engagement rates increased by 15%'
    },
    {
      type: 'Audience',
      summary: 'New demographic segment showing high engagement'
    }
  ],
  followUpQuestions: [
    {
      question: "Which metrics would you like to explore?",
      choices: [
        "Audience growth",
        "Engagement rates",
        "Content performance",
        "Platform metrics"
      ]
    },
    {
      question: "Would you like to explore any specific aspect further?",
      choices: [
        "Metrics",
        "Content",
        "Audience"
      ]
    }
  ],
  metadata: {
    suggestions: [
      {
        type: 'explore',
        description: 'Explore content strategy optimization',
        confidence: 0.85
      },
      {
        type: 'action',
        description: 'Schedule content review meeting',
        confidence: 0.75
      }
    ]
  }
}

export function MessagePreview() {
  const [messages, setMessages] = useState<Message[]>([mockMessage])

  const handleOptionClick = (option: InteractiveOption) => {
    // Placeholder for the removed console.log
  }

  const handleFollowUpClick = (choice: string) => {
    // Placeholder for the removed console.log
  }

  const handleReferenceClick = (messageId: string) => {
    // Placeholder for the removed console.log
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isLastMessage={true}
            onOptionClick={handleOptionClick}
            onFollowUpClick={handleFollowUpClick}
            onReferenceClick={handleReferenceClick}
          />
        ))}
      </div>
    </div>
  )
} 