'use client'

import React from 'react'
import { ChatScreenProps } from './chat/types'
import ChatContainer from './chat/ChatContainer'

const ChatScreen: React.FC<ChatScreenProps> = ({ chatId, contentContext, askQuery, welcome }) => {
  return <ChatContainer chatId={chatId} contentContext={contentContext} askQuery={askQuery} welcome={welcome} />
}

export default ChatScreen
