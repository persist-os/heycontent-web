/**
 * Dialogue Component
 *
 * Conversation interface.
 * Handles message display, input, quoting, and AI interactions.
 *
 * Features:
 * - Message list with role-based rendering
 * - Message input with send functionality
 * - Quote to reflection integration
 * - Loading states and error handling
 * - Mobile-optimized interactions
 *
 * Dependencies: useDialogue, useReflection hooks
 */

import React, { useRef, useEffect } from 'react'
import { useDialogue, useReflection } from '../hooks/useLabCore'

// =============================================================================
// INTERFACES
// =============================================================================

interface DialogueComponentProps {
    className?: string
    showHeader?: boolean
    enableQuoting?: boolean
    placeholder?: string
    autoFocus?: boolean
}

interface MessageItemProps {
    message: any // TODO: Define proper Message interface based on your message structure
    onQuote?: (messageId: string) => void
    showQuoteButton?: boolean
}

interface DialogueInputProps {
    onSend: (content: string) => void
    disabled?: boolean
    placeholder?: string
    autoFocus?: boolean
}

interface DialogueHeaderProps {
    messageCount: number
    isLoading: boolean
    onNewConversation?: () => void
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DialogueComponent({
                                      className = '',
                                      showHeader = true,
                                      enableQuoting = true,
                                      placeholder = "Ask a question or share your thoughts...",
                                      autoFocus = false
                                  }: DialogueComponentProps) {
    const { state: dialogueState, actions: dialogueActions } = useDialogue()
    const reflection = useReflection()

    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [dialogueState.messages])

    const handleQuoteMessage = (messageId: string) => {
        if (!enableQuoting) return

        // TODO: Verify this matches your current quote functionality
        const message = dialogueState.messages.find(m => m.id === messageId)
        if (message) {
            // Insert quote into reflection and open if closed
            reflection.actions.insertQuote(message.content, `Message ${messageId}`)
            if (!reflection.state.isOpen) {
                reflection.actions.openNotepad()
            }
        }
    }

    const handleSendMessage = async (content: string) => {
        try {
            await dialogueActions.sendMessage(content)
        } catch (error) {
            // TODO: Add your error handling logic
            console.error('Failed to send message:', error)
        }
    }

    return (
        <div className={`dialogue-component ${className}`}>
            {showHeader && (
                <DialogueHeader
                    messageCount={dialogueState.messages.length}
                    isLoading={dialogueState.isLoading}
                    onNewConversation={dialogueActions.startNewConversation}
                />
            )}

            <div className="dialogue-messages">
                <MessageList
                    messages={dialogueState.messages}
                    onQuote={enableQuoting ? handleQuoteMessage : undefined}
                    isLoading={dialogueState.isLoading}
                />
                <div ref={messagesEndRef} />
            </div>

            <DialogueInput
                onSend={handleSendMessage}
                disabled={dialogueState.isLoading}
                placeholder={placeholder}
                autoFocus={autoFocus}
            />

            {dialogueState.error && (
                <div className="dialogue-error">
                    {/* TODO: Style this error display to match your design */}
                    Error: {dialogueState.error}
                </div>
            )}
        </div>
    )
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function DialogueHeader({
                            messageCount,
                            isLoading,
                            onNewConversation
                        }: DialogueHeaderProps) {
    return (
        <div className="dialogue-header">
            {/* TODO: Copy your existing chat header structure and styling */}
            <div className="dialogue-header-info">
                <span>{messageCount} messages</span>
                {isLoading && <span>AI is thinking...</span>}
            </div>

            <div className="dialogue-header-actions">
                <button
                    onClick={onNewConversation}
                    className="new-conversation-btn"
                    disabled={isLoading}
                >
                    {/* TODO: Add your icon or text for new conversation */}
                    New Conversation
                </button>
            </div>
        </div>
    )
}

function MessageList({
                         messages,
                         onQuote,
                         isLoading
                     }: {
    messages: any[]
    onQuote?: (messageId: string) => void
    isLoading: boolean
}) {
    return (
        <div className="message-list">
            {messages.map((message) => (
                <MessageItem
                    key={message.id}
                    message={message}
                    onQuote={onQuote}
                    showQuoteButton={!!onQuote}
                />
            ))}

            {isLoading && (
                <div className="loading-message">
                    {/* TODO: Copy your existing loading indicator */}
                    <div className="loading-indicator">
                        AI is typing...
                    </div>
                </div>
            )}
        </div>
    )
}

function MessageItem({
                         message,
                         onQuote,
                         showQuoteButton = false
                     }: MessageItemProps) {
    const handleQuote = () => {
        if (onQuote) {
            onQuote(message.id)
        }
    }

    return (
        <div className={`message-item message-${message.role}`}>
            {/* TODO: Copy your existing message structure and styling */}
            <div className="message-content">
                {/* TODO: Add your message content rendering logic */}
                {message.content}
            </div>

            <div className="message-actions">
                {showQuoteButton && (
                    <button
                        onClick={handleQuote}
                        className="quote-button"
                        title="Quote to notepad"
                    >
                        {/* TODO: Add your quote icon */}
                        Quote
                    </button>
                )}

                {/* TODO: Add any other message actions you have */}
            </div>

            <div className="message-meta">
                {/* TODO: Add timestamp, role indicator, etc. */}
                <span className="message-time">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
            </div>
        </div>
    )
}

function DialogueInput({
                           onSend,
                           disabled = false,
                           placeholder = "Type a message...",
                           autoFocus = false
                       }: DialogueInputProps) {
    const [inputValue, setInputValue] = React.useState('')
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (inputValue.trim() && !disabled) {
            onSend(inputValue.trim())
            setInputValue('')
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        // TODO: Verify this matches your current keyboard handling
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="dialogue-input-form">
            {/* TODO: Copy your existing input structure and styling */}
            <div className="input-container">
        <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            className="message-input"
            rows={1}
            // TODO: Add any other input props you need
        />

                <button
                    type="submit"
                    disabled={disabled || !inputValue.trim()}
                    className="send-button"
                >
                    {/* TODO: Add your send icon */}
                    Send
                </button>
            </div>
        </form>
    )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default DialogueComponent
export type { DialogueComponentProps, MessageItemProps, DialogueInputProps }