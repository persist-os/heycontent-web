'use client'

import React from 'react'
import { ChatScreenProps } from './chat/types'
import ChatContainer from './chat/ChatContainer'

const ChatScreen = ({ chatId }: ChatScreenProps) => {
  return <ChatContainer chatId={chatId} />
}

export default ChatScreen
