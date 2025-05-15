'use client'

import React from 'react'
import { ChatScreenProps } from './chat/types'
import ChatContainer from './chat/ChatContainer'

const ChatScreen: React.FC<ChatScreenProps> = ({ chatId }) => {
  return <ChatContainer chatId={chatId} />
}

export default ChatScreen
