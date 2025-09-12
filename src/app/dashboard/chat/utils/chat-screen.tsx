'use client'

import React from 'react'
import { ChatScreenProps } from '../types'
import ChatContainer from '../ChatContainer'

const ChatScreen: React.FC<ChatScreenProps> = ({ chatId, contentContext, askQuery, noteId }) => {
  return <ChatContainer chatId={chatId} contentContext={contentContext} askQuery={askQuery} noteId={noteId} />
}

export default ChatScreen
