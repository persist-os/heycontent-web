'use client'

import React from 'react'
import { ChatScreenProps } from './chat/types'
import ChatContainer from './chat/ChatContainer'

const ChatScreen: React.FC<ChatScreenProps> = ({ chatId, contentContext, askQuery }) => {
  return <ChatContainer chatId={chatId} contentContext={contentContext} askQuery={askQuery} />
}

export default ChatScreen
