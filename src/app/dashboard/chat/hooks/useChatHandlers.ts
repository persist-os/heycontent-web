import { useCallback, useState } from 'react'

export function useChatHandlers(handleSendMessage: (msg: string, linkRegistry?: Array<{index: number, contentId: string}>) => void, handleClearReference: () => void, messages: any[]) {
  const [quotedForNotepad, setQuotedForNotepad] = useState<string>('')

  const handleClearQuoted = useCallback(() => {
    setQuotedForNotepad('')
  }, [])

  const handleQuoteToNotepad = useCallback((text: string) => {
    setQuotedForNotepad(text)
  }, [])

  const handleNotepadSendToChat = useCallback((content: string) => {
    if (content.trim()) {
      handleSendMessage(content)
    }
  }, [handleSendMessage])

  const createReferenceClickHandler = useCallback((notepadOpen: boolean, handleReferenceClick: (id: string) => void) => 
    (messageId: string) => {
      if (notepadOpen) {
        const message = messages.find(m => m.id === messageId)
        if (message) {
          setQuotedForNotepad(message.content)
          handleClearReference()
        }
      } else {
        handleReferenceClick(messageId)
      }
    }, [messages, handleClearReference, setQuotedForNotepad])

  return {
    quotedForNotepad,
    setQuotedForNotepad,
    handleClearQuoted,
    handleQuoteToNotepad,
    handleNotepadSendToChat,
    createReferenceClickHandler,
  }
} 