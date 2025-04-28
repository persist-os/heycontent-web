'use client'

import { MessageBubble } from './message-bubble'
import { useState } from 'react'
import type { Message } from '@/app/types'
import type { InteractiveOption } from '@/app/lib/chat/interactive-response'

// Mock message that reflects our actual codebase
const mockMessage: Message = {
  id: 1,
  content: "Here's an analysis of your recent content performance. Your engagement rates have increased by 15% compared to last month, and we're seeing strong growth in your audience demographics.",
  role: 'assistant',
  timestamp: new Date().toISOString(),
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
  interactiveResponse: {
    options: [
      {
        text: "Show detailed metrics",
        type: "detail",
        action: "show_metrics"
      },
      {
        text: "View content insights",
        type: "detail",
        action: "view_content_insights"
      },
      {
        text: "View audience insights",
        type: "detail",
        action: "view_audience_insights"
      },
      {
        text: "Personalize recommendations",
        type: "action",
        action: "personalize"
      },
      {
        text: "Tell me more",
        type: "suggestion"
      }
    ],
    followUp: {
      question: "Which metrics would you like to explore?",
      choices: [
        "Audience growth",
        "Engagement rates",
        "Content performance",
        "Platform metrics"
      ]
    },
    contextualSuggestions: [
      "Compare with previous period",
      "Show performance breakdown",
      "View top-performing content"
    ]
  },
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
    console.log('Option clicked:', option)
  }

  const handleFollowUpClick = (choice: string) => {
    console.log('Follow-up choice clicked:', choice)
  }

  const handleReferenceClick = (messageId: number) => {
    console.log('Reference clicked for message:', messageId)
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