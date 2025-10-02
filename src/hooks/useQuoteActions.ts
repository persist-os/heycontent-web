import { useCallback, useRef, useEffect } from 'react'

export interface UseQuoteActionsOptions {
  messageId: string
  messageContent: string
  selectedText: string
  notepadOpen?: boolean
  onQuoteToNotepad?: (text: string) => void
  onInputPopulate?: (text: string) => void
  clearSelection: () => void
  announceToScreenReader?: (message: string) => void
}

export interface UseQuoteActionsReturn {
  handleQuoteText: () => void
}

/**
 * Custom hook for handling quote text actions
 * Manages quote formatting, destination routing, and cleanup
 */
export function useQuoteActions(options: UseQuoteActionsOptions): UseQuoteActionsReturn {
  const {
    messageId,
    messageContent,
    selectedText,
    notepadOpen,
    onQuoteToNotepad,
    onInputPopulate,
    clearSelection,
    announceToScreenReader
  } = options

  // Stable refs for callback props to prevent unnecessary re-renders
  const onQuoteToNotepadRef = useRef(onQuoteToNotepad)
  const onInputPopulateRef = useRef(onInputPopulate)
  const clearSelectionRef = useRef(clearSelection)
  const announceToScreenReaderRef = useRef(announceToScreenReader)

  // Update refs when props change
  useEffect(() => {
    onQuoteToNotepadRef.current = onQuoteToNotepad
  }, [onQuoteToNotepad])

  useEffect(() => {
    onInputPopulateRef.current = onInputPopulate
  }, [onInputPopulate])

  useEffect(() => {
    clearSelectionRef.current = clearSelection
  }, [clearSelection])

  useEffect(() => {
    announceToScreenReaderRef.current = announceToScreenReader
  }, [announceToScreenReader])

  const handleQuoteText = useCallback(() => {
    if (!selectedText) return;

    // Get the rendered message text (as plain text, for comparison)
    const messageElement = document.getElementById(`message-${messageId}`);
    let renderedText = '';
    if (messageElement) {
      renderedText = messageElement.innerText.trim();
    }
    
    const selected = selectedText.trim();
    
    // If the selection matches the entire message, use the markdown source
    let quoteToInsert: string;
    if (renderedText && selected === renderedText) {
      quoteToInsert = messageContent;
    } else {
      // Otherwise, insert as markdown blockquote (preserve line breaks)
      quoteToInsert = selected
        .split('\n')
        .map(line => line ? `> ${line}` : '>')
        .join('\n');
    }
    
    // Route the quote to the appropriate destination using stable refs
    let destination = 'input field'
    if (notepadOpen && onQuoteToNotepadRef.current) {
      onQuoteToNotepadRef.current(quoteToInsert);
      destination = 'notepad'
    } else if (onInputPopulateRef.current) {
      onInputPopulateRef.current(quoteToInsert);
    }
    
    // Announce the quote action for accessibility
    if (announceToScreenReaderRef.current) {
      const wordCount = selectedText.split(/\s+/).length
      announceToScreenReaderRef.current(
        `Quoted ${wordCount} word${wordCount !== 1 ? 's' : ''} to ${destination}. Selection cleared.`
      )
    }
    
    // Clear the selection after using it
    clearSelectionRef.current();
  }, [
    messageId,
    messageContent,
    selectedText,
    notepadOpen
  ]);

  return {
    handleQuoteText
  };
}
